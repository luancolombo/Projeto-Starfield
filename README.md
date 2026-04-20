# Starfield Outpost Ledger

Projeto de estudo feito para explorar uma ideia simples: criar um site estático que ajude a comparar recursos, itens manufaturados, lucro de entrepostos e rankings de naves no Starfield.

Minha stack principal é Java, então este projeto foi criado justamente para praticar um pouco de HTML, CSS e JavaScript sem depender de backend, framework ou banco de dados.

## O que o projeto faz

- Lista recursos e itens manufaturados do jogo usando arquivos JSON locais.
- Mostra informações de vendors para recursos, itens e naves.
- Calcula estimativas simples de lucro para mineração e manufatura.
- Exibe rankings de naves por diferentes contextos, como exploração, combate, compráveis, classes e midgame.
- Permite abrir a página de rankings e escolher qual ranking visualizar por um menu.

## Por que fiz esse projeto

A ideia nasceu como um estudo para entender se seria possível montar uma ferramenta útil para entrepostos do Starfield usando apenas front-end básico.

O foco não foi criar algo perfeito ou comercial. Foi praticar:

- organização de dados em JSON;
- consumo de JSON com JavaScript;
- manipulação de DOM;
- criação de filtros, rankings e tabelas;
- estruturação de um projeto simples para GitHub;
- um pouco de design visual com CSS puro.

## Stack usada

- HTML
- CSS
- JavaScript
- JSON
- PowerShell para alguns scripts de geração/organização dos dados

Não existe backend neste momento. O site lê os arquivos dentro da pasta `data` diretamente pelo navegador.

## Como rodar localmente

Como o projeto carrega arquivos JSON com `fetch`, o ideal é rodar com um servidor local simples.

Se você usa VS Code:

1. Instale a extensão `Live Server`.
2. Abra a pasta do projeto no VS Code.
3. Clique com o botão direito no `index.html`.
4. Escolha `Open with Live Server`.

Depois disso, o navegador deve abrir o site localmente.

## Estrutura principal

```text
.
|-- index.html
|-- ship-rankings.html
|-- styles.css
|-- script.js
|-- ship-rankings.js
|-- data/
|   |-- resources.json
|   |-- manufactured-items.json
|   |-- recipes.json
|   |-- vendors.json
|   |-- ships.json
|   `-- ship-rankings.json
|-- tools/
`-- lib/
```

## Sobre os dados

Os dados foram organizados em arquivos JSON para estudo e prototipagem. Algumas informações foram catalogadas manualmente com base em consulta pública e conferência dentro do contexto do jogo.

O layout, a estrutura do site e a lógica do projeto foram criados do zero para este estudo. A intenção não foi copiar nenhuma página existente.

Este projeto não é oficial, não tem ligação com a Bethesda e pode conter informações incompletas ou que mudem com atualizações, DLCs ou diferenças no jogo.

## Status atual

O projeto já tem:

- catálogo de recursos;
- catálogo de itens manufaturados;
- receitas;
- vendors;
- rankings de naves;
- dados de aquisição de várias naves;
- ranking midgame com vendors preenchidos;
- ranking principal de exploração/combate com dados de aquisição preenchidos.

Ainda existem dados que podem ser melhorados ou completados, principalmente no catálogo completo de naves.

## Ideias para evoluir

- Melhorar os filtros nas tabelas.
- Criar busca por nome de nave, recurso ou item.
- Adicionar favoritos.
- Melhorar a calculadora de lucro com custos e tempo de produção.
- Separar melhor rankings por tipo de jogador.
- Futuramente migrar para uma stack com backend, como Java ou Python, se fizer sentido.

## Observação

Este é um projeto pessoal de aprendizado. O objetivo principal é estudar, testar ideias e praticar front-end usando um tema que eu gosto.
