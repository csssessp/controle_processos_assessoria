-- =============================================================================
-- PARTE 66: GGCON — Análise Processo: "Documento SEI" vira lista de links
-- Os técnicos colam o(s) link(s) do(s) documento(s) SEI relacionados a cada item
-- do checklist — um item pode ter mais de um documento comprobatório. A coluna
-- passa de TEXT (um valor só) para TEXT[] (lista de links), no mesmo padrão já
-- usado em cgof_ggcon_analises.termo_aditivo_numeros.
-- Seguro rodar a qualquer momento: nenhuma linha tem documento_sei preenchido
-- ainda (conferido em produção antes de escrever esta migração).
-- Execute no SQL Editor do Supabase, depois de parte_65.
-- =============================================================================

ALTER TABLE public.cgof_ggcon_analise_itens
  ALTER COLUMN documento_sei TYPE TEXT[] USING (
    CASE WHEN documento_sei IS NULL OR documento_sei = '' THEN NULL ELSE ARRAY[documento_sei] END
  );

COMMENT ON COLUMN public.cgof_ggcon_analise_itens.documento_sei IS
  'Lista de links dos documentos SEI comprobatórios deste item (um item pode ter mais de um documento). Exportados como hyperlinks clicáveis no PDF da ficha.';
