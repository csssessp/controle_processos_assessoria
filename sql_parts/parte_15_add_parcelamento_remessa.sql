-- Parte 15: Adicionar campos is_parcelamento e remessa em cgof_gpc_recebidos
-- Execute este script no Supabase SQL Editor

ALTER TABLE public.cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS is_parcelamento BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS remessa TEXT CHECK (remessa IN ('ACIMA', 'ABAIXO'));

-- Índices para filtros eficientes
CREATE INDEX IF NOT EXISTS idx_gpc_recebidos_is_parcelamento
  ON public.cgof_gpc_recebidos (is_parcelamento)
  WHERE is_parcelamento = TRUE;

CREATE INDEX IF NOT EXISTS idx_gpc_recebidos_remessa
  ON public.cgof_gpc_recebidos (remessa)
  WHERE remessa IS NOT NULL;

-- Confirmar
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'cgof_gpc_recebidos'
  AND column_name IN ('is_parcelamento', 'remessa');
