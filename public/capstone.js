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

  document.title = `${capstone.title} — AI PM Training Program`;
  document.getElementById("week-title").textContent = capstone.title;
  document.getElementById("week-tagline").textContent = capstone.tagline;
  document.getElementById("concept-intro").textContent = capstone.concept.intro;

  const conceptEl = document.getElementById("concept-sections");
  capstone.concept.sections.forEach((s) => {
    const div = document.createElement("div");
    div.className = "concept-section";
    div.innerHTML = `<h3>${AIPM.escapeHtml(s.heading)}</h3><p>${AIPM.escapeHtml(s.body)}</p>`;
    conceptEl.appendChild(div);
  });

  document.getElementById("scenario-brief").textContent = capstone.scenario.brief;
  document.getElementById("exercise-instructions").textContent = capstone.exercise.instructions;

  // module status list
  const statusListEl = document.getElementById("module-status");
  priorWeeks.forEach((w, i) => {
    const fieldIds = (priorDetails[i].exercise?.prompts || []).map((p) => p.id);
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

  // reflection field(s), same rendering pattern as week.js
  const answers = AIPM.getAnswers(weekId);
  const formEl = document.getElementById("exercise-form");
  capstone.exercise.prompts.forEach((field) => {
    const wrap = document.createElement("div");
    wrap.className = "field";
    wrap.innerHTML = `
      <label class="field-label" for="field-${field.id}">${AIPM.escapeHtml(field.label)}</label>
      <p class="help">${AIPM.escapeHtml(field.help)}</p>
      <textarea id="field-${field.id}" placeholder="${AIPM.escapeHtml(field.placeholder || "")}"></textarea>
    `;
    formEl.appendChild(wrap);
    wrap.querySelector("textarea").value = answers[field.id] || "";
  });

  function collectAnswers() {
    const result = {};
    capstone.exercise.prompts.forEach((field) => {
      result[field.id] = document.getElementById(`field-${field.id}`).value;
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

  const capstoneFieldIds = capstone.exercise.prompts.map((f) => f.id);
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
