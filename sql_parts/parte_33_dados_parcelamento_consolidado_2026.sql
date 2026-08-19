-- ============================================================

-- parte_33_dados_parcelamento_consolidado_2026.sql

-- Importa registros de 'Planilha Parcelamento Consolidada.xlsx'

-- para cgof_gpc_processos / cgof_gpc_parcelamento.

-- Gerado automaticamente. 21 vinculados a processo existente,

-- 72 com criação de novo processo. 24 já existiam (ignorados).

-- Execute no SQL Editor do Supabase.

-- ============================================================



-- ── Vinculados a processos já cadastrados ──────────────────────

-- Item 2 | Santa Casa de Misericórdia de Patrocínio Paulista
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1234, '024.0008712/2023-94', 'SEI', 2018, '[2018, 2019]'::jsonb, 20796.93, NULL, FALSE, FALSE, NULL, 'Situação: analisado | Responsável/Análise: Roberto | Início da Análise: 2025-11-19 00:00:00 | Término da Análise: 2026-04-07 00:00:00 | Observação - Status: 25/03/2026 secretario assinou termo de parcelamento 07/04/2026 enviado a DRS via CRS para providencias cabíveis da entidade | Fonte: 2026');

-- Item 4 | Irmandade de Misericórdia do Hospital são José de Itajobi
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1238, '024.00161679/2023-20', 'SEI', 2014, '[2014, 2015]'::jsonb, 150000.0, NULL, FALSE, FALSE, NULL, 'Situação: analisado | Responsável/Análise: Roberto | Início da Análise: 2025-08-13 00:00:00 | Término da Análise: 2026-03-04 00:00:00 | Observação - Status: 12/03/2025 Autorizo do governador | Fonte: 2026');

-- Item 9 | Irmandade da Santa Casa de Misericórdia de Fernandópolis
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1228, '024.00011498/2026-04', 'SEI', NULL, '[]'::jsonb, 3024000.0, NULL, FALSE, FALSE, NULL, 'Situação: analisado | Responsável/Análise: Elenice | Início da Análise: 2026-03-16 00:00:00 | Término da Análise: 2026-03-17 00:00:00 | Observação - Status: 17/03/2026 enviado ao ggcom para assinatura e apos encaminhar a assessoria para assinatura do termo | Fonte: 2026');

-- Item 10 | Instituto do Cancer Dr. Arnaldo Vieira de Carvalho - IVAC
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1253, '024.00164819/2025-83', 'SEI', 2018, '[2018]'::jsonb, 10944000.0, NULL, FALSE, FALSE, NULL, 'Situação: analisado | Responsável/Análise: Elenice | Início da Análise: 2026-03-10 00:00:00 | Término da Análise: 2026-03-18 00:00:00 | Observação - Status: 18/03/2026 encaminha ao GGCON para Assinatura | Fonte: 2026');

-- Item 11 | Prefeitura Municipal de Sete Barras
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (251, '024.00006232/2026-31', 'SEI', 2021, '[2021]'::jsonb, 500000.0, NULL, FALSE, FALSE, NULL, 'Situação: analisado | Responsável/Análise: Elenice | Início da Análise: 2026-03-16 00:00:00 | Término da Análise: 2026-03-17 00:00:00 | Observação - Status: ENVIADO AO GGCON EM 17/03/2026 ESTA NO BLOCO DA MARILSA PARA ASS.Parcelamento | Fonte: 2026');

-- Item 13 | Associação de Proteção a Maternidade e à Infância Maternidade Fernando Magalães
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1297, '024.00179961/2024-44', 'SEI', 2013, '[2013, 2014]'::jsonb, 1220613.17, 24, FALSE, TRUE, 'NEGOCIAÇÃO DO PAGAMENTO DAS 04 PARCELAS', 'FASE FINAL DE PREPARAÇÃO DO TERMO DE PARCELAMENTO DAS 04 PARCELAS | Situação: analisado | Responsável/Análise: Elenice/Roberto | Início da Análise: 2024-12-19 00:00:00 | Término da Análise: 2026-04-07 00:00:00 | Parcelas Já Pagas: 20 | Observação - Status: 18/03/2026 Enviado ao GGCON para Assinatura e envio à Assessoria - iniciou pagamento das parcelas | Observação Adicional 2: foi pedido reparcelamento de quatro parcelas | Objeto: Custeio - Serviços de Oftalmologia | Fonte: Ambos');

-- Item 14 | Irmandade da Santa Casa de Misericórdia de Fernandópolis
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1313, '024.00031029/2026-01', 'SEI', 2024, '[2024]'::jsonb, 1470836.54, NULL, FALSE, FALSE, NULL, 'Situação: analisado | Responsável/Análise: Roberto/Elenice | Início da Análise: 2026-03-11 00:00:00 | Observação - Status: 01/04/2026 enviado a assesoria para envio ao gabinete e posterior envio a cj | Fonte: 2026');

-- Item 16 | Prefeitura Municipal de Sumare
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1225, '024.00100587/2025-35', 'SEI', 2014, '[2014]'::jsonb, 470552.06, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: Roberto/Elenice | Início da Análise: 2026-04-15 00:00:00 | Término da Análise: 2026-04-16 00:00:00 | Observação - Status: 06/05/2026 encaminhada a assesoria para envio ao gabinete do secretario | Fonte: 2026');

-- Item 17 | Associação Criança Especial de Pais Companhiros - CEPAC - JACAREI
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1207, '024.00033376/2026-61', 'SEI', 2025, '[2025]'::jsonb, 100000.0, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: Roberto/Gilmar | Início da Análise: 2026-03-30 00:00:00 | Observação - Status: 19/05/2026 apos assinatura do secretario encaminhado ao GGCon para asinatura e posterior envio a DRS para Assinatura do Termo | Fonte: 2026');

-- Item 18 | Associação Amigos dos Deficientes - AMDE
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1373, '024.00091128/2025-53', 'SEI', 2017, '[2017]'::jsonb, 4582290.0, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: Roberto | Início da Análise: 2026-06-16 00:00:00 | Observação - Status: 03/07/2026 - após assinatura do autorizo do Secretario enviado a DRS via CRS para assibatura do Termo | Fonte: 2026');

-- Item 20 | Associação de Proteção à Maternidade e à Infância de Registro – APAMIR
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1305, '024.00060281/2026-10', 'SEI', 2017, '[2017]'::jsonb, 45885000.0, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: Roberto | Início da Análise: 2026-05-13 00:00:00 | Observação - Status: 15/06/2026 - enviado para ggcom para assinatura | Fonte: 2026');

-- Item 21 | Irmandade da Santa Casa da Misericórdia de Santos
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1335, '024.00184496/2025-44', 'SEI', 2017, '[2017]'::jsonb, 66691908.0, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: Patricia/Gilmar | Início da Análise: 0/06/2026 | Término da Análise: 2026-06-01 00:00:00 | Observação - Status: 01/06/2026 encaminhado ao GGCON para assinatura e encaminhar para o autorizo do Secretario | Fonte: 2026');

-- Item 28 | Irmandade de Misericórdia do Hospital são José de Itajobi
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1238, '024.00161679/2023-20', 'SEI', 2014, '[2014, 2015]'::jsonb, 315967.7, NULL, FALSE, FALSE, NULL, 'Situação: ANALISADO | Responsável/Análise: ROBERTO | Início da Análise: 2025-08-13 00:00:00 | Término da Análise: 2025-08-14 00:00:00 | Observação - Status: Processo encaminhado ao GGCON para assinatura e encaminhar ao Secretario para Assinatura do termo de Parcelamento | Fonte: 2026');

-- Item 31 | Associação de Proteção a Maternidade e à Infância Maternidade Fernando Magalães
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1297, '024.00179961/2024-44', 'SEI', 2014, '[2014, 2015]'::jsonb, 436740.72, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: 2025-10-22 00:00:00 | Início da Análise: 2024-11-08 00:00:00 | Término da Análise: 2025-07-17 00:00:00 | Observação - Status: em 21/11/2024 enviado a Assessoria para assinatura. Em 27/11/2024 recebido pelo gabinete. 28/11/2024 enviado enviado a CJ. - devolvido crs 22/10/2025 | Fonte: 2026');

-- Item 32 | Santa Casa de Misericordia José Bonifácio
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (421, '02400011770/2025-67', NULL, 2018, '[2018]'::jsonb, 32909.46, NULL, FALSE, FALSE, NULL, 'Situação: Parcelamento foi analisado e concluido | Responsável/Análise: Roberto | Início da Análise: 2025-02-07 00:00:00 | Término da Análise: 2025-11-07 00:00:00 | Observação - Status: Encaminhado para assinatura do GGCON | Fonte: 2026');

-- Item 39 | Santa Casa de Misericórdia de Patrocínio Paulista
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1234, '024.0008712/2023-94', 'SEI', 2018, '[2018, 2019]'::jsonb, 21049.96, NULL, FALSE, FALSE, NULL, 'Situação: ANALISADO | Responsável/Análise: ROBERTO | Início da Análise: 2025-06-23 00:00:00 | Observação - Status: 13/01/2026 enviado a assessoria | Fonte: 2026');

-- Item 46 | Irmandade da Santa Casa de Misericórdias de Mogi Guaçú
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (263, '024.00125563/2023-27', 'SEI', 2020, '[2020]'::jsonb, 84177.9, 20, TRUE, FALSE, 'Não parou', 'informação em 26/03/2025 | Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2023-09-25 00:00:00 | Término da Análise: 2023-11-23 00:00:00 | Parcelas Já Pagas: 16 | Observação - Status: Conveniada esta em dia com as parcelas - Quitado | Objeto: Custeio | Fonte: Ambos');

-- Item 51 | Santa Casa de Misericórdia de Salto Grande
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (1031, '024.00144756/2024-68', 'SEI', 2023, '[2023]'::jsonb, 181093.39, NULL, FALSE, FALSE, NULL, 'Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2024-11-05 00:00:00 | Término da Análise: 2025-01-15 00:00:00 | Observação - Status: foi encaminhado para assinatura do termo parcelamento de debito/em 16/01/2025 foi enviado para a DRS para acompanhar os pagamentos das parcelas | Fonte: 2026');

-- Item 71 | ADACAMP
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (122, '1716178/2020', NULL, NULL, '[]'::jsonb, 59244.85, 60, FALSE, FALSE, NULL, 'Observação - Status: 60 parcelas não tem informação de pagamento | Sem Papel: 9 | Fonte: Ambos');

-- Item 99 | Instituto Bezerra de Menezes
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (266, 'SES-PRC-2022/79240', NULL, NULL, '[]'::jsonb, 24352.56, NULL, FALSE, FALSE, NULL, 'Observação - Status: Quitado | Fonte: 2026');

-- Item 110 | Assoc. Espírita Vicente de Paulo - Inst. Bezerra Menezes
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs) VALUES (266, 'SES-PRC-2022/79240', NULL, NULL, '[]'::jsonb, 24352.56, 20, TRUE, FALSE, NULL, 'ENCERRADA | Parcelas Já Pagas: 20 | Sem Papel: SES-PRC-2022/79240 | Fonte: DRS (somente)');



-- ── Novo processo + parcelamento (CTE) ──────────────────────────

-- Item 19 | Prefeitura Municipal de Apiaí
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00070468/2026-21', '795/2018', 'Prefeitura Municipal de Apiaí', 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00070468/2026-21', 'SEI', NULL, '[]'::jsonb, 636800.0, NULL, FALSE, FALSE, NULL, 'Situação: em analise | Responsável/Análise: Roberto | Término da Análise: 2026-05-13 00:00:00 | Fonte: 2026' FROM np;

-- Item 34 | Sta Casa Patrocinio Paulista
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00008810/2023-21', '1618/2023', 'Sta Casa Patrocinio Paulista', 8, '2014', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00008810/2023-21', 'SEI', 2014, '[2014]'::jsonb, 42301.14, 48, FALSE, FALSE, NULL, 'Planilhas de débito atualizadas, aguardando Demonstrativo atualizado da Receita/Despesa pelo município. | Início da Análise: 2023-09-26 00:00:00 | Observação - Status: Verificar junto DRS Andamento Processo - solicitou um novo parcelamento | Observação Adicional 2: Reparcelamento da Dívida (*) | Sem Papel: SES-PRC-2023/01936 | Fonte: Ambos' FROM np;

-- Item 35 | Sta Casa Patrocinio Paulista
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00008715/2023-28', '1441/2020', 'Sta Casa Patrocinio Paulista', 8, '2020', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00008715/2023-28', 'SEI', 2020, '[2020]'::jsonb, 53712.81, 5, FALSE, FALSE, NULL, 'Atualizando valores da Planilha de Parcelamento. | Início da Análise: 2023-04-14 00:00:00 | Observação - Status: Verificar junto DRS Andamento Processo | Observação Adicional 2: Providenciar Termo de Parcelamento e Ciência | Sem Papel: SES-PRC-2023/02421 | Fonte: Ambos' FROM np;

-- Item 36 | Sta Casa Patrocinio Paulista
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00008798/2023-55', '1282/2020', 'Sta Casa Patrocinio Paulista', 8, '2021', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00008798/2023-55', 'SEI', 2021, '[2021]'::jsonb, 14917.0, 5, FALSE, FALSE, NULL, 'Aguardando revisão de cálculo da Planilha de parcelamento de divida. | Situação: Concluido | Responsável/Análise: Elenice | Início da Análise: 2023-08-23 00:00:00 | Término da Análise: 2023-09-26 00:00:00 | Observação - Status: 26/09/2023 encaminhado par DRS via CRS para providencias e pgto | Observação Adicional 2: Providenciar Termo de Parcelamento e Ciência | Sem Papel: SES-PRC-2023/00263 | Fonte: Ambos' FROM np;

-- Item 38 | Prefeitura Cubatão
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00008198/2023-97', '1092/2014', 'Prefeitura Cubatão', 4, '2014', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00008198/2023-97', 'SEI', 2014, '[2014]'::jsonb, 5853993.03, 48, TRUE, FALSE, NULL, 'Processo de parcelamento nº SEI 024.00008198/2023-97 | Situação: ANALISADO | Responsável/Análise: Elenice | Início da Análise: 2023-11-22 00:00:00 | Término da Análise: 2024-01-08 00:00:00 | Parcelas Já Pagas: 16 | Observação - Status: Conveniadas esta efetivando pagamento, 22 pagas 12/2025 | Observação Adicional 2: Atualizado em 10/07/25 - Parcela 16/48 | Objeto: Custeio - Sustentável | Sem Papel: SES-PRC-2022/43584 | Fonte: Ambos' FROM np;

-- Item 44 | Santa Casa de Misericórdia de São Simão
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00047444/2024-15', 'TA 01/2018 ao Conv 540/2016', 'Santa Casa de Misericórdia de São Simão', 13, '2020', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00047444/2024-15', 'SEI', 2020, '[2020]'::jsonb, 12996.08, 48, TRUE, FALSE, 'não se aplica', 'Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2024-10-21 00:00:00 | Término da Análise: 2024-10-24 00:00:00 | Parcelas Já Pagas: 2 | Observação - Status: Conveniada esta em dia com as parcelas | Observação Adicional 2: Encaminhado despacho a DRS Providenciar Termo de Reconhecimento e Parcelamento Débito após publicado em DO Autorizo do Secretario 19/12/2024 | TA: 01/2018 | Objeto: CUSTEIO | Fonte: Ambos' FROM np;

-- Item 45 | Santa Casa de Misericórdia de São Simão
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00010054/2023-09', '1009/2020', 'Santa Casa de Misericórdia de São Simão', 13, '2021', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00010054/2023-09', 'SEI', 2021, '[2021]'::jsonb, 140002.4, 48, TRUE, FALSE, 'não se aplica', 'Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2023-08-21 00:00:00 | Término da Análise: 2023-09-05 00:00:00 | Parcelas Já Pagas: 17 | Observação - Status: 05/09/2023 enviado a DRS via CRS para inicio do pagamento, conveniada esta em dia com as parcelas | Observação Adicional 2: Valor da parcela R$ 3.492,99 | Objeto: Custeio – serviços de terceiros e material de consumo – Investimento: aquisição de equipamentos | Sem Papel: PROCESSO SOLICITAÇÃO PARCELAMENTO SES-PRC-2023/20713-V01 | Fonte: Ambos' FROM np;

-- Item 47 | Fundação Espirita Americo Bairral
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00096386/2024-45', '655/2016', 'Fundação Espirita Americo Bairral', 14, '2017', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00096386/2024-45', 'SEI', 2017, '[2017]'::jsonb, 202523.03, 24, TRUE, FALSE, 'Não parou', 'informação em 26/03/2025 | Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2024-06-21 00:00:00 | Término da Análise: 2024-11-21 00:00:00 | Parcelas Já Pagas: 4 | Observação - Status: Conveniada esta em dia com as parcelas - Quitado | Objeto: Custeio | Fonte: Ambos' FROM np;

-- Item 48 | Fundação Espirita Americo Bairral
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00096474/2024-47', '655/2016', 'Fundação Espirita Americo Bairral', 14, '2018', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00096474/2024-47', 'SEI', 2018, '[2018]'::jsonb, 38736.51, 24, TRUE, FALSE, 'Não parou', 'informação em 26/03/2025 | Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2024-06-21 00:00:00 | Término da Análise: 2024-11-21 00:00:00 | Parcelas Já Pagas: 4 | Observação - Status: Conveniada esta em dia com as parcelas - Quitado | Objeto: Custeio | Fonte: Ambos' FROM np;

-- Item 50 | Prefeitura Municipal de Ibirarema
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00008372/2023-00', '534/2018', 'Prefeitura Municipal de Ibirarema', 9, '2018', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00008372/2023-00', 'SEI', 2018, '[2018]'::jsonb, 72449.89, NULL, FALSE, FALSE, NULL, 'Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2023-07-27 00:00:00 | Término da Análise: 24/014/2024 | Observação - Status: Quitado em 2 parcelas 1º 28/02/2024 e a 2º 15/04/2024 | Fonte: 2026' FROM np;

-- Item 52 | APAE-Ituverava
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('024.00008677/2023-11', 'TA 01/2015 Conv 1339/2014', 'APAE-Ituverava', 8, '2020', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '024.00008677/2023-11', 'SEI', 2020, '[2020]'::jsonb, 29197.85, 48, FALSE, FALSE, NULL, 'Planilha de débito atualizada pela calculadora cidadão. | Situação: Analisado | Responsável/Análise: Elenice | Início da Análise: 2023-06-14 00:00:00 | Término da Análise: 2023-11-21 00:00:00 | Observação - Status: Conveniada iniciou pagamento em 10/11/2023 | Observação Adicional 2: Encaminhado CGOF/CRS | TA: TA 01/2015 | Sem Papel: SES-PRC-2023/08709 | Fonte: Ambos' FROM np;

-- Item 53 | Santa Casa de Guararapes
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0202/001212/2015', '2487/2013', 'Santa Casa de Guararapes', 2, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0202/001212/2015', NULL, NULL, '[]'::jsonb, 317749.14, 48, TRUE, TRUE, 'Parou por decisão do TC', 'Sentença TC–014640.989.20 | Situação: Analisado | Parcelas Já Pagas: TODAS | Observação - Status: Quitado | Objeto: Investimento: Reforma e Implantação do Pronto Socorro | Fonte: Ambos' FROM np;

-- Item 54 | Santa Casa Araçatuba
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0202/000266/2014', '274/2014', 'Santa Casa Araçatuba', 2, '2014', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0202/000266/2014', NULL, 2014, '[2014]'::jsonb, 146770.96, 25, FALSE, FALSE, 'Parou por decisão do Tribunal de Justiça Processo: 1000626-55.2024.8.26.0359', 'Encaminhando a decisão em anexo no e-mail | Situação: Analisado | Parcelas Já Pagas: 11 | Observação - Status: Parou por decisão do Tribunal de Justiça Processo: 1000626-55.2024.8.26.0359 | Objeto: Sustentáveis Estruturantes | Fonte: Ambos' FROM np;

-- Item 55 | Santa Casa Araçatuba
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0202/000266/2014', '274/2014', 'Santa Casa Araçatuba', 2, '2015', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0202/000266/2014', NULL, 2015, '[2015]'::jsonb, 106320.17, 25, FALSE, FALSE, 'Parou por decisão do Tribunal de Justiça Processo: 1000626-55.2024.8.26.0359', 'Encaminhando a decisão em anexo no e-mail | Situação: Analisado | Parcelas Já Pagas: 11 | Observação - Status: Parou por decisão do Tribunal de Justiça Processo: 1000626-55.2024.8.26.0359 | Objeto: Sustentáveis Estruturantes | Fonte: Ambos' FROM np;

-- Item 56 | Prefeitura Municipal São Vicente
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0204/000.241/2016', 'TA 001/2014', 'Prefeitura Municipal São Vicente', 4, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0204/000.241/2016', NULL, NULL, '[]'::jsonb, 576735.59, 24, FALSE, TRUE, 'Ofício interessado e Termo de Quitação', 'CONCLUÍDO | Situação: Analisado | Parcelas Já Pagas: 24 | Observação - Status: Quitado | TA: 001/2014 | Objeto: Investimento - Equipamento | Fonte: Ambos' FROM np;

-- Item 57 | Prefeitura Municipal Itanhaem
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0204/000.165/2016', 'TA 002/2014', 'Prefeitura Municipal Itanhaem', 4, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0204/000.165/2016', NULL, NULL, '[]'::jsonb, 683200.14, 24, FALSE, TRUE, 'Ofício interessado e Termo de Quitação', 'CONCLUÍDO | Situação: Analisado | Parcelas Já Pagas: 24 | Observação - Status: Quitado | TA: 002/2014 | Objeto: Custeio - Reforma no Centro de Infectologia | Fonte: Ambos' FROM np;

-- Item 58 | Prefeitura Municipal São Vicente
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0204/000.255/2014', 'TA 005/2010', 'Prefeitura Municipal São Vicente', 4, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0204/000.255/2014', NULL, NULL, '[]'::jsonb, 326229.61, 24, FALSE, TRUE, 'Ofício interessado e Termo de Quitação', 'CONCLUÍDO | Situação: Analisado | Parcelas Já Pagas: 24 | Observação - Status: Quitado | TA: 005/2010 | Objeto: Invest - Const Zoonose | Fonte: Ambos' FROM np;

-- Item 59 | Prefeitura Bertioga
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0204/000.168/2016', '1093/2014', 'Prefeitura Bertioga', 4, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0204/000.168/2016', NULL, NULL, '[]'::jsonb, 2554095.05, 36, FALSE, TRUE, 'Ofício interessado e Termo de Quitação', 'CONCLUÍDO | Situação: Analisado | Parcelas Já Pagas: 36 | Observação - Status: Quitado | Objeto: Custeio - SUStentável | Fonte: Ambos' FROM np;

-- Item 60 | Prefeitura Municipal Itanhaem
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0204/000.240/2016', '802/2014', 'Prefeitura Municipal Itanhaem', 4, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0204/000.240/2016', NULL, NULL, '[]'::jsonb, 725691.57, 30, FALSE, TRUE, 'Ofício interessado e Termo de Quitação', 'CONCLUÍDO | Situação: Analisado | Parcelas Já Pagas: 30 | Observação - Status: Quitado | Objeto: Custeio e Prestação de Serviço - Reforma Centros Especialidades, Reabilitação e Fisioterapia | Fonte: Ambos' FROM np;

-- Item 61 | Santa Casa de Barretos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', '248/2012', 'Santa Casa de Barretos', 5, '2012', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, 2012, '[2012]'::jsonb, 715501.6, 24, FALSE, TRUE, NULL, 'QUITADO EM 07-05-2020 | Situação: Analisado | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 62 | Prefeitura de Barretos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0205.000731/2017', '260/2015', 'Prefeitura de Barretos', 5, '2015', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0205.000731/2017', 'SEI', 2015, '[2015]'::jsonb, 490488.57, 24, FALSE, TRUE, NULL, 'QUITADO EM 01-06-2021 | Situação: Analisado | Parcelas Já Pagas: - | Observação - Status: Quitado | Objeto: Investimento - Aquisição de Equipamentos | Fonte: Ambos' FROM np;

-- Item 63 | Prefeitura de Barretos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0205.000698/2017', '337/2014', 'Prefeitura de Barretos', 5, '2014', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0205.000698/2017', 'SEI', 2014, '[2014]'::jsonb, 13656.46, NULL, FALSE, TRUE, NULL, 'MUNICÍPIO ENVIOU OS DOCUMENTOS PARA O TCESP, QUE JULGOU REGULAR COM DEVOLUÇÃO PARCELA ÚNICA. | Situação: Analisado | Parcelas Já Pagas: - | Observação - Status: MUNICÍPIO ENVIOU OS DOCUMENTOS PARA O TCESP, QUE JULGOU REGULAR COM DEVOLUÇÃO PARCELA ÚNICA. | Objeto: Custeio - Santas Casa Sustentáveis | Fonte: Ambos' FROM np;

-- Item 64 | Prefeitura de Barretos - Sta Casa - SANI
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0205.000684/2017', '338/2014', 'Prefeitura de Barretos - Sta Casa - SANI', 5, '2014', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0205.000684/2017', 'SEI', 2014, '[2014]'::jsonb, 117907.74, 12, FALSE, TRUE, NULL, 'QUITADO EM 08-09-2020 | Situação: Analisado | Parcelas Já Pagas: - | Observação - Status: Quitado | Sem Papel: SES/2010070-2018 | Fonte: Ambos' FROM np;

-- Item 65 | Prefeitura Municipal Bebedouro
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('SPDOC 1369371/17', '841/2014', 'Prefeitura Municipal Bebedouro', 5, '2014', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, 'SPDOC 1369371/17', NULL, 2014, '[2014]'::jsonb, 434211.34, 24, FALSE, TRUE, NULL, 'QUITADO EM 08-09-2021 | Situação: Analisado | Parcelas Já Pagas: - | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 66 | Fundação PIO XII - Barretos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('SES-PRC- 2022/38217', '076/2015', 'Fundação PIO XII - Barretos', 5, '2015', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, 'SES-PRC- 2022/38217', NULL, 2015, '[2015]'::jsonb, 930027.54, 36, TRUE, FALSE, NULL, 'COMPROVANTES | Situação: Analisado | Parcelas Já Pagas: 28 | Observação - Status: Até a parcela 23 tem comprovante, de 24 a 28 considera o pagamento regular e esta cobrando da conveniada os comprovante de pagamento sem sucesso utimo e-mail enviado 14/03/2025 porem sem exito | Observação Adicional 2: Até a parcela 23 tem comprovante, de 24 a 28 considera o pagamento regular e esta cobrando da conveniada os comprovante de pagamento sem sucesso utimo e-mail enviado 14/03/2025 porem sem exito | Sem Papel: SES-PRC- 2022/38217 | Fonte: Ambos' FROM np;

-- Item 67 | Hospital Sta Terezinha e Maternidade Ercilia Pieroni
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0206.002411/2017', NULL, 'Hospital Sta Terezinha e Maternidade Ercilia Pieroni', 6, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0206.002411/2017', 'SEI', NULL, '[]'::jsonb, 99897.35, 24, FALSE, TRUE, NULL, 'QUITADO | Situação: Analisado | Parcelas Já Pagas: 24 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 68 | Prefeitura Bauru - Sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0206.000699/2014', NULL, 'Prefeitura Bauru - Sani', 6, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0206.000699/2014', 'SEI', NULL, '[]'::jsonb, NULL, 60, TRUE, FALSE, NULL, 'DOE 04/05/19- DRS ACOMPANHAR PAGTO | Situação: Analisado | Parcelas Já Pagas: 52 | Observação - Status: DOE 04/05/19- DRS ACOMPANHAR PAGTO Pagou 52/60 | Fonte: Ambos' FROM np;

-- Item 69 | Prefeitura Bauru - Sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0206.000049/2016', NULL, 'Prefeitura Bauru - Sani', 6, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0206.000049/2016', 'SEI', NULL, '[]'::jsonb, 452282.24, 60, TRUE, FALSE, NULL, 'Situação: Analisado | Parcelas Já Pagas: 52 | Observação - Status: Pagou 52/60 | Sem Papel: 2 | Fonte: Ambos' FROM np;

-- Item 70 | Instituto Padre Haroldo Rahm
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', '344/2014', 'Instituto Padre Haroldo Rahm', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 44232.81, 12, FALSE, FALSE, NULL, 'Observação - Status: 12 parcelas não tem informação de pagamento | Fonte: Ambos' FROM np;

-- Item 72 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 01/2019', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 8157403.31, 60, FALSE, FALSE, NULL, 'Observação - Status: 60 parcelas não tem informação de pagamento | TA: ta 01/2009 | Fonte: Ambos' FROM np;

-- Item 73 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 01/2011', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 3713532.79, 60, FALSE, FALSE, NULL, 'Observação - Status: 60 parcelas não tem informação de pagamento | TA: Ta 01/2011 | Fonte: Ambos' FROM np;

-- Item 74 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 01/2012', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 1132891.06, 60, FALSE, FALSE, NULL, 'Observação - Status: 60 parcelas não tem informação de pagamento | TA: TA 01/2012 | Fonte: Ambos' FROM np;

-- Item 75 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 01/2012', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 700000.0, 180, FALSE, FALSE, NULL, 'Observação - Status: 180 parcelas não tem informação de pagamento | TA: TA 01/2012 | Fonte: Ambos' FROM np;

-- Item 76 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 02/2011', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 1805915.07, 180, FALSE, FALSE, NULL, 'Observação - Status: 180 parcelas não tem informação de pagamento | TA: TA 02/2011 | Fonte: Ambos' FROM np;

-- Item 77 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 02/2012', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 2719121.15, 180, FALSE, FALSE, NULL, 'Observação - Status: 180 parcelas não tem informação de pagamento | TA: Ta 02/2012 | Fonte: Ambos' FROM np;

-- Item 78 | Prefeitura de Americana
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', 'TA 03/2012', 'Prefeitura de Americana', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 5315149.37, 60, FALSE, FALSE, NULL, 'Observação - Status: 60 parcelas não tem informação de pagamento | TA: Ta 03/2012 | Fonte: Ambos' FROM np;

-- Item 79 | Prefeitura Itupeva - Sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1395214/18', NULL, 'Prefeitura Itupeva - Sani', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1395214/18', NULL, NULL, '[]'::jsonb, NULL, 60, FALSE, FALSE, NULL, 'Observação - Status: 60 parcelas não tem informação de pagamento | Fonte: Ambos' FROM np;

-- Item 80 | Prefeitura Muniucipal de Holambra
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1815021/18', NULL, 'Prefeitura Muniucipal de Holambra', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1815021/18', NULL, NULL, '[]'::jsonb, NULL, NULL, FALSE, FALSE, NULL, 'Observação - Status: Falta Informação sobre o parcelamento | Fonte: Ambos' FROM np;

-- Item 81 | Prefeitura de Sumaré
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('96483/14', NULL, 'Prefeitura de Sumaré', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '96483/14', NULL, NULL, '[]'::jsonb, NULL, 36, FALSE, FALSE, NULL, 'Observação - Status: 36 parcelas não tem informação de pagamento | Fonte: Ambos' FROM np;

-- Item 82 | Prefeitura de Sumaré
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1934463/18', NULL, 'Prefeitura de Sumaré', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1934463/18', NULL, NULL, '[]'::jsonb, NULL, 24, FALSE, FALSE, NULL, 'Observação - Status: 24 parcelas não tem informação de pagamento | Fonte: Ambos' FROM np;

-- Item 83 | Maternidade de Campinas
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('931464/19 e 931708/19', NULL, 'Maternidade de Campinas', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '931464/19 e 931708/19', NULL, NULL, '[]'::jsonb, NULL, NULL, FALSE, FALSE, NULL, 'Observação - Status: Falta Informação sobre o parcelamento | Fonte: Ambos' FROM np;

-- Item 84 | Maternidade de Campinas
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('777061/19; 777305/19', NULL, 'Maternidade de Campinas', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '777061/19; 777305/19', NULL, NULL, '[]'::jsonb, NULL, NULL, FALSE, FALSE, NULL, 'Observação - Status: Falta Informação sobre o parcelamento | Fonte: Ambos' FROM np;

-- Item 85 | Sta Casa Leonor Mendes de Barros
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', NULL, 'Sta Casa Leonor Mendes de Barros', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, 4617.19, 48, FALSE, FALSE, NULL, 'Observação - Status: 48 parcelas não tem informação de pagamento | Fonte: Ambos' FROM np;

-- Item 86 | Lar São Francisco - JACI
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('503363/19 e 509212/19', NULL, 'Lar São Francisco - JACI', 7, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '503363/19 e 509212/19', NULL, NULL, '[]'::jsonb, NULL, 12, FALSE, FALSE, NULL, 'Observação - Status: 12 parcelas não tem informação de pagamento | Fonte: Ambos' FROM np;

-- Item 87 | Santa Casa Capivari
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0210/000.337/2013', 'TA 03/2012 155/2008', 'Santa Casa Capivari', 10, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0210/000.337/2013', NULL, NULL, '[]'::jsonb, 224748.14, 60, TRUE, FALSE, NULL, 'Parcelas Já Pagas: 48 | Observação - Status: O pagamento está sendo feito rigorosamente em dia até o momento | Observação Adicional 2: O pagamento está sendo feito rigorosamente em dia até o momento | TA: TA 03/2012 | Fonte: Ambos' FROM np;

-- Item 88 | Prefeitura de Leme
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0206.002440/1998', NULL, 'Prefeitura de Leme', 10, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0206.002440/1998', 'SEI', NULL, '[]'::jsonb, NULL, 49, FALSE, FALSE, NULL, 'FAZER TERMO PARCELAMENTO - 28/03/19 | Observação - Status: A dívida foi extinta por decisão judicial | Observação Adicional 2: A dívida foi extinta por decisão judicial | Fonte: Ambos' FROM np;

-- Item 89 | Associação Teodoro Sampaio
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('510645/2019', 'TA 03/2012 921/2007', 'Associação Teodoro Sampaio', 11, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '510645/2019', NULL, NULL, '[]'::jsonb, 33321.83, 12, FALSE, TRUE, NULL, 'Observação - Status: Quitado | TA: 03/2012 | Fonte: Ambos' FROM np;

-- Item 90 | Santa Casa Presidente Epitacio
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0211.000205/2014', '431/2014', 'Santa Casa Presidente Epitacio', 11, '2015', TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0211.000205/2014', 'SEI', 2015, '[2015]'::jsonb, 38260.8, 12, FALSE, TRUE, NULL, 'Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 91 | Lar São Francisco Assis
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0211/000207/2013', NULL, 'Lar São Francisco Assis', 11, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0211/000207/2013', NULL, NULL, '[]'::jsonb, NULL, 12, FALSE, TRUE, NULL, 'Observação - Status: Valor Pago em Parcela Única | Fonte: Ambos' FROM np;

-- Item 92 | APAMIR
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0212.000081/2013', '107/2013', 'APAMIR', 12, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0212.000081/2013', 'SEI', NULL, '[]'::jsonb, 249103.61, 24, FALSE, TRUE, NULL, 'DOE 04/05/19- DRS ACOMPANHAR PAGTO | Parcelas Já Pagas: 24 | Observação - Status: Conforme parecer conclusivo de quitação de débito, encerrou-se o pagamento das 24 parcelas no valor de R$ 10.379,31 em 10/05/2021. Em 13/07/2021 após análise do GGA/CRS, foi verificado divergência de valor do reajuste do pagamento efetuado, restando a pagar o valor de R$ 4.152,88, quitado em 06/08/2021, conforme parecer conclusivo de quitação de débito 18/11/2021. | Observação Adicional 2: Conforme parecer conclusivo de quitação de débito, encerrou-se o pagamento das 24 parcelas no valor de R$ 10.379,31 em 10/05/2021. Em 13/07/2021 após análise do GGA/CRS, foi verificado divergência de valor do reajuste do pagamento efetuado, restando a pagar o valor de R$ 4.152,88, quitado em 06/08/2021, conforme parecer conclusivo de quitação de débito 18/11/2021. | Fonte: Ambos' FROM np;

-- Item 93 | Santa Casa Misericordia Dona Carolina Malheiros
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0214.001.212/2016', '131/2015', 'Santa Casa Misericordia Dona Carolina Malheiros', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0214.001.212/2016', 'SEI', NULL, '[]'::jsonb, 233547.1, 24, FALSE, TRUE, NULL, 'ENCERRADA | Parcelas Já Pagas: 24 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 94 | Santa Casa Misericordia Dona Carolina Malheiros
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0214.000.090/2017', '141/2015', 'Santa Casa Misericordia Dona Carolina Malheiros', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0214.000.090/2017', 'SEI', NULL, '[]'::jsonb, 421198.46, 24, FALSE, TRUE, NULL, 'ENCERRADA | Parcelas Já Pagas: 24 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 95 | Santa Casa Misericordia Dona Carolina Malheiros
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0214.000.394/2016', '141/2015', 'Santa Casa Misericordia Dona Carolina Malheiros', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0214.000.394/2016', 'SEI', NULL, '[]'::jsonb, 151512.75, 24, FALSE, TRUE, NULL, 'ENCERRADA | Parcelas Já Pagas: 24 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 96 | Santa Casa Misericordia Dona Carolina Malheiros
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.021.000.091/2017', '397/2016', 'Santa Casa Misericordia Dona Carolina Malheiros', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.021.000.091/2017', 'SEI', NULL, '[]'::jsonb, 173138.64, 24, FALSE, TRUE, NULL, 'ENCERRADA | Parcelas Já Pagas: 24 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 97 | Santa Casa Misericordia Dona Carolina Malheiros
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0214.000.090/2017', '398/2016', 'Santa Casa Misericordia Dona Carolina Malheiros', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0214.000.090/2017', 'SEI', NULL, '[]'::jsonb, 151512.75, 24, FALSE, TRUE, NULL, 'ENCERRADA | Parcelas Já Pagas: 24 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 98 | Prefeitura São João Boa Vista
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1723420/2018', '571/2016', 'Prefeitura São João Boa Vista', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1723420/2018', NULL, NULL, '[]'::jsonb, 47685.75, 10, FALSE, TRUE, NULL, 'ENCERRADA | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 100 | Prefeitura Casa Branca - Sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0214.000334/2014', NULL, 'Prefeitura Casa Branca - Sani', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0214.000334/2014', 'SEI', NULL, '[]'::jsonb, NULL, 20, FALSE, TRUE, NULL, 'ENCERRADA | Observação - Status: Devolveu em Parcela Única | Fonte: Ambos' FROM np;

-- Item 101 | Prefeitura Casa Branca - Sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0214.000423/2017', NULL, 'Prefeitura Casa Branca - Sani', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0214.000423/2017', 'SEI', NULL, '[]'::jsonb, 86253.58, 20, FALSE, TRUE, NULL, 'ENCERRADA | Observação - Status: Devolveu em Parcela Única | Fonte: Ambos' FROM np;

-- Item 102 | Santa Casa Caconde
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001/0214/000.167/2015', NULL, 'Santa Casa Caconde', 14, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001/0214/000.167/2015', NULL, NULL, '[]'::jsonb, 100000.0, 48, TRUE, FALSE, NULL, 'ENCERRADA | Parcelas Já Pagas: 48 | Observação - Status: Quitado | Fonte: Ambos' FROM np;

-- Item 103 | PREFEITURA ANGATUBA - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0216.000553/2014', NULL, 'PREFEITURA ANGATUBA - sani', 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0216.000553/2014', 'SEI', NULL, '[]'::jsonb, NULL, 24, FALSE, FALSE, NULL, 'Fonte: Ambos' FROM np;

-- Item 104 | PREFEITURA ANGATUBA - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0216.001081/2014', NULL, 'PREFEITURA ANGATUBA - sani', 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0216.001081/2014', 'SEI', NULL, '[]'::jsonb, NULL, 24, FALSE, FALSE, NULL, 'Fonte: Ambos' FROM np;

-- Item 105 | SANTA CASA DE SOROCABA - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0216.001380/2012', NULL, 'SANTA CASA DE SOROCABA - sani', 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0216.001380/2012', 'SEI', NULL, '[]'::jsonb, NULL, NULL, FALSE, FALSE, NULL, 'Fonte: Ambos' FROM np;

-- Item 106 | SANTA CASA DE SOROCABA - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0216.000576/2013', NULL, 'SANTA CASA DE SOROCABA - sani', 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0216.000576/2013', 'SEI', NULL, '[]'::jsonb, NULL, 12, FALSE, FALSE, NULL, 'Fonte: Ambos' FROM np;

-- Item 107 | 
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('1010', NULL, NULL, 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '1010', NULL, NULL, '[]'::jsonb, NULL, NULL, FALSE, FALSE, NULL, 'Fonte: 2026' FROM np;

-- Item 108 | PM ITANHAÉM
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0204.000726/2018', NULL, 'PM ITANHAÉM', 4, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0204.000726/2018', 'SEI', NULL, '[]'::jsonb, NULL, 30, FALSE, FALSE, '13/03/19 - RESPONDER QUESTIONAMENTO DA CJ', 'Favor informar qual questionamento. Outrossim, informamos que em pesquisa realizada SPDOC 1794036/2018, este se refere ao convênio 802/2014, que já está quitado (respondido este questionamento na planilha encaminhada em 12/05/2023 | Observação Adicional 2: Favor informar qual questionamento. Outrossim, informamos que em pesquisa realizada SPDOC 1794036/2018, este se refere ao convênio 802/2014, que já está quitado (respondido este questionamento na planilha encaminhada em 12/05/2023 | Fonte: DRS (somente)' FROM np;

-- Item 111 | Apiai com 12/2013
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('3595238/2019', NULL, 'Apiai com 12/2013', 16, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '3595238/2019', NULL, NULL, '[]'::jsonb, NULL, 300, FALSE, FALSE, NULL, 'feito notificação para enviar ao tribunal | Fonte: DRS (somente)' FROM np;

-- Item 112 | PREFEITURA CARAGUATATUBA-sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0217.000823/2018', '712/2014', 'PREFEITURA CARAGUATATUBA-sani', 17, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0217.000823/2018', 'SEI', NULL, '[]'::jsonb, 901600.38, 36, FALSE, TRUE, NULL, 'Não efetuou as correções anuais - levantamento está sendo efetuado pelo DRS para enviar cobrança da diferença | Parcelas Já Pagas: 36 | Fonte: DRS (somente)' FROM np;

-- Item 113 | PREFEITURA MUNICIPAL DE BANANAL
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('360402/2021', '1060/2018', 'PREFEITURA MUNICIPAL DE BANANAL', 17, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '360402/2021', NULL, NULL, '[]'::jsonb, 121697.33, 36, FALSE, FALSE, NULL, 'Observação Adicional 2: O processo de parcelamento não teve andamento. | Fonte: DRS (somente)' FROM np;

-- Item 114 | PREFEITURA CARAGUATATUBA-sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('001.0217.000823/2018', '1345/2013', 'PREFEITURA CARAGUATATUBA-sani', 17, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '001.0217.000823/2018', 'SEI', NULL, '[]'::jsonb, 901600.38, 36, FALSE, TRUE, NULL, 'Não efetuou as correções anuais - levantamento está sendo efetuado pelo DRS para enviar cobrança da diferença | Parcelas Já Pagas: 36 | Fonte: DRS (somente)' FROM np;

-- Item 115 | PREFEITURA MUNICIPAL DE CACHOEIRA PAULISTA
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('360415/2021', '1674/2018', 'PREFEITURA MUNICIPAL DE CACHOEIRA PAULISTA', 17, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '360415/2021', NULL, NULL, '[]'::jsonb, 1200000.0, 48, TRUE, FALSE, NULL, 'Parcelas Já Pagas: 7 | Fonte: DRS (somente)' FROM np;

-- Item 116 | PREFEITURA MUNICIPAL DE CANAS
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('360426/2021', '626/2018', 'PREFEITURA MUNICIPAL DE CANAS', 17, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '360426/2021', NULL, NULL, '[]'::jsonb, 113302.43, 36, FALSE, FALSE, 'Foi atualizado o cálculo de 5 parcelas em atraso para pagamento neste mês de novembro/2022', 'Fonte: DRS (somente)' FROM np;

-- Item 117 | PREFEITURA MUNICIPAL DE POTIM
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs, ano_cadastro, parcelamento)
  VALUES ('360374/21', 'Resolução SS', 'PREFEITURA MUNICIPAL DE POTIM', 17, NULL, TRUE)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, exercicio, exercicios, valor_corrigido, parcelas, em_dia, parcelas_concluidas, providencias, obs)
SELECT np.codigo, '360374/21', NULL, NULL, '[]'::jsonb, 108000.0, 24, FALSE, FALSE, '0', 'Parcelamento publicado | Parcelas Já Pagas: 0 | TA: 130/2013 | Sem Papel: SES-PRC-2023/02893 | Fonte: DRS (somente)' FROM np;
