# 03 — Mercados, categorias e busca

## Mercados

- **RN-MKT-001 — Cadastro:** `nome` é o único campo obrigatório no MVP. Endereço e geolocalização não são exigidos.
- **RN-MKT-002 — Identidade:** o nome completo identifica o registro. Impedir dois mercados com o mesmo nome normalizado, sem distinção de maiúsculas/minúsculas. **Não** inferir unidades por regras de nome: `Assaí`, `Assaí Mister Hull` e `Assaí Parangaba` podem ser registros diferentes.
- **RN-MKT-003 — Exclusão lógica:** a remoção da listagem não deve apagar compras antigas. Ao tentar cadastrar o mesmo mercado previamente excluído, oferecer **restauração**.
- **RN-MKT-004 — Mercado na compra:** toda compra deve possuir um mercado cadastrado. O usuário pode selecionar um existente ou criar um novo no contexto, mas não existe a opção **Sem mercado**. O mercado pode ser alterado durante a compra em andamento sem reiniciar os itens.

## Categorias

- **RN-CAT-001 — MVP:** categorias são **predefinidas**; usuário não precisa nem pode manter um catálogo livre de categorias nesta etapa.
- **RN-CAT-002 — Produto:** categoria é opcional, e pode ser atualizada sem mudar dados financeiros históricos.
- **RN-CAT-003 — Catálogo vigente:** **Hortifruti; Carnes, aves e peixes; Frios, laticínios e ovos; Padaria; Mercearia e despensa; Congelados e prontos; Doces, biscoitos e snacks; Bebidas; Limpeza; Higiene e cuidados pessoais; Bebê; Pet; Outros / Casa**. Cada categoria possui uma descrição curta com exemplos para orientar a seleção.
- **RN-CAT-004 — Unidades:** seleção dentro da lista controlada `un`, `g`, `kg`, `ml`, `L`; não há criação livre de unidades no MVP.

## Busca e filtros

- **RN-SRC-001 — Busca textual:** em Produtos, buscar por **nome e marca**; em Mercados, por **nome**. Resultados são atualizados conforme digitação e sem sensibilidade a maiúsculas/minúsculas.
- **RN-SRC-002 — Ordenação e vazios:** listagens possuem ordenação previsível, estado sem registros e estado sem correspondência, oferecendo caminho para novo cadastro.
- **RN-SRC-003 — Filtro por categoria em Produtos:** selecionar **uma ou mais categorias**, combinar filtro com texto, indicar filtros ativos e permitir limpá-los com facilidade.
- **RN-SRC-004 — Reutilização:** estrutura de filtros deve permitir critérios diferentes em futuras listagens; nesta milestone **não** há filtro por categoria dentro da compra em andamento.

## Fontes

[#13 — Mercados](https://github.com/Maurrici/MercadON/issues/13) · [#14 — Categorias](https://github.com/Maurrici/MercadON/issues/14) · [#16 — Busca](https://github.com/Maurrici/MercadON/issues/16) · [#22 — Filtros](https://github.com/Maurrici/MercadON/issues/22) · [seed de categorias](https://github.com/Maurrici/MercadON/blob/main/src/database/migrations/003_seed_categories.ts).
