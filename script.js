const state = {
  datasets: null,
  catalog: [],
  filteredCatalog: [],
  selectedItemId: null
};

const rarityOrder = ["common", "uncommon", "rare", "exotic", "unique"];

document.addEventListener("DOMContentLoaded", () => {
  initializeApp().catch((error) => {
    console.error(error);
    renderAppError(error);
  });
});

async function initializeApp() {
  const [resources, manufacturedItems, recipes, vendors, shipRankings] = await Promise.all([
    fetchJson("./data/resources.json"),
    fetchJson("./data/manufactured-items.json"),
    fetchJson("./data/recipes.json"),
    fetchJson("./data/vendors.json"),
    fetchJson("./data/ship-rankings.json")
  ]);

  state.datasets = {
    resources,
    manufacturedItems,
    recipes,
    vendors,
    shipRankings,
    resourceMap: new Map(resources.items.map((item) => [item.id, item])),
    manufacturedMap: new Map(manufacturedItems.items.map((item) => [item.id, item])),
    recipeMap: new Map(recipes.items.map((item) => [item.outputItemId, item])),
    vendorMap: new Map(vendors.items.map((item) => [item.id, item]))
  };

  state.catalog = [
    ...resources.items.map((item) => ({ ...item, saleCategory: "resources" })),
    ...manufacturedItems.items.map((item) => ({ ...item, saleCategory: "manufactured_items" }))
  ].sort(sortCatalogItems);

  populateSubtypeFilter();
  bindEvents();
  updateSummary();
  renderShipRankingPreview();
  applyFilters();

  if (state.filteredCatalog.length > 0) {
    selectItem(state.filteredCatalog[0].id);
  }
}

function renderShipRankingPreview() {
  const container = document.getElementById("ship-ranking-preview");
  const rankings = state.datasets.shipRankings.rankings || [];

  if (rankings.length === 0) {
    container.className = "ship-preview-stack empty-state";
    container.textContent = "Nenhum ranking de naves encontrado.";
    return;
  }

  container.className = "ship-preview-stack";
  container.innerHTML = rankings
    .map((ranking) => {
      const topShips = ranking.items.slice(0, 10);

      return `
        <article class="ship-ranking-card" id="preview-${escapeHtml(ranking.id)}">
          <div class="ship-ranking-head">
            <div>
              <span class="detail-meta">${escapeHtml(ranking.name)}</span>
              <strong>Top 10</strong>
            </div>
          </div>
          <ol class="compact-ranking">
            ${topShips
              .map(
                (ship) => `
                  <li>
                    <span>
                      ${ship.rank}. ${escapeHtml(ship.name)}
                      <small>${escapeHtml(formatAcquisitionSummary(ship.acquisition))}</small>
                    </span>
                    <strong>${formatNumber(ship.score)}</strong>
                  </li>
                `
              )
              .join("")}
          </ol>
          <a class="mini-button full-width-button" href="./ship-rankings.html#${escapeHtml(ranking.id)}">Mostrar top 50</a>
        </article>
      `;
    })
    .join("");
}

function formatAcquisitionSummary(acquisition) {
  if (!acquisition || acquisition.status === "not_collected") {
    return "Aquisição a verificar";
  }

  if (acquisition.method === "quest_reward") {
    return acquisition.notes?.[0] || "Recompensa de missão";
  }

  if (acquisition.method === "piracy") {
    return "Não comprável; adquirir por pirataria";
  }

  const firstLocation = acquisition.locations?.[0];
  if (!firstLocation) {
    return "Vendor verificado";
  }

  const level = firstLocation.requiredLevel ? ` • lvl ${firstLocation.requiredLevel}+` : "";
  const system = firstLocation.system ? `${firstLocation.system} • ` : "";
  return `${system}${firstLocation.vendor}${level}`;
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json();
}

function bindEvents() {
  [
    "search-input",
    "category-filter",
    "subtype-filter",
    "rarity-filter",
    "mineable-filter"
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", applyFilters);
    document.getElementById(id).addEventListener("change", applyFilters);
  });

  document.getElementById("calculate-button").addEventListener("click", runSimulation);
}

function populateSubtypeFilter() {
  const subtypeFilter = document.getElementById("subtype-filter");
  const subtypes = new Set();

  for (const item of state.catalog) {
    if (item.category) {
      subtypes.add(item.category);
    }
  }

  const options = Array.from(subtypes).sort();
  for (const subtype of options) {
    const option = document.createElement("option");
    option.value = subtype;
    option.textContent = humanizeKey(subtype);
    subtypeFilter.appendChild(option);
  }
}

function updateSummary() {
  document.getElementById("summary-total-items").textContent = String(state.catalog.length);
  document.getElementById("summary-total-recipes").textContent = String(
    state.datasets.recipes.items.length
  );
  document.getElementById("summary-total-vendors").textContent = String(
    state.datasets.vendors.items.length
  );
  document.getElementById("summary-total-hubs").textContent = String(
    state.datasets.vendors.sellHubs.length
  );

  const bestResource = [...state.datasets.resources.items].sort(sortByValueDescending)[0];
  const bestManufactured = [...state.datasets.manufacturedItems.items].sort(sortByValueDescending)[0];
  const bestHub = [...state.datasets.vendors.sellHubs].sort(
    (a, b) => (b.hubScore || 0) - (a.hubScore || 0)
  )[0];

  document.getElementById("best-resource-name").textContent = bestResource?.name || "--";
  document.getElementById("best-resource-meta").textContent = bestResource
    ? `${humanizeKey(bestResource.rarity)} • ${formatCredits(bestResource.baseValue)}`
    : "--";

  document.getElementById("best-manufactured-name").textContent =
    bestManufactured?.name || "--";
  document.getElementById("best-manufactured-meta").textContent = bestManufactured
    ? `${humanizeKey(bestManufactured.rarity)} • ${formatCredits(bestManufactured.baseValue)}`
    : "--";

  document.getElementById("best-hub-name").textContent = bestHub?.name || "--";
  document.getElementById("best-hub-meta").textContent = bestHub
    ? `Hub Score ${bestHub.hubScore} • ${bestHub.system}`
    : "--";
}

function applyFilters() {
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const category = document.getElementById("category-filter").value;
  const subtype = document.getElementById("subtype-filter").value;
  const rarity = document.getElementById("rarity-filter").value;
  const mineableOnly = document.getElementById("mineable-filter").checked;

  state.filteredCatalog = state.catalog.filter((item) => {
    if (category !== "all" && item.saleCategory !== category) return false;
    if (subtype !== "all" && item.category !== subtype) return false;
    if (rarity !== "all" && item.rarity !== rarity) return false;
    if (mineableOnly && !item.isMineable) return false;

    if (search) {
      const haystack = [
        item.name,
        item.symbol,
        item.category,
        item.rarity,
        item.saleCategory
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  renderCatalogTable();
  document.getElementById("table-results-count").textContent = `${state.filteredCatalog.length} resultados`;

  if (
    state.selectedItemId &&
    !state.filteredCatalog.some((item) => item.id === state.selectedItemId)
  ) {
    state.selectedItemId = null;
  }

  if (!state.selectedItemId && state.filteredCatalog.length > 0) {
    selectItem(state.filteredCatalog[0].id);
  } else if (state.selectedItemId) {
    renderSelectedItem();
  }
}

function renderCatalogTable() {
  const tableBody = document.getElementById("catalog-table-body");
  tableBody.innerHTML = "";

  for (const item of state.filteredCatalog) {
    const row = document.createElement("tr");
    row.dataset.itemId = item.id;
    if (item.id === state.selectedItemId) {
      row.classList.add("is-selected");
    }

    row.innerHTML = `
      <td>
        <strong>${escapeHtml(item.name)}</strong>
      </td>
      <td>
        <span class="pill ${item.saleCategory === "resources" ? "resource" : "manufactured"}">
          ${item.saleCategory === "resources" ? "Resource" : "Manufactured"}
        </span>
      </td>
      <td class="rarity-${item.rarity}">${humanizeKey(item.rarity)}</td>
      <td>${formatCredits(item.baseValue)}</td>
      <td>${formatNumber(item.mass)}</td>
      <td>${escapeHtml(humanizeKey(item.category || "--"))}</td>
    `;

    row.addEventListener("click", () => selectItem(item.id));
    tableBody.appendChild(row);
  }
}

function selectItem(itemId) {
  state.selectedItemId = itemId;
  renderCatalogTable();
  renderSelectedItem();
  syncCalculatorSelection();
  runSimulation();
}

function renderSelectedItem() {
  const item = getSelectedItem();
  const detail = document.getElementById("item-detail");

  if (!item) {
    detail.className = "detail-content empty-state";
    detail.textContent = "Nenhum item selecionado.";
    document.getElementById("vendor-ranking").className = "ranking-list empty-state";
    document.getElementById("vendor-ranking").textContent =
      "Escolha um item para rankear vendors.";
    document.getElementById("hub-ranking").className = "ranking-list empty-state";
    document.getElementById("hub-ranking").textContent =
      "Escolha um item para rankear hubs.";
    return;
  }

  const recipe = state.datasets.recipeMap.get(item.id);
  const sourceTypes = item.sourceTypes || [];

  detail.className = "detail-content";
  detail.innerHTML = `
    <div class="detail-header">
      <div class="tag-list">
        ${renderTagList([
          item.saleCategory === "resources" ? "Resource" : "Manufactured",
          humanizeKey(item.category),
          humanizeKey(item.rarity)
        ])}
      </div>
      <h3>${escapeHtml(item.name)}</h3>
      <div class="detail-meta">
        ${item.symbol ? `Sigla ${escapeHtml(item.symbol)} • ` : ""}
        ID ${escapeHtml(item.id)}
      </div>
    </div>

    <div class="detail-grid">
      <article class="detail-card">
        <span>Valor base</span>
        <strong>${formatCredits(item.baseValue)}</strong>
      </article>
      <article class="detail-card">
        <span>Massa</span>
        <strong>${formatNumber(item.mass)}</strong>
      </article>
      <article class="detail-card">
        <span>Minerável</span>
        <strong>${item.isMineable ? "Sim" : "Não"}</strong>
      </article>
      <article class="detail-card">
        <span>Receita</span>
        <strong>${recipe ? "Disponível" : "Não mapeada"}</strong>
      </article>
    </div>

    <div>
      <div class="detail-meta">Fontes</div>
      <div class="tag-list">
        ${renderTagList(sourceTypes.length ? sourceTypes.map(humanizeKey) : ["Não informado"])}
      </div>
    </div>

    ${
      recipe
        ? `
          <div>
            <div class="detail-meta">Receita</div>
            <div class="tag-list">
              ${renderTagList(recipe.inputs.map((input) => `${input.quantity}x ${resolveItemName(input.itemId)}`))}
            </div>
          </div>
        `
        : ""
    }
  `;

  renderVendorRanking(item);
  renderHubRanking(item);
}

function renderVendorRanking(item) {
  const container = document.getElementById("vendor-ranking");
  const ranked = rankVendorsForItem(item);

  if (ranked.length === 0) {
    container.className = "ranking-list empty-state";
    container.textContent = "Nenhum vendor compatível com este item.";
    return;
  }

  container.className = "ranking-list";
  container.innerHTML = ranked
    .slice(0, 3)
    .map(
      (vendor) => `
        <article class="ranking-item">
          <div class="ranking-top">
            <div class="ranking-title">
              <strong>${escapeHtml(vendor.name)}</strong>
              <span class="ranking-meta">${escapeHtml(vendor.shopName)} • ${escapeHtml(vendor.location.city)}</span>
            </div>
            <span class="score-badge">${vendor.rankingScore}</span>
          </div>
          <div class="detail-meta">${escapeHtml(vendor.location.system)} • ${escapeHtml(vendor.vendorType)}</div>
          <div class="reason-list">${vendor.reasonChips.map(renderReasonChip).join("")}</div>
        </article>
      `
    )
    .join("");
}

function renderHubRanking(item) {
  const container = document.getElementById("hub-ranking");
  const ranked = rankHubsForItem(item);

  if (ranked.length === 0) {
    container.className = "ranking-list empty-state";
    container.textContent = "Nenhum hub compatível com este item.";
    return;
  }

  container.className = "ranking-list";
  container.innerHTML = ranked
    .slice(0, 3)
    .map(
      (hub) => `
        <article class="ranking-item">
          <div class="ranking-top">
            <div class="ranking-title">
              <strong>${escapeHtml(hub.name)}</strong>
              <span class="ranking-meta">${escapeHtml(hub.system)} • ${hub.topVendorIds.length} vendors-chave</span>
            </div>
            <span class="score-badge">${hub.rankingScore}</span>
          </div>
          <div class="reason-list">${hub.reasons.map(renderReasonChip).join("")}</div>
        </article>
      `
    )
    .join("");
}

function syncCalculatorSelection() {
  const item = getSelectedItem();
  document.getElementById("selected-item-name").value = item?.name || "";

  const suggestedRate = suggestProductionRate(item);
  document.getElementById("production-rate").value = suggestedRate;
}

function runSimulation() {
  const item = getSelectedItem();
  if (!item) return;

  const extractorCount = toNumber(document.getElementById("extractor-count").value, 0);
  const productionRate = toNumber(document.getElementById("production-rate").value, 0);
  const periodHours = toNumber(document.getElementById("period-hours").value, 0);
  const operationalCost = toNumber(document.getElementById("operational-cost").value, 0);

  const totalOutput = extractorCount * productionRate * 60 * periodHours;
  const grossRevenue = totalOutput * (item.baseValue || 0);
  const netProfit = grossRevenue - operationalCost;
  const profitHour = periodHours > 0 ? netProfit / periodHours : 0;

  document.getElementById("result-total-output").textContent = formatNumber(totalOutput);
  document.getElementById("result-gross-revenue").textContent = formatCredits(grossRevenue);
  document.getElementById("result-net-profit").textContent = formatCredits(netProfit);
  document.getElementById("result-profit-hour").textContent = formatCredits(profitHour);
}

function rankVendorsForItem(item) {
  const saleCategory = item.saleCategory;
  const mineableOnly = document.getElementById("mineable-filter").checked;

  return state.datasets.vendors.items
    .filter((vendor) => (vendor.requirements || []).length === 0)
    .filter((vendor) => (vendor.buysCategories || []).includes(saleCategory))
    .map((vendor) => {
      let score = 0;
      const reasons = [];

      score += (vendor.tradeScore || 0) * 6;
      score += (vendor.convenienceScore || 0) * 7;
      score += ((saleCategory === "resources" ? vendor.resourceScore : vendor.manufacturedScore) || 0) * 11;

      if (vendor.vendorType === "trade_authority") {
        score += 16;
        reasons.push("Trade Authority");
      }

      if ((vendor.advantages || []).includes("vendor_cluster")) {
        score += 10;
        reasons.push("Cluster de lojas");
      }

      if ((vendor.advantages || []).includes("easy_access")) {
        score += 8;
        reasons.push("Acesso fácil");
      }

      if (saleCategory === "resources" && (vendor.advantages || []).includes("resource_specialist")) {
        score += 12;
        reasons.push("Especialista em resources");
      }

      if (saleCategory === "resources" && (vendor.advantages || []).includes("resource_friendly")) {
        score += 8;
        reasons.push("Bom para resources");
      }

      if (mineableOnly && (vendor.advantages || []).includes("good_for_bulk_sales")) {
        score += 8;
        reasons.push("Bom para venda em lote");
      }

      if (item.baseValue >= 100) {
        score += 5;
        reasons.push("Bom para item valioso");
      }

      return {
        ...vendor,
        rankingScore: Math.round(score),
        reasonChips: reasons.slice(0, 3)
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

function rankHubsForItem(item) {
  const saleCategory = item.saleCategory;

  return state.datasets.vendors.sellHubs
    .filter((hub) => (hub.requirements || []).length === 0)
    .map((hub) => {
      let score = (hub.hubScore || 0) * 15;

      if ((hub.bestFor || []).includes(saleCategory)) {
        score += 18;
      }

      if ((hub.bestFor || []).includes("bulk_selling")) {
        score += 10;
      }

      if (item.baseValue >= 100) {
        score += 6;
      }

      return {
        ...hub,
        rankingScore: Math.round(score)
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

function getSelectedItem() {
  return state.catalog.find((item) => item.id === state.selectedItemId) || null;
}

function suggestProductionRate(item) {
  if (!item) return 1;
  if (item.saleCategory === "manufactured_items") return 0.5;
  if (item.rarity === "common") return 1.5;
  if (item.rarity === "uncommon") return 1.2;
  if (item.rarity === "rare") return 0.8;
  return 0.5;
}

function resolveItemName(itemId) {
  return (
    state.datasets.resourceMap.get(itemId)?.name ||
    state.datasets.manufacturedMap.get(itemId)?.name ||
    itemId
  );
}

function renderTagList(items) {
  return items
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("");
}

function renderReasonChip(reason) {
  return `<span class="reason-chip">${escapeHtml(reason)}</span>`;
}

function sortCatalogItems(a, b) {
  const valueDiff = (b.baseValue || 0) - (a.baseValue || 0);
  if (valueDiff !== 0) return valueDiff;

  const rarityDiff = rarityOrder.indexOf(b.rarity) - rarityOrder.indexOf(a.rarity);
  if (rarityDiff !== 0) return rarityDiff;

  return a.name.localeCompare(b.name);
}

function sortByValueDescending(a, b) {
  return (b.baseValue || 0) - (a.baseValue || 0);
}

function humanizeKey(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCredits(value) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 0
  }).format(Number(value || 0)) + " cr";
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

function toNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderAppError(error) {
  document.body.innerHTML = `
    <main style="padding:32px;font-family:Space Grotesk,sans-serif;color:#eef7fb;background:#07131d;min-height:100vh">
      <h1 style="font-family:Rajdhani,sans-serif">Falha ao carregar o dashboard</h1>
      <p>Confirma se estás a correr o projeto num servidor local, como o Live Server do VS Code.</p>
      <pre style="white-space:pre-wrap;color:#ffb6a3">${escapeHtml(error.message || String(error))}</pre>
    </main>
  `;
}
