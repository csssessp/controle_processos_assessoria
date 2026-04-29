-- Adiciona coluna exercicios (JSONB) para suportar múltiplos anos de exercício
-- por parcelamento/reparcelamento

ALTER TABLE public.cgof_gpc_parcelamento
  ADD COLUMN IF NOT EXISTS exercicios JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.cgof_gpc_parcelamento.exercicios
  IS 'Array de anos de exercício (ex: [2021, 2022, 2023]). Substitui o campo exercicio para registros com múltiplos anos.';
