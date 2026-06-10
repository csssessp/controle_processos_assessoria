# Correção: Cálculo do Total do Convênio em Registros Financeiros

## Problema Identificado
O campo "Total do Convênio" estava somando valores indevidos (Aplicação, Ex. Anterior, etc.), gerando resultados incorretos.

## Regra Corrigida
**TOTAL DO CONVÊNIO = SOMA(EXERCICIOS.REPASSE)**

Apenas os valores da coluna **"Repasse"** devem compor o Total do Convênio.

### O que NÃO deve ser incluído:
- ❌ Exercício Anterior
- ❌ Aplicação Financeira
- ❌ Gastos
- ❌ Devoluções
- ❌ Parcelamentos / Reparcelamentos
- ❌ Qualquer outro valor financeiro

## Exemplo Corrigido

```
Exercício 2022:  Repasse = R$ 400.000,00
Exercício 2023:  Repasse = R$ 0,00
Exercício 2024:  Repasse = R$ 0,00

Total do Convênio = R$ 400.000,00  ✅
```

## Arquivos Modificados

### 1. **services/gpcService.ts**

#### Mudança 1 (Linha 31): Correção do comentário de tipo
```typescript
// ANTES:
// total_convenio: number; // repasse + aplicacao

// DEPOIS:
// total_convenio: number; // SOMA(EXERCICIOS.REPASSE) - apenas repasse
```

#### Mudança 2 (Linha 813): Correção do cálculo
```typescript
// ANTES:
const total_convenio = repasse + aplicacao;

// DEPOIS:
const total_convenio = repasse; // CORRIGIDO: Total do Convênio = apenas REPASSE
```

**Observação:** O cálculo do `saldo` continua correto:
```typescript
const saldo = Math.round((exAnt + repasse + aplicacao - gastos - devolvido) * 100) / 100;
```

---

### 2. **pages/GpcProcessos_v2.tsx**

#### Mudança 1 (Linha 3004): Correção em resumo de exercícios (parte 1)
```typescript
// ANTES:
const tConv = tRep + tApl + tExAnt;

// DEPOIS:
const tConv = tRep; // CORRIGIDO: Total do Convênio = apenas REPASSE
```

#### Mudança 2 (Linha 4493): Correção em resumo de exercícios (parte 2)
```typescript
// ANTES:
const totalConvenio = totalRepasse + totalAplicacao + totalExAnt;

// DEPOIS:
const totalConvenio = totalRepasse; // CORRIGIDO: Total do Convênio = apenas REPASSE
```

#### Mudança 3 (Linha 5014): Ajuste de variável auxiliar
```typescript
// Comentário adicionado para clareza:
const total = exAnt + repasse + aplicacao; // Total DISPONÍVEL (para cálculo do saldo)
```

---

## Validações Implementadas

✅ **Exercícios sem repasse**: Não impactam o cálculo (contribuem com 0)  
✅ **Valores nulos**: Tratados como zero  
✅ **Atualização automática**: Indicador atualiza ao adicionar/editar/excluir exercícios  
✅ **Sem repasse cadastrado**: Exibe R$ 0,00  
✅ **Consistência**: Total Repasse = Total do Convênio (ambos mostram apenas soma de repasses)  

---

## Comportamento Esperado Após Correção

| Campo | Cálculo | Descrição |
|-------|---------|-----------|
| **Total Repasse** | SUM(repasse) | Soma de todos os repasses |
| **Total Aplicação** | SUM(aplicacao) | Soma de todas as aplicações |
| **Total Ex. Anterior** | SUM(exercicio_anterior) | Soma de exercícios anteriores |
| **Total do Convênio** | SUM(repasse) | **APENAS REPASSE** ✅ |
| **Total Disponível** | ex_ant + repasse + aplicacao | Para cálculo do saldo |
| **Saldo** | disponível - gastos - devolvido | Sempre mantém corretamente |

---

## Regras Adicionais Confirmadas

1. ✅ Exercícios sem repasse não impactam o cálculo
2. ✅ Valores nulos são tratados como zero
3. ✅ Indicador atualiza automaticamente ao alterar exercícios
4. ✅ Sem repasse = R$ 0,00
5. ✅ Total Repasse = Total do Convênio (mesmo valor)

---

## Observações Importantes

- ⚠️ As correções foram aplicadas no **frontend** (TypeScript/React)
- ⚠️ O backend Supabase também deve validar este cálculo se houver procedures/views
- ⚠️ Recomenda-se revisar se há views no banco de dados que calculem `total_convenio`
- ℹ️ O cálculo do **saldo** permanece inalterado (continua incluindo Ex. Anterior, Aplicação, Gastos e Devoluções)

---

## Data da Correção
**10 de Junho de 2026**

**Status**: ✅ Corrigido e validado
