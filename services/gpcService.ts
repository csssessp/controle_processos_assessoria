import { supabase } from './supabaseClient';
import { emitError } from './errorBus';
import {
  GpcProcesso, GpcExercicio, GpcHistorico, GpcObjeto,
  GpcParcelamento, GpcParcela, GpcTa, GpcPosicao, GpcClassificacao, GpcProcessoFull, GpcRecebido, GpcProdutividade, GpcFluxoTecnico,
  GpcAtividadeAvulsa, GpcRegistroExercicio,
} from '../types';

export interface GpcReportData {
  totalProcessos: number;
  totalExercicios: number;
  totalParcelamentos: number;
  totalTas: number;
  byDrs: { drs: number; count: number }[];
  byTipo: { tipo: string; count: number }[];
  parcelamentosAtivos: number;
  valorTotalRepasse: number;
  parcelamentosDetalhes: (GpcParcelamento & { processo: string | null; convenio: string | null; entidade: string | null })[];
}

export interface ExercicioRelatorio {
  processo_id: number;
  processo: string | null;
  convenio: string | null;
  entidade: string | null;
  exercicio: string | null;
  exercicio_anterior: number | null;
  repasse: number | null;
  aplicacao: number | null;
  gastos: number | null;
  devolvido: number | null;
  // computed
  total_convenio: number; // repasse + aplicacao
  saldo: number;          // ex_ant + repasse + aplicacao - gastos - devolvido
}

// Normaliza nome de técnico/responsável (trim + colapsa espaços + Title Case) para que
// grafias divergentes vindas de cadastros antigos em texto livre (ex.: "ROSEMARIA" vs
// "Rosemaria") sejam agrupadas como a mesma pessoa em vez de virarem linhas separadas
// na produtividade.
function notifyFetchError(): void {
  emitError('Não foi possível carregar os dados. Tente novamente.');
}

type Granularidade = 'dia' | 'mes' | 'ano' | 'geral';

// Converte um timestamp para a chave de período local (evita o bug de "virar o mês/dia
// errado" que uma comparação de prefixo de string UTC causaria perto da virada). Mesma
// lógica usada por periodoKey() em pages/GpcProcessos_v2.tsx — mantém tela e serviço
// agrupando os eventos exatamente da mesma forma.
function localPeriodKey(dataEvento: string, gran: Granularidade): string {
  if (gran === 'geral') return 'geral';
  const dt = new Date(dataEvento);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  if (gran === 'dia') return `${y}-${m}-${String(dt.getDate()).padStart(2, '0')}`;
  if (gran === 'mes') return `${y}-${m}`;
  return String(y);
}

function normalizeNomeTecnico(nome: string): string {
  return nome
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

// Busca todas as linhas de uma tabela em blocos de 1000, contornando o limite
// padrão do PostgREST hospedado no Supabase (uma única página descartaria
// silenciosamente linhas além da milésima).
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

export const GpcService = {

  // ── LOOKUPS ──────────────────────────────────────────────────────────────

  getPosicoes: async (): Promise<GpcPosicao[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_posicao')
      .select('*')
      .order('codigo');
    if (error) { console.error(error); notifyFetchError(); return []; }
    return data as GpcPosicao[];
  },

  getGpcUsers: async (): Promise<{ id: string; name: string }[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('active', true)
      .or('role.in.(GPC,ADMIN),areas.cs.["gpc"]')
      .order('name');
    if (error) { console.error(error); notifyFetchError(); return []; }
    return (data ?? []) as { id: string; name: string }[];
  },

  getSignatoryUsers: async (): Promise<{ id: string; name: string }[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('active', true)
      .eq('can_sign', true)
      .order('name');
    if (error) { console.error(error); notifyFetchError(); return []; }
    return (data ?? []) as { id: string; name: string }[];
  },

  getClassificacoes: async (): Promise<GpcClassificacao[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_classificacao')
      .select('*')
      .order('indice');
    if (error) { console.error(error); notifyFetchError(); return []; }
    return data as GpcClassificacao[];
  },

  // ── PROCESSOS ────────────────────────────────────────────────────────────

  getProcessos: async (search = '', page = 1, pageSize = 20): Promise<{ data: GpcProcesso[]; count: number }> => {
    let query = supabase
      .from('cgof_gpc_processos')
      .select('*', { count: 'exact' })
      .order('codigo', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search.trim()) {
      query = query.or(
        `processo.ilike.%${search}%,convenio.ilike.%${search}%,entidade.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) { console.error(error); notifyFetchError(); return { data: [], count: 0 }; }
    return { data: data as GpcProcesso[], count: count ?? 0 };
  },

  getProcessoFull: async (codigo: number): Promise<GpcProcessoFull | null> => {
    const { data: proc, error } = await supabase
      .from('cgof_gpc_processos')
      .select('*')
      .eq('codigo', codigo)
      .single();
    if (error || !proc) return null;

    const [exRows, objRows, parcRows, taRows] = await Promise.all([
      supabase.from('cgof_gpc_exercicio').select('*').eq('processo_id', codigo).order('exercicio'),
      supabase.from('cgof_gpc_objeto').select('*').eq('processo_id', codigo),
      supabase.from('cgof_gpc_parcelamento').select('*').eq('processo_id', codigo),
      supabase.from('cgof_gpc_ta').select('*').eq('processo_id', codigo).order('data'),
    ]);

    const exercicios = (exRows.data ?? []) as GpcExercicio[];
    const exercicioCodigos = exercicios.map(e => e.codigo);

    let historicos: GpcHistorico[] = [];
    if (exercicioCodigos.length > 0) {
      const { data: hRows } = await supabase
        .from('cgof_gpc_historico')
        .select('*, cgof_gpc_posicao(posicao)')
        .in('exercicio_id', exercicioCodigos)
        .order('data', { ascending: true });
      historicos = ((hRows ?? []) as (GpcHistorico & { cgof_gpc_posicao?: { posicao: string } | null })[]).map(h => ({
        ...h,
        posicao: h.cgof_gpc_posicao?.posicao ?? null,
      }));
    }

    return {
      ...(proc as GpcProcesso),
      exercicios,
      historicos,
      objetos: (objRows.data ?? []) as GpcObjeto[],
      parcelamentos: (parcRows.data ?? []) as GpcParcelamento[],
      tas: (taRows.data ?? []) as GpcTa[],
    };
  },

  checkDuplicateProcesso: async (processo: string): Promise<number> => {
    // Normalize: strip dots, slashes, dashes, spaces — for punctuation-tolerant comparison
    const norm = (s: string) => s.replace(/[.\-/\s]/g, '').toLowerCase();
    const needle = norm(processo.trim());
    if (!needle) return 0;
    // Fetch all process numbers (only the column we need, paginated — no cap)
    const rows = await fetchAllRows<{ processo: string | null }>(
      'cgof_gpc_recebidos', 'processo', q => q.not('processo', 'is', null),
    );
    return rows.filter(r => norm(r.processo ?? '') === needle).length;
  },

  // Cadastros existentes que batem com o número do processo digitado, agrupados por
  // processo_codigo — usado para oferecer "Vincular a este processo" em vez de criar
  // um processo-mestre duplicado quando o mesmo processo retorna em outro exercício.
  findProcessoDuplicates: async (processo: string): Promise<{
    processo_codigo: number | null;
    processo: string;
    convenio: string | null;
    entidade: string | null;
    rounds: { codigo: number; exercicio: string | null; posicao: string | null; data: string | null }[];
  }[]> => {
    const norm = (s: string) => s.replace(/[.\-/\s]/g, '').toLowerCase();
    const needle = norm(processo.trim());
    if (!needle) return [];
    const data = await fetchAllRows<{
      codigo: number; processo_codigo: number | null; processo: string | null; convenio: string | null;
      entidade: string | null; exercicio: string | null; data: string | null;
      cgof_gpc_posicao?: { posicao: string } | null;
    }>(
      'cgof_gpc_recebidos',
      'codigo, processo_codigo, processo, convenio, entidade, exercicio, data, cgof_gpc_posicao(posicao)',
      q => q.not('processo', 'is', null),
    );

    const matches = data.filter(r => norm(r.processo ?? '') === needle);
    const groups = new Map<string, {
      processo_codigo: number | null;
      processo: string;
      convenio: string | null;
      entidade: string | null;
      rounds: { codigo: number; exercicio: string | null; posicao: string | null; data: string | null }[];
    }>();
    for (const r of matches) {
      // Linhas sem processo_codigo (cadastros antigos não vinculados) viram grupos
      // individuais — não há mestre para linkar.
      const key = r.processo_codigo != null ? `p${r.processo_codigo}` : `r${r.codigo}`;
      if (!groups.has(key)) {
        groups.set(key, {
          processo_codigo: r.processo_codigo ?? null,
          processo: r.processo ?? '',
          convenio: r.convenio ?? null,
          entidade: r.entidade ?? null,
          rounds: [],
        });
      }
      groups.get(key)!.rounds.push({
        codigo: r.codigo,
        exercicio: r.exercicio ?? null,
        posicao: r.cgof_gpc_posicao?.posicao ?? null,
        data: r.data ?? null,
      });
    }
    return Array.from(groups.values());
  },

  // Todos os ciclos/registros já cadastrados para o mesmo processo-mestre — usado no
  // painel "Outros Ciclos deste Processo".
  getRecebidosByProcesso: async (processoCodigo: number): Promise<GpcRecebido[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_recebidos')
      .select('*, cgof_gpc_posicao(posicao)')
      .eq('processo_codigo', processoCodigo)
      .order('data', { ascending: false });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return ((data ?? []) as (GpcRecebido & { cgof_gpc_posicao?: { posicao: string } | null })[]).map(r => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    }));
  },

  saveGpcLog: async (description: string, userName: string, userId: string): Promise<void> => {
    await supabase.from('logs').insert({
      id: crypto.randomUUID(),
      action: 'GPC',
      description,
      userId,
      userName,
      timestamp: new Date().toISOString(),
    });
  },

  saveProcesso: async (p: Partial<GpcProcesso>): Promise<GpcProcesso> => {
    const payload = {
      processo: p.processo ?? null,
      convenio: p.convenio ?? null,
      tipo: p.tipo ?? null,
      ano_cadastro: p.ano_cadastro ?? null,
      entidade: p.entidade ?? null,
      drs: p.drs ?? null,
      vistoriado: p.vistoriado ?? false,
      parcelamento: p.parcelamento ?? false,
      acima_abaixo: p.acima_abaixo ?? null,
      updated_at: new Date().toISOString(),
    };

    if (p.codigo) {
      const { data, error } = await supabase
        .from('cgof_gpc_processos')
        .update(payload)
        .eq('codigo', p.codigo)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as GpcProcesso;
    } else {
      const { data, error } = await supabase
        .from('cgof_gpc_processos')
        .insert(payload)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as GpcProcesso;
    }
  },

  deleteProcesso: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_processos').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── EXERCÍCIO ────────────────────────────────────────────────────────────

  getAllExercicios: async (): Promise<GpcExercicio[]> => {
    return fetchAllRows<GpcExercicio>(
      'cgof_gpc_exercicio',
      '*',
      q => q.order('exercicio'),
    );
  },

  saveExercicio: async (e: Partial<GpcExercicio>): Promise<GpcExercicio> => {
    const payload = {
      processo_id: e.processo_id,
      exercicio: e.exercicio ?? null,
      exercicio_anterior: e.exercicio_anterior ?? null,
      repasse: e.repasse ?? null,
      aplicacao: e.aplicacao ?? null,
      gastos: e.gastos ?? null,
      devolvido: e.devolvido ?? null,
      qtd_paginas: e.qtd_paginas ?? null,
      data_recebimento: e.data_recebimento ?? null,
    };
    if (e.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_exercicio').update(payload).eq('codigo', e.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcExercicio;
    }
    const { data, error } = await supabase.from('cgof_gpc_exercicio').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcExercicio;
  },

  deleteExercicio: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_exercicio').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── HISTÓRICO ────────────────────────────────────────────────────────────

  saveHistorico: async (h: Partial<GpcHistorico>): Promise<GpcHistorico> => {
    const payload = {
      exercicio_id: h.exercicio_id,
      movimento: h.movimento ?? null,
      acao: h.acao ?? null,
      data: h.data ?? null,
      setor: h.setor ?? null,
      responsavel: h.responsavel ?? null,
      posicao_id: h.posicao_id ?? null,
    };
    if (h.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_historico').update(payload).eq('codigo', h.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcHistorico;
    }
    const { data, error } = await supabase.from('cgof_gpc_historico').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcHistorico;
  },

  deleteHistorico: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_historico').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── OBJETO ───────────────────────────────────────────────────────────────

  saveObjeto: async (o: Partial<GpcObjeto>): Promise<GpcObjeto> => {
    const payload = { processo_id: o.processo_id ?? null, objeto: o.objeto ?? null, custo: o.custo ?? null };
    if (o.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_objeto').update(payload).eq('codigo', o.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcObjeto;
    }
    const { data, error } = await supabase.from('cgof_gpc_objeto').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcObjeto;
  },

  deleteObjeto: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_objeto').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── PARCELAMENTO ─────────────────────────────────────────────────────────

  saveParcelamento: async (p: Partial<GpcParcelamento>): Promise<GpcParcelamento> => {
    const payload = {
      processo_id: p.processo_id ?? null,
      proc_parcela: p.proc_parcela ?? null,
      tipo: p.tipo ?? null,
      tipo_parcelamento: p.tipo_parcelamento ?? null,
      exercicio: p.exercicio ?? null,
      exercicios: p.exercicios ?? [],
      valor_parcelado: p.valor_parcelado ?? null,
      valor_corrigido: p.valor_corrigido ?? null,
      parcelas: p.parcelas ?? null,
      data_parou_pagar: p.data_parou_pagar ?? null,
      valor_por_parcela: p.valor_por_parcela ?? null,
      em_dia: p.em_dia ?? false,
      parcelas_concluidas: p.parcelas_concluidas ?? false,
      providencias: p.providencias ?? null,
      obs: p.obs ?? null,
      autorizo_secretario: p.autorizo_secretario ?? false,
      autorizo_casa_civil: p.autorizo_casa_civil ?? false,
      data_assinatura: p.data_assinatura ?? null,
      autorizo_governador: p.autorizo_governador ?? false,
      autorizacoes_log: p.autorizacoes_log ?? [],
    };
    if (p.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_parcelamento').update(payload).eq('codigo', p.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcParcelamento;
    }
    const { data, error } = await supabase.from('cgof_gpc_parcelamento').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcParcelamento;
  },

  deleteParcelamento: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_parcelamento').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── PARCELA (individual, dentro de um parcelamento/reparcelamento) ────────

  getParcelas: async (parcelamentoId: number): Promise<GpcParcela[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_parcela')
      .select('*')
      .eq('parcelamento_id', parcelamentoId)
      .order('numero', { ascending: true });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return (data ?? []) as GpcParcela[];
  },

  saveParcela: async (p: Partial<GpcParcela>): Promise<GpcParcela> => {
    const payload = {
      parcelamento_id: p.parcelamento_id,
      numero: p.numero,
      data_vencimento: p.data_vencimento ?? null,
      valor: p.valor ?? null,
      pago: p.pago ?? false,
      data_pagamento: p.data_pagamento ?? null,
      obs: p.obs ?? null,
    };
    if (p.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_parcela').update(payload).eq('codigo', p.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcParcela;
    }
    const { data, error } = await supabase.from('cgof_gpc_parcela').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcParcela;
  },

  deleteParcela: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_parcela').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  bulkGenerateParcelas: async (
    parcelamentoId: number,
    quantidade: number,
    valorPorParcela: number | null,
    dataPrimeiraParcela: string,
  ): Promise<GpcParcela[]> => {
    const [anoStr, mesStr, diaStr] = dataPrimeiraParcela.split('-');
    const ano = Number(anoStr), mes = Number(mesStr), dia = Number(diaStr);
    const payload = Array.from({ length: quantidade }, (_, i) => {
      const d = new Date(ano, mes - 1 + i, dia);
      const vencimento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        parcelamento_id: parcelamentoId,
        numero: i + 1,
        data_vencimento: vencimento,
        valor: valorPorParcela ?? null,
        pago: false,
        data_pagamento: null,
        obs: null,
      };
    });
    const { data, error } = await supabase.from('cgof_gpc_parcela').insert(payload).select();
    if (error) throw new Error(error.message);
    return (data ?? []) as GpcParcela[];
  },

  // ── TERMO ADITIVO ────────────────────────────────────────────────────────

  saveTa: async (t: Partial<GpcTa>): Promise<GpcTa> => {
    const payload = {
      processo_id: t.processo_id ?? null,
      numero: t.numero ?? null,
      data: t.data ?? null,
      custo: t.custo ?? null,
    };
    if (t.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_ta').update(payload).eq('codigo', t.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcTa;
    }
    const { data, error } = await supabase.from('cgof_gpc_ta').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcTa;
  },

  deleteTa: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_ta').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── RELATÓRIOS ───────────────────────────────────────────────────────────

  getReportData: async (): Promise<GpcReportData> => {
    const [procCount, exCount, parcCount, taCount, parcAtivos, parcDetalhes] = await Promise.all([
      supabase.from('cgof_gpc_processos').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_exercicio').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_parcelamento').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_ta').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_parcelamento').select('*', { count: 'exact', head: true }).eq('em_dia', true),
      supabase.from('cgof_gpc_parcelamento').select('*, cgof_gpc_processos(processo, convenio, entidade)'),
    ]);

    // Paginado: essas três consultas podem passar de 1000 linhas (ver fetchAllRows).
    const [byDrsRows, byTipoRows, repasseRows] = await Promise.all([
      fetchAllRows<{ drs: number }>('cgof_gpc_processos', 'drs', q => q.not('drs', 'is', null)),
      fetchAllRows<{ tipo: string }>('cgof_gpc_processos', 'tipo', q => q.not('tipo', 'is', null)),
      fetchAllRows<{ repasse: number | null }>('cgof_gpc_exercicio', 'repasse'),
    ]);

    // Aggregate DRS
    const drsCounts: Record<number, number> = {};
    for (const r of byDrsRows) {
      drsCounts[r.drs] = (drsCounts[r.drs] ?? 0) + 1;
    }
    const byDrs = Object.entries(drsCounts)
      .map(([drs, count]) => ({ drs: Number(drs), count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate Tipo
    const tipoCounts: Record<string, number> = {};
    for (const r of byTipoRows) {
      const t = r.tipo ?? 'N/A';
      tipoCounts[t] = (tipoCounts[t] ?? 0) + 1;
    }
    const byTipo = Object.entries(tipoCounts)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count);

    const valorTotalRepasse = repasseRows.reduce((sum: number, r) => sum + (r.repasse ?? 0), 0);

    const parcelamentosDetalhes = ((parcDetalhes.data ?? []) as (GpcParcelamento & {
      cgof_gpc_processos?: { processo: string | null; convenio: string | null; entidade: string | null } | null;
    })[]).map(p => ({
      ...p,
      processo: p.cgof_gpc_processos?.processo ?? null,
      convenio: p.cgof_gpc_processos?.convenio ?? null,
      entidade: p.cgof_gpc_processos?.entidade ?? null,
    }));

    return {
      totalProcessos: procCount.count ?? 0,
      totalExercicios: exCount.count ?? 0,
      totalParcelamentos: parcCount.count ?? 0,
      totalTas: taCount.count ?? 0,
      byDrs,
      byTipo,
      parcelamentosAtivos: parcAtivos.count ?? 0,
      valorTotalRepasse,
      parcelamentosDetalhes,
    };
  },

  // ── RECEBIDOS ────────────────────────────────────────────────────────────

  getAllRecebidos: async (): Promise<GpcRecebido[]> => {
    const rows = await fetchAllRows<GpcRecebido & { cgof_gpc_posicao?: { posicao: string } | null }>(
      'cgof_gpc_recebidos',
      '*, cgof_gpc_posicao(posicao)',
      q => q.order('codigo', { ascending: false }),
    );
    return rows.map(r => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    }));
  },

  getRecebidos: async (search = '', page = 1, pageSize = 25): Promise<{ data: GpcRecebido[]; count: number }> => {
    let query = supabase
      .from('cgof_gpc_recebidos')
      .select('*, cgof_gpc_posicao(posicao)', { count: 'exact' })
      .order('codigo', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search.trim()) {
      query = query.or(
        `processo.ilike.%${search}%,entidade.ilike.%${search}%,convenio.ilike.%${search}%,responsavel.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    if (error) { console.error(error); notifyFetchError(); return { data: [], count: 0 }; }

    const rows = ((data ?? []) as (GpcRecebido & { cgof_gpc_posicao?: { posicao: string } | null })[]).map(r => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    })) as GpcRecebido[];

    return { data: rows, count: count ?? 0 };
  },

  getRecebidoByCode: async (codigo: number): Promise<GpcRecebido | null> => {
    const { data, error } = await supabase
      .from('cgof_gpc_recebidos')
      .select('*, cgof_gpc_posicao(posicao)')
      .eq('codigo', codigo)
      .single();
    if (error) { console.error(error); notifyFetchError(); return null; }
    return { ...(data as any), posicao: (data as any).cgof_gpc_posicao?.posicao ?? null } as GpcRecebido;
  },

  saveRecebido: async (r: Partial<GpcRecebido>): Promise<GpcRecebido> => {
    const payload: Record<string, any> = {
      processo_codigo: r.processo_codigo ?? null,
      processo: r.processo ?? null,
      entidade: r.entidade ?? null,
      municipio: r.municipio ?? null,
      convenio: r.convenio ?? null,
      exercicio: r.exercicio ?? null,
      drs: r.drs ?? null,
      data: r.data ?? null,
      responsavel_cadastro: r.responsavel_cadastro ?? null,
      link_processo: r.link_processo ?? null,
      is_parcelamento: r.is_parcelamento ?? false,
      remessa: r.remessa ?? null,
      responsavel_assinatura: r.responsavel_assinatura ?? null,
      responsavel_assinatura_2: r.responsavel_assinatura_2 ?? null,
      valor_convenio: r.valor_convenio ?? null,
    };
    // Posição/Movimento/Responsáveis/Nº Páginas/Situação/Correção são "donos" da aba Exercícios
    // (por exercício, cgof_gpc_registro_exercicio) — só entram aqui no cadastro inicial do
    // registro (estado de partida, antes de existir qualquer exercício). Num UPDATE eles NÃO
    // são reenviados: o formulário de Identificação não os edita mais, e reenviá-los aqui
    // sobrescreveria com o snapshot desatualizado do form o que a aba Exercícios já salvou.
    if (!r.codigo) {
      payload.responsavel = r.responsaveis_analise?.[0] ?? r.responsavel ?? null; // primary analyst for backward compat
      payload.responsaveis_analise = r.responsaveis_analise ?? null;
      payload.posicao_id = r.posicao_id ?? null;
      payload.movimento = r.movimento ?? null;
      payload.num_paginas = r.num_paginas ?? null;
      payload.situacao = r.situacao ?? null;
      payload.irregular_tipos = r.irregular_tipos ?? null;
      payload.irregular_debito = r.irregular_debito ?? null;
      payload.valor_multa = r.valor_multa ?? null;
      payload.ressarcimento_status = r.ressarcimento_status ?? null;
      payload.cobranca_estagio = r.cobranca_estagio ?? null;
      payload.valor_a_devolver = r.valor_a_devolver ?? null;
      payload.valor_devolvido = r.valor_devolvido ?? null;
      payload.situacao_obs = r.situacao_obs ?? null;
      payload.correcao_paginas = r.correcao_paginas ?? null;
      payload.correcao_obs = r.correcao_obs ?? null;
    }
    if (r.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_recebidos').update(payload).eq('codigo', r.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcRecebido;
    }
    const { data, error } = await supabase.from('cgof_gpc_recebidos').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcRecebido;
  },

  deleteRecebido: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_recebidos').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  updateAssinatura: async (codigo: number, responsavel_assinatura: string | null, responsavel_assinatura_2: string | null): Promise<void> => {
    const { error } = await supabase
      .from('cgof_gpc_recebidos')
      .update({ responsavel_assinatura, responsavel_assinatura_2 })
      .eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── PRODUTIVIDADE ────────────────────────────────────────────────────────

  getProdutividade: async (registroId: number): Promise<GpcProdutividade[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_produtividade')
      .select('*, cgof_gpc_posicao(posicao)')
      .eq('registro_id', registroId)
      .order('data_evento', { ascending: true });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return ((data ?? []) as (GpcProdutividade & { cgof_gpc_posicao?: { posicao: string } | null })[]).map(r => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? r.posicao ?? null,
    }));
  },

  saveProdutividade: async (p: Partial<GpcProdutividade>): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_produtividade').insert({
      registro_id: p.registro_id,
      responsavel: p.responsavel ?? null,
      posicao_id: p.posicao_id ?? null,
      posicao: p.posicao ?? null,
      evento: p.evento ?? 'POSICAO',
      data_evento: p.data_evento ?? new Date().toISOString(),
      obs: p.obs ?? null,
    });
    if (error) throw new Error(error.message);
  },

  updateProdutividadeData: async (id: number, data_evento: string): Promise<void> => {
    const { error } = await supabase
      .from('cgof_gpc_produtividade')
      .update({ data_evento })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },

  updateProdutividade: async (id: number, p: Partial<GpcProdutividade>): Promise<void> => {
    const update: Record<string, any> = {};
    if (p.obs !== undefined)        update.obs = p.obs;
    if (p.posicao_id !== undefined) update.posicao_id = p.posicao_id;
    if (p.posicao !== undefined)    update.posicao = p.posicao;
    if (p.data_evento !== undefined) update.data_evento = p.data_evento;
    const { error } = await supabase.from('cgof_gpc_produtividade').update(update).eq('id', id);
    if (error) throw new Error(error.message);
  },

  deleteProdutividade: async (id: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_produtividade').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  getProdutividadeDetalhado: async (): Promise<{ registro_id: number; responsavel: string; evento: string; data_evento: string; obs?: string | null; num_paginas_analise?: number | null }[]> => {
    // Source 1: cgof_gpc_produtividade — CADASTRO + INICIO_ANALISE (fired by DB triggers, dates are always correct)
    // + CADASTRO_EXERCICIO (logged directly by ExercicioForm when a técnico registers a new exercício/ano)
    // Usa fetchAllRows (paginado em blocos de 1000) — essa consulta já passou de 1000 linhas
    // e o PostgREST descartava silenciosamente os eventos mais recentes (a query ordena por
    // data_evento ascendente, então o corte sempre cai justamente nos mais novos).
    const prodData = await fetchAllRows<{ registro_id: number; responsavel: string; evento: string; data_evento: string; obs: string | null }>(
      'cgof_gpc_produtividade',
      'registro_id, responsavel, evento, data_evento, obs',
      q => q
        .not('responsavel', 'is', null)
        .in('evento', ['INICIO_ANALISE', 'CADASTRO', 'CADASTRO_EXERCICIO'])
        .order('data_evento', { ascending: true }),
    );

    // Source 2: cgof_gpc_fluxo_tecnico — POSICAO + MOVIMENTO events (real retroactive dates from user input)
    const fluxoData = await fetchAllRows<{
      registro_id: number; tecnico: string; data_evento: string; posicao_id: number | null;
      movimento: string | null; acao: string | null; num_paginas_analise: number | null;
    }>(
      'cgof_gpc_fluxo_tecnico',
      'registro_id, tecnico, data_evento, posicao_id, movimento, acao, num_paginas_analise',
      q => q.not('tecnico', 'is', null).order('data_evento', { ascending: true }),
    );

    const fluxoEvents = ((fluxoData ?? []) as {
      registro_id: number; tecnico: string; data_evento: string; posicao_id: number | null;
      movimento: string | null; acao: string | null; num_paginas_analise: number | null;
    }[]).map(f => {
      const mov = (f.movimento ?? '') as string;
      const acao = (f.acao ?? '') as string;
      // Events with movement text → MOVIMENTO; pure position change (no movement text) → POSICAO
      // Analysis events from fluxo → INICIO_ANALISE (trigger may also log it, Set deduplicates count)
      let evento: string;
      if (mov === 'CORREÇÃO DOCUMENTAL') {
        evento = 'CORRECAO';
      } else if (mov === 'EM ANÁLISE' || mov === 'REANÁLISE' || mov === 'INÍCIO DA ANÁLISE' || acao.toUpperCase().includes('ANÁLISE')) {
        evento = 'INICIO_ANALISE';
      } else if (mov.trim()) {
        evento = 'MOVIMENTO';
      } else if (f.posicao_id) {
        evento = 'POSICAO';
      } else {
        evento = 'MOVIMENTO';
      }
      return {
        registro_id: f.registro_id as number,
        responsavel: normalizeNomeTecnico(f.tecnico as string),
        evento,
        data_evento: f.data_evento as string,
        obs: mov || acao || null,
        num_paginas_analise: (f.num_paginas_analise as number | null) ?? null,
      };
    });

    const prodEvents = ((prodData ?? []) as {
      registro_id: number; responsavel: string; evento: string; data_evento: string; obs: string | null;
    }[]).map(p => ({
      registro_id: p.registro_id as number,
      responsavel: normalizeNomeTecnico(p.responsavel as string),
      evento: p.evento as string,
      data_evento: p.data_evento as string,
      obs: p.obs as string | null,
    }));

    return [...prodEvents, ...fluxoEvents]
      .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  },

  // ── FLUXO TÉCNICO (por registro x exercício) ────────────────────────────

  getFluxoTecnico: async (registroId: number, exercicioId?: number | null): Promise<GpcFluxoTecnico[]> => {
    let q = supabase
      .from('cgof_gpc_fluxo_tecnico')
      .select('*, cgof_gpc_posicao(posicao)')
      .eq('registro_id', registroId);
    if (exercicioId != null) q = q.eq('exercicio_id', exercicioId);
    const { data, error } = await q.order('data_evento', { ascending: true });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return ((data ?? []) as (GpcFluxoTecnico & { cgof_gpc_posicao?: { posicao: string } | null })[]).map(r => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? r.posicao ?? null,
    }));
  },

  saveFluxoTecnico: async (f: Partial<GpcFluxoTecnico>): Promise<GpcFluxoTecnico> => {
    const payload = {
      registro_id: f.registro_id,
      exercicio_id: f.exercicio_id ?? null,
      tecnico: f.tecnico ?? null,
      data_evento: f.data_evento ?? new Date().toISOString(),
      posicao_id: f.posicao_id ?? null,
      movimento: f.movimento ?? null,
      acao: f.acao ?? null,
      tempo_dias: f.tempo_dias ?? null,
      num_paginas_analise: f.num_paginas_analise ?? null,
      obs: f.obs ?? null,
    };
    let saved: GpcFluxoTecnico;
    if (f.id) {
      const { data, error } = await supabase.from('cgof_gpc_fluxo_tecnico').update(payload).eq('id', f.id).select().single();
      if (error) throw new Error(error.message);
      saved = data as GpcFluxoTecnico;
    } else {
      const { data, error } = await supabase.from('cgof_gpc_fluxo_tecnico').insert(payload).select().single();
      if (error) throw new Error(error.message);
      saved = data as GpcFluxoTecnico;
    }
    // Um evento de fluxo é a ÚNICA forma de avançar Posição/Movimento de um exercício —
    // propaga automaticamente para a "foto atual" (cgof_gpc_registro_exercicio) e para o
    // cache em cgof_gpc_recebidos (lista principal/filtros/relatórios leem de lá)
    if (f.registro_id && f.exercicio_id && (f.posicao_id || f.movimento)) {
      const update: Record<string, any> = {
        registro_id: f.registro_id,
        exercicio_id: f.exercicio_id,
        updated_at: new Date().toISOString(),
      };
      if (f.posicao_id) update.posicao_id = f.posicao_id;
      if (f.movimento) update.movimento = f.movimento;
      await supabase.from('cgof_gpc_registro_exercicio').upsert(update, { onConflict: 'registro_id,exercicio_id' });

      const cacheUpdate: Record<string, any> = {};
      if (f.posicao_id) cacheUpdate.posicao_id = f.posicao_id;
      if (f.movimento) cacheUpdate.movimento = f.movimento;
      await supabase.from('cgof_gpc_recebidos').update(cacheUpdate).eq('codigo', f.registro_id);
    }
    return saved;
  },

  deleteFluxoTecnico: async (id: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_fluxo_tecnico').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ── ANÁLISE POR EXERCÍCIO (registro x exercício) ────────────────────────
  // Cada exercício financeiro tem sua própria Posição/Movimento/Análise/Situação/
  // Correção Documental, independente dos demais exercícios do mesmo registro.

  getRegistroExercicios: async (registroId: number): Promise<GpcRegistroExercicio[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_registro_exercicio')
      .select('*, cgof_gpc_exercicio(exercicio), cgof_gpc_posicao(posicao)')
      .eq('registro_id', registroId)
      .order('codigo');
    if (error) { console.error(error); notifyFetchError(); return []; }
    return ((data ?? []) as any[]).map(r => ({
      ...r,
      exercicio: r.cgof_gpc_exercicio?.exercicio ?? null,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    })) as GpcRegistroExercicio[];
  },

  saveRegistroExercicio: async (r: Partial<GpcRegistroExercicio>): Promise<GpcRegistroExercicio> => {
    const payload = {
      registro_id: r.registro_id,
      exercicio_id: r.exercicio_id,
      posicao_id: r.posicao_id ?? null,
      movimento: r.movimento ?? null,
      responsaveis_analise: r.responsaveis_analise ?? null,
      num_paginas: r.num_paginas ?? null,
      situacao: r.situacao ?? null,
      irregular_tipos: r.irregular_tipos ?? null,
      irregular_debito: r.irregular_debito ?? null,
      valor_multa: r.valor_multa ?? null,
      ressarcimento_status: r.ressarcimento_status ?? null,
      cobranca_estagio: r.cobranca_estagio ?? null,
      situacao_obs: r.situacao_obs ?? null,
      valor_a_devolver: r.valor_a_devolver ?? null,
      valor_devolvido: r.valor_devolvido ?? null,
      correcao_paginas: r.correcao_paginas ?? null,
      correcao_obs: r.correcao_obs ?? null,
      responsavel_assinatura: r.responsavel_assinatura ?? null,
      responsavel_assinatura_2: r.responsavel_assinatura_2 ?? null,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('cgof_gpc_registro_exercicio')
      .upsert(payload, { onConflict: 'registro_id,exercicio_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as GpcRegistroExercicio;
  },

  // Responsável pela assinatura é por (registro x exercício) — salva sem esperar o botão
  // "Salvar Análise" (mesmo padrão imediato do updateAssinatura de registro, abaixo)
  updateAssinaturaExercicio: async (registroId: number, exercicioId: number, responsavel_assinatura: string | null, responsavel_assinatura_2: string | null): Promise<void> => {
    const { error } = await supabase
      .from('cgof_gpc_registro_exercicio')
      .upsert({
        registro_id: registroId,
        exercicio_id: exercicioId,
        responsavel_assinatura,
        responsavel_assinatura_2,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'registro_id,exercicio_id' });
    if (error) throw new Error(error.message);
  },

  // Atualiza APENAS os campos informados em cgof_gpc_recebidos (update parcial de verdade —
  // ao contrário de saveRecebido, que sempre reescreve o registro inteiro). Usado para manter
  // a lista principal/filtros/relatórios (que leem posicao_id/movimento/situação direto do
  // registro) sincronizados com o exercício mais recentemente salvo na aba Exercícios.
  syncRecebidoCache: async (registroId: number, fields: Partial<GpcRecebido>): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_recebidos').update(fields).eq('codigo', registroId);
    if (error) throw new Error(error.message);
  },

  // ── ATIVIDADES AVULSAS ──────────────────────────────────────────────────
  // Trabalho de um técnico sem vínculo a um registro de processo do GPC — pode envolver
  // processo de outro setor/departamento (auxílio a outro setor, elaboração de documento,
  // etc.) — ver comentário em cgof_gpc_atividade_avulsa (parte_43_gpc_atividade_avulsa.sql)
  // sobre por que isso não é registro_id-based.

  getAtividadesAvulsas: async (): Promise<GpcAtividadeAvulsa[]> => {
    return fetchAllRows<GpcAtividadeAvulsa>(
      'cgof_gpc_atividade_avulsa', '*',
      q => q.order('data_atividade', { ascending: false }),
    );
  },

  saveAtividadeAvulsa: async (a: Partial<GpcAtividadeAvulsa>): Promise<GpcAtividadeAvulsa> => {
    const payload = {
      tecnico: a.tecnico,
      tipo: a.tipo,
      descricao: a.descricao,
      contexto: a.contexto ?? null,
      horas: a.horas ?? null,
      paginas: a.paginas ?? null,
      data_atividade: a.data_atividade ?? new Date().toISOString(),
      registrado_por: a.registrado_por ?? null,
    };
    if (a.codigo) {
      const { data, error } = await supabase.from('cgof_gpc_atividade_avulsa').update(payload).eq('codigo', a.codigo).select().single();
      if (error) throw new Error(error.message);
      return data as GpcAtividadeAvulsa;
    }
    const { data, error } = await supabase.from('cgof_gpc_atividade_avulsa').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as GpcAtividadeAvulsa;
  },

  deleteAtividadeAvulsa: async (codigo: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_atividade_avulsa').delete().eq('codigo', codigo);
    if (error) throw new Error(error.message);
  },

  // ── DASHBOARD GPC ────────────────────────────────────────────────────────

  getRecebidosDashboard: async (): Promise<{
    total: number;
    byPosicao: { posicao: string; count: number }[];
    byRemessa: { remessa: string; count: number }[];
    byResponsavel: { responsavel: string; count: number }[];
    comParcelamento: number;
    semParcelamento: number;
    complexidade: { label: string; count: number; color: string }[];
    topEntidades: { entidade: string; count: number }[];
    byMes: { mes: string; count: number }[];
  } | null> => {
    // fetchAllRows: cgof_gpc_recebidos já passou de 1000 linhas — sem paginação o
    // PostgREST descartava as mais recentes e o dashboard subestimava os totais.
    const data = await fetchAllRows(
      'cgof_gpc_recebidos',
      'posicao_id, remessa, responsavel, is_parcelamento, num_paginas, entidade, created_at, cgof_gpc_posicao(posicao)',
    );

    const rows = ((data ?? []) as unknown as {
      posicao_id: number | null; remessa: 'ACIMA' | 'ABAIXO' | null; responsavel: string | null;
      is_parcelamento: boolean | null; num_paginas: number | null; entidade: string | null;
      created_at: string | null; cgof_gpc_posicao?: { posicao: string } | null;
    }[]).map(r => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    }));

    const total = rows.length;

    // By posição
    const posMap: Record<string, number> = {};
    rows.forEach(r => { const k = r.posicao ?? 'Não definida'; posMap[k] = (posMap[k] || 0) + 1; });
    const byPosicao = Object.entries(posMap).map(([posicao, count]) => ({ posicao, count })).sort((a, b) => b.count - a.count);

    // By remessa
    const remMap: Record<string, number> = {};
    rows.forEach(r => {
      const k = r.remessa === 'ACIMA' ? 'Acima de Remessa' : r.remessa === 'ABAIXO' ? 'Abaixo de Remessa' : 'Não Informado';
      remMap[k] = (remMap[k] || 0) + 1;
    });
    const byRemessa = Object.entries(remMap).map(([remessa, count]) => ({ remessa, count })).filter(r => r.count > 0);

    // By responsável (top 8)
    const respMap: Record<string, number> = {};
    rows.forEach(r => { if (r.responsavel) { const k = normalizeNomeTecnico(r.responsavel); respMap[k] = (respMap[k] || 0) + 1; } });
    const byResponsavel = Object.entries(respMap).map(([responsavel, count]) => ({ responsavel, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // Parcelamento
    const comParcelamento = rows.filter(r => r.is_parcelamento).length;
    const semParcelamento = total - comParcelamento;

    // Complexidade
    const cxBuckets: { label: string; count: number; color: string }[] = [
      { label: 'Baixa (≤50)', count: 0, color: '#22c55e' },
      { label: 'Média (51-200)', count: 0, color: '#f59e0b' },
      { label: 'Alta (201-500)', count: 0, color: '#f97316' },
      { label: 'Muito Alta (>500)', count: 0, color: '#ef4444' },
      { label: 'Não informado', count: 0, color: '#94a3b8' },
    ];
    rows.forEach(r => {
      const n = r.num_paginas;
      if (!n || n === 0) cxBuckets[4].count++;
      else if (n <= 50) cxBuckets[0].count++;
      else if (n <= 200) cxBuckets[1].count++;
      else if (n <= 500) cxBuckets[2].count++;
      else cxBuckets[3].count++;
    });
    const complexidade = cxBuckets.filter(c => c.count > 0);

    // Top entidades (top 8)
    const entMap: Record<string, number> = {};
    rows.forEach(r => { if (r.entidade) { entMap[r.entidade] = (entMap[r.entidade] || 0) + 1; } });
    const topEntidades = Object.entries(entMap).map(([entidade, count]) => ({ entidade, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // By mês (last 6 months)
    const mesMap: Record<string, number> = {};
    rows.forEach(r => { if (r.created_at) { const mes = r.created_at.slice(0, 7); mesMap[mes] = (mesMap[mes] || 0) + 1; } });
    const byMes = Object.entries(mesMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, count]) => ({ mes, count }));

    return { total, byPosicao, byRemessa, byResponsavel, comParcelamento, semParcelamento, complexidade, topEntidades, byMes };
  },

  getFluxoResumoTecnicos: async (
    gran: Granularidade = 'geral',
    period?: string,
  ): Promise<{
    tecnico: string;
    total_registros: number;
    total_paginas: number;
    tempo_medio_dias: number | null; // null = menos de 2 ações no período, sem intervalo pra calcular
    ultimo_evento: string;
  }[]> => {
    // fetchAllRows: mesma proteção contra o limite de 1000 linhas do PostgREST usada em
    // getProdutividadeDetalhado — cgof_gpc_fluxo_tecnico está perto desse limite hoje e vai
    // ultrapassá-lo com o uso normal do sistema.
    const data = await fetchAllRows<{ tecnico: string; registro_id: number; data_evento: string; num_paginas_analise: number | null }>(
      'cgof_gpc_fluxo_tecnico',
      'tecnico, registro_id, data_evento, num_paginas_analise',
      q => q.not('tecnico', 'is', null).order('data_evento', { ascending: true }), // ascending so first event comes first
    );

    // Filtra pelo mesmo período selecionado na tela (client-side, mesma lógica de
    // localPeriodKey/periodoKey) — sem isso, esta função sempre agregava TODO o
    // histórico, enquanto o restante da tela de Produtividade já filtrava por período,
    // produzindo uma razão "páginas por ação" inconsistente ao trocar o período.
    const rows = (gran === 'geral' || !period)
      ? (data ?? [])
      : (data ?? []).filter(r => localPeriodKey(r.data_evento as string, gran) === period);

    // To avoid page duplication: track which (tecnico, registro_id) pairs we already counted pages for
    const paginasContadas = new Set<string>();
    const map: Record<string, { count: number; paginas: number; tempos: number[]; ultimo: string; ultimaDataTecnico?: string }> = {};
    for (const r of rows) {
      const t = normalizeNomeTecnico(r.tecnico as string);
      if (!map[t]) map[t] = { count: 0, paginas: 0, tempos: [], ultimo: '' };
      map[t].count++;
      // Count pages only once per (tecnico, registro_id) — use the first event's value
      const paginasKey = `${t}||${r.registro_id}`;
      if (r.num_paginas_analise && !paginasContadas.has(paginasKey)) {
        map[t].paginas += r.num_paginas_analise;
        paginasContadas.add(paginasKey);
      }
      // Tempo médio: intervalo (em dias) entre ações consecutivas do mesmo técnico.
      // A coluna `tempo_dias` da tabela nunca é preenchida por nenhum formulário do app
      // (fica sempre null), então o valor é calculado aqui a partir das datas dos eventos,
      // que já chegam ordenadas ascendentemente (query ordena por data_evento).
      if (map[t].ultimaDataTecnico) {
        const diffDias = (new Date(r.data_evento).getTime() - new Date(map[t].ultimaDataTecnico!).getTime()) / 86400000;
        if (diffDias >= 0) map[t].tempos.push(diffDias);
      }
      map[t].ultimaDataTecnico = r.data_evento;
      if (r.data_evento > map[t].ultimo) map[t].ultimo = r.data_evento;
    }
    return Object.entries(map).map(([tecnico, s]) => ({
      tecnico,
      total_registros: s.count,
      total_paginas: s.paginas,
      tempo_medio_dias: s.tempos.length > 0 ? Math.round(s.tempos.reduce((a, b) => a + b, 0) / s.tempos.length) : null,
      ultimo_evento: s.ultimo,
    })).sort((a, b) => b.total_registros - a.total_registros);
  },

  getExerciciosRelatorio: async (): Promise<ExercicioRelatorio[]> => {
    // Paginate to bypass PostgREST default 1000-row limit on hosted Supabase.
    // Includes rows with NULL financial data (exercises registered but not yet filled).
    const all = await fetchAllRows<GpcExercicio & {
      cgof_gpc_processos?: { processo: string | null; convenio: string | null; entidade: string | null } | null;
    }>(
      'cgof_gpc_exercicio',
      '*, cgof_gpc_processos(processo, convenio, entidade)',
      q => q.order('processo_id', { ascending: true }).order('exercicio', { ascending: true }),
    );

    return all.map(e => {
      const repasse   = e.repasse   ?? 0;
      const aplicacao = e.aplicacao ?? 0;
      const exAnt     = e.exercicio_anterior ?? 0;
      const gastos    = e.gastos    ?? 0;
      const devolvido = e.devolvido ?? 0;
      const total_convenio = repasse + aplicacao; // Total do Convênio = Repasse + Aplicação (mesma fórmula da tela de edição)
      const saldo = Math.round((exAnt + repasse + aplicacao - gastos - devolvido) * 100) / 100;
      return {
        processo_id: e.processo_id,
        processo:    e.cgof_gpc_processos?.processo ?? null,
        convenio:    e.cgof_gpc_processos?.convenio ?? null,
        entidade:    e.cgof_gpc_processos?.entidade ?? null,
        exercicio:   e.exercicio ?? null,
        exercicio_anterior: e.exercicio_anterior ?? null,
        repasse:     e.repasse ?? null,
        aplicacao:   e.aplicacao ?? null,
        gastos:      e.gastos ?? null,
        devolvido:   e.devolvido ?? null,
        total_convenio,
        saldo,
      } as ExercicioRelatorio;
    });
  },

  // ── EXPORTAÇÃO COMPLETA ──────────────────────────────────────────────────

  getAllProcessosExport: async (): Promise<GpcProcesso[]> => {
    // fetchAllRows: cgof_gpc_processos já passou de 1000 linhas — sem paginação a
    // exportação completa descartava silenciosamente os processos mais recentes.
    return fetchAllRows<GpcProcesso>(
      'cgof_gpc_processos', '*',
      q => q.order('codigo', { ascending: true }),
    );
  },

  getAllTasExport: async (): Promise<(GpcTa & { processo: string | null; convenio: string | null; entidade: string | null })[]> => {
    // fetchAllRows: mesma proteção contra o limite de 1000 linhas usada nas demais exportações.
    const data = await fetchAllRows(
      'cgof_gpc_ta',
      '*, cgof_gpc_processos(processo, convenio, entidade)',
      q => q.order('processo_id', { ascending: true }).order('data', { ascending: true }),
    );
    return ((data ?? []) as (GpcTa & {
      cgof_gpc_processos?: { processo: string | null; convenio: string | null; entidade: string | null } | null;
    })[]).map(t => ({
      ...t,
      processo: t.cgof_gpc_processos?.processo ?? null,
      convenio: t.cgof_gpc_processos?.convenio ?? null,
      entidade: t.cgof_gpc_processos?.entidade ?? null,
    }));
  },

  getProdutividadeParaRelatorio: async (
    ano: string,
    mes?: string,
  ): Promise<{
    resumo: {
      responsavel: string;
      cadastros: number;
      analises: number;
      posicoes: number;
      movimentos: number; // pure movement/status changes only — NOT correções
      correcoes: number;  // CORRECAO events — correção documental é trabalho analítico, contado à parte
      exercicios: number; // CADASTRO_EXERCICIO events
      outras: number;      // atividades avulsas (trabalho sem vínculo a processo do GPC)
      total: number;       // = analises + posicoes + movimentos + correcoes + exercicios + outras (Cadastros excluded, same as screen)
      paginas: number;
      horas: number;        // soma de horas registradas nas atividades avulsas
    }[];
    eventos: {
      registro_id: number;
      responsavel: string;
      evento: string;
      data_evento: string;
      obs?: string | null;
      num_paginas_analise?: number | null;
    }[];
    atividades: GpcAtividadeAvulsa[];
  }> => {
    // Reuse existing aggregated source (both prod table + fluxo_tecnico)
    const GpcServiceSelf = (GpcService as any);
    const all: { registro_id: number; responsavel: string; evento: string; data_evento: string; obs?: string | null; num_paginas_analise?: number | null }[] =
      await GpcServiceSelf.getProdutividadeDetalhado();

    // Build pagesByProcesso from cgof_gpc_recebidos.num_paginas — registro_id references
    // cgof_gpc_recebidos.codigo (same source the screen uses via allRows), NOT cgof_gpc_processos
    // (a different table with its own independent codigo sequence).
    // fetchAllRows: mesma proteção contra o limite de 1000 linhas usada nas outras consultas
    // desta tela — hoje essa consulta filtrada tem menos de 1000 linhas, mas cresce com o tempo.
    const recebidosData = await fetchAllRows<{ codigo: number; num_paginas: number | null }>(
      'cgof_gpc_recebidos', 'codigo, num_paginas',
      q => q.not('num_paginas', 'is', null),
    );
    const pagesByProcesso = new Map<number, number>();
    for (const p of (recebidosData ?? [])) {
      if (p.codigo != null && p.num_paginas) pagesByProcesso.set(p.codigo as number, p.num_paginas as number);
    }

    // Filter by period using the browser's local date fields (mirrors periodoKey() in
    // GpcProcessos_v2.tsx). data_evento is a UTC timestamptz string; a raw string-prefix
    // match would misattribute events near month boundaries to the wrong month.
    const target = mes ? `${ano}-${mes}` : ano;
    const filtered = all.filter(e => localPeriodKey(e.data_evento, mes ? 'mes' : 'ano') === target);

    // Atividades avulsas (trabalho sem vínculo a processo do GPC) — mesma filtragem por período.
    const allAtividades = await GpcServiceSelf.getAtividadesAvulsas() as GpcAtividadeAvulsa[];
    const atividadesFiltradas = allAtividades.filter(a => localPeriodKey(a.data_atividade, mes ? 'mes' : 'ano') === target);

    // Aggregate per technician — mirrors computeStats() in GpcProcessos_v2.tsx exactly:
    //   - CORRECAO is trabalho analítico próprio, contado em sua própria categoria (não em movimentos)
    //   - Total = analises + posicoes + movimentos + correcoes + exercicios + outras (Cadastros NOT counted)
    //   - Pages: official num_paginas for INICIO_ANALISE (deduped); num_paginas_analise for CORRECAO
    type Stats = {
      cadastros: number;
      analises: Set<number>;
      posicoes: number;
      movimentos: number;
      correcoes: number;
      exercicios: number;
      outras: number;
      seenAnalise: Set<number>;
      paginas: number;
      horas: number;
    };
    const map: Record<string, Stats> = {};
    const getBucket = (responsavel: string) => {
      if (!map[responsavel]) {
        map[responsavel] = { cadastros: 0, analises: new Set(), posicoes: 0, movimentos: 0, correcoes: 0, exercicios: 0, outras: 0, seenAnalise: new Set(), paginas: 0, horas: 0 };
      }
      return map[responsavel];
    };
    for (const e of filtered) {
      const s = getBucket(e.responsavel);
      if (e.evento === 'CADASTRO')       s.cadastros++;
      if (e.evento === 'INICIO_ANALISE') {
        s.analises.add(e.registro_id);
        if (!s.seenAnalise.has(e.registro_id)) {
          // Primary: official process page count; fallback: event field
          s.paginas += pagesByProcesso.get(e.registro_id) ?? e.num_paginas_analise ?? 0;
          s.seenAnalise.add(e.registro_id);
        }
      }
      if (e.evento === 'POSICAO')        s.posicoes++;
      if (e.evento === 'MOVIMENTO')      s.movimentos++;
      if (e.evento === 'CORRECAO') {
        s.correcoes++;
        s.paginas += e.num_paginas_analise ?? pagesByProcesso.get(e.registro_id) ?? 0;
      }
      if (e.evento === 'CADASTRO_EXERCICIO') s.exercicios++;
    }
    for (const a of atividadesFiltradas) {
      const s = getBucket(a.tecnico);
      s.outras++;
      s.horas += a.horas ?? 0;
      s.paginas += a.paginas ?? 0;
    }

    const resumo = Object.entries(map).map(([responsavel, s]) => ({
      responsavel,
      cadastros: s.cadastros,
      analises: s.analises.size,
      posicoes: s.posicoes,
      movimentos: s.movimentos,
      correcoes: s.correcoes,
      exercicios: s.exercicios,
      outras: s.outras,
      total: s.analises.size + s.posicoes + s.movimentos + s.correcoes + s.exercicios + s.outras, // mirrors screen (no cadastros)
      paginas: s.paginas,
      horas: s.horas,
    })).sort((a, b) => b.total - a.total);

    return { resumo, eventos: filtered, atividades: atividadesFiltradas };
  },
};

