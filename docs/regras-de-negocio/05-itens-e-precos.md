# 05 — Itens, quantidades e comparação de preços

## Adicionar e editar itens

- **RN-ITM-001 — Busca contextual:** localizar produto existente ou cadastrá-lo rapidamente durante a compra; não obrigar navegação ao gerenciamento.
- **RN-ITM-002 — Produto de quantidade fixa:** informar **quantidade inteira de unidades comerciais** (inicialmente `1 un`) e **preço por unidade comercial**. Calcular o total do item como `quantidade × preço unitário`. Se a embalagem contiver `500 g`, **2 pacotes não significam digitar `1.000 g` no carrinho**.
- **RN-ITM-003 — Produto de medida variável:** informar quantidade efetivamente adquirida, possivelmente fracionária, na unidade cadastrada (`kg`, `g`, `L`, `ml` etc.), e **preço total pago**. Exemplo: `1,275 kg` e `R$ 50,87`.
- **RN-ITM-004 — Item já no carrinho:** não criar automaticamente uma segunda linha para o mesmo produto. Oferecer **Atualizar item**; para **quantidade fixa**, também oferecer **Adicionar +1 unidade**. Para medida variável, usar atualização das quantidades/preços (não `+1`).
- **RN-ITM-005 — Informações armazenadas:** quantidade efetiva, unidade, valor total pago e base de preço normalizado devem poder ser recuperados sem alterar dados financeiros de compras anteriores.
- **RN-ITM-006 — Edição e exclusão:** itens podem ter quantidade e preço alterados ou ser removidos, com impacto imediato no total. Manter a ordem em que foram adicionados e destacar temporariamente o último item incluído sem depender só da cor.
- **RN-ITM-007 — Busca no carrinho:** permitir busca por texto entre **itens presentes na compra**, sem filtro por categoria.

## Totais e preço normalizado

- **RN-PRC-001 — Subtotal:** cada item apresenta quantidade, preço unitário normalizado e valor total pago pelo item. Para fixos, a base comparável é **a unidade comercial** (`R$/pacote`, `R$/peça`), mesmo que haja massa/volume declarado na embalagem.
- **RN-PRC-002 — Variáveis:** a base comparável é **a unidade de medida cadastrada**, não o total pago nem o número de embalagens (`R$/kg`, `R$/L`, `R$/g`, `R$/ml` conforme cadastro e conversão compatível).
- **RN-PRC-003 — Total da compra:** soma dos valores dos itens, refletindo imediatamente inclusões, alterações e remoções.
- **RN-PRC-004 — Equivalência:** comparar sempre valores da **mesma base unitária**. Nunca comparar valores totais de itens quando suas quantidades diferirem.
- **RN-PRC-005 — Referência anterior:** usar a **última compra concluída que contém aquele produto**, independentemente do mercado. Não usar necessariamente a última compra geral do usuário, nem rascunhos. A data da compra corrigida pelo usuário deve ser considerada na ordenação histórica.
- **RN-PRC-006 — Estados:** `mais barato`, `mais caro`, `mesmo preço`, `sem histórico anterior`.
- **RN-PRC-007 — Apresentação:** estado de preço deve combinar **ícone + texto + diferença monetária por unidade normalizada**, sem depender exclusivamente de cor. No estado sem histórico, não inventar variação.
- **RN-PRC-008 — Consulta antes de confirmar:** mostrar brevemente a comparação antes de adicionar/atualizar o item.
- **RN-PRC-009 — Variação de quantidade:** mudar apenas a quantidade (mantido o preço unitário real) não deve causar falsa sinalização de alta ou queda.

## Exemplos de base

| Produto                  | Situação                          | Base comparável                    |
| ------------------------ | --------------------------------- | ---------------------------------- |
| Café, embalagem de 500 g | 2 pacotes por R$ 20,00 cada       | R$ 20,00/pacote                    |
| Carne                    | 1,275 kg, R$ 50,87 pagos no total | R$ 50,87 ÷ 1,275 kg = preço por kg |
| Detergente               | 3 unidades                        | Preço por unidade de detergente    |

## Notas de consistência

- Todos os **montantes pagos** devem preservar precisão em centavos.
- Os cálculos de normalização e apresentação precisam de política explícita de precisão e arredondamento; não arredondar repetidamente para comparar valores. Ver `PEND-003` no documento 08.
- Para produtos `FIXED`, o campo de preço recebe **preço por unidade comercial** e o total é derivado. Para produtos `VARIABLE`, o campo recebe **preço total pago** e o preço normalizado é derivado.

## Fontes

[#21 — Operar compra](https://github.com/Maurrici/MercadON/issues/21) · [#24 — Adicionar e comparar](https://github.com/Maurrici/MercadON/issues/24).
