-- Adiciona coluna irregular_tipos (TEXT[]) para registrar o tipo de irregularidade
-- quando a situação do processo é marcada como IRREGULAR.
-- Valores possíveis: 'DIVIDA_ATIVA', 'CONTENCIOSO', 'CADIN'

ALTER TABLE public.cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS irregular_tipos TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.cgof_gpc_recebidos.irregular_tipos
  IS 'Tipos de irregularidade: DIVIDA_ATIVA, CONTENCIOSO, CADIN (array, aplica-se quando situacao = IRREGULAR)';
