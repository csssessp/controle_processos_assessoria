-- =============================================================
-- parte_29_cleanup_prod_duplicatas.sql
-- Remove eventos POSICAO e MOVIMENTO de cgof_gpc_produtividade
-- que foram gerados por double-write do formulário do fluxo técnico.
-- A partir de agora, POSICAO e MOVIMENTO são lidos diretamente de
-- cgof_gpc_fluxo_tecnico (fonte da verdade com datas retroativas corretas).
-- CADASTRO e INICIO_ANALISE continuam sendo gerenciados por triggers.
-- =============================================================

-- Pré-visualizar quantas linhas serão removidas:
/*
SELECT evento, COUNT(*) as total
FROM cgof_gpc_produtividade
WHERE evento IN ('POSICAO', 'MOVIMENTO')
GROUP BY evento;
*/

-- Remover POSICAO e MOVIMENTO da tabela de produtividade:
DELETE FROM cgof_gpc_produtividade
WHERE evento IN ('POSICAO', 'MOVIMENTO');
