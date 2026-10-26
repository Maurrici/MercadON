# Milestone 3 — Contratos de compras e preços

> **Status:** aprovado pelo Product Owner em 23/10/2026 · **Elaboração:** 23/10/2026  
> Este documento define o contrato consumido pelas Tasks 2–10.

## 1. Premissas confirmadas

- Toda compra possui `marketId` obrigatório.
- Existe no máximo uma compra ativa com status `DRAFT`.
- Produto `FIXED` é comprado em unidades comerciais inteiras e recebe preço por unidade comercial.
- Produto `VARIABLE` recebe quantidade efetivamente adquirida na unidade cadastrada e preço total pago.
- Somente itens de compras `COMPLETED` participam da comparação histórica.
- Valores efetivamente pagos são persistidos em centavos inteiros.
- Quantidades são persistidas em milésimos da unidade.

## 2. Contrato de `Purchase`

| Campo         | Tipo                 | Regra                                                       |
| ------------- | -------------------- | ----------------------------------------------------------- |
| `id`          | UUID                 | Gerado pela aplicação.                                      |
| `marketId`    | UUID                 | Obrigatório; referencia mercado existente.                  |
| `status`      | `DRAFT \| COMPLETED` | Apenas uma compra ativa pode ser `DRAFT`.                   |
| `purchasedAt` | ISO 8601 ou `null`   | `null` em `DRAFT`; obrigatório e corrigível em `COMPLETED`. |
| `createdAt`   | ISO 8601             | Define criação do registro.                                 |
| `updatedAt`   | ISO 8601             | Atualizado após qualquer alteração confirmada.              |
| `deletedAt`   | ISO 8601 ou `null`   | Uso interno conforme estratégia de descarte/exclusão.       |

Invariantes:

- criar compra exige mercado ativo válido;
- confirmar preparação cria o `DRAFT`; cancelar não cria registro;
- índice único parcial deve impedir dois registros ativos com `status = 'DRAFT'`;
- finalização exige ao menos um item ativo e altera status/data atomicamente;
- total não é armazenado em `Purchase`: é sempre derivado da soma de `PurchaseItem.totalPriceCents` ativos.

## 3. Contrato de `PurchaseItem`

| Campo                   | Tipo                           | Regra                                                                                    |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------------------------- |
| `id`                    | UUID                           | Gerado pela aplicação.                                                                   |
| `purchaseId`            | UUID                           | Compra proprietária.                                                                     |
| `productId`             | UUID                           | Produto selecionado.                                                                     |
| `commercializationType` | `FIXED \| VARIABLE`            | Snapshot estrutural no momento da inclusão.                                              |
| `quantityMilli`         | inteiro positivo               | Quantidade adquirida em milésimos.                                                       |
| `quantityUnit`          | `MeasurementUnit`              | `UNIT` para `FIXED`; unidade cadastrada do produto para `VARIABLE`.                      |
| `unitPriceCents`        | inteiro não negativo ou `null` | Obrigatório em `FIXED`; `null` em `VARIABLE`. É o preço informado por unidade comercial. |
| `totalPriceCents`       | inteiro não negativo           | Valor total efetivamente pago pela linha, obrigatório nos dois tipos.                    |
| `createdAt`             | ISO 8601                       | Também participa da ordem de inclusão.                                                   |
| `updatedAt`             | ISO 8601                       | Atualizado após edição confirmada.                                                       |
| `deletedAt`             | ISO 8601 ou `null`             | Item removido deixa de compor carrinho, total e histórico ativo.                         |

Invariantes:

- existe no máximo um item ativo para a combinação `purchaseId + productId`;
- `FIXED`: `quantityMilli` é múltiplo de `1000`, `quantityUnit = UNIT`, `unitPriceCents` não é nulo e `totalPriceCents = quantityMilli / 1000 × unitPriceCents`;
- `VARIABLE`: `quantityUnit` é a unidade registrada no produto, `unitPriceCents = null` e `totalPriceCents` é informado pelo usuário;
- o conteúdo de embalagem de um produto `FIXED` não altera `quantityMilli`, `quantityUnit` ou a base de comparação do item;
- o snapshot de comercialização/unidade evita reinterpretar silenciosamente uma linha já persistida.

## 4. Entrada e validação

### Produto `FIXED`

- quantidade inicial: `1` unidade comercial;
- aceitar somente inteiro positivo;
- preço informado: centavos por unidade comercial;
- subtotal calculado antes de persistir;
- permitir preço zero, pois descontos ou bonificações podem produzir item gratuito; a interface não deve confundir zero com campo vazio.

### Produto `VARIABLE`

- aceitar valor decimal positivo com até três casas, convertido uma única vez para milésimos;
- unidade não é escolhida durante a compra: vem do cadastro do produto;
- preço informado: total pago em centavos;
- permitir total zero com a mesma distinção entre zero e campo vazio.

Entradas acima dos limites seguros de inteiro do JavaScript devem ser rejeitadas antes da persistência. Valores monetários nunca usam `number` fracionário nem `REAL` no SQLite.

## 5. Cálculos financeiros

### Subtotal e total

Para `FIXED`:

```text
commercialUnits = quantityMilli / 1000
totalPriceCents = commercialUnits × unitPriceCents
```

Para `VARIABLE`, `totalPriceCents` é o montante digitado.

Total da compra:

```text
purchaseTotalCents = soma(totalPriceCents dos itens ativos)
```

### Preço comparável

Para `FIXED`, o preço comparável é `unitPriceCents`.

Para `VARIABLE`, a razão exata é:

```text
normalizedPrice = totalPriceCents × 1000 / quantityMilli
```

Essa razão representa centavos por uma unidade inteira da medida cadastrada. Ela é derivada dos valores originais; não é necessário persistir um valor arredondado.

### Precisão e arredondamento — decisão técnica

- Persistir apenas quantidade em milésimos e montantes reais em centavos.
- Calcular a razão com inteiros; usar `BigInt` nas multiplicações/comparações para evitar perda de precisão.
- Comparar duas ocorrências variáveis por multiplicação cruzada dos valores originais, sem ponto flutuante:

```text
currentTotalCents × previousQuantityMilli
versus
previousTotalCents × currentQuantityMilli
```

- Para exibição, converter uma única vez para centavos por unidade usando arredondamento comercial **half-up**.
- Para evitar indicar “mais caro/barato” com diferença visual `R$ 0,00`, o estado apresentado compara os preços normalizados já arredondados ao centavo. Valores que resultem no mesmo centavo exibido são `same_price`.
- Diferença monetária exibida: valor absoluto entre os dois preços normalizados em centavos.

## 6. Referência histórica

A ocorrência anterior deve:

- pertencer ao mesmo `productId`;
- estar ativa em compra `COMPLETED`;
- ignorar a compra/item atualmente editado quando aplicável;
- ignorar mercado;
- ser ordenada por `purchasedAt DESC`, depois `createdAt DESC` e finalmente `id DESC` para desempate determinístico.

Estados retornados pelo domínio:

- `cheaper`;
- `more_expensive`;
- `same_price`;
- `no_history`.

O serviço retorna também preço atual normalizado, preço anterior normalizado, diferença absoluta e unidade da comparação.

## 7. Exemplos de validação

### Café 500 g — `FIXED`

- quantidade comprada: `2 un` → `quantityMilli = 2000`, `quantityUnit = UNIT`;
- preço por pacote: `R$ 14,90` → `unitPriceCents = 1490`;
- total: `2 × 1490 = 2980` → `R$ 29,80`;
- base histórica: `R$ 14,90/un`, nunca `R$/g`.

### Detergente — `FIXED`

- quantidade: `3 un` → `quantityMilli = 3000`;
- preço unitário: `R$ 2,50` → `unitPriceCents = 250`;
- total: `R$ 7,50` → `totalPriceCents = 750`;
- base histórica: `R$ 2,50/un`.

### Carne — `VARIABLE`

- quantidade: `1,275 kg` → `quantityMilli = 1275`, `quantityUnit = KG`;
- total pago: `R$ 50,87` → `totalPriceCents = 5087`;
- `unitPriceCents = null`;
- normalização: `5087 × 1000 ÷ 1275 = 3990,196...` centavos/kg;
- exibição half-up: `R$ 39,90/kg`.

## 8. Decisões aprovadas pelo Product Owner

### DEC-001 — Produto presente em compra `DRAFT` — APROVADA

Bloquear alterações de forma de comercialização e medidas estruturais enquanto o produto estiver em qualquer item ativo de `DRAFT`, assim como ocorre com compra concluída. O usuário pode remover o item do rascunho e então alterar o produto, ou criar um novo produto.

Motivo: evita que o carrinho mostre um item com snapshot antigo enquanto o mesmo cadastro já representa outra estrutura. O snapshot permanece necessário para integridade, mas não deve servir para ocultar uma divergência durante o fluxo ativo.

### DEC-002 — Remoção do último item de compra concluída — APROVADA

Bloquear a remoção do último item na edição de uma compra concluída e orientar o usuário a excluir definitivamente a compra, usando a confirmação já prevista.

Motivo: preserva a regra de que compra concluída possui ao menos um item e evita um registro histórico sem valor ou significado.

### DEC-003 — Nomes no histórico — APROVADA

Continuar exibindo nome, marca e categoria atuais do cadastro, sem snapshot textual no item. Quantidades, unidade, tipo de comercialização e valores financeiros permanecem preservados no `PurchaseItem`.

Motivo: corresponde ao domínio já documentado, permite correções de escrita refletidas no histórico e evita duplicação textual. Produto e mercado usam exclusão lógica, portanto continuam disponíveis para consulta.

## 9. Consequências para a Task 2

Após aprovação:

- criar migration incremental para `purchases` e `purchase_items`;
- adicionar índice único parcial do único `DRAFT` ativo;
- adicionar índice único parcial de item ativo por `purchaseId + productId`;
- adicionar `commercialization_type` e `total_price_cents` a `purchase_items`;
- aplicar checks discriminados para `FIXED` e `VARIABLE`;
- atualizar modelos e contracts de repository;
- preservar `unit_price_cents` como preço exato de unidade comercial apenas para `FIXED`;
- não persistir preço variável normalizado arredondado.

## 10. Aprovação

`DEC-001`, `DEC-002` e `DEC-003` foram aprovadas pelo Product Owner em 23/10/2026. A Task 1 está concluída e este contrato está liberado como entrada da Task 2.
