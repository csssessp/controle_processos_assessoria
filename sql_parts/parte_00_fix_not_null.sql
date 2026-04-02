-- Correcção: remover NOT NULL de processo_id nas tabelas que admitem registos órfãos
-- Execute este ficheiro ANTES de importar os dados (partes 07, 08 e 09)

ALTER TABLE public.cgof_gpc_objeto       ALTER COLUMN processo_id DROP NOT NULL;
ALTER TABLE public.cgof_gpc_parcelamento ALTER COLUMN processo_id DROP NOT NULL;
ALTER TABLE public.cgof_gpc_ta           ALTER COLUMN processo_id DROP NOT NULL;
