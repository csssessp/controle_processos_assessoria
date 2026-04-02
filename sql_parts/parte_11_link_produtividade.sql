-- ============================================================
-- Parte 11: link_processo + tabela de produtividade por técnico
-- Execute no Supabase SQL Editor
-- ============================================================

-- 0. Garantir que codigo é SERIAL (auto-increment) na tabela de recebidos
--    Se a coluna já existir como integer sem default, criar a sequence e aplicar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cgof_gpc_recebidos'
      AND column_name='codigo' AND column_default IS NOT NULL
  ) THEN
    CREATE SEQUENCE IF NOT EXISTS cgof_gpc_recebidos_codigo_seq;
    PERFORM setval('cgof_gpc_recebidos_codigo_seq', COALESCE((SELECT MAX(codigo) FROM public.cgof_gpc_recebidos), 0) + 1, false);
    ALTER TABLE public.cgof_gpc_recebidos
      ALTER COLUMN codigo SET DEFAULT nextval('cgof_gpc_recebidos_codigo_seq');
    ALTER SEQUENCE cgof_gpc_recebidos_codigo_seq OWNED BY public.cgof_gpc_recebidos.codigo;
  END IF;
END$$;

-- 1. Adicionar coluna link_processo na tabela de recebidos
ALTER TABLE public.cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS link_processo TEXT;

-- 2. Criar tabela de produtividade (rastreia responsável e posição por data)
CREATE TABLE IF NOT EXISTS public.cgof_gpc_produtividade (
  id            SERIAL PRIMARY KEY,
  registro_id   INTEGER NOT NULL REFERENCES public.cgof_gpc_recebidos(codigo) ON DELETE CASCADE,
  responsavel   TEXT,
  posicao_id    INTEGER REFERENCES public.cgof_gpc_posicao(codigo),
  posicao       TEXT,
  evento        TEXT NOT NULL DEFAULT 'POSICAO',
  -- valores: 'CRIACAO' | 'RESPONSAVEL' | 'POSICAO'
  data_evento   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  obs           TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.cgof_gpc_produtividade DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_prod_registro   ON public.cgof_gpc_produtividade(registro_id);
CREATE INDEX IF NOT EXISTS idx_prod_responsavel ON public.cgof_gpc_produtividade(responsavel);
CREATE INDEX IF NOT EXISTS idx_prod_data        ON public.cgof_gpc_produtividade(data_evento);
