-- =============================================================================
-- PARTE 63: remove o módulo "TCE" (publicações DOE / requisições) — o
-- usuário avaliou que a tela não tinha utilidade prática e pediu a remoção
-- completa. Reverte parte_53/54/62 (que criaram a tabela, os 2 registros
-- seed e a coluna de múltiplos responsáveis).
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

DROP TABLE IF EXISTS public.cgof_gpc_servidores;
