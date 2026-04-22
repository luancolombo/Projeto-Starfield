# Starfield Outpost Ledger

Projeto de estudo feito para testar uma ideia simples: criar um site estatico para ajudar com entrepostos, recursos, manufatura, lucro e comparacao de naves no Starfield.

Minha stack principal e Java, entao este projeto nasceu justamente para praticar HTML, CSS e JavaScript de um jeito mais leve, sem backend, framework ou banco de dados.

## O que o projeto faz

- Lista resources e manufactured items a partir de arquivos JSON locais.
- Mostra detalhe do item selecionado com valor, categoria, receita e fontes.
- Exibe melhores vendors e melhores hubs de venda para o item pesquisado.
- Calcula uma estimativa simples de producao e lucro para entrepostos.
- Traz comparador de naves lado a lado com stats e pontuacoes do site.
- Mostra rankings de naves na home e uma pagina separada com top 50 por contexto.
- Usa autocomplete na busca de itens e na busca de naves.

## Por que fiz esse projeto

A ideia foi estudar se daria para montar uma ferramenta util para Starfield usando so front-end basico e arquivos JSON.

O foco nunca foi fazer algo comercial ou super robusto. Foi praticar:

- organizacao de dados em JSON;
- consumo de JSON com JavaScript;
- manipulacao de DOM;
- filtros, comparadores e rankings;
- layout responsivo com CSS puro;
- estrutura de projeto simples para GitHub.

## Stack usada

- HTML
- CSS
- JavaScript
- JSON
- PowerShell para gerar e organizar parte dos dados

Hoje o projeto continua sem backend. O site le os arquivos da pasta `data` diretamente no navegador.

## Como rodar localmente

Como o projeto usa `fetch` para carregar JSON, o ideal e abrir com um servidor local simples.

Se voce usa VS Code:

1. Instale a extensao `Live Server`.
2. Abra a pasta do projeto no VS Code.
3. Clique com o botao direito em `index.html`.
4. Escolha `Open with Live Server`.

## Estrutura principal

```text
.
|-- index.html
|-- ship-rankings.html
|-- styles.css
|-- script.js
|-- ship-rankings.js
|-- README.md
|-- data/
|   |-- resources.json
|   |-- manufactured-items.json
|   |-- recipes.json
|   |-- vendors.json
|   |-- ships.json
|   |-- ship-rankings.json
|   |-- ship-acquisition-backlog.json
|   |-- extractors.json
|   |-- planets.json
|   `-- profit-simulations.json
|-- tools/
|   |-- build-ship-data.ps1
|   |-- build-ship-acquisition-backlog.ps1
|   `-- fetch-inara-ship-page.ps1
`-- lib/
```

## Sobre os dados

Os dados foram organizados em JSON para estudo e prototipagem. A parte de naves, vendors e aquisicao foi sendo catalogada com base em consulta publica, principalmente usando a INARA como referencia.

O layout, a estrutura do site e a logica do projeto foram montados do zero para este estudo. A intencao nao foi copiar nenhuma pagina existente.

Este projeto nao e oficial, nao tem ligacao com a Bethesda e pode conter pontos que ainda merecem revisao.

## Status atual

Hoje o projeto ja tem:

- catalogo de resources;
- catalogo de manufactured items;
- receitas em JSON;
- vendors e hubs de venda;
- calculadora de lucro/saida para entrepostos;
- comparador de naves;
- rankings de naves com pagina dedicada;
- top 3 rankings principais destacados na home;
- autocomplete na busca de itens e naves;
- foco automatico na area de detalhe/calculadora quando um item valido e pesquisado;
- catalogo de naves com aquisicao preenchida;
- backlog de aquisicao de naves zerado;
- vendors de todas as naves restantes preenchidos no dataset atual.

## O que foi atualizado mais recentemente

As atualizacoes mais recentes do projeto foram:

- fechamento do catalogo de aquisicao/vendors das naves restantes;
- geracao final de `ships.json` sem entradas `not_collected`;
- `ship-acquisition-backlog.json` zerado;
- ajuste da home para mostrar so os 3 rankings principais;
- mudanca do bloco de detalhe do item para a coluna da esquerda;
- comparador de naves no lugar do catalogo antigo;
- autocomplete no buscador de itens;
- melhoria no scroll automatico para so descer quando o nome digitado bate com um item valido.

## Ideias para evoluir

Algumas ideias que ainda acho legais para continuar estudando:

- criar filtro avancado de naves por class, metodo de aquisicao e faixa de level;
- adicionar pagina individual de nave com historico, vendors e ranking detalhado;
- mostrar comparacao visual de lucro entre mineracao e manufatura;
- permitir fixar favoritos para itens e naves;
- adicionar export simples de comparacoes e rankings em JSON ou CSV;
- criar um modo "progressao" com sugestoes de naves early, mid e late game;
- melhorar a calculadora com receita encadeada e custo por insumo;
- no futuro, testar uma migracao para backend em Java ou Python so como estudo.

## Observacao

Este e um projeto pessoal de aprendizado. O objetivo principal e estudar, testar ideias e praticar fora da minha stack principal usando um tema que eu gosto.
