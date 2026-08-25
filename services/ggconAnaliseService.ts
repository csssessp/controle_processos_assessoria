import { supabase } from './supabaseClient';
import { emitError } from './errorBus';
import { DbService } from './dbService';
import {
  GgconAnalise, GgconAnaliseItem, GgconAnaliseHistorico, GgconAnaliseStatus,
  GgconAnaliseResposta, GgconTipoConveniada, userHasArea, UserRole,
} from '../types';
import { CHECKLISTS } from './ggconAnaliseChecklists';

function notifyFetchError(): void {
  emitError('Não foi possível carregar os dados. Tente novamente.');
}

// Busca todas as linhas de uma tabela em blocos de 1000, contornando o limite padrão
// do PostgREST hospedado no Supabase (mesmo helper usado em ggconService.ts/gpcService.ts).
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

const hoje = () => new Date().toISOString().slice(0, 10);

// Não lança erro se o insert falhar — o registro no histórico é auditoria secundária;
// a mudança de estado principal (status/analista/datas) já foi gravada com sucesso
// antes desta chamada em todos os pontos de uso, então uma falha aqui não deve fazer
// a tela reportar a ação inteira como "falhou" quando na prática ela já aconteceu.
async function registrarEvento(
  analiseId: number,
  evento: GgconAnaliseHistorico['evento'],
  opts: { analistaAnterior?: string | null; analistaNovo?: string | null; usuarioResponsavel?: string | null; observacao?: string | null } = {},
): Promise<void> {
  const { error } = await supabase.from('cgof_ggcon_analise_historico').insert({
    analise_id: analiseId,
    evento,
    analista_anterior: opts.analistaAnterior ?? null,
    analista_novo: opts.analistaNovo ?? null,
    usuario_responsavel: opts.usuarioResponsavel ?? null,
    observacao: opts.observacao ?? null,
  });
  if (error) console.error('Falha ao registrar evento no histórico (ação principal já foi aplicada):', error);
}

// 'EM_ANDAMENTO' é um pseudo-status usado só no filtro da tela (card-resumo "Em
// andamento") — cobre AGUARDANDO_ANALISE + EM_ANALISE, que não é um valor real da
// coluna status.
export type GgconAnaliseFiltroStatus = GgconAnaliseStatus | 'EM_ANDAMENTO' | '';

export type GgconAnaliseSortField =
  | 'processo_sei' | 'convenio_numero' | 'interessado' | 'tipo_conveniada' | 'status' | 'analista_atual'
  | 'data_recebimento' | 'data_liberacao' | 'data_analise' | 'data_encaminhamento';

export interface GgconAnaliseFiltro {
  search?: string;
  status?: GgconAnaliseFiltroStatus;
  analista?: string;
  tipoConveniada?: GgconTipoConveniada | '';
  page?: number;
  pageSize?: number;
  sortBy?: GgconAnaliseSortField;
  sortOrder?: 'asc' | 'desc';
}

// Anexa a contagem de itens respondidos/total a cada análise (progresso do checklist
// exibido na listagem) — uma query em cgof_ggcon_analise_itens por página, não por
// linha. Usa fetchAllRows (não uma query direta) porque uma página de 25 análises
// pode facilmente somar mais de 1000 itens (25 × até 47 itens cada) — sem paginar,
// o limite padrão do PostgREST cortava o resultado e algumas linhas apareciam com
// progresso zerado mesmo já tendo o checklist criado (bug real, achado testando a
// tela — mesma armadilha de outras telas do sistema com o limite de 1000 linhas).
async function comProgresso(rows: GgconAnalise[]): Promise<GgconAnalise[]> {
  if (!rows.length) return rows;
  const ids = rows.map(r => r.id);
  const data = await fetchAllRows<{ analise_id: number; resposta: string | null }>(
    'cgof_ggcon_analise_itens', 'analise_id, resposta',
    q => q.in('analise_id', ids),
  );
  const totais = new Map<number, { total: number; respondidos: number }>();
  for (const item of data) {
    const cur = totais.get(item.analise_id) ?? { total: 0, respondidos: 0 };
    cur.total += 1;
    if (item.resposta) cur.respondidos += 1;
    totais.set(item.analise_id, cur);
  }
  return rows.map(r => ({
    ...r,
    itens_total: totais.get(r.id)?.total ?? 0,
    itens_respondidos: totais.get(r.id)?.respondidos ?? 0,
  }));
}

export const GgconAnaliseService = {
  getFila: async (f: GgconAnaliseFiltro = {}): Promise<{ data: GgconAnalise[]; count: number }> => {
    const {
      search = '', status = '', analista = '', tipoConveniada = '', page = 1, pageSize = 25,
      sortBy = 'data_recebimento', sortOrder = 'desc',
    } = f;
    let query = supabase
      .from('cgof_ggcon_analises')
      .select('*', { count: 'exact' })
      // Processos novos (criados automaticamente, ainda sem liberação) sempre no
      // topo, independente da ordenação escolhida — mesmo padrão de `urgente` em
      // cgof_ggcon_processos (ver GgconService.getProcessos).
      .order('novo_destaque', { ascending: false })
      .order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })
      .order('id', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search.trim()) {
      query = query.or(`processo_sei.ilike.%${search}%,convenio_numero.ilike.%${search}%,interessado.ilike.%${search}%`);
    }
    if (status === 'EM_ANDAMENTO') query = query.in('status', ['AGUARDANDO_ANALISE', 'EM_ANALISE', 'AGUARDANDO_ASSINATURA', 'CONFERENCIA_PENDENCIA']);
    else if (status) query = query.eq('status', status);
    if (analista.trim()) query = query.eq('analista_atual', analista);
    if (tipoConveniada) query = query.eq('tipo_conveniada', tipoConveniada);

    const { data, error, count } = await query;
    if (error) { console.error(error); notifyFetchError(); return { data: [], count: 0 }; }
    return { data: await comProgresso((data ?? []) as GgconAnalise[]), count: count ?? 0 };
  },

  // Contadores dos cards-resumo do topo da tela — total por status e, quando um
  // analista está logado, quantas dessas são dele especificamente. `aguardandoAssinatura`
  // conta só quem ainda não foi assinado — é a fila de quem tem ggcon_assina (ex.: Marilsa).
  getResumo: async (nomeAnalista?: string | null): Promise<{
    aguardandoLiberacao: number; minhaFila: number; emAndamento: number; aguardandoAssinatura: number; concluidas: number;
  }> => {
    const all = await fetchAllRows<{ status: GgconAnaliseStatus; analista_atual: string | null; data_assinatura: string | null }>(
      'cgof_ggcon_analises', 'status, analista_atual, data_assinatura',
    );
    const meu = (r: { analista_atual: string | null }) => !!nomeAnalista && r.analista_atual === nomeAnalista;
    return {
      aguardandoLiberacao: all.filter(r => r.status === 'AGUARDANDO_LIBERACAO').length,
      minhaFila: all.filter(r => meu(r) && (r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE')).length,
      emAndamento: all.filter(r => r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE' || r.status === 'AGUARDANDO_ASSINATURA' || r.status === 'CONFERENCIA_PENDENCIA').length,
      aguardandoAssinatura: all.filter(r => r.status === 'AGUARDANDO_ASSINATURA' && !r.data_assinatura).length,
      concluidas: all.filter(r => r.status === 'CONCLUIDA').length,
    };
  },

  getAnalistas: async (): Promise<string[]> => {
    const users = await DbService.getUsers();
    return users
      // Admin administra a fila, não é analista — não deve aparecer na distribuição.
      .filter(u => u.active && u.role !== UserRole.ADMIN && userHasArea(u, 'ggcon'))
      .map(u => u.name)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  },

  getById: async (id: number): Promise<GgconAnalise | null> => {
    const { data, error } = await supabase.from('cgof_ggcon_analises').select('*').eq('id', id).single();
    if (error) { console.error(error); notifyFetchError(); return null; }
    return data as GgconAnalise;
  },

  // Usado pela tela "Processos GGCON" para não duplicar o registro de análise quando
  // o mesmo processo (Tipo = Prestação de Contas) é salvo de novo depois de já ter
  // criado uma análise correspondente.
  existeParaProcesso: async (processoSei: string): Promise<boolean> => {
    const { data, error } = await supabase.from('cgof_ggcon_analises').select('id').eq('processo_sei', processoSei).limit(1);
    if (error) { console.error(error); return false; }
    return !!data && data.length > 0;
  },

  getItens: async (analiseId: number): Promise<GgconAnaliseItem[]> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_analise_itens')
      .select('*')
      .eq('analise_id', analiseId)
      .order('item_numero', { ascending: true });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return (data ?? []) as GgconAnaliseItem[];
  },

  getHistorico: async (analiseId: number): Promise<GgconAnaliseHistorico[]> => {
    const { data, error } = await supabase
      .from('cgof_ggcon_analise_historico')
      .select('*')
      .eq('analise_id', analiseId)
      .order('data_evento', { ascending: true });
    if (error) { console.error(error); notifyFetchError(); return []; }
    return (data ?? []) as GgconAnaliseHistorico[];
  },

  // Cadastro do despacho — cria o cabeçalho e, em seguida, os itens do checklist
  // (a partir do template fixo de ggconAnaliseChecklists.ts) já como status inicial
  // AGUARDANDO_LIBERACAO.
  criarAnalise: async (payload: Partial<GgconAnalise>, criadoPor: string): Promise<GgconAnalise> => {
    if (!payload.processo_sei?.trim()) throw new Error('Informe o número do processo SEI.');
    if (!payload.tipo_conveniada) throw new Error('Informe o tipo de conveniada (Entidade ou Prefeitura).');

    const header = {
      processo_sei: payload.processo_sei,
      convenio_numero: payload.convenio_numero ?? null,
      cnpj: payload.cnpj ?? null,
      interessado: payload.interessado ?? null,
      objeto: payload.objeto ?? null,
      custeio: payload.custeio ?? false,
      investimento: payload.investimento ?? false,
      valor_repasse: payload.valor_repasse ?? null,
      vigencia_inicio: payload.vigencia_inicio ?? null,
      vigencia_termino: payload.vigencia_termino ?? null,
      vigencia_prorrogado_ate: payload.vigencia_prorrogado_ate ?? null,
      termo_aditivo_numeros: payload.termo_aditivo_numeros?.length ? payload.termo_aditivo_numeros : null,
      termo_retirratificacao: payload.termo_retirratificacao ?? false,
      resolucao_numero: payload.resolucao_numero ?? null,
      exercicio: payload.exercicio ?? null,
      tipo_conveniada: payload.tipo_conveniada,
      municipio: payload.municipio ?? null,
      drs_unidade: payload.drs_unidade ?? null,
      status: 'AGUARDANDO_LIBERACAO' as GgconAnaliseStatus,
      data_recebimento: payload.data_recebimento ?? hoje(),
      observacoes: payload.observacoes ?? null,
      criado_automaticamente: payload.criado_automaticamente ?? false,
      // Destaque de ordenação (some assim que alguém liberar ou corrigir o status) —
      // só faz sentido para quem já nasce automaticamente, o cadastro manual não precisa.
      novo_destaque: payload.criado_automaticamente ?? false,
      created_by: criadoPor,
    };

    const { data, error } = await supabase.from('cgof_ggcon_analises').insert(header).select().single();
    if (error) throw new Error(error.message);
    const analise = data as GgconAnalise;

    const template = CHECKLISTS[payload.tipo_conveniada];
    const itens = template.map(t => ({
      analise_id: analise.id,
      item_numero: t.numero,
      item_descricao: t.descricao,
    }));
    const { error: itensError } = await supabase.from('cgof_ggcon_analise_itens').insert(itens);
    if (itensError) {
      // Sem isso, uma falha aqui deixaria um cabeçalho "fantasma" sem nenhum item —
      // apareceria na fila com progresso 0/0, sem checklist, sem como concluir nunca.
      await supabase.from('cgof_ggcon_analises').delete().eq('id', analise.id);
      throw new Error(itensError.message);
    }

    return analise;
  },

  // Edição do cabeçalho do despacho (liberador/admin, ou o próprio analista responsável
  // pela análise) — não mexe em status/checklist. A tela trava Nº do Processo SEI sempre
  // e a Data de Recebimento quando quem edita não pode liberar processos.
  atualizarCabecalho: async (id: number, payload: Partial<GgconAnalise>): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      convenio_numero: payload.convenio_numero ?? null,
      cnpj: payload.cnpj ?? null,
      interessado: payload.interessado ?? null,
      objeto: payload.objeto ?? null,
      custeio: payload.custeio ?? false,
      investimento: payload.investimento ?? false,
      valor_repasse: payload.valor_repasse ?? null,
      vigencia_inicio: payload.vigencia_inicio ?? null,
      vigencia_termino: payload.vigencia_termino ?? null,
      vigencia_prorrogado_ate: payload.vigencia_prorrogado_ate ?? null,
      termo_aditivo_numeros: payload.termo_aditivo_numeros?.length ? payload.termo_aditivo_numeros : null,
      termo_retirratificacao: payload.termo_retirratificacao ?? false,
      resolucao_numero: payload.resolucao_numero ?? null,
      exercicio: payload.exercicio ?? null,
      municipio: payload.municipio ?? null,
      drs_unidade: payload.drs_unidade ?? null,
      data_recebimento: payload.data_recebimento ?? null,
      observacoes: payload.observacoes ?? null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Libera o processo para a fila, já atribuindo o analista responsável.
  liberarParaAnalise: async (id: number, analista: string, usuarioResponsavel: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      analista_atual: analista,
      liberado_por: usuarioResponsavel,
      status: 'AGUARDANDO_ANALISE',
      data_liberacao: hoje(),
      novo_destaque: false,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'LIBERADA', { analistaNovo: analista, usuarioResponsavel });
  },

  // Troca o analista responsável a qualquer momento do fluxo — sempre grava no
  // histórico quem era o analista anterior e quem passou a ser o novo.
  reatribuirAnalista: async (id: number, analistaAnterior: string | null, novoAnalista: string, usuarioResponsavel: string, motivo?: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      analista_atual: novoAnalista,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'REATRIBUIDA', {
      analistaAnterior, analistaNovo: novoAnalista, usuarioResponsavel, observacao: motivo ?? null,
    });
  },

  // Primeira abertura do checklist pelo analista responsável.
  iniciarAnalise: async (id: number, usuarioResponsavel: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      status: 'EM_ANALISE',
      data_inicio_analise: hoje(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'INICIADA', { usuarioResponsavel });
  },

  salvarItem: async (itemId: number, payload: { resposta?: GgconAnaliseResposta | null; documento_sei?: string[] | null; observacao?: string | null }): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analise_itens').update({
      ...payload,
      updated_at: new Date().toISOString(),
    }).eq('id', itemId);
    if (error) throw new Error(error.message);
  },

  // Marca a conclusão do preenchimento do checklist — o processo continua com o
  // analista (status EM_ANALISE) até alguém com permissão de liberação liberar para
  // assinatura.
  concluirAnalise: async (id: number, usuarioResponsavel: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      data_analise: hoje(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'CONCLUIDA', { usuarioResponsavel });
  },

  // Alternativa a concluirAnalise: a conferência encontrou algo a corrigir. Pula a
  // etapa de Assinatura e vai direto para Encaminhar (ver validação em `encaminhar`)
  // — a pendência fica registrada permanentemente em data_pendencia/pendencia_descricao,
  // mesmo depois de encaminhado.
  concluirAnaliseComPendencia: async (id: number, usuarioResponsavel: string, descricaoPendencia: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      status: 'CONFERENCIA_PENDENCIA',
      data_analise: hoje(),
      data_pendencia: hoje(),
      pendencia_descricao: descricaoPendencia,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'CONCLUIDA_COM_PENDENCIA', { usuarioResponsavel, observacao: descricaoPendencia });
  },

  // Libera o processo, já com o checklist concluído, para a etapa de assinatura —
  // quem tem a permissão ggcon_assina (ex.: Marilsa) passa a ver o aviso na tela.
  liberarParaAssinatura: async (id: number, usuarioResponsavel: string): Promise<void> => {
    const { data: atual } = await supabase.from('cgof_ggcon_analises').select('status, data_analise').eq('id', id).single();
    if (!atual || (atual as any).status !== 'EM_ANALISE' || !(atual as any).data_analise) {
      throw new Error('Conclua o preenchimento do checklist antes de liberar para assinatura.');
    }
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      status: 'AGUARDANDO_ASSINATURA',
      data_liberacao_assinatura: hoje(),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'LIBERADA_ASSINATURA', { usuarioResponsavel });
  },

  // Confirma a assinatura (quem tem ggcon_assina) — não muda o status (continua
  // AGUARDANDO_ASSINATURA), só carimba data/autor; é essa data que libera o
  // Encaminhar (ver validação em `encaminhar` abaixo).
  confirmarAssinatura: async (id: number, usuarioResponsavel: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      data_assinatura: hoje(),
      assinado_por: usuarioResponsavel,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'ASSINADA', { usuarioResponsavel });
  },

  // Encaminha o processo para fora do GGCON (GPC, DRS, Consultoria Jurídica etc.) —
  // fecha o fluxo de análise. Exige assinatura confirmada antes, a menos que a
  // conferência tenha sido concluída com pendência (pula a assinatura de propósito)
  // ou já esteja Concluída (permite corrigir a área/data de um encaminhamento existente).
  encaminhar: async (id: number, areaEncaminhamento: string, usuarioResponsavel: string): Promise<void> => {
    const { data: atual } = await supabase.from('cgof_ggcon_analises').select('status, data_assinatura').eq('id', id).single();
    const podeEncaminhar = !!atual && ((atual as any).status === 'CONCLUIDA' ||
      (atual as any).status === 'CONFERENCIA_PENDENCIA' ||
      ((atual as any).status === 'AGUARDANDO_ASSINATURA' && !!(atual as any).data_assinatura));
    if (!podeEncaminhar) throw new Error('É necessário confirmar a assinatura antes de encaminhar.');
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      status: 'CONCLUIDA',
      data_encaminhamento: hoje(),
      area_encaminhamento: areaEncaminhamento,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'ENCAMINHADA', { usuarioResponsavel, observacao: areaEncaminhamento });
  },

  deleteAnalise: async (id: number): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Nota de acompanhamento livre (campo "Observações" do cabeçalho) — editável a
  // qualquer momento do fluxo pelo analista responsável ou por quem libera, com
  // autosave no blur do textarea (sem precisar abrir o formulário de Editar Cadastro).
  atualizarObservacoes: async (id: number, observacoes: string | null): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      observacoes: observacoes?.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Reseta a análise: limpa todas as respostas do checklist e as datas de
  // análise/assinatura/pendência/encaminhamento, devolvendo o processo para
  // AGUARDANDO_ANALISE — o analista responsável permanece o mesmo (reatribuir é uma
  // ação separada). Só quem libera processos (podeLiberarAnalise) chama isso, e a
  // tela exige confirmação de senha antes — ver PasswordConfirmModal em GgconAnalise.tsx.
  resetarAnalise: async (id: number, usuarioResponsavel: string, motivo?: string): Promise<void> => {
    const { error: itensError } = await supabase.from('cgof_ggcon_analise_itens').update({
      resposta: null, documento_sei: null, observacao: null, updated_at: new Date().toISOString(),
    }).eq('analise_id', id);
    if (itensError) throw new Error(itensError.message);

    const { error } = await supabase.from('cgof_ggcon_analises').update({
      status: 'AGUARDANDO_ANALISE',
      data_inicio_analise: null,
      data_analise: null,
      data_liberacao_assinatura: null,
      data_assinatura: null,
      assinado_por: null,
      data_pendencia: null,
      pendencia_descricao: null,
      data_encaminhamento: null,
      area_encaminhamento: null,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);

    await registrarEvento(id, 'RESETADA', { usuarioResponsavel, observacao: motivo ?? null });
  },

  // Correção manual do status — só Administrador (checado na tela). Existe
  // principalmente para os registros importados da planilha antiga de controle (já
  // vêm "Concluída" porque já foram finalizados no processo real, mas sem checklist
  // digitalizado aqui) e para qualquer correção pontual que não se encaixe no fluxo
  // automático (Liberar → Iniciar → Concluir → Encaminhar). Não mexe em datas nem no
  // checklist — só no status e, quando o novo status é AGUARDANDO_LIBERACAO, também
  // limpa analista responsável e data de atribuição: por definição, "aguardando
  // liberação" é o estado de quem ainda não foi atribuído a ninguém, então esses
  // campos nunca podem ficar inconsistentes (status "aguardando" com analista/data
  // de atribuição já preenchidos).
  alterarStatus: async (id: number, novoStatus: GgconAnaliseStatus, usuarioResponsavel: string, motivo: string): Promise<void> => {
    const { data: atual } = await supabase.from('cgof_ggcon_analises').select('status').eq('id', id).single();
    const { error } = await supabase.from('cgof_ggcon_analises').update({
      status: novoStatus,
      ...(novoStatus === 'AGUARDANDO_LIBERACAO' ? { analista_atual: null, liberado_por: null, data_liberacao: null } : {}),
      // Correção manual de status = alguém já olhou o registro — não precisa mais
      // do destaque de "novo/sem revisão" no topo da lista.
      novo_destaque: false,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'STATUS_ALTERADO', {
      usuarioResponsavel, observacao: `${(atual as any)?.status ?? '?'} → ${novoStatus}${motivo ? ` — ${motivo}` : ''}`,
    });
  },

  // Apaga o histórico de responsáveis de uma análise (ex.: entradas de teste feitas
  // durante a implantação) — só Administrador chama isso (checado na tela). Deixa um
  // marcador único registrando quem limpou e quando, para o histórico nunca ficar
  // totalmente sem rastro.
  limparHistorico: async (id: number, usuarioResponsavel: string): Promise<void> => {
    const { error } = await supabase.from('cgof_ggcon_analise_historico').delete().eq('analise_id', id);
    if (error) throw new Error(error.message);
    await registrarEvento(id, 'HISTORICO_LIMPO', { usuarioResponsavel });
  },

  // Liberação em lote — mesmo analista para todos os ids selecionados. Usa allSettled
  // (não Promise.all) de propósito: se uma linha falhar (ex.: falha de rede pontual),
  // as outras continuam sendo liberadas normalmente em vez de tudo ser descartado — a
  // tela reporta quantas deram certo e quantas falharam.
  liberarEmLote: async (ids: number[], analista: string, usuarioResponsavel: string): Promise<{ ok: number; falhas: number }> => {
    const resultados = await Promise.allSettled(ids.map(id => GgconAnaliseService.liberarParaAnalise(id, analista, usuarioResponsavel)));
    const ok = resultados.filter(r => r.status === 'fulfilled').length;
    return { ok, falhas: resultados.length - ok };
  },

  // Confirmação de assinatura em lote — mesmo padrão allSettled do liberarEmLote.
  confirmarAssinaturaEmLote: async (ids: number[], usuarioResponsavel: string): Promise<{ ok: number; falhas: number }> => {
    const resultados = await Promise.allSettled(ids.map(id => GgconAnaliseService.confirmarAssinatura(id, usuarioResponsavel)));
    const ok = resultados.filter(r => r.status === 'fulfilled').length;
    return { ok, falhas: resultados.length - ok };
  },

  // Reatribuição em lote — cada item carrega o próprio "analista_anterior" (a lista
  // já vem da tela, que conhece o analista atual de cada linha selecionada), para o
  // histórico registrar corretamente "de quem para quem" em cada uma. Também usa
  // allSettled pelo mesmo motivo de liberarEmLote.
  reatribuirEmLote: async (
    itens: { id: number; analistaAnterior: string | null }[],
    novoAnalista: string,
    usuarioResponsavel: string,
    motivo?: string,
  ): Promise<{ ok: number; falhas: number }> => {
    const resultados = await Promise.allSettled(itens.map(it =>
      GgconAnaliseService.reatribuirAnalista(it.id, it.analistaAnterior, novoAnalista, usuarioResponsavel, motivo),
    ));
    const ok = resultados.filter(r => r.status === 'fulfilled').length;
    return { ok, falhas: resultados.length - ok };
  },

  // Painel gerencial para quem libera processos: carga de trabalho e tempo médio de
  // conclusão por analista — para decidir a quem atribuir os próximos processos e
  // identificar quem está com processos parados há mais tempo.
  getConsolidadoPorAnalista: async (): Promise<{
    analista: string;
    aguardandoAnalise: number;
    emAnalise: number;
    concluidas: number;
    total: number;
    tempoMedioDias: number | null;
    maisAntigoAbertoDias: number | null;
  }[]> => {
    const all = await fetchAllRows<GgconAnalise>('cgof_ggcon_analises', '*');
    const hojeMs = Date.now();
    const diasEntre = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

    const porAnalista = new Map<string, GgconAnalise[]>();
    for (const r of all) {
      if (!r.analista_atual) continue;
      const lista = porAnalista.get(r.analista_atual) ?? [];
      lista.push(r);
      porAnalista.set(r.analista_atual, lista);
    }

    return [...porAnalista.entries()].map(([analista, lista]) => {
      const concluidasComTempo = lista.filter(r => r.status === 'CONCLUIDA' && r.data_liberacao && r.data_encaminhamento);
      const tempos = concluidasComTempo.map(r => diasEntre(r.data_liberacao as string, r.data_encaminhamento as string));
      const abertos = lista.filter(r => r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE');
      const idadesAbertos = abertos
        .map(r => r.data_liberacao ? Math.round((hojeMs - new Date(r.data_liberacao).getTime()) / 86_400_000) : null)
        .filter((d): d is number => d != null);

      return {
        analista,
        aguardandoAnalise: lista.filter(r => r.status === 'AGUARDANDO_ANALISE').length,
        emAnalise: lista.filter(r => r.status === 'EM_ANALISE').length,
        concluidas: lista.filter(r => r.status === 'CONCLUIDA').length,
        total: lista.length,
        tempoMedioDias: tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : null,
        maisAntigoAbertoDias: idadesAbertos.length ? Math.max(...idadesAbertos) : null,
      };
    }).sort((a, b) => (b.aguardandoAnalise + b.emAnalise) - (a.aguardandoAnalise + a.emAnalise));
  },
};
