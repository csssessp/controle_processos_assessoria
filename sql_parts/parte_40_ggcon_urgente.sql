-- =============================================================================
-- PARTE 40: Marcação "Urgente" para processos GGCON
-- Processos urgentes aparecem sempre no topo da listagem, independente da
-- ordenação escolhida pelo usuário.
-- Execute no SQL Editor do Supabase.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_processos
    ADD COLUMN IF NOT EXISTS urgente BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_cgof_ggcon_urgente ON public.cgof_ggcon_processos(urgente);
