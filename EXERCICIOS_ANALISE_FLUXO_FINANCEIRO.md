# Reforma do GPC: Análise/Fluxo/Financeiro por Exercício

## Contexto e Motivação

Antes desta mudança, cada registro (`cgof_gpc_recebidos`) tinha **uma única** trilha de
Posição/Movimento/Análise/Situação/Correção/Fluxo, compartilhada por todos os exercícios
financeiros (`cgof_gpc_exercicio`) cadastrados nele. Isso não fazia sentido: cada exercício
(ano) é, na prática, um novo ciclo de análise — precisa da sua própria posição, seu próprio
fluxo de tramitação e seu próprio julgamento, sem se misturar com o exercício anterior.

Esta reforma criou uma trilha de Análise/Situação/Correção/Fluxo **por (registro × exercício)**
e consolidou todo o trabalho num único lugar: a aba **Exercícios**.

## Modelo de dados novo

### `cgof_gpc_registro_exercicio` (tabela nova — `sql_parts/parte_47_analise_fluxo_por_exercicio.sql`)
Um estado de análise por par (registro, exercício): `posicao_id`, `movimento`,
`responsaveis_analise`, `num_paginas`, `situacao`, `irregular_tipos`, `irregular_debito`,
`valor_multa`, `ressarcimento_status`, `cobranca_estagio`, `situacao_obs`, `valor_a_devolver`,
`valor_devolvido`, `correcao_paginas`, `correcao_obs`. `UNIQUE (registro_id, exercicio_id)`.

### `cgof_gpc_fluxo_tecnico` ganhou `exercicio_id` (mesma migration)
Cada evento do fluxo passa a poder pertencer a um exercício específico. Linhas antigas ficam
com `exercicio_id NULL` (fluxo "geral" do registro, sem quebra de compatibilidade).

### Hierarquia de julgamento (`sql_parts/parte_46_julgamento_irregular.sql`)
Quando `situacao = 'IRREGULAR'`: `irregular_debito` (`SEM_DEBITO` → `valor_multa` /
`COM_DEBITO` → `ressarcimento_status` → se `NAO_RECOLHIDO`, `cobranca_estagio`
`COBRANCA`/`DIVIDA_ATIVA`/`EXECUCAO_FISCAL`). A tag solta "Dívida Ativa" saiu do multi-select
de `irregular_tipos` (que ficou só com `CONTENCIOSO`/`CADIN`) e virou esse estágio.

### `data_recebimento` em `cgof_gpc_exercicio` (`sql_parts/parte_45_exercicio_data_recebimento.sql`)
Data de recebimento por exercício financeiro (o primeiro exercício herda a data de
recebimento do próprio registro quando não preenchida).

**As três migrations (`parte_45`, `parte_46`, `parte_47`) já foram executadas em produção.**

## Bug crítico de produtividade — encontrado e corrigido

O relatório de Produtividade (`GpcService.getProdutividadeDetalhado`) e a Linha do Tempo do
processo **não leem** eventos `POSICAO`/`MOVIMENTO`/`CORRECAO` da tabela
`cgof_gpc_produtividade` — só contam esses três a partir de `cgof_gpc_fluxo_tecnico`
(inferindo o tipo pelo texto de `movimento`/`acao`). Isso já era assim antes desta reforma
(era assim no fluxo antigo do registro também), mas a implementação inicial da aba Exercícios
gravava esses eventos em `cgof_gpc_produtividade` — ou seja, não contavam em lugar nenhum.

**Corrigido** (`ExercicioAnaliseTab.submit`, `pages/GpcProcessos_v2.tsx`): posição/movimento
mudados geram um evento em `cgof_gpc_fluxo_tecnico` (só o campo que realmente mudou, para não
ser classificado errado como MOVIMENTO quando só a posição avançou); correção documental já
gravava fluxo corretamente. "Início de Análise" continua automático via trigger do banco
(`fn_log_analistas_produtividade`, dispara quando `responsaveis_analise` muda em
`cgof_gpc_recebidos` — ver `sql_parts/parte_21_responsavel_multi_analise.sql`).

## Bug crítico de sobrescrita — encontrado e corrigido

`GpcService.saveRecebido` (usado ao salvar a aba Identificação) reescrevia **todos** os campos
do registro a partir do `form` local a cada save — incluindo posição/movimento/situação/análise,
que passaram a ser "donos" da aba Exercícios. Como `form` só é carregado quando o modal abre,
salvar a Identificação depois de editar um exercício apagava silenciosamente o que a aba
Exercícios tinha acabado de gravar.

**Corrigido**: esses campos só entram no payload de `saveRecebido` no cadastro inicial do
registro (estado de partida, antes de existir qualquer exercício); num update, ficam
intocados. Também foi adicionado um refresh (`refreshLiveRecord`) que recarrega o registro do
banco depois de cada salvamento na aba Exercícios, para o resumo "Situação Atual" da
Identificação não ficar desatualizado dentro da mesma sessão do modal.

## Estrutura final de abas (`RegistroModal`)

`Identificação | Exercícios | (Parcelamento, se aplicável)`

- **Identificação**: cadastro estático do processo (número, convênio, entidade, DRS, link,
  responsável, data de recebimento) + resumo somente-leitura da posição/movimento atual +
  "Responsável pela Assinatura".
- **Exercícios** (o único lugar de trabalho): seletor de exercício + botão "Novo Exercício" →
  Dados Financeiros (com edição inline) → Análise (posição/movimento/responsáveis/páginas) →
  Situação do Processo (julgamento) → Correção Documental → Fluxo Técnico deste exercício →
  Objetos → Parcelamento/Reparcelamento → Termos Aditivos. Totais agregados (Repasse/Aplicação/
  Convênio) aparecem quando há mais de um exercício.

## O que foi removido

- Abas **Análise** e **Fluxo** do registro (conteúdo movido para dentro de Exercícios, por
  exercício selecionado).
- Aba **Financeiro** (Objetos/Parcelamento-preview/Termos Aditivos migraram para dentro da
  aba Exercícios; a tabela de exercícios com totais virou o card "Dados Financeiros" +
  totais agregados).
- Botão **"Novo Exercício"** da tela de Detalhes (que na verdade criava um registro/ciclo
  novo e completo para o mesmo processo, sem nenhuma relação com exercícios financeiros —
  função removida por decisão do usuário, sem uso identificado). O bloco "Outros Ciclos deste
  Processo" (visualização de registros-irmãos já existentes) continua intacto.

## Exclusão de exercício cadastrado errado

O card "Dados Financeiros" da aba Exercícios ganhou um botão **Excluir** ao lado de "Editar".
Como um exercício pode já ter Análise/Situação/Fluxo salvos nele, a exclusão só funcionava
antes se o exercício estivesse "vazio" — com dados vinculados, `GpcService.deleteExercicio`
falhava com erro de chave estrangeira. `sql_parts/parte_48_exercicio_delete_cascade.sql`
adiciona `ON DELETE CASCADE` nas FKs de `cgof_gpc_registro_exercicio.exercicio_id` e
`cgof_gpc_fluxo_tecnico.exercicio_id` (não mexe na FK de `cgof_gpc_historico`, tabela legada
só-leitura — se um exercício antigo tiver histórico migrado do Access vinculado, a exclusão
continua bloqueada de propósito). O aviso de confirmação avisa quando há Análise/Fluxo que
também serão apagados junto.

## Principais arquivos modificados

- `pages/GpcProcessos_v2.tsx` — `ExercicioAnaliseTab` (componente novo), `RegistroModal`
  (barra de abas, Identificação, sub-modal de exercício), `ViewModal` (remoção do botão),
  `FluxoTecnicoPanel`/`FluxoTecnicoFormInline` (suporte a `exercicioId`),
  `AssinaturaResponsavelSection` (extraído do `FluxoTecnicoPanel`).
- `services/gpcService.ts` — `getRegistroExercicios`, `saveRegistroExercicio`,
  `syncRecebidoCache`, `saveRecebido` (payload corrigido), `getFluxoTecnico`/
  `saveFluxoTecnico` (suporte a `exercicio_id`).
- `types.ts` — `GpcRegistroExercicio`, `GpcFluxoTecnico.exercicio_id`.
- `pages/GpcRelatorios.tsx` — colunas de julgamento (Débito/Desfecho/Valor da Multa) nas
  exportações.

## Verificação feita

- `npx tsc --noEmit -p .` limpo em todas as etapas.
- Testado ao vivo (Playwright + Chromium headless, login via sessão injetada, processo real
  024.00127847/2025-10): navegação completa, abas corretas, seções da Exercícios renderizando
  juntas, botão "Novo Ciclo" ausente, zero erros no console.

## Status

**Concluído.** 14/08/2026.
