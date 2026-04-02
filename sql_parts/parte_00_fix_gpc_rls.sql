-- =============================================================================
-- CORREÇÃO RLS — Tabelas GPC
-- O sistema usa autenticação customizada (não usa Supabase Auth JWT).
-- As requisições chegam sempre como role 'anon', portanto as políticas
-- TO authenticated bloqueiam todas as leituras/escritas.
-- Execute este script no SQL Editor do Supabase ANTES de usar as telas GPC.
-- =============================================================================

-- Remover políticas que restringem a 'authenticated' (Supabase Auth JWT)
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_classificacao"  ON public.cgof_gpc_classificacao;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_posicao"         ON public.cgof_gpc_posicao;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_processos"       ON public.cgof_gpc_processos;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_exercicio"       ON public.cgof_gpc_exercicio;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_historico"       ON public.cgof_gpc_historico;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_objeto"          ON public.cgof_gpc_objeto;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_parcelamento"    ON public.cgof_gpc_parcelamento;
DROP POLICY IF EXISTS "authenticated can read cgof_gpc_ta"              ON public.cgof_gpc_ta;

DROP POLICY IF EXISTS "authenticated can write cgof_gpc_classificacao"  ON public.cgof_gpc_classificacao;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_posicao"        ON public.cgof_gpc_posicao;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_processos"      ON public.cgof_gpc_processos;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_exercicio"      ON public.cgof_gpc_exercicio;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_historico"      ON public.cgof_gpc_historico;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_objeto"         ON public.cgof_gpc_objeto;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_parcelamento"   ON public.cgof_gpc_parcelamento;
DROP POLICY IF EXISTS "authenticated can write cgof_gpc_ta"             ON public.cgof_gpc_ta;

-- Desativar RLS (igual ao padrão das demais tabelas do sistema)
ALTER TABLE public.cgof_gpc_classificacao  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_posicao        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_processos      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_exercicio      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_historico      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_objeto         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_parcelamento   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_ta             DISABLE ROW LEVEL SECURITY;
