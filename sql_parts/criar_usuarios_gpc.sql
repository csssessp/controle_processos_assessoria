-- ============================================================
-- Criação de usuários GPC
-- Execute no SQL Editor do Supabase
-- Senha padrão: 123456 (alterar após o primeiro login)
-- ============================================================

INSERT INTO users (id, name, email, role, active, password)
VALUES
  (
    gen_random_uuid(),
    'Gilmar Marciano dos Santos',
    'gmsantos@saude.sp.gov.br',
    'GPC',
    true,
    '123456'
  ),
  (
    gen_random_uuid(),
    'Martha Massae Ueda Gushi',
    'mmassae@saude.sp.gov.br',
    'GPC',
    true,
    '123456'
  ),
  (
    gen_random_uuid(),
    'Patricia De Oliveira Araujo',
    'patriciaaraujo@saude.sp.gov.br',
    'GPC',
    true,
    '123456'
  ),
  (
    gen_random_uuid(),
    'Elenice Orpheu Alves De Souza',
    'eorpheu@saude.sp.gov.br',
    'GPC',
    true,
    '123456'
  ),
  (
    gen_random_uuid(),
    'Roberto Santana',
    'rsantana@saude.sp.gov.br',
    'GPC',
    true,
    '123456'
  ),
  (
    gen_random_uuid(),
    'Ederson Da Silva Gelano',
    'esgelano@saude.sp.gov.br',
    'GPC',
    true,
    '123456'
  )
ON CONFLICT (email) DO NOTHING;

-- Verificar usuários inseridos
SELECT id, name, email, role, active
FROM users
WHERE email IN (
  'gmsantos@saude.sp.gov.br',
  'mmassae@saude.sp.gov.br',
  'patriciaaraujo@saude.sp.gov.br',
  'eorpheu@saude.sp.gov.br',
  'rsantana@saude.sp.gov.br',
  'esgelano@saude.sp.gov.br'
)
ORDER BY name;
