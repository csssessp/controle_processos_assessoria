import { supabase } from './supabaseClient';
import { emitError } from './errorBus';
import { DbService } from './dbService';
import { GgconProcesso, userHasArea } from '../types';

function notifyFetchError(): void {
  emitError('Não foi possível carregar os dados. Tente novamente.');
}

// Busca todas as linhas de uma tabela em blocos de 1000, contornando o limite
// padrão do PostgREST hospedado no Supabase (mesmo helper usado em gpcService.ts).
async function fetchAllRows<T = any>(
  table: string,
  select: string,
  filter?: (q: any) => any,
): Promise<T[]> {
  const PAGE = 1000;
  let all: T[] = [];
  let from = 0;
  while (true) {
    let q = supabase.from(table).select(select);
    if (filter) q = filter(q);
    const { data, error } = await q.range(from, from + PAGE - 1);
    if (error) { console.error(error); notifyFetchError(); break; }
    all = all.concat((data ?? []) as T[]);
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// A "movimentação atual" de um processo_sei é sempre a de maior código —
// não existe flag manual, evitando o risco de esquecer de atualizá-la
// (ver comentário na migração sql_parts/parte_36_ggcon_processos.sql).
export function isRegistroAtual(row: GgconProcesso, all: GgconProcesso[]): boolean {
  const doMesmoProcesso = all.filter(r => r.processo_sei === row.processo_sei);
  const maisRecente = doMesmoProcesso.reduce((max, r) => r.codigo > max.codigo ? r : max, doMesmoProcesso[0]);
  return maisRecente?.codigo === row.codigo;
}

export function diasSemMovimentacao(row: GgconProcesso): number | null {
  if (!row.data_movimentacao) return null;
  const dt = new Date(row.data_movimentacao);
  const hoje = new Date();
  return Math.floor((hoje.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24));
}

// A "Situação" (Aguardando Assinatura / Comitê Gestor / Consultoria Jurídica) não é um
// dado independente — na planilha de origem ela é sempre recalculada a partir da Etapa
// Atual (modSEI.RecalcularTudoSEI: Q/R/S = comparação exata do texto da Etapa). Replicado
// aqui para que os 3 flags nunca fiquem inconsistentes com a etapa selecionada.
export function deriveSituacaoFromEtapa(etapa: string | null | undefined): {
  aguardando_assinatura: boolean; comite_gestor: boolean; consultoria_juridica: boolean;
} {
  return {
    aguardando_assinatura: etapa === 'Aguardando assinatura',
    comite_gestor: etapa === 'Comitê Gestor',
    consultoria_juridica: etapa === 'Consultoria Jurídica',
  };
}

// Regra do Comitê Gestor (aba COMO_ALIMENTAR): Convênios > R$ 1 milhão e Termos
// Aditivos > R$ 250 mil geram alerta; Emendas LOA (origem de recurso) não vão.
export function alertaComiteGestor(row: GgconProcesso): boolean {
  if (!row.valor_estado) return false;
  if (row.tipo === 'Convênio') return row.valor_estado > 1_000_000;
  if (row.tipo === 'Termo Aditivo') return row.valor_estado > 250_000;
  return false;
}

export type GgconSortField = 'codigo' | 'processo_sei' | 'interessado' | 'tipo' | 'etapa' | 'tecnico_responsavel' | 'coordenadoria' | 'data_movimentacao';

export interface GgconProcessosFiltro {
  search?: string;
  page?: number;
  pageSize?: number;
  etapa?: string;
  tecnico?: string;
  coordenadoria?: string;
  sortBy?: GgconSortField;
  sortOrder?: 'asc' | 'desc';
}

export const GgconService = {
  getProcessos: async (f: GgconProcessosFiltro = {}): Promise<{ data: GgconProcesso[]; count: number }> => {
    const {
      search = '', page = 1, pageSize = 25, etapa = '', tecnico = '', coordenadoria = '',
      sortBy = 'codigo', sortOrder = 'desc',
    } = f;
    let query = supabase
      .from('cgof_ggcon_processos')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search.trim()) {
      query = query.or(
        `processo_sei.ilike.%${search}%,interessado.ilike.%${search}%,assunto.ilike.%${search}%,tecnico_responsavel.ilike.%${search}%,numero_demanda.ilike.%${search}%`
      );
    }
    if (etapa.trim()) query = query.eq('etapa', etapa);
    if (tecnico.trim()) query = query.eq('tecnico_responsavel', tecnico);
    if (coordenadoria.trim()) query = query.eq('coordenadoria', coordenadoria);

    const { data, error, count } = await query;
    if (error) { console.error(error); notifyFetchError(); return { data: [], count: 0 }; }
    return { data: (data ?? []) as GgconProcesso[], count: count ?? 0 };
  },

  // Normaliza "02400004853202338" ou variações de pontuação para "024.00004853/2023-38"
  // — mesma lógica de modSEI.FormatarProcesso do VBA (corrige digitação inconsistente).
  formatarProcessoSei: (bruto: string): string => {
    const digits = (bruto ?? '').replace(/\D/g, '');
    if (digits.length === 17) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 11)}/${digits.slice(11, 15)}-${digits.slice(15, 17)}`;
    }
    return (bruto ?? '').trim();
  },

  // Avisa (sem bloquear) quando o Nº de Processo SEI já tem movimentações cadastradas —
  // nesses casos o usuário provavelmente quer "Nova Movimentação" no histórico do
  // processo, não um cadastro novo (mesmo princípio do checkDuplicateProcesso do GPC).
  checkDuplicateProcesso: async (processoSei: string): Promise<{
    existe: boolean; totalMovimentacoes: number; etapaAtual?: string | null; tecnico?: string | null;
  }> => {
    const formatado = GgconService.formatarProcessoSei(processoSei);
    if (!formatado) return { existe: false, totalMovimentacoes: 0 };
    const { data, error, count } = await supabase
      .from('cgof_ggcon_processos')
      .select('etapa, tecnico_responsavel', { count: 'exact' })
      .eq('processo_sei', formatado)
      .order('codigo', { ascending: false })
      .limit(1);
    if (error) { console.error(error); return { existe: false, totalMovimentacoes: 0 }; }
    return {
      existe: (count ?? 0) > 0,
      totalMovimentacoes: count ?? 0,
      etapaAtual: data?.[0]?.etapa,
      tecnico: data?.[0]?.tecnico_responsavel,
    };
  },

  getAllProcessos: async (): Promise<GgconProcesso[]> => {
    return fetchAllRows<GgconProcesso>(
      'cgof_ggcon_processos', '*',
      q => q.order('processo_sei', { ascending: true }).order('codigo', { ascending: true }),
    );
  },

  // Histórico de movimentações de um mesmo processo (para o painel "Outras movimentações").
  getHistoricoPorProcesso: async (processoSei: string): Promise<GgconProcesso[]> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_processos')
      .select('*')
      .eq('processo_sei', processoSei)
      .order('codigo', { ascending: true });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return (data ?? []) as GgconProcesso[];
  },

  saveProcesso: async (p: Partial<GgconProcesso>): Promise<GgconProcesso> => {
    const payload = {
      processo_sei: p.processo_sei,
      numero_demanda: p.numero_demanda ?? null,
      data_entrada: p.data_entrada ?? null,
      data_recebimento: p.data_recebimento ?? null,
      municipio: p.municipio ?? null,
      drs_unidade: p.drs_unidade ?? null,
      coordenadoria: p.coordenadoria ?? null,
      interessado: p.interessado ?? null,
      assunto: p.assunto ?? null,
      tipo: p.tipo ?? null,
      tecnico_responsavel: p.tecnico_responsavel ?? null,
      etapa: p.etapa ?? null,
      data_movimentacao: p.data_movimentacao ?? null,
      ...deriveSituacaoFromEtapa(p.etapa),
      valor_estado: p.valor_estado ?? null,
      observacoes: p.observacoes ?? null,
      area_encaminhamento: p.area_encaminhamento ?? null,
      data_envio: p.data_envio ?? null,
      proxima_providencia: p.proxima_providencia ?? null,
    };
    if (p.codigo) {
      const { data, error } = await supabase.from('cgof_ggcon_processos').update(payload).eq('codigo', p.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GgconProcesso;
    }
    const { data, error } = await supabase.from('cgof_ggcon_processos').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GgconProcesso;
  },

  deleteProcesso: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_processos').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // Exclui TODAS as movimentações de um processo (o "fluxo" inteiro), não só uma linha.
  deleteFluxo: async (processoSei: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_processos').delete().eq('processo_sei', processoSei);
    if (error) throw new Error(error.message);
  },

  // Técnicos elegíveis para "Técnico Responsável": usuários ativos cadastrados no sistema
  // com acesso à área GGCON (ou administradores, que têm acesso a todas as áreas) — em vez
  // de uma lista fixa, reflete quem de fato pode atuar no setor a qualquer momento.
  getTecnicos: async (): Promise<string[]> => {
    const users = await DbService.getUsers();
    return users
      .filter(u => u.active && userHasArea(u, 'ggcon'))
      .map(u => u.name)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },

  // Espelha os painéis "Executivo" e "Operacional" da planilha de origem.
  getDashboard: async (): Promise<{
    processosUnicos: number;
    totalMovimentacoes: number;
    conveniosAtuais: number;
    termosAditivosAtuais: number;
    comiteGestor: number;
    consultoriaJuridica: number;
    aguardandoAssinatura: number;
    parados30: number;
    parados60: number;
    semTecnico: number;
    semProximaProvidencia: number;
    porTecnico: { tecnico: string; count: number }[];
    porEtapa: { etapa: string; count: number }[];
    porCoordenadoria: { coordenadoria: string; count: number }[];
    porTipo: { tipo: string; count: number }[];
  }> => {
    const all = await fetchAllRows<GgconProcesso>('cgof_ggcon_processos', '*');

    const processoSeis = new Set(all.map(r => r.processo_sei));
    const atuaisMap = new Map<string, GgconProcesso>();
    for (const r of all) {
      const cur = atuaisMap.get(r.processo_sei);
      if (!cur || r.codigo > cur.codigo) atuaisMap.set(r.processo_sei, r);
    }
    const atuais = [...atuaisMap.values()];

    const count = (pred: (r: GgconProcesso) => boolean) => atuais.filter(pred).length;

    const porTecnicoMap: Record<string, number> = {};
    for (const r of atuais) {
      const k = r.tecnico_responsavel?.trim() || 'Sem técnico';
      porTecnicoMap[k] = (porTecnicoMap[k] ?? 0) + 1;
    }
    const porEtapaMap: Record<string, number> = {};
    for (const r of atuais) {
      const k = r.etapa?.trim() || 'Sem etapa';
      porEtapaMap[k] = (porEtapaMap[k] ?? 0) + 1;
    }
    const porCoordMap: Record<string, number> = {};
    for (const r of atuais) {
      const k = r.coordenadoria?.trim() || 'Sem coordenadoria';
      porCoordMap[k] = (porCoordMap[k] ?? 0) + 1;
    }
    const porTipoMap: Record<string, number> = {};
    for (const r of atuais) {
      const k = r.tipo?.trim() || 'Sem tipo';
      porTipoMap[k] = (porTipoMap[k] ?? 0) + 1;
    }

    const toSortedArr = (m: Record<string, number>, keyName: string) =>
      Object.entries(m).map(([k, count]) => ({ [keyName]: k, count })).sort((a: any, b: any) => b.count - a.count) as any;

    return {
      processosUnicos: processoSeis.size,
      totalMovimentacoes: all.length,
      conveniosAtuais: count(r => r.tipo === 'Convênio'),
      termosAditivosAtuais: count(r => r.tipo === 'Termo Aditivo'),
      comiteGestor: count(r => r.comite_gestor),
      consultoriaJuridica: count(r => r.consultoria_juridica),
      aguardandoAssinatura: count(r => r.aguardando_assinatura),
      parados30: count(r => (diasSemMovimentacao(r) ?? 0) > 30),
      parados60: count(r => (diasSemMovimentacao(r) ?? 0) > 60),
      semTecnico: count(r => !r.tecnico_responsavel),
      semProximaProvidencia: count(r => !r.proxima_providencia),
      porTecnico: toSortedArr(porTecnicoMap, 'tecnico'),
      porEtapa: toSortedArr(porEtapaMap, 'etapa'),
      porCoordenadoria: toSortedArr(porCoordMap, 'coordenadoria'),
      porTipo: toSortedArr(porTipoMap, 'tipo'),
    };
  },
};
