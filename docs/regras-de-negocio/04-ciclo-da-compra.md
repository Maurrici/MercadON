# 04 — Ciclo da compra

## Preparação e criação

- **RN-CMP-001 — Início:** ação **Registrar compra** abre preparação curta: selecionar mercado existente, cadastrar novo mercado ou escolher explicitamente **Sem mercado**; confirmar início.
- **RN-CMP-002 — Limite:** **no máximo uma compra `DRAFT` ativa** por vez. Se já houver uma, a ação de iniciar compra deve **retomá-la**, não criar outra.
- **RN-CMP-003 — Persistência inicial:** ao confirmar nova compra, criar e persistir imediatamente `DRAFT` no SQLite, com `createdAt` automático e mercado opcional.
- **RN-CMP-004 — Mercado alterável:** durante a compra em andamento, permitir trocar o mercado pelo cabeçalho sem descartar ou reiniciar os itens.

## Uso e persistência

- **RN-CMP-005 — Persistência incremental:** inclusões, atualizações de quantidade/preço, remoções de item e alteração de mercado são persistidas conforme confirmadas; a lista não pode existir somente no estado de memória da tela.
- **RN-CMP-006 — Retomada após reiniciar o app:** após inicialização do banco/migrations, se existir `DRAFT`, reabrir automaticamente a compra e reconstruir itens, preços e total dos dados persistidos.
- **RN-CMP-007 — Saída voluntária:** o usuário pode sair da tela de compra sem descartá-la; o rascunho permanece disponível. Ao acionar **Registrar compra** novamente, retomar o mesmo rascunho. Redirecionamento automático ao iniciar o app e navegação voluntária para fora da compra são comportamentos compatíveis.
- **RN-CMP-008 — Integridade:** mudanças confirmadas não podem se perder após fechamento inesperado. Evitar transições parciais entre `DRAFT` e `COMPLETED`.

## Finalização e descarte

- **RN-CMP-009 — Finalizar:** só concluir compra que possua **pelo menos um item**. Exibir confirmação curta mostrando o **total final**.
- **RN-CMP-010 — Conclusão:** na confirmação, alterar `DRAFT` para `COMPLETED` e passar a compra ao histórico. Registrar data/hora pertinente; a data da compra concluída poderá ser corrigida depois pelo usuário.
- **RN-CMP-011 — Descartar:** ação explícita e separada, com **confirmação**, elimina o rascunho como compra em andamento. Ele não será recuperado na próxima abertura.
- **RN-CMP-012 — Próxima compra:** após concluir ou descartar, uma nova compra pode ser iniciada. Nunca coexistem duas em andamento.

## Informações que permanecem consultáveis durante o uso

- Mercado atual ou **Sem mercado**.
- Total acumulado.
- Lista de itens em ordem de inclusão.
- Ação de adicionar produto e acesso à finalização.

## Fora do escopo

- Preparar nova compra a partir de uma lista de compras prévia (possibilidade futura, **não** parte da M3).

## Fontes

[#23 — Preparar](https://github.com/Maurrici/MercadON/issues/23) · [#21 — Operar](https://github.com/Maurrici/MercadON/issues/21) · [#25 — Persistir e retomar](https://github.com/Maurrici/MercadON/issues/25).
