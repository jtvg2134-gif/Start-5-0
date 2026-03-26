import { ADMISSION_CATEGORIES, getAdmissionCategory } from "./data/admissionCategories.js";
import { buildInternalGoal } from "./data/internalGoals.js";
import { renderGoalSummaryCard } from "./components/goalSummaryCard.js";
import { renderSubjectPriorityCard } from "./components/subjectPriorityCard.js";
import { buildWeeklyPlanPreview } from "./utils/plannerEngine.js";
import { calculateSubjectWeights } from "./utils/weightingEngine.js";

const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const sidebarNavigationManaged = Boolean(window.Start5Main?.sidebarNavigation?.isManaged);

const routineSaveButton = document.getElementById("routineSaveButton");
const routineGenerateButton = document.getElementById("routineGenerateButton");
const routineUniversityInput = document.getElementById("routineUniversityInput");
const routineCampusInput = document.getElementById("routineCampusInput");
const routineContextNoteInput = document.getElementById("routineContextNoteInput");
const routineCourseNameInput = document.getElementById("routineCourseNameInput");
const routineCustomCourseShell = document.getElementById("routineCustomCourseShell");
const routineCustomCourseInput = document.getElementById("routineCustomCourseInput");
const routineWeeklyGoalInput = document.getElementById("routineWeeklyGoalInput");
const routineCityInput = document.getElementById("routineCityInput");
const routineDaysGrid = document.getElementById("routineDaysGrid");
const routineSubjectList = document.getElementById("routineSubjectList");
const routineCustomSubjectInput = document.getElementById("routineCustomSubjectInput");
const routineAddCustomSubjectButton = document.getElementById("routineAddCustomSubjectButton");
const routineCustomSubjectSuggestions = document.getElementById("routineCustomSubjectSuggestions");
const routineFeedback = document.getElementById("routineFeedback");

const routinePlanTitle = document.getElementById("routinePlanTitle");
const routinePlanExecutionValue = document.getElementById("routinePlanExecutionValue");
const routinePlanMinutesValue = document.getElementById("routinePlanMinutesValue");
const routinePlanActualValue = document.getElementById("routinePlanActualValue");
const routinePlanPriorityValue = document.getElementById("routinePlanPriorityValue");
const routinePlanSummaryText = document.getElementById("routinePlanSummaryText");
const routinePlanDays = document.getElementById("routinePlanDays");
const routineSubjectTotals = document.getElementById("routineSubjectTotals");
const routineTargetTitle = document.getElementById("routineTargetTitle");
const routineTargetCopy = document.getElementById("routineTargetCopy");
const routineTargetScale = document.getElementById("routineTargetScale");
const routineTargetBands = document.getElementById("routineTargetBands");
const routineTargetNote = document.getElementById("routineTargetNote");
const routineCapacityTotalValue = document.getElementById("routineCapacityTotalValue");
const routineCapacityAverageValue = document.getElementById("routineCapacityAverageValue");
const routineCapacityInsight = document.getElementById("routineCapacityInsight");
const routineAdvancedDetails = document.getElementById("routineAdvancedDetails");
const routineAdvancedToggle = document.getElementById("routineAdvancedToggle");
const routineAdvancedPanel = document.getElementById("routineAdvancedPanel");
const routineAdvancedSummary = document.getElementById("routineAdvancedSummary");
const routineAdvancedIcon = document.getElementById("routineAdvancedIcon");
const routineWizardStepState = document.getElementById("routineWizardStepState");
const routineWizardStepCopy = document.getElementById("routineWizardStepCopy");
const routineStepBackButton = document.getElementById("routineStepBackButton");
const routineStepNextButton = document.getElementById("routineStepNextButton");
const routineStepTriggers = [...document.querySelectorAll("[data-routine-step-trigger]")];
const routineStepPanels = [...document.querySelectorAll("[data-routine-step]")];

const pickerRegistry = {
  primaryExam: {
    key: "primaryExam",
    wrapper: document.getElementById("routinePrimaryExamPicker"),
    trigger: document.getElementById("routinePrimaryExamTrigger"),
    value: document.getElementById("routinePrimaryExamValue"),
    meta: document.getElementById("routinePrimaryExamMeta"),
    panel: document.getElementById("routinePrimaryExamPanel"),
    search: document.getElementById("routinePrimaryExamSearch"),
    list: document.getElementById("routinePrimaryExamList"),
  },
  secondaryExam: {
    key: "secondaryExam",
    wrapper: document.getElementById("routineSecondaryExamPicker"),
    trigger: document.getElementById("routineSecondaryExamTrigger"),
    value: document.getElementById("routineSecondaryExamValue"),
    meta: document.getElementById("routineSecondaryExamMeta"),
    panel: document.getElementById("routineSecondaryExamPanel"),
    search: document.getElementById("routineSecondaryExamSearch"),
    list: document.getElementById("routineSecondaryExamList"),
  },
  courseTrack: {
    key: "courseTrack",
    wrapper: document.getElementById("routineCourseTrackPicker"),
    trigger: document.getElementById("routineCourseTrackTrigger"),
    value: document.getElementById("routineCourseTrackValue"),
    meta: document.getElementById("routineCourseTrackMeta"),
    panel: document.getElementById("routineCourseTrackPanel"),
    list: document.getElementById("routineCourseTrackList"),
  },
  course: {
    key: "course",
    wrapper: document.getElementById("routineCoursePicker"),
    trigger: document.getElementById("routineCourseTrigger"),
    value: document.getElementById("routineCourseValue"),
    meta: document.getElementById("routineCourseMeta"),
    panel: document.getElementById("routineCoursePanel"),
    search: document.getElementById("routineCourseSearch"),
    list: document.getElementById("routineCourseList"),
  },
  admissionCategory: {
    key: "admissionCategory",
    wrapper: document.getElementById("routineAdmissionPicker"),
    trigger: document.getElementById("routineAdmissionTrigger"),
    value: document.getElementById("routineAdmissionValue"),
    meta: document.getElementById("routineAdmissionMeta"),
    panel: document.getElementById("routineAdmissionPanel"),
    list: document.getElementById("routineAdmissionList"),
  },
  shift: {
    key: "shift",
    wrapper: document.getElementById("routineShiftPicker"),
    trigger: document.getElementById("routineShiftTrigger"),
    value: document.getElementById("routineShiftValue"),
    meta: document.getElementById("routineShiftMeta"),
    panel: document.getElementById("routineShiftPanel"),
    list: document.getElementById("routineShiftList"),
  },
};

const state = {
  templates: null,
  preferences: null,
  customSubjectSuggestions: [],
  plan: null,
  openPickerKey: "",
  pickerSearch: {
    primaryExam: "",
    secondaryExam: "",
    course: "",
  },
  isSaving: false,
  isGenerating: false,
  isAdvancedOpen: false,
  advancedInitialized: false,
  wizardStep: 1,
};

const ROUTINE_SETUP_QUERY = new URLSearchParams(window.location.search).has("setup");
const ROUTINE_WIZARD_STEPS = [
  {
    id: 1,
    title: "Meta academica",
    copy: "Defina curso, categoria, meta semanal, vestibular e cidade para dar direcao a rotina.",
  },
  {
    id: 2,
    title: "Dias da semana",
    copy: "Distribua o tempo real de cada dia para a rotina caber na sua vida e nao so no papel.",
  },
  {
    id: 3,
    title: "Prioridades",
    copy: "Ajuste as materias sugeridas pelo Start 5 e finalize a base da sua rotina.",
  },
];

const MANUAL_DELTA_OPTIONS = [
  { value: -2, label: "-2", copy: "Cai bastante na semana" },
  { value: -1, label: "-1", copy: "Cai um pouco" },
  { value: 0, label: "0", copy: "Fica neutra" },
  { value: 1, label: "+1", copy: "Sobe um pouco" },
  { value: 2, label: "+2", copy: "Vira prioridade" },
  { value: 3, label: "+3", copy: "Aperta bem mais" },
  { value: 4, label: "+4", copy: "Vira bloco constante" },
  { value: 5, label: "+5", copy: "Topo absoluto da semana" },
];

const SHIFT_OPTIONS = [
  { key: "integral", label: "Integral", description: "Carga total ou rotina extensa." },
  { key: "manha", label: "Manha", description: "Objetivo mais puxado para o periodo da manha." },
  { key: "tarde", label: "Tarde", description: "Ajusta a rotina para estudo principal a tarde." },
  { key: "noite", label: "Noite", description: "Pensa a semana para quem encaixa estudo a noite." },
  { key: "flexivel", label: "Flexivel", description: "Sem restricao forte de horario." },
];

const DIFFICULTY_OPTIONS = [
  { key: "facil", label: "Facil", copy: "Entra mais para manutencao." },
  { key: "normal", label: "Normal", copy: "Segue a base automatica." },
  { key: "dificil", label: "Dificil", copy: "Ganha mais presenca na semana." },
  { key: "muito_dificil", label: "Muito dificil", copy: "Recebe reforco pesado." },
];

const DIFFICULTY_COPY = {
  facil: "Entra mais para manutencao.",
  normal: "Mantem a carga base.",
  dificil: "Ganha mais presenca na semana.",
  muito_dificil: "Recebe reforco pesado.",
  atencao: "Ganha mais presenca na semana.",
  reforco: "Recebe bloco extra de reforco.",
};

const FEEDBACK_COPY = {
  idle: "Defina o curso, salve os ajustes e depois gere a semana para ver os blocos distribuidos.",
  loading: "Montando sua rotina com base no curso, nas materias e nos ajustes da semana...",
};

const SECONDARY_EMPTY_OPTION = {
  key: "",
  label: "Sem vestibular secundario",
  group: "Opcional",
  featured: true,
  searchTerms: ["sem", "nenhum", "nao", "opcional"],
  subjectWeights: {},
};

const SCORE_SCALE_LABELS = {
  enem_points: "nota ENEM estimada",
  percent_correct: "desempenho estimado na prova",
};

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function composeCourseContext() {
  const isCustomCourse = ensurePreferences().courseKey === "outro";
  const parts = [
    ["Curso", isCustomCourse ? routineCustomCourseInput?.value : ""],
    ["Cidade", routineCityInput?.value],
    ["Universidade", routineUniversityInput?.value],
    ["Campus", routineCampusInput?.value],
    ["Turno", pickerRegistry.shift?.value?.textContent && pickerRegistry.shift.value.textContent !== "Escolha o turno"
      ? pickerRegistry.shift.value.textContent
      : ""],
    ["Obs", routineContextNoteInput?.value],
  ]
    .map(([label, value]) => [label, String(value || "").trim()])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);

  const joinedValue = parts.join(" | ");

  if (routineCourseNameInput) {
    routineCourseNameInput.value = joinedValue;
  }

  return joinedValue;
}

function parseCourseContext(value) {
  const context = {
    customCourse: "",
    city: "",
    university: "",
    campus: "",
    shift: "",
    note: "",
  };
  const cleanValue = String(value || "").trim();

  if (!cleanValue) {
    return context;
  }

  cleanValue.split("|").map((chunk) => chunk.trim()).forEach((chunk) => {
    const [rawLabel, ...rest] = chunk.split(":");
    const label = normalizeForSearch(rawLabel);
    const nextValue = rest.join(":").trim();

    if (!nextValue) {
      return;
    }

    if (label === "cidade") {
      context.city = nextValue;
      return;
    }

    if (label === "curso") {
      context.customCourse = nextValue;
      return;
    }

    if (label === "universidade") {
      context.university = nextValue;
      return;
    }

    if (label === "campus") {
      context.campus = nextValue;
      return;
    }

    if (label === "turno") {
      context.shift = nextValue;
      return;
    }

    if (label === "obs") {
      context.note = nextValue;
    }
  });

  if (!context.customCourse && !context.city && !context.university && !context.campus && !context.note) {
    context.customCourse = cleanValue;
    context.note = cleanValue;
  }

  return context;
}

function formatMinutes(value) {
  return new Intl.NumberFormat("pt-BR").format(Math.round(Number(value) || 0));
}

function formatDateLabel(value) {
  const safeDate = new Date(`${String(value || "").trim()}T12:00:00`);

  if (Number.isNaN(safeDate.getTime())) {
    return "--";
  }

  return safeDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getPreferenceKey(subjectKey, customSubjectName = "") {
  return `${String(subjectKey || "").trim().toLowerCase()}::${String(customSubjectName || "")
    .trim()
    .toLowerCase()}`;
}

function getDefaultPreferences() {
  const weekdayLabels = Array.isArray(state.templates?.weekdayLabels)
    ? state.templates.weekdayLabels
    : ["Segunda", "Terca", "Quarta", "Quinta", "Sexta", "Sabado", "Domingo"];
  const studyDays = [0, 1, 2, 3, 4];
  const weekdayMinutes = {};

  weekdayLabels.forEach((_, dayIndex) => {
    weekdayMinutes[String(dayIndex)] = 60;
  });

  return {
    primaryExamKey: "enem",
    secondaryExamKey: "",
    courseKey: "",
    admissionCategoryKey: "",
    courseTrackKey: "geral",
    courseName: "",
    studyDays,
    weekdayMinutes,
    weeklyGoalMinutes: 300,
    subjectPreferences: [],
    updatedAt: "",
  };
}

function ensurePreferences() {
  if (!state.preferences) {
    state.preferences = getDefaultPreferences();
  }

  return state.preferences;
}

function setFeedback(message, stateName = "") {
  if (!routineFeedback) return;

  routineFeedback.textContent = message || FEEDBACK_COPY.idle;

  if (stateName) {
    routineFeedback.dataset.state = stateName;
    return;
  }

  delete routineFeedback.dataset.state;
}

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

function getTemplateSubjectLabel(subjectKey) {
  const entry = (state.templates?.subjects || []).find((subject) => subject.key === subjectKey);
  return entry?.label || subjectKey;
}

function getSubjectLabel(subjectKey, customSubjectName = "") {
  if (subjectKey === "outras" && String(customSubjectName || "").trim()) {
    return String(customSubjectName || "").trim();
  }

  return getTemplateSubjectLabel(subjectKey);
}

function sortSubjectPreferences(entries) {
  const subjectOrder = new Map(
    (state.templates?.subjects || []).map((subject, index) => [subject.key, index])
  );

  return [...entries].sort((left, right) => {
    const leftIndex = subjectOrder.has(left.subjectKey) ? subjectOrder.get(left.subjectKey) : 999;
    const rightIndex = subjectOrder.has(right.subjectKey) ? subjectOrder.get(right.subjectKey) : 999;

    if (left.subjectKey !== right.subjectKey) {
      return leftIndex - rightIndex;
    }

    return getSubjectLabel(left.subjectKey, left.customSubjectName).localeCompare(
      getSubjectLabel(right.subjectKey, right.customSubjectName),
      "pt-BR"
    );
  });
}

function getPreferenceEntry(subjectKey, customSubjectName = "") {
  const preferences = ensurePreferences();
  const preferenceKey = getPreferenceKey(subjectKey, customSubjectName);

  return (preferences.subjectPreferences || []).find((entry) => (
    getPreferenceKey(entry.subjectKey, entry.customSubjectName) === preferenceKey
  )) || null;
}

function upsertSubjectPreference(subjectKey, customSubjectName = "", patch = {}) {
  const preferences = ensurePreferences();
  const preferenceKey = getPreferenceKey(subjectKey, customSubjectName);
  const existingEntries = Array.isArray(preferences.subjectPreferences)
    ? [...preferences.subjectPreferences]
    : [];
  const currentEntry = existingEntries.find((entry) => (
    getPreferenceKey(entry.subjectKey, entry.customSubjectName) === preferenceKey
  )) || {
    subjectKey,
    customSubjectName,
    manualDelta: 0,
    difficultyLevel: "normal",
  };

  const nextEntry = {
    ...currentEntry,
    ...patch,
    subjectKey,
    customSubjectName: String(customSubjectName || "").trim(),
  };

  nextEntry.manualDelta = Number(nextEntry.manualDelta || 0);
  nextEntry.difficultyLevel = String(nextEntry.difficultyLevel || "normal");

  const shouldKeep =
    subjectKey === "outras"
      ? Boolean(nextEntry.customSubjectName)
      : nextEntry.manualDelta !== 0 || nextEntry.difficultyLevel !== "normal";

  const filteredEntries = existingEntries.filter((entry) => (
    getPreferenceKey(entry.subjectKey, entry.customSubjectName) !== preferenceKey
  ));

  preferences.subjectPreferences = shouldKeep
    ? sortSubjectPreferences([...filteredEntries, nextEntry])
    : sortSubjectPreferences(filteredEntries);
}

function removeCustomSubject(customSubjectName) {
  const preferences = ensurePreferences();
  const preferenceKey = getPreferenceKey("outras", customSubjectName);

  preferences.subjectPreferences = sortSubjectPreferences(
    (preferences.subjectPreferences || []).filter((entry) => (
      getPreferenceKey(entry.subjectKey, entry.customSubjectName) !== preferenceKey
    ))
  );
}

function syncCustomSubjectSuggestions(nextSuggestions = []) {
  const pool = new Set();

  nextSuggestions.forEach((name) => {
    const cleanName = String(name || "").trim();

    if (cleanName) {
      pool.add(cleanName);
    }
  });

  (state.plan?.customSubjectSuggestions || []).forEach((name) => {
    const cleanName = String(name || "").trim();

    if (cleanName) {
      pool.add(cleanName);
    }
  });

  state.customSubjectSuggestions = [...pool].sort((left, right) => left.localeCompare(right, "pt-BR"));
}

function getExamHighlightText(exam) {
  const topSubjects = Object.entries(exam?.subjectWeights || {})
    .sort((left, right) => Number(right[1] || 0) - Number(left[1] || 0))
    .slice(0, 3)
    .map(([subjectKey]) => getTemplateSubjectLabel(subjectKey))
    .filter(Boolean);
  const pieces = [];

  if (exam?.featured) {
    pieces.push("Mais buscado");
  }

  if (exam?.group) {
    pieces.push(exam.group);
  }

  if (topSubjects.length) {
    pieces.push(`Puxa ${topSubjects.join(", ")}`);
  }

  return pieces.join(" - ") || "Use a prova principal so para refinar a rotina do curso.";
}

function getTrackDescription(track) {
  return String(track?.description || "").trim() || "Perfil amplo para distribuir as materias.";
}

function getCurrentPrimaryExam() {
  return (state.templates?.exams || []).find(
    (exam) => exam.key === ensurePreferences().primaryExamKey
  ) || null;
}

function getCurrentCourse() {
  return (state.templates?.courses || []).find(
    (course) => course.key === ensurePreferences().courseKey
  ) || null;
}

function getCurrentSecondaryExam() {
  return (state.templates?.exams || []).find(
    (exam) => exam.key === ensurePreferences().secondaryExamKey
  ) || null;
}

function getCurrentTrack() {
  return (state.templates?.courseTracks || []).find(
    (track) => track.key === ensurePreferences().courseTrackKey
  ) || null;
}

function getCourseDisplayLabel() {
  const preferences = ensurePreferences();
  const selectedCourse = getCurrentCourse();
  const context = parseCourseContext(preferences.courseName);
  const customCourseName = String(context.customCourse || context.note || "").trim();

  if (selectedCourse?.key === "outro" && customCourseName) {
    return customCourseName;
  }

  return selectedCourse?.label || customCourseName;
}

function getCourseHighlightText(course) {
  const topSubjects = Object.entries(course?.subjectBoosts || {})
    .sort((left, right) => Number(right[1] || 0) - Number(left[1] || 0))
    .slice(0, 3)
    .map(([subjectKey]) => getTemplateSubjectLabel(subjectKey))
    .filter(Boolean);
  const pieces = [];

  if (course?.featured) {
    pieces.push("Mais procurado");
  }

  if (course?.group) {
    pieces.push(course.group);
  }

  if (course?.recommendedTrackLabel) {
    pieces.push(`Puxa ${course.recommendedTrackLabel}`);
  }

  if (topSubjects.length) {
    pieces.push(`Foco em ${topSubjects.join(", ")}`);
  }

  return pieces.join(" - ") || "Escolha o curso para puxar as materias mais importantes.";
}

function shouldStartAdvancedOpen() {
  const preferences = ensurePreferences();

  return Boolean(
    preferences.secondaryExamKey ||
      preferences.primaryExamKey !== "enem" ||
      preferences.courseTrackKey !== "geral"
  );
}

function getCurrentAdmissionCategory() {
  const categoryKey = String(ensurePreferences().admissionCategoryKey || "").trim();
  return categoryKey ? getAdmissionCategory(categoryKey) : null;
}

function getExamScoreScale(exam) {
  return exam?.scoreScaleType || "enem_points";
}

function convertEnemTargetToCurrentScale(enemTarget, exam) {
  const scaleType = getExamScoreScale(exam);

  if (scaleType === "percent_correct") {
    const adjustment = Number(exam?.percentAdjustment || 0);
    const percent = Math.round(Math.max(40, Math.min(92, 36 + ((Number(enemTarget || 0) - 500) * 0.155) + adjustment)));

    return {
      value: percent,
      display: `${percent}/100`,
      scaleLabel: SCORE_SCALE_LABELS.percent_correct,
    };
  }

  const score = Math.round(Number(enemTarget || 0));

  return {
    value: score,
    display: `${score}/1000`,
    scaleLabel: SCORE_SCALE_LABELS.enem_points,
  };
}

function setOpenPicker(nextPickerKey = "") {
  state.openPickerKey = nextPickerKey;

  Object.values(pickerRegistry).forEach((picker) => {
    if (!picker?.trigger || !picker?.panel) {
      return;
    }

    const isOpen = picker.key === state.openPickerKey;
    picker.trigger.setAttribute("aria-expanded", String(isOpen));
    picker.panel.hidden = !isOpen;

    const icon = picker.trigger.querySelector(".routine-picker-trigger-icon");

    if (icon) {
      icon.textContent = isOpen ? "-" : "+";
    }
  });

  if (state.openPickerKey) {
    const picker = pickerRegistry[state.openPickerKey];

    if (picker?.search) {
      window.setTimeout(() => {
        picker.search.focus();
        picker.search.select();
      }, 10);
    }
  }
}

function togglePicker(pickerKey) {
  setOpenPicker(state.openPickerKey === pickerKey ? "" : pickerKey);
}

function buildPickerEmptyState(copy) {
  return `<div class="detail-empty">${escapeHtml(copy)}</div>`;
}

function groupExamOptions(exams, query) {
  const grouped = new Map();

  exams.forEach((exam) => {
    let groupLabel = exam.group || "Outros";

    if (!query && exam.featured && exam.key) {
      groupLabel = "Mais conhecidos";
    }

    if (!grouped.has(groupLabel)) {
      grouped.set(groupLabel, []);
    }

    grouped.get(groupLabel).push(exam);
  });

  return [...grouped.entries()];
}

function matchesExamSearch(exam, query) {
  if (!query) {
    return true;
  }

  const haystack = [
    exam.label,
    exam.group,
    ...(Array.isArray(exam.searchTerms) ? exam.searchTerms : []),
  ]
    .map((item) => normalizeForSearch(item))
    .join(" ");

  return haystack.includes(query);
}

function renderExamPicker(pickerKey) {
  const picker = pickerRegistry[pickerKey];
  const preferences = ensurePreferences();

  if (!picker?.value || !picker?.meta || !picker?.list) {
    return;
  }

  const selectedExamKey = pickerKey === "primaryExam"
    ? preferences.primaryExamKey
    : preferences.secondaryExamKey;
  const query = normalizeForSearch(state.pickerSearch[pickerKey] || "");
  const baseExams = Array.isArray(state.templates?.exams) ? [...state.templates.exams] : [];
  const options = pickerKey === "secondaryExam"
    ? [SECONDARY_EMPTY_OPTION, ...baseExams.filter((exam) => exam.key !== preferences.primaryExamKey)]
    : baseExams;
  const filteredOptions = options.filter((exam) => matchesExamSearch(exam, query));
  const selectedExam = options.find((exam) => exam.key === selectedExamKey) || null;

  if (selectedExam) {
    picker.value.textContent = selectedExam.label;
    picker.meta.textContent = getExamHighlightText(selectedExam);
  } else if (pickerKey === "secondaryExam") {
    picker.value.textContent = SECONDARY_EMPTY_OPTION.label;
    picker.meta.textContent = "Opcional para equilibrar a semana sem poluir a selecao.";
  } else {
    picker.value.textContent = "Escolha o vestibular principal";
    picker.meta.textContent = "Mais conhecidos primeiro, com busca e rolagem.";
  }

  if (!filteredOptions.length) {
    picker.list.innerHTML = buildPickerEmptyState("Nenhum vestibular encontrado nessa busca.");
    return;
  }

  const groupedOptions = groupExamOptions(filteredOptions, query);

  picker.list.innerHTML = groupedOptions
    .map(([groupLabel, exams]) => `
      <section class="routine-picker-group">
        <strong class="routine-picker-group-label">${escapeHtml(groupLabel)}</strong>
        ${exams.map((exam) => {
          const isSelected = exam.key === selectedExamKey;

          return `
            <button
              type="button"
              class="routine-picker-option ${isSelected ? "is-selected" : ""}"
              data-picker-option="${escapeHtml(pickerKey)}"
              data-value="${escapeHtml(exam.key)}"
            >
              <span class="routine-picker-option-title">${escapeHtml(exam.label)}</span>
              <span class="routine-picker-option-copy">${escapeHtml(getExamHighlightText(exam))}</span>
            </button>
          `;
        }).join("")}
      </section>
    `)
    .join("");
}

function renderTrackPicker() {
  const picker = pickerRegistry.courseTrack;
  const preferences = ensurePreferences();
  const tracks = Array.isArray(state.templates?.courseTracks) ? state.templates.courseTracks : [];
  const selectedTrack = tracks.find((track) => track.key === preferences.courseTrackKey) || null;

  if (!picker?.value || !picker?.meta || !picker?.list) {
    return;
  }

  if (selectedTrack) {
    picker.value.textContent = selectedTrack.label;
    picker.meta.textContent = getTrackDescription(selectedTrack);
  } else {
    picker.value.textContent = "Escolha o perfil";
    picker.meta.textContent = "Exatas, humanas, saude, linguagens ou geral.";
  }

  picker.list.innerHTML = tracks.length
    ? tracks.map((track) => `
        <button
          type="button"
          class="routine-picker-option ${track.key === preferences.courseTrackKey ? "is-selected" : ""}"
          data-picker-option="courseTrack"
          data-value="${escapeHtml(track.key)}"
        >
          <span class="routine-picker-option-title">${escapeHtml(track.label)}</span>
          <span class="routine-picker-option-copy">${escapeHtml(getTrackDescription(track))}</span>
        </button>
      `).join("")
    : buildPickerEmptyState("Os perfis da rotina ainda nao carregaram.");
}

function renderCoursePicker() {
  const picker = pickerRegistry.course;
  const preferences = ensurePreferences();
  const selectedCourseKey = preferences.courseKey;
  const query = normalizeForSearch(state.pickerSearch.course || "");
  const courses = Array.isArray(state.templates?.courses) ? state.templates.courses : [];
  const selectedCourse = courses.find((course) => course.key === selectedCourseKey) || null;
  const filteredCourses = courses.filter((course) => {
    if (!query) {
      return true;
    }

    const haystack = [
      course.label,
      course.group,
      course.recommendedTrackLabel,
      ...(Array.isArray(course.searchTerms) ? course.searchTerms : []),
    ]
      .map((item) => normalizeForSearch(item))
      .join(" ");

    return haystack.includes(query);
  });

  if (!picker?.value || !picker?.meta || !picker?.list) {
    return;
  }

  if (selectedCourse) {
    picker.value.textContent = getCourseDisplayLabel() || selectedCourse.label;
    picker.meta.textContent = getCourseHighlightText(selectedCourse);
  } else {
    picker.value.textContent = "Escolha o curso";
    picker.meta.textContent = "Engenharia, medicina, fisioterapia, psicologia e mais.";
  }

  if (!filteredCourses.length) {
    picker.list.innerHTML = buildPickerEmptyState("Nenhum curso encontrado nessa busca.");
    return;
  }

  const groupedCourses = new Map();

  filteredCourses.forEach((course) => {
    let groupLabel = course.group || "Outros";

    if (!query && course.featured) {
      groupLabel = "Mais buscados";
    }

    if (!groupedCourses.has(groupLabel)) {
      groupedCourses.set(groupLabel, []);
    }

    groupedCourses.get(groupLabel).push(course);
  });

  picker.list.innerHTML = [...groupedCourses.entries()]
    .map(([groupLabel, coursesInGroup]) => `
      <section class="routine-picker-group">
        <strong class="routine-picker-group-label">${escapeHtml(groupLabel)}</strong>
        ${coursesInGroup.map((course) => `
          <button
            type="button"
            class="routine-picker-option ${course.key === selectedCourseKey ? "is-selected" : ""}"
            data-picker-option="course"
            data-value="${escapeHtml(course.key)}"
          >
            <span class="routine-picker-option-title">${escapeHtml(course.label)}</span>
            <span class="routine-picker-option-copy">${escapeHtml(getCourseHighlightText(course))}</span>
          </button>
        `).join("")}
      </section>
    `)
    .join("");
}

function renderAdmissionPicker() {
  const picker = pickerRegistry.admissionCategory;
  const preferences = ensurePreferences();
  const categories = ADMISSION_CATEGORIES.filter((category) => (
    !Array.isArray(state.templates?.admissionCategories) ||
    state.templates.admissionCategories.some((template) => template.key === category.id)
  ));
  const selectedCategory = categories.find((category) => category.id === preferences.admissionCategoryKey) || null;

  if (!picker?.value || !picker?.meta || !picker?.list) {
    return;
  }

  picker.value.textContent = selectedCategory?.label || "Selecione a categoria";
  picker.meta.textContent = selectedCategory
    ? `${selectedCategory.shortLabel} - ${selectedCategory.description}`
    : "Selecione a modalidade que mais se aproxima da sua forma de ingresso.";
  picker.list.innerHTML = categories.length
    ? categories.map((category) => `
        <button
          type="button"
          class="routine-picker-option ${category.id === preferences.admissionCategoryKey ? "is-selected" : ""}"
          data-picker-option="admissionCategory"
          data-value="${escapeHtml(category.id)}"
        >
          <span class="routine-picker-option-title">${escapeHtml(category.label)}</span>
          <span class="routine-picker-option-copy">${escapeHtml(`${category.shortLabel} - ${category.description}`)}</span>
        </button>
      `).join("")
    : buildPickerEmptyState("As categorias ainda nao carregaram.");
}

function renderShiftPicker() {
  const picker = pickerRegistry.shift;
  const currentShiftLabel = parseCourseContext(ensurePreferences().courseName).shift;
  const selectedShift = SHIFT_OPTIONS.find((option) => normalizeForSearch(option.label) === normalizeForSearch(currentShiftLabel)) || null;

  if (!picker?.value || !picker?.meta || !picker?.list) {
    return;
  }

  picker.value.textContent = selectedShift?.label || "Escolha o turno";
  picker.meta.textContent = selectedShift?.description || "Integral, manha, tarde, noite ou flexivel.";
  picker.list.innerHTML = SHIFT_OPTIONS.map((option) => `
    <button
      type="button"
      class="routine-picker-option ${selectedShift?.key === option.key ? "is-selected" : ""}"
      data-picker-option="shift"
      data-value="${escapeHtml(option.key)}"
    >
      <span class="routine-picker-option-title">${escapeHtml(option.label)}</span>
      <span class="routine-picker-option-copy">${escapeHtml(option.description)}</span>
    </button>
  `).join("");
}

function renderPickers() {
  renderExamPicker("primaryExam");
  renderExamPicker("secondaryExam");
  renderTrackPicker();
  renderCoursePicker();
  renderAdmissionPicker();
  renderShiftPicker();
}

function renderDayInputs() {
  const preferences = ensurePreferences();
  const dayLabels = Array.isArray(state.templates?.weekdayLabels) ? state.templates.weekdayLabels : [];
  const dayCards = [...routineDaysGrid.querySelectorAll(".routine-day-card")];

  dayCards.forEach((card, dayIndex) => {
    const toggle = card.querySelector("[data-routine-day-toggle]");
    const minutesInput = card.querySelector("[data-routine-day-minutes]");
    const label = card.querySelector("[data-routine-day-label]");
    const isActive = preferences.studyDays.includes(dayIndex);
    const currentMinutes = Number(preferences.weekdayMinutes?.[String(dayIndex)] || 60);

    if (label && dayLabels[dayIndex]) {
      label.textContent = dayLabels[dayIndex];
    }

    if (toggle) {
      toggle.checked = isActive;
    }

    if (minutesInput) {
      minutesInput.disabled = !isActive;
      minutesInput.value = String(currentMinutes);
    }

    card.dataset.active = String(isActive);
  });

  if (routineCourseNameInput) {
    routineCourseNameInput.value = preferences.courseName || "";
  }

  const context = parseCourseContext(preferences.courseName);

  if (routineCustomCourseInput) {
    routineCustomCourseInput.value = context.customCourse || (preferences.courseKey === "outro" ? context.note : "");
  }

  if (routineCustomCourseShell) {
    routineCustomCourseShell.hidden = preferences.courseKey !== "outro";
  }

  if (routineCityInput) {
    routineCityInput.value = context.city;
  }

  if (routineUniversityInput) {
    routineUniversityInput.value = context.university;
  }

  if (routineCampusInput) {
    routineCampusInput.value = context.campus;
  }

  if (routineContextNoteInput) {
    routineContextNoteInput.value = context.note;
  }

  if (routineWeeklyGoalInput) {
    routineWeeklyGoalInput.value = String(Number(preferences.weeklyGoalMinutes || 300));
  }
}

function normalizeDifficultyLevel(value) {
  const normalizedValue = String(value || "normal");

  if (normalizedValue === "atencao") {
    return "dificil";
  }

  if (normalizedValue === "reforco") {
    return "muito_dificil";
  }

  return normalizedValue;
}

function buildWeightedSubjectPreview() {
  const subjectTemplates = Array.isArray(state.templates?.subjects) ? state.templates.subjects : [];
  const subjects = subjectTemplates.length
    ? subjectTemplates.map((subject) => ({
        id: subject.key,
        name: subject.label || getSubjectLabel(subject.key),
      }))
    : SUBJECTS.map((subject) => ({
        id: subject.id,
        name: subject.name,
      }));

  return calculateSubjectWeights({
    subjects,
    course: getCurrentCourse(),
    primaryExam: getCurrentPrimaryExam(),
    secondaryExam: getCurrentSecondaryExam(),
    examProfile: getCurrentTrack(),
    subjectPreferences: (ensurePreferences().subjectPreferences || []).map((entry) => ({
      ...entry,
      difficultyLevel: normalizeDifficultyLevel(entry.difficultyLevel),
    })),
  }).map((entry) => ({
    ...entry,
    weightLabel: `${Math.round(Number(entry.normalizedWeight || 0) * 100)}%`,
    priorityLevel: entry.priorityLevel || "base",
    priorityCopy: entry.priorityCopy || "Base",
    helperCopy: DIFFICULTY_COPY[normalizeDifficultyLevel(entry.difficultyLevel)] || DIFFICULTY_COPY.normal,
    difficultyLevel: normalizeDifficultyLevel(entry.difficultyLevel),
  }));
}

function renderCapacitySummary(weightedSubjects) {
  const preview = buildWeeklyPlanPreview({
    weightedSubjects,
    weekdayMinutes: ensurePreferences().weekdayMinutes || {},
    studyDays: ensurePreferences().studyDays || [],
    weekdayLabels: Array.isArray(state.templates?.weekdayLabels) ? state.templates.weekdayLabels : [],
  });

  if (routineCapacityTotalValue) {
    routineCapacityTotalValue.textContent = `${formatMinutes(preview.weeklyCapacity)} min`;
  }

  if (routineCapacityAverageValue) {
    routineCapacityAverageValue.textContent = `${formatMinutes(preview.averageActiveDayMinutes)} min`;
  }

  if (routineCapacityInsight) {
    routineCapacityInsight.textContent = preview.weeklyCapacity
      ? `${preview.activeDays} dia(s) ativos. ${preview.subjectPlan?.[0]?.subjectLabel || "Sua materia principal"} lidera a distribuicao inicial.`
      : "Defina seus dias para enxergar sua capacidade semanal real.";
  }
}

function buildManualDeltaOptions(selectedValue) {
  return MANUAL_DELTA_OPTIONS.map((option) => `
    <option value="${option.value}" ${Number(selectedValue) === option.value ? "selected" : ""}>
      ${escapeHtml(option.label)}
    </option>
  `).join("");
}

function buildDifficultyOptions(selectedValue) {
  const normalizedSelectedValue = normalizeDifficultyLevel(selectedValue);

  return DIFFICULTY_OPTIONS.map((level) => `
    <option value="${escapeHtml(level.key)}" ${String(normalizedSelectedValue) === level.key ? "selected" : ""}>
      ${escapeHtml(level.label)}
    </option>
  `).join("");
}

function renderSubjectList() {
  if (!routineSubjectList) {
    return;
  }

  const preferences = ensurePreferences();
  const weightedSubjects = buildWeightedSubjectPreview();
  const weightedMap = new Map(
    weightedSubjects.map((entry) => [getPreferenceKey(entry.subjectKey, entry.customSubjectName), entry])
  );
  const standardSubjects = (state.templates?.subjects || []).filter((subject) => subject.key !== "outras");
  const customSubjects = (preferences.subjectPreferences || []).filter((entry) => entry.subjectKey === "outras");
  const rows = [
    ...standardSubjects.map((subject) => {
      const preference = getPreferenceEntry(subject.key) || {
        manualDelta: 0,
        difficultyLevel: "normal",
      };
      const weightedEntry = weightedMap.get(getPreferenceKey(subject.key, "")) || {};

      return renderSubjectPriorityCard({
        subject: {
          subjectKey: subject.key,
          subjectLabel: subject.label,
          customSubjectName: "",
          manualDelta: Number(preference.manualDelta || 0),
          difficultyLevel: normalizeDifficultyLevel(preference.difficultyLevel),
          priorityLevel: weightedEntry.priorityLevel || "base",
          priorityCopy: weightedEntry.priorityCopy || "Base",
          weightLabel: weightedEntry.weightLabel || "0%",
          weightReason: "Base do curso, vestibular, perfil e ajustes manuais.",
          helperCopy: DIFFICULTY_COPY[normalizeDifficultyLevel(preference.difficultyLevel)] || DIFFICULTY_COPY.normal,
          isCustom: false,
        },
        manualOptions: MANUAL_DELTA_OPTIONS,
        difficultyOptions: DIFFICULTY_OPTIONS,
      });
    }),
    ...customSubjects.map((entry) => {
      const weightedEntry = weightedMap.get(getPreferenceKey("outras", entry.customSubjectName)) || {};

      return renderSubjectPriorityCard({
        subject: {
          subjectKey: "outras",
          subjectLabel: getSubjectLabel("outras", entry.customSubjectName),
          customSubjectName: entry.customSubjectName,
          manualDelta: Number(entry.manualDelta || 0),
          difficultyLevel: normalizeDifficultyLevel(entry.difficultyLevel),
          priorityLevel: weightedEntry.priorityLevel || "base",
          priorityCopy: weightedEntry.priorityCopy || "Base",
          weightLabel: weightedEntry.weightLabel || "0%",
          weightReason: "Materia personalizada com peso inicial menor e subida manual.",
          helperCopy: DIFFICULTY_COPY[normalizeDifficultyLevel(entry.difficultyLevel)] || DIFFICULTY_COPY.normal,
          isCustom: true,
        },
        manualOptions: MANUAL_DELTA_OPTIONS,
        difficultyOptions: DIFFICULTY_OPTIONS,
      });
    }),
  ];

  routineSubjectList.innerHTML = rows.join("");
}

function renderCustomSubjectSuggestions() {
  if (!routineCustomSubjectSuggestions) {
    return;
  }

  const addedCustomNames = new Set(
    (ensurePreferences().subjectPreferences || [])
      .filter((entry) => entry.subjectKey === "outras")
      .map((entry) => normalizeForSearch(entry.customSubjectName))
  );
  const visibleSuggestions = state.customSubjectSuggestions.filter((name) => (
    !addedCustomNames.has(normalizeForSearch(name))
  ));

  routineCustomSubjectSuggestions.innerHTML = visibleSuggestions.length
    ? visibleSuggestions.map((name) => `
        <button
          type="button"
          class="routine-suggestion-button"
          data-action="add-suggestion"
          data-name="${escapeHtml(name)}"
        >
          ${escapeHtml(name)}
        </button>
      `).join("")
    : `<span class="detail-empty">Suas materias personalizadas aparecem aqui.</span>`;
}

function renderPlan() {
  const plan = state.plan;

  if (!plan) {
    if (routinePlanTitle) {
      routinePlanTitle.textContent = "Semana ainda nao gerada";
    }

    if (routinePlanExecutionValue) {
      routinePlanExecutionValue.textContent = "0%";
    }

    if (routinePlanMinutesValue) {
      routinePlanMinutesValue.textContent = "0 min";
    }

    if (routinePlanActualValue) {
      routinePlanActualValue.textContent = "0 min";
    }

    if (routinePlanPriorityValue) {
      routinePlanPriorityValue.textContent = "Defina a base da semana";
    }

    if (routinePlanSummaryText) {
      routinePlanSummaryText.textContent =
        "Quando voce gerar a rotina, este bloco mostra o foco da semana, o reforco principal e o andamento real dos estudos.";
    }

    if (routinePlanDays) {
      routinePlanDays.innerHTML = `<div class="detail-empty">Nenhuma rotina gerada ainda.</div>`;
    }

    if (routineSubjectTotals) {
      routineSubjectTotals.innerHTML =
        `<div class="detail-empty">Quando a semana for gerada, as materias aparecem aqui.</div>`;
    }

    return;
  }

  if (routinePlanTitle) {
    routinePlanTitle.textContent = `Semana ${formatDateLabel(plan.weekStart)} a ${formatDateLabel(plan.weekEnd)}`;
  }

  if (routinePlanExecutionValue) {
    routinePlanExecutionValue.textContent = `${Math.round(Number(plan.executionPercent) || 0)}%`;
  }

  if (routinePlanMinutesValue) {
    routinePlanMinutesValue.textContent = `${formatMinutes(plan.totalPlannedMinutes)} min`;
  }

  if (routinePlanActualValue) {
    routinePlanActualValue.textContent = `${formatMinutes(plan.totalActualMinutes)} min`;
  }

  if (routinePlanPriorityValue) {
    routinePlanPriorityValue.textContent = plan.nextPriority?.subjectLabel || "Semana equilibrada";
  }

  if (routinePlanSummaryText) {
    const targetSummary = plan.courseTarget?.selectedTarget
      ? ` Meta ${plan.courseTarget.selectedTarget.label}: ${plan.courseTarget.selectedTarget.targetDisplay}.`
      : "";
    routinePlanSummaryText.textContent = `${plan.summaryText || "Sua rotina da semana esta pronta."}${targetSummary}`;
  }

  if (routinePlanDays) {
    routinePlanDays.innerHTML = Array.isArray(plan.days) && plan.days.length
      ? plan.days.map((day) => `
          <article class="routine-day-plan-card">
            <div class="routine-day-plan-head">
              <div>
                <h3 class="routine-day-plan-title">${escapeHtml(day.label)}</h3>
                <p class="routine-day-plan-meta">
                  ${day.isActive ? "Dia de estudo" : "Dia livre"} - ${formatMinutes(day.plannedMinutes)} min planejados
                </p>
              </div>
              <div class="routine-day-plan-meta">
                ${formatMinutes(day.actualMinutes)} min feitos - ${Math.round(Number(day.executionPercent) || 0)}%
              </div>
            </div>

            <div class="routine-day-plan-items">
              ${Array.isArray(day.items) && day.items.length
                ? day.items.map((item) => `
                    <article class="routine-plan-item">
                      <div class="routine-plan-item-top">
                        <strong class="routine-plan-item-title">${escapeHtml(item.subjectLabel)}</strong>
                        <span class="routine-plan-item-badge">${escapeHtml(item.slotType === "reforco" ? "Reforco" : "Base")}</span>
                      </div>
                      <p class="routine-plan-item-copy">${escapeHtml(item.reasonLabel || "Bloco montado pela prioridade da semana.")}</p>
                      <p class="routine-plan-item-progress">
                        ${formatMinutes(item.plannedMinutes)} min planejados - ${formatMinutes(item.actualMinutes)} min feitos
                      </p>
                    </article>
                  `).join("")
                : `<div class="detail-empty">Sem bloco planejado neste dia.</div>`}
            </div>
          </article>
        `).join("")
      : `<div class="detail-empty">Nenhuma rotina gerada ainda.</div>`;
  }

  if (routineSubjectTotals) {
    const reinforcementKeys = new Set(
      (plan.reinforcementSubjects || []).map((entry) => getPreferenceKey(entry.subjectKey, entry.customSubjectName))
    );

    routineSubjectTotals.innerHTML = Array.isArray(plan.totalsBySubject) && plan.totalsBySubject.length
      ? plan.totalsBySubject.map((entry) => {
          const isReinforcement = reinforcementKeys.has(
            getPreferenceKey(entry.subjectKey, entry.customSubjectName)
          );

          return `
            <article class="routine-total-row">
              <div class="routine-total-top">
                <strong class="routine-total-label">${escapeHtml(entry.subjectLabel)}</strong>
                <span class="routine-total-meta">${isReinforcement ? "Com reforco" : "Carga da semana"}</span>
              </div>
              <p class="routine-total-meta">
                ${formatMinutes(entry.plannedMinutes)} min planejados - ${formatMinutes(entry.actualMinutes)} min feitos - ${Math.round(Number(entry.executionPercent) || 0)}%
              </p>
            </article>
          `;
        }).join("")
      : `<div class="detail-empty">Quando a semana for gerada, as materias aparecem aqui.</div>`;
  }
}

function renderTargetPanel() {
  if (!routineTargetBands || !routineTargetTitle || !routineTargetCopy || !routineTargetScale || !routineTargetNote) {
    return;
  }

  const course = getCurrentCourse();
  const exam = getCurrentPrimaryExam();
  const category = getCurrentAdmissionCategory();
  const goal = buildInternalGoal(
    course
      ? {
          key: course.key,
          name: course.label,
          cluster: course.group,
          description: getCourseHighlightText(course),
          subjectBoosts: { ...(course.subjectBoosts || {}) },
          targetScores: { ...(course.targetScores || {}) },
        }
      : null,
    category,
    exam
      ? {
          name: exam.label,
          scoreScaleType: exam.scoreScaleType,
        }
      : null
  );
  const highlightedSubjects = buildWeightedSubjectPreview()
    .slice(0, 4)
    .map((entry) => entry.subjectLabel);
  const goalCard = renderGoalSummaryCard({
    course: course
      ? {
          name: getCourseDisplayLabel() || course.label,
          cluster: course.group,
          description: getCourseHighlightText(course),
        }
      : null,
    category,
    exam: exam
      ? {
          name: exam.label,
        }
      : null,
    goal,
    prioritySubjects: highlightedSubjects,
  });

  routineTargetTitle.textContent = goalCard.title;
  routineTargetScale.textContent = goalCard.scaleLabel;
  routineTargetCopy.innerHTML = goalCard.html;
  routineTargetBands.innerHTML = "";
  routineTargetNote.textContent = goalCard.note;
}

function renderAdvancedSettingsShell() {
  if (!routineAdvancedDetails || !routineAdvancedToggle || !routineAdvancedPanel || !routineAdvancedSummary || !routineAdvancedIcon) {
    return;
  }

  const primaryExam = getCurrentPrimaryExam();
  const secondaryExam = getCurrentSecondaryExam();
  const track = getCurrentTrack();
  const pieces = [];

  if (primaryExam?.label) {
    pieces.push(primaryExam.label);
  }

  if (secondaryExam?.label) {
    pieces.push(`+ ${secondaryExam.label}`);
  }

  if (track?.label && track.key !== "geral") {
    pieces.push(track.label);
  }

  routineAdvancedDetails.open = state.isAdvancedOpen;
  routineAdvancedToggle.setAttribute("aria-expanded", state.isAdvancedOpen ? "true" : "false");
  routineAdvancedIcon.textContent = state.isAdvancedOpen ? "-" : "+";

  if (!pieces.length) {
    routineAdvancedSummary.textContent =
      "Opcional. Abra se quiser alinhar a rotina a uma prova especifica.";
    return;
  }

  routineAdvancedSummary.textContent = `${pieces.join(" - ")}. Ajuste fino para deixar a semana mais proxima da prova que voce quer atacar.`;
}

function isStepOneComplete() {
  const preferences = ensurePreferences();
  const context = parseCourseContext(preferences.courseName);
  const hasCustomCourseName = preferences.courseKey !== "outro"
    || Boolean(String(context.customCourse || context.note || "").trim());

  return Boolean(
    String(preferences.courseKey || "").trim() &&
    String(preferences.admissionCategoryKey || "").trim() &&
    String(preferences.primaryExamKey || "").trim() &&
    hasCustomCourseName &&
    String(context.city || "").trim() &&
    Number(preferences.weeklyGoalMinutes || 0) >= 60
  );
}

function isStepTwoComplete() {
  const preferences = ensurePreferences();
  const studyDays = Array.isArray(preferences.studyDays) ? preferences.studyDays : [];

  if (!studyDays.length) {
    return false;
  }

  return studyDays.every((day) => Number(preferences.weekdayMinutes?.[String(day)] || 0) >= 30);
}

function getUnlockedWizardStep() {
  if (!isStepOneComplete()) {
    return 1;
  }

  if (!isStepTwoComplete()) {
    return 2;
  }

  return 3;
}

function getWizardStepMeta(stepNumber = state.wizardStep) {
  return ROUTINE_WIZARD_STEPS.find((item) => item.id === stepNumber) || ROUTINE_WIZARD_STEPS[0];
}

function renderWizardState() {
  const unlockedStep = getUnlockedWizardStep();

  routineStepTriggers.forEach((button, index) => {
    const stepNumber = index + 1;
    const isActive = state.wizardStep === stepNumber;
    const isUnlocked = stepNumber <= unlockedStep;
    const isComplete =
      (stepNumber === 1 && isStepOneComplete()) ||
      (stepNumber === 2 && isStepTwoComplete()) ||
      (stepNumber === 3 && isStepOneComplete() && isStepTwoComplete());

    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-complete", isComplete);
    button.disabled = !isUnlocked;
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("aria-disabled", String(!isUnlocked));
  });

  routineStepPanels.forEach((panel) => {
    panel.hidden = Number(panel.dataset.routineStep || 0) !== state.wizardStep;
  });

  if (routineStepBackButton) {
    routineStepBackButton.hidden = state.wizardStep === 1;
    routineStepBackButton.disabled = state.wizardStep === 1 || state.isSaving || state.isGenerating;
  }

  if (routineStepNextButton) {
    routineStepNextButton.hidden = state.wizardStep === ROUTINE_WIZARD_STEPS.length;
    routineStepNextButton.disabled = state.isSaving || state.isGenerating;
  }

  if (routineGenerateButton) {
    routineGenerateButton.hidden = state.wizardStep !== ROUTINE_WIZARD_STEPS.length;
  }

  const stepMeta = getWizardStepMeta();

  if (routineWizardStepState) {
    routineWizardStepState.textContent = `Etapa ${stepMeta.id} de ${ROUTINE_WIZARD_STEPS.length}`;
  }

  if (routineWizardStepCopy) {
    routineWizardStepCopy.textContent = stepMeta.copy;
  }
}

function setWizardStep(nextStep, options = {}) {
  const safeStep = Math.max(1, Math.min(ROUTINE_WIZARD_STEPS.length, Number(nextStep) || 1));
  const unlockedStep = getUnlockedWizardStep();
  state.wizardStep = options.force === true ? safeStep : Math.min(safeStep, unlockedStep);
  renderWizardState();
}

function validateWizardStep(stepNumber = state.wizardStep) {
  syncLocalPreferencesFromInputs();

  if (stepNumber === 1 && !isStepOneComplete()) {
    setFeedback("Preencha curso, categoria, meta semanal, vestibular e cidade para continuar. Se escolher outro curso, informe o nome dele.", "error");
    return false;
  }

  if (stepNumber === 2 && !isStepTwoComplete()) {
    setFeedback("Marque ao menos um dia e defina os minutos dos dias ativos para continuar.", "error");
    return false;
  }

  return true;
}

function goToNextWizardStep() {
  if (!validateWizardStep(state.wizardStep)) {
    return;
  }

  setWizardStep(state.wizardStep + 1, { force: true });
}

function goToPreviousWizardStep() {
  setWizardStep(state.wizardStep - 1, { force: true });
}

function renderAll() {
  if (!state.templates) {
    return;
  }

  renderAdvancedSettingsShell();
  renderPickers();
  renderDayInputs();
  renderCapacitySummary(buildWeightedSubjectPreview());
  renderTargetPanel();
  renderCustomSubjectSuggestions();
  renderSubjectList();
  renderPlan();
  renderWizardState();
}

function collectPreferencesPayload() {
  const currentPreferences = ensurePreferences();
  const studyDays = [...routineDaysGrid.querySelectorAll("[data-routine-day-toggle]")]
    .filter((input) => input.checked)
    .map((input) => Number(input.dataset.day))
    .filter((value) => Number.isInteger(value))
    .sort((left, right) => left - right);
  const weekdayMinutes = {};

  [...routineDaysGrid.querySelectorAll("[data-routine-day-minutes]")].forEach((input) => {
    const day = String(input.dataset.day || "");
    weekdayMinutes[day] = Number(input.value || currentPreferences.weekdayMinutes?.[day] || 60);
  });

  return {
    primaryExamKey: currentPreferences.primaryExamKey,
    secondaryExamKey: currentPreferences.secondaryExamKey,
    courseKey: currentPreferences.courseKey,
    admissionCategoryKey: currentPreferences.admissionCategoryKey || "ac",
    courseTrackKey: currentPreferences.courseTrackKey,
    courseName: composeCourseContext(),
    studyDays,
    weekdayMinutes,
    weeklyGoalMinutes: Number(routineWeeklyGoalInput?.value || currentPreferences.weeklyGoalMinutes || 300),
    subjectPreferences: (currentPreferences.subjectPreferences || []).map((entry) => ({
      subjectKey: entry.subjectKey,
      customSubjectName: entry.customSubjectName,
      manualDelta: Number(entry.manualDelta || 0),
      difficultyLevel: String(normalizeDifficultyLevel(entry.difficultyLevel) || "normal"),
    })),
  };
}

function syncLocalPreferencesFromInputs() {
  const payload = collectPreferencesPayload();

  state.preferences = {
    ...ensurePreferences(),
    ...payload,
    studyDays: [...payload.studyDays],
    weekdayMinutes: { ...payload.weekdayMinutes },
    subjectPreferences: sortSubjectPreferences(payload.subjectPreferences),
  };
}

async function loadTemplates() {
  const response = await window.Start5Auth.apiRequest("/api/routine/templates");
  state.templates = response?.templates || null;
}

async function loadPreferences() {
  const response = await window.Start5Auth.apiRequest("/api/routine/preferences");
  state.preferences = response?.preferences || getDefaultPreferences();
  syncCustomSubjectSuggestions(response?.customSubjectSuggestions || []);
}

async function loadCurrentPlan() {
  const response = await window.Start5Auth.apiRequest("/api/routine/plans/current");
  state.plan = response?.plan || null;

  if (response?.plan?.customSubjectSuggestions) {
    syncCustomSubjectSuggestions(response.plan.customSubjectSuggestions);
  }
}

function setActionLoadingState() {
  if (routineSaveButton) {
    routineSaveButton.disabled = state.isSaving || state.isGenerating;
    routineSaveButton.textContent = state.isSaving ? "Salvando..." : "Salvar base";
  }

  if (routineGenerateButton) {
    routineGenerateButton.disabled = state.isSaving || state.isGenerating;
    routineGenerateButton.textContent = state.isGenerating ? "Gerando..." : "Gerar semana";
  }

  renderWizardState();
}

async function saveRoutinePreferences() {
  syncLocalPreferencesFromInputs();
  state.isSaving = true;
  setActionLoadingState();
  setFeedback("Salvando a base da sua rotina...", "loading");

  try {
    const response = await window.Start5Auth.apiRequest("/api/routine/preferences", {
      method: "PATCH",
      body: collectPreferencesPayload(),
    });

    state.preferences = response?.preferences || state.preferences;
    syncCustomSubjectSuggestions(response?.customSubjectSuggestions || []);
    renderAll();
    setFeedback("Ajustes salvos. Agora voce pode gerar a semana com essa base.", "success");
  } catch (error) {
    setFeedback(error.message || "Nao foi possivel salvar a rotina agora.", "error");
  } finally {
    state.isSaving = false;
    setActionLoadingState();
  }
}

async function generateRoutinePlan() {
  if (!validateWizardStep(1)) {
    setWizardStep(1, { force: true });
    return;
  }

  if (!validateWizardStep(2)) {
    setWizardStep(2, { force: true });
    return;
  }

  syncLocalPreferencesFromInputs();
  state.isGenerating = true;
  setActionLoadingState();
  setFeedback("Gerando a semana com base no curso, na prova e nos reforcos...", "loading");

  try {
    const response = await window.Start5Auth.apiRequest("/api/routine/plans/generate", {
      method: "POST",
      body: collectPreferencesPayload(),
    });

    state.plan = response?.plan || null;
    await loadPreferences();
    renderAll();
    setFeedback("Semana gerada. Agora voce ja consegue comparar o planejado com o realizado.", "success");
  } catch (error) {
    setFeedback(error.message || "Nao foi possivel gerar a rotina da semana.", "error");
  } finally {
    state.isGenerating = false;
    setActionLoadingState();
  }
}

function handlePickerOptionSelect(pickerKey, value) {
  const preferences = ensurePreferences();

  if (pickerKey === "primaryExam") {
    preferences.primaryExamKey = value || "enem";

    if (preferences.secondaryExamKey === preferences.primaryExamKey) {
      preferences.secondaryExamKey = "";
    }
  }

  if (pickerKey === "secondaryExam") {
    preferences.secondaryExamKey = value === preferences.primaryExamKey ? "" : value;
  }

  if (pickerKey === "courseTrack") {
    preferences.courseTrackKey = value || "geral";
  }

  if (pickerKey === "course") {
    preferences.courseKey = value || "";

    if (preferences.courseKey !== "outro" && routineCustomCourseInput) {
      routineCustomCourseInput.value = "";
    }

    if (preferences.courseKey !== "outro" && !String(routineCourseNameInput?.value || "").trim()) {
      const selectedCourse = (state.templates?.courses || []).find((course) => course.key === preferences.courseKey);

      if (selectedCourse?.recommendedTrackKey && preferences.courseTrackKey === "geral") {
        preferences.courseTrackKey = selectedCourse.recommendedTrackKey;
      }
    }

    preferences.courseName = composeCourseContext();
  }

  if (pickerKey === "admissionCategory") {
    preferences.admissionCategoryKey = value || "";
  }

  if (pickerKey === "shift") {
    const selectedShift = SHIFT_OPTIONS.find((option) => option.key === value) || null;

    if (selectedShift && pickerRegistry.shift?.value) {
      pickerRegistry.shift.value.textContent = selectedShift.label;
    }

    preferences.courseName = composeCourseContext();
  }

  renderAll();
  setOpenPicker("");
}

function addCustomSubject(subjectName) {
  const cleanName = String(subjectName || "").trim().replace(/\s+/g, " ").slice(0, 80);

  if (!cleanName) {
    setFeedback("Digite o nome da materia personalizada antes de adicionar.", "error");
    return;
  }

  const alreadyExists = (ensurePreferences().subjectPreferences || []).some((entry) => (
    entry.subjectKey === "outras" &&
    normalizeForSearch(entry.customSubjectName) === normalizeForSearch(cleanName)
  ));

  if (alreadyExists) {
    setFeedback("Essa materia personalizada ja esta na rotina.", "error");
    return;
  }

  upsertSubjectPreference("outras", cleanName, {});
  syncCustomSubjectSuggestions([...state.customSubjectSuggestions, cleanName]);
  renderCustomSubjectSuggestions();
  renderSubjectList();

  if (routineCustomSubjectInput) {
    routineCustomSubjectInput.value = "";
  }

  setFeedback(`"${cleanName}" entrou na rotina e agora pode receber reforco ou ajuste manual.`, "success");
}

function handleDayToggleChange(input) {
  const preferences = ensurePreferences();
  const dayIndex = Number(input.dataset.day);

  if (!Number.isInteger(dayIndex)) {
    return;
  }

  if (input.checked) {
    if (!preferences.studyDays.includes(dayIndex)) {
      preferences.studyDays = [...preferences.studyDays, dayIndex].sort((left, right) => left - right);
    }
  } else {
    preferences.studyDays = preferences.studyDays.filter((value) => value !== dayIndex);
  }

  renderAll();
}

function handleDayMinutesChange(input) {
  const preferences = ensurePreferences();
  const dayIndex = String(input.dataset.day || "");

  preferences.weekdayMinutes = {
    ...(preferences.weekdayMinutes || {}),
    [dayIndex]: Number(input.value || 60),
  };

  renderAll();
}

function bindEvents() {
  if (!sidebarNavigationManaged) {
    menuToggle?.addEventListener("click", toggleMenu);

    menuPanel?.addEventListener("click", (event) => {
      if (event.target === menuPanel) {
        closeMenu();
      }
    });
  }

  Object.values(pickerRegistry).forEach((picker) => {
    picker.trigger?.addEventListener("click", () => {
      togglePicker(picker.key);
    });

    picker.search?.addEventListener("input", (event) => {
      state.pickerSearch[picker.key] = event.target.value;

      if (picker.key === "primaryExam" || picker.key === "secondaryExam") {
        renderExamPicker(picker.key);
        return;
      }

      if (picker.key === "course") {
        renderCoursePicker();
      }
    });

    picker.list?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-picker-option]");

      if (!button) {
        return;
      }

      handlePickerOptionSelect(
        button.dataset.pickerOption,
        String(button.dataset.value || "")
      );
    });
  });

  routineDaysGrid?.addEventListener("change", (event) => {
    const toggle = event.target.closest("[data-routine-day-toggle]");
    const minutesInput = event.target.closest("[data-routine-day-minutes]");

    if (toggle) {
      handleDayToggleChange(toggle);
      return;
    }

    if (minutesInput) {
      handleDayMinutesChange(minutesInput);
    }
  });

  routineSubjectList?.addEventListener("change", (event) => {
    const row = event.target.closest(".routine-subject-row");

    if (!row) {
      return;
    }

    const subjectKey = String(row.dataset.subjectKey || "");
    const customSubjectName = String(row.dataset.customSubjectName || "");

    if (event.target.matches("[data-control='manual-delta']")) {
      upsertSubjectPreference(subjectKey, customSubjectName, {
        manualDelta: Number(event.target.value || 0),
      });
      renderAll();
      return;
    }

    if (event.target.matches("[data-control='difficulty-level']")) {
      upsertSubjectPreference(subjectKey, customSubjectName, {
        difficultyLevel: String(normalizeDifficultyLevel(event.target.value || "normal")),
      });
      renderAll();
    }
  });

  routineSubjectList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='remove-custom-subject']");

    if (!button) {
      return;
    }

    const row = button.closest(".routine-subject-row");

    if (!row) {
      return;
    }

    removeCustomSubject(row.dataset.customSubjectName || "");
    renderAll();
  });

  routineCustomSubjectSuggestions?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='add-suggestion']");

    if (!button) {
      return;
    }

    addCustomSubject(button.dataset.name || "");
  });

  routineAddCustomSubjectButton?.addEventListener("click", () => {
    addCustomSubject(routineCustomSubjectInput?.value || "");
  });

  routineCustomSubjectInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomSubject(routineCustomSubjectInput.value);
    }
  });

  [
    routineCustomCourseInput,
    routineUniversityInput,
    routineCampusInput,
    routineContextNoteInput,
    routineWeeklyGoalInput,
  ].forEach((input) => {
    input?.addEventListener("input", () => {
      ensurePreferences().courseName = composeCourseContext();
      renderAll();
    });
  });

  routineCityInput?.addEventListener("input", () => {
    ensurePreferences().courseName = composeCourseContext();
    renderAll();
  });

  routineAdvancedDetails?.addEventListener("toggle", () => {
    if (state.isAdvancedOpen === routineAdvancedDetails.open) {
      return;
    }

    state.isAdvancedOpen = routineAdvancedDetails.open;
    renderAdvancedSettingsShell();
  });

  routineSaveButton?.addEventListener("click", saveRoutinePreferences);
  routineGenerateButton?.addEventListener("click", generateRoutinePlan);
  routineStepBackButton?.addEventListener("click", goToPreviousWizardStep);
  routineStepNextButton?.addEventListener("click", goToNextWizardStep);

  routineStepTriggers.forEach((button) => {
    button.addEventListener("click", () => {
      const requestedStep = Number(button.dataset.routineStepTrigger || 1);
      setWizardStep(requestedStep);
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInsidePicker = event.target.closest(".routine-picker");

    if (!clickedInsidePicker) {
      setOpenPicker("");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.openPickerKey) {
      setOpenPicker("");
      return;
    }

    if (!sidebarNavigationManaged && event.key === "Escape" && body.classList.contains("menu-open")) {
      closeMenu();
    }
  });
}

async function initializeRoutinePage() {
  try {
    const session = await window.Start5Auth.ready;

    if (!session) {
      return;
    }

    setFeedback(FEEDBACK_COPY.loading, "loading");
    bindEvents();
    await Promise.all([loadTemplates(), loadPreferences(), loadCurrentPlan()]);
    if (!state.advancedInitialized) {
      state.isAdvancedOpen = shouldStartAdvancedOpen();
      state.advancedInitialized = true;
    }
    state.wizardStep = ROUTINE_SETUP_QUERY ? 1 : getUnlockedWizardStep();
    renderAll();
    setFeedback(FEEDBACK_COPY.idle);
  } catch (error) {
    console.error("Erro ao carregar rotina:", error);
    setFeedback(error.message || "Nao foi possivel carregar a rotina agora.", "error");
  }
}

initializeRoutinePage();
