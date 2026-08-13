(async function () {
  const weekId = "capstone";
  const [programRes, capstoneRes] = await Promise.all([
    fetch("/api/program"),
    fetch(`/api/weeks/${weekId}`),
  ]);
  const program = await programRes.json();
  const capstone = await capstoneRes.json();
  const weeks = program.weeks.sort((a, b) => a.order - b.order);
  const priorWeeks = weeks.filter((w) => w.id !== "capstone");

  const priorDetails = await Promise.all(
    priorWeeks.map((w) => fetch(`/api/weeks/${w.id}`).then((r) => r.json()))
  );

  document.title = `${capstone.title}: AI PM Training Program`;
  document.getElementById("week-title").textContent = capstone.title;
  document.getElementById("week-tagline").textContent = capstone.tagline;
  document.getElementById("week-intro").textContent = capstone.intro;
  document.getElementById("scenario-brief").textContent = capstone.scenario.brief;

  // module status list
  const statusListEl = document.getElementById("module-status");
  priorWeeks.forEach((w, i) => {
    const fieldIds = (priorDetails[i].sections || []).map((s) => s.id);
    const status = AIPM.weekStatus(w.id, fieldIds);
    const statusLabel = { "not-started": "Not started", "in-progress": "In progress", complete: "Complete" }[status];
    const a = document.createElement("a");
    a.className = "week-card";
    a.href = `/week.html?id=${w.id}`;
    a.innerHTML = `
      <div class="idx">${String(w.order).padStart(2, "0")}</div>
      <div class="body"><h3>${AIPM.escapeHtml(w.title)}</h3></div>
      <div class="meta"><span class="pill ${status}">${statusLabel}</span></div>
    `;
    if (i > 0) a.style.borderTop = "1px solid var(--line)";
    statusListEl.appendChild(a);
  });

  // what's next: orchestrator model preview
  document.getElementById("whats-next-heading").textContent = capstone.whatsNext.heading;
  document.getElementById("whats-next-thesis").textContent = capstone.whatsNext.thesis;
  document.getElementById("whats-next-note").textContent = capstone.whatsNext.note;
  if (capstone.whatsNext.diagram) {
    document.getElementById("whats-next-diagram-wrap").style.display = "";
    document.getElementById("whats-next-diagram-svg").innerHTML = capstone.whatsNext.diagram.svg;
    document.getElementById("whats-next-diagram-caption").textContent = capstone.whatsNext.diagram.caption;
  }
  const mappingTableEl = document.getElementById("whats-next-table");
  capstone.whatsNext.mapping.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${AIPM.escapeHtml(row.week)}</td>
      <td>${AIPM.escapeHtml(row.role)}</td>
      <td>${AIPM.escapeHtml(row.note)}</td>
    `;
    mappingTableEl.appendChild(tr);
  });

  // reflection section(s), same rendering pattern as week.js
  const answers = AIPM.getAnswers(weekId);
  const formEl = document.getElementById("exercise-form");
  capstone.sections.forEach((section) => {
    const card = document.createElement("div");
    card.className = "card section-card";
    const pitfallHtml = section.pitfall
      ? `<div class="pitfall-block">
          <div class="block-label">Common mistake</div>
          <p>${AIPM.escapeHtml(section.pitfall)}</p>
        </div>`
      : "";
    card.innerHTML = `
      <h3>${AIPM.escapeHtml(section.heading)}</h3>
      <p class="learning">${AIPM.escapeHtml(section.learning)}</p>
      <div class="example-block">
        <div class="block-label">Example</div>
        <p>${AIPM.escapeHtml(section.example.text)}</p>
      </div>
      ${pitfallHtml}
      <div class="field">
        <div class="block-label">Your turn</div>
        <label class="field-label" for="field-${section.id}">${AIPM.escapeHtml(section.field.label)}</label>
        <p class="help">${AIPM.escapeHtml(section.field.help)}</p>
        <textarea id="field-${section.id}" placeholder="${AIPM.escapeHtml(section.field.placeholder || "")}"></textarea>
      </div>
    `;
    formEl.appendChild(card);
    card.querySelector("textarea").value = answers[section.id] || "";
  });

  function collectAnswers() {
    const result = {};
    capstone.sections.forEach((section) => {
      result[section.id] = document.getElementById(`field-${section.id}`).value;
    });
    return result;
  }

  function buildCombinedWeeksText() {
    return priorWeeks.map((w, i) => {
      const detail = priorDetails[i];
      const weekAnswers = AIPM.getAnswers(w.id);
      const filled = AIPM.fillTemplate(detail.artifactTemplate, weekAnswers);
      // strip the top-level "# " title line from each sub-template so the capstone doc has one clean title
      return filled.replace(/^# .*\n/, `## Module ${w.order}: ${detail.title}\n`);
    }).join("\n---\n\n");
  }

  function buildFullDoc() {
    const values = collectAnswers();
    values.__combined_weeks__ = buildCombinedWeeksText();
    return AIPM.fillTemplate(capstone.artifactTemplate, values);
  }

  function updatePreview() {
    document.getElementById("combined-preview").textContent = buildFullDoc();
  }
  updatePreview();
  formEl.addEventListener("input", updatePreview);

  const capstoneFieldIds = capstone.sections.map((s) => s.id);
  const statusEl = document.getElementById("save-status");
  function save(showStatus) {
    AIPM.saveAnswers(weekId, collectAnswers());
    AIPM.reportProgress(weekId, AIPM.weekStatus(weekId, capstoneFieldIds));
    if (showStatus) {
      statusEl.textContent = "Saved.";
      setTimeout(() => { if (statusEl.textContent === "Saved.") statusEl.textContent = ""; }, 2000);
    }
  }

  document.getElementById("save-btn").addEventListener("click", () => { save(true); updatePreview(); });

  document.getElementById("complete-btn").addEventListener("click", () => {
    AIPM.saveAnswers(weekId, collectAnswers());
    AIPM.setCompleted(weekId, true);
    AIPM.reportProgress(weekId, "complete");
    statusEl.textContent = "Saved and marked complete.";
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    save(false);
    AIPM.downloadText(capstone.artifactFilename, buildFullDoc());
  });

  formEl.addEventListener("focusout", () => save(false));

  const prevLink = document.getElementById("prev-link");
  const last = priorWeeks[priorWeeks.length - 1];
  prevLink.href = `/week.html?id=${last.id}`;
  prevLink.textContent = `← ${last.title}`;
})();
