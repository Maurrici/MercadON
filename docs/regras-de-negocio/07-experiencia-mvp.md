# 07 — Experiência mobile do MVP

> Esta seção documenta **decisões de UX acordadas**, não novas regras de negócio.

- **UX-001 — Rapidez:** reduzir etapas e digitação; permitir começar com poucos dados e enriquecer depois, respeitando campos obrigatórios por tipo de produto.
- **UX-002 — Padrão de catálogo:** tela de listagem com busca, ação principal destacada **Novo produto / Novo mercado** e ações **Editar / Excluir** em menu de três pontos por item.
- **UX-003 — Cadastro e edição:** usar **bottom sheets/modais** dentro do gerenciamento de Produtos e Mercados, preservando contexto. Reutilizar esses cadastros em fluxos contextuais de compra.
- **UX-004 — Feedback:** mensagens informativas de sucesso/erro/aviso aparecem como **toasts temporários**; não criar modais somente para informar algo. Erros de formulário que exigem correção também devem estar visíveis junto aos campos.
- **UX-005 — Confirmação relevante:** decisões destrutivas ou de consequências irreversíveis, como descartar rascunho, excluir compra concluída ou finalizar compra, podem exigir confirmação explícita. Toast **não substitui** confirmação.
- **UX-006 — Estados:** lista vazia, busca sem resultado, duplicado/restaurável, sucesso e erro devem ser tratados dentro dos fluxos necessários. **Não** adicionar telas extraordinárias que não contribuam para o MVP sem avaliação do Product Owner.
- **UX-007 — Mobile:** respeitar toque confortável, uso com uma mão, teclado numérico quando aplicável, safe areas, acessibilidade, foco e ações principais acessíveis com teclado aberto.
- **UX-008 — Comparações:** estado mais caro/barato/igual deve ter texto ou ícone além da cor; diferença monetária por unidade normalizada.
- **UX-009 — Identidade:** manter os tokens do [`src/theme/colors.ts`](https://github.com/Maurrici/MercadON/blob/main/src/theme/colors.ts) e o padrão visual aprovado no [arquivo Figma](https://www.figma.com/design/aisX81ictadvWuASkD00H5/MercadON-%E2%80%94-Mobile-UI-UX); não criar design system excessivo antes da necessidade.
- **UX-010 — Compra operacional:** não tratar a compra em andamento como CRUD tradicional; foco em total visível, lista densa legível, ação frequente de adicionar e mínima troca de contexto.

## Navegação e padrões confirmados

- **Produtos e Mercados:** gerenciamento em listagem + bottom sheet; menu de três pontos para editar/excluir; busca reativa.
- **No carrinho:** mercado pode ser alterado no cabeçalho; usuário pode sair sem descartar; iniciar compra novamente retoma a ativa.
- **Na finalização:** confirmação curta que apresenta total final.
- **Feedbacks:** toasts desaparecem após alguns segundos (referência visual anterior: cerca de 3–4 s; não é restrição de banco/domínio).

## Fontes

[Figma MercadON](https://www.figma.com/design/aisX81ictadvWuASkD00H5/MercadON-%E2%80%94-Mobile-UI-UX) · [#15 — Produtos](https://github.com/Maurrici/MercadON/issues/15) · [#13 — Mercados](https://github.com/Maurrici/MercadON/issues/13) · [#21 — Carrinho](https://github.com/Maurrici/MercadON/issues/21).
