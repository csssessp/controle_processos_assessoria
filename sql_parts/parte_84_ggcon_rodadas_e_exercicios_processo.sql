-- =============================================================================
-- PARTE 84: GGCON — Retorno GPC guarda a análise anterior + exercícios no
-- cadastro de Processos GGCON.
--
-- (1) cgof_ggcon_analise_rodadas: cada vez que um "Retorno GPC" é registrado em
--     Processos GGCON, a análise volta para reanálise (status RETORNO_GPC) na
--     MESMA linha de cgof_ggcon_analises (não duplica o processo). Antes de
--     reabrir, uma cópia fixa da análise que estava valendo (cabeçalho, datas,
--     conferente, pendência, exercícios e checklist completo) é gravada aqui como
--     "1ª análise", "2ª análise"... — o checklist da reanálise continua com as
--     respostas copiadas e pode ser alterado sem perder a versão antiga.
--
-- (2) cgof_ggcon_processos.exercicios: exercícios informados no cadastro quando
--     Tipo = "Prestação de Contas" — usados para criar/complementar os checklists
--     da Análise GGCON do mesmo processo_sei.
--
-- Execute no SQL Editor do Supabase, depois de parte_83.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cgof_ggcon_analise_rodadas (
    id                      BIGSERIAL PRIMARY KEY,
    analise_id              BIGINT NOT NULL REFERENCES public.cgof_ggcon_analises(id) ON DELETE CASCADE,
    numero                  INTEGER NOT NULL,          -- 1 = 1ª análise, 2 = 2ª...
    conferente              TEXT,                      -- analista_atual na época
    status_anterior         TEXT,                      -- status em que a análise estava ao retornar
    data_analise            DATE,
    data_pendencia          DATE,
    pendencia_descricao     TEXT,
    data_encaminhamento_gpc DATE,
    analista_gpc            TEXT,
    snapshot                JSONB NOT NULL,            -- { analise, exercicios, itens }
    motivo                  TEXT,
    created_by              TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (analise_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_cgof_ggcon_analise_rodadas_analise ON public.cgof_ggcon_analise_rodadas (analise_id);

-- Mesmo padrão das demais tabelas cgof_ggcon_* (auth customizada, sem Supabase Auth).
ALTER TABLE public.cgof_ggcon_analise_rodadas DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cgof_ggcon_analise_rodadas TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.cgof_ggcon_analise_rodadas_id_seq TO anon, authenticated;

ALTER TABLE public.cgof_ggcon_processos
  ADD COLUMN IF NOT EXISTS exercicios INTEGER[];

-- A view da listagem usa "SELECT *", que o Postgres expande na criação — precisa ser
-- recriada para enxergar a coluna nova (ver parte_42).
CREATE OR REPLACE VIEW public.cgof_ggcon_processos_atual AS
SELECT DISTINCT ON (processo_sei) *
FROM public.cgof_ggcon_processos
ORDER BY processo_sei, codigo DESC;

GRANT SELECT ON public.cgof_ggcon_processos_atual TO anon, authenticated;
