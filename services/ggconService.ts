import { supabase } from './supabaseClient';
import { emitError } from './errorBus';
import { DbService } from './dbService';
import { GpcService } from './gpcService';
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

// Reconhece a etapa "Retorno GPC" por palavra-chave (mesmo estilo de correspondência
// usado em etapaTone, pages/GgconProcessos.tsx) em vez de exigir o texto exato — a
// etapa continua sendo um campo de texto livre (ver ETAPAS, só uma sugestão de
// datalist), então o usuário pode digitar variações ("Retorno do GPC" etc.).
// Status em que a análise já foi concluída (por qualquer caminho) e portanto pode voltar
// pra reanálise num Retorno GPC. Em andamento (AGUARDANDO_*/EM_ANALISE) ou já em
// RETORNO_GPC, o retorno é ignorado — ver sincronizarRetornoGpc.
export const STATUS_REABRIVEIS_RETORNO_GPC = ['ENCAMINHADO_GPC', 'CONCLUIDA', 'CONFERENCIA_PENDENCIA', 'AGUARDANDO_ASSINATURA'];

export function isEtapaRetornoGpc(etapa: string | null | undefined): boolean {
  const e = (etapa ?? '').toLowerCase();
  return e.includes('retorno') && e.includes('gpc');
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
  dataInicio?: string;
  dataFim?: string;
  sortBy?: GgconSortField;
  sortOrder?: 'asc' | 'desc';
}

export const GgconService = {
  getProcessos: async (f: GgconProcessosFiltro = {}): Promise<{ data: GgconProcesso[]; count: number }> => {
    const {
      search = '', page = 1, pageSize = 25, etapa = '', tecnico = '', coordenadoria = '',
      dataInicio = '', dataFim = '', sortBy = 'codigo', sortOrder = 'desc',
    } = f;
    let query = supabase
      // A listagem mostra só a movimentação mais recente de cada processo_sei (evita
      // repetir o mesmo processo uma vez por movimentação) — ver parte_42_ggcon_view_atual.sql.
      // O histórico completo continua acessível via getHistoricoPorProcesso, que consulta
      // a tabela cgof_ggcon_processos diretamente.
      .from('cgof_ggcon_processos_atual')
      .select('*', { count: 'exact' })
      // Urgentes sempre no topo, independente da ordenação escolhida pelo usuário.
      .order('urgente', { ascending: false })
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
    if (dataInicio.trim()) query = query.gte('data_movimentacao', dataInicio);
    if (dataFim.trim()) query = query.lte('data_movimentacao', dataFim);

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

  // `usuarioResponsavel` só é usado para registrar quem fez a movimentação, caso ela
  // seja reconhecida como um "Retorno GPC" (ver sincronizarRetornoGpc abaixo) — não é
  // persistido em cgof_ggcon_processos.
  saveProcesso: async (p: Partial<GgconProcesso>, usuarioResponsavel?: string | null): Promise<GgconProcesso> => {
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
      urgente: p.urgente ?? false,
      analista_gpc: p.analista_gpc ?? null,
      // Exercícios só fazem sentido em Prestação de Contas (viram os checklists da
      // Análise GGCON) — nos outros tipos a coluna nem é enviada.
      ...(p.tipo === 'Prestação de Contas' ? { exercicios: p.exercicios?.length ? p.exercicios : null } : {}),
    };
    let saved: GgconProcesso;
    if (p.codigo) {
      const { data, error } = await supabase.from('cgof_ggcon_processos').update(payload).eq('codigo', p.codigo).select().single();
      if (error) throw new Error(error.message);
      saved = data as GgconProcesso;
    } else {
      const { data, error } = await supabase.from('cgof_ggcon_processos').insert(payload).select().single();
      if (error) throw new Error(error.message);
      saved = data as GgconProcesso;
    }
    if (saved.processo_sei && isEtapaRetornoGpc(saved.etapa)) {
      // A movimentação já foi gravada — uma falha na Análise vira aviso, não exceção
      // (senão o formulário continuaria aberto e salvar de novo duplicaria a movimentação).
      let conferente: string | null = null;
      try { conferente = await GgconService.sincronizarRetornoGpc(saved.processo_sei, usuarioResponsavel ?? null); }
      catch (ex: any) { emitError(ex.message); }
      // A reanálise continua com o mesmo conferente — se a movimentação foi salva sem
      // técnico, grava o conferente nela também (a tela já sugere o nome, mas isso
      // cobre quem apagou o campo ou salvou antes da sugestão carregar).
      if (conferente && !saved.tecnico_responsavel) {
        const { error } = await supabase.from('cgof_ggcon_processos').update({ tecnico_responsavel: conferente }).eq('codigo', saved.codigo);
        if (error) console.error(error);
        else saved = { ...saved, tecnico_responsavel: conferente };
      }
    }
    return saved;
  },

  deleteProcesso: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_processos').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // Espelha o analista atual da Análise GGCON (pages/GgconAnalise.tsx) no Técnico
  // Responsável de Processos GGCON para o mesmo processo_sei — chamado por
  // GgconAnaliseService ao liberar/reatribuir o analista. cgof_ggcon_processos guarda
  // uma linha por movimentação (histórico), então atualiza só a mais recente (maior
  // codigo), a mesma que a view cgof_ggcon_processos_atual expõe como "situação atual".
  // Se o processo ainda não tem nenhuma movimentação cadastrada em Processos GGCON,
  // não faz nada silenciosamente (nada para sincronizar ainda).
  setTecnicoNaMovimentacaoAtual: async (processoSei: string, tecnico: string): Promise<void> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_processos')
      .select('codigo')
      .eq('processo_sei', processoSei)
      .order('codigo', { ascending: false })
      .limit(1);
    if (error) { console.error(error); return; }
    const codigo = data?.[0]?.codigo;
    if (codigo == null) return;
    const { error: updError } = await supabase
      .from('cgof_ggcon_processos')
      .update({ tecnico_responsavel: tecnico })
      .eq('codigo', codigo);
    if (updError) console.error(updError);
  },

  // Mesmo padrão de setTecnicoNaMovimentacaoAtual, para o campo Analista GPC —
  // chamado por GgconAnaliseService.atualizarAnalistaGpc ao editar esse campo na tela
  // de Análise GGCON, para refletir na movimentação atual de Processos GGCON.
  setAnalistaGpcNaMovimentacaoAtual: async (processoSei: string, analistaGpc: string | null): Promise<void> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_processos')
      .select('codigo')
      .eq('processo_sei', processoSei)
      .order('codigo', { ascending: false })
      .limit(1);
    if (error) { console.error(error); return; }
    const codigo = data?.[0]?.codigo;
    if (codigo == null) return;
    const { error: updError } = await supabase
      .from('cgof_ggcon_processos')
      .update({ analista_gpc: analistaGpc })
      .eq('codigo', codigo);
    if (updError) console.error(updError);
  },

  // Mesmo padrão de setTecnicoNaMovimentacaoAtual, para a etapa — chamado por
  // GgconAnaliseService.encaminharAoGpc para que o status "Encaminhado ao GPC" da
  // Análise GGCON apareça também em Processos GGCON (etapa da movimentação atual).
  setEtapaNaMovimentacaoAtual: async (processoSei: string, etapa: string): Promise<void> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_processos')
      .select('codigo')
      .eq('processo_sei', processoSei)
      .order('codigo', { ascending: false })
      .limit(1);
    if (error) { console.error(error); return; }
    const codigo = data?.[0]?.codigo;
    if (codigo == null) return;
    const { error: updError } = await supabase
      .from('cgof_ggcon_processos')
      .update({ etapa, data_movimentacao: new Date().toISOString().slice(0, 10), ...deriveSituacaoFromEtapa(etapa) })
      .eq('codigo', codigo);
    if (updError) console.error(updError);
  },

  // Reconhece que uma movimentação com etapa "Retorno GPC" foi registrada em Processos
  // GGCON (ver isEtapaRetornoGpc, chamado a partir de saveProcesso) e propaga pra
  // Análise GGCON correspondente, SEM criar uma análise nova (o processo continua sendo
  // uma única linha em cgof_ggcon_analises):
  //   1. guarda uma cópia fixa da análise que estava valendo (cabeçalho, datas,
  //      conferente, pendência, exercícios e checklist) em cgof_ggcon_analise_rodadas
  //      como "Nª análise" (parte_84) — se essa cópia falhar, NÃO reabre, pra nunca
  //      perder a versão anterior;
  //   2. volta o status pra RETORNO_GPC mantendo o mesmo conferente (analista_atual) e
  //      as respostas do checklist (o técnico só corrige o que o GPC apontou), zerando
  //      datas de conclusão/assinatura/encaminhamento e a pendência da rodada anterior
  //      (que ficam na cópia) pra reabrir os botões de Conferência.
  // Aceita qualquer análise já concluída (STATUS_REABRIVEIS_RETORNO_GPC). Em análise
  // ainda em andamento (ou já em RETORNO_GPC) é no-op — idempotente, não reage de novo
  // a cada edição da mesma movimentação. Devolve o conferente da análise (ou null se
  // não existe análise pra esse processo).
  sincronizarRetornoGpc: async (processoSei: string, usuarioResponsavel: string | null): Promise<string | null> => {
    const { data: analises, error } = await supabase
      .from('cgof_ggcon_analises')
      .select('*')
      .eq('processo_sei', processoSei)
      .order('id', { ascending: false })
      .limit(1);
    if (error) { console.error(error); return null; }
    const analise = analises?.[0] as any;
    if (!analise) return null;
    if (!STATUS_REABRIVEIS_RETORNO_GPC.includes(analise.status)) return analise.analista_atual ?? null;

    const [exRes, itensRes, rodadasRes] = await Promise.all([
      supabase.from('cgof_ggcon_analise_exercicios').select('*').eq('analise_id', analise.id).order('exercicio', { ascending: true }),
      // Uma análise tem no máximo ~47 itens por exercício — bem abaixo do limite de
      // 1000 linhas do PostgREST mesmo com vários exercícios.
      supabase.from('cgof_ggcon_analise_itens').select('*').eq('analise_id', analise.id).order('item_numero', { ascending: true }),
      supabase.from('cgof_ggcon_analise_rodadas').select('numero').eq('analise_id', analise.id).order('numero', { ascending: false }).limit(1),
    ]);
    const leituraError = exRes.error ?? itensRes.error ?? rodadasRes.error;
    if (leituraError) {
      console.error(leituraError);
      throw new Error(`Não foi possível salvar a análise anterior antes do Retorno GPC (${leituraError.message}). A movimentação foi salva, mas a análise não foi reaberta.`);
    }
    const numero = ((rodadasRes.data?.[0] as any)?.numero ?? 0) + 1;
    const { error: rodadaError } = await supabase.from('cgof_ggcon_analise_rodadas').insert({
      analise_id: analise.id,
      numero,
      conferente: analise.analista_atual ?? null,
      status_anterior: analise.status,
      data_analise: analise.data_analise ?? null,
      data_pendencia: analise.data_pendencia ?? null,
      pendencia_descricao: analise.pendencia_descricao ?? null,
      data_encaminhamento_gpc: analise.data_encaminhamento_gpc ?? null,
      analista_gpc: analise.analista_gpc ?? null,
      snapshot: { analise, exercicios: exRes.data ?? [], itens: itensRes.data ?? [] },
      motivo: 'Retorno GPC',
      created_by: usuarioResponsavel,
    });
    if (rodadaError) {
      console.error(rodadaError);
      throw new Error(`Não foi possível salvar a análise anterior antes do Retorno GPC (${rodadaError.message}). A movimentação foi salva, mas a análise não foi reaberta.`);
    }

    const { error: updError } = await supabase.from('cgof_ggcon_analises').update({
      status: 'RETORNO_GPC',
      data_analise: null,
      data_liberacao_assinatura: null,
      data_assinatura: null,
      assinado_por: null,
      data_encaminhamento_gpc: null,
      data_encaminhamento: null,
      area_encaminhamento: null,
      data_pendencia: null,
      pendencia_descricao: null,
      updated_at: new Date().toISOString(),
    }).eq('id', analise.id);
    if (updError) { console.error(updError); throw new Error(updError.message); }
    const { error: histError } = await supabase.from('cgof_ggcon_analise_historico').insert({
      analise_id: analise.id,
      evento: 'RETORNO_GPC',
      usuario_responsavel: usuarioResponsavel,
      analista_novo: analise.analista_atual ?? null,
      observacao: `Retorno registrado em Processos GGCON — ${numero}ª análise salva; reanálise com ${analise.analista_atual ?? 'conferente não atribuído'}`,
    });
    if (histError) console.error('Falha ao registrar evento no histórico (ação principal já foi aplicada):', histError);
    return analise.analista_atual ?? null;
  },

  // Conferente (analista_atual) e exercícios da Análise GGCON do mesmo processo_sei —
  // usado pelo formulário de Processos GGCON pra sugerir o Técnico num Retorno GPC e
  // preencher os exercícios de uma Prestação de Contas que já tem análise. Supabase
  // direto (não GgconAnaliseService) pelo mesmo motivo de sincronizarRetornoGpc: evitar
  // import circular entre os dois services.
  getAnaliseResumoDoProcesso: async (processoSei: string): Promise<{ conferente: string | null; exercicios: number[] } | null> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_analises')
      .select('id, analista_atual')
      .eq('processo_sei', processoSei)
      .order('id', { ascending: false })
      .limit(1);
    if (error) { console.error(error); return null; }
    const analise = data?.[0] as { id: number; analista_atual: string | null } | undefined;
    if (!analise) return null;
    const { data: ex, error: exError } = await supabase
      .from('cgof_ggcon_analise_exercicios')
      .select('exercicio')
      .eq('analise_id', analise.id);
    if (exError) console.error(exError);
    const exercicios = ((ex ?? []) as { exercicio: number | null }[])
      .map(e => e.exercicio).filter((n): n is number => n != null).sort((a, b) => a - b);
    return { conferente: analise.analista_atual, exercicios };
  },

  // Nomes elegíveis para "Analista GPC": usuários ativos com acesso ao GPC (mesma
  // query de GpcService.getGpcUsers, já usada em GpcProcessos_v2.tsx para o técnico
  // GPC), reaproveitada aqui em vez de duplicar a lógica.
  getGpcAnalistas: async (): Promise<string[]> => {
    const users = await GpcService.getGpcUsers();
    return users.map(u => u.name).sort((a, b) => a.localeCompare(b, 'pt-BR'));
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

  // Para o FILTRO da listagem (não para o formulário de cadastro): além dos usuários
  // cadastrados, inclui quem já aparece no histórico da planilha mas ainda não tem
  // usuário no sistema (ex.: técnicos antigos/afastados) — senão o filtro não acha
  // movimentações antigas atribuídas a eles.
  getTecnicosFiltro: async (): Promise<string[]> => {
    const [registrados, historico] = await Promise.all([
      GgconService.getTecnicos(),
      fetchAllRows<{ tecnico_responsavel: string | null }>('cgof_ggcon_processos', 'tecnico_responsavel'),
    ]);
    const nomes = new Set(registrados);
    for (const row of historico) {
      const nome = row.tecnico_responsavel?.trim();
      if (nome) nomes.add(nome);
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
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
