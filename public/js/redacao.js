const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const sidebarNavigationManaged = Boolean(window.Start5Main?.sidebarNavigation?.isManaged);

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
const essayHistoryToggle = document.getElementById("essayHistoryToggle");
const essayHistoryToggleCount = document.getElementById("essayHistoryToggleCount");
const essayHistoryDrawer = document.getElementById("essayHistoryDrawer");
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
let isHistoryOpen = false;
const FEEDBACK_MODE_STORAGE_KEY = "start5-essay-feedback-mode";
let feedbackMode = "student";

try {
  if (window.localStorage.getItem(FEEDBACK_MODE_STORAGE_KEY) === "technical") {
    feedbackMode = "technical";
  }
} catch (error) {
  feedbackMode = "student";
}

const COMPETENCY_GUIDE = {
  1: {
    title: "Dom\u00ednio da norma padr\u00e3o",
    description: "Ortografia, acentua\u00e7\u00e3o, concord\u00e2ncia e escrita formal.",
  },
  2: {
    title: "Compreens\u00e3o do tema",
    description: "Leitura correta da proposta, repert\u00f3rio e recorte do assunto.",
  },
  3: {
    title: "Argumenta\u00e7\u00e3o",
    description: "Organiza\u00e7\u00e3o das ideias, defesa do ponto de vista e consist\u00eancia.",
  },
  4: {
    title: "Coes\u00e3o",
    description: "Conectivos, progress\u00e3o textual e liga\u00e7\u00e3o entre as partes.",
  },
  5: {
    title: "Proposta de interven\u00e7\u00e3o",
    description: "Solu\u00e7\u00e3o completa, vi\u00e1vel e detalhada para o problema.",
  },
};

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

function updateHistoryToggle() {
  if (essayHistoryToggle) {
    essayHistoryToggle.setAttribute("aria-expanded", String(isHistoryOpen));
  }

  if (essayHistoryDrawer) {
    essayHistoryDrawer.classList.toggle("is-hidden", !isHistoryOpen);
  }
}

function toggleHistoryDrawer(forceValue) {
  isHistoryOpen = typeof forceValue === "boolean" ? forceValue : !isHistoryOpen;
  updateHistoryToggle();
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

function getCompetencyGuide(id) {
  return (
    COMPETENCY_GUIDE[Number(id)] || {
      title: "Leitura da compet\u00eancia",
      description: "Veja abaixo a interpreta\u00e7\u00e3o da banca para esta parte da reda\u00e7\u00e3o.",
    }
  );
}

function getCompetencyTone(score) {
  const safeScore = Number(score) || 0;

  if (safeScore >= 160) {
    return {
      key: "strong",
      label: "Ponto forte",
      helper: "Vale manter esse padr\u00e3o na pr\u00f3xima vers\u00e3o.",
    };
  }

  if (safeScore >= 120) {
    return {
      key: "stable",
      label: "Boa base",
      helper: "J\u00e1 est\u00e1 no caminho certo, mas ainda d\u00e1 para subir.",
    };
  }

  if (safeScore >= 80) {
    return {
      key: "attention",
      label: "Aten\u00e7\u00e3o",
      helper: "Essa compet\u00eancia pede revis\u00e3o e treino direcionado.",
    };
  }

  return {
    key: "priority",
    label: "Prioridade agora",
    helper: "Este \u00e9 o ponto que mais pode levantar sua nota total.",
  };
}

function createDetailLine(label, value) {
  const row = document.createElement("div");
  row.className = "essay-competency-detail";

  const title = document.createElement("strong");
  title.className = "essay-competency-detail-title";
  title.textContent = label;

  const copy = document.createElement("p");
  copy.className = "essay-competency-detail-copy";
  copy.textContent = value;

  row.append(title, copy);
  return row;
}

function createCompetencyOverview(feedback) {
  const competencies = Array.isArray(feedback?.competencies) ? [...feedback.competencies] : [];

  if (!competencies.length) {
    return null;
  }

  const sortedByScore = [...competencies].sort((left, right) => left.score - right.score);
  const weakest = sortedByScore[0];
  const strongest = sortedByScore[sortedByScore.length - 1];
  const weakestGuide = getCompetencyGuide(weakest.id);
  const strongestGuide = getCompetencyGuide(strongest.id);

  const section = document.createElement("section");
  section.className = "essay-competency-overview";

  const intro = document.createElement("article");
  intro.className = "essay-competency-spotlight";

  const introLabel = document.createElement("span");
  introLabel.className = "essay-competency-spotlight-label";
  introLabel.textContent = "Leitura por compet\u00eancia";

  const introTitle = document.createElement("strong");
  introTitle.className = "essay-competency-spotlight-title";
  introTitle.textContent = `${weakest.name} \u00e9 a compet\u00eancia que mais pede aten\u00e7\u00e3o agora.`;

  const introCopy = document.createElement("p");
  introCopy.className = "essay-competency-spotlight-copy";
  introCopy.textContent = `Hoje sua menor nota foi em ${weakestGuide.title}. Foque primeiro nessa parte para ganhar mais pontos na pr\u00f3xima reda\u00e7\u00e3o.`;

  intro.append(introLabel, introTitle, introCopy);

  const cards = document.createElement("div");
  cards.className = "essay-competency-overview-cards";

  const urgentCard = document.createElement("article");
  urgentCard.className = "essay-overview-card";
  urgentCard.dataset.tone = "priority";
  urgentCard.innerHTML = `
    <span class="essay-overview-card-label">Precisa melhorar</span>
    <strong class="essay-overview-card-title">${weakest.name}</strong>
    <p class="essay-overview-card-copy">${weakestGuide.title}.</p>
    <strong class="essay-overview-card-score">${formatNumber(weakest.score)} / 200</strong>
  `;

  const strongestCard = document.createElement("article");
  strongestCard.className = "essay-overview-card";
  strongestCard.dataset.tone = "strong";
  strongestCard.innerHTML = `
    <span class="essay-overview-card-label">Melhor compet\u00eancia</span>
    <strong class="essay-overview-card-title">${strongest.name}</strong>
    <p class="essay-overview-card-copy">${strongestGuide.title}.</p>
    <strong class="essay-overview-card-score">${formatNumber(strongest.score)} / 200</strong>
  `;

  const focusCard = document.createElement("article");
  focusCard.className = "essay-overview-card";
  focusCard.dataset.tone = "stable";

  const focusLabel = document.createElement("span");
  focusLabel.className = "essay-overview-card-label";
  focusLabel.textContent = "Pr\u00f3ximo foco";

  const focusTitle = document.createElement("strong");
  focusTitle.className = "essay-overview-card-title";
  focusTitle.textContent = weakestGuide.title;

  const focusCopy = document.createElement("p");
  focusCopy.className = "essay-overview-card-copy";
  focusCopy.textContent = weakest.improvement;

  focusCard.append(focusLabel, focusTitle, focusCopy);
  cards.append(urgentCard, strongestCard, focusCard);

  section.append(intro, cards);
  return section;
}

function createCompetencyRanking(competencies) {
  const section = document.createElement("section");
  section.className = "essay-competency-ranking";

  const title = document.createElement("strong");
  title.className = "essay-detail-title";
  title.textContent = "Mapa das compet\u00eancias";

  const copy = document.createElement("p");
  copy.className = "essay-competency-ranking-copy";
  copy.textContent = "Veja de forma r\u00e1pida quais compet\u00eancias est\u00e3o mais fortes e quais precisam de treino primeiro.";

  const list = document.createElement("div");
  list.className = "essay-competency-ranking-list";

  [...competencies]
    .sort((left, right) => right.score - left.score || left.id - right.id)
    .forEach((competency, index) => {
      const guide = getCompetencyGuide(competency.id);
      const tone = getCompetencyTone(competency.score);
      const row = document.createElement("article");
      row.className = "essay-competency-ranking-item";
      row.dataset.tone = tone.key;

      const top = document.createElement("div");
      top.className = "essay-competency-ranking-top";

      const nameWrap = document.createElement("div");
      nameWrap.className = "essay-competency-ranking-name-wrap";

      const order = document.createElement("span");
      order.className = "essay-competency-ranking-order";
      order.textContent = `#${index + 1}`;

      const name = document.createElement("strong");
      name.className = "essay-competency-ranking-name";
      name.textContent = `${competency.name} · ${guide.title}`;

      const score = document.createElement("span");
      score.className = "essay-competency-ranking-score";
      score.textContent = `${formatNumber(competency.score)} / 200`;

      nameWrap.append(order, name);
      top.append(nameWrap, score);

      const bar = document.createElement("div");
      bar.className = "essay-competency-bar";

      const fill = document.createElement("span");
      fill.className = "essay-competency-bar-fill";
      fill.style.width = `${Math.max(6, Math.min(100, (Number(competency.score) || 0) / 2))}%`;
      bar.appendChild(fill);

      const helper = document.createElement("p");
      helper.className = "essay-competency-ranking-helper";
      helper.textContent = tone.helper;

      row.append(top, bar, helper);
      list.appendChild(row);
    });

  section.append(title, copy, list);
  return section;
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
    essayThemePreview.textContent = title;
    return;
  }

  const theme = getThemeByKey(essayThemeSelect?.value);
  essayThemePreview.textContent = theme?.title || "Escolha um tema.";
}

function setLoading(isLoading) {
  essayForm?.querySelectorAll("input, textarea, select, button").forEach((element) => {
    element.disabled = isLoading;
  });

  if (essaySubmitButton) {
    essaySubmitButton.textContent = isLoading ? "Corrigindo..." : "Corrigir reda\u00e7\u00e3o";
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

function getConfidenceLabel(level) {
  if (level === "alta") return "Alta confianca";
  if (level === "baixa") return "Baixa confianca";
  return "Confianca media";
}

function createInsightPanel(feedback) {
  const panel = document.createElement("section");
  panel.className = "essay-insight-panel";

  const items = [
    {
      label: "Perfil",
      value: feedback?.profileLabel || "Em leitura",
      tone: "profile",
    },
    {
      label: "Tema",
      value: feedback?.themeStatus || "Sem leitura",
      tone: "theme",
    },
    {
      label: "Confianca",
      value: getConfidenceLabel(feedback?.confidenceLevel),
      tone: feedback?.confidenceLevel || "media",
      helper: feedback?.confidenceNote || "",
    },
  ];

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "essay-insight-card";
    card.dataset.tone = item.tone;

    const label = document.createElement("span");
    label.className = "essay-insight-label";
    label.textContent = item.label;

    const value = document.createElement("strong");
    value.className = "essay-insight-value";
    value.textContent = item.value;

    card.append(label, value);

    if (item.helper) {
      const helper = document.createElement("p");
      helper.className = "essay-insight-helper";
      helper.textContent = item.helper;
      card.appendChild(helper);
    }

    panel.appendChild(card);
  });

  return panel;
}

function createEvidencePanel(evidenceMap) {
  const panel = document.createElement("article");
  panel.className = "essay-detail-panel";

  const heading = document.createElement("strong");
  heading.className = "essay-detail-title";
  heading.textContent = "Evidencias do texto";
  panel.appendChild(heading);

  const entries = [
    ["Trecho da tese", evidenceMap?.thesis],
    ["Trecho do repertorio", evidenceMap?.repertoire],
    ["Trecho de coesao", evidenceMap?.cohesion],
    ["Trecho da intervencao", evidenceMap?.intervention],
    ["Trecho problematico", evidenceMap?.problemExcerpt],
  ].filter(([, value]) => value);

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "essay-empty";
    empty.textContent = "Nenhuma evidencia destacada nesta avaliacao.";
    panel.appendChild(empty);
    return panel;
  }

  const list = document.createElement("div");
  list.className = "essay-evidence-list";

  entries.forEach(([labelText, value]) => {
    const row = document.createElement("div");
    row.className = "essay-evidence-item";

    const label = document.createElement("strong");
    label.className = "essay-evidence-label";
    label.textContent = labelText;

    const copy = document.createElement("p");
    copy.className = "essay-evidence-copy";
    copy.textContent = value;

    row.append(label, copy);
    list.appendChild(row);
  });

  panel.appendChild(list);
  return panel;
}

function createCalibrationPanel(calibrationMeta) {
  if (!calibrationMeta?.enabled) {
    return null;
  }

  const panel = document.createElement("article");
  panel.className = "essay-detail-panel";

  const heading = document.createElement("strong");
  heading.className = "essay-detail-title";
  heading.textContent = "Modo calibracao";
  panel.appendChild(heading);

  const intro = document.createElement("p");
  intro.className = "essay-bullet-item";
  intro.textContent = calibrationMeta.scoreProfile || "Leitura pronta para comparacao com exemplos humanos.";
  panel.appendChild(intro);

  if (Array.isArray(calibrationMeta.checkpoints) && calibrationMeta.checkpoints.length) {
    const list = document.createElement("div");
    list.className = "essay-bullet-list";

    calibrationMeta.checkpoints.forEach((item) => {
      const row = document.createElement("div");
      row.className = "essay-bullet-item";
      row.textContent = item;
      list.appendChild(row);
    });

    panel.appendChild(list);
  }

  if (calibrationMeta.recommendedHumanReview) {
    const note = document.createElement("div");
    note.className = "essay-empty";
    note.textContent = "Esta leitura pede comparacao com exemplos corrigidos manualmente.";
    panel.appendChild(note);
  }

  return panel;
}

function setFeedbackMode(nextMode) {
  feedbackMode = nextMode === "technical" ? "technical" : "student";

  try {
    window.localStorage.setItem(FEEDBACK_MODE_STORAGE_KEY, feedbackMode);
  } catch (error) {
    // Ignore storage failures and keep the mode only in memory.
  }

  renderSubmission(currentSubmission);
}

function createFeedbackModeToggle(feedback) {
  const section = document.createElement("section");
  section.className = "essay-feedback-mode";

  const copy = document.createElement("div");
  copy.className = "essay-feedback-mode-copy";

  const title = document.createElement("strong");
  title.className = "essay-detail-title";
  title.textContent = "Modo de leitura";

  const summary = document.createElement("p");
  summary.className = "essay-bullet-item";
  summary.textContent =
    feedbackMode === "technical"
      ? feedback?.feedbackModes?.technicalSummary || feedback?.summaryFeedback || "Leitura tecnica indisponivel."
      : feedback?.feedbackModes?.studentSummary || feedback?.summaryFeedback || "Leitura do aluno indisponivel.";

  copy.append(title, summary);

  const actions = document.createElement("div");
  actions.className = "essay-feedback-mode-actions";

  [
    ["student", "Modo aluno"],
    ["technical", "Modo tecnico"],
  ].forEach(([mode, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "essay-feedback-mode-button";
    button.classList.toggle("is-active", feedbackMode === mode);
    button.textContent = label;
    button.addEventListener("click", () => setFeedbackMode(mode));
    actions.appendChild(button);
  });

  section.append(copy, actions);
  return section;
}

function createGroupedPanel(title, groups, fallbackMessage) {
  const panel = document.createElement("article");
  panel.className = "essay-detail-panel";

  const heading = document.createElement("strong");
  heading.className = "essay-detail-title";
  heading.textContent = title;
  panel.appendChild(heading);

  const validGroups = Array.isArray(groups)
    ? groups
        .map((group) => ({
          title: group?.title || "",
          items: Array.isArray(group?.items) ? group.items.filter(Boolean) : [],
        }))
        .filter((group) => group.items.length)
    : [];

  if (!validGroups.length) {
    const empty = document.createElement("div");
    empty.className = "essay-empty";
    empty.textContent = fallbackMessage;
    panel.appendChild(empty);
    return panel;
  }

  validGroups.forEach((group) => {
    const wrap = document.createElement("div");
    wrap.className = "essay-group-block";

    const label = document.createElement("strong");
    label.className = "essay-group-title";
    label.textContent = group.title;

    const list = document.createElement("div");
    list.className = "essay-bullet-list";

    group.items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "essay-bullet-item";
      row.textContent = item;
      list.appendChild(row);
    });

    wrap.append(label, list);
    panel.appendChild(wrap);
  });

  return panel;
}

function createMapPanel(title, entries, fallbackMessage) {
  const panel = document.createElement("article");
  panel.className = "essay-detail-panel";

  const heading = document.createElement("strong");
  heading.className = "essay-detail-title";
  heading.textContent = title;
  panel.appendChild(heading);

  const validEntries = Array.isArray(entries)
    ? entries.filter(([label, value]) => label && value)
    : [];

  if (!validEntries.length) {
    const empty = document.createElement("div");
    empty.className = "essay-empty";
    empty.textContent = fallbackMessage;
    panel.appendChild(empty);
    return panel;
  }

  const list = document.createElement("div");
  list.className = "essay-map-list";

  validEntries.forEach(([labelText, value]) => {
    const row = document.createElement("div");
    row.className = "essay-map-item";

    const label = document.createElement("strong");
    label.className = "essay-map-label";
    label.textContent = labelText;

    const copy = document.createElement("p");
    copy.className = "essay-map-copy";
    copy.textContent = value;

    row.append(label, copy);
    list.appendChild(row);
  });

  panel.appendChild(list);
  return panel;
}

function createPreAnalysisPanel(preAnalysis) {
  if (!preAnalysis) {
    return null;
  }

  return createGroupedPanel(
    "Pre-analise textual",
    [
      {
        title: "Leitura base",
        items: [
          `Idioma principal detectado: ${preAnalysis.primaryLanguage || "nao identificado"}.`,
          preAnalysis.dissertativeCompatible
            ? "O texto parece compativel com o padrao dissertativo-argumentativo."
            : "O texto foge do padrao dissertativo-argumentativo esperado.",
        ],
      },
      {
        title: "Alertas iniciais",
        items: preAnalysis.messages,
      },
    ],
    "Nenhum alerta inicial relevante."
  );
}

function createAuditPanel(auditTrail) {
  if (!auditTrail || feedbackMode !== "technical") {
    return null;
  }

  return createGroupedPanel(
    "Auditoria da leitura",
    [
      {
        title: "Versoes",
        items: [
          auditTrail.rubricVersion ? `Rubrica: ${auditTrail.rubricVersion}` : "",
          auditTrail.promptVersion ? `Motor: ${auditTrail.promptVersion}` : "",
        ],
      },
      {
        title: "Regras aplicadas",
        items: auditTrail.rulesApplied,
      },
      {
        title: "Travas acionadas",
        items: auditTrail.locksTriggered,
      },
      {
        title: "Evidencias usadas",
        items: auditTrail.evidenceUsed,
      },
    ],
    "Sem trilha de auditoria disponivel."
  );
}

function renderSubmission(submission) {
  currentSubmission = submission || null;
  selectedSubmissionId = submission?.id || null;

  if (!essayResultTitle || !essayStatusChip || !essayScorePill || !essayResultBody) {
    return;
  }

  essayResultTitle.textContent = submission?.themeTitle || "Sua avalia\u00e7\u00e3o aparece aqui";
  essayStatusChip.textContent = getStatusLabel(submission?.status);
  essayStatusChip.dataset.status = submission?.status || "pending";
  essayScorePill.textContent = getScoreLabel(submission);
  essayResultBody.replaceChildren();
  essayResultActions?.classList.toggle("is-hidden", !submission);

  if (!submission) {
    essayResultBody.appendChild(
      createEmptyResult(
        "Escolha um tema, escreva a reda\u00e7\u00e3o e clique em corrigir para ver a nota por compet\u00eancia e o feedback estruturado."
      )
    );
    return;
  }

  if (essayReuseButton) {
    essayReuseButton.textContent =
      submission.status === "failed" ? "Corrigir novamente" : "Usar esta vers\u00e3o novamente";
  }

  const summary = document.createElement("section");
  summary.className = "essay-result-summary";
  summary.textContent =
    submission.status === "evaluated"
      ? feedbackMode === "technical"
        ? submission.feedback?.feedbackModes?.technicalSummary || submission.feedback?.summaryFeedback || "A avalia\u00e7\u00e3o ficou pronta."
        : submission.feedback?.feedbackModes?.studentSummary || submission.feedback?.summaryFeedback || "A avalia\u00e7\u00e3o ficou pronta."
      : submission.errorMessage || "Esta tentativa n\u00e3o conseguiu gerar a avalia\u00e7\u00e3o completa.";
  essayResultBody.appendChild(summary);

  if (submission.status !== "evaluated" || !submission.feedback) {
    essayResultBody.appendChild(
      createListPanel(
        "Pr\u00f3ximo passo",
        [
          "Use o bot\u00e3o abaixo para carregar o mesmo texto novamente.",
          "Confira se o tema est\u00e1 claro antes de reenviar.",
        ],
        "Nenhuma orienta\u00e7\u00e3o adicional."
      )
    );
    return;
  }

  essayResultBody.appendChild(createFeedbackModeToggle(submission.feedback));

  essayResultBody.appendChild(createInsightPanel(submission.feedback));

  const competencyOverview = createCompetencyOverview(submission.feedback);

  if (competencyOverview) {
    essayResultBody.appendChild(competencyOverview);
    essayResultBody.appendChild(createCompetencyRanking(submission.feedback.competencies));
  }

  const competencyGrid = document.createElement("section");
  competencyGrid.className = "essay-competency-grid";

  submission.feedback.competencies.forEach((competency) => {
    const guide = getCompetencyGuide(competency.id);
    const tone = getCompetencyTone(competency.score);
    const card = document.createElement("article");
    card.className = "essay-competency-card";
    card.dataset.tone = tone.key;

    const head = document.createElement("div");
    head.className = "essay-competency-head";

    const name = document.createElement("span");
    name.className = "essay-competency-name";
    name.textContent = competency.name;

    const toneChip = document.createElement("span");
    toneChip.className = "essay-competency-chip";
    toneChip.textContent = tone.label;

    const guideText = document.createElement("p");
    guideText.className = "essay-competency-guide";
    guideText.textContent = `Avalia: ${guide.title}. ${guide.description}`;

    const score = document.createElement("strong");
    score.className = "essay-competency-score";
    score.textContent = `${formatNumber(competency.score)} / 200`;

    const bar = document.createElement("div");
    bar.className = "essay-competency-bar";

    const fill = document.createElement("span");
    fill.className = "essay-competency-bar-fill";
    fill.style.width = `${Math.max(6, Math.min(100, (Number(competency.score) || 0) / 2))}%`;
    bar.appendChild(fill);

    const copy = document.createElement("div");
    copy.className = "essay-competency-copy";
    const justificationLabel = feedbackMode === "technical" ? "Leitura tecnica" : "O que a banca viu";
    const improvementLabel = feedbackMode === "technical" ? "Ajuste tecnico" : "O que melhorar agora";
    const justificationText =
      feedbackMode === "technical"
        ? competency.technicalJustification || competency.justification
        : competency.justification;
    const improvementText =
      feedbackMode === "technical"
        ? competency.technicalImprovement || competency.improvement
        : competency.improvement;

    copy.append(
      createDetailLine(justificationLabel, justificationText),
      createDetailLine(improvementLabel, improvementText)
    );

    head.append(name, toneChip);
    card.append(head, guideText, score, bar, copy);
    competencyGrid.appendChild(card);
  });

  essayResultBody.appendChild(competencyGrid);

  const detailGrid = document.createElement("section");
  detailGrid.className = "essay-detail-grid";
  [
    createListPanel(
      "Diagnostico rapido",
      submission.feedback.diagnosticMessages,
      "Nenhum diagnostico adicional informado."
    ),
    createPreAnalysisPanel(submission.feedback.preAnalysis),
    createListPanel(
      "Diagnostico da introducao",
      submission.feedback.introductionDiagnosis,
      "Nenhuma leitura especifica da introducao."
    ),
    createListPanel(
      "Diagnostico da conclusao",
      submission.feedback.conclusionDiagnosis,
      "Nenhuma leitura especifica da conclusao."
    ),
    createListPanel("Pontos fortes", submission.feedback.strengths, "Nenhum destaque principal informado."),
    createListPanel("Principais problemas", submission.feedback.mainProblems, "Nenhum problema principal informado."),
    createListPanel("Pr\u00f3ximos passos", submission.feedback.nextSteps, "Nenhum pr\u00f3ximo passo informado."),
    createGroupedPanel(
      "Teto atual da redacao",
      [
        {
          title: "Leitura do teto",
          items: [submission.feedback.ceilingAnalysis?.explanation],
        },
        {
          title: "Leitura por faixas",
          items: submission.feedback.ceilingAnalysis?.bandReadings,
        },
        {
          title: "Travamentos ativos",
          items: submission.feedback.ceilingAnalysis?.locks,
        },
      ],
      "Nenhum teto estimado informado."
    ),
    createListPanel("Leitura t\u00e9cnica", submission.feedback.analysisIndicators, "Nenhum indicador adicional informado."),
    createListPanel("Riscos da correcao", submission.feedback.riskNotes, "Nenhum risco relevante indicado."),
    createGroupedPanel(
      "Escada de melhoria",
      [
        {
          title: "Ajuste rapido",
          items: submission.feedback.improvementLadder?.quickFixes,
        },
        {
          title: "Melhora de competencia",
          items: submission.feedback.improvementLadder?.competenceImprovements,
        },
        {
          title: "Salto de faixa",
          items: submission.feedback.improvementLadder?.bandLeapSteps,
        },
      ],
      "Nenhuma escada de melhoria disponivel."
    ),
    createMapPanel(
      "Reescrita orientada",
      [
        ["Introducao", submission.feedback.rewritingGuidance?.introduction],
        ["Topico frasal", submission.feedback.rewritingGuidance?.topicSentence],
        ["Repertorio", submission.feedback.rewritingGuidance?.repertoire],
        ["Amarracao argumentativa", submission.feedback.rewritingGuidance?.argumentativeLink],
        ["Intervencao", submission.feedback.rewritingGuidance?.intervention],
      ],
      "Nenhuma orientacao de reescrita disponivel."
    ),
    createEvidencePanel(submission.feedback.evidenceMap),
    createListPanel("Trechos destacados", submission.feedback.highlightedExcerpts, "Nenhum trecho citado pela avalia\u00e7\u00e3o.")
  ]
    .filter(Boolean)
    .forEach((panel) => detailGrid.appendChild(panel));

  essayResultBody.appendChild(detailGrid);

  if (Array.isArray(submission.feedback.criticalAlerts) && submission.feedback.criticalAlerts.length) {
    essayResultBody.appendChild(
      createListPanel("Alertas da avaliacao", submission.feedback.criticalAlerts, "Nenhum alerta critico informado.")
    );
  }

  const calibrationPanel = createCalibrationPanel(submission.feedback.calibrationMeta);

  if (calibrationPanel) {
    essayResultBody.appendChild(calibrationPanel);
  }

  const auditPanel = createAuditPanel(submission.feedback.auditTrail);

  if (auditPanel) {
    essayResultBody.appendChild(auditPanel);
  }

  const interventionPanel = document.createElement("section");
  interventionPanel.className = "essay-detail-panel";

  const interventionTitle = document.createElement("strong");
  interventionTitle.className = "essay-detail-title";
  interventionTitle.textContent = "Proposta de interven\u00e7\u00e3o";

  const interventionCopy = document.createElement("div");
  interventionCopy.className = "essay-bullet-item";
  interventionCopy.textContent = submission.feedback.interventionFeedback;

  interventionPanel.append(interventionTitle, interventionCopy);
  essayResultBody.appendChild(interventionPanel);
}

function renderHistory() {
  if (!essayHistoryList) return;

  essayHistoryList.replaceChildren();

  if (essayHistoryToggleCount) {
    essayHistoryToggleCount.textContent = String(submissions.length);
  }

  if (!submissions.length) {
    const empty = document.createElement("div");
    empty.className = "essay-empty";
    empty.textContent = "Nenhuma reda\u00e7\u00e3o enviada ainda.";
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
      toggleHistoryDrawer(false);
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
    option.textContent = "Nenhum tema dispon\u00edvel";
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
    setFeedback(error.message || "N\u00e3o foi poss\u00edvel abrir essa reda\u00e7\u00e3o.", "error");
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
    setFeedback(
      response?.fallbackMode === "local"
        ? "Reda\u00e7\u00e3o corrigida com avalia\u00e7\u00e3o local."
        : "Reda\u00e7\u00e3o corrigida com sucesso.",
      "success"
    );
    await loadSubmissions(response.submission?.id);
  } catch (error) {
    const failedSubmission = error?.payload?.submission || null;

    if (failedSubmission) {
      renderSubmission(failedSubmission);
      await loadSubmissions(failedSubmission.id);
    }

    setFeedback(error.message || "N\u00e3o foi poss\u00edvel corrigir a reda\u00e7\u00e3o.", "error");
  } finally {
    setLoading(false);
  }
}

if (!sidebarNavigationManaged) {
  menuToggle?.addEventListener("click", toggleMenu);

  menuPanel?.addEventListener("click", (event) => {
    if (event.target === menuPanel) {
      closeMenu();
    }
  });
}

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
essayHistoryToggle?.addEventListener("click", () => toggleHistoryDrawer());
essayForm?.addEventListener("submit", handleSubmit);

if (!sidebarNavigationManaged) {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      closeMenu();
    }
  });
}

(async function initializeEssayPage() {
  try {
    await window.Start5Auth?.ready;
    updateWordCount();
    updateHistoryToggle();
    await loadThemes();
    await loadSubmissions();
  } catch (error) {
    console.error("Erro ao iniciar a \u00e1rea de reda\u00e7\u00e3o:", error);
    setFeedback(error.message || "N\u00e3o foi poss\u00edvel carregar a \u00e1rea de reda\u00e7\u00e3o.", "error");
  }
})();
