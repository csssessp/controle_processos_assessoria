-- ============================================================
-- parte_19_add_posicao_reanalise.sql
-- Adiciona a posição "Reanálise" na tabela de posições GPC
-- e a opção "REANÁLISE" como movimento válido (documentação)
-- ============================================================

-- 1. Inserir posição "Reanálise" se ainda não existir
INSERT INTO cgof_gpc_posicao (codigo, posicao)
SELECT (SELECT COALESCE(MAX(codigo), 0) + 1 FROM cgof_gpc_posicao), 'Reanálise'
WHERE NOT EXISTS (
  SELECT 1 FROM cgof_gpc_posicao WHERE posicao ILIKE 'Reanálise'
);

-- 2. Comentário de documentação
COMMENT ON TABLE cgof_gpc_posicao IS
  'Posições possíveis para processos GPC. Inclui: Exercício Analisado, Reanálise, entre outros.';
