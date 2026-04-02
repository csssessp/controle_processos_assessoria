-- =============================================================================
-- NOVA TABELA: cgof_gpc_recebidos  (Relação de Processos Recebidos)
-- Execute no SQL Editor do Supabase
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cgof_gpc_recebidos (
    codigo          INTEGER PRIMARY KEY,
    processo_codigo INTEGER,               -- referência ao código do processo GPC (não FK forçada)
    processo        TEXT,                  -- número do processo
    entidade        TEXT,
    convenio        TEXT,
    exercicio       TEXT,
    drs             INTEGER,
    data            DATE,
    responsavel     TEXT,
    posicao_id      INTEGER REFERENCES public.cgof_gpc_posicao(codigo),
    movimento       TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cgof_gpc_recebidos_processo_cod ON public.cgof_gpc_recebidos(processo_codigo);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_recebidos_posicao      ON public.cgof_gpc_recebidos(posicao_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_recebidos_data         ON public.cgof_gpc_recebidos(data);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_recebidos_drs          ON public.cgof_gpc_recebidos(drs);

-- Sem RLS (sistema usa auth customizada, não Supabase Auth JWT)
ALTER TABLE public.cgof_gpc_recebidos DISABLE ROW LEVEL SECURITY;
