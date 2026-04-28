# Modelo Inicial - Assistente de Construcao de Naves

Este arquivo registra a primeira proposta de estrutura para o futuro assistente de construcao de naves.

## Objetivo

Permitir que o usuario:

- informe as pecas atuais da nave;
- escolha um objetivo como combate, exploracao, carga ou equilibrio;
- receba alertas sobre gargalos;
- veja sugestoes de upgrade por modulo;
- entenda por que determinada troca melhora ou piora a nave.

## Arquivos criados nesta primeira etapa

```text
data/
  ship-modules.json
  ship-builder-rules.json
```

## Ideia da estrutura

### 1. `ship-modules.json`

Cataloga os modulos da nave.

Campos base:

- `id`
- `name`
- `moduleType`
- `moduleClass`
- `manufacturer`
- `requiredLevel`
- `requiredSkills`
- `collectionStatus`
- `sourceUrl`
- `vendorSummary`
- `stats`
- `utilityTags`
- `notes`

### 2. `ship-builder-rules.json`

Guarda a logica que o assistente vai usar.

Blocos principais:

- `hardRules`
- `recommendationProfiles`
- `upgradeHeuristics`
- `gargaloChecks`
- `knownGaps`

## Tipos de modulo que valem a pena cobrir

- `reactor`
- `engine`
- `grav_drive`
- `shield_generator`
- `weapon`
- `fuel_tank`
- `cargo_hold`
- `cockpit`
- `hab`
- `landing_gear`
- `docker`
- `landing_bay`
- `structural`
- `equipment`
- `vehicle`

## Tipos de sugestao que o assistente pode dar depois

- melhor upgrade direto da peca atual;
- melhor upgrade dentro da mesma classe;
- melhor peca por custo-beneficio;
- melhor peca para exploracao;
- melhor peca para combate;
- melhor peca para carga;
- aviso de gargalo atual.

## Regras importantes para o futuro

- a classe do reactor limita a classe dos modulos classificados;
- a energia total usada nao pode passar da energia do reactor;
- a nave precisa de modulos obrigatorios para ser funcional;
- o landing thrust precisa acompanhar a massa total;
- a mobilidade pode ser estimada usando thrust, maneuvering thrust e massa;
- o perfil desejado muda a ordem de recomendacao.

## Proxima etapa recomendada

Com o catalogo base completo, a melhor sequencia agora seria:

1. Refinar `ship-modules.json` com verificacao vendor por vendor, requisitos extras e metadados mais profundos.
   Hoje todas as categorias publicas de ship modules da INARA ja estao catalogadas: `reactor`, `engine`, `grav_drive`, `shield_generator`, `weapon`, `fuel_tank`, `cargo_hold`, `cockpit`, `landing_gear`, `docker`, `landing_bay`, `hab`, `structural`, `equipment` e `vehicle`.
2. Criar um comparador de modulo atual vs modulo recomendado.
3. Montar um motor simples de score para combate, exploracao, carga e equilibrio.
4. Modelar compatibilidade por tamanho, snap points e restricoes reais de montagem.
5. Integrar isso na interface do site.
