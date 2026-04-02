
-- =============================================================================
-- MIGRAÇÃO ACCESS → SUPABASE  |  CGOF - Controle de Processos (Convênios)
-- Gerado automaticamente em 2026-04-02
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. cgof_gpc_classificacao  (tabela de lookup – classificação de prestações)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_classificacao (
    codigo    INTEGER PRIMARY KEY,
    indice    INTEGER NOT NULL,
    descricao TEXT    NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. cgof_gpc_posicao  (tabela de lookup – posição/status do processo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_posicao (
    codigo  INTEGER PRIMARY KEY,
    posicao TEXT    NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. cgof_gpc_processos  (tabela principal – convênios/contratos)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_processos (
    codigo        INTEGER PRIMARY KEY,
    processo      TEXT,
    convenio      TEXT,
    tipo          TEXT,
    ano_cadastro  TEXT,
    entidade      TEXT,
    drs           INTEGER,
    vistoriado    BOOLEAN DEFAULT FALSE,
    parcelamento  BOOLEAN DEFAULT FALSE,
    acima_abaixo  TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. cgof_gpc_exercicio  (exercícios financeiros por processo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_exercicio (
    codigo              INTEGER PRIMARY KEY,
    processo_id         INTEGER NOT NULL REFERENCES public.cgof_gpc_processos(codigo),
    exercicio           TEXT,
    exercicio_anterior  NUMERIC(18,2),
    repasse             NUMERIC(18,2),
    aplicacao           NUMERIC(18,2),
    gastos              NUMERIC(18,2),
    devolvido           NUMERIC(18,2)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. cgof_gpc_historico  (histórico de movimentações por exercício)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_historico (
    codigo        INTEGER PRIMARY KEY,
    exercicio_id  INTEGER NOT NULL REFERENCES public.cgof_gpc_exercicio(codigo),
    movimento     TEXT,
    acao          TEXT,
    data          DATE,
    setor         TEXT,
    responsavel   TEXT,
    posicao_id    INTEGER REFERENCES public.cgof_gpc_posicao(codigo)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. cgof_gpc_objeto  (objetos/descrição por processo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_objeto (
    codigo      INTEGER PRIMARY KEY,
    processo_id INTEGER REFERENCES public.cgof_gpc_processos(codigo),
    objeto      TEXT,
    custo       NUMERIC(18,2)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. cgof_gpc_parcelamento  (parcelamentos de débito por processo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_parcelamento (
    codigo               INTEGER PRIMARY KEY,
    processo_id          INTEGER REFERENCES public.cgof_gpc_processos(codigo),
    proc_parcela         TEXT,
    tipo                 TEXT,
    exercicio            INTEGER,
    valor_parcelado      NUMERIC(18,2),
    valor_corrigido      NUMERIC(18,2),
    parcelas             INTEGER,
    em_dia               BOOLEAN DEFAULT FALSE,
    parcelas_concluidas  BOOLEAN DEFAULT FALSE,
    providencias         TEXT,
    obs                  TEXT
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. cgof_gpc_ta  (termos aditivos por processo)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cgof_gpc_ta (
    codigo      INTEGER PRIMARY KEY,
    processo_id INTEGER REFERENCES public.cgof_gpc_processos(codigo),
    numero      TEXT,
    data        DATE,
    custo       NUMERIC(18,2)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_exercicio_processo    ON public.cgof_gpc_exercicio(processo_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_historico_exercicio   ON public.cgof_gpc_historico(exercicio_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_historico_posicao     ON public.cgof_gpc_historico(posicao_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_objeto_processo       ON public.cgof_gpc_objeto(processo_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_parcelamento_processo ON public.cgof_gpc_parcelamento(processo_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_ta_processo           ON public.cgof_gpc_ta(processo_id);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_processos_entidade    ON public.cgof_gpc_processos(entidade);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_processos_convenio    ON public.cgof_gpc_processos(convenio);
CREATE INDEX IF NOT EXISTS idx_cgof_gpc_processos_drs         ON public.cgof_gpc_processos(drs);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (Supabase)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.cgof_gpc_classificacao   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_posicao         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_processos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_exercicio       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_historico       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_objeto          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_parcelamento    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cgof_gpc_ta              ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura para utilizadores autenticados
CREATE POLICY "authenticated can read cgof_gpc_classificacao"   ON public.cgof_gpc_classificacao   FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_posicao"         ON public.cgof_gpc_posicao         FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_processos"       ON public.cgof_gpc_processos       FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_exercicio"       ON public.cgof_gpc_exercicio       FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_historico"       ON public.cgof_gpc_historico       FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_objeto"          ON public.cgof_gpc_objeto          FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_parcelamento"    ON public.cgof_gpc_parcelamento    FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated can read cgof_gpc_ta"              ON public.cgof_gpc_ta              FOR SELECT TO authenticated USING (true);

-- Políticas de escrita (INSERT/UPDATE/DELETE) para utilizadores autenticados
CREATE POLICY "authenticated can write cgof_gpc_classificacao"  ON public.cgof_gpc_classificacao   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_posicao"        ON public.cgof_gpc_posicao         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_processos"      ON public.cgof_gpc_processos       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_exercicio"      ON public.cgof_gpc_exercicio       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_historico"      ON public.cgof_gpc_historico       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_objeto"         ON public.cgof_gpc_objeto          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_parcelamento"   ON public.cgof_gpc_parcelamento    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated can write cgof_gpc_ta"             ON public.cgof_gpc_ta              FOR ALL TO authenticated USING (true) WITH CHECK (true);



-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_classificacao
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_posicao
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_processos  (1108 registos)
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_exercicio  (1159 registos)
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_historico  (1946 registos)
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_objeto  (913 registos)
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_parcelamento  (20 registos)
-- ─────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────
-- DADOS: cgof_gpc_ta  (66 registos)
-- ─────────────────────────────────────────────────────────────────────────


-- FIM DA MIGRAÇÃO
