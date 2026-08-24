-- Adiciona a opção "OUTROS" às respostas possíveis de um item do checklist da
-- Análise GGCON (antes só SIM/NAO/NAO_SE_APLICA — ver parte_64).

ALTER TABLE public.cgof_ggcon_analise_itens
  DROP CONSTRAINT IF EXISTS cgof_ggcon_analise_itens_resposta_check;

ALTER TABLE public.cgof_ggcon_analise_itens
  ADD CONSTRAINT cgof_ggcon_analise_itens_resposta_check
  CHECK (resposta IN ('SIM', 'NAO', 'NAO_SE_APLICA', 'OUTROS'));
