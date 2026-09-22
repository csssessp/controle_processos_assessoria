-- =============================================================================
-- PARTE 83: GGCON — Análise Processo: observação por exercício
-- O campo "Observações" existente (cgof_ggcon_analises.observacoes) é uma nota de
-- acompanhamento do PROCESSO inteiro (aparece na listagem também) — continua como
-- está. Este é um campo NOVO, específico do checklist: cada exercício financeiro
-- passa a ter sua própria observação, exibida junto do checklist dele e usada no
-- PDF exportado daquele exercício (antes, o PDF de qualquer exercício mostrava só
-- a observação do processo, igual em todos).
-- Execute no SQL Editor do Supabase, depois de parte_76.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analise_exercicios
  ADD COLUMN IF NOT EXISTS observacoes TEXT;
