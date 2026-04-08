import { supabase } from './supabaseClient';
import {
  GpcProcesso, GpcExercicio, GpcHistorico, GpcObjeto,
  GpcParcelamento, GpcTa, GpcPosicao, GpcClassificacao, GpcProcessoFull, GpcRecebido, GpcProdutividade
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
      .in('role', ['GPC', 'ADMIN'])
      .eq('active', true)
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
      exercicio: p.exercicio ?? null,
      valor_parcelado: p.valor_parcelado ?? null,
      valor_corrigido: p.valor_corrigido ?? null,
      parcelas: p.parcelas ?? null,
      em_dia: p.em_dia ?? false,
      parcelas_concluidas: p.parcelas_concluidas ?? false,
      providencias: p.providencias ?? null,
      obs: p.obs ?? null,
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

  getRecebidos: async (search = '', page = 1, pageSize = 25): Promise<{ data: GpcRecebido[]; count: number }> => {
    let query = supabase
      .from('cgof_gpc_recebidos')
      .select('*, cgof_gpc_posicao(posicao)', { count: 'exact' })
      .order('data', { ascending: false })
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

  saveRecebido: async (r: Partial<GpcRecebido>): Promise<GpcRecebido> => {
    const payload = {
      processo_codigo: r.processo_codigo ?? null,
      processo: r.processo ?? null,
      entidade: r.entidade ?? null,
      convenio: r.convenio ?? null,
      exercicio: r.exercicio ?? null,
      drs: r.drs ?? null,
      data: r.data ?? null,
      responsavel: r.responsavel ?? null,
      posicao_id: r.posicao_id ?? null,
      movimento: r.movimento ?? null,
      link_processo: r.link_processo ?? null,
      is_parcelamento: r.is_parcelamento ?? false,
      remessa: r.remessa ?? null,
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

  getProdutividadeDetalhado: async (): Promise<{ registro_id: number; responsavel: string; evento: string; data_evento: string }[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_produtividade')
      .select('registro_id, responsavel, evento, data_evento')
      .not('responsavel', 'is', null)
      .in('evento', ['INICIO_ANALISE', 'POSICAO', 'MOVIMENTO'])
      .order('data_evento', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []) as { registro_id: number; responsavel: string; evento: string; data_evento: string }[];
  },
};

