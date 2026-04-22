const state = {
  datasets: null,
  catalog: [],
  filteredCatalog: [],
  selectedItemId: null,
  filterInputTimer: null,
  panelFocusTimer: null
};

const rarityOrder = ["common", "uncommon", "rare", "exotic", "unique"];

document.addEventListener("DOMContentLoaded", () => {
  initializeApp().catch((error) => {
    console.error(error);
    renderAppError(error);
  });
});

async function initializeApp() {
  const [resources, manufacturedItems, recipes, vendors, shipRankings, ships] = await Promise.all([
    fetchJson("./data/resources.json"),
    fetchJson("./data/manufactured-items.json"),
    fetchJson("./data/recipes.json"),
    fetchJson("./data/vendors.json"),
    fetchJson("./data/ship-rankings.json"),
    fetchJson("./data/ships.json")
  ]);

  state.datasets = {
    resources,
    manufacturedItems,
    recipes,
    vendors,
    shipRankings,
    ships,
    resourceMap: new Map(resources.items.map((item) => [item.id, item])),
    manufacturedMap: new Map(manufacturedItems.items.map((item) => [item.id, item])),
    recipeMap: new Map(recipes.items.map((item) => [item.outputItemId, item])),
    vendorMap: new Map(vendors.items.map((item) => [item.id, item])),
    shipMap: new Map(ships.items.map((item) => [item.id, item]))
  };

  state.catalog = [
    ...resources.items.map((item) => ({ ...item, saleCategory: "resources" })),
    ...manufacturedItems.items.map((item) => ({ ...item, saleCategory: "manufactured_items" }))
  ].sort(sortCatalogItems);

  populateSubtypeFilter();
  populateItemOptions();
  populateShipOptions();
  bindEvents();
  updateSummary();
  renderShipRankingPreview();
  applyFilters({ focusResults: false });
  initializeShipComparisonDefaults();
}

function renderShipRankingPreview() {
  const container = document.getElementById("ship-ranking-preview");
  const featuredRankingIds = ["balanced", "exploration", "combat"];
  const rankings = (state.datasets.shipRankings.rankings || []).filter((ranking) =>
    featuredRankingIds.includes(ranking.id)
  );

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

  const locations = Array.isArray(acquisition.locations)
    ? acquisition.locations
    : acquisition.locations
      ? [acquisition.locations]
      : [];

  const firstLocation = locations[0];
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
    const element = document.getElementById(id);
    element.addEventListener("input", () => scheduleFilterUpdate(true));
    element.addEventListener("change", () => {
      if (state.filterInputTimer) {
        window.clearTimeout(state.filterInputTimer);
        state.filterInputTimer = null;
      }

      applyFilters({ focusResults: true });
    });
  });

  document.getElementById("calculate-button").addEventListener("click", runSimulation);
  document.getElementById("compare-ships-button").addEventListener("click", runShipComparison);
  document.getElementById("compare-ship-a").addEventListener("keydown", handleCompareEnter);
  document.getElementById("compare-ship-b").addEventListener("keydown", handleCompareEnter);
}

function scheduleFilterUpdate(focusResults = false) {
  if (state.filterInputTimer) {
    window.clearTimeout(state.filterInputTimer);
  }

  state.filterInputTimer = window.setTimeout(() => {
    state.filterInputTimer = null;
    applyFilters({ focusResults });
  }, 180);
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

function populateItemOptions() {
  const datalist = document.getElementById("item-options");
  const uniqueNames = [...new Set(state.catalog.map((item) => item.name))].sort((a, b) =>
    a.localeCompare(b)
  );

  datalist.innerHTML = uniqueNames
    .map((name) => `<option value="${escapeHtml(name)}"></option>`)
    .join("");
}

function populateShipOptions() {
  const datalist = document.getElementById("ship-options");
  datalist.innerHTML = state.datasets.ships.items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((ship) => `<option value="${escapeHtml(ship.name)}"></option>`)
    .join("");
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

function applyFilters(options = {}) {
  const { focusResults = false } = options;
  const rawSearch = document.getElementById("search-input").value.trim();
  const search = rawSearch.toLowerCase();
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

  const exactSearchMatch = rawSearch
    ? state.filteredCatalog.find((item) => item.name.toLowerCase() === search)
    : null;

  if (
    state.selectedItemId &&
    !state.filteredCatalog.some((item) => item.id === state.selectedItemId)
  ) {
    state.selectedItemId = null;
  }

  if (exactSearchMatch) {
    state.selectedItemId = exactSearchMatch.id;
  } else if (!state.selectedItemId && state.filteredCatalog.length > 0) {
    state.selectedItemId = state.filteredCatalog[0].id;
  }

  updateSearchSelectionMeta();

  if (state.selectedItemId) {
    renderSelectedItem();
    syncCalculatorSelection();
    runSimulation();
    maybeFocusItemWorkspace(focusResults && Boolean(exactSearchMatch));
  } else {
    renderSelectedItem();
    syncCalculatorSelection();
    resetSimulation();
  }
}

function maybeFocusItemWorkspace(shouldFocus) {
  if (!shouldFocus || !state.selectedItemId) {
    return;
  }

  const detailPanel = document.querySelector(".detail-panel");
  const calculatorPanel = document.querySelector(".calculator-panel");

  if (!detailPanel || !calculatorPanel) {
    return;
  }

  detailPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  [detailPanel, calculatorPanel].forEach((panel) => {
    panel.classList.remove("panel-focus");
    void panel.offsetWidth;
    panel.classList.add("panel-focus");
  });

  if (state.panelFocusTimer) {
    window.clearTimeout(state.panelFocusTimer);
  }

  state.panelFocusTimer = window.setTimeout(() => {
    [detailPanel, calculatorPanel].forEach((panel) => panel.classList.remove("panel-focus"));
    state.panelFocusTimer = null;
  }, 1400);
}

function updateSearchSelectionMeta() {
  const meta = document.getElementById("search-selection-meta");
  const selectedItem = getSelectedItem();

  if (state.filteredCatalog.length === 0) {
    meta.textContent = "Nenhum item encontrado com os filtros atuais.";
    return;
  }

  if (!selectedItem) {
    meta.textContent = `${state.filteredCatalog.length} itens encontrados.`;
    return;
  }

  meta.textContent = `${state.filteredCatalog.length} itens encontrados. Ativo: ${selectedItem.name}.`;
}

function renderSelectedItem() {
  const item = getSelectedItem();
  const detail = document.getElementById("item-detail");

  if (!item) {
    detail.className = "detail-content empty-state";
    detail.textContent = "Pesquisa um item para ver os detalhes.";
    document.getElementById("vendor-ranking").className = "ranking-list empty-state";
    document.getElementById("vendor-ranking").textContent =
      "Pesquisa um item para rankear vendors.";
    document.getElementById("hub-ranking").className = "ranking-list empty-state";
    document.getElementById("hub-ranking").textContent =
      "Pesquisa um item para rankear hubs.";
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

  if (!item) return;

  const suggestedRate = suggestProductionRate(item);
  document.getElementById("production-rate").value = suggestedRate;
}

function runSimulation() {
  const item = getSelectedItem();
  if (!item) {
    resetSimulation();
    return;
  }

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

function resetSimulation() {
  document.getElementById("result-total-output").textContent = "--";
  document.getElementById("result-gross-revenue").textContent = "--";
  document.getElementById("result-net-profit").textContent = "--";
  document.getElementById("result-profit-hour").textContent = "--";
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

function initializeShipComparisonDefaults() {
  const sortedShips = state.datasets.ships.items
    .slice()
    .sort((a, b) => (b.scores?.balanced || 0) - (a.scores?.balanced || 0));

  const shipA = sortedShips[0];
  const shipB = sortedShips[1];

  if (!shipA || !shipB) {
    return;
  }

  document.getElementById("compare-ship-a").value = shipA.name;
  document.getElementById("compare-ship-b").value = shipB.name;
  runShipComparison();
}

function handleCompareEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    runShipComparison();
  }
}

function runShipComparison() {
  const container = document.getElementById("ship-compare-result");
  const inputA = document.getElementById("compare-ship-a").value.trim();
  const inputB = document.getElementById("compare-ship-b").value.trim();

  const shipA = findShipByName(inputA);
  const shipB = findShipByName(inputB);

  if (!shipA || !shipB) {
    container.className = "ship-compare-result empty-state";
    container.textContent = "Escolhe duas naves válidas da lista para comparar.";
    return;
  }

  if (shipA.id === shipB.id) {
    container.className = "ship-compare-result empty-state";
    container.textContent = "Escolhe duas naves diferentes para a comparação.";
    return;
  }

  container.className = "ship-compare-result";
  container.innerHTML = renderShipComparison(shipA, shipB);
}

function findShipByName(query) {
  if (!query) return null;

  const normalizedQuery = normalizeText(query);
  return (
    state.datasets.ships.items.find((ship) => normalizeText(ship.name) === normalizedQuery) ||
    state.datasets.ships.items.find((ship) => normalizeText(ship.name).includes(normalizedQuery)) ||
    null
  );
}

function renderShipComparison(shipA, shipB) {
  const metrics = [
    { label: "Ranking geral", getValue: (ship) => ship.scores?.balanced, format: formatScore, numeric: true },
    { label: "Ranking exploração", getValue: (ship) => ship.scores?.explorationFocused, format: formatScore, numeric: true },
    { label: "Ranking combate", getValue: (ship) => ship.scores?.combatFocused, format: formatScore, numeric: true },
    { label: "Classe", getValue: (ship) => ship.class, format: String, numeric: false },
    { label: "Fuel", getValue: (ship) => ship.fuel, format: formatNumber, numeric: true },
    { label: "Hull", getValue: (ship) => ship.hull, format: formatNumber, numeric: true },
    { label: "Cargo", getValue: (ship) => ship.cargo, format: formatNumber, numeric: true },
    { label: "Reactor", getValue: (ship) => ship.reactor, format: formatNumber, numeric: true },
    { label: "Crew", getValue: (ship) => ship.crew, format: formatNumber, numeric: true },
    { label: "Jump", getValue: (ship) => ship.jump, format: formatNumber, numeric: true },
    { label: "Shield", getValue: (ship) => ship.shield, format: formatNumber, numeric: true },
    { label: "Damage", getValue: (ship) => ship.damage, format: formatNumber, numeric: true },
    { label: "Valor", getValue: (ship) => ship.value, format: formatCredits, numeric: true }
  ];

  return `
    <div class="ship-compare-summary-grid">
      ${renderShipCompareSummary(shipA)}
      ${renderShipCompareSummary(shipB)}
    </div>

    <div class="ship-compare-table">
      <div class="ship-compare-row ship-compare-row-head">
        <span>Stat</span>
        <span>${escapeHtml(shipA.name)}</span>
        <span>${escapeHtml(shipB.name)}</span>
      </div>
      ${metrics
        .map((metric) => {
          const valueA = metric.getValue(shipA);
          const valueB = metric.getValue(shipB);
          const winnerA = metric.numeric && Number(valueA) > Number(valueB);
          const winnerB = metric.numeric && Number(valueB) > Number(valueA);

          return `
            <div class="ship-compare-row">
              <span class="ship-compare-label">${escapeHtml(metric.label)}</span>
              <span class="ship-compare-value ${winnerA ? "is-better" : ""}">${escapeHtml(metric.format(valueA))}</span>
              <span class="ship-compare-value ${winnerB ? "is-better" : ""}">${escapeHtml(metric.format(valueB))}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderShipCompareSummary(ship) {
  return `
    <article class="ship-compare-summary">
      <div class="ship-compare-top">
        <div>
          <div class="tag-list">
            ${renderTagList([
              `Class ${ship.class}`,
              ship.isDlc ? "DLC" : "Base Game"
            ])}
          </div>
          <h3>${escapeHtml(ship.name)}</h3>
        </div>
        <strong>${formatScore(ship.scores?.balanced)}</strong>
      </div>
      <div class="detail-meta">${escapeHtml(formatAcquisitionSummary(ship.acquisition))}</div>
      <div class="ship-compare-score-grid">
        <article class="detail-card">
          <span>Geral</span>
          <strong>${formatScore(ship.scores?.balanced)}</strong>
        </article>
        <article class="detail-card">
          <span>Exploração</span>
          <strong>${formatScore(ship.scores?.explorationFocused)}</strong>
        </article>
        <article class="detail-card">
          <span>Combate</span>
          <strong>${formatScore(ship.scores?.combatFocused)}</strong>
        </article>
      </div>
    </article>
  `;
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
  return `${new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 }).format(Number(value || 0))} cr`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

function formatScore(value) {
  return new Intl.NumberFormat("pt-PT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function toNumber(value, fallback = 0) {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
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
