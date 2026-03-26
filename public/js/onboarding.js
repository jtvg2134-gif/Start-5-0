(function initializeStart5Onboarding() {
  const root = document.body;
  const currentStep = Number(root?.dataset.onboardingStep || 0);

  if (!currentStep) {
    return;
  }

  const feedbackElement = document.getElementById("onboardingFeedback");
  const progressLabel = document.getElementById("onboardingProgressLabel");
  const progressSteps = [...document.querySelectorAll("[data-onboarding-progress-step]")];
  const stepBackButton = document.getElementById("onboardingBackButton");
  const stepSubmitButton = document.getElementById("onboardingSubmitButton");
  const accountName = document.getElementById("onboardingAccountName");
  const accountEmail = document.getElementById("onboardingAccountEmail");

  const SHIFT_OPTIONS = [
    { key: "", label: "Sem ajuste fino" },
    { key: "integral", label: "Integral" },
    { key: "manha", label: "Manha" },
    { key: "tarde", label: "Tarde" },
    { key: "noite", label: "Noite" },
    { key: "flexivel", label: "Flexivel" },
  ];

  const WEEKLY_GOAL_OPTIONS = [180, 300, 420, 540, 720, 900].map((minutes) => ({
    key: String(minutes),
    label: `${formatDuration(minutes)} por semana`,
  }));

  const DAY_MINUTE_OPTIONS = [30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => ({
    key: String(minutes),
    label: formatDuration(minutes),
  }));

  const MANUAL_DELTA_LABELS = {
    "-2": "Cair forte",
    "-1": "Cair um pouco",
    "0": "Neutro",
    "1": "Subir um pouco",
    "2": "Subir bem",
    "3": "Virar prioridade",
    "4": "Foco alto",
    "5": "Topo absoluto",
  };

  const DIFFICULTY_LABELS = {
    normal: "Normal",
    atencao: "Atencao",
    reforco: "Reforco",
  };

  const STEP_PAGES = {
    1: "onboarding-curso.html",
    2: "onboarding-semana.html",
    3: "onboarding-prioridades.html",
  };

  const CITY_OPTIONS = [
    "São Paulo",
    "Campinas",
    "Ribeirão Preto",
    "São Carlos",
    "Belo Horizonte",
    "Rio de Janeiro",
    "Brasília",
    "Recife",
    "Fortaleza",
    "Salvador",
    "Curitiba",
    "Porto Alegre",
    "Florianópolis",
    "Goiânia",
    "Vitória",
    "Natal",
    "Manaus",
    "Belém",
    "Santos",
    "Botucatu",
    "Bauru",
    "Niterói",
    "Juiz de Fora",
  ].map((label) => ({
    key: normalizeSearchText(label).replace(/\s+/g, "-"),
    label,
  }));

  const UNIVERSITY_OPTIONS = [
    { key: "usp", label: "USP", cities: ["São Paulo", "Ribeirão Preto", "São Carlos"] },
    { key: "unicamp", label: "UNICAMP", cities: ["Campinas"] },
    { key: "unesp", label: "UNESP", cities: ["São Paulo", "Botucatu", "Bauru"] },
    { key: "ufscar", label: "UFSCar", cities: ["São Carlos"] },
    { key: "ufmg", label: "UFMG", cities: ["Belo Horizonte"] },
    { key: "ufrj", label: "UFRJ", cities: ["Rio de Janeiro"] },
    { key: "unb", label: "UnB", cities: ["Brasília"] },
    { key: "ufpe", label: "UFPE", cities: ["Recife"] },
    { key: "ufc", label: "UFC", cities: ["Fortaleza"] },
    { key: "ufba", label: "UFBA", cities: ["Salvador"] },
    { key: "ufrgs", label: "UFRGS", cities: ["Porto Alegre"] },
    { key: "ufsc", label: "UFSC", cities: ["Florianópolis"] },
    { key: "puc-sp", label: "PUC-SP", cities: ["São Paulo"] },
    { key: "puc-rio", label: "PUC-Rio", cities: ["Rio de Janeiro"] },
    { key: "mackenzie", label: "Mackenzie", cities: ["São Paulo"] },
    { key: "insper", label: "Insper", cities: ["São Paulo"] },
  ];

  const CAMPUS_OPTIONS_BY_UNIVERSITY = {
    usp: [
      { key: "butanta", label: "Butantã", city: "São Paulo" },
      { key: "ribeirao-preto", label: "Ribeirão Preto", city: "Ribeirão Preto" },
      { key: "sao-carlos", label: "São Carlos", city: "São Carlos" },
    ],
    unicamp: [{ key: "barao-geraldo", label: "Barão Geraldo", city: "Campinas" }],
    unesp: [
      { key: "botucatu", label: "Botucatu", city: "Botucatu" },
      { key: "bauru", label: "Bauru", city: "Bauru" },
      { key: "sao-paulo", label: "São Paulo", city: "São Paulo" },
    ],
    ufscar: [{ key: "sao-carlos", label: "São Carlos", city: "São Carlos" }],
    ufmg: [{ key: "pampulha", label: "Pampulha", city: "Belo Horizonte" }],
    ufrj: [{ key: "fundao", label: "Fundao", city: "Rio de Janeiro" }],
    unb: [{ key: "darcy-ribeiro", label: "Darcy Ribeiro", city: "Brasília" }],
    ufpe: [{ key: "cidade-universitaria", label: "Cidade Universitária", city: "Recife" }],
    ufc: [{ key: "pici", label: "Pici", city: "Fortaleza" }],
    ufba: [{ key: "ondina", label: "Ondina", city: "Salvador" }],
    ufrgs: [{ key: "centro", label: "Centro", city: "Porto Alegre" }],
    ufsc: [{ key: "trindade", label: "Trindade", city: "Florianópolis" }],
    "puc-sp": [{ key: "perdizes", label: "Perdizes", city: "São Paulo" }],
    "puc-rio": [{ key: "gavea", label: "Gávea", city: "Rio de Janeiro" }],
    mackenzie: [{ key: "higienopolis", label: "Higienópolis", city: "São Paulo" }],
    insper: [{ key: "vila-olimpia", label: "Vila Olímpia", city: "São Paulo" }],
  };

  const state = {
    session: null,
    onboarding: null,
    templates: null,
    preferences: null,
    isSubmitting: false,
    selectedCity: "",
  };

  function redirectTo(page) {
    window.location.replace(page);
  }

  function setFeedback(message, type = "") {
    if (!feedbackElement) {
      return;
    }

    feedbackElement.textContent = message;
    feedbackElement.dataset.state = type;
  }

  function setLoading(isLoading, busyLabel) {
    state.isSubmitting = isLoading;

    if (stepSubmitButton) {
      const idleLabel = String(stepSubmitButton.dataset.idleLabel || stepSubmitButton.textContent || "").trim();
      if (!stepSubmitButton.dataset.idleLabel) {
        stepSubmitButton.dataset.idleLabel = idleLabel;
      }

      stepSubmitButton.disabled = isLoading;
      stepSubmitButton.textContent = isLoading ? busyLabel : stepSubmitButton.dataset.idleLabel;
    }

    if (stepBackButton) {
      stepBackButton.disabled = isLoading;
    }
  }

  function normalizeStep(value) {
    const nextStep = Number(value || 1);
    return Number.isInteger(nextStep) ? Math.max(1, Math.min(3, nextStep)) : 1;
  }

  function getStepPage(stepNumber) {
    return STEP_PAGES[normalizeStep(stepNumber)] || STEP_PAGES[1];
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function formatDuration(minutes) {
    const safeMinutes = Number(minutes || 0);
    const hours = Math.floor(safeMinutes / 60);
    const remaining = safeMinutes % 60;

    if (!hours) {
      return `${safeMinutes} min`;
    }

    if (!remaining) {
      return `${hours}h`;
    }

    return `${hours}h ${remaining}min`;
  }

  function parseCourseContext(value) {
    const context = { customCourse: "", city: "", university: "", campus: "", shift: "", note: "" };
    const cleanValue = String(value || "").trim();

    if (!cleanValue) {
      return context;
    }

    cleanValue.split("|").map((chunk) => chunk.trim()).forEach((chunk) => {
      const [rawLabel, ...rest] = chunk.split(":");
      const label = normalizeSearchText(rawLabel);
      const nextValue = rest.join(":").trim();

      if (!nextValue) {
        return;
      }

      if (label === "curso") {
        context.customCourse = nextValue;
      } else if (label === "cidade") {
        context.city = nextValue;
      } else if (label === "universidade") {
        context.university = nextValue;
      } else if (label === "campus") {
        context.campus = nextValue;
      } else if (label === "turno") {
        context.shift = nextValue;
      } else if (label === "obs") {
        context.note = nextValue;
      }
    });

    return context;
  }

  function buildCourseContextValue(context) {
    return [
      ["Cidade", context.city],
      ["Universidade", context.university],
      ["Campus", context.campus],
      ["Turno", context.shift],
    ]
      .filter(([, value]) => String(value || "").trim())
      .map(([label, value]) => `${label}: ${String(value).trim()}`)
      .join(" | ");
  }

  function fillSelect(select, items, options = {}) {
    if (!select) {
      return;
    }

    const placeholderLabel = options.placeholderLabel || "Selecione";
    const includeEmpty = options.includeEmpty !== false;
    const getValue = options.getValue || ((item) => item.key);
    const getLabel = options.getLabel || ((item) => item.label);
    const selectedValue = String(options.selectedValue || "");
    const parts = [];

    if (includeEmpty) {
      parts.push(`<option value="">${escapeHtml(placeholderLabel)}</option>`);
    }

    parts.push(
      ...items.map((item) => {
        const value = String(getValue(item) || "");
        const label = String(getLabel(item) || "");
        const selected = value === selectedValue ? " selected" : "";
        return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
      })
    );

    select.innerHTML = parts.join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeSelector(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value || ""));
    }

    return String(value || "").replace(/["\\]/g, "\\$&");
  }

  function resolveShiftKey(rawValue) {
    const normalizedValue = normalizeSearchText(rawValue);
    return SHIFT_OPTIONS.find((entry) => entry.key === normalizedValue || normalizeSearchText(entry.label) === normalizedValue)?.key || "";
  }

  function resolveCityOption(rawValue) {
    const normalizedValue = normalizeSearchText(rawValue);
    return CITY_OPTIONS.find((option) => normalizeSearchText(option.label) === normalizedValue) || null;
  }

  function getFilteredCityOptions(rawQuery) {
    const normalizedQuery = normalizeSearchText(rawQuery);
    const matches = CITY_OPTIONS.filter((option) => {
      return !normalizedQuery || normalizeSearchText(option.label).includes(normalizedQuery);
    });

    return matches
      .sort((left, right) => {
        if (!normalizedQuery) {
          return left.label.localeCompare(right.label, "pt-BR");
        }

        const leftStarts = normalizeSearchText(left.label).startsWith(normalizedQuery);
        const rightStarts = normalizeSearchText(right.label).startsWith(normalizedQuery);

        if (leftStarts !== rightStarts) {
          return leftStarts ? -1 : 1;
        }

        return left.label.localeCompare(right.label, "pt-BR");
      })
      .slice(0, 8);
  }

  function getUniversityEntry(universityKey) {
    return UNIVERSITY_OPTIONS.find((entry) => entry.key === universityKey) || null;
  }

  function resolveUniversityKey(rawLabel) {
    const normalizedValue = normalizeSearchText(rawLabel);
    return UNIVERSITY_OPTIONS.find((entry) => normalizeSearchText(entry.label) === normalizedValue)?.key || "";
  }

  function resolveCampusKey(universityKey, rawLabel) {
    const normalizedValue = normalizeSearchText(rawLabel);
    return (CAMPUS_OPTIONS_BY_UNIVERSITY[universityKey] || []).find(
      (entry) => normalizeSearchText(entry.label) === normalizedValue
    )?.key || "";
  }

  function getCampusEntry(universityKey, campusKey) {
    return (CAMPUS_OPTIONS_BY_UNIVERSITY[universityKey] || []).find((entry) => entry.key === campusKey) || null;
  }

  async function loadBootstrap() {
    const [onboardingResponse, templatesResponse, preferencesResponse] = await Promise.all([
      window.Start5Auth.apiRequest("/api/onboarding/status"),
      window.Start5Auth.apiRequest("/api/routine/templates"),
      window.Start5Auth.apiRequest("/api/routine/preferences"),
    ]);

    state.onboarding = onboardingResponse?.onboarding || null;
    state.templates = templatesResponse?.templates || null;
    state.preferences = preferencesResponse?.preferences || null;
  }

  function renderSharedFrame() {
    if (accountName) {
      accountName.textContent = state.session?.name || "Conta Start 5";
    }

    if (accountEmail) {
      accountEmail.textContent = state.session?.email || "";
    }

    if (progressLabel) {
      progressLabel.textContent = `Etapa ${currentStep} de 3`;
    }

    progressSteps.forEach((element) => {
      const step = Number(element.dataset.onboardingProgressStep || 0);
      element.classList.toggle("is-active", step === currentStep);
      element.classList.toggle("is-done", step < currentStep);
    });
  }

  function getCourseEntry(courseKey) {
    return (state.templates?.courses || []).find((entry) => entry.key === courseKey) || null;
  }

  function getExamEntry(examKey) {
    return (state.templates?.exams || []).find((entry) => entry.key === examKey) || null;
  }

  function collectStepOnePayload(elements) {
    const selectedUniversity = getUniversityEntry(String(elements.universitySelect?.value || ""));
    const selectedCampus = getCampusEntry(
      String(elements.universitySelect?.value || ""),
      String(elements.campusSelect?.value || "")
    );
    const selectedShiftLabel = SHIFT_OPTIONS.find(
      (entry) => entry.key === String(elements.shiftSelect?.value || "")
    )?.label || "";

    return {
      courseKey: String(elements.courseSelect?.value || "").trim(),
      admissionCategoryKey: String(elements.admissionSelect?.value || "").trim(),
      weeklyGoalMinutes: Number(elements.weeklyGoalSelect?.value || 0),
      primaryExamKey: String(elements.primaryExamSelect?.value || "").trim(),
      secondaryExamKey: String(elements.secondaryExamSelect?.value || "").trim(),
      courseTrackKey: String(elements.trackSelect?.value || "geral").trim() || "geral",
      courseName: buildCourseContextValue({
        city: state.selectedCity,
        university: selectedUniversity?.label || "",
        campus: selectedCampus?.label || "",
        shift: selectedShiftLabel,
      }),
    };
  }

  function validateStepOnePayload(payload) {
    const context = parseCourseContext(payload.courseName);

    if (!payload.courseKey || payload.courseKey === "outro") {
      return "Escolha um curso valido para continuar.";
    }

    if (!payload.admissionCategoryKey) {
      return "Escolha a categoria de ingresso para continuar.";
    }

    if (!payload.primaryExamKey) {
      return "Escolha o vestibular principal para continuar.";
    }

    if (!String(context.city || "").trim()) {
      return "Escolha uma cidade valida da lista para continuar.";
    }

    if (Number(payload.weeklyGoalMinutes || 0) < 60) {
      return "Defina uma meta semanal de pelo menos 60 minutos.";
    }

    return "";
  }

  function initStepOne() {
    const courseSelect = document.getElementById("onboardingCourseSelect");
    const admissionSelect = document.getElementById("onboardingAdmissionSelect");
    const weeklyGoalSelect = document.getElementById("onboardingWeeklyGoalSelect");
    const primaryExamSelect = document.getElementById("onboardingPrimaryExamSelect");
    const secondaryExamSelect = document.getElementById("onboardingSecondaryExamSelect");
    const cityCombobox = document.getElementById("onboardingCityCombobox");
    const citySearchInput = document.getElementById("onboardingCitySearchInput");
    const cityOptionsPanel = document.getElementById("onboardingCityOptions");
    const cityHint = document.getElementById("onboardingCityHint");
    const universitySelect = document.getElementById("onboardingUniversitySelect");
    const campusSelect = document.getElementById("onboardingCampusSelect");
    const shiftSelect = document.getElementById("onboardingShiftSelect");
    const trackSelect = document.getElementById("onboardingTrackSelect");
    const form = document.getElementById("onboardingStepOneForm");
    const context = parseCourseContext(state.preferences?.courseName);
    const savedCityOption = resolveCityOption(context.city);

    state.selectedCity = savedCityOption?.label || "";

    fillSelect(
      courseSelect,
      (state.templates?.courses || []).filter((entry) => entry.key !== "outro"),
      {
        selectedValue: state.preferences?.courseKey || "",
        placeholderLabel: "Escolha o curso",
      }
    );
    fillSelect(admissionSelect, state.templates?.admissionCategories || [], {
      selectedValue: state.preferences?.admissionCategoryKey || "",
      placeholderLabel: "Escolha a categoria",
    });
    fillSelect(weeklyGoalSelect, WEEKLY_GOAL_OPTIONS, {
      selectedValue: String(state.preferences?.weeklyGoalMinutes || 300),
      placeholderLabel: "Escolha a meta",
    });
    fillSelect(primaryExamSelect, state.templates?.exams || [], {
      selectedValue: state.preferences?.primaryExamKey || "",
      placeholderLabel: "Escolha o vestibular",
    });
    fillSelect(
      secondaryExamSelect,
      [{ key: "", label: "Sem vestibular secundario" }, ...(state.templates?.exams || [])],
      {
        includeEmpty: false,
        selectedValue: state.preferences?.secondaryExamKey || "",
      }
    );
    fillSelect(trackSelect, state.templates?.courseTracks || [], {
      selectedValue: state.preferences?.courseTrackKey || "geral",
      placeholderLabel: "Escolha o perfil",
    });
    fillSelect(shiftSelect, SHIFT_OPTIONS, {
      includeEmpty: false,
      selectedValue: resolveShiftKey(context.shift),
    });

    if (citySearchInput) {
      citySearchInput.value = state.selectedCity || "";
    }

    function syncCityHint() {
      if (!cityHint) {
        return;
      }

      cityHint.textContent = state.selectedCity
        ? `Cidade selecionada: ${state.selectedCity}`
        : "Digite apenas para filtrar e escolha uma cidade valida da lista.";
      cityHint.dataset.state = state.selectedCity ? "selected" : "";
    }

    function openCityOptions(shouldOpen) {
      if (!cityOptionsPanel || !citySearchInput) {
        return;
      }

      cityOptionsPanel.hidden = !shouldOpen;
      citySearchInput.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
      cityCombobox?.classList.toggle("is-open", shouldOpen);
    }

    function renderCityOptions(rawQuery) {
      if (!cityOptionsPanel) {
        return;
      }

      const matches = getFilteredCityOptions(rawQuery);

      if (!matches.length) {
        cityOptionsPanel.innerHTML = '<div class="onboarding-options-empty">Nenhuma cidade encontrada com esse filtro.</div>';
        openCityOptions(true);
        return;
      }

      cityOptionsPanel.innerHTML = matches.map((option) => {
        const selected = state.selectedCity === option.label ? " is-selected" : "";
        return `
          <button
            type="button"
            class="onboarding-option${selected}"
            data-city-option="${escapeHtml(option.key)}"
            role="option"
            aria-selected="${state.selectedCity === option.label ? "true" : "false"}"
          >
            ${escapeHtml(option.label)}
          </button>
        `;
      }).join("");

      openCityOptions(true);
    }

    function commitCitySelection(rawValue) {
      const option = resolveCityOption(rawValue);

      if (!option) {
        state.selectedCity = "";
        return false;
      }

      state.selectedCity = option.label;

      if (citySearchInput) {
        citySearchInput.value = option.label;
      }

      return true;
    }

    function getFilteredUniversityOptions() {
      if (!state.selectedCity) {
        return UNIVERSITY_OPTIONS;
      }

      return UNIVERSITY_OPTIONS.filter((entry) => entry.cities.includes(state.selectedCity));
    }

    function syncCampusOptions(preferredCampusKey = "") {
      const universityKey = String(universitySelect?.value || "");
      const campusOptions = (CAMPUS_OPTIONS_BY_UNIVERSITY[universityKey] || []).filter((entry) => {
        return !state.selectedCity || entry.city === state.selectedCity;
      });
      const nextCampusKey = campusOptions.some((entry) => entry.key === preferredCampusKey)
        ? preferredCampusKey
        : "";

      fillSelect(campusSelect, campusOptions, {
        selectedValue: nextCampusKey,
        placeholderLabel: universityKey ? "Sem campus definido" : "Escolha primeiro a universidade",
      });

      if (campusSelect) {
        campusSelect.disabled = !universityKey;
      }
    }

    function syncUniversityOptions(preferredUniversityKey = "", preferredCampusKey = "") {
      const universityOptions = getFilteredUniversityOptions();
      const nextUniversityKey = universityOptions.some((entry) => entry.key === preferredUniversityKey)
        ? preferredUniversityKey
        : "";

      fillSelect(universitySelect, universityOptions, {
        selectedValue: nextUniversityKey,
        placeholderLabel: "Sem universidade definida",
      });
      syncCampusOptions(preferredCampusKey);
    }

    syncCityHint();
    renderCityOptions(state.selectedCity);
    openCityOptions(false);
    syncUniversityOptions(
      resolveUniversityKey(context.university),
      resolveCampusKey(resolveUniversityKey(context.university), context.campus)
    );

    courseSelect?.addEventListener("change", () => {
      const selectedCourse = getCourseEntry(courseSelect.value);

      if (selectedCourse?.recommendedTrackKey && trackSelect && (!trackSelect.value || trackSelect.value === "geral")) {
        trackSelect.value = selectedCourse.recommendedTrackKey;
      }
    });

    cityOptionsPanel?.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    cityOptionsPanel?.addEventListener("click", (event) => {
      const optionButton = event.target.closest("[data-city-option]");

      if (!optionButton) {
        return;
      }

      const selectedOption = CITY_OPTIONS.find((entry) => entry.key === optionButton.dataset.cityOption);

      if (!selectedOption) {
        return;
      }

      state.selectedCity = selectedOption.label;

      if (citySearchInput) {
        citySearchInput.value = selectedOption.label;
      }

      syncCityHint();
      renderCityOptions(selectedOption.label);
      syncUniversityOptions("", "");
      openCityOptions(false);
    });

    citySearchInput?.addEventListener("focus", () => {
      renderCityOptions(citySearchInput.value);
    });

    citySearchInput?.addEventListener("click", () => {
      renderCityOptions(citySearchInput.value);
    });

    citySearchInput?.addEventListener("input", () => {
      const exactMatchSelected = commitCitySelection(citySearchInput.value);

      if (!exactMatchSelected) {
        state.selectedCity = "";
      }

      syncCityHint();
      renderCityOptions(citySearchInput.value);
      syncUniversityOptions(
        exactMatchSelected ? String(universitySelect?.value || "") : "",
        exactMatchSelected ? String(campusSelect?.value || "") : ""
      );
    });

    citySearchInput?.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        openCityOptions(false);
        return;
      }

      if (event.key !== "Enter") {
        return;
      }

      const matches = getFilteredCityOptions(citySearchInput.value);

      if (!matches.length) {
        return;
      }

      event.preventDefault();
      state.selectedCity = matches[0].label;
      citySearchInput.value = matches[0].label;
      syncCityHint();
      renderCityOptions(matches[0].label);
      syncUniversityOptions("", "");
      openCityOptions(false);
    });

    citySearchInput?.addEventListener("blur", () => {
      window.setTimeout(() => {
        commitCitySelection(citySearchInput.value);
        syncCityHint();
        openCityOptions(false);
      }, 120);
    });

    document.addEventListener("click", (event) => {
      const target = event.target;
      const isInsideCityField = target instanceof Element && target.closest(".onboarding-combobox");

      if (!isInsideCityField) {
        openCityOptions(false);
      }
    });

    universitySelect?.addEventListener("change", () => {
      syncCampusOptions();
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (citySearchInput && !state.selectedCity) {
        commitCitySelection(citySearchInput.value);
      }

      const payload = collectStepOnePayload({
        courseSelect,
        admissionSelect,
        weeklyGoalSelect,
        primaryExamSelect,
        secondaryExamSelect,
        universitySelect,
        campusSelect,
        shiftSelect,
        trackSelect,
      });
      const validationMessage = validateStepOnePayload(payload);

      if (validationMessage) {
        setFeedback(validationMessage, "error");
        return;
      }

      setLoading(true, "Salvando...");
      setFeedback("Guardando sua base academica...", "loading");

      try {
        const response = await window.Start5Auth.apiRequest("/api/onboarding/step-1", {
          method: "PATCH",
          body: payload,
        });

        state.preferences = response?.preferences || state.preferences;
        state.onboarding = response?.onboarding || state.onboarding;
        redirectTo(state.onboarding?.page || getStepPage(2));
      } catch (error) {
        setFeedback(error.message || "Nao foi possivel salvar essa etapa agora.", "error");
        setLoading(false, "Salvando...");
      }
    });
  }

  function initStepTwo() {
    const grid = document.getElementById("onboardingDaysGrid");
    const form = document.getElementById("onboardingStepTwoForm");
    const labels = Array.isArray(state.templates?.weekdayLabels) ? state.templates.weekdayLabels : [];
    const activeDays = new Set(Array.isArray(state.preferences?.studyDays) ? state.preferences.studyDays : []);
    const weekdayMinutes = { ...(state.preferences?.weekdayMinutes || {}) };

    if (!grid) {
      return;
    }

    grid.innerHTML = labels.map((label, index) => {
      const day = index;
      const isActive = activeDays.has(day);
      const checked = isActive ? " checked" : "";
      const minutes = Number(weekdayMinutes[String(day)] || 60);
      const minuteOptions = DAY_MINUTE_OPTIONS.map((option) => {
        const selected = Number(option.key) === minutes ? " selected" : "";
        return `<option value="${escapeHtml(option.key)}"${selected}>${escapeHtml(option.label)}</option>`;
      }).join("");

      return `
        <label class="onboarding-day-card ${isActive ? "" : "is-inactive"}" data-onboarding-day-card="${day}">
          <div class="onboarding-day-head">
            <span class="onboarding-day-toggle">
              <input type="checkbox" data-onboarding-day-toggle="${day}"${checked} />
              <span>${escapeHtml(label)}</span>
            </span>
            <span class="onboarding-day-meta">${isActive ? "Ativo" : "Opcional"}</span>
          </div>
          <select class="onboarding-select" data-onboarding-day-minutes="${day}"${isActive ? "" : " disabled"}>
            ${minuteOptions}
          </select>
        </label>
      `;
    }).join("");

    function syncDayCard(day) {
      const toggle = grid.querySelector(`[data-onboarding-day-toggle="${day}"]`);
      const select = grid.querySelector(`[data-onboarding-day-minutes="${day}"]`);
      const card = grid.querySelector(`[data-onboarding-day-card="${day}"]`);
      const meta = card?.querySelector(".onboarding-day-meta");
      const enabled = Boolean(toggle?.checked);

      if (select) {
        select.disabled = !enabled;
      }

      card?.classList.toggle("is-inactive", !enabled);

      if (meta) {
        meta.textContent = enabled ? "Ativo" : "Opcional";
      }
    }

    [...grid.querySelectorAll("[data-onboarding-day-toggle]")].forEach((toggle) => {
      toggle.addEventListener("change", () => {
        syncDayCard(toggle.dataset.onboardingDayToggle);
      });
    });

    stepBackButton?.addEventListener("click", () => {
      redirectTo(getStepPage(1));
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const studyDays = [...grid.querySelectorAll("[data-onboarding-day-toggle]")]
        .filter((input) => input.checked)
        .map((input) => Number(input.dataset.onboardingDayToggle || 0))
        .filter((value) => Number.isInteger(value) && value >= 0);
      const nextWeekdayMinutes = {};

      [...grid.querySelectorAll("[data-onboarding-day-minutes]")].forEach((select) => {
        const day = String(select.dataset.onboardingDayMinutes || "");
        nextWeekdayMinutes[day] = Number(select.value || 0);
      });

      if (!studyDays.length) {
        setFeedback("Selecione pelo menos um dia de estudo para continuar.", "error");
        return;
      }

      if (studyDays.some((day) => Number(nextWeekdayMinutes[String(day)] || 0) < 30)) {
        setFeedback("Cada dia ativo precisa ter pelo menos 30 minutos.", "error");
        return;
      }

      setLoading(true, "Salvando...");
      setFeedback("Ajustando sua disponibilidade real da semana...", "loading");

      try {
        const response = await window.Start5Auth.apiRequest("/api/onboarding/step-2", {
          method: "PATCH",
          body: {
            studyDays,
            weekdayMinutes: nextWeekdayMinutes,
          },
        });

        state.preferences = response?.preferences || state.preferences;
        state.onboarding = response?.onboarding || state.onboarding;
        redirectTo(state.onboarding?.page || getStepPage(3));
      } catch (error) {
        setFeedback(error.message || "Nao foi possivel salvar os dias agora.", "error");
        setLoading(false, "Salvando...");
      }
    });
  }

  function getRecommendedSubjectKeys() {
    const course = getCourseEntry(state.preferences?.courseKey || "");
    const boosts = course?.subjectBoosts || {};

    return Object.entries(boosts)
      .sort((left, right) => Number(right[1] || 0) - Number(left[1] || 0))
      .slice(0, 3)
      .map(([subjectKey]) => subjectKey);
  }

  function buildPriorityEntries() {
    const savedPreferences = Array.isArray(state.preferences?.subjectPreferences)
      ? state.preferences.subjectPreferences
      : [];
    const savedLookup = new Map(
      savedPreferences
        .filter((entry) => entry.subjectKey !== "outras")
        .map((entry) => [entry.subjectKey, entry])
    );

    return (state.templates?.subjects || [])
      .filter((subject) => subject.key !== "outras")
      .map((subject) => {
        const savedEntry = savedLookup.get(subject.key) || null;

        return {
          subjectKey: subject.key,
          label: subject.label,
          manualDelta: Number(savedEntry?.manualDelta || 0),
          difficultyLevel: String(savedEntry?.difficultyLevel || "normal"),
          recommended: false,
        };
      });
  }

  function renderStepThreeSummary() {
    const summaryGrid = document.getElementById("onboardingSummaryGrid");
    const course = getCourseEntry(state.preferences?.courseKey || "");
    const exam = getExamEntry(state.preferences?.primaryExamKey || "");
    const context = parseCourseContext(state.preferences?.courseName);

    if (!summaryGrid) {
      return;
    }

    const items = [
      { label: "Objetivo", value: course?.label || "Curso nao definido" },
      { label: "Vestibular", value: exam?.label || "Vestibular nao definido" },
      { label: "Cidade", value: context.city || "Cidade nao definida" },
      { label: "Meta semanal", value: `${formatDuration(Number(state.preferences?.weeklyGoalMinutes || 0))} por semana` },
    ];

    summaryGrid.innerHTML = items.map((item) => `
      <article class="onboarding-summary-card">
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.value)}</span>
      </article>
    `).join("");
  }

  function renderPriorityRows() {
    const list = document.getElementById("onboardingPriorityList");
    const recommendedKeys = new Set(getRecommendedSubjectKeys());

    if (!list) {
      return;
    }

    const entries = buildPriorityEntries().map((entry) => ({
      ...entry,
      recommended: recommendedKeys.has(entry.subjectKey),
    }));

    if (!entries.length) {
      list.innerHTML = '<div class="onboarding-empty">Nenhuma materia disponivel para ajustar agora.</div>';
      return;
    }

    list.innerHTML = entries.map((entry) => {
      const safeKey = escapeHtml(entry.subjectKey);
      const deltaOptions = (state.templates?.manualDeltas || [-2, -1, 0, 1, 2, 3, 4, 5]).map((value) => {
        const safeValue = String(value);
        const selected = Number(entry.manualDelta) === Number(value) ? " selected" : "";
        return `<option value="${safeValue}"${selected}>${escapeHtml(MANUAL_DELTA_LABELS[safeValue] || safeValue)}</option>`;
      }).join("");
      const difficultyOptions = Object.entries(DIFFICULTY_LABELS).map(([value, label]) => {
        const selected = entry.difficultyLevel === value ? " selected" : "";
        return `<option value="${value}"${selected}>${escapeHtml(label)}</option>`;
      }).join("");

      return `
        <article class="onboarding-priority-row ${entry.recommended ? "is-recommended" : ""}" data-priority-key="${safeKey}">
          <div class="onboarding-priority-copy">
            <strong>${escapeHtml(entry.label)}</strong>
            <span>${entry.recommended ? "Recomendada pelo seu objetivo atual." : "Ajuste fino opcional para a base da sua semana."}</span>
            ${entry.recommended ? '<span class="onboarding-pill">Sugerida</span>' : ""}
          </div>
          <label class="onboarding-field">
            <span class="onboarding-label">Peso manual</span>
            <select class="onboarding-select" data-priority-manual-delta="${safeKey}">
              ${deltaOptions}
            </select>
          </label>
          <label class="onboarding-field">
            <span class="onboarding-label">Tratamento</span>
            <select class="onboarding-select" data-priority-difficulty="${safeKey}">
              ${difficultyOptions}
            </select>
          </label>
        </article>
      `;
    }).join("");
  }

  function collectStepThreePayload() {
    const list = document.getElementById("onboardingPriorityList");
    const subjectPreferences = [];

    if (!list) {
      return { subjectPreferences };
    }

    [...list.querySelectorAll("[data-priority-key]")].forEach((row) => {
      const subjectKey = String(row.dataset.priorityKey || "");
      const safeSelectorKey = escapeSelector(subjectKey);
      const manualDelta = Number(
        row.querySelector(`[data-priority-manual-delta="${safeSelectorKey}"]`)?.value || 0
      );
      const difficultyLevel = String(
        row.querySelector(`[data-priority-difficulty="${safeSelectorKey}"]`)?.value || "normal"
      );

      if (manualDelta === 0 && difficultyLevel === "normal") {
        return;
      }

      subjectPreferences.push({
        subjectKey,
        manualDelta,
        difficultyLevel,
      });
    });

    return { subjectPreferences };
  }

  function initStepThree() {
    const form = document.getElementById("onboardingStepThreeForm");

    renderStepThreeSummary();
    renderPriorityRows();

    stepBackButton?.addEventListener("click", () => {
      redirectTo(getStepPage(2));
    });

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const payload = collectStepThreePayload();

      setLoading(true, "Finalizando...");
      setFeedback("Fechando sua base inicial e gerando a primeira leitura da semana...", "loading");

      try {
        const response = await window.Start5Auth.apiRequest("/api/onboarding/complete", {
          method: "POST",
          body: payload,
        });

        state.preferences = response?.preferences || state.preferences;
        state.onboarding = response?.onboarding || state.onboarding;
        redirectTo(String(response?.redirectTo || "index.html"));
      } catch (error) {
        setFeedback(error.message || "Nao foi possivel finalizar o onboarding agora.", "error");
        setLoading(false, "Finalizando...");
      }
    });
  }

  async function initialize() {
    await window.Start5Auth.ready;
    state.session = window.Start5Auth.getSession();

    if (!state.session) {
      return;
    }

    await loadBootstrap();

    if (!state.onboarding?.required) {
      redirectTo("index.html");
      return;
    }

    const expectedPage = getStepPage(state.onboarding.currentStep || currentStep);

    if (expectedPage !== getStepPage(currentStep)) {
      redirectTo(expectedPage);
      return;
    }

    renderSharedFrame();

    if (currentStep === 1) {
      initStepOne();
      return;
    }

    if (currentStep === 2) {
      initStepTwo();
      return;
    }

    initStepThree();
  }

  initialize().catch((error) => {
    console.error("Erro ao carregar onboarding:", error);
    setFeedback(error.message || "Nao foi possivel carregar essa etapa agora.", "error");
  });
})();
