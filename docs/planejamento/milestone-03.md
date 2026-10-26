# Milestone 3 — Plano de implementação

> Planejamento consolidado em **23/10/2026** a partir das issues [#20](https://github.com/Maurrici/MercadON/issues/20), [#21](https://github.com/Maurrici/MercadON/issues/21), [#22](https://github.com/Maurrici/MercadON/issues/22), [#23](https://github.com/Maurrici/MercadON/issues/23), [#24](https://github.com/Maurrici/MercadON/issues/24) e [#25](https://github.com/Maurrici/MercadON/issues/25), das regras em `docs/regras-de-negocio` e do código atual.

## Objetivo e premissas

A Milestone 3 deve entregar o ciclo local de compras: preparar uma compra com mercado obrigatório, manter um único rascunho persistente, adicionar/editar itens com regras diferentes para produtos `FIXED` e `VARIABLE`, comparar preços equivalentes, operar o carrinho, finalizar e consultar compras concluídas.

Premissas confirmadas:

- Expo Router + React Native + SQLite local; arquitetura `model → repository → service → hook → screen`;
- toda compra possui mercado cadastrado obrigatório;
- existe no máximo um `DRAFT`;
- `FIXED` recebe quantidade inteira e preço por unidade comercial;
- `VARIABLE` recebe quantidade na unidade cadastrada e preço total pago;
- somente compras `COMPLETED` participam da comparação histórica;
- filtros da issue #22 não bloqueiam o núcleo de compras.

O contrato técnico de compras e preços foi aprovado em 23/10/2026 e está em [`milestone-03-contratos.md`](milestone-03-contratos.md). Em 24/10/2026, o Product Owner aprovou concluir a issue #22 sem nova referência do Figma, compondo o filtro com os componentes e tokens existentes.

## Como requisitar o desenvolvimento

Solicite **uma Task por vez**, usando o número deste documento. O formato recomendado é:

> Execute a Task N do plano `docs/planejamento/milestone-03.md`. Antes de alterar o código, verifique os impedimentos descritos nela. Implemente somente o escopo dessa Task, execute as validações exigidas e me entregue o resultado para aprovação.

Depois de validar a entrega, peça a Task seguinte. Não solicite “implementar toda a milestone” em uma única execução: as migrations, regras financeiras e telas possuem dependências que precisam ser verificadas entre etapas.

## Task 1 — Fechar o contrato técnico de compras e preços

Objetivo: obter um contrato de dados implementável e sem ambiguidades para `Purchase` e `PurchaseItem` antes de criar migrations ou regras consumidoras.

Dependências:

- Nenhuma.

Entregável:

- Registro de decisão técnica em `docs/planejamento/milestone-03-contratos.md`, aprovado antes da Task 2.

Sub-tasks:

- definir campos persistidos para quantidade, preço unitário de `FIXED`, total efetivamente pago e base normalizada de `VARIABLE`;
- definir cálculo exato de subtotal e comparação, evitando arredondamento acumulado;
- definir arredondamento somente para apresentação e validações de entrada monetária/decimal;
- definir desempate da compra histórica mais recente;
- propor e submeter ao Product Owner as decisões `PEND-008` e `PEND-012`;
- confirmar se nomes históricos continuam vindo do cadastro atual;
- revisar o contrato contra os exemplos de café, detergente e carne.

Fora de escopo:

- alterar schema, modelos, services ou telas;
- implementar componentes do Figma.

Critérios de conclusão:

- cada campo possui semântica, nulabilidade e unidade explícitas;
- fórmulas e arredondamento possuem exemplos verificáveis;
- `PEND-008`, `PEND-010` e `PEND-012` estão decididas ou marcadas como bloqueios explícitos das Tasks afetadas.

## Task 2 — Criar a fundação persistente de compras

> **Status:** concluída em 23/10/2026. Migration 006, contratos, repositories, executor transacional e testes implementados.

Objetivo: disponibilizar modelos, migration e repositories capazes de armazenar compras e itens segundo o contrato aprovado.

Dependências:

- Task 1, concluída em 23/10/2026.

Entregável:

- Schema migrado e repositories de `Purchase`/`PurchaseItem`, sem regras de fluxo ou telas.

Sub-tasks:

- atualizar `Purchase`, `PurchaseItem` e contratos de repository;
- criar migration incremental, preservando dados existentes e validando foreign keys;
- garantir mercado obrigatório e unicidade de no máximo um `DRAFT` por índice/regra transacional adequada;
- implementar consultas de rascunho, compra por ID, itens ordenados por inclusão e compras concluídas;
- implementar gravações atômicas necessárias aos próximos services;
- criar testes de migration e repository.

Fora de escopo:

- iniciar, finalizar ou descartar compras via UI;
- calcular comparação histórica;
- alterar telas placeholder.

Critérios de conclusão:

- schema representa todos os dados do contrato;
- repositories recuperam os mesmos valores persistidos, sem perda financeira;
- constraints impedem estados inválidos e testes locais passam.

## Task 3 — Proteger produtos vinculados ao histórico

> **Status:** concluída em 23/10/2026. Proteção de repository/service, estado protegido no formulário, alternativa de novo cadastro e testes implementados.

Objetivo: impedir alterações estruturais em produtos usados por compras concluídas e oferecer a alternativa aprovada de novo cadastro.

Dependências:

- Task 2.

Entregável:

- Proteção efetiva no domínio e comportamento correspondente no gerenciamento de Produtos.

Sub-tasks:

- consultar existência de `PurchaseItem` pertencente a compra `COMPLETED`;
- bloquear no service alterações de comercialização e medidas protegidas;
- manter nome, marca e categoria editáveis;
- adaptar formulário para exibir informação protegida e desabilitar somente campos estruturais;
- oferecer “Criar novo produto” com dados preenchidos e novo UUID;
- aplicar a decisão da Task 1 para produto presente somente em `DRAFT`;
- testar bypass direto do service/repository, não apenas controles visuais.

Fora de escopo:

- editar o item comprado;
- reescrever compras antigas;
- implementar o carrinho.

Critérios de conclusão:

- nenhuma entrada da aplicação consegue alterar estrutura protegida;
- novo produto pode ser criado sem modificar o original;
- compras e itens históricos permanecem intactos.

## Task 4 — Implementar o ciclo de vida do único rascunho

> **Status:** concluída em 23/10/2026. Service/hook, operações transacionais, recuperação persistente e testes implementados.

Objetivo: fornecer um `PurchaseService` que cria, recupera, altera mercado, descarta e finaliza o único `DRAFT` de forma íntegra.

Dependências:

- Task 2.

Entregável:

- Service/hook de ciclo de vida da compra, ainda sem telas finais.

Sub-tasks:

- iniciar `DRAFT` somente com mercado ativo válido;
- retornar o rascunho existente em vez de criar um segundo;
- permitir troca de mercado sem modificar itens;
- recuperar rascunho com itens e total recalculado da persistência;
- descartar mediante operação explícita;
- finalizar atomicamente somente com item, registrando `purchasedAt`;
- testar concorrência lógica, transições e falhas transacionais.

Fora de escopo:

- seleção visual de mercado;
- formulário de item e comparação;
- histórico de compras concluídas.

Critérios de conclusão:

- nunca coexistem dois rascunhos;
- finalizar ou descartar libera a criação de nova compra;
- recuperação não depende de estado em memória.

## Task 5 — Implementar itens, totais e comparação histórica

> **Status:** concluída em 23/10/2026. Service/hook, cálculos exatos, comparação histórica equivalente, atualização sem duplicidade e testes de limites implementados.

Objetivo: fornecer regras de inclusão/atualização/remoção e comparação de itens em bases equivalentes.

Dependências:

- Tasks 1, 2 e 4.

Entregável:

- `PurchaseItemService` e consultas históricas consumíveis pelas telas.

Sub-tasks:

- validar quantidade inteira e preço por unidade para `FIXED`;
- validar quantidade medida e preço total para `VARIABLE`;
- calcular subtotal, total da compra e preço normalizado conforme o contrato;
- consultar a última ocorrência `COMPLETED` do mesmo produto, ignorando rascunhos e mercado;
- produzir estados `cheaper`, `more_expensive`, `same_price` e `no_history`, com diferença equivalente;
- atualizar linha existente sem duplicar `productId` na mesma compra;
- implementar `+1` somente para `FIXED`, reutilizando preço unitário;
- manter ordem de inclusão e testar todos os cálculos e limites.

Fora de escopo:

- renderizar formulário ou carrinho;
- cadastrar produto contextualmente;
- editar compra concluída.

Critérios de conclusão:

- exemplos financeiros aprovados produzem resultados exatos;
- mudar apenas quantidade sem mudar preço comparável não cria variação falsa;
- toda alteração confirmada fica persistida e recalcula o total.

## Task 6 — Criar os componentes reutilizáveis do fluxo de compras

> **Status:** concluída em 23/10/2026. Componentes controlados de seleção de mercado, item, total, comparação, formulário e produto já presente foram implementados em `components/purchase`.

Objetivo: disponibilizar os componentes visuais necessários às telas #21, #23 e #24, sem implementar navegação ou persistência.

Dependências:

- Tasks 1 e 5; acesso aos nodes aprovados do Figma.

Entregável:

- Componentes controlados por props, reutilizáveis nas telas de compra.

Sub-tasks:

- inspecionar os nodes do Figma com o workflow design-to-code;
- criar seleção/busca de mercado e cadastro contextual compondo componentes existentes;
- criar linha de item, painel inferior de total e indicador de comparação acessível;
- criar formulário discriminado de quantidade/preço para `FIXED` e `VARIABLE`;
- criar estados de produto já presente e ação `+1`;
- garantir controle externo de estado, safe area, teclado e acessibilidade;
- verificar visualmente apenas os componentes em escopo.

Fora de escopo:

- persistir dados;
- criar routes/screens completas;
- criar o filtro da issue #22.

Critérios de conclusão:

- componentes representam todos os estados aprovados e não contêm regra de persistência;
- formulário serve tanto para adicionar quanto editar item;
- comparação usa texto/ícone e não depende somente de cor.

## Task 7 — Entregar a preparação e entrada da compra

> **Status:** concluída em 23/10/2026. Aba Compras, preparação com mercado obrigatório, cadastro contextual, restauração, retomada do rascunho e navegação foram conectados aos services.

Objetivo: permitir iniciar ou continuar uma compra pela aba Compras conforme a issue #23.

Dependências:

- Tasks 4 e 6.

Entregável:

- Aba Compras e fluxo de preparação conectados ao rascunho persistente.

Sub-tasks:

- substituir placeholders por estados **Iniciar compra** e **Continuar compra**;
- implementar seleção pesquisável de mercado obrigatório;
- reutilizar cadastro contextual de mercado com duplicidade/restauração;
- manter confirmação desabilitada até seleção válida;
- cancelar sem criar `DRAFT` e confirmar criando/persistindo um único rascunho;
- navegar com Expo Router para o carrinho correto;
- testar estados sem/com rascunho e cancelamento.

Fora de escopo:

- redesenhar as abas;
- adicionar produtos ao carrinho;
- permitir **Sem mercado**.

Critérios de conclusão:

- critérios da issue #23 são reproduzíveis após reiniciar a tela;
- iniciar sem mercado é impossível;
- continuar nunca cria nova compra.

## Task 8 — Entregar adição, edição e comparação de item

> **Status:** concluída em 23/10/2026. Busca e cadastro contextual de produto, formulários discriminados, comparação reativa, edição, atualização sem duplicidade e `+1` foram conectados aos services.

Objetivo: permitir selecionar/cadastrar produto, informar valores, ver comparação e confirmar o item conforme a issue #24.

Dependências:

- Tasks 3, 5, 6 e 7.

Entregável:

- Tela dedicada progressiva de adicionar/editar item conectada aos services.

Sub-tasks:

- implementar busca reativa e seleção de produto;
- reutilizar cadastro contextual completo de produto;
- alternar formulário por `commercializationType`;
- pré-preencher edição de item e mostrar comparação assim que os campos forem válidos;
- tratar produto já presente com atualização e `+1` somente para `FIXED`;
- confirmar, persistir, retornar ao carrinho e informar o item recém-alterado;
- validar teclado, erros de campo e navegação de retorno.

Fora de escopo:

- scanner de código de barras;
- edição do cadastro do produto ao editar item;
- filtro por categoria no carrinho.

Critérios de conclusão:

- todos os critérios da issue #24 funcionam com dados reais;
- fixos e variáveis nunca compartilham semântica incorreta de preço/quantidade;
- nenhuma confirmação cria linha duplicada para o mesmo produto.

## Task 9 — Entregar o carrinho operacional e a retomada

> **Status:** concluída em 23/10/2026. Carrinho persistente, busca local, comparação, destaque temporário, totais, troca de mercado, ações de item, descarte e finalização foram implementados.

Objetivo: disponibilizar a tela principal de compra com itens, total, ações e retomada segura conforme #21 e #25.

Dependências:

- Tasks 4, 5, 6 e 8.

Entregável:

- Carrinho operacional completo e reconstruído do SQLite.

Sub-tasks:

- implementar cabeçalho com mercado alterável e menu da compra;
- implementar busca somente entre itens presentes, preservando o total geral;
- renderizar itens na ordem de inclusão com quantidade, preços equivalentes, subtotal e comparação;
- manter painel inferior de total/finalização/adição respeitando safe area;
- destacar temporariamente o último item sem depender somente de cor;
- conectar editar/remover item, descartar e finalizar com confirmações apropriadas;
- implementar retomada automática na inicialização e **Continuar compra** na aba;
- validar fechamento/reabertura do app com rascunho persistido.

Fora de escopo:

- histórico administrativo de compras concluídas;
- filtro por categoria;
- listas de compras pré-planejadas.

Critérios de conclusão:

- critérios das issues #21 e #25 passam com reinicialização real do banco/app;
- total deriva sempre dos itens persistidos;
- sair não descarta e finalizar é atômico.

## Task 10 — Entregar compras concluídas

> **Status:** concluída em 24/10/2026. Listagem, detalhe, correções, recálculo, último item protegido, exclusão definitiva e identificação de cadastros arquivados foram implementados e testados.

Objetivo: permitir listar, consultar, corrigir e excluir definitivamente compras concluídas conforme a issue #20.

Dependências:

- Tasks 1, 5 e 9; decisão `PEND-012`; validação/node final do Figma para #20.

Entregável:

- Fluxo administrativo completo de compras concluídas.

Sub-tasks:

- listar por `purchasedAt` decrescente com mercado, total e quantidade de itens;
- exibir detalhe fiel com bases de preço equivalentes;
- permitir corrigir mercado e data;
- reutilizar formulário da Task 8 para adicionar/editar itens;
- remover itens conforme a decisão do último item;
- recalcular totais e referências históricas após correções;
- implementar exclusão definitiva transacional com confirmação de impacto;
- testar como edições/exclusões alteram a próxima referência de preço.

Fora de escopo:

- alterar estrutura protegida do cadastro do produto;
- reutilizar integralmente a experiência operacional do carrinho;
- análises avançadas de gastos.

Critérios de conclusão:

- critérios da issue #20 passam com persistência real;
- correções passam a influenciar comparações futuras;
- exclusão remove compra/itens sem deixar referências inválidas.

## Task 11 — Entregar filtros reutilizáveis em Produtos

> **Status:** concluída em 24/10/2026. Botão por ícone, bottom sheet genérico, seleção múltipla por tickets, limpeza, estado ativo e composição com busca textual foram implementados.

Objetivo: adicionar filtro por múltiplas categorias sem acoplar o componente ao domínio de Produto.

Dependências:

- Direção visual aprovada pelo Product Owner em 24/10/2026: reutilizar componentes e tokens existentes sem depender de novo crédito no Figma.

Entregável:

- Estrutura reutilizável de filtros e seu primeiro uso na listagem de Produtos.

Sub-tasks:

- implementar componente controlado capaz de receber critérios genéricos;
- aplicar seleção de uma ou mais categorias;
- combinar categorias com busca textual existente;
- indicar quantidade/estado ativo e permitir limpeza fácil;
- tratar nenhum resultado por filtros;
- testar composição de texto + categorias sem alterar o carrinho.

Fora de escopo:

- adicionar filtros ao carrinho ou histórico;
- inventar componente visual antes da entrega do UI/UX.

Critérios de conclusão:

- critérios da issue #22 passam;
- componente não importa tipos de Produto ou Categoria;
- busca sem filtro mantém o comportamento atual.

## Task 12 — Executar regressão integrada da Milestone 3

> **Status:** concluída em 24/10/2026 no escopo automatizado. Suíte integrada, lint, typecheck, testes, formatação, verificação de diff e Expo Doctor passam; o roteiro em aparelho permanece como homologação do Product Owner.

Objetivo: comprovar que os fluxos completos funcionam juntos e que M2 não regrediu.

Dependências:

- Tasks 2–11 aplicáveis e aprovadas.

Entregável:

- Suíte integrada e relatório de validação da milestone.

Sub-tasks:

- cobrir início → itens → saída → retomada → finalização → histórico;
- cobrir fixo, variável, duplicidade, restauração e proteção histórica;
- testar alteração/exclusão de histórico e recálculo de referência;
- testar falhas transacionais e reinicialização;
- executar lint, typecheck, testes, format check e Expo Doctor;
- registrar limitações de testes manuais/dispositivos.

Fora de escopo:

- criar funcionalidades novas para corrigir requisitos não aprovados;
- documentação final antes dos resultados reais.

Critérios de conclusão:

- fluxos críticos possuem testes automatizados e roteiro manual;
- todos os comandos obrigatórios passam;
- regressões encontradas são corrigidas ou registradas como bloqueio.

## Task 13 — Documentar a implementação concluída

> **Status:** concluída em 24/10/2026. Implementação, arquitetura, validações e roteiro manual foram consolidados em `docs/implementacao/milestone-03.md`.

Objetivo: registrar, após conclusão e validação das Tasks anteriores, como a Milestone 3 foi efetivamente implementada.

Dependências:

- Todas as Tasks de implementação e validação concluídas.

Entregável:

- `docs/implementacao/milestone-03.md` consistente com o código final.

Sub-tasks:

- revisar fluxo e arquivos finais no diff;
- registrar arquitetura, schema, contratos, cálculos e navegação efetivos;
- listar migrations, models, repositories, services, hooks, componentes e screens alterados;
- registrar comandos de validação e resultados reais;
- incluir roteiro operacional e limitações remanescentes;
- reconciliar novamente `docs/regras-de-negocio` e `src/domain/DOMAIN.md` com a implementação.

Fora de escopo:

- implementar ou corrigir funcionalidades;
- antecipar resultados ainda não validados.

Critérios de conclusão:

- documentação descreve somente comportamento comprovado;
- links e comandos são válidos;
- não restam divergências silenciosas entre código, regras e documentação.
