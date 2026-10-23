# 02 — Produtos

## Cadastro

- **RN-PRD-001 — Obrigatoriedade:** `nome` é obrigatório. `marca` e `categoria` são opcionais.
- **RN-PRD-002 — Forma de comercialização:** todo produto é **quantidade fixa** ou **medida variável**. A opção inicial para cadastro rápido é **quantidade fixa**.
- **RN-PRD-003 — Quantidade fixa:** representa uma unidade comercial discreta (pacote, caixa, garrafa, peça etc.). O conteúdo da embalagem (`quantidade` + `unidade`) é **opcional**, mas esses dois campos devem ser informados juntos quando houver conteúdo declarado. Exemplo: café com pacote de `500 g`, comprado por quantidade de pacotes.
- **RN-PRD-004 — Medida variável:** representa quantidade medida no ato da compra (carnes, frios, frutas a peso etc.). **Unidade de medida obrigatória**; **não possui quantidade fixa de embalagem**. Exemplo: carne com unidade `kg`; peso efetivo será informado na compra.
- **RN-PRD-005 — Unidades suportadas no MVP:** `un`, `g`, `kg`, `ml`, `L`. Produtos fixos sem medida declarada continuam vendidos por `un`.
- **RN-PRD-006 — Cadastro contextual:** dentro da compra, permitir criar produto inexistente sem sair do fluxo; usar as mesmas validações do gerenciamento.

## Identidade e duplicidade

- **RN-PRD-007 — Identidade:** o conflito de duplicidade considera a combinação normalizada `nome + marca + forma de comercialização + quantidade da embalagem (quando aplicável) + unidade de embalagem/medida (quando aplicável)`; `categoria` não distingue produtos. A forma de comercialização integra a identidade, permitindo produtos equivalentes com formas diferentes.
- **RN-PRD-008 — Duplicatas:** impedir dois produtos com identidade idêntica; nomes iguais são permitidos quando algum outro dado da identidade é diferente. Comparação de texto deve ser consistente com a normalização cadastrada (sem distinguir maiúsculas/minúsculas).
- **RN-PRD-009 — Registro excluído encontrado:** oferecer **restauração** do produto já existente em vez de criar duplicata.

## Edição e proteção do histórico — DECISÃO FINAL

- **RN-PRD-010 — Sem compras concluídas:** permite editar normalmente nome, marca, categoria, forma de comercialização e medidas, respeitando as validações.
- **RN-PRD-011 — Com pelo menos uma compra concluída:** `forma de comercialização`, `quantidade da embalagem`, `unidade da embalagem` e `unidade de medida variável` ficam **protegidas / não editáveis**. Nome, marca e categoria podem ser corrigidos sem alterar fatos históricos.
- **RN-PRD-012 — Alternativa à edição protegida:** oferecer **criar novo produto com os dados preenchidos**, permitindo modificá-los para compras futuras. O original e suas referências históricas continuam intactos. Novo produto recebe UUID próprio e fica sujeito à verificação de duplicidade/restauração.
- **RN-PRD-013 — Sem reinterpretação retroativa:** é **proibido** converter quantidades antigas, remover itens antigos, reiniciar versões de histórico ou trocar o significado de preços já registrados por uma edição cadastral.
- **RN-PRD-014 — Proteção no domínio:** o bloqueio deve ser validado no serviço/repositório, não apenas por controles desabilitados na tela.

## Exclusão

- **RN-PRD-015 — Exclusão lógica:** tirar o produto da lista ativa sem perder referências históricas; se o usuário tentar recadastrá-lo com identidade igual, oferecer restauração.

## Texto recomendado

> **Informações protegidas.** Este produto já aparece em compras concluídas. Para preservar o histórico de preços, a forma de comercialização e as medidas não podem ser alteradas. Você pode criar um novo produto com essas informações atualizadas para usar nas próximas compras.

## Exemplos

| Cadastro | Tipo | Durante a compra | Base de comparação |
| --- | --- | --- | --- |
| Café 500 g | Quantidade fixa | 2 pacotes | R$/pacote |
| Detergente | Quantidade fixa | 2 unidades | R$/unidade |
| Carne bovina — kg | Medida variável | 1,275 kg | R$/kg |

## Fontes

[#12 — Cadastros](https://github.com/Maurrici/MercadON/issues/12) · [#14 — Categorias e unidades](https://github.com/Maurrici/MercadON/issues/14) · [#15 — Produtos](https://github.com/Maurrici/MercadON/issues/15) · [#24 — Adicionar e comparar](https://github.com/Maurrici/MercadON/issues/24). A regra de proteção do histórico é a decisão final do Product Owner em 22/10/2026 e substitui as propostas intermediárias.
