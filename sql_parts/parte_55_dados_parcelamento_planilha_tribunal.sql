-- =============================================================================
-- PARTE 55: reconciliação de PARCELAMENTOS a partir de 'CONT PROC TRIBUNAL (3).xlsx'.
-- Gerado automaticamente por script de reconciliação — só inclui linhas cujo
-- número de processo já bate com um cgof_gpc_processos existente E cujo
-- proc_parcela ainda não está em cgof_gpc_parcelamento. Total: 3.
-- NOTA: a coluna "Valor do Conv" da planilha é ambígua (pode ser o valor total
-- do convênio, não necessariamente o valor corrigido do débito parcelado) —
-- confira antes de aplicar. Datas de início/término de análise foram mantidas
-- só como texto em `obs` (formatos mistos na planilha, risco de má-interpretação
-- se convertidas automaticamente para data).
-- Execute no SQL Editor do Supabase, SOMENTE após revisão.
-- =============================================================================

-- PARCELAMENTOS item 0 | Prefeitura Municipal de Santos
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs) VALUES (85, '024.00051676/2023-89', 'SEI', 'PARCELAMENTO', 2020, '[2020]'::jsonb, 216000000, 'Situação: Analisado | Observação - Status: Aguardando Julgamento TCE | Fonte: PARCELAMENTOS item 0');
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (85, '024.00051676/2023-89', 'Prefeitura Municipal de Santos', '237/2020', '2020,21,22', 4, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 216000000);

-- PARCELAMENTOS item - | Associação Beneficente de Apiai
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs) VALUES (1480, '024.00059022/2025-65', 'SEI', 'PARCELAMENTO', 2016, '[2016]'::jsonb, 18817.63, 'Fonte: PARCELAMENTOS');
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1480, '024.00059022/2025-65', 'Associação Beneficente de Apiai', '026/2016', '2016', 16, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2016]'::jsonb, 18817.63);

-- CSS PARCELAMENTO item 1 | Associação Hospitalar Beneficente do Brasil – AHBB
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs) VALUES (1592, '024.00109180/2026-54', 'SEI', 'PARCELAMENTO', 2021, '[2021]'::jsonb, 3.99, 'Situação: RETORNO A CSS PARA PROVIDENCIAS | Responsável/Análise: ELENICE | Início da Análise: 18/08/2026 | Término da Análise: 18/08/2026 | Observação - Status: ENCAMINHADO PARA O GGCON P/ ASS | Fonte: CSS PARCELAMENTO item 1');
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1592, '024.00109180/2026-54', 'Associação Hospitalar Beneficente do Brasil – AHBB', '1477/2020', '2021', NULL, 'ELENICE', 'RETORNO A CSS PARA PROVIDENCIAS', TRUE, 'PARCELAMENTO', '[2021]'::jsonb, 3.99);
