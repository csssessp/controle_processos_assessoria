-- =====================================================
-- ⚠️  SETUP OBRIGATÓRIO - Execute no Supabase SQL Editor
-- =====================================================
-- Esta script adiciona as colunas e tabelas necessárias
-- para o sistema de Prestações de Contas funcionar corretamente

-- PASSO 1: Adicionar coluna 'interested' na tabela prestacoes_contas
ALTER TABLE public.prestacoes_contas 
ADD COLUMN IF NOT EXISTS interested VARCHAR(255);

-- PASSO 2: Adicionar coluna de versão na tabela de prestações (se não existir)
ALTER TABLE public.prestacoes_contas 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- PASSO 3: Recriar tabela de histórico
DROP TABLE IF EXISTS public.prestacoes_contas_historico CASCADE;

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

-- PASSO 4: Criar índices para performance
CREATE INDEX idx_prestacoes_historico_prestacao_id 
ON public.prestacoes_contas_historico(prestacao_id);

CREATE INDEX idx_prestacoes_historico_data_alteracao 
ON public.prestacoes_contas_historico(data_alteracao DESC);

CREATE INDEX idx_prestacoes_historico_version 
ON public.prestacoes_contas_historico(prestacao_id, version_number DESC);

-- PASSO 5: Habilitar Row Level Security (RLS)
ALTER TABLE public.prestacoes_contas_historico ENABLE ROW LEVEL SECURITY;

-- PASSO 6: Criar política permissiva (permite todos os usuários autenticados)
DROP POLICY IF EXISTS "Allow all" ON public.prestacoes_contas_historico;

CREATE POLICY "Allow all" 
ON public.prestacoes_contas_historico 
FOR ALL 
USING (true)
WITH CHECK (true);

-- =====================================================
-- ✅ VERIFICAÇÃO - Execute para confirmar setup
-- =====================================================

SELECT 
  'Historico' as tabela,
  COUNT(*) as total_registros
FROM public.prestacoes_contas_historico

UNION ALL

SELECT 
  'Colunas adicionadas' as tabela,
  COUNT(*) as total_registros
FROM information_schema.columns 
WHERE table_name = 'prestacoes_contas' 
AND column_name IN ('interested', 'version_number');

-- Se tudo funcionar, você verá:
-- Historico | 0 (tabela criada vazia)
-- Colunas adicionadas | 2 (as duas colunas foram criadas)
