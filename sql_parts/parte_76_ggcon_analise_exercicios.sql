-- =============================================================================
-- PARTE 76: GGCON — Análise Processo: múltiplos exercícios, cada um com seu checklist
-- Antes, cada análise tinha um único campo `exercicio` (parte_75, puramente
-- informativo) e um checklist só (cgof_ggcon_analise_itens ligado por analise_id).
-- Um mesmo processo pode abranger vários exercícios financeiros, e cada um precisa
-- da sua própria conferência documental (checklist respondido separadamente). O
-- status/analista/liberação/assinatura continuam únicos por análise — só o
-- checklist passa a ser por exercício.
-- Execute no SQL Editor do Supabase, depois de parte_75.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cgof_ggcon_analise_exercicios (
  id SERIAL PRIMARY KEY,
  analise_id INTEGER NOT NULL REFERENCES public.cgof_ggcon_analises(id) ON DELETE CASCADE,
  exercicio INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS cgof_ggcon_analise_exercicios_unico
  ON public.cgof_ggcon_analise_exercicios (analise_id, exercicio) WHERE exercicio IS NOT NULL;

ALTER TABLE public.cgof_ggcon_analise_itens
  ADD COLUMN IF NOT EXISTS exercicio_id INTEGER REFERENCES public.cgof_ggcon_analise_exercicios(id) ON DELETE CASCADE;

-- Backfill: 1 exercício por análise existente (mesmo valor de `exercicio`, inclusive
-- NULL), e todos os itens já existentes apontando para ele. Nenhum dado se perde.
INSERT INTO public.cgof_ggcon_analise_exercicios (analise_id, exercicio)
SELECT id, exercicio FROM public.cgof_ggcon_analises;

UPDATE public.cgof_ggcon_analise_itens i
SET exercicio_id = e.id
FROM public.cgof_ggcon_analise_exercicios e
WHERE e.analise_id = i.analise_id AND i.exercicio_id IS NULL;

ALTER TABLE public.cgof_ggcon_analise_itens ALTER COLUMN exercicio_id SET NOT NULL;

-- `exercicio` na análise virou o primeiro exercício da tabela nova — coluna antiga sai.
ALTER TABLE public.cgof_ggcon_analises DROP COLUMN IF EXISTS exercicio;
