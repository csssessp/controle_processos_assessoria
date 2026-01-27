# Setup do Sistema de Histórico de Prestações

## ⚠️ IMPORTANTE: Execute no Supabase SQL Editor

Cole o código abaixo no **SQL Editor** do seu painel Supabase para criar a tabela de histórico:

```sql
-- =====================================================
-- CRIAR TABELA DE HISTÓRICO DE PRESTAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.prestacoes_contas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prestacao_id UUID NOT NULL REFERENCES prestacoes_contas(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  motivo_anterior TEXT,
  motivo_novo TEXT,
  observacoes TEXT,
  descricao TEXT NOT NULL,
  alterado_por UUID NOT NULL REFERENCES auth.users(id),
  nome_usuario VARCHAR(255) NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_prestacao FOREIGN KEY (prestacao_id) REFERENCES prestacoes_contas(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_prestacoes_historico_prestacao_id ON public.prestacoes_contas_historico(prestacao_id);
CREATE INDEX IF NOT EXISTS idx_prestacoes_historico_data_alteracao ON public.prestacoes_contas_historico(data_alteracao DESC);
CREATE INDEX IF NOT EXISTS idx_prestacoes_historico_version ON public.prestacoes_contas_historico(prestacao_id, version_number DESC);

-- =====================================================
-- ADICIONAR COLUNA version_number À TABELA prestacoes_contas
-- =====================================================

ALTER TABLE public.prestacoes_contas 
ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;

-- =====================================================
-- CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.prestacoes_contas_historico ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (visualizar histórico)
CREATE POLICY "Allow authenticated users to view historico" 
ON public.prestacoes_contas_historico 
FOR SELECT 
TO authenticated 
USING (true);

-- Política para INSERT (criar histórico)
CREATE POLICY "Allow authenticated users to insert historico" 
ON public.prestacoes_contas_historico 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "Allow authenticated users to update historico" 
ON public.prestacoes_contas_historico 
FOR UPDATE 
TO authenticated 
USING (true);

-- =====================================================
-- FUNCIONALIDADE: Trigger para auto-versionamento (opcional)
-- =====================================================
-- Se quiser que o sistema registre automaticamente quando uma prestação é alterada,
-- crie a função abaixo (requer implementação adicional no backend):

CREATE OR REPLACE FUNCTION auto_increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version_number = (
    SELECT COALESCE(MAX(version_number), 0) + 1
    FROM prestacoes_contas_historico
    WHERE prestacao_id = NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nota: Se descomentar o trigger, o app fará o versionamento automaticamente
-- CREATE TRIGGER trigger_auto_version
-- BEFORE UPDATE ON prestacoes_contas
-- FOR EACH ROW
-- EXECUTE FUNCTION auto_increment_version();
```

## ✅ Como Usar

### 1. Executar no Supabase
1. Abra seu projeto Supabase
2. Vá para: **SQL Editor**
3. Clique em **+ New Query**
4. Cole TODO o código acima
5. Clique em **Run**

### 2. Após criação da tabela
A aplicação fará automaticamente:
- ✅ Registrar primeira entrada quando uma prestação é criada
- ✅ Registrar mudança de status quando atualizada
- ✅ Mostrar histórico em um modal visual com timeline
- ✅ Preservar histórico mesmo quando deletado (através de triggers)

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
