(async function () {
  const [programRes, teamRes] = await Promise.all([
    fetch("/api/program"),
    fetch("/api/team"),
  ]);
  const program = await programRes.json();
  const team = await teamRes.json();

  const modules = program.weeks.sort((a, b) => a.order - b.order);
  const shortLabel = (w) => (w.id === "capstone" ? "Capstone" : `W${w.order}`);

  const learners = Object.entries(team).map(([learnerId, entry]) => ({
    learnerId,
    name: entry.name || "(unnamed)",
    weeks: entry.weeks || {},
    updatedAt: entry.updatedAt,
  }));

  // --- module summary strip ---
  const summaryEl = document.getElementById("module-summary");
  modules.forEach((m) => {
    const completeCount = learners.filter((l) => l.weeks[m.id] === "complete").length;
    const pct = learners.length ? Math.round((completeCount / learners.length) * 100) : 0;
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.innerHTML = `
      <div class="k">${AIPM.escapeHtml(shortLabel(m))}</div>
      <div class="v">${completeCount}/${learners.length}</div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    `;
    summaryEl.appendChild(cell);
  });

  if (learners.length === 0) {
    document.getElementById("team-table-wrap").style.display = "none";
    document.getElementById("empty-state").style.display = "block";
    return;
  }

  // --- table head ---
  const headRow = document.getElementById("team-table-head");
  headRow.innerHTML = `<th>Name</th>${modules.map((m) => `<th>${AIPM.escapeHtml(shortLabel(m))}</th>`).join("")}<th>Overall</th>`;

  // --- table body, sorted by overall completion desc, then name ---
  const withOverall = learners.map((l) => {
    const completeCount = modules.filter((m) => l.weeks[m.id] === "complete").length;
    return { ...l, completeCount };
  });
  withOverall.sort((a, b) => b.completeCount - a.completeCount || a.name.localeCompare(b.name));

  const statusLabel = { "not-started": "Not started", "in-progress": "In progress", complete: "Complete" };
  const statusSymbol = { "not-started": "–", "in-progress": "…", complete: "✓" };

  const bodyEl = document.getElementById("team-table-body");
  withOverall.forEach((l) => {
    const tr = document.createElement("tr");
    const cells = modules.map((m) => {
      const status = l.weeks[m.id] || "not-started";
      return `<td><span class="pill ${status}" title="${statusLabel[status]}">${statusSymbol[status]}</span></td>`;
    }).join("");
    tr.innerHTML = `<td class="learner-name">${AIPM.escapeHtml(l.name)}</td>${cells}<td class="overall">${l.completeCount}/${modules.length}</td>`;
    bodyEl.appendChild(tr);
  });
})();
