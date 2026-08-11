-- =============================================================================
-- PARTE 44: Adiciona contagem de páginas às Atividades Avulsas
--
-- A quantidade de páginas trabalhadas numa atividade avulsa (ex.: auxiliar
-- outro setor a analisar um processo, sem ser o analista formal) passa a somar
-- no total de "Páginas Trabalhadas" do técnico na tela de Produtividade —
-- igual já acontece com Início de Análise e Correção Documental.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

ALTER TABLE public.cgof_gpc_atividade_avulsa
  ADD COLUMN IF NOT EXISTS paginas INTEGER;

COMMENT ON COLUMN public.cgof_gpc_atividade_avulsa.paginas IS
  'Quantidade de páginas trabalhadas nesta atividade avulsa — somada ao total de "Páginas Trabalhadas" do técnico na Produtividade.';
