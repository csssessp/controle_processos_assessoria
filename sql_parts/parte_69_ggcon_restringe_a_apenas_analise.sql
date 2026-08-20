-- =============================================================================
-- PARTE 69: GGCON — Restringir usuário só à tela "Análise Processo GGCON"
-- Novo campo ggcon_restrito_analise em users: quando true, o usuário deixa de ver
-- (e de conseguir acessar por URL) as telas "Processos GGCON" e "Relatórios GGCON"
-- — só enxerga "Análise Processo GGCON". Administradores nunca ficam restritos,
-- independente desta marcação (ver podeAcessarProcessosGgcon em types.ts).
-- Execute no SQL Editor do Supabase, depois de parte_68.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ggcon_restrito_analise boolean NOT NULL DEFAULT false;
