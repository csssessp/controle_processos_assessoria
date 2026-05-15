-- Adiciona campos de correção documental à tabela de recebidos
-- Execute este script no Supabase SQL Editor

ALTER TABLE cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS correcao_paginas integer NULL,
  ADD COLUMN IF NOT EXISTS correcao_obs     text    NULL;

COMMENT ON COLUMN cgof_gpc_recebidos.correcao_paginas IS 'Quantidade de páginas analisadas na correção documental';
COMMENT ON COLUMN cgof_gpc_recebidos.correcao_obs     IS 'Descrição do que foi corrigido / motivo da devolução';
