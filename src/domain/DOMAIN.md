# MercadON — Modelagem de Domínio

## Identificadores

Todas as entidades persistidas possuem identificadores UUID v4.

Os identificadores são independentes do SQLite e poderão
ser utilizados futuramente na sincronização com um backend.

## Entidades

- Market: estabelecimento comercial.
- Category: classificação de produtos.
- Product: cadastro de produto.
- Purchase: compra em andamento ou finalizada.
- PurchaseItem: item registrado em uma compra.

## Relacionamentos

- Market 1:N Purchase.
- Purchase 1:N PurchaseItem.
- Product 1:N PurchaseItem.
- Category 1:N Product (associação opcional).

## Cadastro rápido

Mercados e produtos poderão ser cadastrados somente com nome.

Identificadores e timestamps serão preenchidos pela aplicação.

Dados complementares dos produtos poderão ser nulos.

## Valores monetários

Valores monetários serão armazenados como inteiros em centavos.

O preço de uma compra pertence ao PurchaseItem.

O histórico de preços será reconstruído a partir dos itens
registrados, sem tabela específica de histórico inicialmente.

## Quantidades

As quantidades serão armazenadas em milésimos da unidade.

Exemplos:
- 2 UNIT = 2000
- 0,750 KG = 750
- 1,500 L = 1500

UNIT não permite quantidades fracionárias.

O preço unitário é referente a uma unidade inteira
da medida registrada em PurchaseItem.quantityUnit.

Os cálculos monetários deverão utilizar uma política consistente
de arredondamento para centavos.

## Datas

createdAt e updatedAt serão timestamps ISO 8601 em UTC.

DRAFT: purchasedAt é null.
COMPLETED: purchasedAt contém a data/hora de finalização.

O usuário poderá corrigir purchasedAt posteriormente.

## Histórico

O histórico utilizará os dados atuais do cadastro para
exibir nomes de mercados e produtos.

Alterações nos nomes serão refletidas nas consultas históricas.

Valores, quantidades e unidades registrados nos itens
não serão alterados por modificações cadastrais.

Alterações que transformem um produto em outro produto
devem resultar em um novo cadastro.

A exclusão de cadastros referenciados por compras históricas
não poderá eliminar acidentalmente o histórico.

## Persistência

Os modelos de domínio não dependem de SQLite ou HTTP.

Os repositories serão responsáveis pela conversão
entre representações de persistência e modelos de domínio.

A criação de tabelas e migrations será realizada
em uma task posterior.