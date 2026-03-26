const rawPage = window.location.pathname.split("/").pop().toLowerCase();
const currentPage = rawPage || "login.html";
const protectedPages = new Set([
  "index.html",
  "dashboard.html",
  "admin.html",
  "profile.html",
  "questoes.html",
  "redacao.html",
  "rotina.html",
  "onboarding-curso.html",
  "onboarding-semana.html",
  "onboarding-prioridades.html",
]);
const adminPages = new Set(["admin.html"]);
const onboardingPages = new Set([
  "onboarding-curso.html",
  "onboarding-semana.html",
  "onboarding-prioridades.html",
]);
const isLoginPage = currentPage === "login.html";
const MONTHLY_MEDAL_LEVELS = [
  { key: "gold", minMinutes: 600 },
  { key: "silver", minMinutes: 300 },
  { key: "bronze", minMinutes: 150 },
];
const DEFAULT_AVATAR_URL = "/images/foto-inicial-de-perfil.jpg";
const DEFAULT_AVATAR_FALLBACK_URL = "/images/default-avatar.svg";

let currentSession = null;
let authRedirecting = false;

function canAccessAdmin(session = currentSession) {
  return Boolean(session?.permissions?.canAccessAdmin || session?.role === "admin");
}

function canManageAdmins(session = currentSession) {
  return Boolean(session?.permissions?.canManageAdmins || session?.adminCanManageAdmins);
}

function isPrimaryAdmin(session = currentSession) {
  return Boolean(session?.permissions?.isPrimaryAdmin || session?.isPrimaryAdmin);
}

function getServerAccessHint() {
  return "Execute node server.js e abra http://localhost:3000/login.html no navegador.";
}

function redirectTo(page) {
  window.location.replace(page);
}

function getDefaultPage() {
  return "index.html";
}

function normalizeOnboardingStep(value) {
  const nextStep = Number(value || 1);

  if (!Number.isInteger(nextStep)) {
    return 1;
  }

  return Math.max(1, Math.min(3, nextStep));
}

function getOnboardingPage(stepNumber) {
  const safeStep = normalizeOnboardingStep(stepNumber);

  if (safeStep === 2) {
    return "onboarding-semana.html";
  }

  if (safeStep === 3) {
    return "onboarding-prioridades.html";
  }

  return "onboarding-curso.html";
}

async function getOnboardingStatus() {
  try {
    const response = await apiRequest("/api/onboarding/status");
    const onboarding = response?.onboarding || null;

    if (!onboarding) {
      return {
        required: false,
        completed: true,
        currentStep: 3,
        page: getDefaultPage(),
      };
    }

    return {
      required: Boolean(onboarding.required),
      completed: Boolean(onboarding.completed),
      currentStep: normalizeOnboardingStep(onboarding.currentStep || 1),
      page: String(onboarding.page || "") || getOnboardingPage(onboarding.currentStep),
    };
  } catch (error) {
    if (error.status === 401) {
      return null;
    }

    return {
      required: false,
      completed: true,
      currentStep: 3,
      page: getDefaultPage(),
    };
  }
}

async function getPostAuthPage() {
  const fallbackPage = getDefaultPage();
  const onboarding = await getOnboardingStatus();

  if (!onboarding) {
    return fallbackPage;
  }

  if (onboarding.required) {
    return onboarding.page || getOnboardingPage(onboarding.currentStep);
  }

  return fallbackPage;
}

function setAuthReady() {
  document.body?.classList.add("auth-ready");
}

function updateAdminVisibility() {
  const isAdmin = canAccessAdmin(currentSession);
  const isAdminManager = canManageAdmins(currentSession);
  const isPrimary = isPrimaryAdmin(currentSession);

  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = !isAdmin;
  });

  document.querySelectorAll("[data-admin-manager-only]").forEach((element) => {
    element.hidden = !isAdminManager;
  });

  document.querySelectorAll("[data-admin-primary-only]").forEach((element) => {
    element.hidden = !isPrimary;
  });
}

function roundOne(value) {
  return Math.round((Number(value) || 0) * 10) / 10;
}

function formatMinutesLabel(value) {
  const safeValue = roundOne(value);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(safeValue);
}

function getSessionDate(session) {
  const startedAt = new Date(session?.startedAt || "");

  if (!Number.isNaN(startedAt.getTime())) {
    return startedAt;
  }

  const rawDate = String(session?.dateKey || session?.date || "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawDate);

  if (!match) {
    return null;
  }

  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

function getCurrentMonthMinutes(sessions = []) {
  const now = new Date();

  return roundOne(
    sessions.reduce((total, session) => {
      const date = getSessionDate(session);

      if (!date) {
        return total;
      }

      if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) {
        return total;
      }

      return total + (Number(session.minutes) || 0);
    }, 0)
  );
}

function getMonthlyMedal(minutes) {
  const safeMinutes = roundOne(minutes);

  return MONTHLY_MEDAL_LEVELS.find((level) => safeMinutes >= level.minMinutes)?.key || "none";
}

function setHeaderMonthlyMinutes(minutes = 0) {
  const safeMinutes = roundOne(minutes);
  const medal = getMonthlyMedal(safeMinutes);
  const label = `${formatMinutesLabel(safeMinutes)} min no m\u00eas`;

  document.querySelectorAll("[data-auth-month-minutes]").forEach((element) => {
    element.textContent = label;
  });

  document.querySelectorAll("[data-auth-avatar]").forEach((element) => {
    element.dataset.authMedal = medal;
  });

  document.querySelectorAll("[data-auth-initials]").forEach((element) => {
    element.dataset.authMedal = medal;
  });
}

function getSessionDisplayName(session = currentSession) {
  if (!session) return "";

  const fullName = String(session.name || "").trim();

  if (fullName) {
    return fullName;
  }

  return [session.firstName, session.lastName].filter(Boolean).join(" ").trim();
}

function getSessionInitials(session = currentSession) {
  const label = getSessionDisplayName(session);

  if (!label) {
    return "U";
  }

  const parts = label.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

function getSessionAvatarDataUrl(session = currentSession) {
  return String(session?.avatarDataUrl || "").trim();
}

function getResolvedSessionAvatarUrl(session = currentSession) {
  const avatarDataUrl = getSessionAvatarDataUrl(session);
  return avatarDataUrl || DEFAULT_AVATAR_URL;
}

function hydrateUserLabels() {
  if (!currentSession) return;

  document.querySelectorAll("[data-auth-name]").forEach((element) => {
    element.textContent = getSessionDisplayName(currentSession);
  });

  document.querySelectorAll("[data-auth-email]").forEach((element) => {
    element.textContent = currentSession.email;
  });

  document.querySelectorAll("[data-auth-initials]").forEach((element) => {
    element.textContent = getSessionInitials(currentSession);
  });

  document.querySelectorAll("[data-auth-avatar]").forEach((element) => {
    const image = element.querySelector("[data-auth-avatar-image]");
    const fallback = element.querySelector("[data-auth-initials]");
    const avatarUrl = getResolvedSessionAvatarUrl(currentSession);

    element.classList.add("has-image");

    if (image) {
      image.hidden = false;
      image.src = avatarUrl;
      image.onerror = () => {
        if (image.src.endsWith(DEFAULT_AVATAR_FALLBACK_URL)) {
          return;
        }

        image.src = image.src.endsWith(DEFAULT_AVATAR_URL)
          ? DEFAULT_AVATAR_FALLBACK_URL
          : DEFAULT_AVATAR_URL;
      };
    }

    if (fallback) {
      fallback.hidden = true;
    }
  });

  setHeaderMonthlyMinutes(0);
}

async function refreshHeaderMonthlyProgress() {
  if (!currentSession) {
    return;
  }

  try {
    const response = await apiRequest("/api/sessions");
    const sessions = Array.isArray(response?.sessions) ? response.sessions : [];
    setHeaderMonthlyMinutes(getCurrentMonthMinutes(sessions));
  } catch (error) {
    console.error("Erro ao atualizar progresso mensal do topo:", error);
  }
}

function bindLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      await logout();
    });
  });
}

function isLikelyPromptLeakMessage(message) {
  const normalizedMessage = String(message || "").trim().replace(/\s+/g, " ").slice(0, 1200);

  if (!normalizedMessage) {
    return false;
  }

  return (
    /you are amp|you are devin|you are kiro|you are cascade|you are qoder|you are notion ai|you are antigravity|you are a claude agent|you are an interactive cli tool|you are a web automation assistant|you are an expert ai programming assistant|you are an ai programming assistant|the assistant is claude|claude code version|github copilot|follow microsoft content policies|when asked for your name, you must respond with|working with a user in the vs code editor|managed by an autonomous process|lastinference|debugparamsused|amp thread url|input_schema|tools available in jsonschema|turn_answer_start|tabs_context|copilot_cache_control|workspacefolder path=|notion-flavored markdown|notion has the following main concepts|<claude_behavior>|<artifact_instructions>|<mandatory_copyright_requirements>|<critical_injection_defense>|<tooluseinstructions>|<applypatchinstructions>|<notebookinstructions>|<outputformatting>|<reminderinstructions>|<environment_info>|<workspace_info>|<userrequest>|<recently_viewed_code_snippets>|<tool calling spec>|<\|code_to_edit\|>|working directory|directory listing/i.test(
      normalizedMessage
    ) ||
    (
      normalizedMessage.length > 220 &&
      (
        /\bsystem prompt\b|\bsystem:\b|\btools:\b|\bthinking:\b|\bcache_control:\b|\bstream:\s*true\b|\bcurrent date is\b/i.test(
          normalizedMessage
        ) ||
        /"name"\s*:\s*"computer"|"name"\s*:\s*"web_search"|"name"\s*:\s*"Task"/i.test(
          normalizedMessage
        )
      )
    )
  );
}

function sanitizeApiErrorText(value, fallbackMessage) {
  const safeFallback =
    String(fallbackMessage || "Não foi possível concluir a requisição.").trim() ||
    "Não foi possível concluir a requisição.";
  const normalizedMessage = String(value || "").trim().replace(/\s+/g, " ").slice(0, 520);

  if (!normalizedMessage) {
    return safeFallback;
  }

  if (isLikelyPromptLeakMessage(normalizedMessage)) {
    return safeFallback;
  }

  return normalizedMessage.slice(0, 240);
}

function normalizeApiError(payload, fallbackMessage) {
  if (payload && typeof payload.error === "string" && payload.error.trim()) {
    return sanitizeApiErrorText(payload.error, fallbackMessage);
  }

  if (payload?.error && typeof payload.error?.message === "string" && payload.error.message.trim()) {
    return sanitizeApiErrorText(payload.error.message, fallbackMessage);
  }

  return fallbackMessage;
}

async function apiRequest(url, options = {}) {
  const nextOptions = { ...options };
  const headers = new Headers(nextOptions.headers || {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    nextOptions.body &&
    typeof nextOptions.body === "object" &&
    !(nextOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
    nextOptions.body = JSON.stringify(nextOptions.body);
  }

  let response;

  try {
    response = await fetch(url, {
      credentials: "include",
      ...nextOptions,
      headers,
    });
  } catch (error) {
    const isFileProtocol = window.location.protocol === "file:";
    const message = isFileProtocol
      ? `Abra o Start 5 pelo servidor. ${getServerAccessHint()}`
      : `N\u00e3o foi poss\u00edvel conectar ao servidor do Start 5. ${getServerAccessHint()}`;
    const networkError = new Error(message);
    networkError.cause = error;
    throw networkError;
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(
      normalizeApiError(payload, "N\u00e3o foi poss\u00edvel concluir a requisi\u00e7\u00e3o.")
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function fetchCurrentUser() {
  try {
    const response = await apiRequest("/api/auth/me");
    currentSession = response?.user || null;
  } catch (error) {
    if (error.status === 401) {
      currentSession = null;
      return null;
    }

    throw error;
  }

  return currentSession;
}

function getSession() {
  return currentSession;
}

function updateSession(nextSession) {
  currentSession = nextSession || null;
  hydrateUserLabels();
  updateAdminVisibility();
}

async function logout() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Erro ao encerrar sess\u00e3o:", error);
  }

  currentSession = null;
  redirectTo("login.html");
}

function prepareProtectedPage() {
  bindLogoutButtons();
  hydrateUserLabels();
  updateAdminVisibility();
  setAuthReady();
  refreshHeaderMonthlyProgress();
}

function setupLoginPage() {
  const authForm = document.getElementById("authForm");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authFeedback = document.getElementById("authFeedback");
  const authSubmitButton = document.getElementById("authSubmitButton");
  const authNameRow = document.getElementById("authNameRow");
  const authConfirmField = document.getElementById("authConfirmField");
  const authFirstNameInput = document.getElementById("authFirstNameInput");
  const authLastNameInput = document.getElementById("authLastNameInput");
  const authEmailInput = document.getElementById("authEmailInput");
  const authPasswordInput = document.getElementById("authPasswordInput");
  const authConfirmInput = document.getElementById("authConfirmInput");
  const switchButtons = [...document.querySelectorAll("[data-auth-view]")];

  if (!authForm || !authEmailInput || !authPasswordInput) {
    setAuthReady();
    return;
  }

  let mode = "login";

  function clearSensitiveInputs() {
    authPasswordInput.value = "";

    if (authConfirmInput) {
      authConfirmInput.value = "";
    }
  }

  function setFeedback(message, type = "") {
    if (!authFeedback) return;

    authFeedback.textContent = message;
    authFeedback.dataset.state = type;
  }

  function setLoading(isLoading) {
    authForm.querySelectorAll("input, button").forEach((element) => {
      element.disabled = isLoading;
    });

    if (!authSubmitButton) return;

    authSubmitButton.textContent = isLoading
      ? mode === "register"
        ? "Criando..."
        : "Entrando..."
      : mode === "register"
        ? "Criar conta e continuar"
        : "Entrar";
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isRegister = mode === "register";

    switchButtons.forEach((button) => {
      const isActive = button.dataset.authView === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (authNameRow) authNameRow.classList.toggle("is-hidden", !isRegister);
    if (authConfirmField) authConfirmField.classList.toggle("is-hidden", !isRegister);

    if (authFirstNameInput) {
      authFirstNameInput.required = isRegister;
      authFirstNameInput.disabled = !isRegister;
    }

    if (authLastNameInput) {
      authLastNameInput.required = isRegister;
      authLastNameInput.disabled = !isRegister;
    }

    if (authConfirmInput) {
      authConfirmInput.required = isRegister;
      authConfirmInput.disabled = !isRegister;
    }

    if (authPasswordInput) {
      authPasswordInput.autocomplete = isRegister ? "new-password" : "current-password";
    }

    if (authTitle) {
      authTitle.textContent = isRegister ? "Crie sua conta" : "Acesse sua conta";
    }

    if (authSubtitle) {
      authSubtitle.textContent = isRegister
        ? "Crie sua conta e passe pelas 3 etapas iniciais para montar sua base de estudos."
        : "Use seu e-mail e senha para entrar no Start 5.";
    }

    if (authSubmitButton) {
      authSubmitButton.textContent = isRegister ? "Criar conta e continuar" : "Entrar";
    }

    if (!isRegister) {
      if (authFirstNameInput) authFirstNameInput.value = "";
      if (authLastNameInput) authLastNameInput.value = "";
      if (authConfirmInput) authConfirmInput.value = "";
    }

    setFeedback("");
  }

  function normalizeEmail(value) {
    return value.trim().toLowerCase();
  }

  switchButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.authView || "login");
    });
  });

  if (window.location.protocol === "file:") {
    setFeedback(`Abra o Start 5 pelo servidor. ${getServerAccessHint()}`, "error");
  }

  clearSensitiveInputs();
  window.addEventListener("pageshow", clearSensitiveInputs);

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = normalizeEmail(authEmailInput.value);
    const password = authPasswordInput.value.trim();

    if (!email || !password) {
      setFeedback("Preencha e-mail e senha para continuar.", "error");
      return;
    }

    if (mode === "register") {
      const firstName = authFirstNameInput?.value.trim() || "";
      const lastName = authLastNameInput?.value.trim() || "";
      const confirmPassword = authConfirmInput?.value.trim() || "";

      if (firstName.length < 2) {
        setFeedback("Informe um nome com pelo menos 2 caracteres.", "error");
        return;
      }

      if (lastName.length < 2) {
        setFeedback("Informe um sobrenome com pelo menos 2 caracteres.", "error");
        return;
      }

      if (password.length < 6) {
        setFeedback("A senha precisa ter pelo menos 6 caracteres.", "error");
        return;
      }

      if (password !== confirmPassword) {
        setFeedback("As senhas n\u00e3o conferem.", "error");
        return;
      }
    }

    setLoading(true);
    setFeedback("");

    try {
      const response =
        mode === "register"
          ? await apiRequest("/api/auth/register", {
              method: "POST",
              body: {
                firstName: authFirstNameInput?.value.trim() || "",
                lastName: authLastNameInput?.value.trim() || "",
                email,
                password,
              },
            })
          : await apiRequest("/api/auth/login", {
              method: "POST",
              body: { email, password },
            });

      currentSession = response?.user || null;
      setFeedback(
        mode === "register"
          ? "Conta criada. Vamos montar sua base inicial..."
          : "Login feito. Redirecionando...",
        "success"
      );
      setTimeout(async () => {
        redirectTo(await getPostAuthPage());
      }, 180);
    } catch (error) {
      clearSensitiveInputs();
      setFeedback(error.message || "N\u00e3o foi poss\u00edvel concluir o acesso.", "error");
      setLoading(false);
    }
  });

  setMode("login");
  setAuthReady();
}

const ready = (async () => {
  try {
    await fetchCurrentUser();
    const nextPage = currentSession ? await getPostAuthPage() : getDefaultPage();

    if (protectedPages.has(currentPage) && !currentSession) {
      authRedirecting = true;
      redirectTo("login.html");
      return null;
    }

    if (adminPages.has(currentPage) && !canAccessAdmin(currentSession)) {
      authRedirecting = true;
      redirectTo("index.html");
      return currentSession;
    }

    if (currentSession && currentPage === "rotina.html") {
      authRedirecting = true;
      redirectTo(nextPage);
      return currentSession;
    }

    if (currentSession && onboardingPages.has(currentPage) && nextPage === getDefaultPage()) {
      authRedirecting = true;
      redirectTo(getDefaultPage());
      return currentSession;
    }

    if (currentSession && onboardingPages.has(currentPage) && currentPage !== nextPage) {
      authRedirecting = true;
      redirectTo(nextPage);
      return currentSession;
    }

    if (
      currentSession &&
      protectedPages.has(currentPage) &&
      !isLoginPage &&
      !onboardingPages.has(currentPage) &&
      nextPage !== getDefaultPage()
    ) {
      authRedirecting = true;
      redirectTo(nextPage);
      return currentSession;
    }

    if (isLoginPage && currentSession) {
      authRedirecting = true;
      redirectTo(nextPage);
      return currentSession;
    }

    if (isLoginPage) {
      setupLoginPage();
      return currentSession;
    }

    prepareProtectedPage();
    return currentSession;
  } catch (error) {
    console.error("Erro ao inicializar autentica\u00e7\u00e3o:", error);

    if (protectedPages.has(currentPage)) {
      authRedirecting = true;
      redirectTo("login.html");
      return null;
    }

    setupLoginPage();
    return null;
  }
})();

window.Start5Auth = {
  apiRequest,
  ready,
  getSession,
  logout,
  setHeaderMonthlyMinutes,
  updateSession,
  canAccessAdmin,
  canManageAdmins,
  isPrimaryAdmin,
};
