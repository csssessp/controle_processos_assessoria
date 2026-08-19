-- =============================================================================
-- PARTE 57: reconciliação das abas "DRS 01".."DRS 17" e "OUTROS" da planilha
-- 'CONT PROC TRIBUNAL (3).xlsx' — cria cadastro NOVO em cgof_gpc_processos
-- (mesmo padrão CTE de parte_33_dados_parcelamento_consolidado_2026.sql)
-- para processos que não existiam em nenhuma das duas tabelas, seguido do
-- envelope em cgof_gpc_recebidos. 22 registros: 19 da fila por DRS + 3 da
-- aba OUTROS.
--
-- NOTA: a coluna "Valor do convênio" nestas duas abas usa formato brasileiro
-- (ponto = milhar, vírgula = decimal) — diferente da aba PARCELAMENTOS
-- (parte_55), que usa formato americano. Os valores abaixo já foram
-- convertidos corretamente para cada aba de origem.
--
-- Execute no SQL Editor do Supabase, depois de parte_56.
-- =============================================================================

-- ── Fila de análise por DRS (DRS 01..17) ────────────────────────────────────

-- DRS 06
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade, drs)
  VALUES ('024.00139387/2023-19', '228/2020', 'Santa Casa de Misericórdia de Avaré', 6)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, drs, data, posicao_id, movimento, valor_convenio, situacao_obs)
SELECT codigo, '024.00139387/2023-19', 'Santa Casa de Misericórdia de Avaré', '228/2020', 6, '2026-02-24', 5, 'RECEBIDO', 12505872.00, 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 06' FROM np;

-- DRS 08
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00078083/2024-41', '309/2024', 8)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00078083/2024-41', '309/2024', 8, '2025-08-07', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 08' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00181988/2024-05', '383/2024', 8)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00181988/2024-05', '383/2024', 8, '2025-10-11', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 08' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00169773/2024-16', '475/2019', 8)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00169773/2024-16', '475/2019', 8, '2024-01-11', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 08' FROM np;

-- DRS 09
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00043012/2024-27', '992/2022', 9)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00043012/2024-27', '992/2022', 9, '2025-08-23', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 09' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00042975/2024-11', '429/2022', 9)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00042975/2024-11', '429/2022', 9, '2025-08-26', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 09' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00043042/2024-33', '985/2022', 9)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00043042/2024-33', '985/2022', 9, '2025-12-17', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 09' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00215791/2024-79', '348/2020', 9)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00215791/2024-79', '348/2020', 9, '2025-01-27', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 09' FROM np;

-- DRS 13
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00155520/2025-38', '839/2019', 13)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00155520/2025-38', '839/2019', 13, '2025-03-11', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 13' FROM np;

-- DRS 15
WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00179543/2023-76', '1325/2022', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00179543/2023-76', '1325/2022', 15, '2025-09-17', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00107751/2023-73', '0281/2020', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00107751/2023-73', '0281/2020', 15, '2025-02-08', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00109196/2025-86', '0239/2020', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00109196/2025-86', '0239/2020', 15, '2025-08-23', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00156935/2025-29', '1148/2022', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00156935/2025-29', '1148/2022', 15, '2025-03-11', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00173999/2025-94', '0402/2020', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00173999/2025-94', '0402/2020', 15, '2025-02-12', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00011251/2026-80', '0334/2021', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00011251/2026-80', '0334/2021', 15, '2026-01-28', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00036374/2025-42', '0778/2023', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00036374/2025-42', '0778/2023', 15, '2026-03-17', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00064268/2026-30', '1593/2018', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00064268/2026-30', '1593/2018', 15, '2026-05-15', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00074002/2023-52', '1599/2022', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00074002/2023-52', '1599/2022', 15, '2025-01-30', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, drs)
  VALUES ('024.00076532/2025-05', '0157/2019', 15)
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, drs, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00076532/2025-05', '0157/2019', 15, '2025-07-06', 5, 'RECEBIDO', 'Fonte: planilha CONT PROC TRIBUNAL — aba DRS 15' FROM np;

-- ── Aba OUTROS ───────────────────────────────────────────────────────────────

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio)
  VALUES ('024.00138455/2025-86', '533/2023')
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, data, posicao_id, movimento, valor_convenio, situacao_obs)
SELECT codigo, '024.00138455/2025-86', '533/2023', '2025-09-22', 5, 'OFÍCIO PRES.FFM 46/2025 - PEDIDO DE RECONSIDERAÇÃO', 2160000.00, 'Tipo: Atendimento a solicitações | Assunto: Ofício PRES.FFM 46/2025 - Pedido de Reconsideração - Prestação de Contas - Convênio 533/2023 | Unidade Remetente ao GPC: SES-CGOF-RECEBIMENTO | Unidade Geradora: SES-GS-RECEBIMENTO | Total de Andamentos: 9 | Data Assinatura/Convênio: 28/12/2015 | Fonte: planilha CONT PROC TRIBUNAL — aba OUTROS' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio)
  VALUES ('024.00040789/2023-59', '170/2019')
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, convenio, data, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00040789/2023-59', '170/2019', '2023-11-23', 5, 'PRESTAÇÃO DE CONTAS - CONVÊNIO 170/2019', 'Tipo: Processo de formalização e execução de acordo | Unidade Remetente ao GPC: SES-CRS-GGA | Unidade Geradora: SES-CGOF-GPC | Total de Andamentos: 9 | Fonte: planilha CONT PROC TRIBUNAL — aba OUTROS' FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo)
  VALUES ('024.00174021/2024-69')
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, data, responsavel, posicao_id, movimento, situacao_obs)
SELECT codigo, '024.00174021/2024-69', '2024-01-11', 'Elenice', 5, 'PROCESSO DE PAGAMENTO DE DIÁRIAS E AJUDA DE CUSTO', 'Tipo: Processo de pagamento de diárias e ajuda de custo | Assunto/Interessado: Elenice | Unidade Remetente ao GPC: SES-CGOF-GCF | Unidade Geradora: SES-CGOF-GPC | Total de Andamentos: 10 | Fonte: planilha CONT PROC TRIBUNAL — aba OUTROS' FROM np;
