// Shared helpers for the AI PM Training Program frontend. No framework, no build step.
const AIPM = (() => {
  const NAME_KEY = "aipm:name";

  function getName() {
    return localStorage.getItem(NAME_KEY) || "";
  }

  function setName(name) {
    localStorage.setItem(NAME_KEY, name);
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
    getName, setName, getAnswers, saveAnswers, isCompleted, setCompleted,
    weekStatus, todayLabel, fillTemplate, downloadText, escapeHtml,
  };
})();
