# Ambiente de teste local

Ferramenta temporária para substituir os dados operacionais do SQLite por cenários controlados.

## Limites

- não altera schema, migrations ou `PRAGMA user_version`;
- preserva o catálogo padrão de categorias;
- remove e recria somente mercados, produtos, compras e itens;
- executa aplicação e redefinição em transação exclusiva;
- gera datas relativas ao dia atual para manter as análises mensais úteis.

## Como remover

1. Remover `src/devtools/test-environment/`.
2. Remover `src/app/test-environment.tsx`.
3. Remover a opção **Teste** de `src/app/(tabs)/menu.tsx`.
4. Remover o registro `test-environment` de `src/app/_layout.tsx`.
5. Remover `tests/devtools/test-environment.test.ts`.

Nenhum código de domínio, repository ou service de produção depende deste módulo.
