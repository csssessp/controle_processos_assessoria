-- =====================================================
-- SETUP COMPLETO: Coluna Interested + Histórico
-- =====================================================
-- Execute isso no Supabase SQL Editor

-- 1. Adicionar coluna 'interested' na tabela prestacoes_contas
ALTER TABLE public.prestacoes_contas 
ADD COLUMN IF NOT EXISTS interested VARCHAR(255);

-- 2. Drop da tabela histórico antiga (se existir)
DROP TABLE IF EXISTS public.prestacoes_contas_historico CASCADE;

-- 3. Criar tabela de histórico
CREATE TABLE public.prestacoes_contas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL REFERENCES prestacoes_contas(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  motivo_anterior TEXT,
  motivo_novo TEXT,
  observacoes TEXT,
  descricao TEXT NOT NULL,
  alterado_por UUID NOT NULL,
  nome_usuario VARCHAR(255) NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices
CREATE INDEX idx_prestacoes_historico_prestacao_id 
ON public.prestacoes_contas_historico(prestacao_id);

CREATE INDEX idx_prestacoes_historico_data_alteracao 
ON public.prestacoes_contas_historico(data_alteracao DESC);

CREATE INDEX idx_prestacoes_historico_version 
ON public.prestacoes_contas_historico(prestacao_id, version_number DESC);

-- 5. Habilitar RLS
ALTER TABLE public.prestacoes_contas_historico ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas permissivas
CREATE POLICY "Allow all" 
ON public.prestacoes_contas_historico 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 7. Adicionar versão na tabela de prestações (se não existir)
ALTER TABLE public.prestacoes_contas 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- 8. Verificar
SELECT 
  'Setup Completo' as status,
  COUNT(*) as total_historico
FROM public.prestacoes_contas_historico;

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'prestacoes_contas' 
AND (column_name = 'interested' OR column_name = 'version_number');
