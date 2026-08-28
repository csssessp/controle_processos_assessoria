-- =============================================================================
-- PARTE 78: GGCON — Encaminhamento ao GPC, Retorno GPC e campo Analista GPC
-- Dois novos status em cgof_ggcon_analises (ENCAMINHADO_GPC, RETORNO_GPC), dois
-- novos eventos de histórico (ENCAMINHADA_GPC, RETORNO_GPC), e um campo
-- analista_gpc (texto livre, nome de quem no GPC analisou o processo) em
-- cgof_ggcon_analises e em cgof_ggcon_processos, sincronizados entre as duas
-- telas (ver GgconAnaliseService.atualizarAnalistaGpc /
-- GgconService.setAnalistaGpcNaMovimentacaoAtual). data_encaminhamento_gpc marca
-- quando a análise foi encaminhada ao GPC (status ENCAMINHADO_GPC).
-- Execute no SQL Editor do Supabase, depois de parte_77.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analises
  ADD COLUMN IF NOT EXISTS analista_gpc TEXT,
  ADD COLUMN IF NOT EXISTS data_encaminhamento_gpc DATE;

ALTER TABLE public.cgof_ggcon_processos
  ADD COLUMN IF NOT EXISTS analista_gpc TEXT;

ALTER TABLE public.cgof_ggcon_analises
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analises_status_check;
ALTER TABLE public.cgof_ggcon_analises
  ADD CONSTRAINT cgof_ggcon_analises_status_check
  CHECK (status IN ('AGUARDANDO_LIBERACAO', 'AGUARDANDO_ANALISE', 'EM_ANALISE', 'AGUARDANDO_ASSINATURA',
                     'CONFERENCIA_PENDENCIA', 'CONCLUIDA', 'ENCAMINHADO_GPC', 'RETORNO_GPC'));

ALTER TABLE public.cgof_ggcon_analise_historico
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_historico_evento_check;
ALTER TABLE public.cgof_ggcon_analise_historico
  ADD CONSTRAINT cgof_ggcon_analise_historico_evento_check
  CHECK (evento IN ('LIBERADA', 'REATRIBUIDA', 'INICIADA', 'CONCLUIDA', 'ENCAMINHADA', 'RESETADA',
                     'STATUS_ALTERADO', 'HISTORICO_LIMPO', 'LIBERADA_ASSINATURA', 'ASSINADA',
                     'CONCLUIDA_COM_PENDENCIA', 'ENCAMINHADA_GPC', 'RETORNO_GPC'));
