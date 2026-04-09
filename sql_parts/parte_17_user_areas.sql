-- ============================================================================
-- Migração: Campo areas na tabela de usuários
-- Adiciona campo JSONB para controlar acesso por área (assessoria, gpc, etc.)
-- ============================================================================

-- 1. Adicionar coluna areas (array de textos armazenado como jsonb)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS areas jsonb DEFAULT '["assessoria"]'::jsonb;

COMMENT ON COLUMN users.areas IS
  'Array de áreas que o usuário pode acessar: assessoria, gpc. Admins têm acesso a tudo.';

-- 2. Atualizar usuários existentes:
--    - ADMIN → ambas as áreas
--    - GPC   → somente gpc
--    - USER  → somente assessoria (default)
UPDATE users SET areas = '["assessoria", "gpc"]'::jsonb WHERE role = 'ADMIN';
UPDATE users SET areas = '["gpc"]'::jsonb WHERE role = 'GPC';
UPDATE users SET areas = '["assessoria"]'::jsonb WHERE role = 'USER' AND areas IS NULL;
