# Milestone 3 — Implementação concluída

> Estado consolidado em 24/10/2026. A milestone entrega o ciclo local de compras, histórico administrativo e filtros reutilizáveis de Produtos.

## Escopo entregue

- um único rascunho persistente, sempre associado a mercado ativo;
- criação, retomada, troca de mercado, descarte e finalização da compra;
- inclusão, edição, remoção e incremento de itens fixos;
- itens `FIXED` por unidade comercial e itens `VARIABLE` por medida adquirida;
- totais em centavos, quantidades em milésimos e comparação histórica equivalente;
- proteção dos campos estruturais de produtos usados por rascunhos ou compras concluídas;
- listagem, detalhe, correção e exclusão definitiva de compras concluídas;
- preservação de nomes atuais de produtos, categorias e mercados, inclusive quando o cadastro está arquivado;
- filtro de Produtos por múltiplas categorias, combinado com busca textual.

## Arquitetura efetiva

O fluxo mantém a separação `model → repository → service → hook → screen`:

- `src/domain/models` e `src/domain/repositories`: contratos de domínio e persistência;
- `src/database/migrations/006_purchase_foundation.ts`: tabelas, índices e invariantes de compras;
- `src/database/repositories`: acesso SQLite e executor transacional exclusivo;
- `src/services`: regras de rascunho, itens, preços e compras concluídas;
- `src/hooks`: composição dos services com o banco fornecido pelo `SQLiteProvider`;
- `src/components/purchase`: componentes controlados do fluxo de compra;
- `src/app/purchases`: rotas Expo Router de preparação, carrinho, item e histórico.

O filtro é composto por `FilterButton` e `MultiSelectFilterSheet`. O bottom sheet recebe grupos e opções genéricos por propriedades; somente a tela de Produtos conhece categorias.

## Persistência e invariantes

A migration 006 introduz `purchases` e reconstrói `purchase_items` para armazenar:

- `commercialization_type`;
- `quantity_milli` e `quantity_unit`;
- `unit_price_cents` para produtos fixos;
- `total_price_cents` para o valor efetivamente pago.

Índices parciais garantem no banco:

- no máximo um `DRAFT` ativo;
- no máximo um item ativo por produto em cada compra.

Operações compostas usam transação exclusiva. Finalização exige ao menos um item. A exclusão definitiva de compra concluída remove seus itens e depois a compra na mesma transação.

## Cálculos

- `FIXED`: quantidade inteira de unidades, preço por unidade comercial e subtotal `quantidade × preço`;
- `VARIABLE`: quantidade com até três casas na unidade cadastrada e preço total pago;
- comparação fixa: preço por unidade comercial;
- comparação variável: `totalPriceCents × 1000 ÷ quantityMilli`;
- somente compras `COMPLETED` participam do histórico;
- a referência mais recente desempata por data da compra, criação do item e ID;
- cálculos intermediários críticos usam inteiros e `BigInt`; arredondamento acontece somente na normalização apresentada.

## Navegação

- `/(tabs)/purchases`: iniciar ou continuar o rascunho;
- `/purchases/create`: selecionar/cadastrar mercado e criar o rascunho;
- `/purchases/[id]`: carrinho persistente;
- `/purchases/[id]/item`: adicionar ou editar item, também reutilizado pelo histórico;
- `/purchases/history`: compras concluídas;
- `/purchases/history/[id]`: detalhe e correções administrativas;
- `/products`: gerenciamento e filtro por categorias.

## Validação automatizada

Comandos executados no encerramento:

```text
npm run lint
npm run typecheck
npm run test -- --runInBand
npm run format:check
npx --yes expo-doctor
npm audit fix
git diff --check
```

A suíte inclui uma regressão integrada em `tests/integration/milestone-03-flow.test.ts`, cobrindo iniciar, persistir, retomar, finalizar, comparar, corrigir e excluir compras. Casos específicos cobrem produtos fixos e variáveis, duplicidade, restauração, proteção estrutural, último item, transações, filtros e cadastros arquivados.

Resultado final: 17 suítes e 123 testes aprovados; lint, TypeScript, Prettier e `git diff --check` sem erros; Expo Doctor com 21/21 verificações aprovadas.

## Roteiro de homologação em aparelho

1. Iniciar uma compra escolhendo um mercado e confirmar que cancelar antes disso não cria rascunho.
2. Adicionar um produto fixo e um variável, fechar o aplicativo e confirmar a retomada com o mesmo total.
3. Editar, remover e incrementar um item fixo; finalizar a compra.
4. Iniciar outra compra com os mesmos produtos e conferir os indicadores de comparação.
5. Abrir o histórico, corrigir data, mercado e itens, e confirmar os totais recalculados.
6. Verificar o bloqueio ao remover o último item e a confirmação de exclusão definitiva.
7. Arquivar um produto ou mercado usado e confirmar que o histórico continua exibindo sua identificação.
8. Em Produtos, combinar texto com uma ou mais categorias, limpar os filtros e conferir o estado sem resultados.

## Limitação de validação

Os testes automatizados e diagnósticos locais foram executados no ambiente de desenvolvimento. A ergonomia, o teclado e o comportamento visual final em Android/iOS precisam ser homologados em aparelho pelo Product Owner.

O `npm audit fix` removeu o alerta crítico corrigível sem quebra. Permanecem oito alertas transitivos do toolchain Expo (três moderados e cinco altos); o npm oferece correção apenas com `--force`, que substituiria Expo/Expo Router por versões incompatíveis. Eles não foram forçados e devem ser reavaliados quando o SDK publicar uma cadeia compatível.
