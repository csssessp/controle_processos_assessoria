-- ============================================================
-- CORREÇÃO: coluna "codigo" sem DEFAULT em cgof_gpc_recebidos
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Garante que a sequência existe
CREATE SEQUENCE IF NOT EXISTS cgof_gpc_recebidos_codigo_seq;

-- 2. Sincroniza a sequência com o maior valor atual
SELECT setval(
  'cgof_gpc_recebidos_codigo_seq',
  COALESCE((SELECT MAX(codigo) FROM public.cgof_gpc_recebidos), 0) + 1,
  false
);

-- 3. Define o DEFAULT da coluna para usar a sequência
ALTER TABLE public.cgof_gpc_recebidos
  ALTER COLUMN codigo SET DEFAULT nextval('cgof_gpc_recebidos_codigo_seq');

-- 4. Vincula a sequência à coluna (para que seja dropada junto)
ALTER SEQUENCE cgof_gpc_recebidos_codigo_seq
  OWNED BY public.cgof_gpc_recebidos.codigo;

-- Verificar
SELECT column_default
FROM information_schema.columns
WHERE table_name = 'cgof_gpc_recebidos' AND column_name = 'codigo';
