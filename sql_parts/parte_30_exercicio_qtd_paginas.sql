-- Adiciona coluna qtd_paginas à tabela cgof_gpc_exercicio
-- Executar no Supabase SQL Editor

ALTER TABLE cgof_gpc_exercicio
  ADD COLUMN IF NOT EXISTS qtd_paginas integer NULL;

COMMENT ON COLUMN cgof_gpc_exercicio.qtd_paginas IS 'Quantidade de páginas do exercício a serem analisadas pelo técnico';
