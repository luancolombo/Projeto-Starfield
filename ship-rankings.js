document.addEventListener("DOMContentLoaded", () => {
  initializeShipRankings().catch((error) => {
    document.getElementById("rankings-root").innerHTML = `
      <section class="panel empty-state">
        Falha ao carregar rankings. Confirma se estás a usar Live Server.
        <pre>${escapeHtml(error.message || String(error))}</pre>
      </section>
    `;
  });
});

async function initializeShipRankings() {
  const [ships, rankings] = await Promise.all([
    fetchJson("./data/ships.json"),
    fetchJson("./data/ship-rankings.json")
  ]);

  document.getElementById("ships-count").textContent = String(ships.items.length);
  const rankingList = rankings.rankings || [];
  setupRankingPicker(rankingList);
  renderSelectedRanking(rankingList, getInitialRankingId(rankingList));
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json();
}

function setupRankingPicker(rankings) {
  const legacyNav = document.querySelector(".ranking-nav");
  if (legacyNav) {
    legacyNav.remove();
  }

  const select = document.getElementById("ranking-select");
  if (!select) {
    return;
  }

  select.innerHTML = rankings
    .map((ranking) => `<option value="${escapeHtml(ranking.id)}">${escapeHtml(ranking.name)}</option>`)
    .join("");

  select.addEventListener("change", () => {
    renderSelectedRanking(rankings, select.value);
    history.replaceState(null, "", `#${select.value}`);
  });
}

function getInitialRankingId(rankings) {
  const hashId = decodeURIComponent(window.location.hash.replace("#", ""));
  if (rankings.some((ranking) => ranking.id === hashId)) {
    return hashId;
  }

  return rankings[0]?.id || "";
}

function renderSelectedRanking(rankings, selectedId) {
  const root = document.getElementById("rankings-root");
  const select = document.getElementById("ranking-select");
  const ranking = rankings.find((item) => item.id === selectedId) || rankings[0];

  if (!ranking) {
    root.innerHTML = '<section class="panel empty-state">Nenhum ranking encontrado.</section>';
    return;
  }

  if (select) {
    select.value = ranking.id;
  }

  root.innerHTML = renderRankingSection(ranking);
}

function renderRankingSection(ranking) {
  return `
    <section class="panel full-ranking-section" id="${escapeHtml(ranking.id)}">
      <div class="panel-heading split-heading">
        <div>
          <p class="panel-kicker">Top 50</p>
          <h2>${escapeHtml(ranking.name)}</h2>
        </div>
        <div class="table-caption">
          Exploração ${formatPercent(ranking.weights.exploration)} • Combate ${formatPercent(ranking.weights.combat)}
        </div>
      </div>

      <div class="table-shell">
        <table class="data-table ship-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nave</th>
              <th>Classe</th>
              <th>Score</th>
              <th>Expl.</th>
              <th>Comb.</th>
              <th>Jump</th>
              <th>Fuel</th>
              <th>Cargo</th>
              <th>Shield</th>
              <th>Hull</th>
              <th>Dmg</th>
              <th>Valor</th>
              <th>Como obter</th>
            </tr>
          </thead>
          <tbody>
            ${ranking.items.map(renderShipRow).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderShipRow(ship) {
  return `
    <tr>
      <td>${ship.rank}</td>
      <td>
        <strong>${escapeHtml(ship.name)}</strong>
        ${ship.isDlc ? '<span class="tag tiny-tag">DLC</span>' : ""}
      </td>
      <td><span class="pill resource">Class ${escapeHtml(ship.class)}</span></td>
      <td>${formatNumber(ship.score)}</td>
      <td>${formatNumber(ship.explorationScore)}</td>
      <td>${formatNumber(ship.combatScore)}</td>
      <td>${formatNumber(ship.jump)}</td>
      <td>${formatNumber(ship.fuel)}</td>
      <td>${formatNumber(ship.cargo)}</td>
      <td>${formatNumber(ship.shield)}</td>
      <td>${formatNumber(ship.hull)}</td>
      <td>${formatNumber(ship.damage)}</td>
      <td>${formatCredits(ship.value)}</td>
      <td>${renderAcquisition(ship.acquisition)}</td>
    </tr>
  `;
}

function renderAcquisition(acquisition) {
  if (!acquisition || acquisition.status === "not_collected") {
    return '<span class="detail-meta">A verificar</span>';
  }

  if (acquisition.method === "quest_reward") {
    return `<span class="acquisition-badge quest">Missão</span><small>${escapeHtml(acquisition.notes?.[0] || "Recompensa de missão")}</small>`;
  }

  if (acquisition.method === "piracy") {
    const source = acquisition.sourceUrl
      ? ` <a class="table-link" href="${escapeHtml(acquisition.sourceUrl)}" target="_blank" rel="noreferrer">INARA</a>`
      : "";
    return `<span class="acquisition-badge piracy">Pirataria</span><small>${escapeHtml(acquisition.notes?.[0] || "Não disponível para compra")}${source}</small>`;
  }

  const locations = Array.isArray(acquisition.locations)
    ? acquisition.locations
    : acquisition.locations
      ? [acquisition.locations]
      : [];
  const firstLocation = locations[0];
  if (!firstLocation) {
    return '<span class="acquisition-badge vendor">Vendor</span><small>Vendor verificado</small>';
  }

  const system = firstLocation.system ? `${firstLocation.system} • ` : "";
  const level = firstLocation.requiredLevel ? ` • lvl ${firstLocation.requiredLevel}+` : "";
  const more = locations.length > 1 ? ` +${locations.length - 1} locais` : "";
  const source = acquisition.sourceUrl
    ? ` <a class="table-link" href="${escapeHtml(acquisition.sourceUrl)}" target="_blank" rel="noreferrer">INARA</a>`
    : "";

  return `<span class="acquisition-badge vendor">Vendor</span><small>${escapeHtml(system + firstLocation.vendor + level + more)}${source}</small>`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatCredits(value) {
  return new Intl.NumberFormat("pt-PT", {
    maximumFractionDigits: 0
  }).format(Number(value || 0)) + " cr";
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
