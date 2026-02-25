# Análise do Sistema: Modelo de Fluxos de Processos

## 📋 Resumo Executivo

Este é um **Sistema de Controle de Processos Administrativos** da Secretaria de Estado da Saúde (SES) de São Paulo que rastreia o fluxo de documentos/processos através de diferentes setores e órgãos.

---

## 🔄 Modelo de Fluxo de Processos

### Conceito Principal
O sistema trabalha com um modelo de **rastreamento de movimentações**:
- Cada **"número de processo"** pode ter **múltiplas movimentações** 
- Uma movimentação = passagem por um setor/local específico
- O histórico completo mostra o percurso do processo por todo o sistema

### Estrutura da Interface Process

```typescript
interface Process {
  // Identificação
  id: string;                    // ID único da movimentação
  number: string;               // Número do processo (ex: 024.00025550/2023-59)
  
  // Origem e Contexto
  category: string;             // Sempre "Assessoria"
  CGOF: string;                 // Origem (Assessoria|Recebimento|Gabinete do Coordenador)
  
  // Datas de Rastreamento
  entryDate: string;            // Data de ENTRADA neste setor (ISO: YYYY-MM-DD)
  processDate: string | null;   // Data de SAÍDA deste setor (conclusão do movimento)
  deadline: string | null;      // Prazo de retorno/completude
  
  // Localização Atual
  sector: string;               // Setor/Localização (ex: "GS/RECEBIMENTO", "SES-GS-ATG8")
  
  // Informações do Processo
  interested: string;           // Quem solicita/órgão interessado
  subject: string;              // Assunto/Objeto do processo
  observations?: string;        // Observações adicionais
  processLink?: string;         // Link para o processo na origem
  
  // Metadados
  urgent: boolean;              // Marcado como urgente
  createdBy: string;            // Usuário que criou este movimento
  updatedBy: string;            // Usuário que atualizou
  createdAt: string;            // Timestamp de criação
  updatedAt: string;            // Timestamp de atualização
}
```

---

## 📊 Fluxo Visual de Um Processo

```
Processo Número: 024.00025550/2023-59
Status: Em andamento

┌─────────────────────────────────────────────────────────────────┐
│  HISTÓRICO DO FLUXO - Timeline de Movimentações                │
└─────────────────────────────────────────────────────────────────┘

    ○ (Ponto azul = Localização Atual)
    │
    ├─ 2023-06-13 [Entrada] → ASSESSORIA
    │  Setor: Assessoria
    │  De: Deputado Estadual Atila Jacomussi
    │  Assunto: Solicitação de retomada do repasse...
    │
    ├─ 2023-06-15 [Saída: 2023-06-15] → GS/RECEBIMENTO
    │  Setor: GS/RECEBIMENTO
    │  Origem: Recebimento
    │
    ├─ 2023-07-01 [Saída: 2023-07-10] → GABINETE DO COORDENADOR
    │  Setor: Gabinete do Coordenador
    │  Origem: Gabinete do Coordenador
    │
    ○ 2023-07-20 [Entrada] → SES-GS-ATG8
    │  Setor: SES-GS-ATG8
    │  Status: LOCALIZAÇÃO ATUAL (em processamento)
    │
```

---

## 🎯 Campos Chave do Fluxo

### 1. **Data de Entrada (entryDate)**
- Quando o processo chegou ao setor atual
- Obrigatório
- Formato: YYYY-MM-DD
- Protegido por senha se alterado após criação

### 2. **Data de Saída (processDate)**
- Quando o processo saiu do setor (foi enviado adiante)
- Opcional (nulo = ainda está neste setor)
- Se nulo = processo está na "localização atual"

### 3. **Localização Atual (sector)**
- Nome do setor/órgão onde o processo está agora
- Exemplos:
  - "Assessoria"
  - "GS/RECEBIMENTO"
  - "SES-GS-ATG8"
  - Nacional comum: "Gabinete do Coordenador"

### 4. **Origem (CGOF)**
- Onde o processo foi originalmente registrado
- Opções fixas: 
  - **Assessoria** - vindo da assessoria
  - **Recebimento** - vindo do protocolo de recebimento
  - **Gabinete do Coordenador** - vindo do gabinete

### 5. **Prazo (deadline)**
- Data limite para conclusão
- Usado para calcular atrasos
- Opcional

---

## 💾 Como o Fluxo é Armazenado no Banco (Supabase)

**Tabela: `processes`**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Chave primária (ID da movimentação) |
| number | TEXT | Número do processo (múltiplos registros = histórico) |
| category | TEXT | "Assessoria" |
| CGOF | TEXT | Origem |
| entryDate | DATE | Data de entrada |
| processDate | DATE | Data de saída (NULL = atual) |
| sector | TEXT | Localização |
| deadline | DATE | Prazo |
| urgent | BOOLEAN | Marcado como urgente |
| interested | TEXT | Solicitante |
| subject | TEXT | Assunto |
| observations | TEXT | Observações |
| process_link | TEXT | Link do processo |
| createdBy | UUID | ID do usuário criador |
| updatedBy | UUID | ID do usuário que atualizou |
| createdAt | TIMESTAMP | Data/hora de criação |
| updatedAt | TIMESTAMP | Data/hora de atualização |

**Exemplo de dados no BD para um fluxo completo:**

```
Número 024.00025550/2023-59

Registro 1 (ID: abc123):
  entry: 2023-06-13, process: NULL, sector: "Assessoria", CGOF: "Assessoria"
  
Registro 2 (ID: def456):
  entry: 2023-06-15, process: 2023-06-15, sector: "GS/RECEBIMENTO", CGOF: "Recebimento"
  
Registro 3 (ID: ghi789):
  entry: 2023-07-20, process: NULL, sector: "SES-GS-ATG8", CGOF: "Assessoria"
  ↑ Este é a localização atual (process_date = NULL)
```

---

## 🔍 Identificando a Localização Atual

**Função: `getCurrentLocationId(history: Process[])`**

Lógica:
1. Procura por todas as movimentações do processo
2. Encontra o registro com a **data mais recente**
3. Se tem `processDate` → usa essa data
4. Se não tem `processDate` → usa `entryDate`
5. O registro mais recente = Localização Atual
6. Seu setor (`sector`) = Onde está agora o processo

```tsx
const getCurrentLocationId = (history: Process[]): string | null => {
  let currentItem: Process | null = null;
  let mostRecentDate: Date | null = null;
  
  for (const item of history) {
    const dateToCompare = item.processDate 
      ? new Date(item.processDate) 
      : new Date(item.entryDate);
    
    if (!mostRecentDate || dateToCompare > mostRecentDate) {
      mostRecentDate = dateToCompare;
      currentItem = item;
    }
  }
  
  return currentItem?.id || null;
};
```

---

## 📈 Fluxo de Operações

### Criar Nova Movimentação
```
Usuário clica "Novo Fluxo" ou "Novo Registro"
         ↓
Abre Modal com Formulário
         ↓
Preenche:
  - Data de Entrada (obrigatório)
  - Origem/CGOF (obrigatório)
  - Número do Processo (obrigatório)
  - Setor/Localização (obrigatório)
  - Interessada, Assunto (obrigatório)
  - Data de Saída (opcional)
  - Prazo, Urgente, Link, Observações (opcional)
         ↓
Grava no BD (INSERT ou UPSERT por ID)
         ↓
Atualiza histórico local
```

### Ver Histórico Completo
```
Usuário clique em processo na tabela
         ↓
Sistema busca com "fetchProcessHistory(number)"
         ↓
Query: SELECT * FROM processes WHERE number = X ORDER BY entryDate
         ↓
Renderiza Timeline Vertical
  - Cada movimento como ponto na linha
  - Ponto azul = Localização Atual
  - Mostra datas, setores, origem de cada movimento
```

### Excluir Movimentação
```
Usuário clica Delete em uma movimentação específica no histórico
         ↓
Abre Modal de Confirmação de Senha
         ↓
Verifica senha (segurança)
         ↓
DELETE FROM processes WHERE id = X
         ↓
Atualiza histórico (se último movimento deletado → fecha modal)
```

### Editar Movimentação
```
Usuário clica Edit em uma movimentação
         ↓
Carrega dados em Modal de Edição
         ↓
Se entryDate foi alterada → pede senha (auditoria)
         ↓
UPDATE processes SET ... WHERE id = X
         ↓
Log criado automaticamente
```

---

## 📊 Estatísticas & Dashboard

O Dashboard calcula:

```typescript
interface DashboardStats {
  total: number;                    // Total de processos
  urgent: number;                   // Marcados como urgentes
  overdue: number;                  // Com deadline passada
  nearDeadline: number;             // Próximos a vencer
  bySector: Array<{                 // Agrupados por setor
    name: string;
    value: number;
  }>;
}
```

Cálculos:
- **Total**: COUNT de registros na tabela processes
- **Urgent**: COUNT WHERE urgent = TRUE
- **Overdue**: COUNT WHERE deadline < TODAY AND processDate IS NULL
- **Near Deadline**: COUNT WHERE deadline BETWEEN TODAY AND TODAY+7 AND processDate IS NULL
- **By Sector**: GROUP BY sector

---

## 🔐 Segurança & Auditoria

### Rastreamento de Alterações
- `createdBy/updatedBy`: Quem criou/atualizou
- `createdAt/updatedAt`: Quando foi criado/atualizado
- **Senha requerida** para alterar data de entrada (auditoria)

### Logs Centralizados
**Tabela: `logs`**
```typescript
interface Log {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'USER_MGMT';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  targetId?: string;  // ID do processo afetado
}
```

Toda ação importante é registrada:
- Criação de processo
- Atualização de movimento
- Remoção de movimento
- Login/Logout de usuário
- Gerenciamento de usuários

---

## 🎨 Visualização na UI

### Lista Principal (ProcessManager)
- Tabela com processos
- Filtros por: CGOF, Setor, Data, Urgency, Status
- Coluna "Localização Atual" mostra o `sector` do último movimento
- Coluna "Data de Saída" mostra se está aberto/fechado

### Modal de Histórico
```
[Activity] Histórico do Fluxo
Número: 024.00025550/2023-59

Timeline Vertical:
●─ Movimento 1: 13/06/2023 - Assessoria
  │ Entrada: 13/06/2023
  │ Origem: Assessoria
  │ [Edit] [Delete]
  │
●─ Movimento 2: 15/06/2023 - GS/RECEBIMENTO
  │ Entrada: 15/06/2023, Saída: 15/06/2023
  │ Origem: Recebimento
  │ [Edit] [Delete]
  │
●─ Movimento 3: 20/07/2023 - SES-GS-ATG8 ← Localização Atual
  │ Entrada: 20/07/2023
  │ Origem: Assessoria
  │ [Edit] [Delete]

[Novo Fluxo] [Excluir Fluxo] [Fechar]
```

---

## 📝 Casos de Uso

### 1. Acompanhamento de Processo
**Cenário**: Gerente precisa saber onde um processo está agora
- Busca por número
- Clica para ver histórico
- Vê timeline completa
- Localização atual é destacada

### 2. Importação em Massa
**Cenário**: Carregar 1000s de processos históricos de planilha Excel
- Upload de arquivo XLSX
- Sistema parseia e valida
- Cria movimentações en masse (batch de 100)
- Log registra quantidade importada

### 3. Auditoria de Alterações
**Cenário**: Verificar quem modificou processo X e quando
- Abre aba "Logs"
- Filtra por processo ID
- Vê histórico: CREATE → UPDATE → UPDATE
- Com timestamps e nomes de usuários

### 4. Gestão de Prazos
**Cenário**: Identificar processos que estão atrasados
- Dashboard mostra estatísticas
- Filtros de "overdue" na lista
- Processos com deadline < hoje
- Alertas visuais (ícone de relógio)

---

## 🔧 Tecnologias

- **Frontend**: React + TypeScript
- **UI**: Tailwind CSS + Lucide Icons
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Usuário/Senha (simples)
- **Importação**: XLSX (Excel)
- **Exportação**: PDF + Excel

---

## 📌 Conclusão

O sistema implementa um **modelo baseado em Movimentações** onde:

✅ Um **Processo** (número) pode ter **múltiplas Movimentações**  
✅ Each **Movimentação** representa passagem por um setor  
✅ **Histórico** é a sequência cronológica de movimentações  
✅ **Localização Atual** = último movimento (mais recente)  
✅ **Fluxo** = percurso completo do processo pelo sistema  

Isso permite rastreamento completo, auditoria, e análise de quanto tempo cada processo leva em cada ponto.

