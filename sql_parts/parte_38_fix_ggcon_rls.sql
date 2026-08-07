-- =============================================================================
-- CORREÇÃO RLS — Tabela GGCON
-- O sistema usa autenticação customizada (não usa Supabase Auth JWT).
-- As requisições chegam sempre como role 'anon', portanto as políticas
-- TO authenticated bloqueiam todas as leituras/escritas (mesmo bug já
-- corrigido para as tabelas GPC em parte_00_fix_gpc_rls.sql).
-- Execute este script no SQL Editor do Supabase.
-- =============================================================================

DROP POLICY IF EXISTS "authenticated can read cgof_ggcon_processos"  ON public.cgof_ggcon_processos;
DROP POLICY IF EXISTS "authenticated can write cgof_ggcon_processos" ON public.cgof_ggcon_processos;

-- Desativar RLS (igual ao padrão das demais tabelas do sistema)
ALTER TABLE public.cgof_ggcon_processos DISABLE ROW LEVEL SECURITY;
