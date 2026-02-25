# 📊 Diagrama Visual: Fluxo de Processos

## 1. Arquitetura de Dados

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│ ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────┐  │
│ │   PROCESSES TABLE    │  │   USERS TABLE        │  │ LOGS      │  │
│ ├──────────────────────┤  ├──────────────────────┤  ├───────────┤  │
│ │ id (PK)              │  │ id                   │  │ id        │  │
│ │ number (INDEX) ◄──────────────────────────────►├─ action     │  │
│ │ entryDate            │  │ email                │  │ timestamp │  │
│ │ processDate          │  │ name                 │  │ userId    │  │
│ │ sector               │  │ role                 │  │ targetId  │  │
│ │ CGOF                 │  │ password_hash        │  │           │  │
│ │ interested           │  │ active               │  │           │  │
│ │ subject              │  │                      │  │           │  │
│ │ deadline             │  │                      │  │           │  │
│ │ urgent               │  │                      │  │           │  │
│ │ createdBy (FK)───────────► id                 │  │           │  │
│ │ updatedBy (FK)───────────► id                 │  │           │  │
│ │ process_link         │  │                      │  │           │  │
│ │ observations         │  │                      │  │           │  │
│ └──────────────────────┘  └──────────────────────┘  └───────────┘  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Fluxo de Dados na Aplicação

```
┌──────────────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO REACT                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  App.tsx                                                              │
│   └─► AppProvider (Context)                                          │
│        ├─ currentUser: User                                          │
│        ├─ processes: Process[] (lista atual)                         │
│        ├─ logs: Log[]                                                │
│        ├─ loading: boolean                                           │
│        └─ Funções:                                                   │
│            ├─ fetchProcesses(params)                                 │
│            ├─ fetchProcessHistory(number)                            │
│            ├─ saveProcess(process)                                   │
│            ├─ deleteProcess(id)                                      │
│            ├─ deleteLastMovement(number)                             │
│            └─ importProcesses(processes[])                           │
│                                                                        │
│  Pages:                                                               │
│  ├─ ProcessManager.tsx         ◄─── MAIN PAGE                        │
│  │   └─ Estados:                                                     │
│  │       ├─ editingProcess (modal de edição)                        │
│  │       ├─ selectedProcessHistory[] (timeline)                     │
│  │       ├─ isHistoryModalOpen (mostra histórico)                   │
│  │       ├─ filters (CGOF, sector, dates, etc)                      │
│  │       └─ pagination (page, itemsPerPage)                         │
│  │                                                                    │
│  ├─ Dashboard.tsx              ◄─── ESTATÍSTICAS                     │
│  │   └─ Calcula:                                                     │
│  │       ├─ total processess                                         │
│  │       ├─ urgent count                                             │
│  │       ├─ overdue count                                            │
│  │       ├─ near deadline count                                      │
│  │       └─ by-sector breakdown                                      │
│  │                                                                    │
│  ├─ UserManagement.tsx         ◄─── GESTÃO DE USUÁRIOS               │
│  ├─ Logs.tsx                   ◄─── AUDITORIA                        │
│  └─ Profile.tsx                ◄─── PERFIL DO USUÁRIO                │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

## 3. Ciclo de Vida de Um Processo (Fluxo Detalhado)

```
┌─────────────────────────────────────────────────────────────────────┐
│ CRIAÇÃO DE UM NOVO PROCESSO/MOVIMENTAÇÃO                            │
└─────────────────────────────────────────────────────────────────────┘

Evento: Usuário Clica "Novo Registro" ou "Novo Fluxo"
  │
  ├─► Modal Abre (EditingProcess = null, FormData = vazio)
  │    │
  │    └─► Carrega opções (combobox):
  │         ├─ Setores (DISTINCT sector)
  │         ├─ Interessadas (DISTINCT interested)  
  │         └─ Assuntos (DISTINCT subject)
  │
  ├─► Usuário Preenche Formulário:
  │    ├─ entryDate (obrigatório) *
  │    ├─ CGOF/Origem (obrigatório) *
  │    ├─ number (obrigatório) *
  │    ├─ sector (obrigatório) *
  │    ├─ interested (obrigatório) *
  │    ├─ subject (obrigatório) *
  │    ├─ processDate (opcional)
  │    ├─ deadline (opcional)
  │    ├─ urgent (checkbox)
  │    ├─ processLink (URL)
  │    └─ observations (texto)
  │
  ├─► Clica GRAVAR
  │    │
  │    └─► Se ENTRYDATE foi alterada em edição:
  │         ├─ Modal de Senha Aparece
  │         ├─ Verifica verifyPassword(userId, password)
  │         └─ Se OK → salva com auditoria
  │
  ├─► DbService.saveProcess(process, user)
  │    │
  │    ├─► SUPABASE: INSERT ou UPDATE
  │    │    │
  │    │    └─► Se INSERT → Novo ID é gerado (uuid)
  │    │    └─► Se UPDATE → Atualiza registro existente
  │    │
  │    └─► DbService.logAction('CREATE'/'UPDATE', description, user, processId)
  │         └─► INSERT em logs table
  │
  └─► UI Atualizada:
       ├─ Alerta "Cadastrado/Atualizado com sucesso!"
       ├─ Modal Fecha
       ├─ Lista Principal Recarrega (refreshCurrentList)
       └─ Se Histórico Aberto: historico atualizado (fetchProcessHistory)

```

## 4. Visualização do Histórico (Timeline)

```
┌─────────────────────────────────────────────────────────────────────┐
│ VER HISTÓRICO DO PROCESSO                                           │
└─────────────────────────────────────────────────────────────────────┘

Processo: 024.00025550/2023-59

fetchProcessHistory(number) 
  → SELECT * FROM processes WHERE number = '024.00025550/2023-59' 
     ORDER BY entryDate ASC
  → Retorna: Process[] (todos os movimentos)

┌─────────────────────────────────────────────────────────────────────┐
│ MODO: Histórico do Fluxo Modal                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Activity] Histórico do Fluxo                                       │
│  Número: 024.00025550/2023-59                                        │
│                           [+ Novo Fluxo] [🗑 Excluir] [×]           │
│                                                                       │
│  Timeline Vertical:                                                  │
│                                                                       │
│  ●─────────────────────────────────────────────────────────────     │
│  │ MOVIMENTAÇÃO (Entrada: 13/06/2023)                              │
│  │ Setor: Assessoria                                                │
│  │ Origem: Assessoria                                               │
│  │ Interessada: Deputado Estadual...                                │
│  │ Assunto: Solicitação de retomada...                              │
│  │                              [✎ Edit] [🗑 Delete]                │
│  │                                                                   │
│  ├─────────────────────────────────────────────────────────────     │
│  │ MOVIMENTAÇÃO (Entrada: 15/06/2023, Saída: 15/06/2023)           │
│  │ Setor: GS/RECEBIMENTO                                            │
│  │ Origem: Recebimento                                              │
│  │                              [✎ Edit] [🗑 Delete]                │
│  │                                                                   │
│  ├─────────────────────────────────────────────────────────────     │
│  ● LOCALIZAÇÃO ATUAL (Entrada: 20/07/2023)  ◄─── Ponto azul         │
│  │ Setor: SES-GS-ATG8                                               │
│  │ Origem: Assessoria                                               │
│  │ Status: EM PROCESSAMENTO                                         │
│  │                              [✎ Edit] [🗑 Delete]                │
│  │                                                                   │
│  └─────────────────────────────────────────────────────────────     │
│                                                                       │
│  [Fechar]                                                            │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

Logica de "Localização Atual":
getCurrentLocationId(history) → 
  1. Loop por todos os items
  2. Compara: item.processDate || item.entryDate
  3. Encontra o com data MAIS RECENTE
  4. Marca com ponto AZUL (blue-600)
  5. Label: "LOCALIZAÇÃO ATUAL"
  6. Todos os outros = "MOVIMENTAÇÃO"

```

## 5. Operações de Exclusão

```
┌─────────────────────────────────────────────────────────────────────┐
│ DELETAR UMA MOVIMENTAÇÃO ESPECÍFICA                                  │
└─────────────────────────────────────────────────────────────────────┘

Usuário Clica [🗑 Delete] em um movimento do histórico
  │
  ├─► Confirmação: "Tem certeza que deseja excluir?"
  │    │
  │    └─► OK → Abre Modal de Senha
  │         ├─ Valida: verifyPassword(userId, senha)
  │         └─ Se Inválido → Erro
  │
  ├─► DbService.deleteProcess(moveId, user)
  │    └─► DELETE FROM processes WHERE id = moveId
  │        └─► DbService.logAction('DELETE', description, user, moveId)
  │
  └─► Atualiza:
       ├─ fetchProcessHistory(number) - recarrega histórico
       ├─ setSelectedProcessHistory(updated)
       ├─ Se último movimento deletado → fecha modal
       └─ Alerta: "Movimentação excluída com sucesso!"

┌─────────────────────────────────────────────────────────────────────┐
│ DELETAR TODO O FLUXO (PROCESSO)                                      │
└─────────────────────────────────────────────────────────────────────┘

Usuário Clica [🗑 Excluir Fluxo] no cabeçalho do Modal
  │
  ├─► Confirmação: "Deseja excluir este fluxo completamente?"
  │    └─► OK → Abre Modal de Senha
  │
  ├─► DbService.deleteProcesses([...allMovementIds], user)
  │    └─► DELETE FROM processes WHERE id IN (...)
  │        └─► DbService.logAction('DELETE', '... fluxos excluídos', user)
  │
  └─► Atualiza:
       ├─ Modal de Histórico Fechada
       ├─ Lista Principal Recarregada
       └─ Alerta: "Fluxo excluído com sucesso!"

```

## 6. Fluxo de Filtros e Busca

```
┌─────────────────────────────────────────────────────────────────────┐
│ FILTRAR PROCESSOS NA LISTA PRINCIPAL                                │
└─────────────────────────────────────────────────────────────────────┘

Usuário Interage com Filtros:

┌─────────────────────────────┐
│ Search Bar                  │
│ [Digite número/interessada] │ → searchTerm
└─────────────────────────────┘
       │
       └─► DbService.getProcesses({
           searchTerm: 'xyz',
           filters: {...}
         })
           → query.or(`number.ilike, interested.ilike, subject.ilike`)

┌─────────────────────────────┐
│ Filtros Avançados           │
│ [CGOF dropdown]             │ → filters.CGOF
│ [Setor dropdown]            │ → filters.sector
│ [Data de Entrada: de/até]   │ → filters.entryDateStart/End
│ [[ ] Urgente]               │ → filters.urgent
│ [[ ] Atrasados]             │ → filters.overdue
│ [[ ] Sem Setor]             │ → filters.emptySector
│ [[ ] Sem Saída]             │ → filters.emptyExitDate
│ [Mais Recentes ▼]           │ → sortBy: {field, order}
│                             │
│            [🔍 Buscar]      │
└─────────────────────────────┘
       │
       └─► DbService.getProcesses({
           page: 1,
           itemsPerPage: 20,
           filters: {
             CGOF: 'Assessoria',
             sector: 'GS/RECEBIMENTO',
             entryDateStart: '2023-01-01',
             entryDateEnd: '2023-12-31',
             urgent: true,
             overdue: false,
             emptySector: false,
             emptyExitDate: false
           },
           sortBy: { field: 'entryDate', order: 'desc' }
         })
       
       Resultado:
       └─► processes: Process[] (20 itens)
           totalProcessesCount: number (total sem paginação)

```

## 7. Importação em Massa (Excel)

```
┌─────────────────────────────────────────────────────────────────────┐
│ IMPORTAR PROCESSOS DE ARQUIVO EXCEL                                 │
└─────────────────────────────────────────────────────────────────────┘

Usuário Clica [Upload] → Seleciona arquivo .xlsx
  │
  ├─► FileReader.readAsArrayBuffer(file)
  │    │
  │    └─► XLSX.read(bstr, {type: 'binary'})
  │         └─► ws_to_json(worksheet)
  │
  ├─► Parser:
  │    Mapeia Colunas Excel → Process Fields
  │    ├─ Coluna A: Data de Entrada
  │    ├─ Coluna B: Número do Processo
  │    ├─ Coluna C: Interessada
  │    ├─ Coluna D: Assunto
  │    ├─ Coluna E: Setor/CGOF
  │    └─ Coluna F: Data de Saída
  │         │
  │         └─► Gera: Process[] com:
  │              ├─ id: crypto.randomUUID()
  │              ├─ createdAt: now()
  │              ├─ updatedAt: now()
  │              └─ createdBy: 'system' (ou user.id)
  │
  ├─► DbService.importProcesses(processes[], user)
  │    │
  │    └─► BATCH INSERT (100 registros por vez)
  │         FOR i = 0 to length STEP 100:
  │           INSERT INTO processes (chunk[i:i+100])
  │         │
  │         └─► DbService.logAction(
  │              'CREATE', 
  │              'Importação em massa: 1000 processos',
  │              user
  │             )
  │
  └─► UI:
       ├─ Progress bar
       ├─ Contador: "Importando 1000/1000..."
       ├─ Alerta: "Importação concluída!"
       └─ Lista Recarregada

```

## 8. Estatísticas do Dashboard

```
┌─────────────────────────────────────────────────────────────────────┐
│ DASHBOARD - Cálculo de Estatísticas                                 │
└─────────────────────────────────────────────────────────────────────┘

getAllProcessesForDashboard() 
  → SELECT * FROM processes LIMIT 30000

Calcula (via useMemo):

┌──────────────────────────────────────────────────────────┐
│ TOTAL PROCESSES                                          │
│ data.length                                              │
│ Resultado: 1,247                                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ URGENT (URGENTES)                                        │
│ data.filter(p => p.urgent).length                        │
│ Resultado: 34                                            │
│ Ícone: [🚩 Urgente] Vermelho                             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ OVERDUE (ATRASADOS)                                      │
│ data.filter(p =>                                         │
│   p.deadline &&                                          │
│   p.processDate === null &&  // Ainda está no sistema   │
│   new Date(p.deadline) < today                           │
│ ).length                                                 │
│ Resultado: 12                                            │
│ Ícone: [⏰ Atrasado] Vermelho                             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ NEAR DEADLINE (PRÓXIMO A VENCER)                         │
│ data.filter(p =>                                         │
│   p.deadline &&                                          │
│   p.processDate === null &&                              │
│   new Date(p.deadline) <= today + 7 days                 │
│ ).length                                                 │
│ Resultado: 45                                            │
│ Ícone: [⚠️ Próximo] Amarelo                              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ BY SECTOR (Agrupado por Setor)                           │
│ data.reduce((acc, p) => {                                │
│   const sector = p.sector || 'Não Informado'             │
│   acc[sector] = (acc[sector] || 0) + 1                   │
│   return acc                                             │
│ })                                                       │
│                                                          │
│ Resultado: [                                             │
│   { name: 'GS/RECEBIMENTO', value: 450 },                │
│   { name: 'Assessoria', value: 380 },                    │
│   { name: 'SES-GS-ATG8', value: 250 },                   │
│   ...                                                    │
│ ]                                                        │
│ Gráfico: Bar chart ou Pie chart                          │
└──────────────────────────────────────────────────────────┘

Renderiza Cards:
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ 1,247    │  │ 34       │  │ 12       │  │ 45       │
│ TOTAL    │  │ URGENTES │  │ ATRASADOS│  │ PRÓXIMOS │ 
│ Processos│  │          │  │          │  │ A VENCER │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

+ Gráfico de Distribuição por Setor

```

## 9. Logs & Auditoria

```
┌─────────────────────────────────────────────────────────────────────┐
│ SISTEMA DE LOGS - AUDITORIA COMPLETA                               │
└─────────────────────────────────────────────────────────────────────┘

Cada ação importante generates Log:

┌────────────────┬──────────────────────────────────────────────────┐
│ CREATE         │ Novo processo/movimento criado                    │
│ UPDATE         │ Processo/movimento atualizado                     │
│ DELETE         │ Processo/movimento deletado                       │
│ LOGIN          │ Usuário fez login                                 │
│ LOGOUT         │ Usuário fez logout                                │
│ USER_MGMT      │ Usuário criado/deletado/atualizado                │
└────────────────┴──────────────────────────────────────────────────┘

Exemplo de Histórico de Um Processo:

┌──────────────────────────────────────────────────────────┐
│ Ação        │ User       │ Timestamp           │ Mudança │
├──────────────────────────────────────────────────────────┤
│ CREATE      │ Ana Silva  │ 2023-06-13 10:22:01 │ Novo    │
│ UPDATE      │ Carlos Jr  │ 2023-06-15 14:30:15 │ Saída   │
│ UPDATE      │ Ana Silva  │ 2023-07-20 09:12:44 │ Entrada │
│ UPDATE      │ Manager    │ 2023-08-01 16:45:23 │ Urgente │
│ DELETE      │ Manager    │ 2023-08-10 11:30:00 │ Removido│
└──────────────────────────────────────────────────────────┘

Aba "Logs" mostra últimos 500 registros:
├─ Com filtros por:
│  ├─ Ação
│  ├─ Usuário
│  ├─ Data/Hora
│  └─ Processo (targetId)
│
└─ Exportar para CSV/PDF

```

## 10. Segurança & Permissões

```
┌─────────────────────────────────────────────────────────────────────┐
│ MODELO DE ACESSO                                                    │
└─────────────────────────────────────────────────────────────────────┘

Roles:
├─ ADMIN
│   └─ Pode: CRUD processos, CRUD usuários, ver logs, importar
│
└─ USER
    └─ Pode: CRUD processos, ver logs (próprios)

Autenticação:
├─ Login via email + senha
├─ Sessão armazenada em localStorage
│   key: 'procontrol_session_id' → user.id
└─ Senha requisitada para alterações críticas:
    ├─ Alterar data de entrada (auditoria)
    └─ Deletar movimentação ou fluxo

Rastreamento:
├─ createdBy: user.id (quem criou)
├─ updatedBy: user.id (quem modificou)
└─ Logs: Cada ação registra userId + userName

```

---

Esse diagrama mostra a arquitetura completa do sistema de fluxos de processos!

