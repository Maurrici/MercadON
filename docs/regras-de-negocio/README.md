# MercadON — Regras de negócio

> **Decisões vigentes do MVP** · Consolidação: **23/10/2026** · Idioma: pt-BR
> Fonte de verdade para comportamento esperado; **não é declaração de que tudo já está implementado**.

## Índice

| Documento                                                              | Assunto                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [01 — Princípios e dados](01-principios-e-dados.md)                    | Fundamentos, entidades e integridade                               |
| [02 — Produtos](02-produtos.md)                                        | Cadastro, comercialização, proteção histórica e exclusão           |
| [03 — Mercados, categorias e busca](03-mercados-categorias-e-busca.md) | Catálogo auxiliar, busca e filtros                                 |
| [04 — Ciclo da compra](04-ciclo-da-compra.md)                          | Início, rascunho, retomada, finalização e descarte                 |
| [05 — Itens, quantidades e preços](05-itens-e-precos.md)               | Inclusão, cálculo, comparação e carrinho                           |
| [06 — Compras concluídas](06-compras-concluidas.md)                    | Listagem, correção, exclusão e histórico de gastos                 |
| [07 — Experiência MVP](07-experiencia-mvp.md)                          | Padrões de interação já acordados                                  |
| [08 — Pendências e divergências](08-pendencias-e-divergencias.md)      | Pontos técnicos ainda não alinhados ao código e decisões em aberto |

## Como ler

- **RN-*** = regra de negócio aprovada ou expressa nos requisitos aceitos do projeto.
- **UX-*** = decisão de experiência aprovada para o MVP.
- **PEND-*** = definição que **não deve ser presumida**; depende de decisão ou reconciliação técnica.
- Regras novas e explícitas decididas pelo Product Owner **substituem** propostas anteriores e trechos desatualizados de issues ou código. Ao implementá-las, atualizar documentação, domínio, validações e testes juntos.
- As issues do GitHub descrevem o escopo; os arquivos de código mostram o estado da implementação, não necessariamente o comportamento já decidido.

## Alcance e fontes

- **M1 / M2:** catálogo pessoal de produtos, mercados e dados auxiliares.
- **M3:** registrar, operar, persistir e consultar compras, com comparação de preços.
- **Fora do escopo atual:** listas pré-planejadas de compras, sincronização online obrigatória, gerenciamento livre de categorias ou unidades, filtro por categoria no carrinho.

Referências principais: [issues do projeto](https://github.com/Maurrici/MercadON/issues), [Milestone 3](https://github.com/Maurrici/MercadON/milestone/3), [`src/domain/DOMAIN.md`](https://github.com/Maurrici/MercadON/blob/main/src/domain/DOMAIN.md) e [Figma — MercadON Mobile UI/UX](https://www.figma.com/design/aisX81ictadvWuASkD00H5/MercadON-%E2%80%94-Mobile-UI-UX).

## Manutenção

1. Registrar a decisão no documento do domínio correspondente, com identificador `RN-*` estável.
2. Em caso de substituição, modificar o texto vigente e registrar a mudança na seção **Histórico de decisões** abaixo; não deixar duas regras conflitantes.
3. Colocar dúvidas técnicas e definições ainda não resolvidas em [08 — Pendências](08-pendencias-e-divergencias.md), **não** misturá-las às regras aprovadas.
4. Referenciar o documento no Pull Request que implementar ou alterar a regra.

O plano executável da Milestone 3 está em [docs/planejamento/milestone-03.md](../planejamento/milestone-03.md).

### Histórico de decisões

| Data       | Decisão                                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 22/10/2026 | Primeira consolidação de regras das milestones 1–3 e das decisões do Product Owner.                                                                                                                                     |
| 22/10/2026 | Proteção definitiva de comercialização/medidas em produtos com compras concluídas; alternativa é criar novo produto. Descartadas propostas anteriores de converter, apagar ou versionar históricos ao editar o produto. |
| 23/10/2026 | Mercado passou a ser obrigatório em toda compra; removida a opção “Sem mercado”. Para produtos fixos, o preço informado na compra é o preço por unidade comercial.                                                      |
| 23/10/2026 | Aprovados o bloqueio estrutural de produto presente em `DRAFT`, o bloqueio da remoção do último item concluído e o uso dos nomes cadastrais atuais no histórico.                                                        |
