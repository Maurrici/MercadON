# MercadON

Aplicativo para organização de compras de supermercado e acompanhamento de gastos.

O MercadON tem como princípio oferecer uma experiência simples, gratuita em suas funcionalidades essenciais e offline-first.

## Download para Android

[Baixar a versão mais recente do MercadON (APK)](https://github.com/Maurrici/MercadON/releases/latest/download/MercadON.apk)

O Android pode solicitar autorização para instalar aplicativos provenientes do navegador ou do gerenciador de arquivos. O APK é publicado junto às [releases do projeto](https://github.com/Maurrici/MercadON/releases), onde também ficam disponíveis as notas de cada versão.

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

### Integração contínua

Pull Requests e pushes para `main` são validados pelo GitHub Actions.

A pipeline executa:

- instalação reproduzível com `npm ci`;
- ESLint;
- TypeScript;
- verificação de formatação com Prettier.

As mesmas validações podem ser executadas localmente com:

```bash
npm run check
```

## Publicando um APK

O projeto usa o EAS Build para gerar um APK assinado e o GitHub Actions para disponibilizá-lo em uma GitHub Release. O perfil `preview` de `eas.json` gera um APK de distribuição interna, instalável diretamente em dispositivos Android.

### Configuração inicial

Esta configuração precisa ser feita apenas uma vez por quem mantém o repositório:

1. Crie uma conta gratuita no [Expo](https://expo.dev/signup) e autentique o EAS CLI:

   ```bash
   npx eas-cli@latest login
   ```

2. Vincule o repositório a um projeto do Expo:

   ```bash
   npx eas-cli@latest init
   ```

   O comando adicionará `extra.eas.projectId` à configuração do aplicativo. Essa alteração deve ser commitada.

3. Execute o primeiro build para o EAS criar e armazenar com segurança a credencial de assinatura Android:

   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

4. Crie um access token nas configurações da conta do Expo. No GitHub, acesse **Settings > Secrets and variables > Actions**, crie um repository secret chamado `EXPO_TOKEN` e informe esse token como valor.

### Gerando uma versão

1. Confirme que a versão desejada está na branch selecionada para o workflow.
2. No GitHub, abra **Actions > Android Release > Run workflow**.
3. Informe uma tag inédita no formato `v1.0.0` e inicie o workflow.

O workflow valida o projeto, solicita o build ao EAS, baixa o APK resultante e cria uma GitHub Release contendo o arquivo `MercadON.apk`. Como o nome do arquivo é estável, o link de download deste README sempre aponta para o APK da release mais recente.

Para gerar o APK manualmente sem publicar uma release, execute:

```bash
npx eas-cli@latest build --platform android --profile preview
```

Essa distribuição não exige uma conta de desenvolvedor da Google Play. O primeiro build exige interação para confirmar a criação da credencial Android; os builds seguintes podem ser executados pelo workflow com o `EXPO_TOKEN`.
