-- ============================================================
-- parte_51_registro_exercicio_delete_cascade.sql
-- Permite excluir um registro inteiro (cgof_gpc_recebidos) mesmo depois de
-- já ter Análise/Situação/Fluxo por exercício registrados nele.
--
-- A tabela cgof_gpc_registro_exercicio (parte_47) foi criada com
-- registro_id NOT NULL REFERENCES cgof_gpc_recebidos(codigo) SEM
-- ON DELETE CASCADE — diferente das demais tabelas ligadas ao registro
-- (cgof_gpc_fluxo_tecnico e cgof_gpc_produtividade já tinham cascade desde
-- sempre). O parte_48 já corrigiu o mesmo problema pro lado de exercicio_id
-- (excluir um exercício), mas não mexeu no lado de registro_id.
--
-- Sem isso, excluir um registro que já tenha qualquer Análise/Exercício
-- salvo falha com "violates foreign key constraint
-- cgof_gpc_registro_exercicio_registro_id_fkey" (HTTP 409).
--
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE cgof_gpc_registro_exercicio
  DROP CONSTRAINT IF EXISTS cgof_gpc_registro_exercicio_registro_id_fkey,
  ADD CONSTRAINT cgof_gpc_registro_exercicio_registro_id_fkey
    FOREIGN KEY (registro_id) REFERENCES cgof_gpc_recebidos(codigo) ON DELETE CASCADE;
