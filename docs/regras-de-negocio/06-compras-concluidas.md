# 06 — Compras concluídas e gastos

## Consulta

- **RN-HIS-001 — Histórico:** compras concluídas integram o histórico de gastos e fornecem dados para comparações de preços futuras.
- **RN-HIS-002 — Listagem:** ordenar por data da compra (mais recentes primeiro). Exibir pelo menos data, mercado ou **Sem mercado**, total e quantidade de itens.
- **RN-HIS-003 — Detalhe:** mostrar mercado, data, total e itens; para cada item, mostrar produto, quantidade/unidade, preço unitário normalizado e total pago.
- **RN-HIS-004 — Histórico fiel:** manter quantidades, unidades e valores realmente pagos em cada item. Alterar nome, marca ou categoria do produto não deve reinterpretar fatos financeiros antigos.

## Correções

- **RN-HIS-005 — Edição de compra concluída:** permitir mudar mercado, **data da compra** (pertence ao usuário), quantidade e preço dos itens, adicionar e remover itens.
- **RN-HIS-006 — Recalcular:** após editar compra concluída, atualizar o total e as consultas históricas/variações de preço afetadas. A edição é um fluxo administrativo mais completo, distinto da operação do carrinho.
- **RN-HIS-007 — Exclusão definitiva:** antes de excluir uma compra concluída, informar que compra e itens sairão do histórico definitivamente e que análises/comparações poderão mudar. Exige confirmação explícita.
- **RN-HIS-008 — Integridade:** uma edição ou exclusão deliberada da compra é diferente de excluir um cadastro de produto/mercado. Excluir cadastros não apaga compras anteriores.

## Exemplo de aviso de exclusão

> Esta compra será excluída definitivamente. Seus itens deixarão de participar do histórico de gastos e preços, o que poderá alterar comparações futuras.

## Fontes

[#20 — Gerenciar compras concluídas](https://github.com/Maurrici/MercadON/issues/20) · [#21 — Finalizar compra](https://github.com/Maurrici/MercadON/issues/21).
