# MercadON — Modelagem de domínio

## Identificadores e datas

Entidades persistidas usam UUID v4, independentes do SQLite. `createdAt` e `updatedAt` são timestamps ISO 8601 em UTC.

`Purchase` possui dois estados:

- `DRAFT`: compra em andamento, com `purchasedAt = null`;
- `COMPLETED`: compra concluída, com `purchasedAt` preenchido e corrigível pelo usuário.

## Entidades e relações

- `Market 1:N Purchase`; toda compra possui `marketId` obrigatório.
- `Purchase 1:N PurchaseItem`.
- `Product 1:N PurchaseItem`.
- `Category 1:N Product`; categoria é opcional.

## Produtos

Todo produto possui `commercializationType`:

- `FIXED`: comprado por unidades comerciais inteiras. Pode possuir conteúdo de embalagem (`packageQuantityMilli` + `packageUnit`), informado em conjunto, ou ambos nulos;
- `VARIABLE`: comprado pela medida determinada durante a compra. `packageUnit` é obrigatória e `packageQuantityMilli` é nula.

Nome é obrigatório; marca e categoria são opcionais. A identidade considera nome, marca, forma de comercialização, quantidade e unidade aplicáveis. Exclusão é lógica.

Quando um produto estiver presente em compra concluída, forma de comercialização e medidas estruturais não podem ser alteradas. Nome, marca e categoria permanecem editáveis. Mudança estrutural deve criar outro produto, preservando o original.

## Compras e itens

Existe no máximo uma compra `DRAFT`. Ela é persistida ao confirmar a preparação e após cada alteração de mercado ou item. Sair da tela não descarta o rascunho.

Produtos `FIXED` registram quantidade inteira de unidades comerciais e preço por unidade comercial. Produtos `VARIABLE` registram quantidade efetivamente adquirida na unidade cadastrada e preço total pago.

Montantes pagos são preservados como inteiros em centavos. Quantidades usam milésimos da unidade (`2 un = 2000`, `1,275 kg = 1275`). `PurchaseItem` preserva `totalPriceCents` em todos os casos; itens fixos também guardam `unitPriceCents`, enquanto itens variáveis normalizam o total pela quantidade somente para comparação e apresentação.

## Histórico e comparação

O histórico é derivado de compras `COMPLETED`; não existe tabela global de preço no MVP.

- `FIXED`: comparar preço por unidade comercial.
- `VARIABLE`: comparar preço normalizado na unidade cadastrada.
- referência: ocorrência mais recente do mesmo produto em compra concluída, ordenada por `purchasedAt`;
- rascunhos e totais de linhas com quantidades diferentes não são bases comparáveis.

Alterações cadastrais não reescrevem quantidade, unidade ou valores de itens históricos. A exclusão de produto ou mercado não pode apagar compras concluídas.

Compras concluídas permitem corrigir mercado, data, quantidade e preço, além de adicionar e remover itens. O último item não pode ser removido isoladamente; para apagar todo o conteúdo, a compra deve ser excluída definitivamente.

## Busca e filtros

A listagem de Produtos combina busca textual com seleção de uma ou mais categorias. O filtro visual é genérico, recebe grupos e opções por propriedades e não conhece tipos do domínio de Produto.

## Arquitetura

Modelos de domínio não dependem de SQLite ou HTTP. Repositories convertem persistência em domínio; services aplicam validações e regras; hooks conectam serviços às telas do Expo Router.

As regras completas e pendências vigentes estão em [`docs/regras-de-negocio`](../../docs/regras-de-negocio/README.md).
