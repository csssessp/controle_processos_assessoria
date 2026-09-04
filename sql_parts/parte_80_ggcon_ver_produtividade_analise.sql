ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ggcon_ver_produtividade_analise boolean NOT NULL DEFAULT false;
