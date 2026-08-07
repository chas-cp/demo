(async function () {
  const params = new URLSearchParams(location.search);
  const weekId = params.get("id");
  if (!weekId) {
    location.href = "/";
    return;
  }

  const [programRes, weekRes] = await Promise.all([
    fetch("/api/program"),
    fetch(`/api/weeks/${encodeURIComponent(weekId)}`),
  ]);

  if (!weekRes.ok) {
    document.getElementById("week-title").textContent = "Module not found";
    return;
  }

  const program = await programRes.json();
  const week = await weekRes.json();
  const weeks = program.weeks.sort((a, b) => a.order - b.order);
  const idx = weeks.findIndex((w) => w.id === weekId);

  document.title = `${week.title} — AI PM Training Program`;
  document.getElementById("week-eyebrow").textContent = `Module ${String(week.order).padStart(2, "0")} · ${week.timeEstimate}`;
  document.getElementById("week-title").textContent = week.title;
  document.getElementById("week-tagline").textContent = week.tagline;
  document.getElementById("concept-intro").textContent = week.concept.intro;

  const conceptEl = document.getElementById("concept-sections");
  week.concept.sections.forEach((s) => {
    const div = document.createElement("div");
    div.className = "concept-section";
    div.innerHTML = `<h3>${AIPM.escapeHtml(s.heading)}</h3><p>${AIPM.escapeHtml(s.body)}</p>`;
    conceptEl.appendChild(div);
  });

  document.getElementById("scenario-company").textContent = week.scenario.company;
  document.getElementById("scenario-context").textContent = week.scenario.context;
  document.getElementById("scenario-brief").textContent = week.scenario.brief;

  document.getElementById("exercise-instructions").textContent = week.exercise.instructions;

  const answers = AIPM.getAnswers(weekId);
  const formEl = document.getElementById("exercise-form");
  week.exercise.prompts.forEach((field) => {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const inputTag = field.type === "text"
      ? `<input type="text" id="field-${field.id}" placeholder="${AIPM.escapeHtml(field.placeholder || "")}" />`
      : `<textarea id="field-${field.id}" placeholder="${AIPM.escapeHtml(field.placeholder || "")}"></textarea>`;
    wrap.innerHTML = `
      <label class="field-label" for="field-${field.id}">${AIPM.escapeHtml(field.label)}</label>
      <p class="help">${AIPM.escapeHtml(field.help)}</p>
      ${inputTag}
    `;
    formEl.appendChild(wrap);
    const inputEl = wrap.querySelector("textarea, input");
    inputEl.value = answers[field.id] || "";
  });

  function collectAnswers() {
    const result = {};
    week.exercise.prompts.forEach((field) => {
      const el = document.getElementById(`field-${field.id}`);
      result[field.id] = el.value;
    });
    return result;
  }

  const fieldIds = week.exercise.prompts.map((f) => f.id);
  const statusEl = document.getElementById("save-status");
  function save(showStatus) {
    AIPM.saveAnswers(weekId, collectAnswers());
    AIPM.reportProgress(weekId, AIPM.weekStatus(weekId, fieldIds));
    if (showStatus) {
      statusEl.textContent = "Saved.";
      setTimeout(() => { if (statusEl.textContent === "Saved.") statusEl.textContent = ""; }, 2000);
    }
  }

  document.getElementById("save-btn").addEventListener("click", () => save(true));

  document.getElementById("complete-btn").addEventListener("click", () => {
    AIPM.saveAnswers(weekId, collectAnswers());
    AIPM.setCompleted(weekId, true);
    AIPM.reportProgress(weekId, "complete");
    statusEl.textContent = "Saved and marked complete.";
  });

  document.getElementById("download-btn").addEventListener("click", () => {
    save(false);
    const values = collectAnswers();
    const text = AIPM.fillTemplate(week.artifactTemplate, values);
    AIPM.downloadText(week.artifactFilename, text);
  });

  // autosave on blur so nothing is lost if someone navigates away without clicking Save
  formEl.addEventListener("focusout", () => save(false));

  const prevLink = document.getElementById("prev-link");
  const nextLink = document.getElementById("next-link");
  const hrefFor = (w) => (w.id === "capstone" ? "/capstone.html" : `/week.html?id=${w.id}`);

  if (idx > 0) {
    const prev = weeks[idx - 1];
    prevLink.href = hrefFor(prev);
    prevLink.textContent = `← ${prev.title}`;
  } else {
    prevLink.style.visibility = "hidden";
  }

  if (idx < weeks.length - 1) {
    const next = weeks[idx + 1];
    nextLink.href = hrefFor(next);
    nextLink.textContent = `${next.title} →`;
  } else {
    nextLink.style.visibility = "hidden";
  }
})();
