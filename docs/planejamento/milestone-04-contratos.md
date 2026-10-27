# Milestone 4 — Contratos analíticos

> **Status:** aprovado pelo Product Owner em 27/10/2026 · **Elaboração:** 27/10/2026  
> Este documento define o contrato consumido pelas Tasks 2–9 da Milestone 4.

## 1. Fontes válidas

Todas as análises consideram somente:

- compras com `status = COMPLETED`;
- compras com `deletedAt = null`;
- itens com `deletedAt = null`.

Compras `DRAFT`, compras excluídas e itens excluídos não participam de totais, rankings, séries ou referências de preço.

## 2. Data civil da compra

`purchasedAt` representa a **data civil em que a compra ocorreu**, não um instante no tempo.

Contrato aprovado:

- formato persistido: `YYYY-MM-DD`;
- a conclusão automática captura ano, mês e dia no fuso local do aparelho;
- a edição `DD/MM/AAAA` converte diretamente para `YYYY-MM-DD`;
- apresentação e agrupamento não aplicam conversão de fuso;
- `createdAt` e `updatedAt` continuam como timestamps UTC;
- empates no mesmo dia usam `createdAt` e `id`.

Registros legados em ISO date-time devem ser normalizados preservando os dez primeiros caracteres, que correspondem à data atualmente apresentada pela aplicação:

```text
2026-10-20T12:00:00.000Z → 2026-10-20
```

Essa normalização não tenta reconstruir um fuso histórico que nunca foi persistido.

## 3. Períodos mensais

O mês é identificado por `YYYY-MM`. Consultas usam intervalos semiabertos:

```text
startDate <= purchasedAt < endExclusive
```

### Mês atual

- período atual: primeiro dia do mês até a data civil de hoje, inclusive;
- comparação: primeiro dia do mês anterior até o mesmo número de dia;
- se esse dia não existir no mês anterior, usar o último dia disponível.

Exemplos:

```text
01–26/outubro × 01–26/setembro
01–31/março × 01–28/fevereiro
```

### Mês encerrado

Um mês anterior selecionado é comparado com o mês imediatamente anterior, ambos completos.

### Evolução da Home

A série contém os seis meses de calendário mais recentes, incluindo o atual. Os cinco meses encerrados usam o mês completo; o mês atual permanece parcial até a data civil de hoje.

Meses sem compras aparecem com total zero para manter a continuidade temporal da série.

## 4. Gastos e agregações

- Todo montante é somado como inteiro em centavos.
- A métrica principal é `SUM(PurchaseItem.totalPriceCents)`.
- Produtos são agregados exclusivamente por `productId`.
- Produtos diferentes no catálogo nunca são consolidados apenas por nome, marca ou embalagem.
- Quantidade, peso, volume e frequência não ordenam gastos entre produtos distintos.

### Categoria atual

A categoria usada em qualquer período é `Product.categoryId` no momento da consulta:

- recategorizar um produto reclassifica também seus gastos anteriores;
- produto com `categoryId = null` pertence a **Sem categoria**;
- arquivar uma categoria remove a associação atual conforme a regra existente e, portanto, reclassifica os gastos afetados para **Sem categoria**;
- não existe snapshot textual de categoria em `PurchaseItem`.

A soma de todas as categorias, incluindo **Sem categoria**, deve ser idêntica ao total do período.

## 5. Preço comparável

### Produto `FIXED`

O preço comparável é `unitPriceCents`, em centavos por unidade comercial. Quantidade ou unidade declarada da embalagem não converte automaticamente o valor para kg ou L.

### Produto `VARIABLE`

O preço comparável é uma razão exata entre `totalPriceCents` e `quantityMilli`, convertida para a unidade física base:

| Unidade registrada | Unidade analítica | Razão em centavos                   |
| ------------------ | ----------------- | ----------------------------------- |
| `KG`               | kg                | `total × 1.000 / quantityMilli`     |
| `G`                | kg                | `total × 1.000.000 / quantityMilli` |
| `L`                | L                 | `total × 1.000 / quantityMilli`     |
| `ML`               | L                 | `total × 1.000.000 / quantityMilli` |
| `UNIT`             | un                | `total × 1.000 / quantityMilli`     |

As multiplicações e comparações usam inteiros/`BigInt`. A razão não precisa ser persistida nem arredondada para ser comparada.

Para apresentação, arredondar uma única vez para centavos por unidade analítica usando `half-up`.

### Compatibilidade histórica

A configuração atual do produto define a série comparável:

- produto atual `FIXED`: somente snapshots `FIXED`;
- produto atual `VARIABLE / G` ou `VARIABLE / KG`: snapshots variáveis da família de massa;
- produto atual `VARIABLE / ML` ou `VARIABLE / L`: snapshots variáveis da família de volume;
- produto atual `VARIABLE / UNIT`: somente snapshots `VARIABLE / UNIT`.

Ocorrências incompatíveis continuam como fatos da compra, mas não participam de preço atual, mínimo, máximo, gráfico, alta ou queda.

## 6. Diferenças e percentuais

Quando a base anterior é maior que zero:

```text
differenceCents = currentCents - previousCents
percentage = differenceCents / previousCents × 100
```

O percentual exibido usa uma casa decimal e arredondamento `half-up`. O cálculo intermediário usa razão inteira, sem persistir valores monetários fracionários.

### Total anterior igual a zero

| Anterior | Atual | Resultado                                                                        |
| -------- | ----- | -------------------------------------------------------------------------------- |
| `0`      | `0`   | percentual indisponível; estado “Nenhum gasto nos dois períodos”                 |
| `0`      | `> 0` | percentual indisponível; mostrar diferença monetária e “Mês anterior sem gastos” |
| `> 0`    | `0`   | queda válida de `100%`                                                           |

Nunca exibir infinito nem interpretar o primeiro gasto como alta de `100%`.

### Preço anterior igual a zero

| Anterior | Atual | Resultado                                                 |
| -------- | ----- | --------------------------------------------------------- |
| `0`      | `0`   | sem variação; não entra nos rankings                      |
| `0`      | `> 0` | sem base percentual; não entra nos rankings de alta/queda |
| `> 0`    | `0`   | queda válida de `100%`                                    |

Todas as ocorrências continuam disponíveis no histórico factual. Quando não houver base percentual, a interface pode mostrar a diferença monetária e o texto **Sem base percentual**.

## 7. Seleção das ocorrências de preço

Para cada produto:

- ordenar ocorrências comparáveis por `purchasedAt DESC`, `createdAt DESC` e `id DESC`;
- preço atual: primeira ocorrência comparável;
- preço anterior: segunda ocorrência comparável;
- mínimo e máximo: todas as ocorrências comparáveis;
- evolução: mesmas ocorrências em ordem cronológica crescente.

Para entrar no ranking de variações de um mês:

- devem existir ao menos duas ocorrências comparáveis;
- a ocorrência mais recente deve pertencer ao mês selecionado;
- a ocorrência anterior pode pertencer a qualquer mês anterior;
- o preço anterior normalizado deve ser maior que zero para existir percentual.

## 8. Ordenação e desempates

- categorias: gasto decrescente, nome crescente, ID crescente;
- produtos por gasto: gasto decrescente, nome crescente, ID crescente;
- altas: percentual decrescente, nome crescente, ID crescente;
- quedas: percentual crescente, nome crescente, ID crescente;
- histórico cronológico: `purchasedAt ASC`, `createdAt ASC`, `id ASC`.

Os IDs garantem resultado determinístico mesmo quando nomes e valores empatam.

## 9. Estados mínimos de apresentação

- Sem compras no período: estado vazio, sem indicadores zerados usados como preenchimento.
- Uma ocorrência de preço: atual, mínimo e máximo podem coincidir; não existe tendência.
- Duas ou mais ocorrências compatíveis: evolução e comparação habilitadas.
- Percentual indisponível: sempre acompanhado por explicação textual.
- Gráficos: sempre acompanhados por resumo ou lista textual com os mesmos valores essenciais.

## 10. Decisões aprovadas

- **DEC-M4-001 — Data civil:** `purchasedAt` passa a ser `YYYY-MM-DD`, capturado no calendário local e independente de fuso após persistência.
- **DEC-M4-002 — Mês anterior curto:** limitar o término ao último dia disponível.
- **DEC-M4-003 — Total anterior zero:** percentual indisponível; usar diferença monetária e estado textual.
- **DEC-M4-004 — Preço anterior zero:** não integrar rankings percentuais; manter no histórico factual.
- **DEC-M4-005 — Categoria histórica:** toda análise usa a categoria atual do produto.
- **DEC-M4-006 — Mercado histórico:** toda compra possui mercado; não existe estado **Sem mercado**.

## 11. Consequências para a implementação

- criar tipo de data civil separado de timestamps;
- normalizar `purchasedAt` legado antes das consultas analíticas;
- adaptar conclusão, edição, apresentação e testes de compras para `YYYY-MM-DD`;
- centralizar períodos, razões, arredondamentos e estados de base zero;
- não persistir percentuais ou preços normalizados derivados;
- não duplicar cálculos nas telas ou nos componentes de gráfico.
