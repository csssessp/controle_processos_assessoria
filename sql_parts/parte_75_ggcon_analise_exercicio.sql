-- Adiciona o campo "Exercício" (ano) ao cadastro do despacho da Análise GGCON.

ALTER TABLE public.cgof_ggcon_analises
  ADD COLUMN IF NOT EXISTS exercicio INTEGER;
