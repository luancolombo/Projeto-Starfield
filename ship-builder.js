const builderState = {
  datasets: null,
  buildSource: "auto_build"
};
const BUILDER_WEAPON_SLOT_COUNT = 3;

document.addEventListener("DOMContentLoaded", () => {
  initializeShipBuilderPage().catch((error) => {
    console.error(error);
    renderBuilderPageError(error);
  });
});

async function initializeShipBuilderPage() {
  const [ships, shipModules, shipBuilderRules] = await Promise.all([
    fetchJson("./data/ships.json"),
    fetchJson("./data/ship-modules.json"),
    fetchJson("./data/ship-builder-rules.json")
  ]);

  const modulesByType = groupModulesByType(shipModules.items);

  builderState.datasets = {
    ships,
    shipModules,
    shipBuilderRules,
    modulesByType,
    builderMaxima: buildShipBuilderMaxima(modulesByType)
  };

  populateShipOptions();
  populateShipBuilderOptions();
  bindBuilderEvents();
  runShipBuilderAutoBuild();
}

function bindBuilderEvents() {
  document.getElementById("load-ship-preset-button").addEventListener("click", runShipBuilderShipPreset);
  document.getElementById("auto-build-button").addEventListener("click", runShipBuilderAutoBuild);
  document.getElementById("analyze-build-button").addEventListener("click", runShipBuilderAnalysis);
  document.getElementById("builder-reactor").addEventListener("change", populateShipBuilderOptions);
  document.getElementById("builder-class-filter").addEventListener("change", populateShipBuilderOptions);
  document.getElementById("builder-mode").addEventListener("change", handleBuilderModeChange);

  [
    "builder-profile",
    "builder-class-filter",
    "builder-combat-style",
    "builder-reference-ship",
    "builder-reactor",
    "builder-engine",
    "builder-engine-count",
    "builder-shield",
    "builder-grav-drive",
    "builder-weapon-slot-1",
    "builder-weapon-slot-1-count",
    "builder-weapon-slot-2",
    "builder-weapon-slot-2-count",
    "builder-weapon-slot-3",
    "builder-weapon-slot-3-count",
    "builder-cargo-hold",
    "builder-cargo-count",
    "builder-fuel-tank",
    "builder-fuel-count",
    "builder-landing-gear",
    "builder-landing-gear-count"
  ].forEach((id) => {
    const element = document.getElementById(id);
    element.addEventListener("keydown", handleBuilderEnter);
    element.addEventListener("change", handleBuilderInput);
  });
}

function handleBuilderModeChange() {
  const mode = document.getElementById("builder-mode").value;
  const shipInput = document.getElementById("builder-reference-ship").value.trim();

  if ((mode === "ship_preset" || mode === "upgrade_current_ship") && shipInput) {
    runShipBuilderShipPreset();
    return;
  }

  if (mode === "manual") {
    updateUpgradeRoadmap(null);
  }
}

function rerunBuilderSource() {
  if (builderState.buildSource === "ship_preset" && document.getElementById("builder-reference-ship").value.trim()) {
    runShipBuilderShipPreset();
    return;
  }

  if (builderState.buildSource === "auto_build") {
    runShipBuilderAutoBuild();
    return;
  }

  const result = document.getElementById("ship-builder-result");
  if (result.classList.contains("is-ready")) {
    runShipBuilderAnalysis();
  }
}

function isManualBuilderField(id) {
  return [
    "builder-reactor",
    "builder-engine",
    "builder-engine-count",
    "builder-shield",
    "builder-grav-drive",
    "builder-weapon-slot-1",
    "builder-weapon-slot-1-count",
    "builder-weapon-slot-2",
    "builder-weapon-slot-2-count",
    "builder-weapon-slot-3",
    "builder-weapon-slot-3-count",
    "builder-cargo-hold",
    "builder-cargo-count",
    "builder-fuel-tank",
    "builder-fuel-count",
    "builder-landing-gear",
    "builder-landing-gear-count"
  ].includes(id);
}

function handleBuilderEnter(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    runShipBuilderAnalysis();
  }
}

function handleBuilderInput() {
  const targetId = document.activeElement?.id;
  if (isManualBuilderField(targetId)) {
    builderState.buildSource = "manual_edit";
  }

  const changedId = targetId || "";
  if (changedId === "builder-profile" || changedId === "builder-class-filter" || changedId === "builder-combat-style") {
    rerunBuilderSource();
    return;
  }

  const result = document.getElementById("ship-builder-result");
  if (result.classList.contains("is-ready")) {
    runShipBuilderAnalysis();
  }
}

function populateShipOptions() {
  const datalist = document.getElementById("ship-options");
  datalist.innerHTML = builderState.datasets.ships.items
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
    ["builder-fuel-options", "fuel_tank"],
    ["builder-landing-gear-options", "landing_gear"]
  ];

  datalistConfig.forEach(([datalistId, moduleType]) => {
    const datalist = document.getElementById(datalistId);
    const modules = (builderState.datasets.modulesByType[moduleType] || [])
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

function getBuilderCombatStyle() {
  return document.getElementById("builder-combat-style")?.value || "balanced";
}

function getBuilderWeaponSlotConfig() {
  return Array.from({ length: BUILDER_WEAPON_SLOT_COUNT }, (_, index) => {
    const slot = index + 1;
    return {
      slot,
      inputId: `builder-weapon-slot-${slot}`,
      countId: `builder-weapon-slot-${slot}-count`
    };
  });
}

function readBuilderWeaponSlots() {
  const profileId = document.getElementById("builder-profile")?.value || "balanced";
  const slotPlan = getCombatStylePlan(
    getBuilderCombatStyle(),
    profileId,
    getAutoBuildCountPreset(profileId)
  );

  return getBuilderWeaponSlotConfig().map(({ slot, inputId, countId }, index) => ({
    slot,
    role: slotPlan[index]?.role || "all_rounder",
    module: findModuleByTypeAndName("weapon", document.getElementById(inputId).value.trim()),
    count: clamp(toNumber(document.getElementById(countId).value, slot === 1 ? 1 : 0), 0, 12)
  }));
}

function applyBuilderWeaponSlots(weaponSlots) {
  const slots = normalizeWeaponSlots(weaponSlots);
  getBuilderWeaponSlotConfig().forEach(({ slot, inputId, countId }, index) => {
    const weaponSlot = slots[index];
    document.getElementById(inputId).value = weaponSlot?.module?.name || "";
    document.getElementById(countId).value = String(weaponSlot?.count || 0);
  });
}

function normalizeWeaponSlots(weaponSlots) {
  const slots = Array.isArray(weaponSlots) ? weaponSlots : [];
  return Array.from({ length: BUILDER_WEAPON_SLOT_COUNT }, (_, index) => {
    const incoming = slots[index] || {};
    return {
      slot: index + 1,
      role: incoming.role || null,
      module: incoming.module || null,
      count: clamp(toNumber(incoming.count, index === 0 ? 1 : 0), 0, 12)
    };
  });
}

function getActiveWeaponSlots(selection) {
  return normalizeWeaponSlots(selection.weaponSlots).filter((slot) => slot.module && slot.count > 0);
}

function getTotalWeaponCount(selection) {
  return getActiveWeaponSlots(selection).reduce((total, slot) => total + slot.count, 0);
}

function sumWeaponSlotMetric(selection, getter) {
  return getActiveWeaponSlots(selection).reduce((total, slot) => {
    return total + ((getter(slot.module, slot) || 0) * slot.count);
  }, 0);
}

function computeDisplayedWeaponDamage(module) {
  if (!module) return 0;

  const stats = module.stats || {};
  return Math.max(
    Number(stats.hullDamage || 0),
    Number(stats.shieldDamage || 0),
    Number(stats.emDamage || 0)
  );
}

function runShipBuilderShipPreset() {
  const ship = findShipByName(document.getElementById("builder-reference-ship").value.trim());
  const container = document.getElementById("ship-builder-result");

  if (!ship) {
    container.className = "ship-builder-result empty-state";
    container.textContent = "Escolhe uma nave valida para carregar um preset aproximado.";
    updateUpgradeRoadmap(null);
    return;
  }

  const profile = getBuilderProfile(document.getElementById("builder-profile").value);
  const preset = buildShipPresetFromShip(ship, profile);

  if (!preset?.reactor) {
    container.className = "ship-builder-result empty-state";
    container.textContent = "Nao consegui montar um preset aproximado para essa nave.";
    updateUpgradeRoadmap(null);
    return;
  }

  document.getElementById("builder-class-filter").value = ship.class || "all";
  document.getElementById("builder-reactor").value = preset.reactor?.name || "";
  document.getElementById("builder-combat-style").value = preset.combatStyle || getBuilderCombatStyle();
  populateShipBuilderOptions();
  document.getElementById("builder-engine").value = preset.engine?.name || "";
  document.getElementById("builder-engine-count").value = String(preset.engineCount || 1);
  document.getElementById("builder-shield").value = preset.shield?.name || "";
  document.getElementById("builder-grav-drive").value = preset.gravDrive?.name || "";
  applyBuilderWeaponSlots(preset.weaponSlots);
  document.getElementById("builder-cargo-hold").value = preset.cargoHold?.name || "";
  document.getElementById("builder-cargo-count").value = String(preset.cargoCount || 1);
  document.getElementById("builder-fuel-tank").value = preset.fuelTank?.name || "";
  document.getElementById("builder-fuel-count").value = String(preset.fuelCount || 0);
  document.getElementById("builder-landing-gear").value = preset.landingGear?.name || "";
  document.getElementById("builder-landing-gear-count").value = String(preset.landingGearCount || 1);

  builderState.buildSource = "ship_preset";
  runShipBuilderAnalysis();
}

function runShipBuilderAutoBuild() {
  const profile = getBuilderProfile(document.getElementById("builder-profile").value);
  const referenceShip = findShipByName(document.getElementById("builder-reference-ship").value.trim());
  const classFilter = getBuilderClassFilter();
  const targetClass = classFilter !== "all" ? classFilter : referenceShip?.class || "C";
  const countPreset = getAutoBuildCountPreset(profile.id);
  const autoBuild = buildAutoBuildForClass(profile, targetClass, countPreset, getBuilderCombatStyle());
  const reactor = autoBuild?.reactor;

  if (!reactor) {
    const container = document.getElementById("ship-builder-result");
    container.className = "ship-builder-result empty-state";
    container.textContent = "Nao encontrei reactor suficiente para montar a auto-build.";
    updateUpgradeRoadmap(null);
    return;
  }

  document.getElementById("builder-reactor").value = reactor.name;
  if (classFilter === "all") {
    document.getElementById("builder-class-filter").value = reactor.moduleClass || "all";
  }

  populateShipBuilderOptions();

  document.getElementById("builder-engine").value = autoBuild.engine?.name || "";
  document.getElementById("builder-shield").value = autoBuild.shield?.name || "";
  document.getElementById("builder-grav-drive").value = autoBuild.gravDrive?.name || "";
  document.getElementById("builder-combat-style").value = autoBuild.combatStyleId || getBuilderCombatStyle();
  applyBuilderWeaponSlots(autoBuild.weaponSlots);
  document.getElementById("builder-cargo-hold").value = autoBuild.cargoHold?.name || "";
  document.getElementById("builder-fuel-tank").value = autoBuild.fuelTank?.name || "";
  document.getElementById("builder-landing-gear").value = autoBuild.landingGear?.name || "";
  document.getElementById("builder-engine-count").value = String(autoBuild.engineCount || countPreset.engineCount);
  document.getElementById("builder-cargo-count").value = String(autoBuild.cargoCount || countPreset.cargoCount);
  document.getElementById("builder-fuel-count").value = String(autoBuild.fuelCount ?? countPreset.fuelCount);
  document.getElementById("builder-landing-gear-count").value = String(autoBuild.landingGearCount || 3);

  builderState.buildSource = "auto_build";
  runShipBuilderAnalysis();
}

function runShipBuilderAnalysis() {
  const container = document.getElementById("ship-builder-result");
  const selection = readShipBuilderSelection();
  const missingCoreModules = getMissingCoreModules(selection);

  if (missingCoreModules.length > 0) {
    container.className = "ship-builder-result empty-state";
    container.textContent = `Falta escolher: ${missingCoreModules.join(", ")}.`;
    updateUpgradeRoadmap(null);
    return;
  }

  const analysis = analyzeShipBuild(selection);
  container.className = "ship-builder-result is-ready";
  container.innerHTML = renderShipBuilderAnalysis(analysis);
  updateUpgradeRoadmap(analysis);
}

function readShipBuilderSelection() {
  const weaponSlots = readBuilderWeaponSlots();
  return {
    mode: document.getElementById("builder-mode").value,
    profileId: document.getElementById("builder-profile").value,
    combatStyleId: getBuilderCombatStyle(),
    referenceShip: findShipByName(document.getElementById("builder-reference-ship").value.trim()),
    reactor: findModuleByTypeAndName("reactor", document.getElementById("builder-reactor").value.trim()),
    engine: findModuleByTypeAndName("engine", document.getElementById("builder-engine").value.trim()),
    engineCount: clamp(toNumber(document.getElementById("builder-engine-count").value, 1), 1, 8),
    shield: findModuleByTypeAndName("shield_generator", document.getElementById("builder-shield").value.trim()),
    gravDrive: findModuleByTypeAndName("grav_drive", document.getElementById("builder-grav-drive").value.trim()),
    weaponSlots,
    cargoHold: findModuleByTypeAndName("cargo_hold", document.getElementById("builder-cargo-hold").value.trim()),
    cargoCount: clamp(toNumber(document.getElementById("builder-cargo-count").value, 1), 1, 12),
    fuelTank: findModuleByTypeAndName("fuel_tank", document.getElementById("builder-fuel-tank").value.trim()),
    fuelCount: clamp(toNumber(document.getElementById("builder-fuel-count").value, 0), 0, 12),
    landingGear: findModuleByTypeAndName("landing_gear", document.getElementById("builder-landing-gear").value.trim()),
    landingGearCount: clamp(toNumber(document.getElementById("builder-landing-gear-count").value, 1), 1, 12),
    weapon: weaponSlots[0]?.module || null,
    weaponCount: getTotalWeaponCount({ weaponSlots })
  };
}

function getMissingCoreModules(selection) {
  const labels = [];

  if (!selection.reactor) labels.push("reactor");
  if (!selection.engine) labels.push("engine");
  if (!selection.shield) labels.push("shield generator");
  if (!selection.gravDrive) labels.push("grav drive");
  if (getActiveWeaponSlots(selection).length === 0) labels.push("weapon slot 1");
  if (!selection.cargoHold) labels.push("cargo hold");
  if (!selection.landingGear) labels.push("landing gear");

  return labels;
}

function analyzeShipBuild(selection, options = {}) {
  const { includeRecommendations = true } = options;
  const profile = getBuilderProfile(selection.profileId);
  const reactorClass = selection.reactor?.moduleClass || "C";
  const activeWeaponSlots = getActiveWeaponSlots(selection);
  const incompatibilities = [
    ["engine", selection.engine],
    ["shield", selection.shield],
    ["grav drive", selection.gravDrive],
    ...activeWeaponSlots.map((slot) => [`weapon slot ${slot.slot}`, slot.module])
  ]
    .filter(([, module]) => module && !isModuleCompatibleWithReactor(module, reactorClass))
    .map(([label, module]) => `${label}: ${module.name}`);

  const totals = {
    reactorPower: selection.reactor?.stats?.power || 0,
    allocatedPower:
      ((selection.engine?.stats?.maxPower || 0) * selection.engineCount) +
      (selection.shield?.stats?.maxPower || 0) +
      (selection.gravDrive?.stats?.maxPower || 0) +
      sumWeaponSlotMetric(selection, (module) => module?.stats?.maxPower || 0),
    mass:
      (selection.reactor?.stats?.mass || 0) +
      ((selection.engine?.stats?.mass || 0) * selection.engineCount) +
      (selection.shield?.stats?.mass || 0) +
      (selection.gravDrive?.stats?.mass || 0) +
      sumWeaponSlotMetric(selection, (module) => module?.stats?.mass || 0) +
      ((selection.cargoHold?.stats?.mass || 0) * selection.cargoCount) +
      ((selection.fuelTank?.stats?.mass || 0) * selection.fuelCount) +
      ((selection.landingGear?.stats?.mass || 0) * selection.landingGearCount),
    cargo: (selection.cargoHold?.stats?.cargo || 0) * selection.cargoCount,
    fuel: (selection.fuelTank?.stats?.fuel || 0) * selection.fuelCount,
    shield: selection.shield?.stats?.shieldHealth || 0,
    jump: selection.gravDrive?.stats?.jumpThrust || 0,
    landingThrust: (selection.landingGear?.stats?.landingThrust || 0) * selection.landingGearCount,
    maneuveringThrust: (selection.engine?.stats?.maneuveringThrust || 0) * selection.engineCount,
    thrust: (selection.engine?.stats?.thrust || 0) * selection.engineCount,
    value:
      (selection.reactor?.stats?.value || 0) +
      ((selection.engine?.stats?.value || 0) * selection.engineCount) +
      (selection.shield?.stats?.value || 0) +
      (selection.gravDrive?.stats?.value || 0) +
      sumWeaponSlotMetric(selection, (module) => module?.stats?.value || 0) +
      ((selection.cargoHold?.stats?.value || 0) * selection.cargoCount) +
      ((selection.fuelTank?.stats?.value || 0) * selection.fuelCount) +
      ((selection.landingGear?.stats?.value || 0) * selection.landingGearCount)
  };

  totals.weaponPressure = computeLoadoutPressure(selection);
  totals.displayDamage = sumWeaponSlotMetric(selection, (module) => computeDisplayedWeaponDamage(module));
  totals.weaponShieldPressure = sumWeaponSlotMetric(selection, (module) => computeWeaponRolePressure(module, "shield_breaker"));
  totals.weaponHullPressure = sumWeaponSlotMetric(selection, (module) => computeWeaponRolePressure(module, "hull_finisher"));
  totals.weaponDisablePressure = sumWeaponSlotMetric(selection, (module) => computeWeaponRolePressure(module, "disable"));
  totals.weaponCount = getTotalWeaponCount(selection);
  totals.weaponLoadoutSummary = buildWeaponLoadoutSummary(selection);
  totals.requiredLandingThrust = computeRequiredLandingThrust(totals.mass);
  totals.landingThrustSurplus = totals.landingThrust - totals.requiredLandingThrust;
  totals.powerHeadroom = totals.reactorPower - totals.allocatedPower;
  totals.mobilityEstimate = clamp(
    ((totals.maneuveringThrust / Math.max(totals.mass, 1)) * 11.9) - 47.6,
    0,
    100
  );

  const componentScores = {
    reactorPower: normalizeAgainstMax(totals.reactorPower, builderState.datasets.builderMaxima.reactorPower),
    shieldStrength: normalizeAgainstMax(totals.shield, builderState.datasets.builderMaxima.shieldStrength),
    weaponPressure: normalizeAgainstMax(
      totals.weaponPressure,
      builderState.datasets.builderMaxima.weaponPressure * Math.max(totals.weaponCount, 1)
    ),
    mobility: totals.mobilityEstimate,
    jumpCapability: computeJumpCapabilityScore(totals),
    cargoCapacity: normalizeAgainstMax(
      totals.cargo,
      builderState.datasets.builderMaxima.cargoCapacity * selection.cargoCount
    ),
    fuelCapacity: normalizeAgainstMax(
      totals.fuel,
      Math.max(builderState.datasets.builderMaxima.fuelCapacity * Math.max(selection.fuelCount, 1), 1)
    ),
    massEfficiency: computeMassEfficiencyScore(totals),
    landingSupport: computeLandingSupportScore(totals)
  };

  const compatibility = buildFunctionalCompatibility(selection, totals, incompatibilities);

  const buildScore = computeWeightedProfileScore(componentScores, profile.weights);
  const bottleneck = detectBuildBottleneck({
    selection,
    profile,
    totals,
    componentScores,
    incompatibilities,
    compatibility
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
    compatibility,
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
    compatibility,
    referenceShipDelta,
    recommendations
  } = analysis;
  const powerDelta = totals.reactorPower - totals.allocatedPower;
  const statusTags = [
    `Modo ${humanizeMode(selection.mode)}`,
    `Perfil ${profile.name}`,
    `Classe ${selection.reactor.moduleClass || "C"}`,
    `Loadout ${humanizeCombatStyle(selection.combatStyleId)}`,
    powerDelta >= 0 ? "Energia ok" : "Energia estourada"
  ];

  return `
    <div class="ship-builder-metric-grid">
      <article class="metric-card accent-card">
        <span>Score da build</span>
        <strong>${formatScore(buildScore)}</strong>
        <small>Pontuacao ponderada pelo perfil escolhido</small>
      </article>
      <article class="metric-card">
        <span>Dano da nave</span>
        <strong>${formatNumber(totals.displayDamage)}</strong>
        <small>Soma bruta das armas equipadas</small>
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
      <div class="ship-builder-compatibility-grid">
        ${renderCompatibilityCard("Classe", compatibility.classCompatibility)}
        ${renderCompatibilityCard("Energia", compatibility.powerBudget)}
        ${renderCompatibilityCard("Landing thrust", compatibility.landingSupport)}
        ${renderCompatibilityCard("Mobilidade", compatibility.mobility)}
      </div>
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
      <article class="detail-card ${totals.landingThrustSurplus >= 0 ? "is-positive" : "is-negative"}">
        <span>Landing thrust</span>
        <strong>${formatNumber(totals.landingThrust)} / ${formatNumber(totals.requiredLandingThrust)}</strong>
      </article>
      <article class="detail-card">
        <span>Dano da nave</span>
        <strong>${formatNumber(totals.displayDamage)}</strong>
        <small class="detail-meta">Soma bruta das armas equipadas</small>
      </article>
      <article class="detail-card">
        <span>Loadout pressure</span>
        <strong>${formatNumber(totals.weaponPressure)}</strong>
        <small class="detail-meta">${escapeHtml(totals.weaponLoadoutSummary)}</small>
      </article>
      <article class="detail-card">
        <span>Shield break</span>
        <strong>${formatNumber(totals.weaponShieldPressure)}</strong>
      </article>
      <article class="detail-card">
        <span>Hull finish</span>
        <strong>${formatNumber(totals.weaponHullPressure)}</strong>
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
      ${renderShipBuilderScoreCard("Loadout", componentScores.weaponPressure)}
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
  `;
}

function updateUpgradeRoadmap(analysis) {
  const container = document.getElementById("ship-upgrade-roadmap");
  const mode = document.getElementById("builder-mode").value;

  if (!analysis || mode !== "upgrade_current_ship" || !analysis.selection.referenceShip) {
    container.className = "empty-state";
    container.textContent = "Ativa o modo de upgrade da nave atual para receber um plano em fases.";
    return;
  }

  const recommendations = analysis.recommendations || [];
  if (recommendations.length === 0) {
    container.className = "empty-state";
    container.textContent = "Ainda nao apareceu uma rota clara de upgrade para esta nave.";
    return;
  }

  const phaseTitles = ["Troca primeiro", "Depois segue com", "Fecha com"];
  container.className = "ship-upgrade-roadmap";
  container.innerHTML = `
    <article class="ship-builder-reference-card">
      <div class="ship-builder-reference-top">
        <div>
          <div class="detail-meta">Nave atual</div>
          <h3>${escapeHtml(analysis.selection.referenceShip.name)}</h3>
        </div>
        <strong>${formatScore(analysis.selection.referenceShip.scores?.balanced)}</strong>
      </div>
      <p class="ship-upgrade-copy">
        O plano abaixo segue o gargalo atual da build e a ordem de impacto mais alta encontrada no catalogo de modulos.
      </p>
      <div class="ship-upgrade-phase-list">
        ${recommendations
          .map((recommendation, index) => renderUpgradePhaseCard(recommendation, phaseTitles[index] || "Proxima troca"))
          .join("")}
      </div>
    </article>
  `;
}

function renderUpgradePhaseCard(recommendation, title) {
  return `
    <article class="ship-builder-recommendation-card">
      <div class="ship-builder-recommendation-top">
        <div>
          <div class="detail-meta">${escapeHtml(title)}</div>
          <strong>${escapeHtml(recommendation.to.name)}</strong>
        </div>
        <span class="score-badge">+${formatScore(recommendation.scoreGain)}</span>
      </div>
      <div class="detail-meta">${escapeHtml(recommendation.label || humanizeKey(recommendation.moduleType))}</div>
      <p>${escapeHtml(recommendation.reason)}</p>
    </article>
  `;
}

function renderCompatibilityCard(label, item) {
  return `
    <article class="detail-card ${item.ok ? "is-positive" : "is-negative"}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <small class="detail-meta">${escapeHtml(item.detail)}</small>
    </article>
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
    { label: "Cargo Hold", module: selection.cargoHold, count: selection.cargoCount },
    { label: "Fuel Tank", module: selection.fuelTank, count: selection.fuelCount },
    { label: "Landing Gear", module: selection.landingGear, count: selection.landingGearCount }
  ]
    .concat(
      getActiveWeaponSlots(selection).map((slot) => ({
        label: `Weapon slot ${slot.slot}`,
        module: slot.module,
        count: slot.count
      }))
    )
    .filter((entry) => entry.module && entry.count > 0);

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
          <div class="detail-meta">${escapeHtml(recommendation.label || humanizeKey(recommendation.moduleType))}</div>
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
  const loadoutText = totals.weaponLoadoutSummary
    ? ` O loadout esta em ${totals.weaponLoadoutSummary.toLowerCase()}.`
    : "";

  return `No perfil ${profile.name}, a build esta mais forte em ${leadingEdge} e o gargalo principal esta em ${bottleneck.title.toLowerCase()}. Ela fecha com ${formatNumber(totals.allocatedPower)} de energia alocada, ${formatNumber(totals.displayDamage)} de dano bruto, ${formatNumber(totals.mass)} de massa, ${formatNumber(totals.cargo)} de cargo e ${formatNumber(totals.landingThrust)} de landing thrust para ${formatNumber(totals.requiredLandingThrust)} necessarios.${loadoutText}${shipReferenceText}`;
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
    builderState.datasets.shipBuilderRules.recommendationProfiles.find((profile) => profile.id === profileId) ||
    builderState.datasets.shipBuilderRules.recommendationProfiles[0]
  );
}

function humanizeMode(mode) {
  const labels = {
    manual: "Manual",
    ship_preset: "Preset por nave",
    upgrade_current_ship: "Upgrade da nave atual"
  };

  return labels[mode] || "Manual";
}

function humanizeCombatStyle(styleId) {
  const labels = {
    balanced: "Balanced",
    shield_break_hull_finish: "Shield break + hull finish",
    mono_particle: "Mono particle",
    boarding_disable: "Boarding / disable",
    missile_support: "Missile support"
  };

  return labels[styleId] || "Balanced";
}

function getCombatStylePlan(styleId, profileId, countPreset) {
  const defaults = countPreset?.weaponSlotCounts || [2, 1, 1];
  const stylePlans = {
    balanced: [
      { role: "all_rounder", preferredType: "particle", count: defaults[0] ?? 2, budgetShare: 0.42 },
      { role: "shield_breaker", preferredType: "laser", count: defaults[1] ?? 2, budgetShare: 0.33 },
      { role: "hull_finisher", preferredType: "ballistic", count: defaults[2] ?? 1, budgetShare: 0.25 }
    ],
    shield_break_hull_finish: [
      { role: "shield_breaker", preferredType: "laser", count: defaults[0] ?? 2, budgetShare: 0.36 },
      { role: "hull_finisher", preferredType: "ballistic", count: defaults[1] ?? 2, budgetShare: 0.34 },
      { role: "finisher_support", preferredType: "missiles", count: defaults[2] ?? 1, budgetShare: 0.3 }
    ],
    mono_particle: [
      { role: "all_rounder", preferredType: "particle", count: Math.max(defaults[0] ?? 2, 2), budgetShare: 0.34 },
      { role: "all_rounder", preferredType: "particle", count: Math.max(defaults[1] ?? 2, 2), budgetShare: 0.33 },
      { role: "all_rounder", preferredType: "particle", count: Math.max(defaults[2] ?? 1, 1), budgetShare: 0.33 }
    ],
    boarding_disable: [
      { role: "shield_breaker", preferredType: "laser", count: defaults[0] ?? 2, budgetShare: 0.34 },
      { role: "disable", preferredType: "electromagnetic", count: Math.max(defaults[1] ?? 1, 1), budgetShare: 0.24 },
      { role: "all_rounder", preferredType: "particle", count: defaults[2] ?? 1, budgetShare: 0.22 }
    ],
    missile_support: [
      { role: "all_rounder", preferredType: "particle", count: defaults[0] ?? 2, budgetShare: 0.38 },
      { role: "finisher_support", preferredType: "missiles", count: Math.max(defaults[1] ?? 1, 1), budgetShare: 0.36 },
      { role: "shield_breaker", preferredType: "laser", count: defaults[2] ?? 1, budgetShare: 0.26 }
    ]
  };
  const plannedSlots = stylePlans[styleId] || stylePlans.balanced;

  return plannedSlots.map((slot, index) => ({
    slot: index + 1,
    role: slot.role,
    preferredType: slot.preferredType,
    count: Math.max(0, slot.count || 0),
    budgetShare: slot.budgetShare
  }));
}

function detectWeaponType(module) {
  const declaredType = String(module?.weaponType || "").toLowerCase();
  if (declaredType) {
    if (declaredType === "missiles") return "missiles";
    if (declaredType === "electromagnetic") return "electromagnetic";
    return declaredType;
  }

  const name = normalizeText(module?.name || "");
  if (name.includes("laser") || name.includes("pulse")) return "laser";
  if (name.includes("missile")) return "missiles";
  if (name.includes("suppressor") || name.includes("em")) return "electromagnetic";
  if (name.includes("beam")) return "particle";
  return "ballistic";
}

function isTurretWeapon(module) {
  return normalizeText(module?.name || "").includes("turret");
}

function computeWeaponRolePressure(module, role) {
  if (!module) return 0;

  const stats = module.stats || {};
  const shield = stats.shieldDpsPerPower || stats.shieldDamage || 0;
  const hull = stats.hullDpsPerPower || stats.hullDamage || 0;
  const em = stats.emDamage || 0;

  switch (role) {
    case "shield_breaker":
      return (shield * 3.2) + (hull * 0.8);
    case "hull_finisher":
      return (hull * 3.2) + (shield * 0.7);
    case "disable":
      return (em * 3.1) + (shield * 0.25);
    case "finisher_support":
      return (hull * 2.1) + (shield * 1.8);
    case "all_rounder":
    default:
      return (Math.min(shield, hull) * 2.6) + (Math.max(shield, hull) * 1.2) + (em * 0.2);
  }
}

function computeLoadoutPressure(selection) {
  return getActiveWeaponSlots(selection).reduce((total, slot) => {
    return total + (computeWeaponRolePressure(slot.module, slot.role || "all_rounder") * slot.count);
  }, 0);
}

function buildWeaponLoadoutSummary(selection) {
  const slots = getActiveWeaponSlots(selection);
  if (slots.length === 0) {
    return "";
  }

  return slots
    .map((slot) => {
      const type = humanizeKey(detectWeaponType(slot.module));
      return `${type} x${slot.count}`;
    })
    .join(" + ");
}

function scoreWeaponForLoadout(module, slotPlan, profileId) {
  const stats = module.stats || {};
  const weaponType = detectWeaponType(module);
  const rolePressure = computeWeaponRolePressure(module, slotPlan.role);
  let score = rolePressure;

  if (slotPlan.preferredType === weaponType) {
    score += 32;
  }

  if (slotPlan.role === "shield_breaker" && weaponType === "missiles") {
    score -= 18;
  }

  if (slotPlan.role === "hull_finisher" && weaponType === "laser") {
    score -= 12;
  }

  if (slotPlan.role === "disable" && weaponType !== "electromagnetic") {
    score -= 45;
  }

  if (slotPlan.role === "all_rounder" && weaponType === "particle") {
    score += 20;
  }

  if (slotPlan.role === "finisher_support" && weaponType === "missiles") {
    score += 24;
  }

  if (isTurretWeapon(module)) {
    score -= 14;
  }

  if (profileId === "exploration") {
    score -= (stats.maxPower || 0) * 8.5;
    score -= (stats.mass || 0) * 1.5;
  } else if (profileId === "cargo") {
    score -= (stats.maxPower || 0) * 7;
    score -= (stats.mass || 0) * 1.8;
  } else if (profileId === "combat") {
    score -= (stats.maxPower || 0) * 2.4;
    score -= (stats.mass || 0) * 0.55;
  } else {
    score -= (stats.maxPower || 0) * 4.8;
    score -= (stats.mass || 0) * 0.9;
  }

  return score;
}

function pickWeaponForLoadoutSlot(slotPlan, profile, options = {}) {
  const {
    exactClass = null,
    reactorClass = null,
    maxPowerPerUnit = null,
    preferredModuleId = null,
    avoidModuleIds = [],
    avoidWeaponTypes = []
  } = options;
  const compatibleModules = getModulesForBuilderSelection("weapon", { exactClass, reactorClass })
    .filter((module) => !avoidModuleIds.includes(module.id));
  const constrainedModules = compatibleModules.filter((module) =>
    maxPowerPerUnit == null ||
    !module.stats?.maxPower ||
    Number(module.stats.maxPower) <= Number(maxPowerPerUnit)
  );
  const constrainedUniqueTypeModules = constrainedModules.filter((module) => !avoidWeaponTypes.includes(detectWeaponType(module)));
  const fallbackUniqueTypeModules = compatibleModules.filter((module) => !avoidWeaponTypes.includes(detectWeaponType(module)));
  const candidatePool =
    constrainedUniqueTypeModules.length > 0 ? constrainedUniqueTypeModules :
    constrainedModules.length > 0 ? constrainedModules :
    fallbackUniqueTypeModules.length > 0 ? fallbackUniqueTypeModules :
    compatibleModules;
  const modules = candidatePool
    .slice()
    .sort((a, b) => scoreWeaponForLoadout(b, slotPlan, profile.id) - scoreWeaponForLoadout(a, slotPlan, profile.id));

  if (preferredModuleId) {
    const preferred = modules.find((module) => module.id === preferredModuleId);
    if (preferred) {
      return preferred;
    }
  }

  return modules[0] || null;
}

function buildWeaponLoadout(styleId, profile, options = {}) {
  const {
    exactClass = null,
    reactorClass = null,
    weaponPowerBudget = null,
    countPreset = getAutoBuildCountPreset(profile.id),
    targetDamage = null
  } = options;
  const slotPlans = getCombatStylePlan(styleId, profile.id, countPreset);
  const totalBudget = weaponPowerBudget == null ? Infinity : Math.max(weaponPowerBudget, 0);
  const loadout = [];
  const usedIds = [];
  const usedTypes = [];
  const targetPerSlot = targetDamage ? targetDamage / Math.max(slotPlans.length, 1) : null;

  for (const slotPlan of slotPlans) {
    if (!slotPlan.count) {
      loadout.push({ slot: slotPlan.slot, role: slotPlan.role, module: null, count: 0 });
      continue;
    }

    const maxPowerPerUnit = Number.isFinite(totalBudget)
      ? Math.max(2, Math.floor((totalBudget * slotPlan.budgetShare) / Math.max(slotPlan.count, 1)))
      : null;
    const preferredModule = targetPerSlot
      ? findClosestModuleMatch("weapon", targetPerSlot, getShipComparableWeaponValue, { exactClass, reactorClass })
      : null;
    const weapon = pickWeaponForLoadoutSlot(slotPlan, profile, {
      exactClass,
      reactorClass,
      maxPowerPerUnit,
      preferredModuleId: slotPlan.role === "all_rounder" ? preferredModule?.id : null,
      avoidModuleIds: styleId === "mono_particle" ? [] : usedIds,
      avoidWeaponTypes: styleId === "mono_particle" ? [] : usedTypes
    });

    loadout.push({
      slot: slotPlan.slot,
      role: slotPlan.role,
      module: weapon,
      count: slotPlan.count
    });

    if (weapon) {
      usedIds.push(weapon.id);
      usedTypes.push(detectWeaponType(weapon));
    }
  }

  return normalizeWeaponSlots(loadout);
}

function getAutoBuildCountPreset(profileId) {
  const presets = {
    balanced: { engineCount: 4, weaponSlotCounts: [2, 2, 1], cargoCount: 2, fuelCount: 1 },
    exploration: { engineCount: 3, weaponSlotCounts: [2, 1, 0], cargoCount: 2, fuelCount: 2 },
    combat: { engineCount: 4, weaponSlotCounts: [3, 2, 2], cargoCount: 1, fuelCount: 1 },
    cargo: { engineCount: 3, weaponSlotCounts: [2, 1, 0], cargoCount: 4, fuelCount: 2 }
  };

  return presets[profileId] || presets.balanced;
}

function buildShipPresetFromShip(ship, profile) {
  const exactClass = ship.class || "C";
  const combatStyle = getBuilderCombatStyle();
  const countPreset = getAutoBuildCountPreset(profile.id);
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
  const weaponPowerBudget = Math.max(
    8,
    (ship.reactor || reactor?.stats?.power || 0) - ((shield?.stats?.maxPower || 0) + (gravDrive?.stats?.maxPower || 0))
  );
  const weaponSlots = buildWeaponLoadout(combatStyle, profile, {
    exactClass,
    reactorClass: exactClass,
    weaponPowerBudget,
    countPreset,
    targetDamage: ship.damage || null
  });
  const enginePreset = findClosestEnginePreset({
    ship,
    reactor,
    shield,
    gravDrive,
    weaponSlots,
    profile
  });
  const landingPreset = chooseLandingGearPreset({
    reactor,
    engine: enginePreset?.module,
    engineCount: enginePreset?.count || countPreset.engineCount,
    shield,
    gravDrive,
    weaponSlots,
    cargoHold: cargoPreset?.module,
    cargoCount: cargoPreset?.count || countPreset.cargoCount,
    fuelTank: fuelPreset?.module,
    fuelCount: fuelPreset?.count ?? countPreset.fuelCount
  });

  return {
    combatStyle,
    reactor,
    shield,
    gravDrive,
    engine: enginePreset?.module || pickBestModuleForAutoBuild("engine", profile, { exactClass, reactorClass: exactClass }),
    engineCount: enginePreset?.count || countPreset.engineCount,
    weaponSlots,
    cargoHold: cargoPreset?.module || pickBestModuleForAutoBuild("cargo_hold", profile, { reactorClass: exactClass }),
    cargoCount: cargoPreset?.count || countPreset.cargoCount,
    fuelTank: fuelPreset?.module || pickBestModuleForAutoBuild("fuel_tank", profile, { reactorClass: exactClass }),
    fuelCount: fuelPreset?.count ?? countPreset.fuelCount,
    landingGear: landingPreset?.module || pickBestModuleForAutoBuild("landing_gear", profile, { reactorClass: exactClass }),
    landingGearCount: landingPreset?.count || 3
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
  const { ship, reactor, shield, gravDrive, weaponSlots } = context;
  const exactClass = reactor?.moduleClass || ship.class || "C";
  const engines = getModulesForBuilderSelection("engine", { exactClass, reactorClass: exactClass });
  const preferredCount = getPreferredEngineCountByClass(exactClass);
  const targetPowerBudget = Math.max(
    3,
    (ship.reactor || reactor?.stats?.power || 0) -
      ((shield?.stats?.maxPower || 0) + (gravDrive?.stats?.maxPower || 0) + sumWeaponSlotMetric({ weaponSlots }, (module) => module?.stats?.maxPower || 0))
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

  return (builderState.datasets.modulesByType[moduleType] || []).filter((module) => {
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
  const mapping = { A: 2, B: 3, C: 4 };
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

function chooseLandingGearPreset(context) {
  const {
    reactor,
    engine,
    engineCount,
    shield,
    gravDrive,
    weaponSlots,
    cargoHold,
    cargoCount,
    fuelTank,
    fuelCount
  } = context;
  const baseMass =
    (reactor?.stats?.mass || 0) +
    ((engine?.stats?.mass || 0) * (engineCount || 0)) +
    (shield?.stats?.mass || 0) +
    (gravDrive?.stats?.mass || 0) +
    sumWeaponSlotMetric({ weaponSlots }, (module) => module?.stats?.mass || 0) +
    ((cargoHold?.stats?.mass || 0) * (cargoCount || 0)) +
    ((fuelTank?.stats?.mass || 0) * (fuelCount || 0));
  const modules = getModulesForBuilderSelection("landing_gear", { reactorClass: reactor?.moduleClass || "C" });
  let bestMatch = null;

  for (const module of modules) {
    for (let count = 1; count <= 12; count += 1) {
      const totalMass = baseMass + ((module.stats?.mass || 0) * count);
      const requiredLandingThrust = computeRequiredLandingThrust(totalMass);
      const deliveredLandingThrust = (module.stats?.landingThrust || 0) * count;
      const deficit = Math.max(0, requiredLandingThrust - deliveredLandingThrust);
      const surplus = Math.max(0, deliveredLandingThrust - requiredLandingThrust);
      const score = (deficit * 1000) + (surplus * 9) + ((module.stats?.mass || 0) * count);

      if (!bestMatch || score < bestMatch.score) {
        bestMatch = {
          module,
          count,
          score
        };
      }
    }
  }

  return bestMatch;
}

function buildAutoBuildForClass(profile, targetClass, countPreset, combatStyle) {
  const reactorCandidates = getModulesForBuilderSelection("reactor", { exactClass: targetClass })
    .slice()
    .sort((a, b) => {
      const powerDiff = (a.stats?.power || 0) - (b.stats?.power || 0);
      if (powerDiff !== 0) return powerDiff;
      return (a.stats?.mass || 0) - (b.stats?.mass || 0);
    });
  const powerPlan = getProfilePowerPlan(profile.id);
  let bestBuild = null;

  for (const reactor of reactorCandidates) {
    const candidate = buildAutoBuildCandidate(reactor, profile, countPreset, powerPlan, combatStyle);
    if (!candidate) {
      continue;
    }

    const analysis = analyzeShipBuild(candidate, { includeRecommendations: false });
    const deficitPenalty = Math.max(0, analysis.totals.allocatedPower - analysis.totals.reactorPower) * 100;
    const surplusPenalty = Math.max(0, analysis.totals.powerHeadroom - powerPlan.preferredHeadroom) * 0.9;
    const score = analysis.buildScore - deficitPenalty - surplusPenalty;

    if (!bestBuild || score > bestBuild.score) {
      bestBuild = {
        ...candidate,
        score
      };
    }
  }

  return bestBuild;
}

function buildAutoBuildCandidate(reactor, profile, countPreset, powerPlan, combatStyle = "balanced") {
  const reactorClass = reactor?.moduleClass || "C";
  const powerBudget = Math.max(0, (reactor?.stats?.power || 0) - powerPlan.reserve);
  const engine = pickBestModuleForAutoBuild("engine", profile, {
    exactClass: reactorClass,
    reactorClass,
    maxPowerPerUnit: Math.max(2, Math.floor((powerBudget * powerPlan.engineShare) / Math.max(countPreset.engineCount, 1)))
  });
  const shield = pickBestModuleForAutoBuild("shield_generator", profile, {
    exactClass: reactorClass,
    reactorClass,
    maxPowerPerUnit: Math.max(4, Math.floor(powerBudget * powerPlan.shieldShare))
  });
  const gravDrive = pickBestModuleForAutoBuild("grav_drive", profile, {
    exactClass: reactorClass,
    reactorClass,
    maxPowerPerUnit: Math.max(3, Math.floor(powerBudget * powerPlan.gravShare))
  });
  const weaponSlots = buildWeaponLoadout(combatStyle, profile, {
    exactClass: reactorClass,
    reactorClass,
    weaponPowerBudget: Math.max(4, Math.floor(powerBudget * powerPlan.weaponShare)),
    countPreset
  });
  const cargoHold = pickBestModuleForAutoBuild("cargo_hold", profile, { reactorClass });
  const fuelTank = pickBestModuleForAutoBuild("fuel_tank", profile, { reactorClass });

  if (!engine || !shield || !gravDrive || getActiveWeaponSlots({ weaponSlots }).length === 0 || !cargoHold) {
    return null;
  }

  const candidate = {
    profileId: profile.id,
    combatStyleId: combatStyle,
    referenceShip: null,
    reactor,
    engine,
    engineCount: countPreset.engineCount,
    shield,
    gravDrive,
    weaponSlots,
    cargoHold,
    cargoCount: countPreset.cargoCount,
    fuelTank,
    fuelCount: countPreset.fuelCount,
    landingGear: null,
    landingGearCount: 1
  };

  fitCandidateToPowerBudget(candidate, profile, powerBudget);

  const landingPreset = chooseLandingGearPreset(candidate);
  candidate.landingGear = landingPreset?.module || null;
  candidate.landingGearCount = landingPreset?.count || 1;

  return candidate;
}

function fitCandidateToPowerBudget(candidate, profile, powerBudget) {
  const downgradeOrder = ["weapon", "gravDrive", "shield", "engine"];
  let guard = 0;

  while (computeAllocatedPower(candidate) > powerBudget && guard < 24) {
    let changed = false;

    for (const key of downgradeOrder) {
      const downgraded = key === "weapon"
        ? downgradeWeaponLoadout(candidate, profile)
        : findLowerPowerAlternativeForCandidate(candidate, profile, key);
      if (downgraded) {
        if (key !== "weapon") {
          candidate[key] = downgraded;
        }
        changed = true;
        break;
      }
    }

    if (!changed) {
      break;
    }

    guard += 1;
  }
}

function downgradeWeaponLoadout(candidate, profile) {
  const activeSlots = getActiveWeaponSlots(candidate);
  const allowDuplicateTypes = candidate.combatStyleId === "mono_particle";
  let bestFallback = null;

  for (const slot of activeSlots) {
    const slotIndex = slot.slot - 1;
    const currentModule = slot.module;
    const currentPower = (currentModule?.stats?.maxPower || 0) * slot.count;
    const currentScore = scoreWeaponForLoadout(currentModule, {
      role: slot.role || "all_rounder",
      preferredType: detectWeaponType(currentModule)
    }, profile.id);
    const options = getModulesForBuilderSelection("weapon", {
      exactClass: candidate.reactor?.moduleClass || "C",
      reactorClass: candidate.reactor?.moduleClass || "C"
    })
      .filter((module) => module.id !== currentModule.id)
      .filter((module) => {
        if (allowDuplicateTypes) {
          return true;
        }

        const candidateType = detectWeaponType(module);
        return !activeSlots.some((otherSlot) => otherSlot.slot !== slot.slot && detectWeaponType(otherSlot.module) === candidateType);
      })
      .filter((module) => ((module.stats?.maxPower || 0) * slot.count) < currentPower)
      .map((module) => ({
        module,
        slotIndex,
        scoreLoss: currentScore - scoreWeaponForLoadout(module, {
          role: slot.role || "all_rounder",
          preferredType: detectWeaponType(currentModule)
        }, profile.id),
        powerDrop: currentPower - ((module.stats?.maxPower || 0) * slot.count)
      }))
      .sort((a, b) => (a.scoreLoss / Math.max(a.powerDrop, 1)) - (b.scoreLoss / Math.max(b.powerDrop, 1)));

    if (!bestFallback || (options[0] && ((options[0].scoreLoss / Math.max(options[0].powerDrop, 1)) < (bestFallback.scoreLoss / Math.max(bestFallback.powerDrop, 1))))) {
      bestFallback = options[0] || bestFallback;
    }
  }

  if (!bestFallback) {
    return null;
  }

  candidate.weaponSlots = normalizeWeaponSlots(candidate.weaponSlots);
  candidate.weaponSlots[bestFallback.slotIndex] = {
    ...candidate.weaponSlots[bestFallback.slotIndex],
    module: bestFallback.module
  };
  return bestFallback.module;
}

function findLowerPowerAlternativeForCandidate(candidate, profile, key) {
  const mapping = {
    engine: { moduleType: "engine", count: candidate.engineCount, exactClass: candidate.reactor?.moduleClass || "C" },
    shield: { moduleType: "shield_generator", count: 1, exactClass: candidate.reactor?.moduleClass || "C" },
    gravDrive: { moduleType: "grav_drive", count: 1, exactClass: candidate.reactor?.moduleClass || "C" }
  };
  const config = mapping[key];
  const currentModule = candidate[key];
  if (!config || !currentModule) {
    return null;
  }

  const currentPower = (currentModule.stats?.maxPower || 0) * config.count;
  const currentScore = scoreModuleForProfile(config.moduleType, currentModule, profile);
  const options = getModulesForBuilderSelection(config.moduleType, {
    exactClass: config.exactClass,
    reactorClass: config.exactClass
  })
    .filter((module) => module.id !== currentModule.id)
    .filter((module) => ((module.stats?.maxPower || 0) * config.count) < currentPower)
    .map((module) => ({
      module,
      scoreLoss: currentScore - scoreModuleForProfile(config.moduleType, module, profile),
      powerDrop: currentPower - ((module.stats?.maxPower || 0) * config.count)
    }))
    .sort((a, b) => {
      const lossRatioA = a.scoreLoss / Math.max(a.powerDrop, 1);
      const lossRatioB = b.scoreLoss / Math.max(b.powerDrop, 1);
      return lossRatioA - lossRatioB;
    });

  return options[0]?.module || null;
}

function computeAllocatedPower(candidate) {
  return (
    ((candidate.engine?.stats?.maxPower || 0) * (candidate.engineCount || 0)) +
    (candidate.shield?.stats?.maxPower || 0) +
    (candidate.gravDrive?.stats?.maxPower || 0) +
    sumWeaponSlotMetric(candidate, (module) => module?.stats?.maxPower || 0)
  );
}

function getProfilePowerPlan(profileId) {
  const plans = {
    balanced: {
      reserve: 2,
      preferredHeadroom: 4,
      engineShare: 0.30,
      shieldShare: 0.18,
      gravShare: 0.18,
      weaponShare: 0.24
    },
    exploration: {
      reserve: 2,
      preferredHeadroom: 5,
      engineShare: 0.26,
      shieldShare: 0.14,
      gravShare: 0.30,
      weaponShare: 0.14
    },
    combat: {
      reserve: 3,
      preferredHeadroom: 3,
      engineShare: 0.24,
      shieldShare: 0.22,
      gravShare: 0.10,
      weaponShare: 0.34
    },
    cargo: {
      reserve: 2,
      preferredHeadroom: 4,
      engineShare: 0.24,
      shieldShare: 0.14,
      gravShare: 0.14,
      weaponShare: 0.12
    }
  };

  return plans[profileId] || plans.balanced;
}

function pickBestModuleForAutoBuild(moduleType, profile, options = {}) {
  const { exactClass = null, reactorClass = null, maxPowerPerUnit = null } = options;
  const modules = getModulesForBuilderSelection(moduleType, { exactClass, reactorClass })
    .filter((module) =>
      maxPowerPerUnit == null ||
      !module.stats?.maxPower ||
      Number(module.stats.maxPower) <= Number(maxPowerPerUnit)
    )
    .slice()
    .sort((a, b) => scoreModuleForProfile(moduleType, b, profile) - scoreModuleForProfile(moduleType, a, profile));

  return modules[0] || getModulesForBuilderSelection(moduleType, { exactClass, reactorClass })
    .slice()
    .sort((a, b) => scoreModuleForProfile(moduleType, b, profile) - scoreModuleForProfile(moduleType, a, profile))[0] || null;
}

function scoreModuleForProfile(moduleType, module, profile) {
  const stats = module.stats || {};
  const profileId = profile?.id || "balanced";
  const damagePressure = computeWeaponPressure(module);

  switch (moduleType) {
    case "reactor":
      if (profileId === "exploration") {
        return (stats.power || 0) * 11 + (stats.hull || 0) * 0.35 - (stats.mass || 0) * 0.7;
      }
      if (profileId === "cargo") {
        return (stats.power || 0) * 13 + (stats.hull || 0) * 0.5 - (stats.mass || 0) * 0.45;
      }
      return (stats.power || 0) * 14 + (stats.hull || 0) - (stats.mass || 0) * 0.35;
    case "engine":
      if (profileId === "exploration") {
        return ((stats.maneuveringThrust || 0) * 1.05) + ((stats.maneuveringThrustPerPower || 0) * 180) - ((stats.mass || 0) * 1.9);
      }
      if (profileId === "combat") {
        return ((stats.maneuveringThrust || 0) * 0.95) + ((stats.thrust || 0) * 0.12) - ((stats.mass || 0) * 1.25);
      }
      if (profileId === "cargo") {
        return ((stats.thrust || 0) * 0.14) + ((stats.maneuveringThrustPerPower || 0) * 120) - ((stats.mass || 0) * 1.15);
      }
      return ((stats.maneuveringThrust || 0) * 0.9) + ((stats.thrust || 0) * 0.08) - ((stats.mass || 0) * 1.6);
    case "shield_generator":
      if (profileId === "exploration") {
        return (stats.shieldHealth || 0) * 0.75 + ((stats.shieldHealthPerPower || 0) * 46) - ((stats.mass || 0) * 1.1);
      }
      if (profileId === "combat") {
        return (stats.shieldHealth || 0) * 1.2 + ((stats.shieldHealthPerPower || 0) * 34) - ((stats.mass || 0) * 0.55);
      }
      return (stats.shieldHealth || 0) + ((stats.shieldHealthPerPower || 0) * 30) - ((stats.mass || 0) * 0.8);
    case "grav_drive":
      if (profileId === "exploration") {
        return ((stats.jumpThrust || 0) * 26) - ((stats.mass || 0) * 0.65) - ((stats.maxPower || 0) * 2);
      }
      if (profileId === "combat") {
        return ((stats.jumpThrust || 0) * 12) - ((stats.mass || 0) * 1.1);
      }
      return ((stats.jumpThrust || 0) * 16) - ((stats.mass || 0) * 0.8);
    case "weapon":
      if (profileId === "exploration") {
        return damagePressure * 0.7 - ((stats.maxPower || 0) * 10) - ((stats.mass || 0) * 1.6);
      }
      if (profileId === "combat") {
        return damagePressure * 1.25 - ((stats.maxPower || 0) * 4) - ((stats.mass || 0) * 0.45);
      }
      if (profileId === "cargo") {
        return damagePressure * 0.6 - ((stats.maxPower || 0) * 9) - ((stats.mass || 0) * 1.8);
      }
      return damagePressure - ((stats.maxPower || 0) * 6);
    case "cargo_hold":
      if (profileId === "exploration") {
        return ((stats.cargo || 0) * 0.85) + ((stats.cargoPerMass || 0) * 120) - ((stats.mass || 0) * 0.7);
      }
      if (profileId === "combat") {
        return ((stats.cargo || 0) * 0.45) + ((stats.cargoPerMass || 0) * 95) - ((stats.mass || 0) * 0.9);
      }
      if (profileId === "cargo") {
        return ((stats.cargo || 0) * 1.5) + ((stats.cargoPerMass || 0) * 110) - ((stats.mass || 0) * 0.35);
      }
      return ((stats.cargo || 0) * 1) + ((stats.cargoPerMass || 0) * 80) - ((stats.mass || 0) * 0.5);
    case "fuel_tank":
      if (profileId === "exploration") {
        return ((stats.fuel || 0) * 1.7) + ((stats.fuelPerMass || 0) * 80) - ((stats.mass || 0) * 0.35);
      }
      if (profileId === "combat") {
        return ((stats.fuel || 0) * 0.55) + ((stats.fuelPerMass || 0) * 28) - ((stats.mass || 0) * 0.75);
      }
      if (profileId === "cargo") {
        return ((stats.fuel || 0) * 0.8) + ((stats.fuelPerMass || 0) * 44) - ((stats.mass || 0) * 0.45);
      }
      return ((stats.fuel || 0) * 1) + ((stats.fuelPerMass || 0) * 40) - ((stats.mass || 0) * 0.4);
    case "landing_gear":
      if (profileId === "cargo") {
        return ((stats.landingThrust || 0) * 76) - ((stats.mass || 0) * 2.2);
      }
      if (profileId === "exploration") {
        return ((stats.landingThrust || 0) * 52) - ((stats.mass || 0) * 3.6);
      }
      return ((stats.landingThrust || 0) * 60) - ((stats.mass || 0) * 3);
    default:
      return 0;
  }
}

function recommendShipBuildUpgrades(selection, profile, currentScore) {
  const classFilter = getBuilderClassFilter();
  const recommendationTypes = [...new Set([...(profile.priorityOrder || []), "fuel_tank", "landing_gear"])]
    .filter((moduleType) => moduleType === "weapon" ? getActiveWeaponSlots(selection).length > 0 : selection[moduleTypeToSelectionKey(moduleType)]);
  const candidates = [];

  for (const moduleType of recommendationTypes) {
    if (moduleType === "weapon") {
      candidates.push(...buildWeaponUpgradeRecommendations(selection, profile, currentScore, classFilter));
      continue;
    }

    const selectionKey = moduleTypeToSelectionKey(moduleType);
    const currentModule = selection[selectionKey];
    if (!currentModule) continue;

    const options = (builderState.datasets.modulesByType[moduleType] || []).filter((candidate) => {
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
        label: humanizeKey(moduleType),
        from: currentModule,
        to: candidate,
        scoreGain,
        reason: buildUpgradeReason(moduleType, upgradedAnalysis, currentScore)
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

function buildWeaponUpgradeRecommendations(selection, profile, currentScore, classFilter) {
  const recommendations = [];

  for (const slot of getActiveWeaponSlots(selection)) {
    const currentModule = slot.module;
    const rolePlan = {
      role: slot.role || "all_rounder",
      preferredType: detectWeaponType(currentModule)
    };
    const options = getModulesForBuilderSelection("weapon", {
      exactClass: selection.reactor?.moduleClass || "C",
      reactorClass: selection.reactor?.moduleClass || "C"
    }).filter((candidate) => {
      if (candidate.id === currentModule.id) {
        return false;
      }

      if (classFilter !== "all" && candidate.moduleClass && String(candidate.moduleClass).toUpperCase() !== String(classFilter).toUpperCase()) {
        return false;
      }

      return isModuleCompatibleWithReactor(candidate, selection.reactor.moduleClass || "C");
    });

    let bestUpgrade = null;

    for (const candidate of options) {
      const upgradedSlots = normalizeWeaponSlots(selection.weaponSlots);
      upgradedSlots[slot.slot - 1] = {
        ...upgradedSlots[slot.slot - 1],
        module: candidate
      };
      const upgradedSelection = {
        ...selection,
        weaponSlots: upgradedSlots
      };
      const upgradedAnalysis = analyzeShipBuild(upgradedSelection, { includeRecommendations: false });
      const scoreGain = upgradedAnalysis.buildScore - currentScore;

      if (scoreGain <= 0.35) {
        continue;
      }

      const recommendation = {
        moduleType: "weapon",
        label: `Weapon slot ${slot.slot}`,
        from: currentModule,
        to: candidate,
        scoreGain,
        reason: buildWeaponUpgradeReason(slot, candidate, rolePlan, upgradedAnalysis, currentScore)
      };

      if (!bestUpgrade || recommendation.scoreGain > bestUpgrade.scoreGain) {
        bestUpgrade = recommendation;
      }
    }

    if (bestUpgrade) {
      recommendations.push(bestUpgrade);
    }
  }

  return recommendations;
}

function buildUpgradeReason(moduleType, upgradedAnalysis, currentScore) {
  const delta = upgradedAnalysis.buildScore - currentScore;
  const bottleneckTitle = upgradedAnalysis.bottleneck.title.toLowerCase();
  const lookup = {
    reactor: "Abre mais margem de energia e reduz o risco de travar upgrades futuros.",
    engine: "Melhora a mobilidade estimada e deixa a nave menos pesada por thrust entregue.",
    shield_generator: "Sobe a sobrevivencia da build sem mexer no resto do pacote.",
    grav_drive: "Ajuda a build a viajar melhor e reduz o gargalo de salto.",
    weapon: "Aumenta a pressao ofensiva e melhora o score de combate.",
    cargo_hold: "Entrega mais carga util para o mesmo perfil de build.",
    fuel_tank: "Da mais autonomia para exploracao e rotas longas.",
    landing_gear: "Resolve gargalo de pouso e sustenta melhor o peso total da nave."
  };

  return `${lookup[moduleType] || "Melhora o conjunto geral da build."} Ganho estimado de ${formatScore(delta)} pontos e gargalo apontado em ${bottleneckTitle}.`;
}

function buildWeaponUpgradeReason(slot, candidate, rolePlan, upgradedAnalysis, currentScore) {
  const delta = upgradedAnalysis.buildScore - currentScore;
  const targetRole = humanizeKey(rolePlan.role);
  const weaponType = humanizeKey(detectWeaponType(candidate));
  return `Empurra melhor o ${targetRole.toLowerCase()} do slot ${slot.slot} com ${weaponType.toLowerCase()}. Ganho estimado de ${formatScore(delta)} pontos e gargalo apontado em ${upgradedAnalysis.bottleneck.title.toLowerCase()}.`;
}

function buildReferenceShipDelta(ship, totals, buildScore) {
  return {
    ship,
    buildScoreDelta: buildScore - (ship.scores?.balanced || 0),
    reactorDelta: totals.reactorPower - (ship.reactor || 0),
    cargoDelta: totals.cargo - (ship.cargo || 0),
    shieldDelta: totals.shield - (ship.shield || 0),
    jumpDelta: totals.jump - (ship.jump || 0),
    damageDelta: totals.displayDamage - (ship.damage || 0)
  };
}

function detectBuildBottleneck(context) {
  const { profile, totals, componentScores, incompatibilities, compatibility } = context;

  if (incompatibilities.length > 0) {
    return {
      id: "class-ceiling",
      title: "Classe de modulo",
      summary: "Alguma peca passa do limite suportado pelo reactor atual."
    };
  }

  if (!compatibility.landingSupport.ok) {
    return {
      id: "landing-bottleneck",
      title: "Landing gear",
      summary: "A nave nao tem landing thrust suficiente para a massa atual."
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

function buildFunctionalCompatibility(selection, totals, incompatibilities) {
  return {
    classCompatibility: {
      ok: incompatibilities.length === 0,
      title: incompatibilities.length === 0 ? "Dentro da classe" : "Fora da classe",
      detail:
        incompatibilities.length === 0
          ? `Reactor ${selection.reactor?.moduleClass || "C"} suporta os modulos escolhidos`
          : incompatibilities.join(" | ")
    },
    powerBudget: {
      ok: totals.powerHeadroom >= 0,
      title: totals.powerHeadroom >= 0 ? "Power ok" : "Power estourado",
      detail:
        totals.powerHeadroom >= 0
          ? `${formatNumber(totals.powerHeadroom)} de folga`
          : `${formatNumber(Math.abs(totals.powerHeadroom))} acima do limite`
    },
    landingSupport: {
      ok: totals.landingThrustSurplus >= 0,
      title: totals.landingThrustSurplus >= 0 ? "Pouso ok" : "Pouso insuficiente",
      detail: `${formatNumber(totals.landingThrust)} de thrust para ${formatNumber(totals.requiredLandingThrust)} necessarios`
    },
    mobility: {
      ok: totals.mobilityEstimate >= 45,
      title: totals.mobilityEstimate >= 45 ? "Mobilidade estavel" : "Mobilidade fraca",
      detail: `Estimativa atual: ${formatNumber(totals.mobilityEstimate)}`
    }
  };
}

function computeWeightedProfileScore(componentScores, weights) {
  return Object.entries(weights || {}).reduce((total, [key, weight]) => {
    return total + ((componentScores[key] || 0) * weight);
  }, 0);
}

function computeRequiredLandingThrust(totalMass) {
  return Math.max(1, Math.ceil(Number(totalMass || 0) / 200));
}

function computeLandingSupportScore(totals) {
  if (!totals.requiredLandingThrust) {
    return 0;
  }

  const ratio = totals.landingThrust / totals.requiredLandingThrust;
  return clamp(ratio * 100, 0, 100);
}

function computeJumpCapabilityScore(totals) {
  const jumpBase = normalizeAgainstMax(totals.jump, builderState.datasets.builderMaxima.jumpCapability) * 0.72;
  const fuelBase = normalizeAgainstMax(totals.fuel, Math.max(builderState.datasets.builderMaxima.fuelCapacity, 1)) * 0.28;
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

  return computeWeaponRolePressure(module, "all_rounder");
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
  return Math.max(1, ...(items || []).map((item) => Number(getter(item) || 0)));
}

function findShipByName(query) {
  if (!query) return null;

  const normalizedQuery = normalizeText(query);
  return (
    builderState.datasets.ships.items.find((ship) => normalizeText(ship.name) === normalizedQuery) ||
    builderState.datasets.ships.items.find((ship) => normalizeText(ship.name).includes(normalizedQuery)) ||
    null
  );
}

function findModuleByTypeAndName(moduleType, query) {
  if (!query) return null;

  const normalizedQuery = normalizeText(query);
  return (
    (builderState.datasets.modulesByType[moduleType] || []).find(
      (item) => normalizeText(item.name) === normalizedQuery
    ) ||
    (builderState.datasets.modulesByType[moduleType] || []).find(
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
    ...getActiveWeaponSlots(selection).map((slot) => slot.module)
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
    fuel_tank: "fuelTank",
    landing_gear: "landingGear"
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

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json();
}

function renderTagList(items) {
  return items
    .map((item) => `<span class="tag">${escapeHtml(item)}</span>`)
    .join("");
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

function renderBuilderPageError(error) {
  document.body.innerHTML = `
    <main style="padding:32px;font-family:Space Grotesk,sans-serif;color:#eef7fb;background:#07131d;min-height:100vh">
      <h1 style="font-family:Rajdhani,sans-serif">Falha ao carregar o Ship Builder</h1>
      <p>Confirma se estas a correr o projeto num servidor local, como o Live Server do VS Code.</p>
      <pre style="white-space:pre-wrap;color:#ffb6a3">${escapeHtml(error.message || String(error))}</pre>
    </main>
  `;
}
