-- Adiciona a coluna view_only na tabela users
-- Usuários com view_only = true podem visualizar o sistema mas não podem criar, editar ou excluir registros

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS view_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.view_only IS 'Se true, o usuário tem acesso somente leitura — não pode criar, editar ou excluir registros.';
