-- Adiciona campos específicos para reparcelamento em cgof_gpc_parcelamento

ALTER TABLE public.cgof_gpc_parcelamento
  ADD COLUMN IF NOT EXISTS data_parou_pagar  DATE,           -- data em que o devedor parou de pagar
  ADD COLUMN IF NOT EXISTS valor_por_parcela NUMERIC(18,2);  -- valor de cada parcela (corrigido / nº parcelas)

COMMENT ON COLUMN public.cgof_gpc_parcelamento.data_parou_pagar
  IS 'Data em que o devedor parou de pagar o parcelamento (relevante para reparcelamento).';

COMMENT ON COLUMN public.cgof_gpc_parcelamento.valor_por_parcela
  IS 'Valor de cada parcela = valor_corrigido / parcelas.';
