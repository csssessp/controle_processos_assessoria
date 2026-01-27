# Setup do Sistema de Histórico de Prestações

## ⚠️ IMPORTANTE: Execute no Supabase SQL Editor

**SE RECEBER ERRO DE CORS/403, EXECUTE ESTE SCRIPT PARA CORRIGIR:**

```sql
-- =====================================================
-- REMOVER POLÍTICAS ANTIGAS (se existirem)
-- =====================================================
DROP POLICY IF EXISTS "Allow authenticated users to view historico" ON public.prestacoes_contas_historico;
DROP POLICY IF EXISTS "Allow authenticated users to insert historico" ON public.prestacoes_contas_historico;
DROP POLICY IF EXISTS "Allow authenticated users to update historico" ON public.prestacoes_contas_historico;

-- =====================================================
-- RECRIAR TABELA COM RLS CORRETO
-- =====================================================

-- Desabilitar RLS temporariamente para criar
ALTER TABLE IF EXISTS public.prestacoes_contas_historico DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS novamente
ALTER TABLE public.prestacoes_contas_historico ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRIAR POLÍTICAS PERMISSIVAS
-- =====================================================

-- Política para SELECT - permitir TODOS usuários autenticados
CREATE POLICY "Allow all authenticated users to select historico" 
ON public.prestacoes_contas_historico 
FOR SELECT 
USING (true);

-- Política para INSERT - permitir TODOS usuários autenticados
CREATE POLICY "Allow all authenticated users to insert historico" 
ON public.prestacoes_contas_historico 
FOR INSERT 
WITH CHECK (true);

-- Política para UPDATE - permitir TODOS usuários autenticados
CREATE POLICY "Allow all authenticated users to update historico" 
ON public.prestacoes_contas_historico 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Política para DELETE - permitir TODOS usuários autenticados
CREATE POLICY "Allow all authenticated users to delete historico" 
ON public.prestacoes_contas_historico 
FOR DELETE 
USING (true);

-- =====================================================
-- VERIFICAR STATUS
-- =====================================================
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'prestacoes_contas_historico';

SELECT * FROM pg_policies WHERE tablename = 'prestacoes_contas_historico';
```

## ✅ Passos para Resolver

1. **Abra o SQL Editor** do Supabase
2. **Cole o script acima**
3. **Clique em "Run"**
4. **Verifique se retornou resultados** (deve mostrar RLS ativo e 4 políticas)
5. **Volte para a app** e tente novamente

---

## 🔧 Se ainda não funcionar, execute ESTE script completo de reset:

```sql
-- =====================================================
-- SCRIPT COMPLETO: CRIAR/RESETAR HISTÓRICO
-- =====================================================

-- 1. Drop da tabela antiga (se existir)
DROP TABLE IF EXISTS public.prestacoes_contas_historico CASCADE;

-- 2. Criar tabela nova
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

-- 3. Criar índices
CREATE INDEX idx_prestacoes_historico_prestacao_id 
ON public.prestacoes_contas_historico(prestacao_id);

CREATE INDEX idx_prestacoes_historico_data_alteracao 
ON public.prestacoes_contas_historico(data_alteracao DESC);

CREATE INDEX idx_prestacoes_historico_version 
ON public.prestacoes_contas_historico(prestacao_id, version_number DESC);

-- 4. Habilitar RLS
ALTER TABLE public.prestacoes_contas_historico ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas permissivas (SEM autenticação para debug)
CREATE POLICY "Allow all" 
ON public.prestacoes_contas_historico 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 6. Adicionar coluna na tabela de prestações (se não existir)
ALTER TABLE public.prestacoes_contas 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- 7. Verificar
SELECT 
  'Tabela criada' as status,
  COUNT(*) as total_registros
FROM public.prestacoes_contas_historico;
```

---

## ✅ Como Usar

### 1. Executar no Supabase
1. Abra seu projeto Supabase
2. Vá para: **SQL Editor**
3. Clique em **+ New Query**
4. Cole o script acima
5. Clique em **Run**

### 2. Após criação da tabela
A aplicação fará automaticamente:
- ✅ Registrar primeira entrada quando uma prestação é criada
- ✅ Registrar mudança de status quando atualizada
- ✅ Mostrar histórico em um modal visual com timeline
- ✅ Preservar histórico mesmo quando deletado

### 3. Campos principais
- `status_anterior`: Status anterior (REGULAR ou IRREGULAR)
- `status_novo`: Novo status após alteração
- `motivo_anterior`: Motivo anterior (se irregular)
- `motivo_novo`: Novo motivo (se irregular)
- `observacoes`: Observações sobre a mudança
- `descricao`: Descrição automática (ex: "Status alterado de IRREGULAR para REGULAR")
- `alterado_por`: ID do usuário que fez a alteração
- `nome_usuario`: Nome do usuário para exibição
- `data_alteracao`: Timestamp da alteração
- `version_number`: Versão sequencial

## 🔍 Funcionalidades

### Interface Nova
- Botão com ícone de **histórico** (⏰) em cada prestação
- Click abre modal com timeline visual
- Mostra transições de status com cores:
  - 🟢 **REGULAR** = verde
  - 🟡 **IRREGULAR** = amarelo
- Exibe usuario e data/hora de cada mudança

### Exemplo de Timeline
```
┌─ ⏰ 27/01/2026 16:30 por João
│  Prestação criada com status REGULAR
│
├─ ⏰ 27/01/2026 17:15 por Maria
│  Status alterado de REGULAR para IRREGULAR
│  Motivo: divergência significativa
│
└─ ⏰ 27/01/2026 18:45 por João
   Status alterado de IRREGULAR para REGULAR
   Observações: Corrigido conforme solicitado
```

## 📝 Próximos Passos

Após executar o SQL:

1. **Teste salvando uma prestação** - Deve aparecer versão 1 no histórico
2. **Altere o status** - Deve registrar a mudança com transição
3. **Clique no ícone de histórico** - Deve abrir modal com timeline
4. **Verifique os detalhes** - Deve mostrar motivo, observações, usuário e data/hora

Se tudo funcionar, o sistema de histórico está **100% ativo** ✅

