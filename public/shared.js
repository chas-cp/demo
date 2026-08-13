// Shared helpers for the AI PM Training Program frontend. No framework, no build step.
const AIPM = (() => {
  const NAME_KEY = "aipm:name";
  const LEARNER_ID_KEY = "aipm:learnerId";

  function getName() {
    return localStorage.getItem(NAME_KEY) || "";
  }

  function setName(name) {
    localStorage.setItem(NAME_KEY, name);
  }

  // A per-browser id (not an account) so the team dashboard can tell learners
  // apart even if two people share a display name. Nothing personal beyond
  // the name they typed in is ever sent.
  function getLearnerId() {
    let id = localStorage.getItem(LEARNER_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`)
        .replace(/[^a-zA-Z0-9-]/g, "");
      localStorage.setItem(LEARNER_ID_KEY, id);
    }
    return id;
  }

  // Best-effort: if the request fails (offline, server down), progress stays
  // correct locally and just doesn't show on the team dashboard yet.
  function reportProgress(weekId, status) {
    const name = getName().trim();
    if (!name) return Promise.resolve();
    return fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId: getLearnerId(), name, weekId, status }),
    }).catch(() => {});
  }

  function answersKey(weekId) {
    return `aipm:answers:${weekId}`;
  }

  function completedKey(weekId) {
    return `aipm:completed:${weekId}`;
  }

  function getAnswers(weekId) {
    try {
      return JSON.parse(localStorage.getItem(answersKey(weekId)) || "{}");
    } catch {
      return {};
    }
  }

  function saveAnswers(weekId, answers) {
    localStorage.setItem(answersKey(weekId), JSON.stringify(answers));
  }

  function isCompleted(weekId) {
    return localStorage.getItem(completedKey(weekId)) === "1";
  }

  function setCompleted(weekId, value) {
    if (value) {
      localStorage.setItem(completedKey(weekId), "1");
    } else {
      localStorage.removeItem(completedKey(weekId));
    }
  }

  // status: "not-started" | "in-progress" | "complete"
  function weekStatus(weekId, fieldIds) {
    if (isCompleted(weekId)) return "complete";
    const answers = getAnswers(weekId);
    const anyFilled = (fieldIds || []).some((id) => (answers[id] || "").trim().length > 0);
    return anyFilled ? "in-progress" : "not-started";
  }

  function todayLabel() {
    return new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  // Fills {{field}} tokens in a template string. Unknown tokens render as "(not answered yet)".
  function fillTemplate(template, values) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      if (key === "__name__") return values.__name__ || getName() || "You";
      if (key === "__date__") return values.__date__ || todayLabel();
      const v = values[key];
      return v && v.trim().length > 0 ? v.trim() : "_(not answered yet)_";
    });
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  return {
    getName, setName, getLearnerId, reportProgress, getAnswers, saveAnswers, isCompleted, setCompleted,
    weekStatus, todayLabel, fillTemplate, downloadText, escapeHtml,
  };
})();
