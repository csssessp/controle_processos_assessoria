-- =============================================================================
-- PARTE 59: reconciliação da aba "SERVIÇOS APARTADOS" de
-- 'CONT PROC TRIBUNAL (3).xlsx' — nenhum dos 5 atendimentos registrados na
-- aba existia ainda em cgof_gpc_atividade_avulsa (tabela criada depois desses
-- registros). Horas calculadas a partir do intervalo início/término da
-- planilha quando os dois estavam preenchidos.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

INSERT INTO public.cgof_gpc_atividade_avulsa (tecnico, tipo, descricao, contexto, horas, data_atividade) VALUES
  ('Gilmar/Marco', 'Elaboração de planilha', 'Planilha de controle dos processos', 'Início: 3/8/2026 das 8:00 | Término: as 13:00 do 3/8/2026 | Fonte: planilha CONT PROC TRIBUNAL — aba SERVIÇOS APARTADOS', 5.0, '2026-08-03 08:00:00-03'),
  ('Gilmar/Marco', 'Elaboração de planilha', 'Planilha de controle dos processos', 'Início: 4/8/2026 das 8:00 | Término: as 10:00 do 4/8/2026 | Fonte: planilha CONT PROC TRIBUNAL — aba SERVIÇOS APARTADOS', 2.0, '2026-08-04 08:00:00-03'),
  ('Gilmar/Marco', 'Elaboração de planilha', 'Planilha de controle dos processos', 'Início: 5/8/2026 das 8:00 | Término: as 9:30 do 5/8/2026 | Fonte: planilha CONT PROC TRIBUNAL — aba SERVIÇOS APARTADOS', 1.5, '2026-08-05 08:00:00-03'),
  ('Gilmar', 'Ligação para a DRS 14', 'conv.545/2016 PM de Itapira', 'Início: 5/08/2026 das 11:10 | Término: as 11:20 do 5/08/2026 | Fonte: planilha CONT PROC TRIBUNAL — aba SERVIÇOS APARTADOS', 0.17, '2026-08-05 11:10:00-03'),
  ('Gilmar/Marco', 'Elaboração de planilha', 'Planilha de controle dos processos', 'Início: 13/08/2026 das 12:20 | Término: não informado | Fonte: planilha CONT PROC TRIBUNAL — aba SERVIÇOS APARTADOS', NULL, '2026-08-13 12:20:00-03');
