-- Adiciona campos para tipo do processo e múltiplos exercícios em cgof_gpc_recebidos
-- Permite identificar o tipo diretamente no registro e capturar vários anos de exercício

ALTER TABLE public.cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS tipo_parcelamento TEXT,        -- 'PARCELAMENTO' | 'REPARCELAMENTO' | NULL
  ADD COLUMN IF NOT EXISTS exercicios        JSONB DEFAULT '[]'::jsonb; -- array de anos ex: [2021, 2022]

COMMENT ON COLUMN public.cgof_gpc_recebidos.tipo_parcelamento
  IS 'Tipo do processo: PARCELAMENTO ou REPARCELAMENTO. NULL = prestação de contas normal.';

COMMENT ON COLUMN public.cgof_gpc_recebidos.exercicios
  IS 'Array de anos de exercício referenciados pelo parcelamento/reparcelamento (ex: [2021, 2022, 2023]).';

-- Migração de dados: preenche tipo_parcelamento para registros já marcados como is_parcelamento
UPDATE public.cgof_gpc_recebidos
SET tipo_parcelamento = 'PARCELAMENTO'
WHERE is_parcelamento = TRUE AND tipo_parcelamento IS NULL;
