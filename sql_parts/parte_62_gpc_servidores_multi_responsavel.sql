-- =============================================================================
-- PARTE 62: permite vincular um ou vários responsáveis a um registro de
-- "TCE" (cgof_gpc_servidores) — mesmo padrão de responsaveis_analise em
-- cgof_gpc_recebidos (parte_21_responsavel_multi_analise.sql): adiciona uma
-- coluna array e mantém a coluna singular antiga por compatibilidade.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

ALTER TABLE public.cgof_gpc_servidores
  ADD COLUMN IF NOT EXISTS responsaveis TEXT[] DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_gpc_servidores_responsaveis ON public.cgof_gpc_servidores USING GIN (responsaveis);

-- Backfill dos 2 registros seed (parte_54) — "Gilmar/Marco" vira os dois nomes
-- reais cadastrados no sistema.
UPDATE public.cgof_gpc_servidores
SET responsaveis = ARRAY['Gilmar Marciano dos Santos', 'Marco Antonio']
WHERE responsavel = 'Gilmar/Marco';

-- Qualquer outro registro com responsavel preenchido mas sem responsaveis vira
-- um array de 1 elemento (mesma regra do parte_21).
UPDATE public.cgof_gpc_servidores
SET responsaveis = ARRAY[responsavel]
WHERE responsavel IS NOT NULL AND responsaveis IS NULL;

COMMENT ON COLUMN public.cgof_gpc_servidores.responsaveis IS
  'Um ou mais responsáveis pelo registro, escolhidos entre os usuários GPC cadastrados no sistema. A coluna "responsavel" (singular) é mantida por compatibilidade e reflete o primeiro nome do array.';
