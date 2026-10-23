# MercadON — Regras de negócio do MVP

**Consolidado em 22/10/2026.** Esta é a entrada rápida. As regras detalhadas e os pontos pendentes ficam em [docs/regras-de-negocio/README.md](docs/regras-de-negocio/README.md).

## Decisões essenciais

1. **Offline-first:** produtos, mercados e compras operam com dados locais; não dependem de conexão.
2. **Produtos:** `nome` obrigatório. Comercialização **quantidade fixa** (padrão, embalagem opcional) ou **medida variável** (unidade obrigatória, sem embalagem fixa).
3. **Histórico protegido:** se o produto aparecer em uma compra concluída, **forma de comercialização e medidas não podem ser editadas**. Nome, marca e categoria podem. Oferecer **criar novo produto com dados preenchidos**; preservar o original e as compras antigas.
4. **Catálogo:** não permitir identidade duplicada; cadastros excluídos logicamente devem oferecer **restauração**. Mercados podem ter nomes de filiais; categorias são predefinidas.
5. **Compra:** mercado é opcional (`Sem mercado`); criar/selecionar mercado durante o início da compra. **Máximo de uma compra em andamento.**
6. **Rascunho:** persistir ao iniciar e após cada alteração confirmada; retomar ao abrir o app ou ao tocar **Registrar compra**. Sair da tela não descarta. Descarte exige confirmação.
7. **Itens:** fixos são comprados por unidade comercial; variáveis pela medida efetivamente adquirida e preço total pago. Um mesmo produto não gera automaticamente duas linhas na mesma compra.
8. **Preços:** comparar **preço por unidade comercial** (fixo) ou **preço por unidade de medida** (variável), usando a última compra **concluída** daquele produto em qualquer mercado, nunca valores totais incompatíveis.
9. **Finalização:** exige ao menos um item e confirmação com o total; compra concluída entra no histórico. Data da compra pode ser corrigida.
10. **Histórico:** compras concluídas podem ser editadas; sua exclusão é definitiva e afeta análises, com confirmação. Exclusão de cadastros não apaga gastos históricos.

## Documentação por domínio

- [Fundamentos e dados](docs/regras-de-negocio/01-principios-e-dados.md)
- [Produtos e comercialização](docs/regras-de-negocio/02-produtos.md)
- [Mercados, categorias e busca](docs/regras-de-negocio/03-mercados-categorias-e-busca.md)
- [Ciclo de compras](docs/regras-de-negocio/04-ciclo-da-compra.md)
- [Itens, quantidades e preços](docs/regras-de-negocio/05-itens-e-precos.md)
- [Compras concluídas](docs/regras-de-negocio/06-compras-concluidas.md)
- [Experiência mobile](docs/regras-de-negocio/07-experiencia-mvp.md)
- [Pendências e divergências com o código](docs/regras-de-negocio/08-pendencias-e-divergencias.md)

**Atenção:** regras aprovadas ≠ funcionalidades implementadas. Consulte as [pendências](docs/regras-de-negocio/08-pendencias-e-divergencias.md) antes de alterar banco ou modelos.
