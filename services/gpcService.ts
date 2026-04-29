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
      tipo_parcelamento: p.tipo_parcelamento ?? null,
      exercicio: p.exercicio ?? null,
      exercicios: p.exercicios ?? [],
      valor_parcelado: p.valor_parcelado ?? null,
      valor_corrigido: p.valor_corrigido ?? null,
      parcelas: p.parcelas ?? null,
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
        .order('data', { ascending: false })
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
      valor_a_devolver: r.valor_a_devolver ?? null,
      valor_devolvido: r.valor_devolvido ?? null,
      situacao_obs: r.situacao_obs ?? null,
      valor_convenio: r.valor_convenio ?? null,
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

  getProdutividadeDetalhado: async (): Promise<{ registro_id: number; responsavel: string; evento: string; data_evento: string; obs?: string | null }[]> => {
    const { data, error } = await supabase
      .from('cgof_gpc_produtividade')
      .select('registro_id, responsavel, evento, data_evento, obs')
      .not('responsavel', 'is', null)
      .in('evento', ['INICIO_ANALISE', 'POSICAO', 'MOVIMENTO', 'CADASTRO'])
      .order('data_evento', { ascending: true });
    if (error) { console.error(error); return []; }
    return (data ?? []) as { registro_id: number; responsavel: string; evento: string; data_evento: string }[];
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
      .select('tecnico, data_evento, tempo_dias, num_paginas_analise')
      .not('tecnico', 'is', null);
    if (error) { console.error(error); return []; }
    const map: Record<string, { count: number; paginas: number; tempos: number[]; ultimo: string }> = {};
    for (const r of data ?? []) {
      const t = r.tecnico as string;
      if (!map[t]) map[t] = { count: 0, paginas: 0, tempos: [], ultimo: '' };
      map[t].count++;
      if (r.num_paginas_analise) map[t].paginas += r.num_paginas_analise;
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
};

