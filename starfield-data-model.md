# Modelo de Dados - Site de Lucro de Entreposto Starfield

Este modelo foi pensado para comecar sem banco de dados, usando arquivos `JSON`, mas ja estruturado para migrar depois para `PostgreSQL`, `SQLite` ou outro banco sem retrabalho grande.

## Objetivos do modelo

- Catalogar recursos, componentes e itens manufaturados
- Filtrar por raridade, valor, tipo e origem
- Calcular producao por extrator
- Estimar lucro por hora, dia ou ciclo
- Simular cadeias de manufatura com materias-primas e itens intermediarios
- Permitir expansao futura para planetas, biomas, energia e logistica

## Estrutura recomendada

### 1. `resources`

Guarda recursos base do jogo, principalmente os usados em mineracao ou coleta.

Campos:

- `id`: identificador interno
- `name`: nome do recurso
- `symbol`: sigla do recurso, quando existir
- `category`: `inorganic`, `organic`, `liquid`, `gas`, `manufactured`
- `rarity`: `common`, `uncommon`, `rare`, `exotic`, `unique`
- `baseValue`: valor base do item
- `mass`: peso
- `sourceTypes`: fontes possiveis, como `extractor`, `flora`, `fauna`, `vendor`
- `isMineable`: se pode ser extraido diretamente no entreposto
- `notes`: observacoes livres
- `externalIds`: ids vindos de wiki, game files ou outras fontes

Exemplo:

```json
{
  "id": "resource-aluminum",
  "name": "Aluminum",
  "symbol": "Al",
  "category": "inorganic",
  "rarity": "common",
  "baseValue": 7,
  "mass": 1,
  "sourceTypes": ["extractor", "vendor"],
  "isMineable": true,
  "notes": "Recurso comum e importante para construcao",
  "externalIds": {
    "game8ItemId": "557D"
  }
}
```

### 2. `manufactured_items`

Itens produzidos em cadeia, como componentes e materiais refinados.

Campos:

- `id`
- `name`
- `category`: `component`, `fabricated`, `industrial`, `pharma`, `food`
- `rarity`
- `baseValue`
- `mass`
- `craftingStation`: maquina ou bancada necessaria
- `craftTimeSeconds`: tempo de fabricacao por unidade ou lote
- `batchSize`: quantidade produzida por ciclo
- `notes`

Exemplo:

```json
{
  "id": "item-adaptive-frame",
  "name": "Adaptive Frame",
  "category": "component",
  "rarity": "common",
  "baseValue": 24,
  "mass": 2,
  "craftingStation": "industrial_workbench",
  "craftTimeSeconds": 10,
  "batchSize": 1,
  "notes": "Bom candidato para simulacao de lucro inicial"
}
```

### 3. `recipes`

Relaciona o que entra e o que sai em cada processo de manufatura.

Campos:

- `id`
- `outputItemId`: item produzido
- `outputQuantity`
- `inputs`: lista de insumos
- `stationType`
- `craftTimeSeconds`
- `requiredSkills`: opcional
- `unlockCondition`: pesquisa, perk ou quest

Exemplo:

```json
{
  "id": "recipe-adaptive-frame",
  "outputItemId": "item-adaptive-frame",
  "outputQuantity": 1,
  "inputs": [
    { "itemId": "resource-aluminum", "quantity": 1 },
    { "itemId": "resource-iron", "quantity": 1 }
  ],
  "stationType": "industrial_workbench",
  "craftTimeSeconds": 10,
  "requiredSkills": [],
  "unlockCondition": null
}
```

### 4. `planets`

Base para sugerir onde montar entrepostos.

Campos:

- `id`
- `name`
- `systemName`
- `bodyType`: `planet` ou `moon`
- `resources`: recursos detectaveis no corpo celeste
- `biomes`: biomas conhecidos
- `hasFlora`
- `hasFauna`
- `hasWater`
- `environment`: radiacao, temperatura, atmosfera e gravidade
- `notes`

Exemplo:

```json
{
  "id": "planet-jemison",
  "name": "Jemison",
  "systemName": "Alpha Centauri",
  "bodyType": "planet",
  "resources": ["resource-water", "resource-lead", "resource-argon"],
  "biomes": ["temperate", "wetlands"],
  "hasFlora": true,
  "hasFauna": true,
  "hasWater": true,
  "environment": {
    "gravity": 0.91,
    "temperature": "temperate",
    "atmosphere": "standard_o2",
    "hazards": []
  },
  "notes": "Exemplo apenas; ideal validar com fonte primaria"
}
```

### 5. `extractors`

Representa os tipos de extrator e sua taxa-base.

Campos:

- `id`
- `name`
- `resourceCategory`: que tipo suporta
- `supportedResourceIds`: opcional, quando algum for exclusivo
- `productionPerMinute`
- `powerConsumption`
- `requiredCrew`: opcional
- `notes`

Exemplo:

```json
{
  "id": "extractor-solid-basic",
  "name": "Solid Extractor",
  "resourceCategory": "inorganic",
  "supportedResourceIds": [],
  "productionPerMinute": 1,
  "powerConsumption": 5,
  "requiredCrew": 0,
  "notes": "Taxa ficticia para modelagem inicial; validar no jogo depois"
}
```

### 6. `profit_simulations`

Esse conjunto pode nem precisar ser persistido no comeco. Pode ser calculado em tempo real no frontend. Mesmo assim, vale definir o formato.

Campos:

- `id`
- `mode`: `mining` ou `manufacturing`
- `targetItemId`
- `quantityGoal`
- `periodHours`
- `selectedExtractorId`
- `extractorCount`
- `productionPerHour`
- `grossRevenue`
- `estimatedCosts`
- `netProfit`
- `assumptions`
- `createdAt`

Exemplo:

```json
{
  "id": "sim-001",
  "mode": "mining",
  "targetItemId": "resource-aluminum",
  "quantityGoal": 500,
  "periodHours": 10,
  "selectedExtractorId": "extractor-solid-basic",
  "extractorCount": 9,
  "productionPerHour": 50,
  "grossRevenue": 3500,
  "estimatedCosts": 0,
  "netProfit": 3500,
  "assumptions": [
    "Preco baseado no valor base",
    "Sem considerar perks de comercio",
    "Sem gargalos logisticos"
  ],
  "createdAt": "2026-04-17T10:00:00Z"
}
```

## Relacionamentos principais

- Um `resource` pode aparecer em varios `planets`
- Um `manufactured_item` normalmente tem uma `recipe`
- Uma `recipe` usa varios `resources` ou `manufactured_items` como insumo
- Um `extractor` atende um ou mais `resources`
- Uma `profit_simulation` aponta para um item-alvo e para os parametros usados no calculo

## Estrutura de arquivos para comecar sem banco

```text
data/
  resources.json
  manufactured-items.json
  recipes.json
  planets.json
  extractors.json
```

## Formulas base

### Mineracao

```text
producao_por_hora = productionPerMinute * 60 * extractorCount
receita_bruta = producao_por_hora * periodHours * baseValue
lucro_liquido = receita_bruta - estimatedCosts
```

### Manufatura

```text
custo_dos_insumos = soma(insumo.quantidade * valor_do_insumo)
receita_do_item = outputQuantity * baseValue
lucro_por_ciclo = receita_do_item - custo_dos_insumos
lucro_por_hora = lucro_por_ciclo * (3600 / craftTimeSeconds)
```

## Campos que valem a pena adicionar depois

- `vendorPrices`: preco medio de compra e venda por comerciante
- `skillModifiers`: impacto de perks no lucro
- `researchRequirements`: pesquisa necessaria para fabricar
- `powerGrid`: custo energetico do entreposto
- `cargoLinks`: tempo e limite logistico entre bases
- `biomeAvailability`: recurso por bioma, nao so por planeta
- `purityMultiplier`: se a taxa de extracao variar por local

## Recomendacao pratica para MVP

Comecar so com estes arquivos:

- `resources.json`
- `recipes.json`
- `extractors.json`

Com isso, voce ja consegue entregar:

- lista de minerais por raridade e valor
- filtro por tipo
- calculadora de quantos extratores precisa para produzir `x` por hora
- simulador basico de lucro de manufatura

## Ordem ideal de implementacao

1. Catalogo de recursos
2. Calculadora de mineracao
3. Catalogo de itens manufaturados
4. Simulador de receitas
5. Sugestao de melhor planeta ou recurso por rentabilidade

## Observacao importante

Para o MVP, o melhor campo economico e `baseValue`, porque ele e facil de catalogar. Mas isso nao e o mesmo que lucro real de venda em todas as situacoes do jogo. Se quiser uma simulacao mais fiel depois, vale separar:

- `baseValue`
- `estimatedSellValue`
- `estimatedBuyValue`

Assim o site nao fica preso a uma unica interpretacao de preco.
