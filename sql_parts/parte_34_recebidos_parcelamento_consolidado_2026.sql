-- ============================================================
-- parte_34_recebidos_parcelamento_consolidado_2026.sql
-- CORREÇÃO: cria o envelope em cgof_gpc_recebidos (is_parcelamento=TRUE)
-- para os registros importados em parte_33_dados_parcelamento_consolidado_2026.sql,
-- que ficaram sem aparecer na tela 'Parcelamentos' por falta desse vínculo.
-- Total de envelopes: 93
-- Execute no SQL Editor do Supabase.
--
-- NOTA: as colunas tipo_parcelamento/exercicios de cgof_gpc_recebidos, criadas
-- em parte_25_recebidos_tipo_parcelamento.sql, nunca haviam sido aplicadas
-- neste banco. O bloco abaixo (idempotente) garante que existam antes dos INSERTs.
-- ============================================================

ALTER TABLE public.cgof_gpc_recebidos
  ADD COLUMN IF NOT EXISTS tipo_parcelamento TEXT,
  ADD COLUMN IF NOT EXISTS exercicios        JSONB DEFAULT '[]'::jsonb;

-- Item 2 | Santa Casa de Misericórdia de Patrocínio Paulista
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1234, '024.0008712/2023-94', 'Santa Casa de Misericórdia de Patrocínio Paulista', '559/2016', '2018/2019', 8, '2025-11-19', 'Roberto', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2018, 2019]'::jsonb, 20796.93);

-- Item 4 | Irmandade de Misericórdia do Hospital são José de Itajobi
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1238, '024.00161679/2023-20', 'Irmandade de Misericórdia do Hospital são José de Itajobi', '282/2014', '2014/2015', 15, '2025-08-13', 'Roberto', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014, 2015]'::jsonb, 150000.0);

-- Item 9 | Irmandade da Santa Casa de Misericórdia de Fernandópolis
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1228, '024.00011498/2026-04', 'Irmandade da Santa Casa de Misericórdia de Fernandópolis', '246/2020', NULL, 15, '2026-03-16', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 3024000.0);

-- Item 10 | Instituto do Cancer Dr. Arnaldo Vieira de Carvalho - IVAC
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1253, '024.00164819/2025-83', 'Instituto do Cancer Dr. Arnaldo Vieira de Carvalho - IVAC', '780/2016', '2018', 1, '2026-03-10', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2018]'::jsonb, 10944000.0);

-- Item 11 | Prefeitura Municipal de Sete Barras
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (251, '024.00006232/2026-31', 'Prefeitura Municipal de Sete Barras', '135/2021', '2021', 12, '2026-03-16', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2021]'::jsonb, 500000.0);

-- Item 13 | Associação de Proteção a Maternidade e à Infância Maternidade Fernando Magalães
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1297, '024.00179961/2024-44', 'Associação de Proteção a Maternidade e à Infância Maternidade Fernando Magalães', '493/2014', '2013/2014', 5, '2024-12-19', 'Elenice/Roberto', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2013, 2014]'::jsonb, 436740.72);

-- Item 14 | Irmandade da Santa Casa de Misericórdia de Fernandópolis
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1313, '024.00031029/2026-01', 'Irmandade da Santa Casa de Misericórdia de Fernandópolis', '243/2020', '2024', 15, '2026-03-11', 'Roberto/Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2024]'::jsonb, 1470836.54);

-- Item 16 | Prefeitura Municipal de Sumare
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1225, '024.00100587/2025-35', 'Prefeitura Municipal de Sumare', '1050/2014', '2014', 7, '2026-04-15', 'Roberto/Elenice', 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 470552.06);

-- Item 17 | Associação Criança Especial de Pais Companhiros - CEPAC - JACAREI
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1207, '024.00033376/2026-61', 'Associação Criança Especial de Pais Companhiros - CEPAC - JACAREI', '1169/2024', '2025', 17, '2026-03-30', 'Roberto/Gilmar', 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[2025]'::jsonb, 100000.0);

-- Item 18 | Associação Amigos dos Deficientes - AMDE
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1373, '024.00091128/2025-53', 'Associação Amigos dos Deficientes - AMDE', 'TA 01/2018 ao Conv 300/2016', '2017', 16, '2026-06-16', 'Roberto', 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[2017]'::jsonb, 4582290.0);

-- Item 20 | Associação de Proteção à Maternidade e à Infância de Registro – APAMIR
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1305, '024.00060281/2026-10', 'Associação de Proteção à Maternidade e à Infância de Registro – APAMIR', '006/2017', '2017', 12, '2026-05-13', 'Roberto', 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[2017]'::jsonb, 45885000.0);

-- Item 21 | Irmandade da Santa Casa da Misericórdia de Santos
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1335, '024.00184496/2025-44', 'Irmandade da Santa Casa da Misericórdia de Santos', '562/2016', '2017', 4, '2026-06-01', 'Patricia/Gilmar', 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[2017]'::jsonb, 66691908.0);

-- Item 28 | Irmandade de Misericórdia do Hospital são José de Itajobi
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1238, '024.00161679/2023-20', 'Irmandade de Misericórdia do Hospital são José de Itajobi', '282/2014', '2014 E 2015', 15, '2025-08-13', 'ROBERTO', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014, 2015]'::jsonb, 315967.7);

-- Item 31 | Associação de Proteção a Maternidade e à Infância Maternidade Fernando Magalães
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1297, '024.00179961/2024-44', 'Associação de Proteção a Maternidade e à Infância Maternidade Fernando Magalães', '493/2014', '2014/2015', 5, '2024-11-08', NULL, 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[2014, 2015]'::jsonb, 436740.72);

-- Item 32 | Santa Casa de Misericordia José Bonifácio
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (421, '02400011770/2025-67', 'Santa Casa de Misericordia José Bonifácio', '723/2016', '2018', 15, '2025-02-07', 'Roberto', 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[2018]'::jsonb, 32909.46);

-- Item 39 | Santa Casa de Misericórdia de Patrocínio Paulista
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1234, '024.0008712/2023-94', 'Santa Casa de Misericórdia de Patrocínio Paulista', '559/2016', '2018/2019', 8, '2025-06-23', 'ROBERTO', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2018, 2019]'::jsonb, 21049.96);

-- Item 46 | Irmandade da Santa Casa de Misericórdias de Mogi Guaçú
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (263, '024.00125563/2023-27', 'Irmandade da Santa Casa de Misericórdias de Mogi Guaçú', '359/2020', '2020', 14, '2023-09-25', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 84177.9);

-- Item 51 | Santa Casa de Misericórdia de Salto Grande
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1031, '024.00144756/2024-68', 'Santa Casa de Misericórdia de Salto Grande', '276/2020', '2023', 9, '2024-11-05', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2023]'::jsonb, 181093.39);

-- Item 71 | ADACAMP
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (122, '1716178/2020', 'ADACAMP', '1264/2020', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 59244.85);

-- Item 99 | Instituto Bezerra de Menezes
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (266, 'SES-PRC-2022/79240', 'Instituto Bezerra de Menezes', '760/2020', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 24352.56);

-- Item 110 | Assoc. Espírita Vicente de Paulo - Inst. Bezerra Menezes
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (266, 'SES-PRC-2022/79240', 'Assoc. Espírita Vicente de Paulo - Inst. Bezerra Menezes', '760/2020', NULL, 14, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 19 | Prefeitura Municipal de Apiaí
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1397, '024.00070468/2026-21', 'Prefeitura Municipal de Apiaí', '795/2018', NULL, 16, '2026-05-13', 'Roberto', 'EM ANÁLISE', TRUE, 'PARCELAMENTO', '[]'::jsonb, 636800.0);

-- Item 34 | Sta Casa Patrocinio Paulista
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1398, '024.00008810/2023-21', 'Sta Casa Patrocinio Paulista', '1618/2023', '2014', 8, '2023-09-26', NULL, NULL, TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 42301.14);

-- Item 35 | Sta Casa Patrocinio Paulista
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1399, '024.00008715/2023-28', 'Sta Casa Patrocinio Paulista', '1441/2020', '2020', 8, '2023-04-14', NULL, NULL, TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 100000.0);

-- Item 36 | Sta Casa Patrocinio Paulista
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1400, '024.00008798/2023-55', 'Sta Casa Patrocinio Paulista', '1282/2020', '2021', 8, '2023-08-23', 'Elenice', 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[2021]'::jsonb, 15933.38);

-- Item 38 | Prefeitura Cubatão
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1401, '024.00008198/2023-97', 'Prefeitura Cubatão', '1092/2014', '2014', 4, '2023-11-22', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 3666193.68);

-- Item 44 | Santa Casa de Misericórdia de São Simão
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1402, '024.00047444/2024-15', 'Santa Casa de Misericórdia de São Simão', 'TA 01/2018 ao Conv 540/2016', '2020', 13, '2024-10-21', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 12996.08);

-- Item 45 | Santa Casa de Misericórdia de São Simão
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1403, '024.00010054/2023-09', 'Santa Casa de Misericórdia de São Simão', '1009/2020', '2021', 13, '2023-08-21', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2021]'::jsonb, 160440.1);

-- Item 47 | Fundação Espirita Americo Bairral
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1404, '024.00096386/2024-45', 'Fundação Espirita Americo Bairral', '655/2016', '2017', 14, '2024-06-21', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2017]'::jsonb, 202523.33);

-- Item 48 | Fundação Espirita Americo Bairral
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1405, '024.00096474/2024-47', 'Fundação Espirita Americo Bairral', '655/2016', '2018', 14, '2024-06-21', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2018]'::jsonb, 38736.51);

-- Item 50 | Prefeitura Municipal de Ibirarema
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1406, '024.00008372/2023-00', 'Prefeitura Municipal de Ibirarema', '534/2018', '2018', 9, '2023-07-27', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2018]'::jsonb, 72449.89);

-- Item 52 | APAE-Ituverava
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1407, '024.00008677/2023-11', 'APAE-Ituverava', 'TA 01/2015 Conv 1339/2014', '2020', 8, '2023-06-14', 'Elenice', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 29798.67);

-- Item 53 | Santa Casa de Guararapes
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1408, '001/0202/001212/2015', 'Santa Casa de Guararapes', '2487/2013', 'FISICO', 2, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 317749.14);

-- Item 54 | Santa Casa Araçatuba
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1410, '001/0202/000266/2014', 'Santa Casa Araçatuba', '274/2014', '2014', 2, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 146770.96);

-- Item 55 | Santa Casa Araçatuba
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1410, '001/0202/000266/2014', 'Santa Casa Araçatuba', '274/2014', '2015', 2, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 106320.17);

-- Item 56 | Prefeitura Municipal São Vicente
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1411, '001/0204/000.241/2016', 'Prefeitura Municipal São Vicente', 'TA 001/2014', NULL, 4, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 576735.59);

-- Item 57 | Prefeitura Municipal Itanhaem
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1412, '001/0204/000.165/2016', 'Prefeitura Municipal Itanhaem', 'TA 002/2014', NULL, 4, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 683200.14);

-- Item 58 | Prefeitura Municipal São Vicente
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1413, '001/0204/000.255/2014', 'Prefeitura Municipal São Vicente', 'TA 005/2010', NULL, 4, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 326229.61);

-- Item 59 | Prefeitura Bertioga
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1414, '001/0204/000.168/2016', 'Prefeitura Bertioga', '1093/2014', NULL, 4, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 2554095.05);

-- Item 60 | Prefeitura Municipal Itanhaem
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1415, '001/0204/000.240/2016', 'Prefeitura Municipal Itanhaem', '802/2014', NULL, 4, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 725691.57);

-- Item 61 | Santa Casa de Barretos
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1416, '1010', 'Santa Casa de Barretos', '248/2012', '2012', 5, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2012]'::jsonb, 715501.6);

-- Item 62 | Prefeitura de Barretos
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1417, '001.0205.000731/2017', 'Prefeitura de Barretos', '260/2015', '2015', 5, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 490488.57);

-- Item 63 | Prefeitura de Barretos
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1418, '001.0205.000698/2017', 'Prefeitura de Barretos', '337/2014', '2014', 5, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 13656.46);

-- Item 64 | Prefeitura de Barretos - Sta Casa - SANI
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1419, '001.0205.000684/2017', 'Prefeitura de Barretos - Sta Casa - SANI', '338/2014', '2014', 5, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 117907.74);

-- Item 65 | Prefeitura Municipal Bebedouro
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1420, 'SPDOC 1369371/17', 'Prefeitura Municipal Bebedouro', '841/2014', '2014', 5, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 434211.34);

-- Item 66 | Fundação PIO XII - Barretos
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1421, 'SES-PRC- 2022/38217', 'Fundação PIO XII - Barretos', '076/2015', '2015', 5, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 930027.54);

-- Item 67 | Hospital Sta Terezinha e Maternidade Ercilia Pieroni
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1422, '001.0206.002411/2017', 'Hospital Sta Terezinha e Maternidade Ercilia Pieroni', NULL, NULL, 6, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 99897.35);

-- Item 68 | Prefeitura Bauru - Sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1423, '001.0206.000699/2014', 'Prefeitura Bauru - Sani', NULL, NULL, 6, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 69 | Prefeitura Bauru - Sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1424, '001.0206.000049/2016', 'Prefeitura Bauru - Sani', NULL, NULL, 6, NULL, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 452282.24);

-- Item 70 | Instituto Padre Haroldo Rahm
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1425, '1010', 'Instituto Padre Haroldo Rahm', '344/2014', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 44232.81);

-- Item 72 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1426, '1010', 'Prefeitura de Americana', 'TA 01/2019', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 8157403.31);

-- Item 73 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1427, '1010', 'Prefeitura de Americana', 'TA 01/2011', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 3713532.79);

-- Item 74 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1429, '1010', 'Prefeitura de Americana', 'TA 01/2012', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 1132891.06);

-- Item 75 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1429, '1010', 'Prefeitura de Americana', 'TA 01/2012', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 700000.0);

-- Item 76 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1430, '1010', 'Prefeitura de Americana', 'TA 02/2011', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 1805915.07);

-- Item 77 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1431, '1010', 'Prefeitura de Americana', 'TA 02/2012', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 2719121.15);

-- Item 78 | Prefeitura de Americana
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1432, '1010', 'Prefeitura de Americana', 'TA 03/2012', NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 5315149.37);

-- Item 79 | Prefeitura Itupeva - Sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1433, '1395214/18', 'Prefeitura Itupeva - Sani', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 80 | Prefeitura Muniucipal de Holambra
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1434, '1815021/18', 'Prefeitura Muniucipal de Holambra', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 81 | Prefeitura de Sumaré
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1435, '96483/14', 'Prefeitura de Sumaré', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 82 | Prefeitura de Sumaré
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1436, '1934463/18', 'Prefeitura de Sumaré', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 83 | Maternidade de Campinas
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1437, '931464/19 e 931708/19', 'Maternidade de Campinas', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 84 | Maternidade de Campinas
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1438, '777061/19; 777305/19', 'Maternidade de Campinas', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 85 | Sta Casa Leonor Mendes de Barros
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1439, '1010', 'Sta Casa Leonor Mendes de Barros', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 4617.19);

-- Item 86 | Lar São Francisco - JACI
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1440, '503363/19 e 509212/19', 'Lar São Francisco - JACI', NULL, NULL, 7, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 87 | Santa Casa Capivari
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1441, '001/0210/000.337/2013', 'Santa Casa Capivari', 'TA 03/2012 155/2008', NULL, 10, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 224748.14);

-- Item 88 | Prefeitura de Leme
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1442, '001.0206.002440/1998', 'Prefeitura de Leme', NULL, NULL, 10, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 89 | Associação Teodoro Sampaio
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1443, '510645/2019', 'Associação Teodoro Sampaio', 'TA 03/2012 921/2007', NULL, 11, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 33321.83);

-- Item 90 | Santa Casa Presidente Epitacio
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1444, '001.0211.000205/2014', 'Santa Casa Presidente Epitacio', '431/2014', '2015', 11, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 38260.8);

-- Item 91 | Lar São Francisco Assis
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1445, '001/0211/000207/2013', 'Lar São Francisco Assis', NULL, NULL, 11, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 92 | APAMIR
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1446, '001.0212.000081/2013', 'APAMIR', '107/2013', NULL, 12, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 248103.61);

-- Item 93 | Santa Casa Misericordia Dona Carolina Malheiros
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1447, '001.0214.001.212/2016', 'Santa Casa Misericordia Dona Carolina Malheiros', '131/2015', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 233547.1);

-- Item 94 | Santa Casa Misericordia Dona Carolina Malheiros
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1448, '001.0214.000.090/2017', 'Santa Casa Misericordia Dona Carolina Malheiros', '141/2015', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 151512.75);

-- Item 95 | Santa Casa Misericordia Dona Carolina Malheiros
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1449, '001.0214.000.394/2016', 'Santa Casa Misericordia Dona Carolina Malheiros', '141/2015', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 151512.75);

-- Item 96 | Santa Casa Misericordia Dona Carolina Malheiros
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1450, '001.021.000.091/2017', 'Santa Casa Misericordia Dona Carolina Malheiros', '397/2016', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 173138.64);

-- Item 97 | Santa Casa Misericordia Dona Carolina Malheiros
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1451, '001.0214.000.090/2017', 'Santa Casa Misericordia Dona Carolina Malheiros', '398/2016', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 421198.46);

-- Item 98 | Prefeitura São João Boa Vista
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1452, '1723420/2018', 'Prefeitura São João Boa Vista', '571/2016', NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 47685.75);

-- Item 100 | Prefeitura Casa Branca - Sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1453, '001.0214.000334/2014', 'Prefeitura Casa Branca - Sani', NULL, NULL, 14, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 101 | Prefeitura Casa Branca - Sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1454, '001.0214.000423/2017', 'Prefeitura Casa Branca - Sani', NULL, NULL, 14, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, 86253.58);

-- Item 102 | Santa Casa Caconde
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1455, '001/0214/000.167/2015', 'Santa Casa Caconde', NULL, NULL, 14, NULL, NULL, 'CONCLUÍDO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 100000.0);

-- Item 103 | PREFEITURA ANGATUBA - sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1456, '001.0216.000553/2014', 'PREFEITURA ANGATUBA - sani', NULL, NULL, 16, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 104 | PREFEITURA ANGATUBA - sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1457, '001.0216.001081/2014', 'PREFEITURA ANGATUBA - sani', NULL, NULL, 16, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 105 | SANTA CASA DE SOROCABA - sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1458, '001.0216.001380/2012', 'SANTA CASA DE SOROCABA - sani', NULL, NULL, 16, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 106 | SANTA CASA DE SOROCABA - sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1459, '001.0216.000576/2013', 'SANTA CASA DE SOROCABA - sani', NULL, NULL, 16, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 107 | 
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1460, '1010', NULL, NULL, NULL, 16, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 108 | PM ITANHAÉM
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1461, '001.0204.000726/2018', 'PM ITANHAÉM', NULL, NULL, 4, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 111 | Apiai com 12/2013
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1462, '3595238/2019', 'Apiai com 12/2013', NULL, NULL, 16, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 112 | PREFEITURA CARAGUATATUBA-sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1463, '001.0217.000823/2018', 'PREFEITURA CARAGUATATUBA-sani', '712/2014', NULL, 17, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 113 | PREFEITURA MUNICIPAL DE BANANAL
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1464, '360402/2021', 'PREFEITURA MUNICIPAL DE BANANAL', '1060/2018', NULL, 17, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 114 | PREFEITURA CARAGUATATUBA-sani
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1465, '001.0217.000823/2018', 'PREFEITURA CARAGUATATUBA-sani', '1345/2013', NULL, 17, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 115 | PREFEITURA MUNICIPAL DE CACHOEIRA PAULISTA
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1466, '360415/2021', 'PREFEITURA MUNICIPAL DE CACHOEIRA PAULISTA', '1674/2018', NULL, 17, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 116 | PREFEITURA MUNICIPAL DE CANAS
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1467, '360426/2021', 'PREFEITURA MUNICIPAL DE CANAS', '626/2018', NULL, 17, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

-- Item 117 | PREFEITURA MUNICIPAL DE POTIM
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio) VALUES (1468, '360374/21', 'PREFEITURA MUNICIPAL DE POTIM', 'Resolução SS', NULL, 17, NULL, NULL, NULL, TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL);

