# 08 — Pendências e divergências com o código

> **Importante:** itens abaixo **não substituem** as regras aprovadas. São decisões técnicas, detalhes de cálculo ou alinhamentos necessários para implementar as regras sem ambiguidade.

## Divergências concretas entre decisão e código atual

| ID           | Observação                                                                                                                                                                                                                                         | Alinhamento necessário                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **PEND-001** | `Product` ainda não declara `forma de comercialização`; a validação só conhece `packageQuantityMilli` e `packageUnit`.                                                                                                                             | Adicionar o tipo de comercialização e validações fixo/variável no domínio, serviço e migration.                             |
| **PEND-002** | A unicidade SQL de Produtos usa `nome + marca + quantidade + unidade`, sem forma de comercialização.                                                                                                                                               | Incluir forma de comercialização na identidade e revisar casos com campos opcionais.                                        |
| **PEND-003** | `PurchaseItem` atual guarda `quantityMilli`, `quantityUnit` e `unitPriceCents` opcional, mas a regra da M3 exige preservar preço total pago e cálculo por unidade para variáveis.                                                                  | Definir representação e arredondamento que mantenham o valor pago exato em centavos e comparação normalizada confiável.     |
| **PEND-004** | `Purchase.marketId` e o schema atual exigem mercado; o produto permite **Sem mercado**.                                                                                                                                                            | Tornar a associação opcional em modelo, banco, validações e telas.                                                          |
| **PEND-005** | [`src/domain/DOMAIN.md`](https://github.com/Maurrici/MercadON/blob/main/src/domain/DOMAIN.md) ainda contém texto geral que prevê criar novo cadastro em toda transformação, sem refletir o bloqueio condicional só quando houver compra concluída. | Atualizar essa regra de domínio para RN-PRD-010…014, mantendo o histórico intacto.                                          |
| **PEND-006** | A UI de produto ainda precisa refletir o bloqueio condicional quando houver compras concluídas; independentemente disso, a proteção deve ser efetiva na gravação.                                                                                  | Consulta confiável para verificar presença do produto em ao menos uma compra `COMPLETED`, inclusive alterações via serviço. |

## Decisões ainda não fechadas — não presumir

- **PEND-007 — Entrada de preço para fixos:** o usuário informou que produtos de quantidade fixa pedem quantidade de unidades/pacotes e **preço**, mas não fixou de modo inequívoco se o campo digitado será preço **por unidade comercial** ou **total da linha**; qualquer opção precisa exibir/derivar os dois sem ambiguidade.
- **PEND-008 — Troca de comercialização com item em `DRAFT`:** a proibição definitiva cobre produtos usados em compras **concluídas**. Como preservar um item já incluído em uma compra **em andamento** se a forma do produto mudar antes de finalizá-la ainda requer tratamento técnico/UX.
- **PEND-009 — Ordenação histórica em empate:** última ocorrência deve seguir a data da compra (`purchasedAt`), que o usuário pode corrigir. Definir desempate determinístico quando duas compras do mesmo produto tiverem exatamente o mesmo instante.
- **PEND-010 — Precisão numérica:** definir escala interna e política de arredondamento para preço normalizado, inclusive divisão por quantidade fracionária, antes de construir comparações.
- **PEND-011 — Alteração de cadastro usado no histórico:** nome/marca/categoria continuam editáveis, mas mudanças de nome e marca podem refletir nas telas históricas; confirmar como preservar a legibilidade, caso haja necessidade de mostrar também o nome usado à época da compra.

- **PEND-012 — Edição que esvazia uma compra concluída:** a finalização exige pelo menos um item; falta definir o comportamento ao remover o último item de uma compra já concluída (bloquear, excluir a compra ou outra solução).

## Propostas explicitamente descartadas

- **NÃO** atualizar em massa quantidades/preços de compras antigas ao editar um produto.
- **NÃO** apagar itens de compras concluídas para viabilizar mudança de comercialização.
- **NÃO** reiniciar/versionar comparação de preços para permitir essa mudança estrutural no MVP.
- **NÃO** travar todos os campos do produto quando houver compras concluídas; travar **apenas** a forma de comercialização e suas medidas estruturais.

## Referências de implementação inspecionadas

- [`src/domain/models/Product.ts`](https://github.com/Maurrici/MercadON/blob/main/src/domain/models/Product.ts)
- [`src/domain/models/Purchase.ts`](https://github.com/Maurrici/MercadON/blob/main/src/domain/models/Purchase.ts)
- [`src/domain/models/PurchaseItem.ts`](https://github.com/Maurrici/MercadON/blob/main/src/domain/models/PurchaseItem.ts)
- [`src/services/product.service.ts`](https://github.com/Maurrici/MercadON/blob/main/src/services/product.service.ts)
- [`src/database/migrations/001_initial_schema.ts`](https://github.com/Maurrici/MercadON/blob/main/src/database/migrations/001_initial_schema.ts)
- [`src/database/migrations/002_catalog_identity.ts`](https://github.com/Maurrici/MercadON/blob/main/src/database/migrations/002_catalog_identity.ts)
