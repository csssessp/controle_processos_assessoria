-- =============================================================
-- parte_28_fix_produtividade_datas.sql
-- Corrige registros em cgof_gpc_produtividade que foram gravados
-- com data errada (maio/2026) devendo estar em meses anteriores.
-- Relaciona cada linha de produtividade com o evento mais próximo
-- em cgof_gpc_fluxo_tecnico e usa a data_evento correta de lá.
-- =============================================================

-- Pré-visualizar o que será corrigido (rode primeiro para conferir):
/*
SELECT
  p.id,
  p.registro_id,
  p.responsavel,
  p.evento,
  p.data_evento AS prod_data,
  ft.data_evento AS fluxo_data
FROM cgof_gpc_produtividade p
JOIN LATERAL (
  SELECT data_evento
  FROM cgof_gpc_fluxo_tecnico ft
  WHERE ft.registro_id = p.registro_id
    AND ft.tecnico = p.responsavel
  ORDER BY ABS(EXTRACT(EPOCH FROM (ft.data_evento - p.data_evento)))
  LIMIT 1
) ft ON true
WHERE p.data_evento::date >= '2026-05-01'
  AND ft.data_evento::date < '2026-05-01'
ORDER BY p.id;
*/

-- Correção efetiva:
-- Para cada linha de produtividade gravada em maio ou depois,
-- se existir evento no fluxo técnico do mesmo processo+técnico
-- com data anterior a maio, atualiza para noon UTC desse dia.
UPDATE cgof_gpc_produtividade p
SET data_evento = (
  SELECT (ft.data_evento::date || 'T12:00:00.000Z')::timestamptz
  FROM cgof_gpc_fluxo_tecnico ft
  WHERE ft.registro_id = p.registro_id
    AND ft.tecnico = p.responsavel
    AND ft.data_evento::date < '2026-05-01'
  ORDER BY ABS(EXTRACT(EPOCH FROM (ft.data_evento - p.data_evento)))
  LIMIT 1
)
WHERE p.data_evento::date >= '2026-05-01'
  AND EXISTS (
    SELECT 1
    FROM cgof_gpc_fluxo_tecnico ft
    WHERE ft.registro_id = p.registro_id
      AND ft.tecnico = p.responsavel
      AND ft.data_evento::date < '2026-05-01'
  );
