-- =============================================================================
-- PARTE 60: registros de PARCELAMENTOS de 'CONT PROC TRIBUNAL (3).xlsx' cujo
-- número de processo (normalizado por dígitos) NÃO bate com nenhum processo
-- ou parcelamento já cadastrado — cria processo novo + parcelamento (mesmo
-- padrão CTE de parte_33_dados_parcelamento_consolidado_2026.sql), com envelope
-- em cgof_gpc_recebidos (is_parcelamento=TRUE), igual a parte_34.
--
-- Valor: quando a planilha tinha "Valor Acordado da Dívida" explícito na
-- coluna de observação (bloco Júlio Verdi), esse valor foi usado (mais
-- confiável que a coluna "Valor do Conv", que nesses casos parece ser o valor
-- total do convênio, não da dívida parcelada). Nos demais, veio da própria
-- coluna de valor, com detecção automática de formato BR/US por linha (a
-- planilha mistura os dois formatos).
--
-- Total: 42 registros (1 duplicatas internas da planilha removidas).
-- Execute no SQL Editor do Supabase, depois de parte_59.
-- =============================================================================

-- PARCELAMENTOS item - | Pref. Municipal Ferraz Vasconcelos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001/0201/002.233/2012', '001/2016', 'Pref. Municipal Ferraz Vasconcelos', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001/0201/002.233/2012', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: AOTORIZO EM 01/04/2020 | Observação - Status: 01/04/2022 TRATA O PRESENTE PROCESSO DE PARCELAMENTO DE DÉBITO REFERENTE À PRESTAÇÃO DE CONTAS DO TERMO ADITIVO Nº 01/2006 DA PREFEITURA MUNICIPAL DE FERRAZ DE VASCONCELOS. CONSIDERANDO O DESPACHO GS Nº 885/2022 DO GABINETE DO SECRETÁRIO, AS FOLHAS 183, COMUNICANDO QUE OS AUTOS FORAM CADASTRADOS NO SISTEMA SEM PAPEL SOB Nº SES-PRC-2022/08739, A TRAMITAÇÃO SERÁ VIA SISTEMA. DIANTE DO EXPOSTO, ENCAMINHE-SE AO DEPARTAMENTO REGIONAL DE SAÚDE I – GRANDE SÃO PAULO PARA CIÊNCIA E O QUE COUBER. CLAUDETE | Nº original na planilha: 001/0201/002.233/2012 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001/0201/002.233/2012', 'Pref. Municipal Ferraz Vasconcelos', '001/2016', NULL, 1, NULL, 'AOTORIZO EM 01/04/2020', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | Pref. Municipal Ferraz Vasconcelos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001/0201/001.286/2010', '002/2008', 'Pref. Municipal Ferraz Vasconcelos', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001/0201/001.286/2010', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: AOTORIZO EM 01/04/2020 | Observação - Status: 01/04/2022 Trata o presente processo de parcelamento de débito referente à prestação de contas do Termo Aditivo nº 02/2008 da Prefeitura Municipal de Ferraz de Vasconcelos. Considerando o Despacho GS nº 877/2022 do Gabinete do Secretário, as folhas 203, comunicando que os autos foram cadastrados no Sistema Sem Papel sob nº SES-PRC-2022/08763, a tramitação será via Sistema. Diante do exposto, encaminhe-se ao Departamento Regional de Saúde I – Grande São Paulo para ciência e o que couber. 01/04/2022 TRATA O PRESENTE PROCESSO DE PARCELAMENTO DE DÉBITO REFERENTE À PRESTAÇÃO DE CONTAS DO TERMO ADITIVO Nº 01/2005 DA PREFEITURA MUNICIPAL DE FERRAZ DE VASCONCELOS. CONSIDERANDO O DESPACHO GS Nº 875/2022 DO GABINETE DO SECRETÁRIO, AS FOLHAS 270, COMUNICANDO QUE OS AUTOS FORAM CADASTRADOS NO SISTEMA SEM PAPEL SOB Nº SES-PRC-2022/08812, A TRAMITAÇÃO SERÁ VIA SISTEMA. DIANTE DO EXPOSTO, ENCAMINHE-SE AO DEPARTAMENTO REGIONAL DE SAÚDE I – GRANDE SÃO PAULO PARA CIÊNCIA E O QUE COUBER | Nº original na planilha: 001/0201/001.286/2010 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001/0201/001.286/2010', 'Pref. Municipal Ferraz Vasconcelos', '002/2008', NULL, 1, NULL, 'AOTORIZO EM 01/04/2020', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | PREFEITURA DE CAJAMAR - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001.0201.000522/2018', '1621/2013', 'PREFEITURA DE CAJAMAR - sani', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001.0201.000522/2018', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: NO DRS A PARTIR DE 08/04/19 | Observação - Status: 11/03/2019 À VISTA DO TEOR DO PARECER CJ/SS Nº 188/2019, EMITIDO PELA DOUTA CONSULTORIA JURÍDICA DESTA PASTA, ÀS FLS. 170/172, DE ORDEM SUPERIOR, RESTITUAM-SE OS AUTOS À COORDENADORIA DE GESTÃO ORÇAMENTÁRIA E FINANCEIRA, PARA CONHECIMENTO E ADOÇÃO DAS PROVIDÊNCIAS NECESSÁRIAS AO PROSSEGUIMENTO DA SOLICITAÇÃO. | Nº original na planilha: 001.0201.000522/2018 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001.0201.000522/2018', 'PREFEITURA DE CAJAMAR - sani', '1621/2013', NULL, 1, NULL, 'NO DRS A PARTIR DE 08/04/19', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | Centro Apoio Saude Leste - CASAL
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('147624/2021', '525/2017', 'Centro Apoio Saude Leste - CASAL', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '147624/2021', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: AGUARDA PUBLICAÇÃO | Observação - Status: 06/01/2022 Trata o presente processo de parcelamento de débito referente a prestação de contas do convênio 0525/2017 do Centro de Apoio à Saúde da Leste - CASAL no valor de R$ 60.000,00 (Sessenta Mil Reais). Considerando a informação da Coordenadoria de Gestão Orçamentária e Financeira as folhas 391, encaminhe-se ao Departamento Regional de Saúde I - Grande São Paulo para ciência e providências. | Nº original na planilha: 147624/2021 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '147624/2021', 'Centro Apoio Saude Leste - CASAL', '525/2017', NULL, 1, NULL, 'AGUARDA PUBLICAÇÃO', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | PM Carapicuiba
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('754690/2019', '665/2007', 'PM Carapicuiba', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '754690/2019', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, 8151301, 'Situação: EM 26/02/2020 - DOE ??? | Observação - Status: publicação de autorizo ou para acompanhar pagto - 06/11/2019 Considerando a autorização governamental para parcelamento do débito, encaminhe-se à DRS I Capital, através da CRS, para ciência e providências | Nº original na planilha: 754690/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '754690/2019', 'PM Carapicuiba', '665/2007', NULL, 1, NULL, 'EM 26/02/2020 - DOE ???', TRUE, 'PARCELAMENTO', '[]'::jsonb, 8151301 FROM np, parc;

-- PARCELAMENTOS item - | SPDM  - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001.0201.001014/2015', '834/2013', 'SPDM  - sani', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001.0201.001014/2015', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, 18800000, 'Situação: DOE 15/12/18- DRS ACOMPANHAR PAGTO | Observação - Status: PRESTAÇÃO DE CONTAS - CONV. 834/2013 - PARCELAMENTO | Nº original na planilha: 001.0201.001014/2015 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001.0201.001014/2015', 'SPDM  - sani', '834/2013', NULL, 1, NULL, 'DOE 15/12/18- DRS ACOMPANHAR PAGTO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 18800000 FROM np, parc;

-- PARCELAMENTOS item - | Pref. Municipal Ferraz Vasconcelos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001/0103/000.662/2006', 'TA 01 E 02/2006', 'Pref. Municipal Ferraz Vasconcelos', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001/0103/000.662/2006', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: AOTORIZO EM 01/04/2020 | Observação - Status: 01/04/2022 Trata o presente processo de parcelamento de débito referente à prestação de contas do Termo Aditivo nº 01/2006 da Prefeitura Municipal de Ferraz de Vasconcelos. Considerando o Despacho GS nº 885/2022 do Gabinete do Secretário, as folhas 183, comunicando que os autos foram cadastrados no Sistema Sem Papel sob nº SES-PRC-2022/08739, a tramitação será via Sistema. Diante do exposto, encaminhe-se ao Departamento Regional de Saúde I – Grande São Paulo para ciência e o que couber. | Nº original na planilha: 001/0103/000.662/2006 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001/0103/000.662/2006', 'Pref. Municipal Ferraz Vasconcelos', 'TA 01 E 02/2006', NULL, 1, NULL, 'AOTORIZO EM 01/04/2020', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | PREFEITURA S. BERNARDO DO CAMPO - sani
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001.0201.002923/2013', NULL, 'PREFEITURA S. BERNARDO DO CAMPO - sani', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001.0201.002923/2013', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: FAZER TERMO PARCELAMENTO - 29/01/19 | Observação - Status: 08/01/2019 DE ORDEM SUPERIOR, À VISTA DA AUTORIZAÇÃO PARA PARCELAMENTO DO DÉBITO, ÀS FLS. 253, PUBLICADA NO DOE DE 28 DE DEZEMBRO DE 2018, ENCAMINHEM-SE OS AUTOS À COORDENADORIA DE GESTÃO ORÇAMENTÁRIA E FINANCEIRA PARA CONHECIMENTO E PROVIDÊNCIAS CABÍVEIS. | Nº original na planilha: 001.0201.002923/2013 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001.0201.002923/2013', 'PREFEITURA S. BERNARDO DO CAMPO - sani', NULL, NULL, 1, NULL, 'FAZER TERMO PARCELAMENTO - 29/01/19', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | pref.municipal Ferraz Vasconcelos
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001/0103/001.017/2006', NULL, 'pref.municipal Ferraz Vasconcelos', 1)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001/0103/001.017/2006', NULL, 'PARCELAMENTO', NULL, '[]'::jsonb, NULL, 'Situação: AOTORIZO EM 01/04/2020 | Observação - Status: 31/03/2022 Trata o presente processo de parcelamento de débito referente à prestação de contas do Termo Aditivo nº 02/2006 da Prefeitura Municipal de Ferraz de Vasconcelos. Considerando o Despacho GS nº 878/2022 do Gabinete do Secretário as folhas 210, comunicando que os autos foram cadastrados no Sistema Sem Papel sob nº SES-PRC-2022/08937, a tramitação será via Sistema. Diante do exposto, encaminhe-se ao Departamento Regional de Saúde I – Grande São Paulo para ciência e aguarde-se. | Nº original na planilha: 001/0103/001.017/2006 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001/0103/001.017/2006', 'pref.municipal Ferraz Vasconcelos', NULL, NULL, 1, NULL, 'AOTORIZO EM 01/04/2020', TRUE, 'PARCELAMENTO', '[]'::jsonb, NULL FROM np, parc;

-- PARCELAMENTOS item - | Irmandade da Santa Casa de Misericórdia de Laranjal Paulista
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001.0206.000882/2012', 'Convênio nº 2552/2013; Termo Aditivo 02/12 ao Convênio nº 893/2007 e Termos Aditivos 01/2014; 02/2014 e 03/2014 ao Convênio nº 749/2014', 'Irmandade da Santa Casa de Misericórdia de Laranjal Paulista', 6)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001.0206.000882/2012', NULL, 'PARCELAMENTO', 2012, '[2012,2013,2014]'::jsonb, 221823.68, 'Situação: Analisado | Observação - Status: Quitado (segue comprovantes finais) | Nº original na planilha: 001.0206.000882/2012 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001.0206.000882/2012', 'Irmandade da Santa Casa de Misericórdia de Laranjal Paulista', 'Convênio nº 2552/2013; Termo Aditivo 02/12 ao Convênio nº 893/2007 e Termos Aditivos 01/2014; 02/2014 e 03/2014 ao Convênio nº 749/2014', '2012, 2013 e 2014', 6, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[2012,2013,2014]'::jsonb, 221823.68 FROM np, parc;

-- PARCELAMENTOS item 91 | Santa Casa são Vicente Tanabi - parcelamento
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('024.00097605/2026-75', '975/2022', 'Santa Casa são Vicente Tanabi - parcelamento', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '024.00097605/2026-75', 'SEI', 'PARCELAMENTO', 2023, '[2023]'::jsonb, 50000, 'Responsável/Análise: Ederson | Início da Análise: 7/24/26 | Observação - Status: 30/07/2026 encaminhar GGCON para assinatura e envio ao secretario para autorizo | Nº original na planilha: 024.00097605/2026-75 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS item 91' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '024.00097605/2026-75', 'Santa Casa são Vicente Tanabi - parcelamento', '975/2022', '2023', 15, 'Ederson', 'ANALISADO', TRUE, 'PARCELAMENTO', '[2023]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item 104 | PREFEITURA MUNICIPAL DE POTIM
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('SES-PRC-2023/02893', '130/2013', 'PREFEITURA MUNICIPAL DE POTIM', 17)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, 'SES-PRC-2023/02893', 'SISTEMA SEM PAPEL', 'PARCELAMENTO', NULL, '[]'::jsonb, 108000, 'Observação - Status: Devoluções efetuadas - processo finalizado | Nº original na planilha: SES-PRC-2023/02893 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS item 104' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, 'SES-PRC-2023/02893', 'PREFEITURA MUNICIPAL DE POTIM', '130/2013', NULL, 17, NULL, 'ANALISADO', TRUE, 'PARCELAMENTO', '[]'::jsonb, 108000 FROM np, parc;

-- PARCELAMENTOS item - | Sta Casa Tanabi
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('024.00097605/2026-75', '0975/2022', 'Sta Casa Tanabi', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '024.00097605/2026-75', 'SEI', 'PARCELAMENTO', 2023, '[2023]'::jsonb, 17261.35, 'Situação: Ag. CGOF - 1ª autorização | Responsável/Análise: Júlio Verdi | Término da Análise: 15/04/2024 | Observação - Status: Valor Acordado da Dívida: R$ 17.261,35 | Valor do Convênio (planilha): R$ 50.000,00 | Nº original na planilha: SEI 024.00097605/2026-75 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '024.00097605/2026-75', 'Sta Casa Tanabi', '0975/2022', '2023', 15, 'Júlio Verdi', 'AG. CGOF - 1ª AUTORIZAÇÃO', TRUE, 'PARCELAMENTO', '[2023]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item - | Fundação Pio XII - Jales
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('SES-PRC-2023/15303', '0070/2016', 'Fundação Pio XII - Jales', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, 'SES-PRC-2023/15303', 'SISTEMA SEM PAPEL', 'PARCELAMENTO', 2016, '[2016]'::jsonb, 1641040.51, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 16/04/2018 | Observação - Status: Valor Acordado da Dívida: R$ 1.641.040,51 | Valor do Convênio (planilha): R$ 13.860.000,00 | Nº original na planilha: S. PAPEL - SES-PRC-2023/15303 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, 'SES-PRC-2023/15303', 'Fundação Pio XII - Jales', '0070/2016', '2016', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2016]'::jsonb, 13860000 FROM np, parc;

-- PARCELAMENTOS item - | Fundação Pio XII - Jales
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('SES-PRC-2022/86486', '0236/2020', 'Fundação Pio XII - Jales', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, 'SES-PRC-2022/86486', 'SISTEMA SEM PAPEL', 'PARCELAMENTO', 2020, '[2020]'::jsonb, 4438925.51, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 30/04/2021 | Observação - Status: Valor Acordado da Dívida: R$ 4.438.925,51 | Valor do Convênio (planilha): R$ 60.480.000,00 | Nº original na planilha: S. PAPEL - SES-PRC-2022/86486 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, 'SES-PRC-2022/86486', 'Fundação Pio XII - Jales', '0236/2020', '2020', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 60480000 FROM np, parc;

-- PARCELAMENTOS item - | PM Nova Aliança
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('024.001.85106/2023-91', '1151/2014', 'PM Nova Aliança', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '024.001.85106/2023-91', 'SEI', 'PARCELAMENTO', 2014, '[2014,2015]'::jsonb, 15030.52, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 14/03/2018 | Observação - Status: Valor Acordado da Dívida: R$ 15.030,52 | Valor do Convênio (planilha): R$ 80.000,00 | Nº original na planilha: SEI 024.001.85106/2023-91 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '024.001.85106/2023-91', 'PM Nova Aliança', '1151/2014', '2014/2015', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2014,2015]'::jsonb, 80000 FROM np, parc;

-- PARCELAMENTOS item - | PM Nova Aliança
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('024.00133125/2023-32', '0363/007 - TA 02/2012', 'PM Nova Aliança', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '024.00133125/2023-32', 'SEI', 'PARCELAMENTO', 2012, '[2012]'::jsonb, 18735.57, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 27/10/2017 | Observação - Status: Valor Acordado da Dívida: R$ 18.735,57 | Valor do Convênio (planilha): R$ 60.000,00 | Nº original na planilha: SEI 024.00133125/2023-32 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '024.00133125/2023-32', 'PM Nova Aliança', '0363/007 - TA 02/2012', '2012', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2012]'::jsonb, 60000 FROM np, parc;

-- PARCELAMENTOS item - | Sta Casa José Bonifácio
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('024.00161748/2023-03', '0328/2020', 'Sta Casa José Bonifácio', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '024.00161748/2023-03', 'SEI', 'PARCELAMENTO', 2020, '[2020]'::jsonb, 27105.05, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 20/07/2021 | Observação - Status: Valor Acordado da Dívida: R$ 27.105,05 | Valor do Convênio (planilha): R$ 2.419.200,00 | Nº original na planilha: SEI 024.00161748/2023-03 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '024.00161748/2023-03', 'Sta Casa José Bonifácio', '0328/2020', '2020', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 2419200 FROM np, parc;

-- PARCELAMENTOS item - | Sta Casa Novo Horizonte
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('SES-PRC-2023/08911', '0185/2007 - TA 02/2012', 'Sta Casa Novo Horizonte', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, 'SES-PRC-2023/08911', 'SISTEMA SEM PAPEL', 'PARCELAMENTO', 2012, '[2012]'::jsonb, 25807.14, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 06/09/20218 | Observação - Status: Valor Acordado da Dívida: R$ 25.807,14 | Valor do Convênio (planilha): R$ 252.000,00 | Nº original na planilha: S.PAPEL - SES-PRC-2023/08911 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, 'SES-PRC-2023/08911', 'Sta Casa Novo Horizonte', '0185/2007 - TA 02/2012', '2012', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2012]'::jsonb, 252000 FROM np, parc;

-- PARCELAMENTOS item - | Sta Casa Riolândia
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1991564/2018', '0364/2014 - TA 01/2014', 'Sta Casa Riolândia', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1991564/2018', 'SPDOC', 'PARCELAMENTO', 2014, '[2014]'::jsonb, 34038.84, 'Situação: Em Pagamento | Responsável/Análise: Júlio Verdi | Término da Análise: 15/12/2017 | Observação - Status: Valor Acordado da Dívida: R$ 34.038,84 | Valor do Convênio (planilha): R$ 50.000,00 | Nº original na planilha: SPDOC-1991564/2018 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1991564/2018', 'Sta Casa Riolândia', '0364/2014 - TA 01/2014', '2014', 15, 'Júlio Verdi', 'EM PAGAMENTO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item - | Hosital Dr. Bezerra Menezes
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('213600/2019', '1389/2013', 'Hosital Dr. Bezerra Menezes', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '213600/2019', 'SPDOC', 'PARCELAMENTO', 2014, '[2014]'::jsonb, 1324798.96, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 6/6/17 | Observação - Status: Valor Acordado da Dívida: R$ 1.324.798,96 | Valor do Convênio (planilha): R$ 6.270.746,47 | Nº original na planilha: SPDOC - 213600/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '213600/2019', 'Hosital Dr. Bezerra Menezes', '1389/2013', '2014', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 6270746.47 FROM np, parc;

-- PARCELAMENTOS item - | Prefeitura Municipal de Nipoã
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1295761/2020', '0143/2018', 'Prefeitura Municipal de Nipoã', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1295761/2020', 'SPDOC', 'PARCELAMENTO', 2019, '[2019]'::jsonb, 3118.42, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 7/6/23 | Observação - Status: Valor Acordado da Dívida: R$ 3.118,42 | Valor do Convênio (planilha): R$ 70.000,00 | Nº original na planilha: SPDOC - 1295761/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1295761/2020', 'Prefeitura Municipal de Nipoã', '0143/2018', '2019', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2019]'::jsonb, 70000 FROM np, parc;

-- PARCELAMENTOS item - | Prefeitura Municipal de Nipoã
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('2816388/2019', '0362/2007 - TA 01/2012', 'Prefeitura Municipal de Nipoã', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '2816388/2019', 'SPDOC', 'PARCELAMENTO', 2012, '[2012]'::jsonb, 167524.35, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 4/10/18 | Observação - Status: Valor Acordado da Dívida: R$ 167.524,35 | Valor do Convênio (planilha): R$ 140.000,00 | Nº original na planilha: SPDOC - 2816388/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '2816388/2019', 'Prefeitura Municipal de Nipoã', '0362/2007 - TA 01/2012', '2012', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2012]'::jsonb, 140000 FROM np, parc;

-- PARCELAMENTOS item - | Prefeitura Municipal de Nipoã
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1295798/2020', '0611/2017', 'Prefeitura Municipal de Nipoã', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1295798/2020', 'SPDOC', 'PARCELAMENTO', 2019, '[2019]'::jsonb, 15833.56, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 7/6/23 | Observação - Status: Valor Acordado da Dívida: R$ 15.833,56 | Valor do Convênio (planilha): R$ 50.000,00 | Nº original na planilha: SPDOC - 1295798/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1295798/2020', 'Prefeitura Municipal de Nipoã', '0611/2017', '2019', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2019]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item - | Prefeitura Municipal de Nipoã
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1295720/2020', '1186/2018', 'Prefeitura Municipal de Nipoã', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1295720/2020', 'SPDOC', 'PARCELAMENTO', 2019, '[2019]'::jsonb, 20017.24, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 16/06/2020 | Observação - Status: Valor Acordado da Dívida: R$ 20.017,24 | Valor do Convênio (planilha): R$ 100.000,00 | Nº original na planilha: SPDOC - 1295720/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1295720/2020', 'Prefeitura Municipal de Nipoã', '1186/2018', '2019', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2019]'::jsonb, 100000 FROM np, parc;

-- PARCELAMENTOS item - | Prefeitura Municipal de Nipoã
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1400928/2020', '0177/2017', 'Prefeitura Municipal de Nipoã', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1400928/2020', 'SPDOC', 'PARCELAMENTO', 2018, '[2018]'::jsonb, 7610.27, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 8/7/20 | Observação - Status: Valor Acordado da Dívida: R$ 7.610,27 | Valor do Convênio (planilha): R$ 50.000,00 | Nº original na planilha: SPDOC - 1400928/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1400928/2020', 'Prefeitura Municipal de Nipoã', '0177/2017', '2018', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2018]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Cardoso
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('SES-PRC-2022/74884', '0115/2007 - TA 01/2010', 'Santa Casa de Cardoso', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, 'SES-PRC-2022/74884', 'SISTEMA SEM PAPEL', 'PARCELAMENTO', 2010, '[2010]'::jsonb, 4809.99, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 12/5/17 | Observação - Status: Valor Acordado da Dívida: R$ 4.809,99 | Valor do Convênio (planilha): R$ 15.000,00 | Nº original na planilha: S.PAPEL - SES-PRC-2022/74884 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, 'SES-PRC-2022/74884', 'Santa Casa de Cardoso', '0115/2007 - TA 01/2010', '2010', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2010]'::jsonb, 15000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Cardoso
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1192085/2020', '0115/2007 - TA 02/2010', 'Santa Casa de Cardoso', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1192085/2020', 'SPDOC', 'PARCELAMENTO', 2010, '[2010]'::jsonb, 15833.56, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 29/03/2017 | Observação - Status: Valor Acordado da Dívida: R$ 15.833,56 | Valor do Convênio (planilha): R$ 65.000,00 | Nº original na planilha: SPDOC - 1192085/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1192085/2020', 'Santa Casa de Cardoso', '0115/2007 - TA 02/2010', '2010', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2010]'::jsonb, 65000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Cardoso
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('SES-PRC-2022/74884', '0115/2007 - TA 04/2010', 'Santa Casa de Cardoso', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, 'SES-PRC-2022/74884', 'SISTEMA SEM PAPEL', 'PARCELAMENTO', 2010, '[2010]'::jsonb, 13935.53, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 14/03/2017 | Observação - Status: Valor Acordado da Dívida: R$ 13.935,53 | Valor do Convênio (planilha): R$ 50.000,00 | Nº original na planilha: S.PAPEL - SES-PRC-2022/74884 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, 'SES-PRC-2022/74884', 'Santa Casa de Cardoso', '0115/2007 - TA 04/2010', '2010', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2010]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Fernandópolis
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('639060/2019', '0004/2008 - TA 03/2012', 'Santa Casa de Fernandópolis', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '639060/2019', 'SPDOC', 'PARCELAMENTO', 2012, '[2012]'::jsonb, 1555, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 2/7/18 | Observação - Status: Valor Acordado da Dívida: R$ 1.555,00 | Valor do Convênio (planilha): R$ 630.000,00 | Nº original na planilha: SPDOC - 639060/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '639060/2019', 'Santa Casa de Fernandópolis', '0004/2008 - TA 03/2012', '2012', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2012]'::jsonb, 630000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Fernandópolis
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1999932/2020', '0243/2020', 'Santa Casa de Fernandópolis', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1999932/2020', 'SPDOC', 'PARCELAMENTO', 2020, '[2020]'::jsonb, 14440.31, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 6/4/21 | Observação - Status: Valor Acordado da Dívida: R$ 14.440,31 | Valor do Convênio (planilha): R$ 10.962.480,00 | Nº original na planilha: SPDOC - 1999932/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1999932/2020', 'Santa Casa de Fernandópolis', '0243/2020', '2020', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2020]'::jsonb, 10962480 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Fernandópolis
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('638956/2019', '1698/2013', 'Santa Casa de Fernandópolis', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '638956/2019', 'SPDOC', 'PARCELAMENTO', 2014, '[2014]'::jsonb, 4658.13, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 11/5/18 | Observação - Status: Valor Acordado da Dívida: R$ 4.658,13 | Valor do Convênio (planilha): R$ 500.000,00 | Nº original na planilha: SPDOC - 638956/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '638956/2019', 'Santa Casa de Fernandópolis', '1698/2013', '2014', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 500000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de General Salgado
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1368582/2020', '0994/2014', 'Santa Casa de General Salgado', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1368582/2020', 'SPDOC', 'PARCELAMENTO', 2015, '[2015]'::jsonb, 85710.58, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 29/11/2017 | Observação - Status: Valor Acordado da Dívida: R$ 85.710,58 | Valor do Convênio (planilha): R$ 200.000,00 | Nº original na planilha: SPDOC - 1368582/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1368582/2020', 'Santa Casa de General Salgado', '0994/2014', '2015', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 200000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de General Salgado
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001.0212.001912/2017', '0709/2014', 'Santa Casa de General Salgado', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001.0212.001912/2017', 'SISRAD', 'PARCELAMENTO', 2015, '[2015]'::jsonb, 19014.68, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 28/09/2016 | Observação - Status: Valor Acordado da Dívida: R$ 19.014,68 (Total para 709/2014 e TA 01/2014) | Valor do Convênio (planilha): R$ 20.000,00 | Nº original na planilha: SISRAD 001.0212.001912/2017 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001.0212.001912/2017', 'Santa Casa de General Salgado', '0709/2014', '2015', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 20000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de General Salgado
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('001.0212.001912/2017', '0509/2014 - TA 01/2014', 'Santa Casa de General Salgado', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '001.0212.001912/2017', 'SISRAD', 'PARCELAMENTO', 2015, '[2015]'::jsonb, 19014.68, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 28/09/2016 | Observação - Status: Valor Acordado da Dívida: R$ 19.014,68 (Total para 709/2014 e TA 01/2014) | Valor do Convênio (planilha): R$ 60.000,00 | Nº original na planilha: SISRAD 001.0212.001912/2017 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '001.0212.001912/2017', 'Santa Casa de General Salgado', '0509/2014 - TA 01/2014', '2015', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 60000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de General Salgado
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('367261/2021', '0509/2014 - TA 02/2014', 'Santa Casa de General Salgado', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '367261/2021', 'SPDOC', 'PARCELAMENTO', 2015, '[2015]'::jsonb, 24631.88, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 19/12/2017 | Observação - Status: Valor Acordado da Dívida: R$ 24.631,88 | Valor do Convênio (planilha): R$ 50.000,00 | Nº original na planilha: SPDOC - 367261/2021 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '367261/2021', 'Santa Casa de General Salgado', '0509/2014 - TA 02/2014', '2015', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 50000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de José Bonifácio
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1975296/2019', '0837/2013', 'Santa Casa de José Bonifácio', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1975296/2019', 'SPDOC', 'PARCELAMENTO', 2014, '[2014]'::jsonb, 10945.51, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 25/07/2018 | Observação - Status: Valor Acordado da Dívida: R$ 10.945,51 | Valor do Convênio (planilha): R$ 168.000,00 | Nº original na planilha: SPDOC-1975296/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1975296/2019', 'Santa Casa de José Bonifácio', '0837/2013', '2014', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2014]'::jsonb, 168000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Monte Aprazível
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1240417/2020', '0045/2013', 'Santa Casa de Monte Aprazível', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1240417/2020', 'SPDOC', 'PARCELAMENTO', 2013, '[2013]'::jsonb, 3905.03, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 28/08/2018 | Observação - Status: Valor Acordado da Dívida: R$ 3.905,03 | Valor do Convênio (planilha): R$ 42.000,00 | Nº original na planilha: SPDOC - 1240417/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1240417/2020', 'Santa Casa de Monte Aprazível', '0045/2013', '2013', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2013]'::jsonb, 42000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Neves Paulista
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('2559533/2019', '0647/2014', 'Santa Casa de Neves Paulista', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '2559533/2019', 'SPDOC', 'PARCELAMENTO', 2015, '[2015]'::jsonb, 30407.71, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 23/08/2018 | Observação - Status: Valor Acordado da Dívida: R$ 30.407,71 | Valor do Convênio (planilha): R$ 80.000,00 | Nº original na planilha: SPDOC - 2559533/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '2559533/2019', 'Santa Casa de Neves Paulista', '0647/2014', '2015', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 80000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Novo Horizonte
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('797195/2019', '0166/2014', 'Santa Casa de Novo Horizonte', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '797195/2019', 'SPDOC', 'PARCELAMENTO', 2015, '[2015]'::jsonb, 7392.76, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 22/09/2017 | Observação - Status: Valor Acordado da Dívida: R$ 7.392,76 | Valor do Convênio (planilha): R$ 252.000,00 | Nº original na planilha: SPDOC - 797195/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '797195/2019', 'Santa Casa de Novo Horizonte', '0166/2014', '2015', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2015]'::jsonb, 252000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Novo Horizonte
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('1066121/2020', '0760/2013', 'Santa Casa de Novo Horizonte', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '1066121/2020', 'SPDOC', 'PARCELAMENTO', 2013, '[2013]'::jsonb, 11751.63, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 14/08/2018 | Observação - Status: Valor Acordado da Dívida: R$ 11.751,63 | Valor do Convênio (planilha): R$ 63.000,00 | Nº original na planilha: SPDOC - 1066121/2020 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '1066121/2020', 'Santa Casa de Novo Horizonte', '0760/2013', '2013', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2013]'::jsonb, 63000 FROM np, parc;

-- PARCELAMENTOS item - | Santa Casa de Novo Horizonte
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('797410/2019', '1111/2014', 'Santa Casa de Novo Horizonte', 15)
  RETURNING codigo
),
parc AS (
  INSERT INTO public.cgof_gpc_parcelamento (processo_id, proc_parcela, tipo, tipo_parcelamento, exercicio, exercicios, valor_corrigido, obs)
  SELECT codigo, '797410/2019', 'SPDOC', 'PARCELAMENTO', 2016, '[2016]'::jsonb, 10042.4, 'Situação: Parcelamento Quitado | Responsável/Análise: Júlio Verdi | Término da Análise: 11/11/18 | Observação - Status: Valor Acordado da Dívida: R$ 10.042,40 | Valor do Convênio (planilha): R$ 186.044,00 | Nº original na planilha: SPDOC - 797410/2019 | Fonte: planilha CONT PROC TRIBUNAL — aba PARCELAMENTOS' FROM np
  RETURNING processo_id
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, exercicio, drs, responsavel, movimento, is_parcelamento, tipo_parcelamento, exercicios, valor_convenio)
SELECT np.codigo, '797410/2019', 'Santa Casa de Novo Horizonte', '1111/2014', '2016', 15, 'Júlio Verdi', 'PARCELAMENTO QUITADO', TRUE, 'PARCELAMENTO', '[2016]'::jsonb, 186044 FROM np, parc;
