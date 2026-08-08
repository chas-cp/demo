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
  document.getElementById("week-intro").textContent = week.intro;

  if (week.diagram) {
    document.getElementById("concept-diagram-section").style.display = "";
    document.getElementById("concept-diagram-svg").innerHTML = week.diagram.svg;
    document.getElementById("concept-diagram-caption").textContent = week.diagram.caption;
  }

  document.getElementById("scenario-company").textContent = week.scenario.company;
  document.getElementById("scenario-context").textContent = week.scenario.context;
  document.getElementById("scenario-brief").textContent = week.scenario.brief;

  const answers = AIPM.getAnswers(weekId);
  const formEl = document.getElementById("exercise-form");

  week.sections.forEach((section, i) => {
    const card = document.createElement("div");
    card.className = "card section-card";

    const diagramHtml = section.example.diagramSvg
      ? `<div class="diagram">${section.example.diagramSvg}</div>`
      : "";

    const pitfallHtml = section.pitfall
      ? `<div class="pitfall-block">
          <div class="block-label">Common mistake</div>
          <p>${AIPM.escapeHtml(section.pitfall)}</p>
        </div>`
      : "";

    const inputTag = section.field.type === "text"
      ? `<input type="text" id="field-${section.id}" placeholder="${AIPM.escapeHtml(section.field.placeholder || "")}" />`
      : `<textarea id="field-${section.id}" placeholder="${AIPM.escapeHtml(section.field.placeholder || "")}"></textarea>`;

    card.innerHTML = `
      <div class="section-num">${String(i + 1).padStart(2, "0")} / ${String(week.sections.length).padStart(2, "0")}</div>
      <h3>${AIPM.escapeHtml(section.heading)}</h3>
      <p class="learning">${AIPM.escapeHtml(section.learning)}</p>
      <div class="example-block">
        <div class="block-label">Example</div>
        <p>${AIPM.escapeHtml(section.example.text)}</p>
        ${diagramHtml}
      </div>
      ${pitfallHtml}
      <div class="field">
        <div class="block-label">Your turn</div>
        <label class="field-label" for="field-${section.id}">${AIPM.escapeHtml(section.field.label)}</label>
        <p class="help">${AIPM.escapeHtml(section.field.help)}</p>
        ${inputTag}
      </div>
    `;
    formEl.appendChild(card);
    const inputEl = card.querySelector("textarea, input");
    inputEl.value = answers[section.id] || "";
  });

  function collectAnswers() {
    const result = {};
    week.sections.forEach((section) => {
      const el = document.getElementById(`field-${section.id}`);
      result[section.id] = el.value;
    });
    return result;
  }

  const fieldIds = week.sections.map((s) => s.id);
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
