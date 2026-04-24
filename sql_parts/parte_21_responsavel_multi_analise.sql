-- ============================================================
-- parte_21_responsavel_multi_analise.sql
-- Separação entre Responsável pelo Cadastro e Técnicos Analistas
-- Suporte a múltiplos técnicos responsáveis pela análise
-- Remoção do campo Ação Realizada (campo acao torna-se opcional)
-- ============================================================

-- 1. Adicionar campo responsavel_cadastro (quem registrou o processo no sistema)
ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS responsavel_cadastro TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS responsaveis_analise TEXT[] DEFAULT NULL;

-- 2. Migrar dados existentes:
--    O campo responsavel era usado como "quem cadastrou" — manter como cadastro e copiar para analise
UPDATE cgof_gpc_recebidos
SET
  responsavel_cadastro = responsavel,
  responsaveis_analise = CASE WHEN responsavel IS NOT NULL THEN ARRAY[responsavel] ELSE NULL END
WHERE responsavel_cadastro IS NULL
  AND responsavel IS NOT NULL;

-- 3. Tornar acao opcional no fluxo técnico (era redundante com posição)
ALTER TABLE cgof_gpc_fluxo_tecnico
  ALTER COLUMN acao DROP NOT NULL;

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_gpc_recebidos_resp_cadastro
  ON cgof_gpc_recebidos (responsavel_cadastro);

CREATE INDEX IF NOT EXISTS idx_gpc_recebidos_resp_analise
  ON cgof_gpc_recebidos USING GIN (responsaveis_analise);

-- 5. Comentários descritivos
COMMENT ON COLUMN cgof_gpc_recebidos.responsavel_cadastro IS
  'Técnico responsável pelo cadastro/registro do processo no sistema (tarefa administrativa)';

COMMENT ON COLUMN cgof_gpc_recebidos.responsaveis_analise IS
  'Array de técnicos responsáveis pela análise técnica do processo (pode ter múltiplos analistas)';

-- 6. Função auxiliar: log de evento de cadastro na tabela de produtividade
--    Chamada via trigger ao inserir/atualizar responsavel_cadastro
CREATE OR REPLACE FUNCTION fn_log_cadastro_produtividade()
RETURNS TRIGGER AS $$
BEGIN
  -- Log evento CADASTRO quando responsavel_cadastro é definido ou alterado
  IF (TG_OP = 'INSERT' AND NEW.responsavel_cadastro IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.responsavel_cadastro IS DISTINCT FROM OLD.responsavel_cadastro
      AND NEW.responsavel_cadastro IS NOT NULL) THEN
    INSERT INTO cgof_gpc_produtividade (registro_id, responsavel, evento, data_evento, obs)
    VALUES (NEW.codigo, NEW.responsavel_cadastro, 'CADASTRO', NOW(),
            CASE WHEN TG_OP = 'UPDATE' THEN 'Responsável pelo cadastro atualizado' ELSE 'Cadastro do processo' END);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para auto-log de CADASTRO
DROP TRIGGER IF EXISTS trg_log_cadastro ON cgof_gpc_recebidos;
CREATE TRIGGER trg_log_cadastro
  AFTER INSERT OR UPDATE OF responsavel_cadastro
  ON cgof_gpc_recebidos
  FOR EACH ROW
  EXECUTE FUNCTION fn_log_cadastro_produtividade();

-- 8. Função auxiliar: log de novos analistas na produtividade
CREATE OR REPLACE FUNCTION fn_log_analistas_produtividade()
RETURNS TRIGGER AS $$
DECLARE
  analista TEXT;
  antigos TEXT[] := COALESCE(OLD.responsaveis_analise, ARRAY[]::TEXT[]);
  novos   TEXT[] := COALESCE(NEW.responsaveis_analise, ARRAY[]::TEXT[]);
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.responsaveis_analise IS DISTINCT FROM OLD.responsaveis_analise THEN
    -- Novos analistas (estão em novos mas não em antigos) → INICIO_ANALISE
    FOREACH analista IN ARRAY novos LOOP
      IF NOT (analista = ANY(antigos)) THEN
        INSERT INTO cgof_gpc_produtividade (registro_id, responsavel, evento, data_evento, obs)
        VALUES (NEW.codigo, analista, 'INICIO_ANALISE', NOW(), 'Analista atribuído ao processo');
      END IF;
    END LOOP;
    -- Analistas removidos (estavam em antigos mas não estão em novos) → RESPONSAVEL (mudança)
    FOREACH analista IN ARRAY antigos LOOP
      IF NOT (analista = ANY(novos)) THEN
        INSERT INTO cgof_gpc_produtividade (registro_id, responsavel, evento, data_evento, obs)
        VALUES (NEW.codigo, analista, 'RESPONSAVEL', NOW(), 'Analista removido do processo');
      END IF;
    END LOOP;
  ELSIF TG_OP = 'INSERT' AND NEW.responsaveis_analise IS NOT NULL THEN
    FOREACH analista IN ARRAY NEW.responsaveis_analise LOOP
      INSERT INTO cgof_gpc_produtividade (registro_id, responsavel, evento, data_evento, obs)
      VALUES (NEW.codigo, analista, 'INICIO_ANALISE', NOW(), 'Analista atribuído ao cadastro');
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger para auto-log de analistas
DROP TRIGGER IF EXISTS trg_log_analistas ON cgof_gpc_recebidos;
CREATE TRIGGER trg_log_analistas
  AFTER INSERT OR UPDATE OF responsaveis_analise
  ON cgof_gpc_recebidos
  FOR EACH ROW
  EXECUTE FUNCTION fn_log_analistas_produtividade();
