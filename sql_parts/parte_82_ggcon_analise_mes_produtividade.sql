-- =============================================================================
-- PARTE 82: GGCON Análise — mês de competência da Produtividade
-- Até agora a Produtividade da Análise contava cada processo no mês em que o
-- botão "Conferência sem/com Pendência" foi clicado (data_evento, timestamp
-- automático). Isso distorcia a contagem quando o técnico concluía com atraso
-- (ex.: trabalho feito em agosto, só clicou em setembro — contava em setembro).
-- Agora o técnico escolhe o mês de competência na hora de concluir, gravado em
-- mes_produtividade (nullable — eventos antigos continuam usando data_evento
-- como fallback, ver GgconAnaliseService.getProdutividade).
-- Execute no SQL Editor do Supabase, depois de parte_81_ggcon_analise_contribuicao_parcial.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analise_historico
  ADD COLUMN IF NOT EXISTS mes_produtividade DATE;
