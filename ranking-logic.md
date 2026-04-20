# Ranking Logic - Vendors e Hubs

O modulo [vendor-ranking.js](C:\Users\luan_\Documents\Projeto Starfield\lib\vendor-ranking.js) implementa a logica de ranking para decidir onde vender `resources` e `manufactured items`.

## O que ele considera

- `resourceScore` para recursos organicos/inorganicos
- `manufacturedScore` para componentes manufaturados
- `tradeScore` como peso geral
- `convenienceScore` para acesso rapido
- bonus para:
  - `trade_authority`
  - `no_scan`
  - `easy_access`
  - `spaceport`
  - `vendor_cluster`
  - `resource_specialist`
  - venda em lote (`bulk`)

## Regras principais

### Se o item for `resource`

- usa `resourceScore` como peso principal
- favorece lojas com `resource_specialist` e `resource_friendly`
- favorece hubs com varias lojas quando o item tem valor baixo

### Se o item for `manufactured_item`

- usa `manufacturedScore` como peso principal
- aumenta levemente o peso de componentes valiosos
- tende a favorecer `Trade Authority` e hubs com varias lojas

### Se a venda for em lote

- favorece vendors com `good_for_bulk_sales`
- favorece hubs com `bulk_selling`
- favorece clusters de lojas

### Se o usuario quiser rota segura

- `preferNoScan: true` sobe bastante o peso de `The Den`

## API do modulo

### `rankVendorsForItem(itemId, datasets, options)`

Retorna os melhores vendors para um item especifico.

### `rankHubsForItem(itemId, datasets, options)`

Retorna os melhores hubs para um item especifico.

### `rankBestSellOptions(itemId, datasets, options)`

Retorna vendors e hubs ao mesmo tempo.

### `rankBySaleCategory(saleCategory, datasets, options)`

Retorna o ranking geral para:

- `resources`
- `manufactured_items`

## Exemplo de uso

```js
const resources = require("./data/resources.json");
const manufacturedItems = require("./data/manufactured-items.json");
const vendors = require("./data/vendors.json");

const {
  rankBestSellOptions,
  rankBySaleCategory
} = require("./lib/vendor-ranking");

const result = rankBestSellOptions(
  "resource-aluminum",
  { resources, manufacturedItems, vendors },
  {
    bulk: true,
    preferNoScan: false,
    preferEasyAccess: true,
    unlockedFlags: []
  }
);

console.log(result.vendors.results.slice(0, 3));
console.log(result.hubs.results.slice(0, 3));

const resourceCategoryRanking = rankBySaleCategory(
  "resources",
  { resources, manufacturedItems, vendors },
  { bulk: true }
);

console.log(resourceCategoryRanking.hubs.slice(0, 3));
```

## Flags suportadas

- `bulk`
- `preferNoScan`
- `preferEasyAccess`
- `unlockedFlags`

Exemplo de `unlockedFlags`:

```js
["crimson_fleet_access"]
```

Isso permite incluir `The Key` no ranking quando fizer sentido.
