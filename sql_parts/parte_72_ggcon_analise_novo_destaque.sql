-- =============================================================================
-- PARTE 72: GGCON — Análise Processo: destaque de "novo" no topo da lista
-- Coluna dedicada só pra ordenação (mesmo padrão de `urgente` em
-- cgof_ggcon_processos — ver services/ggconService.ts): fica true quando o
-- registro é criado automaticamente a partir de "Processos GGCON" e ainda não
-- foi liberado. Diferente de `criado_automaticamente` (marcador permanente de
-- origem), esta some (volta a false) assim que alguém libera ou corrige o
-- status manualmente — deixa de precisar de destaque.
-- Execute no SQL Editor do Supabase, depois de parte_71.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analises
  ADD COLUMN IF NOT EXISTS novo_destaque boolean NOT NULL DEFAULT false;

-- Preenche o destaque para registros já criados automaticamente que ainda
-- estão aguardando liberação (evita perder o destaque dos que já existem).
UPDATE public.cgof_ggcon_analises
  SET novo_destaque = true
  WHERE criado_automaticamente = true AND status = 'AGUARDANDO_LIBERACAO';
