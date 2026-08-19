-- =============================================================================
-- PARTE 54: dados iniciais de "Servidores" — os 2 únicos registros com dado
-- real na aba "Servidores " de 'CONT PROC TRIBUNAL (3).xlsx' (linhas 2-17 e
-- 19-35 da planilha são apenas índices vazios, sem conteúdo a migrar).
--
-- Execute no SQL Editor do Supabase, depois de parte_53_gpc_servidores.sql.
-- =============================================================================

INSERT INTO public.cgof_gpc_servidores
  (tipo, processo_tce, beneficiario, drs, convenio, exercicio, responsavel, situacao, observacoes)
VALUES
  ('PUBLICACAO_DOE', 'Re: Acórdão IRREGULAR - TC-026352.989.20-6', 'Prefeitura Municipal de Santos', 4, '18/2019', '2019', 'Gilmar/Marco', 'Processo irregular', 'DRS 04 está ciente conforme e-mail de agradecimento em 03/08/2026');

INSERT INTO public.cgof_gpc_servidores
  (tipo, processo_tce, beneficiario, drs, convenio, prazo, exercicio, responsavel)
VALUES
  ('REQUISICAO', '01812.989.23-8', 'Casa de Saúde Santa Marcelina', 1, '1593/2022', '2026-08-10', '2022', 'Gilmar/Marco');
