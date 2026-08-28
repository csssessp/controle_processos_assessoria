-- =============================================================================
-- PARTE 77: GGCON — Permissão "Administrar Análise" (Alterar Status / Resetar)
-- Novo campo ggcon_admin_analise em users: quando true, o usuário passa a ver e
-- usar "Alterar Status" e "Resetar Análise" na tela "Análise Processo GGCON" sem
-- precisar ser Administrador. "Limpar Histórico" e "Excluir" continuam exclusivos
-- de Administrador (ver podeAdministrarAnalise em types.ts).
-- Execute no SQL Editor do Supabase, depois de parte_76.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ggcon_admin_analise boolean NOT NULL DEFAULT false;
