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
  const [resources, manufacturedItems, recipes, vendors, shipRankings, ships, shipModules, shipBuilderRules] = await Promise.all([
    fetchJson("./data/resources.json"),
    fetchJson("./data/manufactured-items.json"),
    fetchJson("./data/recipes.json"),
    fetchJson("./data/vendors.json"),
    fetchJson("./data/ship-rankings.json"),
    fetchJson("./data/ships.json"),
    fetchJson("./data/ship-modules.json"),
    fetchJson("./data/ship-builder-rules.json")
  ]);

  const modulesByType = groupModulesByType(shipModules.items);
  const builderMaxima = buildShipBuilderMaxima(modulesByType);

  state.datasets = {
    resources,
    manufacturedItems,
    recipes,
    vendors,
    shipRankings,
    ships,
    shipModules,
    shipBuilderRules,
    resourceMap: new Map(resources.items.map((item) => [item.id, item])),
    manufacturedMap: new Map(manufacturedItems.items.map((item) => [item.id, item])),
    recipeMap: new Map(recipes.items.map((item) => [item.outputItemId, item])),
    vendorMap: new Map(vendors.items.map((item) => [item.id, item])),
    shipMap: new Map(ships.items.map((item) => [item.id, item])),
    moduleMap: new Map(shipModules.items.map((item) => [item.id, item])),
    modulesByType,
    builderMaxima
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

  if (hasHomeShipBuilder()) {
    populateShipBuilderOptions();
    runShipBuilderAutoBuild();
  }
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

  if (hasHomeShipBuilder()) {
    document.getElementById("load-ship-preset-button").addEventListener("click", runShipBuilderShipPreset);
    document.getElementById("analyze-build-button").addEventListener("click", runShipBuilderAnalysis);
    document.getElementById("auto-build-button").addEventListener("click", runShipBuilderAutoBuild);
    document.getElementById("builder-reactor").addEventListener("change", populateShipBuilderOptions);
    document.getElementById("builder-reactor").addEventListener("input", handleBuilderInput);
    document.getElementById("builder-class-filter").addEventListener("change", populateShipBuilderOptions);
    [
      "builder-profile",
      "builder-class-filter",
      "builder-reference-ship",
      "builder-engine",
      "builder-engine-count",
      "builder-shield",
      "builder-grav-drive",
      "builder-weapon",
      "builder-weapon-count",
      "builder-cargo-hold",
      "builder-cargo-count",
      "builder-fuel-tank",
      "builder-fuel-count"
    ].forEach((id) => {
      const element = document.getElementById(id);
      element.addEventListener("keydown", handleBuilderEnter);
      element.addEventListener("change", handleBuilderInput);
    });
  }
}

function hasHomeShipBuilder() {
  return Boolean(document.getElementById("builder-reactor"));
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

function populateShipBuilderOptions() {
  const reactor = findModuleByTypeAndName("reactor", document.getElementById("builder-reactor")?.value);
  const reactorClass = reactor?.moduleClass || null;
  const classFilter = getBuilderClassFilter();
  const datalistConfig = [
    ["builder-reactor-options", "reactor"],
    ["builder-engine-options", "engine"],
    ["builder-shield-options", "shield_generator"],
    ["builder-grav-drive-options", "grav_drive"],
    ["builder-weapon-options", "weapon"],
    ["builder-cargo-options", "cargo_hold"],
    ["builder-fuel-options", "fuel_tank"]
  ];

  datalistConfig.forEach(([datalistId, moduleType]) => {
    const datalist = document.getElementById(datalistId);
    const modules = (state.datasets.modulesByType[moduleType] || [])
      .filter((module) =>
        shouldIncludeModuleForBuilderFilter(module, moduleType, classFilter, reactorClass)
      )
      .slice()
      .sort(sortModulesForBuilderOptions);

    datalist.innerHTML = modules
      .map((module) => `<option value="${escapeHtml(module.name)}"></option>`)
      .join("");
  });
}

function getBuilderClassFilter() {
  return document.getElementById("builder-class-filter")?.value || "all";
}

function shouldIncludeModuleForBuilderFilter(module, moduleType, classFilter, reactorClass) {
  if (moduleType !== "reactor" && reactorClass && !isModuleCompatibleWithReactor(module, reactorClass)) {
    return false;
  }

  if (classFilter === "all" || !module?.moduleClass) {
    return true;
  }

  return String(module.moduleClass).toUpperCase() === String(classFilter).toUpperCase();
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

function handleBuilderEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    runShipBuilderAnalysis();
  }
}

function handleBuilderInput() {
  const result = document.getElementById("ship-builder-result");
  if (result.classList.contains("is-ready")) {
    runShipBuilderAnalysis();
  }
}

function runShipBuilderShipPreset() {
  const ship = findShipByName(document.getElementById("builder-reference-ship").value.trim());
  const container = document.getElementById("ship-builder-result");

  if (!ship) {
    container.className = "ship-builder-result empty-state";
    container.textContent = "Escolhe uma nave valida em 'Nave de referencia' para carregar um preset aproximado.";
    return;
  }

  const profile = getBuilderProfile(document.getElementById("builder-profile").value);
  const preset = buildShipPresetFromShip(ship, profile);

  if (!preset?.reactor) {
    container.className = "ship-builder-result empty-state";
    container.textContent = "Nao consegui montar um preset aproximado para essa nave com os modulos atuais.";
    return;
  }

  document.getElementById("builder-class-filter").value = ship.class || "all";
  document.getElementById("builder-reactor").value = preset.reactor?.name || "";
  populateShipBuilderOptions();
  document.getElementById("builder-engine").value = preset.engine?.name || "";
  document.getElementById("builder-engine-count").value = String(preset.engineCount || 1);
  document.getElementById("builder-shield").value = preset.shield?.name || "";
  document.getElementById("builder-grav-drive").value = preset.gravDrive?.name || "";
  document.getElementById("builder-weapon").value = preset.weapon?.name || "";
  document.getElementById("builder-weapon-count").value = String(preset.weaponCount || 1);
  document.getElementById("builder-cargo-hold").value = preset.cargoHold?.name || "";
  document.getElementById("builder-cargo-count").value = String(preset.cargoCount || 1);
  document.getElementById("builder-fuel-tank").value = preset.fuelTank?.name || "";
  document.getElementById("builder-fuel-count").value = String(preset.fuelCount || 0);

  runShipBuilderAnalysis();
}

function runShipBuilderAutoBuild() {
  const profile = getBuilderProfile(document.getElementById("builder-profile").value);
  const referenceShip = findShipByName(document.getElementById("builder-reference-ship").value.trim());
  const classFilter = getBuilderClassFilter();
  const targetClass = classFilter !== "all" ? classFilter : referenceShip?.class || "C";
  const countPreset = getAutoBuildCountPreset(profile.id);
  const reactor = pickBestModuleForAutoBuild("reactor", profile, {
    exactClass: targetClass
  });

  if (!reactor) {
    const container = document.getElementById("ship-builder-result");
    container.className = "ship-builder-result empty-state";
    container.textContent = "Nao encontrei reactor suficiente para montar a auto-build.";
    return;
  }

  document.getElementById("builder-reactor").value = reactor.name;
  if (classFilter === "all") {
    document.getElementById("builder-class-filter").value = reactor.moduleClass || "all";
  }

  populateShipBuilderOptions();

  const effectiveClass = reactor.moduleClass || targetClass;
  const autoModules = {
    engine: pickBestModuleForAutoBuild("engine", profile, { exactClass: effectiveClass, reactorClass: effectiveClass }),
    shield: pickBestModuleForAutoBuild("shield_generator", profile, { exactClass: effectiveClass, reactorClass: effectiveClass }),
    gravDrive: pickBestModuleForAutoBuild("grav_drive", profile, { exactClass: effectiveClass, reactorClass: effectiveClass }),
    weapon: pickBestModuleForAutoBuild("weapon", profile, { exactClass: effectiveClass, reactorClass: effectiveClass }),
    cargoHold: pickBestModuleForAutoBuild("cargo_hold", profile, { reactorClass: effectiveClass }),
    fuelTank: pickBestModuleForAutoBuild("fuel_tank", profile, { reactorClass: effectiveClass })
  };

  document.getElementById("builder-engine").value = autoModules.engine?.name || "";
  document.getElementById("builder-shield").value = autoModules.shield?.name || "";
  document.getElementById("builder-grav-drive").value = autoModules.gravDrive?.name || "";
  document.getElementById("builder-weapon").value = autoModules.weapon?.name || "";
  document.getElementById("builder-cargo-hold").value = autoModules.cargoHold?.name || "";
  document.getElementById("builder-fuel-tank").value = autoModules.fuelTank?.name || "";
  document.getElementById("builder-engine-count").value = String(countPreset.engineCount);
  document.getElementById("builder-weapon-count").value = String(countPreset.weaponCount);
  document.getElementById("builder-cargo-count").value = String(countPreset.cargoCount);
  document.getElementById("builder-fuel-count").value = String(countPreset.fuelCount);

  runShipBuilderAnalysis();
}

function runShipBuilderAnalysis() {
  const container = document.getElementById("ship-builder-result");
  const selection = readShipBuilderSelection();
  const missingCoreModules = getMissingCoreModules(selection);

  if (missingCoreModules.length > 0) {
    container.className = "ship-builder-result empty-state";
    container.textContent = `Falta escolher: ${missingCoreModules.join(", ")}.`;
    return;
  }

  if (!selection.reactor) {
    container.className = "ship-builder-result empty-state";
    container.textContent = "Escolhe um reactor valido para abrir a analise da build.";
    return;
  }

  const analysis = analyzeShipBuild(selection);
  container.className = "ship-builder-result is-ready";
  container.innerHTML = renderShipBuilderAnalysis(analysis);
}

function readShipBuilderSelection() {
  return {
    profileId: document.getElementById("builder-profile").value,
    referenceShip: findShipByName(document.getElementById("builder-reference-ship").value.trim()),
    reactor: findModuleByTypeAndName("reactor", document.getElementById("builder-reactor").value.trim()),
    engine: findModuleByTypeAndName("engine", document.getElementById("builder-engine").value.trim()),
    engineCount: clamp(toNumber(document.getElementById("builder-engine-count").value, 1), 1, 8),
    shield: findModuleByTypeAndName("shield_generator", document.getElementById("builder-shield").value.trim()),
    gravDrive: findModuleByTypeAndName("grav_drive", document.getElementById("builder-grav-drive").value.trim()),
    weapon: findModuleByTypeAndName("weapon", document.getElementById("builder-weapon").value.trim()),
    weaponCount: clamp(toNumber(document.getElementById("builder-weapon-count").value, 1), 1, 12),
    cargoHold: findModuleByTypeAndName("cargo_hold", document.getElementById("builder-cargo-hold").value.trim()),
    cargoCount: clamp(toNumber(document.getElementById("builder-cargo-count").value, 1), 1, 12),
    fuelTank: findModuleByTypeAndName("fuel_tank", document.getElementById("builder-fuel-tank").value.trim()),
    fuelCount: clamp(toNumber(document.getElementById("builder-fuel-count").value, 0), 0, 12)
  };
}

function getMissingCoreModules(selection) {
  const labels = [];

  if (!selection.reactor) labels.push("reactor");
  if (!selection.engine) labels.push("engine");
  if (!selection.shield) labels.push("shield generator");
  if (!selection.gravDrive) labels.push("grav drive");
  if (!selection.weapon) labels.push("weapon");
  if (!selection.cargoHold) labels.push("cargo hold");

  return labels;
}

function analyzeShipBuild(selection, options = {}) {
  const { includeRecommendations = true } = options;
  const profile = getBuilderProfile(selection.profileId);
  const reactorClass = selection.reactor?.moduleClass || "C";
  const incompatibilities = [
    ["engine", selection.engine],
    ["shield", selection.shield],
    ["grav drive", selection.gravDrive],
    ["weapon", selection.weapon]
  ]
    .filter(([, module]) => module && !isModuleCompatibleWithReactor(module, reactorClass))
    .map(([label, module]) => `${label}: ${module.name}`);

  const totals = {
    reactorPower: selection.reactor?.stats?.power || 0,
    allocatedPower:
      ((selection.engine?.stats?.maxPower || 0) * selection.engineCount) +
      (selection.shield?.stats?.maxPower || 0) +
      (selection.gravDrive?.stats?.maxPower || 0) +
      ((selection.weapon?.stats?.maxPower || 0) * selection.weaponCount),
    mass:
      (selection.reactor?.stats?.mass || 0) +
      ((selection.engine?.stats?.mass || 0) * selection.engineCount) +
      (selection.shield?.stats?.mass || 0) +
      (selection.gravDrive?.stats?.mass || 0) +
      ((selection.weapon?.stats?.mass || 0) * selection.weaponCount) +
      ((selection.cargoHold?.stats?.mass || 0) * selection.cargoCount) +
      ((selection.fuelTank?.stats?.mass || 0) * selection.fuelCount),
    cargo: (selection.cargoHold?.stats?.cargo || 0) * selection.cargoCount,
    fuel: (selection.fuelTank?.stats?.fuel || 0) * selection.fuelCount,
    shield: selection.shield?.stats?.shieldHealth || 0,
    jump: selection.gravDrive?.stats?.jumpThrust || 0,
    maneuveringThrust: (selection.engine?.stats?.maneuveringThrust || 0) * selection.engineCount,
    thrust: (selection.engine?.stats?.thrust || 0) * selection.engineCount,
    value:
      (selection.reactor?.stats?.value || 0) +
      ((selection.engine?.stats?.value || 0) * selection.engineCount) +
      (selection.shield?.stats?.value || 0) +
      (selection.gravDrive?.stats?.value || 0) +
      ((selection.weapon?.stats?.value || 0) * selection.weaponCount) +
      ((selection.cargoHold?.stats?.value || 0) * selection.cargoCount) +
      ((selection.fuelTank?.stats?.value || 0) * selection.fuelCount)
  };

  totals.weaponPressure = computeWeaponPressure(selection.weapon) * selection.weaponCount;
  totals.mobilityEstimate = clamp(
    ((totals.maneuveringThrust / Math.max(totals.mass, 1)) * 11.9) - 47.6,
    0,
    100
  );

  const componentScores = {
    reactorPower: normalizeAgainstMax(totals.reactorPower, state.datasets.builderMaxima.reactorPower),
    shieldStrength: normalizeAgainstMax(totals.shield, state.datasets.builderMaxima.shieldStrength),
    weaponPressure: normalizeAgainstMax(
      totals.weaponPressure,
      state.datasets.builderMaxima.weaponPressure * selection.weaponCount
    ),
    mobility: totals.mobilityEstimate,
    jumpCapability: computeJumpCapabilityScore(totals),
    cargoCapacity: normalizeAgainstMax(
      totals.cargo,
      state.datasets.builderMaxima.cargoCapacity * selection.cargoCount
    ),
    fuelCapacity: normalizeAgainstMax(
      totals.fuel,
      Math.max(state.datasets.builderMaxima.fuelCapacity * Math.max(selection.fuelCount, 1), 1)
    ),
    massEfficiency: computeMassEfficiencyScore(totals),
    landingSupport: 65
  };

  const buildScore = computeWeightedProfileScore(componentScores, profile.weights);
  const bottleneck = detectBuildBottleneck({
    selection,
    profile,
    totals,
    componentScores,
    incompatibilities
  });

  const referenceShipDelta = selection.referenceShip
    ? buildReferenceShipDelta(selection.referenceShip, totals, buildScore)
    : null;

  return {
    selection,
    profile,
    totals,
    componentScores,
    buildScore,
    bottleneck,
    incompatibilities,
    referenceShipDelta,
    recommendations: includeRecommendations
      ? recommendShipBuildUpgrades(selection, profile, buildScore)
      : []
  };
}

function renderShipBuilderAnalysis(analysis) {
  const {
    selection,
    profile,
    totals,
    componentScores,
    buildScore,
    bottleneck,
    incompatibilities,
    referenceShipDelta,
    recommendations
  } = analysis;
  const powerDelta = totals.reactorPower - totals.allocatedPower;
  const statusTags = [
    `Perfil ${profile.name}`,
    `Classe ${selection.reactor.moduleClass || "C"}`,
    powerDelta >= 0 ? "Energia ok" : "Energia estourada",
    incompatibilities.length === 0 ? "Compatibilidade ok" : "Modulo fora da classe"
  ];

  return `
    <div class="ship-builder-metric-grid">
      <article class="metric-card accent-card">
        <span>Score da build</span>
        <strong>${formatScore(buildScore)}</strong>
        <small>Pontuacao ponderada pelo perfil escolhido</small>
      </article>
      <article class="metric-card">
        <span>Power budget</span>
        <strong>${formatNumber(totals.allocatedPower)} / ${formatNumber(totals.reactorPower)}</strong>
        <small>${powerDelta >= 0 ? `${formatNumber(powerDelta)} livres` : `${formatNumber(Math.abs(powerDelta))} acima do limite`}</small>
      </article>
      <article class="metric-card">
        <span>Mobilidade estimada</span>
        <strong>${formatNumber(totals.mobilityEstimate)}</strong>
        <small>Baseada em thrust de manobra e massa</small>
      </article>
      <article class="metric-card">
        <span>Gargalo principal</span>
        <strong>${escapeHtml(bottleneck.title)}</strong>
        <small>${escapeHtml(bottleneck.summary)}</small>
      </article>
    </div>

    <article class="ship-builder-diagnostic-card">
      <div class="tag-list">
        ${renderTagList(statusTags)}
      </div>
      <h3>Diagnostico atual</h3>
      <p>${escapeHtml(buildBuilderDiagnosisText(analysis))}</p>
      ${
        incompatibilities.length > 0
          ? `
            <div>
              <div class="detail-meta">Modulos fora da classe do reactor</div>
              <div class="tag-list">
                ${renderTagList(incompatibilities)}
              </div>
            </div>
          `
          : ""
      }
    </article>

    <div class="ship-builder-breakdown-grid">
      <article class="detail-card">
        <span>Reactor power</span>
        <strong>${formatNumber(totals.reactorPower)}</strong>
      </article>
      <article class="detail-card">
        <span>Shield health</span>
        <strong>${formatNumber(totals.shield)}</strong>
      </article>
      <article class="detail-card">
        <span>Jump thrust</span>
        <strong>${formatNumber(totals.jump)}</strong>
      </article>
      <article class="detail-card">
        <span>Cargo total</span>
        <strong>${formatNumber(totals.cargo)}</strong>
      </article>
      <article class="detail-card">
        <span>Fuel total</span>
        <strong>${formatNumber(totals.fuel)}</strong>
      </article>
      <article class="detail-card">
        <span>Weapon pressure</span>
        <strong>${formatNumber(totals.weaponPressure)}</strong>
      </article>
      <article class="detail-card">
        <span>Massa total</span>
        <strong>${formatNumber(totals.mass)}</strong>
      </article>
      <article class="detail-card">
        <span>Valor total</span>
        <strong>${formatCredits(totals.value)}</strong>
      </article>
    </div>

    <div class="ship-builder-score-grid">
      ${renderShipBuilderScoreCard("Reactor", componentScores.reactorPower)}
      ${renderShipBuilderScoreCard("Shield", componentScores.shieldStrength)}
      ${renderShipBuilderScoreCard("Weapon", componentScores.weaponPressure)}
      ${renderShipBuilderScoreCard("Mobilidade", componentScores.mobility)}
      ${renderShipBuilderScoreCard("Jump", componentScores.jumpCapability)}
      ${renderShipBuilderScoreCard("Carga", componentScores.cargoCapacity)}
    </div>

    <div class="ship-builder-vendor-grid">
      ${renderBuilderVendorCards(selection)}
    </div>

    ${
      referenceShipDelta
        ? renderReferenceShipDelta(referenceShipDelta)
        : ""
    }

    <div class="ship-builder-recommendations">
      <div class="panel-heading ship-builder-subheading">
        <div>
          <p class="panel-kicker">Next Upgrades</p>
          <h3>Melhores trocas agora</h3>
        </div>
      </div>
      ${
        recommendations.length > 0
          ? recommendations.map(renderShipBuilderRecommendation).join("")
          : `<div class="empty-state">Nao encontrei uma troca clara dentro das categorias mapeadas para esta build.</div>`
      }
    </div>

    <div class="ship-builder-footnote">
      V1 do assistente: a nave de referencia serve como alvo de comparacao, nao como leitura automatica das pecas instaladas.
    </div>
  `;
}

function renderShipBuilderScoreCard(label, value) {
  return `
    <article class="detail-card">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(value)}</strong>
    </article>
  `;
}

function renderReferenceShipDelta(referenceShipDelta) {
  return `
    <article class="ship-builder-reference-card">
      <div class="ship-builder-reference-top">
        <div>
          <div class="detail-meta">Meta de comparacao</div>
          <h3>${escapeHtml(referenceShipDelta.ship.name)}</h3>
        </div>
        <strong>${formatScore(referenceShipDelta.ship.scores?.balanced)}</strong>
      </div>
      <div class="ship-builder-reference-grid">
        ${renderReferenceDeltaCard("Reactor", referenceShipDelta.reactorDelta)}
        ${renderReferenceDeltaCard("Cargo", referenceShipDelta.cargoDelta)}
        ${renderReferenceDeltaCard("Shield", referenceShipDelta.shieldDelta)}
        ${renderReferenceDeltaCard("Jump", referenceShipDelta.jumpDelta)}
        ${renderReferenceDeltaCard("Dano", referenceShipDelta.damageDelta)}
      </div>
    </article>
  `;
}

function renderReferenceDeltaCard(label, value) {
  const deltaClass = value >= 0 ? "is-positive" : "is-negative";
  const prefix = value >= 0 ? "+" : "";

  return `
    <article class="detail-card ${deltaClass}">
      <span>${escapeHtml(label)} vs referencia</span>
      <strong>${prefix}${formatNumber(value)}</strong>
    </article>
  `;
}

function renderBuilderVendorCards(selection) {
  const modules = [
    { label: "Reactor", module: selection.reactor, count: 1 },
    { label: "Engine", module: selection.engine, count: selection.engineCount },
    { label: "Shield", module: selection.shield, count: 1 },
    { label: "Grav Drive", module: selection.gravDrive, count: 1 },
    { label: "Weapon", module: selection.weapon, count: selection.weaponCount },
    { label: "Cargo Hold", module: selection.cargoHold, count: selection.cargoCount },
    { label: "Fuel Tank", module: selection.fuelTank, count: selection.fuelCount }
  ].filter((entry) => entry.module && entry.count > 0);

  return modules.map(renderBuilderVendorCard).join("");
}

function renderBuilderVendorCard(entry) {
  const vendorSummary = entry.module.vendorSummary || {};
  const locations = Array.isArray(vendorSummary.locations) ? vendorSummary.locations.slice(0, 2) : [];
  const vendorStatus = humanizeVendorStatus(vendorSummary.status);
  const countLabel = entry.count > 1 ? `x${entry.count}` : "1 unidade";

  return `
    <article class="ship-builder-vendor-card">
      <div class="ship-builder-vendor-top">
        <div>
          <div class="detail-meta">${escapeHtml(entry.label)} • ${escapeHtml(countLabel)}</div>
          <strong>${escapeHtml(entry.module.name)}</strong>
        </div>
        <span class="vendor-status-badge">${escapeHtml(vendorStatus)}</span>
      </div>
      <div class="detail-meta">${escapeHtml(entry.module.manufacturer || "Fabricante nao informado")}</div>
      <div class="ship-builder-vendor-lines">
        ${
          locations.length > 0
            ? locations.map((location) => `<span>${escapeHtml(location)}</span>`).join("")
            : `<span>Vendor especifico ainda nao mapeado.</span>`
        }
      </div>
    </article>
  `;
}

function humanizeVendorStatus(status) {
  const labels = {
    verified_manufacturer_shop: "Vendor confirmado",
    verified_various_ship_technicians: "Tecnicos confirmados",
    verified_quest_unlock: "Quest unlock",
    partially_collected: "Parcial",
    inferred_manufacturer: "Fabricante inferido",
    inferred_general_pool: "Pool inferido",
    inferred_smuggling_vendor: "Smuggling vendor",
    inferred_faction_unlock: "Faction unlock",
    inferred_vehicle_vendor: "Vehicle vendor",
    free_unlock: "Free unlock"
  };

  return labels[status] || "Vendor";
}

function renderShipBuilderRecommendation(recommendation) {
  const fromClass = recommendation.from?.moduleClass ? `Class ${recommendation.from.moduleClass}` : "Sem classe";
  const toClass = recommendation.to?.moduleClass ? `Class ${recommendation.to.moduleClass}` : "Sem classe";

  return `
    <article class="ship-builder-recommendation-card">
      <div class="ship-builder-recommendation-top">
        <div>
          <div class="detail-meta">${escapeHtml(humanizeKey(recommendation.moduleType))}</div>
          <strong>${escapeHtml(recommendation.to.name)}</strong>
        </div>
        <span class="score-badge">+${formatScore(recommendation.scoreGain)}</span>
      </div>
      <div class="detail-meta">
        ${escapeHtml(recommendation.from.name)} (${escapeHtml(fromClass)}) -> ${escapeHtml(recommendation.to.name)} (${escapeHtml(toClass)})
      </div>
      <p>${escapeHtml(recommendation.reason)}</p>
    </article>
  `;
}

function buildBuilderDiagnosisText(analysis) {
  const { profile, bottleneck, componentScores, selection, totals } = analysis;
  const leadingEdge = getStrongestArea(componentScores);
  const shipReferenceText = selection.referenceShip
    ? ` A nave de referencia escolhida foi ${selection.referenceShip.name}.`
    : "";

  return `No perfil ${profile.name}, a build esta mais forte em ${leadingEdge} e o gargalo principal esta em ${bottleneck.title.toLowerCase()}. Ela fecha com ${formatNumber(totals.allocatedPower)} de energia alocada, ${formatNumber(totals.mass)} de massa e ${formatNumber(totals.cargo)} de cargo.${shipReferenceText}`;
}

function getStrongestArea(componentScores) {
  const labels = {
    reactorPower: "reactor",
    shieldStrength: "defesa",
    weaponPressure: "pressao de dano",
    mobility: "mobilidade",
    jumpCapability: "alcance de salto",
    cargoCapacity: "capacidade de carga",
    fuelCapacity: "autonomia",
    massEfficiency: "eficiencia de massa"
  };

  const strongest = Object.entries(componentScores).sort((a, b) => b[1] - a[1])[0];
  return labels[strongest?.[0]] || "equilibrio geral";
}

function getBuilderProfile(profileId) {
  return (
    state.datasets.shipBuilderRules.recommendationProfiles.find((profile) => profile.id === profileId) ||
    state.datasets.shipBuilderRules.recommendationProfiles[0]
  );
}

function getAutoBuildCountPreset(profileId) {
  const presets = {
    balanced: { engineCount: 4, weaponCount: 3, cargoCount: 2, fuelCount: 1 },
    exploration: { engineCount: 3, weaponCount: 2, cargoCount: 2, fuelCount: 2 },
    combat: { engineCount: 4, weaponCount: 4, cargoCount: 1, fuelCount: 1 },
    cargo: { engineCount: 3, weaponCount: 2, cargoCount: 4, fuelCount: 2 }
  };

  return presets[profileId] || presets.balanced;
}

function buildShipPresetFromShip(ship, profile) {
  const exactClass = ship.class || "C";
  const reactor = findClosestModuleMatch("reactor", ship.reactor, (module) => module.stats?.power, {
    exactClass
  });
  const shield = findClosestModuleMatch("shield_generator", ship.shield, (module) => module.stats?.shieldHealth, {
    exactClass
  });
  const gravDrive = findClosestModuleMatch("grav_drive", ship.jump, (module) => module.stats?.jumpThrust, {
    exactClass
  });
  const cargoPreset = findClosestCountedModuleMatch("cargo_hold", ship.cargo, (module) => module.stats?.cargo, {
    minCount: 1,
    maxCount: 6
  });
  const fuelPreset = findClosestCountedModuleMatch("fuel_tank", ship.fuel, (module) => module.stats?.fuel, {
    minCount: 0,
    maxCount: 6
  });
  const weaponPreset = findClosestCountedModuleMatch(
    "weapon",
    ship.damage,
    getShipComparableWeaponValue,
    {
      exactClass,
      minCount: 1,
      maxCount: 6
    }
  );
  const enginePreset = findClosestEnginePreset({
    ship,
    reactor,
    shield,
    gravDrive,
    weaponPreset,
    profile
  });

  return {
    reactor,
    shield,
    gravDrive,
    engine: enginePreset?.module || pickBestModuleForAutoBuild("engine", profile, { exactClass, reactorClass: exactClass }),
    engineCount: enginePreset?.count || getAutoBuildCountPreset(profile.id).engineCount,
    weapon: weaponPreset?.module || pickBestModuleForAutoBuild("weapon", profile, { exactClass, reactorClass: exactClass }),
    weaponCount: weaponPreset?.count || getAutoBuildCountPreset(profile.id).weaponCount,
    cargoHold: cargoPreset?.module || pickBestModuleForAutoBuild("cargo_hold", profile, { reactorClass: exactClass }),
    cargoCount: cargoPreset?.count || getAutoBuildCountPreset(profile.id).cargoCount,
    fuelTank: fuelPreset?.module || pickBestModuleForAutoBuild("fuel_tank", profile, { reactorClass: exactClass }),
    fuelCount: fuelPreset?.count ?? getAutoBuildCountPreset(profile.id).fuelCount
  };
}

function findClosestModuleMatch(moduleType, targetValue, metricGetter, options = {}) {
  const { exactClass = null, reactorClass = null } = options;
  const modules = getModulesForBuilderSelection(moduleType, { exactClass, reactorClass });

  if (modules.length === 0) {
    return null;
  }

  return modules
    .slice()
    .sort((a, b) => {
      const diffA = Math.abs((metricGetter(a) || 0) - targetValue);
      const diffB = Math.abs((metricGetter(b) || 0) - targetValue);
      if (diffA !== diffB) return diffA - diffB;

      return sortModulesForBuilderOptions(a, b);
    })[0];
}

function findClosestCountedModuleMatch(moduleType, targetValue, metricGetter, options = {}) {
  const { exactClass = null, reactorClass = null, minCount = 1, maxCount = 6 } = options;
  const modules = getModulesForBuilderSelection(moduleType, { exactClass, reactorClass });
  let bestMatch = null;

  for (const module of modules) {
    for (let count = minCount; count <= maxCount; count += 1) {
      const totalValue = (metricGetter(module) || 0) * count;
      const diff = Math.abs(totalValue - targetValue);
      const score = diff + ((module.stats?.mass || 0) * count * 0.04);

      if (!bestMatch || score < bestMatch.score) {
        bestMatch = {
          module,
          count,
          totalValue,
          score
        };
      }
    }
  }

  return bestMatch;
}

function findClosestEnginePreset(context) {
  const {
    ship,
    reactor,
    shield,
    gravDrive,
    weaponPreset,
    profile
  } = context;
  const exactClass = reactor?.moduleClass || ship.class || "C";
  const engines = getModulesForBuilderSelection("engine", { exactClass, reactorClass: exactClass });
  const preferredCount = getPreferredEngineCountByClass(exactClass);
  const targetPowerBudget = Math.max(
    3,
    (ship.reactor || reactor?.stats?.power || 0) -
      ((shield?.stats?.maxPower || 0) + (gravDrive?.stats?.maxPower || 0) + ((weaponPreset?.module?.stats?.maxPower || 0) * (weaponPreset?.count || 1)))
  );
  let bestMatch = null;

  for (const engine of engines) {
    for (let count = 1; count <= 6; count += 1) {
      const totalEnginePower = (engine.stats?.maxPower || 0) * count;
      const powerDiff = Math.abs(totalEnginePower - targetPowerBudget);
      const countDiff = Math.abs(count - preferredCount);
      const thrustScore = ((engine.stats?.maneuveringThrust || 0) / Math.max(engine.stats?.mass || 1, 1)) * count;
      const score = (powerDiff * 24) + (countDiff * 18) - thrustScore;

      if (!bestMatch || score < bestMatch.score) {
        bestMatch = {
          module: engine,
          count,
          score
        };
      }
    }
  }

  return bestMatch;
}

function getModulesForBuilderSelection(moduleType, options = {}) {
  const { exactClass = null, reactorClass = null } = options;

  return (state.datasets.modulesByType[moduleType] || []).filter((module) => {
    if (exactClass && module.moduleClass && String(module.moduleClass).toUpperCase() !== String(exactClass).toUpperCase()) {
      return false;
    }

    if (reactorClass && !isModuleCompatibleWithReactor(module, reactorClass)) {
      return false;
    }

    return true;
  });
}

function getPreferredEngineCountByClass(moduleClass) {
  const mapping = {
    A: 2,
    B: 3,
    C: 4
  };

  return mapping[String(moduleClass || "").toUpperCase()] || 3;
}

function getShipComparableWeaponValue(module) {
  if (!module) return 0;

  const stats = module.stats || {};
  return Math.max(
    stats.hullDamage || 0,
    stats.shieldDamage || 0,
    (stats.emDamage || 0) * 0.75
  );
}

function pickBestModuleForAutoBuild(moduleType, profile, options = {}) {
  const { exactClass = null, reactorClass = null } = options;
  const modules = (state.datasets.modulesByType[moduleType] || [])
    .filter((module) => {
      if (exactClass && module.moduleClass && String(module.moduleClass).toUpperCase() !== String(exactClass).toUpperCase()) {
        return false;
      }

      if (reactorClass && !isModuleCompatibleWithReactor(module, reactorClass)) {
        return false;
      }

      return true;
    })
    .slice()
    .sort((a, b) => scoreModuleForProfile(moduleType, b, profile) - scoreModuleForProfile(moduleType, a, profile));

  return modules[0] || null;
}

function scoreModuleForProfile(moduleType, module, profile) {
  const stats = module.stats || {};

  switch (moduleType) {
    case "reactor":
      return (stats.power || 0) * 14 + (stats.hull || 0) - (stats.mass || 0) * 0.35;
    case "engine":
      return ((stats.maneuveringThrust || 0) * 0.9) + ((stats.thrust || 0) * 0.08) - ((stats.mass || 0) * 1.6);
    case "shield_generator":
      return (stats.shieldHealth || 0) + ((stats.shieldHealthPerPower || 0) * 30) - ((stats.mass || 0) * 0.8);
    case "grav_drive":
      return ((stats.jumpThrust || 0) * (profile.id === "exploration" ? 22 : 16)) - ((stats.mass || 0) * 0.8);
    case "weapon":
      return computeWeaponPressure(module) - ((stats.maxPower || 0) * 6);
    case "cargo_hold":
      return ((stats.cargo || 0) * (profile.id === "cargo" ? 1.4 : 1)) + ((stats.cargoPerMass || 0) * 80) - ((stats.mass || 0) * 0.5);
    case "fuel_tank":
      return ((stats.fuel || 0) * (profile.id === "exploration" ? 1.4 : 1)) + ((stats.fuelPerMass || 0) * 40) - ((stats.mass || 0) * 0.4);
    default:
      return 0;
  }
}

function recommendShipBuildUpgrades(selection, profile, currentScore) {
  const classFilter = getBuilderClassFilter();
  const recommendationTypes = [...new Set([...(profile.priorityOrder || []), "fuel_tank"])]
    .filter((moduleType) => selection[moduleTypeToSelectionKey(moduleType)]);
  const candidates = [];

  for (const moduleType of recommendationTypes) {
    const selectionKey = moduleTypeToSelectionKey(moduleType);
    const currentModule = selection[selectionKey];
    if (!currentModule) continue;

    const options = (state.datasets.modulesByType[moduleType] || []).filter((candidate) => {
      if (candidate.id === currentModule.id) {
        return false;
      }

      if (classFilter !== "all" && candidate.moduleClass && String(candidate.moduleClass).toUpperCase() !== String(classFilter).toUpperCase()) {
        return false;
      }

      if (moduleType === "reactor") {
        return canSwapReactor(selection, candidate);
      }

      return isModuleCompatibleWithReactor(candidate, selection.reactor.moduleClass || "C");
    });

    let bestUpgrade = null;

    for (const candidate of options) {
      const upgradedSelection = { ...selection, [selectionKey]: candidate };
      const upgradedAnalysis = analyzeShipBuild(upgradedSelection, { includeRecommendations: false });
      const scoreGain = upgradedAnalysis.buildScore - currentScore;

      if (scoreGain <= 0.35) {
        continue;
      }

      const recommendation = {
        moduleType,
        from: currentModule,
        to: candidate,
        scoreGain,
        reason: buildUpgradeReason(moduleType, selection, upgradedAnalysis, currentScore)
      };

      if (!bestUpgrade || recommendation.scoreGain > bestUpgrade.scoreGain) {
        bestUpgrade = recommendation;
      }
    }

    if (bestUpgrade) {
      candidates.push(bestUpgrade);
    }
  }

  return candidates
    .sort((a, b) => b.scoreGain - a.scoreGain)
    .slice(0, 3);
}

function buildUpgradeReason(moduleType, selection, upgradedAnalysis, currentScore) {
  const delta = upgradedAnalysis.buildScore - currentScore;
  const bottleneckTitle = upgradedAnalysis.bottleneck.title.toLowerCase();
  const lookup = {
    reactor: "Abre mais margem de energia e reduz o risco de travar upgrades futuros.",
    engine: "Melhora a mobilidade estimada e deixa a nave menos pesada por thrust entregue.",
    shield_generator: "Sobe a sobrevivencia da build sem mexer no resto do pacote.",
    grav_drive: "Ajuda a build a viajar melhor e reduz o gargalo de salto.",
    weapon: "Aumenta a pressao ofensiva e melhora o score de combate.",
    cargo_hold: "Entrega mais carga util para o mesmo perfil de build.",
    fuel_tank: "Da mais autonomia para exploracao e rotas longas."
  };

  return `${lookup[moduleType] || "Melhora o conjunto geral da build."} Ganho estimado de ${formatScore(delta)} pontos e gargalo apontado em ${bottleneckTitle}.`;
}

function buildReferenceShipDelta(ship, totals, buildScore) {
  return {
    ship,
    buildScoreDelta: buildScore - (ship.scores?.balanced || 0),
    reactorDelta: totals.reactorPower - (ship.reactor || 0),
    cargoDelta: totals.cargo - (ship.cargo || 0),
    shieldDelta: totals.shield - (ship.shield || 0),
    jumpDelta: totals.jump - (ship.jump || 0),
    damageDelta: totals.weaponPressure - (ship.damage || 0)
  };
}

function detectBuildBottleneck(context) {
  const { profile, totals, componentScores, incompatibilities } = context;

  if (incompatibilities.length > 0) {
    return {
      id: "class-ceiling",
      title: "Classe de modulo",
      summary: "Alguma peca passa do limite suportado pelo reactor atual."
    };
  }

  if (totals.allocatedPower > totals.reactorPower) {
    return {
      id: "reactor-bottleneck",
      title: "Reactor",
      summary: "A build pede mais energia do que o reactor consegue entregar."
    };
  }

  if (componentScores.mobility < 45) {
    return {
      id: "mobility-bottleneck",
      title: "Mobilidade",
      summary: "O peso atual esta derrubando o giro e a resposta da nave."
    };
  }

  if (["balanced", "exploration"].includes(profile.id) && componentScores.jumpCapability < 45) {
    return {
      id: "jump-bottleneck",
      title: "Grav drive",
      summary: "O alcance de salto ainda esta curto para o perfil escolhido."
    };
  }

  if (["balanced", "combat"].includes(profile.id) && componentScores.shieldStrength < 45) {
    return {
      id: "defense-bottleneck",
      title: "Shield",
      summary: "A defesa ficou abaixo do ideal para uma build de linha de frente."
    };
  }

  if (profile.id === "cargo" && componentScores.cargoCapacity < 45) {
    return {
      id: "cargo-bottleneck",
      title: "Cargo",
      summary: "Ainda falta volume de carga para o perfil de transporte."
    };
  }

  return {
    id: "stable",
    title: "Sem gargalo critico",
    summary: "A build esta coerente para esta fase da V1."
  };
}

function computeWeightedProfileScore(componentScores, weights) {
  return Object.entries(weights || {}).reduce((total, [key, weight]) => {
    return total + ((componentScores[key] || 0) * weight);
  }, 0);
}

function computeJumpCapabilityScore(totals) {
  const jumpBase = normalizeAgainstMax(totals.jump, state.datasets.builderMaxima.jumpCapability) * 0.72;
  const fuelBase = normalizeAgainstMax(totals.fuel, Math.max(state.datasets.builderMaxima.fuelCapacity, 1)) * 0.28;
  const massPenalty = Math.min(24, totals.mass / 180);
  return clamp(jumpBase + fuelBase - massPenalty + 12, 0, 100);
}

function computeMassEfficiencyScore(totals) {
  const payloadPressure =
    (totals.weaponPressure * 2.6) +
    (totals.shield / 8) +
    (totals.jump * 10) +
    (totals.cargo / 12) +
    (totals.fuel / 10);
  const efficiency = payloadPressure / Math.max(totals.mass, 1);
  return clamp((efficiency / 14) * 100, 0, 100);
}

function computeWeaponPressure(module) {
  if (!module) return 0;

  const stats = module.stats || {};
  const hullPressure = (stats.hullDpsPerPower || stats.hullDamage || 0) * Math.max(stats.maxPower || 1, 1);
  const shieldPressure = (stats.shieldDpsPerPower || stats.shieldDamage || 0) * Math.max(stats.maxPower || 1, 1);
  const emPressure = (stats.emDamage || 0) * 0.45;
  return hullPressure + shieldPressure + emPressure;
}

function buildShipBuilderMaxima(modulesByType) {
  return {
    reactorPower: getModuleTypeMax(modulesByType.reactor, (item) => item.stats?.power),
    shieldStrength: getModuleTypeMax(modulesByType.shield_generator, (item) => item.stats?.shieldHealth),
    jumpCapability: getModuleTypeMax(modulesByType.grav_drive, (item) => item.stats?.jumpThrust),
    cargoCapacity: getModuleTypeMax(modulesByType.cargo_hold, (item) => item.stats?.cargo),
    fuelCapacity: getModuleTypeMax(modulesByType.fuel_tank, (item) => item.stats?.fuel),
    weaponPressure: getModuleTypeMax(modulesByType.weapon, computeWeaponPressure)
  };
}

function groupModulesByType(items) {
  return items.reduce((accumulator, item) => {
    const key = item.moduleType;
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});
}

function getModuleTypeMax(items, getter) {
  return Math.max(
    1,
    ...(items || []).map((item) => Number(getter(item) || 0))
  );
}

function findModuleByTypeAndName(moduleType, query) {
  if (!query) return null;

  const normalizedQuery = normalizeText(query);
  return (
    (state.datasets.modulesByType[moduleType] || []).find(
      (item) => normalizeText(item.name) === normalizedQuery
    ) ||
    (state.datasets.modulesByType[moduleType] || []).find(
      (item) => normalizeText(item.name).includes(normalizedQuery)
    ) ||
    null
  );
}

function sortModulesForBuilderOptions(a, b) {
  const classDiff = getModuleClassRank(a.moduleClass) - getModuleClassRank(b.moduleClass);
  if (classDiff !== 0) return classDiff;

  const levelDiff = (a.requiredLevel || 0) - (b.requiredLevel || 0);
  if (levelDiff !== 0) return levelDiff;

  return a.name.localeCompare(b.name);
}

function isModuleCompatibleWithReactor(module, reactorClass) {
  if (!module?.moduleClass) {
    return true;
  }

  return getModuleClassRank(module.moduleClass) <= getModuleClassRank(reactorClass);
}

function canSwapReactor(selection, candidateReactor) {
  const candidateClass = candidateReactor?.moduleClass || "C";
  return [
    selection.engine,
    selection.shield,
    selection.gravDrive,
    selection.weapon
  ].every((module) => isModuleCompatibleWithReactor(module, candidateClass));
}

function moduleTypeToSelectionKey(moduleType) {
  const mapping = {
    reactor: "reactor",
    engine: "engine",
    shield_generator: "shield",
    grav_drive: "gravDrive",
    weapon: "weapon",
    cargo_hold: "cargoHold",
    fuel_tank: "fuelTank"
  };

  return mapping[moduleType] || moduleType;
}

function getModuleClassRank(moduleClass) {
  const ranks = { A: 1, B: 2, C: 3 };
  return ranks[String(moduleClass || "").toUpperCase()] || 0;
}

function normalizeAgainstMax(value, maxValue) {
  return clamp((Number(value || 0) / Math.max(Number(maxValue || 1), 1)) * 100, 0, 100);
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

function clamp(value, min, max) {
  return Math.min(Math.max(Number(value || 0), min), max);
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
