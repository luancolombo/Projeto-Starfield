/**
 * Ranking logic para vendors e hubs de venda em Starfield.
 *
 * Foi pensado para trabalhar com:
 * - data/resources.json
 * - data/manufactured-items.json
 * - data/vendors.json
 *
 * Nao depende de framework e pode ser usado tanto no frontend quanto no backend.
 */

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function indexById(items) {
  return new Map((items || []).map((item) => [item.id, item]));
}

function getItemKind(itemId, datasets) {
  const { resourcesById, manufacturedById } = datasets;

  if (resourcesById.has(itemId)) {
    return "resource";
  }

  if (manufacturedById.has(itemId)) {
    return "manufactured_item";
  }

  return "unknown";
}

function getItemById(itemId, datasets) {
  return datasets.resourcesById.get(itemId) || datasets.manufacturedById.get(itemId) || null;
}

function getItemSaleCategory(itemId, datasets) {
  const item = getItemById(itemId, datasets);
  if (!item) return "unknown";

  if (item.category === "organic" || item.category === "inorganic") {
    return "resources";
  }

  return "manufactured_items";
}

function vendorSupportsCategory(vendor, saleCategory) {
  return Array.isArray(vendor.buysCategories) && vendor.buysCategories.includes(saleCategory);
}

function vendorMeetsRequirements(vendor, options) {
  const requiredFlags = vendor.requirements || [];
  if (requiredFlags.length === 0) return true;

  const unlocked = new Set(options.unlockedFlags || []);
  return requiredFlags.every((flag) => unlocked.has(flag));
}

function hubMeetsRequirements(hub, options) {
  const requiredFlags = hub.requirements || [];
  if (requiredFlags.length === 0) return true;

  const unlocked = new Set(options.unlockedFlags || []);
  return requiredFlags.every((flag) => unlocked.has(flag));
}

function rarityWeight(rarity) {
  switch (normalizeText(rarity)) {
    case "common":
      return 0;
    case "uncommon":
      return 1;
    case "rare":
      return 2;
    case "exotic":
      return 3;
    case "unique":
      return 4;
    default:
      return 0;
  }
}

function getPreferredScoreField(saleCategory) {
  if (saleCategory === "resources") return "resourceScore";
  if (saleCategory === "manufactured_items") return "manufacturedScore";
  return "tradeScore";
}

function scoreVendor(vendor, context) {
  const {
    saleCategory,
    item,
    bulk = false,
    preferNoScan = false,
    preferEasyAccess = true
  } = context;

  let score = 0;
  const reasons = [];

  const preferredScoreField = getPreferredScoreField(saleCategory);
  score += (vendor[preferredScoreField] || 0) * 10;
  reasons.push(`base:${preferredScoreField}=${vendor[preferredScoreField] || 0}`);

  score += (vendor.tradeScore || 0) * 6;
  reasons.push(`trade=${vendor.tradeScore || 0}`);

  score += (vendor.convenienceScore || 0) * 8;
  reasons.push(`convenience=${vendor.convenienceScore || 0}`);

  if (vendor.vendorType === "trade_authority") {
    score += 18;
    reasons.push("trade_authority_bonus");
  }

  if (vendor.vendorType === "trade_authority_kiosk") {
    score += 10;
    reasons.push("kiosk_bonus");
  }

  if (bulk && Array.isArray(vendor.advantages) && vendor.advantages.includes("good_for_bulk_sales")) {
    score += 15;
    reasons.push("bulk_sales_bonus");
  }

  if (Array.isArray(vendor.advantages) && vendor.advantages.includes("vendor_cluster")) {
    score += 12;
    reasons.push("vendor_cluster_bonus");
  }

  if (saleCategory === "resources" && Array.isArray(vendor.advantages) && vendor.advantages.includes("resource_specialist")) {
    score += 12;
    reasons.push("resource_specialist_bonus");
  }

  if (saleCategory === "resources" && Array.isArray(vendor.advantages) && vendor.advantages.includes("resource_friendly")) {
    score += 8;
    reasons.push("resource_friendly_bonus");
  }

  if (preferNoScan && Array.isArray(vendor.advantages) && vendor.advantages.includes("no_scan")) {
    score += 20;
    reasons.push("no_scan_bonus");
  }

  if (preferEasyAccess && Array.isArray(vendor.advantages) && vendor.advantages.includes("easy_access")) {
    score += 10;
    reasons.push("easy_access_bonus");
  }

  if (preferEasyAccess && Array.isArray(vendor.advantages) && vendor.advantages.includes("spaceport")) {
    score += 8;
    reasons.push("spaceport_bonus");
  }

  if (item) {
    score += rarityWeight(item.rarity) * 3;
    reasons.push(`rarity_bonus=${rarityWeight(item.rarity) * 3}`);

    if (saleCategory === "manufactured_items" && item.baseValue >= 150) {
      score += 6;
      reasons.push("high_value_component_bonus");
    }

    if (saleCategory === "resources" && item.baseValue <= 10 && Array.isArray(vendor.advantages) && vendor.advantages.includes("vendor_cluster")) {
      score += 6;
      reasons.push("low_value_resource_cluster_bonus");
    }
  }

  return {
    score,
    reasons
  };
}

function scoreHub(hub, context, vendorsById) {
  const {
    saleCategory,
    bulk = false,
    preferNoScan = false
  } = context;

  let score = (hub.hubScore || 0) * 15;
  const reasons = [`base:hubScore=${hub.hubScore || 0}`];

  const topVendors = (hub.topVendorIds || [])
    .map((vendorId) => vendorsById.get(vendorId))
    .filter(Boolean);

  for (const vendor of topVendors) {
    const vendorScore = scoreVendor(vendor, context);
    score += vendorScore.score * 0.35;
  }

  if ((hub.bestFor || []).includes(saleCategory)) {
    score += 18;
    reasons.push("hub_best_for_category_bonus");
  }

  if (bulk && (hub.bestFor || []).includes("bulk_selling")) {
    score += 12;
    reasons.push("bulk_hub_bonus");
  }

  if (preferNoScan && (hub.reasons || []).some((reason) => normalizeText(reason).includes("sem scan"))) {
    score += 18;
    reasons.push("hub_no_scan_bonus");
  }

  return {
    score,
    reasons
  };
}

function buildDatasets({ resources, manufacturedItems, vendors }) {
  return {
    resources: resources.items || [],
    manufacturedItems: manufacturedItems.items || [],
    vendors: vendors.items || [],
    hubs: vendors.sellHubs || [],
    resourcesById: indexById(resources.items || []),
    manufacturedById: indexById(manufacturedItems.items || []),
    vendorsById: indexById(vendors.items || []),
    hubsById: indexById(vendors.sellHubs || [])
  };
}

function rankVendorsForItem(itemId, rawDatasets, options = {}) {
  const datasets = buildDatasets(rawDatasets);
  const item = getItemById(itemId, datasets);
  const saleCategory = getItemSaleCategory(itemId, datasets);

  const ranked = datasets.vendors
    .filter((vendor) => vendorMeetsRequirements(vendor, options))
    .filter((vendor) => vendorSupportsCategory(vendor, saleCategory))
    .map((vendor) => {
      const ranking = scoreVendor(vendor, {
        saleCategory,
        item,
        bulk: options.bulk,
        preferNoScan: options.preferNoScan,
        preferEasyAccess: options.preferEasyAccess !== false
      });

      return {
        ...vendor,
        ranking: {
          itemId,
          saleCategory,
          itemKind: getItemKind(itemId, datasets),
          score: Math.round(ranking.score),
          reasons: ranking.reasons
        }
      };
    })
    .sort((a, b) => b.ranking.score - a.ranking.score);

  return {
    item,
    itemId,
    saleCategory,
    results: ranked
  };
}

function rankHubsForItem(itemId, rawDatasets, options = {}) {
  const datasets = buildDatasets(rawDatasets);
  const item = getItemById(itemId, datasets);
  const saleCategory = getItemSaleCategory(itemId, datasets);

  const ranked = datasets.hubs
    .filter((hub) => hubMeetsRequirements(hub, options))
    .map((hub) => {
      const ranking = scoreHub(
        hub,
        {
          saleCategory,
          item,
          bulk: options.bulk,
          preferNoScan: options.preferNoScan,
          preferEasyAccess: options.preferEasyAccess !== false
        },
        datasets.vendorsById
      );

      return {
        ...hub,
        ranking: {
          itemId,
          saleCategory,
          score: Math.round(ranking.score),
          reasons: ranking.reasons
        }
      };
    })
    .sort((a, b) => b.ranking.score - a.ranking.score);

  return {
    item,
    itemId,
    saleCategory,
    results: ranked
  };
}

function rankBestSellOptions(itemId, rawDatasets, options = {}) {
  return {
    vendors: rankVendorsForItem(itemId, rawDatasets, options),
    hubs: rankHubsForItem(itemId, rawDatasets, options)
  };
}

function rankBySaleCategory(saleCategory, rawDatasets, options = {}) {
  const datasets = buildDatasets(rawDatasets);

  const vendors = datasets.vendors
    .filter((vendor) => vendorMeetsRequirements(vendor, options))
    .filter((vendor) => vendorSupportsCategory(vendor, saleCategory))
    .map((vendor) => {
      const ranking = scoreVendor(vendor, {
        saleCategory,
        item: null,
        bulk: options.bulk,
        preferNoScan: options.preferNoScan,
        preferEasyAccess: options.preferEasyAccess !== false
      });

      return {
        ...vendor,
        ranking: {
          score: Math.round(ranking.score),
          reasons: ranking.reasons
        }
      };
    })
    .sort((a, b) => b.ranking.score - a.ranking.score);

  const hubs = datasets.hubs
    .filter((hub) => hubMeetsRequirements(hub, options))
    .map((hub) => {
      const ranking = scoreHub(
        hub,
        {
          saleCategory,
          item: null,
          bulk: options.bulk,
          preferNoScan: options.preferNoScan,
          preferEasyAccess: options.preferEasyAccess !== false
        },
        datasets.vendorsById
      );

      return {
        ...hub,
        ranking: {
          score: Math.round(ranking.score),
          reasons: ranking.reasons
        }
      };
    })
    .sort((a, b) => b.ranking.score - a.ranking.score);

  return {
    saleCategory,
    vendors,
    hubs
  };
}

module.exports = {
  buildDatasets,
  getItemById,
  getItemKind,
  getItemSaleCategory,
  rankVendorsForItem,
  rankHubsForItem,
  rankBestSellOptions,
  rankBySaleCategory
};
