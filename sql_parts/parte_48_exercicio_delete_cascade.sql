-- ============================================================
-- parte_48_exercicio_delete_cascade.sql
-- Permite excluir um exercício financeiro (cgof_gpc_exercicio) mesmo depois
-- de já ter Análise/Situação/Fluxo registrados nele (ex.: exercício cadastrado
-- por engano) — a exclusão em cascata remove junto:
--   - a linha de análise/fluxo em cgof_gpc_registro_exercicio (parte_47)
--   - os eventos do fluxo técnico (cgof_gpc_fluxo_tecnico) daquele exercício
-- Sem isso, GpcService.deleteExercicio falhava com erro de chave estrangeira
-- assim que o exercício tinha qualquer análise/fluxo salvo.
--
-- Não mexe na FK de cgof_gpc_historico (tabela legada, só leitura, com dados
-- reais migrados do Access) — se um exercício antigo tiver histórico legado
-- vinculado, a exclusão continua bloqueada de propósito, para não apagar
-- dado histórico migrado por engano.
--
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE cgof_gpc_registro_exercicio
  DROP CONSTRAINT IF EXISTS cgof_gpc_registro_exercicio_exercicio_id_fkey,
  ADD CONSTRAINT cgof_gpc_registro_exercicio_exercicio_id_fkey
    FOREIGN KEY (exercicio_id) REFERENCES cgof_gpc_exercicio(codigo) ON DELETE CASCADE;

ALTER TABLE cgof_gpc_fluxo_tecnico
  DROP CONSTRAINT IF EXISTS cgof_gpc_fluxo_tecnico_exercicio_id_fkey,
  ADD CONSTRAINT cgof_gpc_fluxo_tecnico_exercicio_id_fkey
    FOREIGN KEY (exercicio_id) REFERENCES cgof_gpc_exercicio(codigo) ON DELETE CASCADE;
