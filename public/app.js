(async function () {
  const nameInput = document.getElementById("name-input");
  nameInput.value = AIPM.getName();
  nameInput.addEventListener("change", () => AIPM.setName(nameInput.value));

  const programRes = await fetch("/api/program");
  const program = await programRes.json();

  document.getElementById("program-title").textContent = program.program.title;
  document.getElementById("program-subtitle").textContent = program.program.subtitle;
  document.getElementById("scenario-note").textContent = program.program.scenarioNote;

  const weeks = program.weeks.sort((a, b) => a.order - b.order);
  const details = await Promise.all(
    weeks.map((w) => fetch(`/api/weeks/${w.id}`).then((r) => r.json()))
  );

  const listEl = document.getElementById("week-list");
  let completeCount = 0;

  weeks.forEach((w, i) => {
    const fieldIds = (details[i].sections || []).map((s) => s.id);
    const status = AIPM.weekStatus(w.id, fieldIds);
    if (status === "complete") completeCount++;

    const a = document.createElement("a");
    a.className = "week-card";
    a.href = w.id === "capstone" ? "/capstone.html" : `/week.html?id=${encodeURIComponent(w.id)}`;

    const statusLabel = { "not-started": "Not started", "in-progress": "In progress", complete: "Complete" }[status];

    a.innerHTML = `
      <div class="idx">${String(w.order).padStart(2, "0")}</div>
      <div class="body">
        <h3>${AIPM.escapeHtml(w.title)}</h3>
        <p>${AIPM.escapeHtml(w.tagline)}</p>
      </div>
      <div class="meta">
        <span class="pill ${status}">${statusLabel}</span>
        <span class="time">${AIPM.escapeHtml(w.timeEstimate)}</span>
      </div>
    `;
    if (i > 0) a.style.borderTop = "1px solid var(--line)";
    listEl.appendChild(a);
  });

  const pct = Math.round((completeCount / weeks.length) * 100);
  document.getElementById("progress-fill").style.width = `${pct}%`;
  document.getElementById("progress-text").textContent = `${completeCount} of ${weeks.length} modules complete`;
})();
