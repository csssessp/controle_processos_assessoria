-- =============================================================================
-- PARTE 68: GGCON — Análise Processo: etapa de Assinatura (antes de Encaminhar)
-- Insere um novo status "AGUARDANDO_ASSINATURA" entre o preenchimento do checklist
-- concluído e o Encaminhamento: quem libera processos marca "Liberar para
-- Assinatura"; o usuário com a nova permissão ggcon_assina (ex.: Marilsa) vê o
-- aviso na tela "Análise Processo GGCON" e confirma a assinatura; só depois disso
-- o Encaminhar fica disponível.
-- Execute no SQL Editor do Supabase, depois de parte_67.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ggcon_assina boolean NOT NULL DEFAULT false;

ALTER TABLE public.cgof_ggcon_analises
  ADD COLUMN IF NOT EXISTS data_liberacao_assinatura date,
  ADD COLUMN IF NOT EXISTS data_assinatura date,
  ADD COLUMN IF NOT EXISTS assinado_por text;

ALTER TABLE public.cgof_ggcon_analises
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analises_status_check;

ALTER TABLE public.cgof_ggcon_analises
  ADD CONSTRAINT cgof_ggcon_analises_status_check
  CHECK (status IN ('AGUARDANDO_LIBERACAO', 'AGUARDANDO_ANALISE', 'EM_ANALISE', 'AGUARDANDO_ASSINATURA', 'CONCLUIDA'));

ALTER TABLE public.cgof_ggcon_analise_historico
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_historico_evento_check;

ALTER TABLE public.cgof_ggcon_analise_historico
  ADD CONSTRAINT cgof_ggcon_analise_historico_evento_check
  CHECK (evento IN ('LIBERADA', 'REATRIBUIDA', 'INICIADA', 'CONCLUIDA', 'ENCAMINHADA', 'RESETADA', 'STATUS_ALTERADO', 'HISTORICO_LIMPO', 'LIBERADA_ASSINATURA', 'ASSINADA'));

-- Marca a Marilsa como signatária desde já (também dá pra marcar depois pelo
-- checkbox "Pode assinar" em Gerenciar Usuários).
UPDATE public.users SET ggcon_assina = true WHERE email = 'msilva@saude.sp.gov.br';
