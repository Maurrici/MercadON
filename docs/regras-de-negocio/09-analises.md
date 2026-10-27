# 09 — Análises e indicadores

## Fontes e precisão

- **RN-ANL-001 — Fonte válida:** análises usam somente compras `COMPLETED`, compras ativas e itens ativos.
- **RN-ANL-002 — Precisão:** totais são calculados como inteiros em centavos; preços normalizados usam razões inteiras e arredondamento `half-up` apenas na apresentação.
- **RN-ANL-003 — Data civil:** a data da compra é `YYYY-MM-DD`, capturada no calendário local e persistida sem conversão posterior de fuso.

## Períodos

- **RN-ANL-004 — Mês atual:** comparar do primeiro dia até hoje com o mesmo intervalo do mês anterior. Se o dia não existir no mês anterior, usar o último dia disponível.
- **RN-ANL-005 — Mês encerrado:** comparar o mês completo com o mês anterior completo.
- **RN-ANL-006 — Evolução:** a Home mostra seis meses de calendário, incluindo o mês atual parcial e meses zerados.
- **RN-ANL-007 — Base mensal zero:** se o total anterior for zero, o percentual é indisponível. Mostrar diferença monetária e explicação; queda de um valor positivo para zero continua sendo `-100%`.

## Agregações

- **RN-ANL-008 — Produtos:** agregar gastos pelo mesmo `productId`; produtos diferentes no catálogo permanecem separados.
- **RN-ANL-009 — Categorias:** usar sempre a categoria atual do produto, inclusive para compras anteriores. Categoria nula aparece como **Sem categoria**.
- **RN-ANL-010 — Fechamento:** soma das categorias deve coincidir exatamente com o gasto total do período.
- **RN-ANL-011 — Métrica:** rankings de gasto usam valor total pago; quantidade, peso, volume e frequência são apenas contexto.

## Preços

- **RN-ANL-012 — Fixo:** comparar o preço da unidade comercial, sem converter automaticamente a embalagem para kg ou L.
- **RN-ANL-013 — Variável:** normalizar `G/KG` para kg, `ML/L` para L e `UNIT` para un.
- **RN-ANL-014 — Compatibilidade:** a configuração atual do produto determina quais snapshots históricos participam de métricas e gráficos.
- **RN-ANL-015 — Variação:** comparar a ocorrência concluída mais recente com a ocorrência comparável imediatamente anterior.
- **RN-ANL-016 — Preço anterior zero:** percentual indisponível e produto fora dos rankings; a ocorrência permanece no histórico. Queda de preço positivo para zero é `-100%`.

## Apresentação

- **RN-ANL-017 — Acessibilidade:** alta e queda usam texto/ícone além de cor; todo gráfico possui resumo ou lista textual equivalente.
- **RN-ANL-018 — Dados insuficientes:** não inventar tendência, percentual ou ranking quando os dados não sustentarem a métrica.
- **RN-ANL-019 — Mercado:** toda ocorrência histórica possui mercado, ainda que o cadastro esteja arquivado; não existe **Sem mercado**.

## Contrato técnico

Fórmulas, intervalos, unidades, desempates e estados completos estão em [`docs/planejamento/milestone-04-contratos.md`](../planejamento/milestone-04-contratos.md).

## Fontes

[#28 — Regras analíticas](https://github.com/Maurrici/MercadON/issues/28) · [#29 — Home](https://github.com/Maurrici/MercadON/issues/29) · [#30 — Categorias](https://github.com/Maurrici/MercadON/issues/30) · [#31 — Produtos](https://github.com/Maurrici/MercadON/issues/31) · [#32 — Variações](https://github.com/Maurrici/MercadON/issues/32) · [#33 — Histórico de preço](https://github.com/Maurrici/MercadON/issues/33).
