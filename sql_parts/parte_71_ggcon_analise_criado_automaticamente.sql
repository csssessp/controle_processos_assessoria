-- =============================================================================
-- PARTE 71: GGCON — Análise Processo: marca registros criados automaticamente
-- Quando um processo é salvo em "Processos GGCON" com Tipo = "Prestação de Contas",
-- a tela oferece criar o registro correspondente em "Análise Processo GGCON" na
-- hora. Esse campo marca esses registros para a tela mostrar uma etiqueta "Novo"
-- (visual apenas — não é um status novo, continuam AGUARDANDO_LIBERACAO como
-- qualquer outro registro recém-cadastrado).
-- Execute no SQL Editor do Supabase, depois de parte_70.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analises
  ADD COLUMN IF NOT EXISTS criado_automaticamente boolean NOT NULL DEFAULT false;
