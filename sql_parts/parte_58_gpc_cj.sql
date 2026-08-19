-- =============================================================================
-- PARTE 58: reconciliação da aba "CJ" (processos na Consultoria Jurídica) de
-- 'CONT PROC TRIBUNAL (3).xlsx'. 7 dos 9 processos da aba já estavam
-- rastreados em cgof_gpc_recebidos; os 2 abaixo não tinham nenhum cadastro.
--
-- Reaproveita o conceito já existente de "posição" (cgof_gpc_posicao) em vez
-- de criar tabela nova — adiciona "Consultoria Jurídica (CJ)" como posição
-- válida, do mesmo jeito que "Devolvido a CSS" ou "Encaminhado ao TCE-SP" já
-- existem.
--
-- NOTA: diferente de cgof_gpc_processos/cgof_gpc_recebidos, a tabela
-- cgof_gpc_posicao NÃO tem "codigo" auto-gerado (é INTEGER PRIMARY KEY sem
-- IDENTITY/SERIAL) — por isso o INSERT abaixo informa o código manualmente.
-- Maior código existente hoje: 13.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

INSERT INTO public.cgof_gpc_posicao (codigo, posicao)
SELECT 14, 'Consultoria Jurídica (CJ)'
WHERE NOT EXISTS (SELECT 1 FROM public.cgof_gpc_posicao WHERE posicao = 'Consultoria Jurídica (CJ)');

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, convenio, entidade)
  VALUES ('024.00066836/2026-37', '486/2023', 'Associação Beneficente de Presidente Bernardes')
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, convenio, posicao_id, movimento, situacao_obs)
SELECT np.codigo, '024.00066836/2026-37', 'Associação Beneficente de Presidente Bernardes', '486/2023',
       (SELECT codigo FROM public.cgof_gpc_posicao WHERE posicao = 'Consultoria Jurídica (CJ)'),
       'Foi devolvido para a CRS o despacho esta para o GS com proposta de CJ',
       'Assunto: Solicitacao Convênio nº486/2023 para a CJ | Já foi devolvido para a CRS - 21/05/2026 / Já está na DRS desde 02/06/2026 | Fonte: planilha CONT PROC TRIBUNAL — aba CJ'
FROM np;

WITH np AS (
  INSERT INTO public.cgof_gpc_processos (processo, entidade)
  VALUES ('024.00061958/2026-37', 'DEPARTAMENTO REGIONAL DE SAÚDE - DRS VII - CAMPINAS')
  RETURNING codigo
)
INSERT INTO public.cgof_gpc_recebidos (processo_codigo, processo, entidade, posicao_id, movimento, situacao_obs)
SELECT np.codigo, '024.00061958/2026-37', 'DEPARTAMENTO REGIONAL DE SAÚDE - DRS VII - CAMPINAS',
       (SELECT codigo FROM public.cgof_gpc_posicao WHERE posicao = 'Consultoria Jurídica (CJ)'),
       'Processo está sendo ENVIADO A CJ',
       'Assunto: SEI nº 024.00061958/2026-37 está na CJ | O GPC irá fazer o acompanhamento do processo | Fonte: planilha CONT PROC TRIBUNAL — aba CJ'
FROM np;
