# 01 — Princípios e dados

## Produto

- **RN-001 — Offline-first.** O fluxo principal funciona sem internet. Dados essenciais são armazenados localmente no SQLite; conexão não pode ser pré-requisito para cadastrar produtos, mercados ou registrar compras.
- **RN-002 — Catálogo pessoal.** Produtos e mercados pertencem ao catálogo do usuário. Cadastro prévio é opcional: registros podem ser criados tanto no gerenciamento quanto dentro de uma compra.
- **RN-003 — Cadastro mínimo.** Não exigir informação opcional antes de permitir o cadastro básico, respeitando as regras específicas de comercialização.
- **RN-004 — Preservação histórica.** Alterações ou remoções do catálogo não devem apagar acidentalmente compras concluídas nem alterar quantidades, unidades e valores pagos no passado.

## Entidades e relacionamentos

- **RN-005 — Entidades:** `Market`, `Category`, `Product`, `Purchase`, `PurchaseItem`.
- **RN-006 — Relações:** `Market 1:N Purchase` (toda compra possui um mercado cadastrado); `Purchase 1:N PurchaseItem`; `Product 1:N PurchaseItem`; `Category 1:N Product` (categoria opcional).
- **RN-007 — Identificação:** entidades persistidas utilizam UUID v4, independentes do SQLite; `createdAt` e `updatedAt` registram timestamps ISO 8601 em UTC.
- **RN-008 — Dinheiro:** preços e valores pagos devem ser preservados em representação inteira em centavos, evitando persistir montantes financeiros em ponto flutuante.
- **RN-009 — Quantidades:** a representação corrente do domínio utiliza milésimos da unidade (ex.: `1,275 kg = 1275`, `2 un = 2000`); quantidades comerciais por unidade não podem ser fracionárias. Precisão e arredondamento de cálculos intermediários devem ser coerentes; detalhes pendentes estão no documento 08.
- **RN-010 — Compra e item:** `DRAFT` é compra em andamento; `COMPLETED` é concluída. O preço praticado pertence ao item da compra, não ao cadastro global do produto.
- **RN-011 — Histórico derivado:** o histórico de preços é obtido das compras concluídas e seus itens; não há obrigação de criar uma tabela independente de histórico no MVP.

## Prioridade de consistência

- Preservar compras históricas e gastos reais é mais importante do que permitir alterações estruturais potencialmente incompatíveis em produtos.
- Uma mudança de cadastro **não é** uma licença para reinterpretar ou sobrescrever compras concluídas.

## Fontes

[Modelagem de domínio](https://github.com/Maurrici/MercadON/blob/main/src/domain/DOMAIN.md) · [#5 — Modelos](https://github.com/Maurrici/MercadON/issues/5) · [#6 — SQLite](https://github.com/Maurrici/MercadON/issues/6) · [#7 — Migrations](https://github.com/Maurrici/MercadON/issues/7).
