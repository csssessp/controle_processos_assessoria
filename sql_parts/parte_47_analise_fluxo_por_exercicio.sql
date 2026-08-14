-- ============================================================
-- parte_47_analise_fluxo_por_exercicio.sql
-- Adiciona uma trilha de Posição/Movimento/Análise/Situação/Correção Documental
-- e Fluxo PRÓPRIA POR EXERCÍCIO, em paralelo à existente no registro
-- (cgof_gpc_recebidos / aba Identificação+Análise, que continua funcionando
-- exatamente como hoje — inclusive os triggers/produtividade ligados a ela).
--
-- Cada exercício cadastrado na aba Financeiro passa a poder ter sua própria
-- Posição/Movimento/Análise/Situação/Fluxo, começando em branco (sem herdar
-- nada do registro ou de outro exercício) — visível numa nova aba "Exercícios".
--
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela nova: um estado de análise por (registro, exercício)
CREATE TABLE IF NOT EXISTS cgof_gpc_registro_exercicio (
  codigo                SERIAL PRIMARY KEY,
  registro_id           INTEGER NOT NULL REFERENCES cgof_gpc_recebidos(codigo),
  exercicio_id          INTEGER NOT NULL REFERENCES cgof_gpc_exercicio(codigo),
  posicao_id            INTEGER REFERENCES cgof_gpc_posicao(codigo),
  movimento             TEXT,
  responsaveis_analise  TEXT[] DEFAULT '{}',
  num_paginas           INTEGER,
  situacao              TEXT CHECK (situacao IN ('REGULAR', 'IRREGULAR', 'PARCIALMENTE_REGULAR')),
  irregular_tipos       TEXT[] DEFAULT '{}',
  irregular_debito      TEXT CHECK (irregular_debito IN ('SEM_DEBITO', 'COM_DEBITO')),
  valor_multa           NUMERIC(15,2),
  ressarcimento_status  TEXT CHECK (ressarcimento_status IN ('RECOLHIDO', 'NAO_RECOLHIDO')),
  cobranca_estagio      TEXT CHECK (cobranca_estagio IN ('COBRANCA', 'DIVIDA_ATIVA', 'EXECUCAO_FISCAL')),
  situacao_obs          TEXT,
  valor_a_devolver      NUMERIC(15,2),
  valor_devolvido       NUMERIC(15,2),
  correcao_paginas      INTEGER,
  correcao_obs          TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (registro_id, exercicio_id)
);

CREATE INDEX IF NOT EXISTS idx_gpc_registro_exercicio_registro ON cgof_gpc_registro_exercicio (registro_id);
CREATE INDEX IF NOT EXISTS idx_gpc_registro_exercicio_exercicio ON cgof_gpc_registro_exercicio (exercicio_id);

COMMENT ON TABLE cgof_gpc_registro_exercicio IS
  'Estado de análise (posição, movimento, situação/julgamento, correção documental) de um registro para um exercício financeiro específico — trilha independente por exercício, em paralelo à do registro (cgof_gpc_recebidos).';

-- 2. Fluxo técnico passa a poder pertencer também a um exercício específico
--    (linhas antigas ficam com exercicio_id NULL — continuam representando o
--    fluxo do registro como um todo, sem mudança de comportamento)
ALTER TABLE cgof_gpc_fluxo_tecnico
  ADD COLUMN IF NOT EXISTS exercicio_id INTEGER REFERENCES cgof_gpc_exercicio(codigo);

COMMENT ON COLUMN cgof_gpc_fluxo_tecnico.exercicio_id IS
  'Exercício ao qual este evento do fluxo pertence, quando registrado pela aba "Exercícios" (junto com registro_id identifica a trilha por exercício). NULL para eventos legados do fluxo do registro.';
