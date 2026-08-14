-- =============================================================================
-- PARTE 50: Corrige RLS de cgof_gpc_parcela (mesmo problema do parte_00)
-- O sistema usa autenticação customizada (não usa Supabase Auth JWT).
-- As requisições chegam sempre como role 'anon', portanto as políticas
-- TO authenticated bloqueiam todas as leituras/escritas.
-- A tabela cgof_gpc_parcela (parte_35) foi criada com RLS ativo e políticas
-- "TO authenticated", por isso o cadastro/geração de parcelas individuais
-- (Parcelamento/Reparcelamento) falha silenciosamente em produção.
-- Execute no SQL Editor do Supabase.
-- =============================================================================

DROP POLICY IF EXISTS "authenticated can read cgof_gpc_parcela"  ON public.cgof_gpc_parcela;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_parcela" ON public.cgof_gpc_parcela;

ALTER TABLE public.cgof_gpc_parcela DISABLE ROW LEVEL SECURITY;
