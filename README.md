# MercadON

Aplicativo para organização de compras de supermercado e acompanhamento de gastos.

O MercadON tem como princípio oferecer uma experiência simples, gratuita em suas funcionalidades essenciais e offline-first.

## Stack

- React Native
- Expo
- Expo Router
- TypeScript
- npm

As versões das dependências são controladas pelo `package.json` e pelo `package-lock.json`.

## Executando o projeto

Instale as dependências:

```bash
npm ci
```

Inicie o ambiente de desenvolvimento:

```bash
npx expo start
```

Verifique os tipos:

```bash
npx tsc --noEmit
```

## Arquitetura

O projeto utiliza uma arquitetura simples, com separação de responsabilidades entre apresentação, domínio e infraestrutura.

A estrutura deve crescer conforme as necessidades reais do aplicativo.

### Estrutura de diretórios

| Diretório                    | Responsabilidade                                    |
| ---------------------------- | --------------------------------------------------- |
| `src/app/`                   | Rotas, layouts e telas do Expo Router               |
| `src/components/`            | Componentes reutilizáveis de interface              |
| `src/constants/`             | Constantes compartilhadas                           |
| `src/database/`              | Configuração e infraestrutura de persistência local |
| `src/database/migrations/`   | Evolução do esquema do banco                        |
| `src/database/repositories/` | Implementações de acesso aos dados locais           |
| `src/domain/models/`         | Modelos e tipos do domínio                          |
| `src/domain/enums/`          | Conjuntos de valores do domínio                     |
| `src/domain/repositories/`   | Contratos de repositories, quando necessários       |
| `src/hooks/`                 | Comportamento reutilizável associado ao React       |
| `src/services/`              | Coordenação de operações da aplicação               |
| `src/theme/`                 | Cores, tipografia e demais definições visuais       |
| `src/utils/`                 | Funções auxiliares genéricas                        |

Alguns diretórios serão introduzidos ou preenchidos conforme as funcionalidades forem implementadas.

### Regras de responsabilidade

- Telas não devem executar queries SQL diretamente.
- Componentes de apresentação não devem conhecer detalhes de persistência.
- Modelos e regras de domínio não devem depender do React Native.
- Services devem coordenar operações da aplicação quando essa separação agregar valor.
- Repositories devem concentrar o acesso aos dados.
- Hooks devem encapsular comportamentos associados ao React.
- Abstrações devem ser introduzidas quando resolverem necessidades concretas.

### Convenções de código

| Elemento   | Convenção            | Exemplo                 |
| ---------- | -------------------- | ----------------------- |
| Componente | PascalCase           | `ProductItem.tsx`       |
| Hook       | Prefixo use          | `useProducts.ts`        |
| Modelo     | PascalCase           | `Product.ts`            |
| Service    | camelCase com sufixo | `product.service.ts`    |
| Repository | camelCase com sufixo | `product.repository.ts` |
| Utilitário | camelCase            | `formatCurrency.ts`     |

Os imports internos entre diretórios diferentes devem utilizar preferencialmente o alias `@/`, configurado para representar `src/`.

### Evolução da persistência

O MercadON é offline-first.

A persistência local será a implementação inicial, permitindo que o aplicativo funcione sem conexão com a internet.

Quando necessário, contratos de repositories serão definidos para desacoplar as operações da aplicação dos mecanismos de armazenamento.

Futuramente, o aplicativo poderá integrar uma API e um serviço de sincronização sem abandonar obrigatoriamente a persistência local.

Não serão criadas implementações remotas, mecanismos de sincronização ou abstrações especulativas durante o MVP.

## Princípios de desenvolvimento

- Priorizar simplicidade e legibilidade.
- Evitar complexidade arquitetural prematura.
- Preservar o funcionamento offline.
- Separar regras de negócio de detalhes de infraestrutura.
- Desenvolver incrementalmente, seguindo as issues do projeto.
