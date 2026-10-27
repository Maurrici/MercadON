# Milestone 4 — Plano de implementação

> Planejamento consolidado em **27/10/2026** a partir das issues [#28](https://github.com/Maurrici/MercadON/issues/28), [#29](https://github.com/Maurrici/MercadON/issues/29), [#30](https://github.com/Maurrici/MercadON/issues/30), [#31](https://github.com/Maurrici/MercadON/issues/31), [#32](https://github.com/Maurrici/MercadON/issues/32) e [#33](https://github.com/Maurrici/MercadON/issues/33), além da task técnica [#34](https://github.com/Maurrici/MercadON/issues/34), das regras de negócio e do código atual.

## Objetivo e premissas

A Milestone 4 deve transformar os dados locais de compras concluídas em análises mensais úteis e auditáveis: Home mensal, gastos por categoria, ranking de produtos, variações de preço e histórico analítico de produto.

Premissas confirmadas:

- Expo 57, React Native 0.86, Expo Router e SQLite local;
- arquitetura atual `model → repository → service → hook → screen`;
- apenas compras `COMPLETED`, compras não excluídas e itens não excluídos participam das análises;
- valores gastos permanecem como inteiros em centavos;
- produtos são agregados exclusivamente por `productId`;
- preços de produtos `FIXED` são comparados por unidade comercial;
- preços de produtos `VARIABLE` são normalizados entre `g/kg`, `ml/L` e `UNIT` equivalentes;
- a configuração atual do produto determina quais ocorrências históricas são comparáveis;
- gastos históricos por categoria utilizam sempre a categoria atual do produto;
- toda compra possui mercado obrigatório, inclusive quando o mercado está arquivado;
- os gráficos recebem dados prontos e não concentram regras de negócio;
- a aplicação deve continuar operando offline.

As issues #28 e #30 foram atualizadas em 27/10/2026 para registrar a reclassificação histórica pela categoria atual do produto. A referência antiga a **Sem mercado** foi removida da #33 na mesma data.

## Estado atual relevante

- As Tasks 1–3 estão concluídas: contrato aprovado, data civil normalizada pela migration 007 e base analítica coberta por testes.
- A integração visual das Tasks 4–8 está implementada, incluindo Home, análises mensais, categorias, produtos, variações e histórico de preço.
- `react-native-gifted-charts`, `react-native-svg` e `expo-linear-gradient` estão instalados em versões compatíveis com o Expo 57.
- `npm run check`, `npx expo-doctor`, o bundle Android/Hermes e o export web passam.
- A homologação visual e de interação em aparelho Android é a pendência atual; iOS permanece pendente enquanto não houver ambiente disponível.

## Decisões aprovadas

Em 27/10/2026, o Product Owner aprovou:

1. **Data civil da compra:** `purchasedAt` representa `YYYY-MM-DD`, capturado no calendário local e persistido sem conversão posterior de fuso.
2. **Intervalo anterior em meses mais curtos:** limitar o período anterior ao último dia disponível.
3. **Período anterior com total zero:** percentual indisponível; mostrar diferença monetária e explicação textual. De valor positivo para zero, a queda é `100%`.
4. **Preço anterior igual a zero:** manter a ocorrência no histórico, mas excluí-la dos rankings percentuais. De preço positivo para zero, a queda é `100%`.

O contrato completo está em [`milestone-04-contratos.md`](milestone-04-contratos.md). Não restam decisões de produto bloqueando o início da implementação.

## Estratégia de arquitetura

- Criar uma área analítica própria em domínio, database, services, hooks e presentation, em vez de concentrar todas as regras no `DashboardService`.
- Manter SQL responsável por seleção e agregações exatas em centavos; manter regras de período, compatibilidade, normalização, arredondamento e estados no domínio/service.
- Reutilizar funções puras para limites mensais, percentuais e preço comparável em todas as telas.
- Criar componentes de gráfico controlados por props, sem acesso a SQLite ou hooks.
- Usar listas e resumos textuais como fonte acessível da informação; o gráfico será uma representação complementar.
- Normalizar a data legada em uma migration própria antes de implementar períodos mensais. Uma migration adicional de índices só será criada se `EXPLAIN QUERY PLAN` justificar.

## Como requisitar o desenvolvimento

Solicite **uma Task por vez**, usando o número deste documento. Formato recomendado:

> Execute a Task N do plano `docs/planejamento/milestone-04.md`. Verifique primeiro os gates e impedimentos da Task, implemente somente esse escopo, execute as validações exigidas e pare para me entregar o resumo e eventuais decisões necessárias.

Após uma Task visual, a validação no aparelho pode ser feita antes da próxima. Um estado bloqueante interrompe a execução imediatamente, sem antecipar trabalho da Task seguinte.

## Task 1 — Fechar o contrato analítico da Milestone 4

> **Status:** concluída em 27/10/2026. Contrato aprovado, regras de negócio e issues reconciliadas.

Objetivo: eliminar ambiguidades de data, comparação, precisão e classificação antes de implementar consultas ou telas.

Dependências:

- Nenhuma.

Entregável:

- `docs/planejamento/milestone-04-contratos.md` aprovado, com fórmulas, exemplos e decisões consumíveis pelas Tasks 2–9.

Sub-tasks:

- formalizar fontes válidas: compras `COMPLETED`, compras ativas e itens ativos;
- definir a semântica civil de `purchasedAt` e os limites inclusivo/exclusivo dos períodos;
- definir mês atual parcial, mês anterior equivalente, meses encerrados e janela móvel de seis meses;
- definir o comportamento para mês anterior sem gasto e para preço anterior zero;
- registrar soma em centavos, arredondamento `half-up` apenas na apresentação e cálculo percentual;
- formalizar compatibilidade e conversão de `G ↔ KG`, `ML ↔ L` e `UNIT`;
- formalizar a categoria atual do produto como fonte para todo gasto histórico;
- definir desempates determinísticos dos rankings;
- reconciliar o contrato com os exemplos das issues #28–#33 e com o contrato da Milestone 3.

Fora de escopo:

- criar queries, services, componentes ou telas;
- instalar biblioteca de gráficos;
- documentar resultados de uma implementação ainda não executada.

Critérios de conclusão:

- as quatro decisões necessárias estão aprovadas;
- toda fórmula possui entradas, saída, unidade e exemplo verificável;
- nenhum consumidor precisa reinventar regras de mês, categoria ou preço comparável;
- as regras não contradizem a persistência existente.

Gate de interrupção:

- não há gate remanescente; as quatro decisões foram aprovadas em 27/10/2026.

## Task 2 — Normalizar a data civil das compras

> **Status:** concluída em 27/10/2026.

Objetivo: fazer toda compra concluída usar uma data civil estável, sem deslocamento de dia por fuso, antes das consultas mensais.

Dependências:

- Task 1 aprovada.

Entregável:

- Tipo de domínio, migration e fluxo de compra adaptados para `purchasedAt` em `YYYY-MM-DD`.

Sub-tasks:

- criar um tipo de data civil distinto de timestamps;
- normalizar valores legados para os dez primeiros caracteres, preservando a data atualmente exibida;
- adaptar model, repository e services de compra concluída;
- gerar a data local na finalização sem usar `toISOString()` para determinar o dia;
- converter entrada `DD/MM/AAAA` diretamente para `YYYY-MM-DD` e formatar sem `Date`/fuso;
- preservar `createdAt` e `id` nos desempates de compras do mesmo dia;
- atualizar testes de migration, repository, service e presentation relacionados a compras.

Fora de escopo:

- criar consultas ou indicadores analíticos;
- instalar gráficos;
- alterar telas além do necessário para preservar a apresentação/edição atual da data.

Critérios de conclusão:

- registros novos e editados persistem `YYYY-MM-DD`;
- registros legados mantêm o mesmo dia anteriormente exibido;
- conclusão perto da meia-noite UTC preserva o dia local;
- fluxos existentes de compras continuam passando;
- lint, typecheck, testes e format check passam.

Gate de interrupção:

- parar se dados legados inválidos forem encontrados; não descartar nem inventar uma data.

## Task 3 — Implementar a base analítica reutilizável (#28)

> **Status:** concluída em 27/10/2026.

Objetivo: disponibilizar consultas e cálculos únicos para todas as análises da milestone, sem interface visual.

Dependências:

- Tasks 1 e 2 aprovadas.

Entregável:

- Contratos, repository SQLite, funções puras, service e hook analíticos cobertos por testes.

Sub-tasks:

- criar tipos de período, resumo mensal, série de seis meses, categoria, produto, variação e ocorrência de preço;
- implementar limites mensais e comparação do mesmo intervalo anterior conforme o contrato;
- somar totais exclusivamente como inteiros em centavos, com validação de limites seguros;
- agregar produtos por `productId`;
- agregar categorias usando `products.category_id` atual e agrupar `null` em **Sem categoria**;
- consultar ocorrências históricas com mercado, produto e snapshots estruturais necessários;
- centralizar compatibilidade histórica e normalização exata de unidades equivalentes;
- calcular preço atual, mínimo, máximo, diferenças e percentuais sem ponto flutuante financeiro acumulado;
- ordenar resultados com desempates determinísticos;
- verificar planos das queries e criar migration de índices somente se houver evidência de varredura evitável relevante;
- criar testes unitários, de repository e de service para todos os limites e casos vazios.

Fora de escopo:

- instalar ou renderizar gráficos;
- alterar a Home ou criar rotas analíticas;
- aplicar estilos do Figma.

Critérios de conclusão:

- os critérios funcionais da #28 passam em testes;
- total por categoria fecha exatamente com o total do período;
- meses parciais e encerrados seguem o contrato;
- `G/KG`, `ML/L`, `UNIT`, `FIXED/VARIABLE` e registros incompatíveis estão cobertos;
- nenhuma regra financeira é duplicada em telas ou componentes;
- lint, typecheck, testes e format check passam.

Gate de interrupção:

- parar se o schema atual não contiver informação suficiente para uma métrica aprovada; não inferir nem reescrever fatos históricos sem decisão.

## Task 4 — Validar e integrar os gráficos (#34)

> **Status:** implementação e validações automatizadas concluídas; homologação visual em aparelho Android pendente.

Objetivo: comprovar que `react-native-gifted-charts` atende aos três gráficos aprovados no stack atual antes de adotá-la nas telas.

Dependências:

- Task 1;
- acesso às referências visuais aprovadas;
- ambiente Android disponível para homologação e iOS quando houver ambiente disponível.

Entregável:

- Dependências compatíveis e três componentes de gráfico reutilizáveis, validados com dados fictícios e sem regra de negócio.

Sub-tasks:

- confirmar a documentação da versão Expo 57 antes de tocar em APIs Expo/React Native;
- instalar com `npx expo install react-native-gifted-charts expo-linear-gradient react-native-svg`;
- criar prova de conceito com barras verticais, barras horizontais e linha;
- encapsular a biblioteca em componentes controlados por props e tipos de dados próprios do app;
- aplicar tokens de cor, tipografia e espaçamento do MercadON;
- testar nomes longos, moeda brasileira, valores altos, poucos/muitos pontos e largura estreita;
- garantir que valores essenciais também existam como texto/lista acessível;
- validar renderização e interação em Android; validar iOS quando o ambiente estiver disponível;
- executar `npm run check` e `npx expo-doctor`.

Fora de escopo:

- consultar SQLite;
- calcular períodos, totais ou normalização;
- construir a Home ou as telas analíticas completas;
- adicionar tipos de gráfico fora do MVP.

Critérios de conclusão:

- os três gráficos representam os designs sem cortes ou rótulos ilegíveis;
- componentes recebem dados prontos e não importam repositories/services;
- informação não depende apenas de cor, tooltip ou gesto;
- a biblioteca funciona offline e no stack atual;
- validações automatizadas passam.

Gate de interrupção:

- parar após a prova de conceito para homologação visual no aparelho;
- se houver incompatibilidade, corte de conteúdo ou customização insuficiente, apresentar evidências e comparar uma alternativa antes de trocar a biblioteca.

## Task 5 — Transformar a Home em dashboard mensal (#29)

> **Status:** implementação concluída; homologação visual integrada pendente.

Objetivo: substituir o resumo administrativo atual pela Home mensal aprovada, mantendo acesso rápido a uma nova compra.

Dependências:

- Tasks 3 e 4 aprovadas;
- referências finais da Home no Figma.

Entregável:

- Home funcional com resumo do mês, comparação, evolução de seis meses, previews analíticos e estados progressivos.

Sub-tasks:

- adaptar repository/service/hook existentes ou substituí-los pelo consumidor da base analítica sem duplicar regra;
- destacar gasto acumulado do mês, compras concluídas e comparação monetária/percentual válida;
- renderizar evolução dos últimos seis meses e identificar visualmente o mês atual parcial;
- exibir Top 3 de categorias, produtos e variações apenas quando houver dados suficientes;
- manter **Registrar compra** acessível;
- tratar sem compras, poucos dados, carregamento e falha;
- preparar os destinos de navegação das análises, ativando cada link quando sua rota correspondente for entregue;
- garantir leitura em tela estreita, valores monetários grandes e leitor de tela;
- criar testes da composição de dados e dos estados progressivos.

Fora de escopo:

- implementar o conteúdo completo das telas #30–#33;
- alterar o fluxo operacional de compras;
- manter as antigas contagens como preenchimento sem significado.

Critérios de conclusão:

- os dados da #29 são derivados da base analítica;
- não há percentual enganoso ou variação inventada;
- estado vazio conduz à primeira compra;
- gráfico e previews possuem equivalentes textuais;
- layout aprovado funciona em telas pequenas;
- lint, typecheck, testes e format check passam.

Gate de interrupção:

- parar para homologação visual se a hierarquia, a densidade de dados ou o comportamento responsivo divergir do design aprovado.

## Task 6 — Entregar o histórico analítico de produto (#33)

> **Status:** implementação concluída; homologação visual integrada pendente.

Objetivo: criar primeiro o destino reutilizável que será aberto pelo ranking e pelas variações, evitando navegação temporariamente quebrada.

Dependências:

- Tasks 3 e 4;
- tela de histórico aprovada no Figma.

Entregável:

- Rota parametrizada de histórico do produto com métricas, linha de evolução e lista factual.

Sub-tasks:

- criar rota reutilizável por `productId` com `useLocalSearchParams` do Expo Router;
- exibir preço atual, mínimo e máximo somente com ocorrências compatíveis;
- renderizar linha cronológica com preço normalizado e unidade explícita;
- listar data, preço normalizado e mercado obrigatório de cada ocorrência usada;
- manter mercados arquivados identificáveis pelo cadastro preservado;
- tratar 0, 1 e múltiplas ocorrências sem inventar tendência;
- permitir abertura segura a partir do gerenciamento de Produtos;
- testar ordenação, compatibilidade, métricas e parâmetros inválidos.

Fora de escopo:

- ranking mensal de produtos;
- ranking de altas e quedas;
- editar compras a partir da análise.

Critérios de conclusão:

- todos os critérios da #33 passam;
- o gráfico e a lista representam exatamente o mesmo conjunto de ocorrências;
- não existe estado **Sem mercado**;
- registros incompatíveis continuam preservados, mas não contaminam as métricas;
- lint, typecheck, testes e format check passam.

Gate de interrupção:

- parar se o design não definir como diferenciar ocorrência incompatível excluída da série; não expor ou ocultar informação adicional por suposição.

## Task 7 — Entregar categorias e ranking mensal de produtos (#30 e #31)

> **Status:** implementação concluída; homologação visual integrada pendente.

Objetivo: disponibilizar as duas análises mensais baseadas em valor total gasto, compartilhando navegação de período e apresentação monetária.

Dependências:

- Tasks 3, 4 e 6;
- telas de categorias e ranking aprovadas no Figma.

Entregável:

- Rotas mensais de categorias e produtos, com componente compartilhado de seleção de mês e navegação funcional ao histórico.

Sub-tasks:

- criar seletor mensal controlado, iniciando no mês atual, bloqueando meses futuros e permitindo meses anteriores;
- implementar categorias em barras horizontais e lista textual ordenada por gasto;
- utilizar a categoria atual do produto, inclusive para compras antigas;
- apresentar **Sem categoria** quando aplicável e conferir fechamento com o total mensal;
- implementar ranking por soma de gasto do mesmo `productId`;
- manter produtos distintos no catálogo separados;
- navegar do produto selecionado para a rota entregue na Task 6;
- tratar meses vazios, nomes longos, listas extensas e valores monetários grandes;
- testar mudança de mês, ordenação, empates, categoria atual e navegação.

Fora de escopo:

- drill-down categoria → produtos;
- usar quantidade, peso ou frequência como critério de ranking;
- implementar altas e quedas de preço.

Critérios de conclusão:

- todos os critérios das issues #30 e #31 passam;
- o total das categorias coincide com o total mensal em centavos;
- ranking usa somente gasto agregado por `productId`;
- meses futuros são inacessíveis;
- histórico abre com o produto correto;
- lint, typecheck, testes e format check passam.

Gate de interrupção:

- parar se a barra horizontal não mantiver rótulos e valores legíveis na menor largura suportada; ajustar o componente aprovado antes de seguir.

## Task 8 — Entregar variações mensais de preço (#32)

> **Status:** implementação concluída; homologação visual integrada pendente.

Objetivo: apresentar maiores altas e quedas com comparação equivalente, contexto monetário e navegação ao histórico.

Dependências:

- Tasks 3 e 6;
- seletor mensal da Task 7;
- tela de variações aprovada no Figma.

Entregável:

- Rota mensal de variações com seções de altas e quedas, estados insuficientes e navegação ao produto.

Sub-tasks:

- selecionar somente produtos cuja ocorrência comparável mais recente pertence ao mês escolhido;
- exigir duas ocorrências compatíveis e usar a anterior imediatamente comparável;
- ordenar altas e quedas por percentual conforme contrato e desempate aprovado;
- exibir preço anterior, atual, percentual e unidade normalizada;
- distinguir alta e queda por texto/ícone, sem depender de verde/vermelho;
- navegar para o histórico entregue na Task 6;
- ativar o preview/link correspondente da Home;
- tratar ausência de variações, preço anterior zero e registros incompatíveis;
- testar `FIXED`, conversões equivalentes de `VARIABLE`, empates e fronteiras mensais.

Fora de escopo:

- prever preços futuros;
- comparar produtos diferentes;
- editar produto ou compra a partir do ranking.

Critérios de conclusão:

- todos os critérios da #32 passam;
- nenhum percentual divide por zero ou usa base incompatível;
- ordem é estável e reproduzível;
- Home, ranking e variações levam ao mesmo histórico reutilizável;
- lint, typecheck, testes e format check passam.

Gate de interrupção:

- parar se o tratamento aprovado para base zero não puder ser representado com clareza no design; solicitar ajuste textual antes de improvisar percentual.

## Task 9 — Executar regressão, acessibilidade e responsividade integradas

> **Status:** suíte automatizada, Expo Doctor e bundles Android/Web concluídos; validação em aparelho pendente.

Objetivo: comprovar que as análises funcionam juntas, preservam precisão e não regressam os fluxos das milestones anteriores.

Dependências:

- Tasks 2–8 concluídas.

Entregável:

- Suíte integrada passando e roteiro de homologação executado ou entregue ao Product Owner para os ambientes não disponíveis.

Sub-tasks:

- cobrir compra concluída → Home → categoria → ranking → histórico → variações;
- testar totais em centavos, fechamento por categoria e comparações mensais;
- testar reclassificação de produto e efeito retroativo nas categorias;
- testar arquivamento de produto, categoria e mercado sem perda dos fatos válidos;
- testar 0, 1, muitos registros, preço zero, meses vazios e datas limítrofes;
- validar leitor de tela/labels, ordem de foco e alternativas textuais dos gráficos;
- validar telas estreitas, texto ampliado e valores monetários longos;
- executar `npm run check` e `npx expo-doctor`;
- executar homologação Android e iOS quando o ambiente estiver disponível.

Fora de escopo:

- adicionar novas métricas ou gráficos;
- alterar regras aprovadas para fazer um teste passar;
- escrever a documentação final antes dos resultados reais.

Critérios de conclusão:

- suíte automatizada cobre os contratos críticos;
- nenhum cálculo usa ponto flutuante para armazenar dinheiro;
- informações essenciais permanecem disponíveis fora dos gráficos;
- fluxos de produtos, mercados e compras continuam funcionando;
- limitações de plataforma ficam explícitas e não são apresentadas como validação executada.

Gate de interrupção:

- parar diante de divergência entre Android e iOS, falha do Expo Doctor ou regressão de dados; corrigir ou obter decisão antes da documentação final.

## Task 10 — Documentar a implementação concluída

> **Status:** pendente da homologação visual da Task 9.

Objetivo: registrar somente após a validação como a Milestone 4 foi efetivamente implementada.

Dependências:

- Todas as Tasks de implementação e validação concluídas.

Entregável:

- `docs/implementacao/milestone-04.md` e documentos de domínio reconciliados com o código final.

Sub-tasks:

- revisar arquivos e comportamento finais;
- registrar arquitetura, queries, contratos de período, normalização e percentuais efetivos;
- listar dependencies, repositories, services, hooks, componentes e rotas entregues;
- registrar decisões de acessibilidade e responsividade;
- registrar comandos de validação e resultados realmente executados;
- incluir roteiro operacional e limitações remanescentes;
- reconciliar `docs/regras-de-negocio`, `src/domain/DOMAIN.md` e referências das issues.

Fora de escopo:

- implementar ou corrigir funcionalidades;
- antecipar resultados não validados;
- adicionar requisitos de uma milestone futura.

Critérios de conclusão:

- documentação descreve somente comportamento comprovado;
- links, comandos e exemplos são válidos;
- não restam divergências silenciosas entre issues, regras, código e documentação.

## Mapa de cobertura

| Issue      | Cobertura principal |
| ---------- | ------------------- |
| Data civil | Tasks 1 e 2         |
| #28        | Tasks 1 e 3         |
| #34        | Task 4              |
| #29        | Task 5              |
| #33        | Task 6              |
| #30        | Task 7              |
| #31        | Task 7              |
| #32        | Task 8              |
| Todas      | Tasks 9 e 10        |

## Observação sobre a ordem

A normalização da data civil foi isolada na Task 2 porque altera persistência e fluxos existentes antes de qualquer consulta mensal. A #33 foi posicionada antes de #31 e #32 porque é o destino de navegação das duas análises. Isso evita criar links quebrados ou telas temporárias. A Home continua sendo a primeira entrega visual após a base analítica e a prova de conceito dos gráficos, preservando a prioridade definida para a milestone.
