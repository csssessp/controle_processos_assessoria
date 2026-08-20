-- =============================================================================
-- PARTE 73: Usuários — tela inicial configurável pelo Administrador
-- Guarda uma chave simples ('dashboard' | 'gpc' | 'ggcon' | 'ggcon_analise') que
-- App.tsx (getHomePath) usa para decidir onde o usuário cai ao entrar no sistema,
-- em vez de sempre depender só das áreas marcadas. Vazio/nulo = automático
-- (comportamento de hoje, mantido como fallback).
-- Execute no SQL Editor do Supabase, depois de parte_72.
-- =============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tela_inicial text;
