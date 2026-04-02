-- ============================================================
-- CORREÇÃO: Adiciona SERIAL (auto-incremento) a TODAS as
-- tabelas GPC que usam INTEGER PRIMARY KEY sem DEFAULT.
-- Execute no SQL Editor do Supabase.
-- ============================================================

DO $$
DECLARE
  tbl  TEXT;
  seq  TEXT;
  maxv BIGINT;
BEGIN
  FOR tbl IN VALUES
    ('cgof_gpc_processos'),
    ('cgof_gpc_exercicio'),
    ('cgof_gpc_historico'),
    ('cgof_gpc_objeto'),
    ('cgof_gpc_parcelamento'),
    ('cgof_gpc_ta'),
    ('cgof_gpc_recebidos')
  LOOP
    seq := tbl || '_codigo_seq';

    -- 1. Cria a sequência se não existir
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I', seq);

    -- 2. Sincroniza com o maior valor existente
    EXECUTE format(
      'SELECT COALESCE(MAX(codigo), 0) + 1 FROM public.%I', tbl
    ) INTO maxv;
    PERFORM setval(format('public.%I', seq), maxv, false);

    -- 3. Define o DEFAULT da coluna
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN codigo SET DEFAULT nextval(''public.%I'')',
      tbl, seq
    );

    -- 4. Vincula sequência à coluna
    EXECUTE format(
      'ALTER SEQUENCE public.%I OWNED BY public.%I.codigo',
      seq, tbl
    );

    RAISE NOTICE 'Sequência configurada: % -> %', tbl, seq;
  END LOOP;
END$$;

-- Verificar resultado
SELECT
  table_name,
  column_default
FROM information_schema.columns
WHERE
  table_schema = 'public'
  AND column_name = 'codigo'
  AND table_name IN (
    'cgof_gpc_processos',
    'cgof_gpc_exercicio',
    'cgof_gpc_historico',
    'cgof_gpc_objeto',
    'cgof_gpc_parcelamento',
    'cgof_gpc_ta',
    'cgof_gpc_recebidos'
  )
ORDER BY table_name;
