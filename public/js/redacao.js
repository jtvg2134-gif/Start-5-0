const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");

const essayForm = document.getElementById("essayForm");
const essayFeedback = document.getElementById("essayFeedback");
const essaySubmitButton = document.getElementById("essaySubmitButton");
const essayResetButton = document.getElementById("essayResetButton");
const essayTextInput = document.getElementById("essayTextInput");
const essayWordCount = document.getElementById("essayWordCount");
const essayThemeSelect = document.getElementById("essayThemeSelect");
const essayThemePreview = document.getElementById("essayThemePreview");
const themeModeButtons = [...document.querySelectorAll("[data-theme-mode]")];
const presetThemeField = document.getElementById("presetThemeField");
const customThemeFields = document.getElementById("customThemeFields");
const essayCustomThemeTitle = document.getElementById("essayCustomThemeTitle");
const essayCustomThemePrompt = document.getElementById("essayCustomThemePrompt");
const essayHistoryList = document.getElementById("essayHistoryList");
const essayResultTitle = document.getElementById("essayResultTitle");
const essayStatusChip = document.getElementById("essayStatusChip");
const essayScorePill = document.getElementById("essayScorePill");
const essayResultBody = document.getElementById("essayResultBody");
const essayResultActions = document.getElementById("essayResultActions");
const essayReuseButton = document.getElementById("essayReuseButton");

let themeMode = "preset";
let presetThemes = [];
let submissions = [];
let currentSubmission = null;
let selectedSubmissionId = null;

function closeMenu() {
  body.classList.remove("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }
}

function openMenu() {
  body.classList.add("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
  }
}

function toggleMenu() {
  if (body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }

  openMenu();
}

function setFeedback(message, state = "") {
  if (!essayFeedback) return;
  essayFeedback.textContent = message;
  essayFeedback.dataset.state = state;
}

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(Number(value) || 0);
}

function formatDateTime(value) {
  const date = new Date(value || "");

  if (Number.isNaN(date.getTime())) {
    return "Agora mesmo";
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countWords(value) {
  const text = String(value || "").trim();
  return text ? text.split(/\s+/g).length : 0;
}

function updateWordCount() {
  if (!essayWordCount) return;
  essayWordCount.textContent = `${formatNumber(countWords(essayTextInput?.value || ""))} palavras`;
}

function getThemeByKey(themeKey) {
  return presetThemes.find((theme) => theme.key === themeKey) || null;
}

function getStatusLabel(status) {
  if (status === "evaluated") return "Corrigida";
  if (status === "failed") return "Falhou";
  return "Aguardando";
}

function getScoreLabel(submission) {
  if (!submission || submission.status !== "evaluated") {
    return "0 / 1000";
  }

  return `${formatNumber(submission.totalScore || 0)} / 1000`;
}

function updateThemeMode(nextMode) {
  themeMode = nextMode === "custom" ? "custom" : "preset";

  themeModeButtons.forEach((button) => {
    const isActive = button.dataset.themeMode === themeMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  presetThemeField?.classList.toggle("is-hidden", themeMode !== "preset");
  customThemeFields?.classList.toggle("is-hidden", themeMode !== "custom");
  renderThemePreview();
}

function renderThemePreview() {
  if (!essayThemePreview) return;

  if (themeMode === "custom") {
    const title = essayCustomThemeTitle?.value.trim() || "Tema livre";
    const prompt = essayCustomThemePrompt?.value.trim() || "Explique aqui o recorte que voce quer trabalhar.";
    essayThemePreview.textContent = `${title}: ${prompt}`;
    return;
  }

  const theme = getThemeByKey(essayThemeSelect?.value);
  essayThemePreview.textContent = theme?.prompt || "Escolha um tema para ver o recorte completo.";
}

function setLoading(isLoading) {
  essayForm?.querySelectorAll("input, textarea, select, button").forEach((element) => {
    element.disabled = isLoading;
  });

  if (essaySubmitButton) {
    essaySubmitButton.textContent = isLoading ? "Corrigindo..." : "Corrigir redacao";
  }
}

function createEmptyResult(message) {
  const empty = document.createElement("div");
  empty.className = "essay-empty essay-empty-large";
  empty.textContent = message;
  return empty;
}

function createListPanel(title, items, fallbackMessage) {
  const panel = document.createElement("article");
  panel.className = "essay-detail-panel";

  const heading = document.createElement("strong");
  heading.className = "essay-detail-title";
  heading.textContent = title;
  panel.appendChild(heading);

  if (!Array.isArray(items) || !items.length) {
    const empty = document.createElement("div");
    empty.className = "essay-empty";
    empty.textContent = fallbackMessage;
    panel.appendChild(empty);
    return panel;
  }

  const list = document.createElement("div");
  list.className = "essay-bullet-list";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "essay-bullet-item";
    row.textContent = item;
    list.appendChild(row);
  });

  panel.appendChild(list);
  return panel;
}

function renderSubmission(submission) {
  currentSubmission = submission || null;
  selectedSubmissionId = submission?.id || null;

  if (!essayResultTitle || !essayStatusChip || !essayScorePill || !essayResultBody) {
    return;
  }

  essayResultTitle.textContent = submission?.themeTitle || "Sua avaliacao aparece aqui";
  essayStatusChip.textContent = getStatusLabel(submission?.status);
  essayStatusChip.dataset.status = submission?.status || "pending";
  essayScorePill.textContent = getScoreLabel(submission);
  essayResultBody.replaceChildren();
  essayResultActions?.classList.toggle("is-hidden", !submission);

  if (!submission) {
    essayResultBody.appendChild(
      createEmptyResult(
        "Escolha um tema, escreva a redacao e clique em corrigir para ver a nota por competencia e o feedback estruturado."
      )
    );
    return;
  }

  if (essayReuseButton) {
    essayReuseButton.textContent =
      submission.status === "failed" ? "Corrigir novamente" : "Usar esta versao novamente";
  }

  const summary = document.createElement("section");
  summary.className = "essay-result-summary";
  summary.textContent =
    submission.status === "evaluated"
      ? submission.feedback?.summaryFeedback || "A avaliacao ficou pronta."
      : submission.errorMessage || "Esta tentativa nao conseguiu gerar a avaliacao completa.";
  essayResultBody.appendChild(summary);

  if (submission.status !== "evaluated" || !submission.feedback) {
    essayResultBody.appendChild(
      createListPanel(
        "Proximo passo",
        [
          "Use o botao abaixo para carregar o mesmo texto novamente.",
          "Confira se o tema e o recorte estao claros antes de reenviar.",
        ],
        "Nenhuma orientacao adicional."
      )
    );
    return;
  }

  const competencyGrid = document.createElement("section");
  competencyGrid.className = "essay-competency-grid";

  submission.feedback.competencies.forEach((competency) => {
    const card = document.createElement("article");
    card.className = "essay-competency-card";

    const name = document.createElement("span");
    name.className = "essay-competency-name";
    name.textContent = competency.name;

    const score = document.createElement("strong");
    score.className = "essay-competency-score";
    score.textContent = `${formatNumber(competency.score)} / 200`;

    const copy = document.createElement("div");
    copy.className = "essay-competency-copy";

    const justification = document.createElement("p");
    justification.textContent = competency.justification;

    const improvement = document.createElement("p");
    improvement.textContent = competency.improvement;

    copy.append(justification, improvement);
    card.append(name, score, copy);
    competencyGrid.appendChild(card);
  });

  essayResultBody.appendChild(competencyGrid);

  const detailGrid = document.createElement("section");
  detailGrid.className = "essay-detail-grid";
  detailGrid.append(
    createListPanel("Pontos fortes", submission.feedback.strengths, "Nenhum destaque principal informado."),
    createListPanel("Principais problemas", submission.feedback.mainProblems, "Nenhum problema principal informado."),
    createListPanel("Proximos passos", submission.feedback.nextSteps, "Nenhum proximo passo informado."),
    createListPanel(
      "Trechos destacados",
      submission.feedback.highlightedExcerpts,
      "Nenhum trecho citado pela avaliacao."
    )
  );

  essayResultBody.appendChild(detailGrid);

  const interventionPanel = document.createElement("section");
  interventionPanel.className = "essay-detail-panel";

  const interventionTitle = document.createElement("strong");
  interventionTitle.className = "essay-detail-title";
  interventionTitle.textContent = "Proposta de intervencao";

  const interventionCopy = document.createElement("div");
  interventionCopy.className = "essay-bullet-item";
  interventionCopy.textContent = submission.feedback.interventionFeedback;

  interventionPanel.append(interventionTitle, interventionCopy);
  essayResultBody.appendChild(interventionPanel);
}

function renderHistory() {
  if (!essayHistoryList) return;

  essayHistoryList.replaceChildren();

  if (!submissions.length) {
    const empty = document.createElement("div");
    empty.className = "essay-empty";
    empty.textContent = "Nenhuma redacao enviada ainda.";
    essayHistoryList.appendChild(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  submissions.forEach((submission) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "essay-history-item";
    button.classList.toggle("is-active", submission.id === selectedSubmissionId);

    const top = document.createElement("div");
    top.className = "essay-history-top";

    const title = document.createElement("strong");
    title.className = "essay-history-title";
    title.textContent = submission.themeTitle;

    const status = document.createElement("span");
    status.className = "essay-status-chip";
    status.dataset.status = submission.status;
    status.textContent = getStatusLabel(submission.status);

    top.append(title, status);

    const excerpt = document.createElement("span");
    excerpt.className = "essay-history-excerpt";
    excerpt.textContent = submission.excerpt || "Sem trecho disponivel.";

    const bottom = document.createElement("div");
    bottom.className = "essay-history-bottom";

    const date = document.createElement("span");
    date.className = "essay-history-date";
    date.textContent = formatDateTime(submission.createdAt);

    const score = document.createElement("span");
    score.className = "essay-history-date";
    score.textContent =
      submission.status === "evaluated" ? `${formatNumber(submission.totalScore)} pontos` : "Sem nota";

    bottom.append(date, score);
    button.append(top, excerpt, bottom);

    button.addEventListener("click", async () => {
      await openSubmission(submission.id);
    });

    fragment.appendChild(button);
  });

  essayHistoryList.appendChild(fragment);
}

function setThemeOptions(themes) {
  presetThemes = Array.isArray(themes) ? themes : [];

  if (!essayThemeSelect) {
    return;
  }

  essayThemeSelect.replaceChildren();

  if (!presetThemes.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Nenhum tema disponivel";
    essayThemeSelect.appendChild(option);
    return;
  }

  presetThemes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.key;
    option.textContent = theme.title;
    essayThemeSelect.appendChild(option);
  });

  if (!essayThemeSelect.value) {
    essayThemeSelect.value = presetThemes[0].key;
  }

  renderThemePreview();
}

function populateFormFromSubmission(submission) {
  if (!submission) {
    return;
  }

  updateThemeMode(submission.themeMode === "custom" ? "custom" : "preset");

  if (themeMode === "preset" && essayThemeSelect) {
    essayThemeSelect.value = submission.themeKey || presetThemes[0]?.key || "";
  }

  if (essayCustomThemeTitle) {
    essayCustomThemeTitle.value = submission.themeMode === "custom" ? submission.themeTitle || "" : "";
  }

  if (essayCustomThemePrompt) {
    essayCustomThemePrompt.value = submission.themeMode === "custom" ? submission.themePrompt || "" : "";
  }

  if (essayTextInput) {
    essayTextInput.value = submission.essayText || "";
  }

  renderThemePreview();
  updateWordCount();
  setFeedback("Texto carregado no editor.", "success");
  essayTextInput?.focus();
}

async function openSubmission(submissionId) {
  try {
    const response = await window.Start5Auth.apiRequest(`/api/essay/submissions/${submissionId}`);
    renderSubmission(response.submission || null);
    renderHistory();
  } catch (error) {
    setFeedback(error.message || "Nao foi possivel abrir essa redacao.", "error");
  }
}

async function loadThemes() {
  const response = await window.Start5Auth.apiRequest("/api/essay/themes");
  setThemeOptions(response.themes || []);
}

async function loadSubmissions(preferredSubmissionId = selectedSubmissionId) {
  const response = await window.Start5Auth.apiRequest("/api/essay/submissions");
  submissions = Array.isArray(response.submissions) ? response.submissions : [];

  if (!submissions.length) {
    renderHistory();
    renderSubmission(null);
    return;
  }

  renderHistory();

  const targetId = preferredSubmissionId && submissions.some((submission) => submission.id === preferredSubmissionId)
    ? preferredSubmissionId
    : submissions[0].id;

  if (currentSubmission?.id === targetId) {
    selectedSubmissionId = targetId;
    renderHistory();
    return;
  }

  await openSubmission(targetId);
}

function getSubmissionPayload() {
  if (themeMode === "custom") {
    return {
      themeMode,
      themeTitle: essayCustomThemeTitle?.value.trim() || "",
      themePrompt: essayCustomThemePrompt?.value.trim() || "",
      essayText: essayTextInput?.value || "",
    };
  }

  return {
    themeMode,
    themeKey: essayThemeSelect?.value || "",
    essayText: essayTextInput?.value || "",
  };
}

function resetForm() {
  if (essayTextInput) essayTextInput.value = "";
  if (essayCustomThemeTitle) essayCustomThemeTitle.value = "";
  if (essayCustomThemePrompt) essayCustomThemePrompt.value = "";

  if (essayThemeSelect && presetThemes.length) {
    essayThemeSelect.value = presetThemes[0].key;
  }

  updateThemeMode("preset");
  updateWordCount();
  setFeedback("");
}

async function handleSubmit(event) {
  event.preventDefault();
  setLoading(true);
  setFeedback("");

  try {
    const response = await window.Start5Auth.apiRequest("/api/essay/submissions", {
      method: "POST",
      body: getSubmissionPayload(),
    });

    renderSubmission(response.submission || null);
    setFeedback("Redacao corrigida com sucesso.", "success");
    await loadSubmissions(response.submission?.id);
  } catch (error) {
    const failedSubmission = error?.payload?.submission || null;

    if (failedSubmission) {
      renderSubmission(failedSubmission);
      await loadSubmissions(failedSubmission.id);
    }

    setFeedback(error.message || "Nao foi possivel corrigir a redacao.", "error");
  } finally {
    setLoading(false);
  }
}

menuToggle?.addEventListener("click", toggleMenu);

menuPanel?.addEventListener("click", (event) => {
  if (event.target === menuPanel) {
    closeMenu();
  }
});

themeModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateThemeMode(button.dataset.themeMode);
  });
});

essayThemeSelect?.addEventListener("change", renderThemePreview);
essayCustomThemeTitle?.addEventListener("input", renderThemePreview);
essayCustomThemePrompt?.addEventListener("input", renderThemePreview);
essayTextInput?.addEventListener("input", updateWordCount);
essayResetButton?.addEventListener("click", resetForm);
essayReuseButton?.addEventListener("click", () => populateFormFromSubmission(currentSubmission));
essayForm?.addEventListener("submit", handleSubmit);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && body.classList.contains("menu-open")) {
    closeMenu();
  }
});

(async function initializeEssayPage() {
  try {
    await window.Start5Auth?.ready;
    updateWordCount();
    await loadThemes();
    await loadSubmissions();
  } catch (error) {
    console.error("Erro ao iniciar a area de redacao:", error);
    setFeedback(error.message || "Nao foi possivel carregar a area de redacao.", "error");
  }
})();
