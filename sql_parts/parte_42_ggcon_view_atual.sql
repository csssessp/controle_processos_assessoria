-- =============================================================================
-- PARTE 42: View "cgof_ggcon_processos_atual" — apenas a movimentação mais
-- recente de cada processo_sei.
--
-- cgof_ggcon_processos é um log de movimentações (cada linha é uma
-- movimentação, o mesmo processo_sei pode ter várias linhas ao longo do
-- tempo — ver comentário em parte_36_ggcon_processos.sql). A listagem
-- principal da tela "Processos GGCON" estava consultando essa tabela
-- diretamente, então um processo com 3 movimentações aparecia como 3
-- linhas repetidas na tabela. Esta view devolve só a linha de maior
-- "codigo" (a mais recente) por processo_sei, que é exatamente a regra
-- de "registro atual" já documentada na tabela original.
--
-- O histórico completo (todas as movimentações) continua disponível ao
-- clicar em "Ver histórico" de um processo — essa tela consulta
-- cgof_ggcon_processos diretamente, sem passar pela view.
--
-- Execute no SQL Editor do Supabase.
-- =============================================================================

CREATE OR REPLACE VIEW public.cgof_ggcon_processos_atual AS
SELECT DISTINCT ON (processo_sei) *
FROM public.cgof_ggcon_processos
ORDER BY processo_sei, codigo DESC;

-- Mesmo padrão de permissão da tabela original (RLS desativada, autenticação
-- customizada — ver parte_38_fix_ggcon_rls.sql): concede leitura a anon/authenticated.
GRANT SELECT ON public.cgof_ggcon_processos_atual TO anon, authenticated;

COMMENT ON VIEW public.cgof_ggcon_processos_atual IS
  'Uma linha por processo_sei — a movimentação mais recente (maior codigo). Usada pela listagem principal do GGCON para não repetir o mesmo processo várias vezes.';
