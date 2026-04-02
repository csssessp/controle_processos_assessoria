-- ============================================================
-- NORMALIZAÇÃO: Substitui apelidos/nomes parciais pelo nome
-- completo do usuário correspondente no sistema.
-- Tabelas afetadas: cgof_gpc_recebidos, cgof_gpc_historico
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ── cgof_gpc_recebidos ──────────────────────────────────────

-- Gilmar (várias grafias, incluindo typo 'GILKMAR')
UPDATE public.cgof_gpc_recebidos
SET responsavel = 'Gilmar Marciano dos Santos'
WHERE LOWER(TRIM(responsavel)) IN ('gilmar', 'gilkmar');

-- Elenice (apenas quando sozinha, não em compostos como 'Elenice/Gilmar')
UPDATE public.cgof_gpc_recebidos
SET responsavel = 'Elenice Orpheu Alves De Souza'
WHERE LOWER(TRIM(responsavel)) = 'elenice';

-- Roberto
UPDATE public.cgof_gpc_recebidos
SET responsavel = 'Roberto Santana'
WHERE LOWER(TRIM(responsavel)) = 'roberto';

-- ── cgof_gpc_historico ──────────────────────────────────────

-- Gilmar (várias grafias, incluindo typo 'GILKMAR')
UPDATE public.cgof_gpc_historico
SET responsavel = 'Gilmar Marciano dos Santos'
WHERE LOWER(TRIM(responsavel)) IN ('gilmar', 'gilkmar');

-- Elenice (apenas quando sozinha)
UPDATE public.cgof_gpc_historico
SET responsavel = 'Elenice Orpheu Alves De Souza'
WHERE LOWER(TRIM(responsavel)) = 'elenice';

-- Roberto
UPDATE public.cgof_gpc_historico
SET responsavel = 'Roberto Santana'
WHERE LOWER(TRIM(responsavel)) = 'roberto';

-- ── Verificar resultado ─────────────────────────────────────
SELECT 'recebidos' AS tabela, responsavel, COUNT(*) AS qtd
FROM public.cgof_gpc_recebidos
WHERE responsavel IS NOT NULL
GROUP BY responsavel

UNION ALL

SELECT 'historico' AS tabela, responsavel, COUNT(*) AS qtd
FROM public.cgof_gpc_historico
WHERE responsavel IS NOT NULL
GROUP BY responsavel

ORDER BY tabela, qtd DESC;
