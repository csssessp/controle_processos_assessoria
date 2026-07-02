import { supabase } from './supabaseClient';
import {
  GpcProcesso, GpcExercicio, GpcHistorico, GpcObjeto,
  GpcParcelamento, GpcTa, GpcPosicao, GpcClassificacao, GpcProcessoFull, GpcRecebido, GpcProdutividade, GpcFluxoTecnico
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
  total_convenio: number; // SOMA(EXERCICIOS.REPASSE) - apenas repasse
  saldo: number;          // ex_ant + repasse + aplicacao - gastos - devolvido
}

// Normaliza nome de técnico/responsável (trim + colapsa espaços + Title Case) para que
// grafias divergentes vindas de cadastros antigos em texto livre (ex.: "ROSEMARIA" vs
// "Rosemaria") sejam agrupadas como a mesma pessoa em vez de virarem linhas separadas
// na produtividade.
function normalizeNomeTecnico(nome: string): string {
  return nome
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase());
}

export const GpcService = {

  // ── LOOKUPS ──────────────────────────────────────────────────────────────

  getPosicoes: async (): Promise<GpcPosicao[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_posicao')
      .select('*')
      .order('codigo');
    if (error) { console.error(error); return []; }
    return data as GpcPosicao[];
  },

  getGpcUsers: async (): Promise<{ id: string; name: string }[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('active', true)
      .or('role.in.(GPC,ADMIN),areas.cs.["gpc"]')
      .order('name');
    if (error) { console.error(error); return []; }
    return (data ?? []) as { id: string; name: string }[];
  },

  getSignatoryUsers: async (): Promise<{ id: string; name: string }[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name')
      .eq('active', true)
      .eq('can_sign', true)
      .order('name');
    if (error) { console.error(error); return []; }
    return (data ?? []) as { id: string; name: string }[];
  },

  getClassificacoes: async (): Promise<GpcClassificacao[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_classificacao')
      .select('*')
      .order('indice');
    if (error) { console.error(error); return []; }
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
    if (error) { console.error(error); return { data: [], count: 0 }; }
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
      historicos = (hRows ?? []).map((h: any) => ({
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
    // Fetch all process numbers (only the column we need, no limit)
    const { data, error } = await supabase
      .from('cgof_gpc_recebidos')
      .select('processo')
      .not('processo', 'is', null);
    if (error) { console.error(error); return 0; }
    return (data ?? []).filter((r: any) => norm(r.processo ?? '') === needle).length;
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
    const { data, error } = await supabase
      .from('cgof_gpc_recebidos')
      .select('codigo, processo_codigo, processo, convenio, entidade, exercicio, data, cgof_gpc_posicao(posicao)')
      .not('processo', 'is', null);
    if (error) { console.error(error); return []; }

    const matches = (data ?? []).filter((r: any) => norm(r.processo ?? '') === needle);
    const groups = new Map<string, {
      processo_codigo: number | null;
      processo: string;
      convenio: string | null;
      entidade: string | null;
      rounds: { codigo: number; exercicio: string | null; posicao: string | null; data: string | null }[];
    }>();
    for (const r of matches as any[]) {
      // Linhas sem processo_codigo (cadastros antigos não vinculados) viram grupos
      // individuais — não há mestre para linkar.
      const key = r.processo_codigo != null ? `p${r.processo_codigo}` : `r${r.codigo}`;
      if (!groups.has(key)) {
        groups.set(key, {
          processo_codigo: r.processo_codigo ?? null,
          processo: r.processo,
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
    if (error) { console.error(error); return []; }
    return (data ?? []).map((r: any) => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    })) as GpcRecebido[];
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
    const [procCount, exCount, parcCount, taCount, byDrsRows, byTipoRows, parcAtivos, repasse, parcDetalhes] = await Promise.all([
      supabase.from('cgof_gpc_processos').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_exercicio').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_parcelamento').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_ta').select('*', { count: 'exact', head: true }),
      supabase.from('cgof_gpc_processos').select('drs').not('drs', 'is', null),
      supabase.from('cgof_gpc_processos').select('tipo').not('tipo', 'is', null),
      supabase.from('cgof_gpc_parcelamento').select('*', { count: 'exact', head: true }).eq('em_dia', true),
      supabase.from('cgof_gpc_exercicio').select('repasse'),
      supabase.from('cgof_gpc_parcelamento').select('*, cgof_gpc_processos(processo, convenio, entidade)'),
    ]);

    // Aggregate DRS
    const drsCounts: Record<number, number> = {};
    for (const r of byDrsRows.data ?? []) {
      drsCounts[r.drs] = (drsCounts[r.drs] ?? 0) + 1;
    }
    const byDrs = Object.entries(drsCounts)
      .map(([drs, count]) => ({ drs: Number(drs), count }))
      .sort((a, b) => b.count - a.count);

    // Aggregate Tipo
    const tipoCounts: Record<string, number> = {};
    for (const r of byTipoRows.data ?? []) {
      const t = r.tipo ?? 'N/A';
      tipoCounts[t] = (tipoCounts[t] ?? 0) + 1;
    }
    const byTipo = Object.entries(tipoCounts)
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count);

    const valorTotalRepasse = (repasse.data ?? []).reduce((sum: number, r: any) => sum + (r.repasse ?? 0), 0);

    const parcelamentosDetalhes = (parcDetalhes.data ?? []).map((p: any) => ({
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
    const BATCH = 1000;
    let all: GpcRecebido[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('cgof_gpc_recebidos')
        .select('*, cgof_gpc_posicao(posicao)')
        .order('codigo', { ascending: false })
        .range(from, from + BATCH - 1);
      if (error) { console.error(error); break; }
      const rows = ((data ?? []) as any[]).map((r) => ({
        ...r,
        posicao: r.cgof_gpc_posicao?.posicao ?? null,
      })) as GpcRecebido[];
      all = all.concat(rows);
      if (rows.length < BATCH) break;
      from += BATCH;
    }
    return all;
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
    if (error) { console.error(error); return { data: [], count: 0 }; }

    const rows = (data ?? []).map((r: any) => ({
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
    if (error) { console.error(error); return null; }
    return { ...(data as any), posicao: (data as any).cgof_gpc_posicao?.posicao ?? null } as GpcRecebido;
  },

  saveRecebido: async (r: Partial<GpcRecebido>): Promise<GpcRecebido> => {
    const payload = {
      processo_codigo: r.processo_codigo ?? null,
      processo: r.processo ?? null,
      entidade: r.entidade ?? null,
      convenio: r.convenio ?? null,
      exercicio: r.exercicio ?? null,
      drs: r.drs ?? null,
      data: r.data ?? null,
      responsavel: r.responsaveis_analise?.[0] ?? r.responsavel ?? null, // primary analyst for backward compat
      responsavel_cadastro: r.responsavel_cadastro ?? null,
      responsaveis_analise: r.responsaveis_analise ?? null,
      posicao_id: r.posicao_id ?? null,
      movimento: r.movimento ?? null,
      link_processo: r.link_processo ?? null,
      is_parcelamento: r.is_parcelamento ?? false,
      remessa: r.remessa ?? null,
      num_paginas: r.num_paginas ?? null,
      responsavel_assinatura: r.responsavel_assinatura ?? null,
      responsavel_assinatura_2: r.responsavel_assinatura_2 ?? null,
      situacao: r.situacao ?? null,
      irregular_tipos: r.irregular_tipos ?? null,
      valor_a_devolver: r.valor_a_devolver ?? null,
      valor_devolvido: r.valor_devolvido ?? null,
      situacao_obs: r.situacao_obs ?? null,
      valor_convenio: r.valor_convenio ?? null,
      correcao_paginas: r.correcao_paginas ?? null,
      correcao_obs: r.correcao_obs ?? null,
    };
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
    if (error) { console.error(error); return []; }
    return (data ?? []).map((r: any) => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? r.posicao ?? null,
    })) as GpcProdutividade[];
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

  getProdutividadeResumo: async (): Promise<{ responsavel: string; mes: string; count: number }[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_produtividade')
      .select('responsavel, data_evento')
      .not('responsavel', 'is', null);
    if (error) { console.error(error); return []; }
    const counts: Record<string, number> = {};
    for (const r of data ?? []) {
      const mes = (r.data_evento as string).slice(0, 7);
      const key = `${r.responsavel}||${mes}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).map(([key, count]) => {
      const sep = key.lastIndexOf('||');
      return { responsavel: key.slice(0, sep), mes: key.slice(sep + 2), count };
    }).sort((a, b) => b.mes.localeCompare(a.mes) || b.count - a.count);
  },

  getProdutividadeDetalhado: async (): Promise<{ registro_id: number; responsavel: string; evento: string; data_evento: string; obs?: string | null; num_paginas_analise?: number | null }[]> => {
    // Source 1: cgof_gpc_produtividade — only CADASTRO + INICIO_ANALISE (fired by DB triggers, dates are always correct)
    const { data: prodData, error: prodError } = await supabase
      .from('cgof_gpc_produtividade')
      .select('registro_id, responsavel, evento, data_evento, obs')
      .not('responsavel', 'is', null)
      .in('evento', ['INICIO_ANALISE', 'CADASTRO'])
      .order('data_evento', { ascending: true });
    if (prodError) console.error(prodError);

    // Source 2: cgof_gpc_fluxo_tecnico — POSICAO + MOVIMENTO events (real retroactive dates from user input)
    const { data: fluxoData, error: fluxoError } = await supabase
      .from('cgof_gpc_fluxo_tecnico')
      .select('registro_id, tecnico, data_evento, posicao_id, movimento, acao, num_paginas_analise')
      .not('tecnico', 'is', null)
      .order('data_evento', { ascending: true });
    if (fluxoError) console.error(fluxoError);

    const fluxoEvents = (fluxoData ?? []).map((f: any) => {
      const mov = (f.movimento ?? '') as string;
      const acao = (f.acao ?? '') as string;
      // Events with movement text → MOVIMENTO; pure position change (no movement text) → POSICAO
      // Analysis events from fluxo → INICIO_ANALISE (trigger may also log it, Set deduplicates count)
      let evento: string;
      if (mov === 'CORREÇÃO DOCUMENTAL') {
        evento = 'CORRECAO';
      } else if (mov === 'EM ANÁLISE' || mov === 'INÍCIO DA ANÁLISE' || acao.toUpperCase().includes('ANÁLISE')) {
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

    const prodEvents = (prodData ?? []).map((p: any) => ({
      registro_id: p.registro_id as number,
      responsavel: normalizeNomeTecnico(p.responsavel as string),
      evento: p.evento as string,
      data_evento: p.data_evento as string,
      obs: p.obs as string | null,
    }));

    return [...prodEvents, ...fluxoEvents]
      .sort((a, b) => a.data_evento.localeCompare(b.data_evento));
  },

  // ── FLUXO TÉCNICO ───────────────────────────────────────────────────────

  getFluxoTecnico: async (registroId: number): Promise<GpcFluxoTecnico[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_fluxo_tecnico')
      .select('*, cgof_gpc_posicao(posicao)')
      .eq('registro_id', registroId)
      .order('data_evento', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []).map((r: any) => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? r.posicao ?? null,
    })) as GpcFluxoTecnico[];
  },

  saveFluxoTecnico: async (f: Partial<GpcFluxoTecnico>): Promise<GpcFluxoTecnico> => {
    const payload = {
      registro_id: f.registro_id,
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
    // Sync position/movement back to main record
    if (f.registro_id && (f.posicao_id || f.movimento)) {
      const update: Record<string, any> = {};
      if (f.posicao_id) update.posicao_id = f.posicao_id;
      if (f.movimento) update.movimento = f.movimento;
      await supabase.from('cgof_gpc_recebidos').update(update).eq('codigo', f.registro_id);
    }
    return saved;
  },

  deleteFluxoTecnico: async (id: number): Promise<void> => {
    const { error } = await supabase.from('cgof_gpc_fluxo_tecnico').delete().eq('id', id);
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
    const { data, error } = await supabase
      .from('cgof_gpc_recebidos')
      .select('posicao_id, remessa, responsavel, is_parcelamento, num_paginas, entidade, created_at, cgof_gpc_posicao(posicao)');
    if (error) { console.error(error); return null; }

    const rows = (data ?? []).map((r: any) => ({
      ...r,
      posicao: r.cgof_gpc_posicao?.posicao ?? null,
    }));

    const total = rows.length;

    // By posição
    const posMap: Record<string, number> = {};
    rows.forEach((r: any) => { const k = r.posicao ?? 'Não definida'; posMap[k] = (posMap[k] || 0) + 1; });
    const byPosicao = Object.entries(posMap).map(([posicao, count]) => ({ posicao, count })).sort((a, b) => b.count - a.count);

    // By remessa
    const remMap: Record<string, number> = {};
    rows.forEach((r: any) => {
      const k = r.remessa === 'ACIMA' ? 'Acima de Remessa' : r.remessa === 'ABAIXO' ? 'Abaixo de Remessa' : 'Não Informado';
      remMap[k] = (remMap[k] || 0) + 1;
    });
    const byRemessa = Object.entries(remMap).map(([remessa, count]) => ({ remessa, count })).filter(r => r.count > 0);

    // By responsável (top 8)
    const respMap: Record<string, number> = {};
    rows.forEach((r: any) => { if (r.responsavel) { respMap[r.responsavel] = (respMap[r.responsavel] || 0) + 1; } });
    const byResponsavel = Object.entries(respMap).map(([responsavel, count]) => ({ responsavel, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // Parcelamento
    const comParcelamento = rows.filter((r: any) => r.is_parcelamento).length;
    const semParcelamento = total - comParcelamento;

    // Complexidade
    const cxBuckets: { label: string; count: number; color: string }[] = [
      { label: 'Baixa (≤50)', count: 0, color: '#22c55e' },
      { label: 'Média (51-200)', count: 0, color: '#f59e0b' },
      { label: 'Alta (201-500)', count: 0, color: '#f97316' },
      { label: 'Muito Alta (>500)', count: 0, color: '#ef4444' },
      { label: 'Não informado', count: 0, color: '#94a3b8' },
    ];
    rows.forEach((r: any) => {
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
    rows.forEach((r: any) => { if (r.entidade) { entMap[r.entidade] = (entMap[r.entidade] || 0) + 1; } });
    const topEntidades = Object.entries(entMap).map(([entidade, count]) => ({ entidade, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // By mês (last 6 months)
    const mesMap: Record<string, number> = {};
    rows.forEach((r: any) => { if (r.created_at) { const mes = (r.created_at as string).slice(0, 7); mesMap[mes] = (mesMap[mes] || 0) + 1; } });
    const byMes = Object.entries(mesMap).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, count]) => ({ mes, count }));

    return { total, byPosicao, byRemessa, byResponsavel, comParcelamento, semParcelamento, complexidade, topEntidades, byMes };
  },

  getFluxoResumoTecnicos: async (): Promise<{
    tecnico: string;
    total_registros: number;
    total_paginas: number;
    tempo_medio_dias: number;
    ultimo_evento: string;
  }[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_fluxo_tecnico')
      .select('tecnico, registro_id, data_evento, tempo_dias, num_paginas_analise')
      .not('tecnico', 'is', null)
      .order('data_evento', { ascending: true }); // ascending so first event comes first
    if (error) { console.error(error); return []; }

    // To avoid page duplication: track which (tecnico, registro_id) pairs we already counted pages for
    const paginasContadas = new Set<string>();
    const map: Record<string, { count: number; paginas: number; tempos: number[]; ultimo: string }> = {};
    for (const r of data ?? []) {
      const t = normalizeNomeTecnico(r.tecnico as string);
      if (!map[t]) map[t] = { count: 0, paginas: 0, tempos: [], ultimo: '' };
      map[t].count++;
      // Count pages only once per (tecnico, registro_id) — use the first event's value
      const paginasKey = `${t}||${r.registro_id}`;
      if (r.num_paginas_analise && !paginasContadas.has(paginasKey)) {
        map[t].paginas += r.num_paginas_analise;
        paginasContadas.add(paginasKey);
      }
      if (r.tempo_dias != null) map[t].tempos.push(r.tempo_dias);
      if (r.data_evento > map[t].ultimo) map[t].ultimo = r.data_evento;
    }
    return Object.entries(map).map(([tecnico, s]) => ({
      tecnico,
      total_registros: s.count,
      total_paginas: s.paginas,
      tempo_medio_dias: s.tempos.length > 0 ? Math.round(s.tempos.reduce((a, b) => a + b, 0) / s.tempos.length) : 0,
      ultimo_evento: s.ultimo,
    })).sort((a, b) => b.total_registros - a.total_registros);
  },

  getExerciciosRelatorio: async (): Promise<ExercicioRelatorio[]> => {
    // Paginate to bypass PostgREST default 1000-row limit on hosted Supabase.
    // Includes rows with NULL financial data (exercises registered but not yet filled).
    const PAGE = 1000;
    let all: any[] = [];
    let from = 0;
    while (true) {
      const { data, error } = await supabase
        .from('cgof_gpc_exercicio')
        .select('*, cgof_gpc_processos(processo, convenio, entidade)')
        .order('processo_id', { ascending: true })
        .order('exercicio', { ascending: true })
        .range(from, from + PAGE - 1);
      if (error) { console.error(error); break; }
      all = [...all, ...(data ?? [])];
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }

    return all.map((e: any) => {
      const repasse   = e.repasse   ?? 0;
      const aplicacao = e.aplicacao ?? 0;
      const exAnt     = e.exercicio_anterior ?? 0;
      const gastos    = e.gastos    ?? 0;
      const devolvido = e.devolvido ?? 0;
      const total_convenio = repasse; // CORRIGIDO: Total do Convênio = apenas REPASSE
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
    const { data, error } = await supabase
      .from('cgof_gpc_processos')
      .select('*')
      .order('codigo', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []) as GpcProcesso[];
  },

  getAllTasExport: async (): Promise<(GpcTa & { processo: string | null; convenio: string | null; entidade: string | null })[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_ta')
      .select('*, cgof_gpc_processos(processo, convenio, entidade)')
      .order('processo_id', { ascending: true })
      .order('data', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []).map((t: any) => ({
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
      movimentos: number; // includes CORRECAO (same as screen)
      total: number;       // = analises + posicoes + movimentos (Cadastros excluded, same as screen)
      paginas: number;
    }[];
    eventos: {
      registro_id: number;
      responsavel: string;
      evento: string;
      data_evento: string;
      obs?: string | null;
      num_paginas_analise?: number | null;
    }[];
  }> => {
    // Reuse existing aggregated source (both prod table + fluxo_tecnico)
    const GpcServiceSelf = (GpcService as any);
    const all: { registro_id: number; responsavel: string; evento: string; data_evento: string; obs?: string | null; num_paginas_analise?: number | null }[] =
      await GpcServiceSelf.getProdutividadeDetalhado();

    // Build pagesByProcesso from cgof_gpc_recebidos.num_paginas — registro_id references
    // cgof_gpc_recebidos.codigo (same source the screen uses via allRows), NOT cgof_gpc_processos
    // (a different table with its own independent codigo sequence).
    const { data: recebidosData } = await supabase
      .from('cgof_gpc_recebidos')
      .select('codigo, num_paginas')
      .not('num_paginas', 'is', null);
    const pagesByProcesso = new Map<number, number>();
    for (const p of (recebidosData ?? [])) {
      if (p.codigo != null && p.num_paginas) pagesByProcesso.set(p.codigo as number, p.num_paginas as number);
    }

    // Filter by period using the browser's local date fields (mirrors periodoKey() in
    // GpcProcessos_v2.tsx). data_evento is a UTC timestamptz string; a raw string-prefix
    // match would misattribute events near month boundaries to the wrong month.
    const periodKey = (dataEvento: string): string => {
      const dt = new Date(dataEvento);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      return mes ? `${y}-${m}` : String(y);
    };
    const target = mes ? `${ano}-${mes}` : ano;
    const filtered = all.filter(e => periodKey(e.data_evento) === target);

    // Aggregate per technician — mirrors computeStats() in GpcProcessos_v2.tsx exactly:
    //   - CORRECAO counted inside movimentos (not separately)
    //   - Total = analises + posicoes + movimentos (Cadastros NOT counted)
    //   - Pages: official num_paginas for INICIO_ANALISE (deduped); num_paginas_analise for CORRECAO
    type Stats = {
      cadastros: number;
      analises: Set<number>;
      posicoes: number;
      movimentos: number;
      seenAnalise: Set<number>;
      paginas: number;
    };
    const map: Record<string, Stats> = {};
    for (const e of filtered) {
      if (!map[e.responsavel]) {
        map[e.responsavel] = { cadastros: 0, analises: new Set(), posicoes: 0, movimentos: 0, seenAnalise: new Set(), paginas: 0 };
      }
      const s = map[e.responsavel];
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
        s.movimentos++; // counted as movement on screen
        s.paginas += e.num_paginas_analise ?? pagesByProcesso.get(e.registro_id) ?? 0;
      }
    }

    const resumo = Object.entries(map).map(([responsavel, s]) => ({
      responsavel,
      cadastros: s.cadastros,
      analises: s.analises.size,
      posicoes: s.posicoes,
      movimentos: s.movimentos,
      total: s.analises.size + s.posicoes + s.movimentos, // mirrors screen (no cadastros)
      paginas: s.paginas,
    })).sort((a, b) => b.total - a.total);

    return { resumo, eventos: filtered };
  },
};

