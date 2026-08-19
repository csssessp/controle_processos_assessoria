-- =============================================================================
-- PARTE 61: coluna "origem_planilha" — marca a proveniência de registros
-- importados de planilhas externas, para permitir relatórios que replicam
-- exatamente uma aba de origem (ex.: "OUTROS", "CSS PARCELAMENTO" de
-- 'CONT PROC TRIBUNAL (3).xlsx') mesmo depois que os dados já foram
-- absorvidos pelas tabelas normais do sistema.
--
-- Não é necessária para CJ (já identificável por posicao_id) nem para
-- PARCELAMENTOS/PROCESSOS IRREGULARES (já identificáveis por is_parcelamento
-- / situacao) — só para as duas categorias que eram puramente um recorte
-- manual da planilha, sem equivalente estrutural no sistema.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

ALTER TABLE public.cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS origem_planilha TEXT;

ALTER TABLE public.cgof_gpc_parcelamento
  ADD COLUMN IF NOT EXISTS origem_planilha TEXT;

-- Backfill a partir da tag "Fonte: planilha ... — aba X" já gravada nos
-- registros importados em parte_56/57/60 (só identifica o que foi criado
-- por essas migrações; registros que já existiam antes da aba OUTROS/CSS
-- PARCELAMENTO ser reconciliada não são retroativamente marcados).
UPDATE public.cgof_gpc_recebidos
SET origem_planilha = 'OUTROS'
WHERE situacao_obs ILIKE '%aba OUTROS%';

UPDATE public.cgof_gpc_parcelamento
SET origem_planilha = 'CSS_PARCELAMENTO'
WHERE obs ILIKE '%aba CSS PARCELAMENTO%';

COMMENT ON COLUMN public.cgof_gpc_recebidos.origem_planilha IS
  'Proveniência do registro quando importado de uma planilha externa cuja categorização não tem equivalente estrutural no sistema (ex.: OUTROS). NULL para registros cadastrados normalmente pelo sistema.';
COMMENT ON COLUMN public.cgof_gpc_parcelamento.origem_planilha IS
  'Proveniência do registro quando importado de uma planilha externa cuja categorização não tem equivalente estrutural no sistema (ex.: CSS_PARCELAMENTO). NULL para registros cadastrados normalmente pelo sistema.';
