# 08 — Pendências e divergências com o código

> **Importante:** este documento preserva as divergências encontradas durante o planejamento e registra como foram encerradas na implementação da Milestone 3.

## Alinhamentos já concluídos

| ID          | Situação resolvida                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **RES-001** | `Product` já possui `commercializationType` (`FIXED` ou `VARIABLE`) e validações específicas por tipo.                                      |
| **RES-002** | A identidade de produto e o índice único já incluem a forma de comercialização.                                                             |
| **RES-003** | Produtos existentes são migrados como `FIXED`, preservando IDs e referências.                                                               |
| **RES-004** | `Purchase.marketId` e a tabela `purchases` já exigem mercado; a documentação foi reconciliada com a regra atual que remove **Sem mercado**. |
| **RES-005** | A entrada de preço para produtos `FIXED` foi definida como preço por unidade comercial; para `VARIABLE`, é o preço total pago.              |
| **RES-006** | Produtos presentes em item ativo de `DRAFT` também têm forma de comercialização e medidas estruturais protegidas.                           |
| **RES-007** | A remoção do último item de compra concluída é bloqueada; para remover todo o conteúdo, o usuário deve excluir a compra.                    |
| **RES-008** | Histórico exibe nome, marca e categoria atuais; fatos estruturais e financeiros permanecem preservados no item.                             |
| **RES-011** | Produtos possuem filtro por múltiplas categorias em bottom sheet reutilizável, combinável com busca textual.                                |

## Divergências encerradas pela M3

| ID histórico | Resolução implementada                                                                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **PEND-003** | `PurchaseItem` preserva o total pago em centavos e normaliza valores variáveis com aritmética inteira.                                          |
| **PEND-006** | Repository, service e UI protegem a estrutura do produto em uso e oferecem a criação de um novo produto.                                        |
| **PEND-013** | Repositories, services, hooks e rotas concretas implementam rascunho, itens, totais, retomada, finalização e compras concluídas.                |
| **PEND-014** | `MultiSelectFilterSheet` e `FilterButton` implementam o filtro reutilizável, com primeiro uso por múltiplas categorias na listagem de Produtos. |

## Decisões técnicas já fechadas para a M3

- **RES-009 — Empate histórico:** ordenar por `purchasedAt DESC`, `createdAt DESC` e `id DESC`.
- **RES-010 — Precisão:** comparar razões variáveis com inteiros e multiplicação cruzada; arredondar uma única vez para apresentação em centavos usando `half-up`.
- O contrato completo está em [`docs/planejamento/milestone-03-contratos.md`](../planejamento/milestone-03-contratos.md).

## Dependências externas de design

- Os fluxos das issues #21, #23, #24 e #25 foram implementados a partir das referências aprovadas no Figma.
- A issue #20 foi concluída com os padrões visuais já estabelecidos no projeto.
- Para a issue #22, o Product Owner aprovou em 24/10/2026 um botão somente com ícone e um bottom sheet com categorias em tickets multisseleção, sem depender de nova tela no Figma.

## Propostas explicitamente descartadas

- **Não** atualizar quantidades ou preços de compras antigas ao editar produto.
- **Não** apagar itens concluídos para permitir mudança de comercialização.
- **Não** reiniciar ou versionar o histórico de preços para contornar mudança estrutural.
- **Não** permitir duas compras `DRAFT` simultâneas.
- **Não** oferecer compra sem mercado.
- **Não** comparar totais de linhas com quantidades diferentes.

## Referências

- [#20 — Gerenciar compras concluídas](https://github.com/Maurrici/MercadON/issues/20)
- [#21 — Operar compra em andamento](https://github.com/Maurrici/MercadON/issues/21)
- [#22 — Filtros reutilizáveis](https://github.com/Maurrici/MercadON/issues/22)
- [#23 — Preparar compra](https://github.com/Maurrici/MercadON/issues/23)
- [#24 — Adicionar produto e comparar preço](https://github.com/Maurrici/MercadON/issues/24)
- [#25 — Persistir e retomar](https://github.com/Maurrici/MercadON/issues/25)
