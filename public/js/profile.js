const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const profileForm = document.getElementById("profileForm");
const profileFirstNameInput = document.getElementById("profileFirstNameInput");
const profileLastNameInput = document.getElementById("profileLastNameInput");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const profileRemovePhotoButton = document.getElementById("profileRemovePhotoButton");
const profileSaveButton = document.getElementById("profileSaveButton");
const profileFeedback = document.getElementById("profileFeedback");
const profileUploadStatus = document.getElementById("profileUploadStatus");
const profileDisplayName = document.getElementById("profileDisplayName");
const profileEmail = document.getElementById("profileEmail");
const profileMonthCopy = document.getElementById("profileMonthCopy");
const profileLevelBadge = document.getElementById("profileLevelBadge");
const profileFocusBadge = document.getElementById("profileFocusBadge");
const profileAvatarShell = document.getElementById("profileAvatarShell");
const profileAvatarImage = document.getElementById("profileAvatarImage");
const profileAvatarFallback = document.getElementById("profileAvatarFallback");
const profileFocusSubjectSelect = document.getElementById("profileFocusSubjectSelect");
const profileFocusSubjectNameField = document.getElementById("profileFocusSubjectNameField");
const profileFocusSubjectNameInput = document.getElementById("profileFocusSubjectNameInput");

const PROFILE_MEDAL_LEVELS = [
  { key: "gold", minMinutes: 600, label: "Nivel atual: ouro" },
  { key: "silver", minMinutes: 300, label: "Nivel atual: prata" },
  { key: "bronze", minMinutes: 150, label: "Nivel atual: bronze" },
];
const DEFAULT_SUBJECT_KEY = "ingles";
const SUBJECT_LABELS = {
  ingles: "Ingles",
  matematica: "Matematica",
  portugues: "Portugues",
  geografia: "Geografia",
  historia: "Historia",
  biologia: "Biologia",
  fisica: "Fisica",
  quimica: "Quimica",
  redacao: "Redacao",
  filosofia: "Filosofia",
  sociologia: "Sociologia",
  outras: "Outra materia",
};

const ACCEPTED_AVATAR_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_RAW_FILE_SIZE = 6 * 1024 * 1024;
const MAX_AVATAR_DATA_URL_LENGTH = 1_500_000;

let currentProfile = null;
let currentAvatarDataUrl = "";
let draftAvatarDataUrl = null;
let currentMonthMinutes = 0;

function openMenu() {
  body.classList.add("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Fechar menu");
  }
}

function closeMenu() {
  body.classList.remove("menu-open");

  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  }
}

function toggleMenu() {
  if (body.classList.contains("menu-open")) {
    closeMenu();
    return;
  }

  openMenu();
}

function setFeedback(message, type = "") {
  if (!profileFeedback) {
    return;
  }

  profileFeedback.textContent = message;
  profileFeedback.dataset.state = type;
}

function setUploadStatus(message) {
  if (profileUploadStatus) {
    profileUploadStatus.textContent = message;
  }
}

function setLoading(isLoading) {
  [
    profileFirstNameInput,
    profileLastNameInput,
    profilePhotoInput,
    profileRemovePhotoButton,
    profileSaveButton,
    profileFocusSubjectSelect,
    profileFocusSubjectNameInput,
  ]
    .filter(Boolean)
    .forEach((element) => {
      element.disabled = isLoading;
    });

  if (profileSaveButton) {
    profileSaveButton.textContent = isLoading ? "Salvando..." : "Salvar alteracoes";
  }
}

function formatMinutes(value) {
  const safeValue = Math.round((Number(value) || 0) * 10) / 10;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Number.isInteger(safeValue) ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(safeValue);
}

function getDisplayName(firstName = "", lastName = "", fallbackName = "") {
  const fullName = [String(firstName || "").trim(), String(lastName || "").trim()]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || String(fallbackName || "").trim() || "Usuario";
}

function getInitials(firstName = "", lastName = "", fallbackName = "") {
  const label = getDisplayName(firstName, lastName, fallbackName);
  const parts = label.split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

function getSubjectKey(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return SUBJECT_LABELS[normalizedValue] ? normalizedValue : DEFAULT_SUBJECT_KEY;
}

function getSubjectLabel(subjectKey, customSubjectName = "") {
  if (subjectKey === "outras" && String(customSubjectName || "").trim()) {
    return String(customSubjectName || "").trim();
  }

  return SUBJECT_LABELS[subjectKey] || SUBJECT_LABELS[DEFAULT_SUBJECT_KEY];
}

function toggleFocusSubjectNameField(subjectKey) {
  const shouldShow = subjectKey === "outras";
  profileFocusSubjectNameField?.classList.toggle("is-hidden", !shouldShow);

  if (!shouldShow && profileFocusSubjectNameInput) {
    profileFocusSubjectNameInput.value = "";
  }
}

function getCurrentMonthMinutes(sessions = []) {
  const now = new Date();

  return Math.round(
    sessions.reduce((total, session) => {
      const rawDate = String(session?.startedAt || session?.dateKey || session?.date || "").trim();
      const parsed = new Date(rawDate);

      if (Number.isNaN(parsed.getTime())) {
        return total;
      }

      if (parsed.getFullYear() !== now.getFullYear() || parsed.getMonth() !== now.getMonth()) {
        return total;
      }

      return total + (Number(session.minutes) || 0);
    }, 0) * 10
  ) / 10;
}

function getMonthlyLevel(minutes) {
  return PROFILE_MEDAL_LEVELS.find((level) => minutes >= level.minMinutes) || null;
}

function renderProfileAvatar(avatarDataUrl, firstName, lastName, fallbackName) {
  const hasAvatar = Boolean(String(avatarDataUrl || "").trim());

  if (profileAvatarShell) {
    profileAvatarShell.classList.toggle("has-image", hasAvatar);
  }

  if (profileAvatarImage) {
    profileAvatarImage.hidden = !hasAvatar;

    if (hasAvatar) {
      profileAvatarImage.src = avatarDataUrl;
    } else {
      profileAvatarImage.removeAttribute("src");
    }
  }

  if (profileAvatarFallback) {
    profileAvatarFallback.hidden = hasAvatar;
    profileAvatarFallback.textContent = getInitials(firstName, lastName, fallbackName);
  }
}

function updateOverviewLabels(profile = currentProfile) {
  if (!profile) {
    return;
  }

  const displayName = getDisplayName(profile.firstName, profile.lastName, profile.name);
  const medal = getMonthlyLevel(currentMonthMinutes);
  const focusSubjectKey = getSubjectKey(profileFocusSubjectSelect?.value || profile.focusSubjectKey);
  const focusSubjectName = focusSubjectKey === "outras"
    ? String(profileFocusSubjectNameInput?.value || profile.focusSubjectName || "").trim()
    : "";

  if (profileDisplayName) {
    profileDisplayName.textContent = displayName;
  }

  if (profileEmail) {
    profileEmail.textContent = profile.email || "";
  }

  if (profileMonthCopy) {
    profileMonthCopy.textContent = `${formatMinutes(currentMonthMinutes)} min no mes`;
  }

  if (profileLevelBadge) {
    profileLevelBadge.textContent = medal?.label || "Nivel atual: iniciante";
  }

  if (profileFocusBadge) {
    profileFocusBadge.textContent = `Materia foco: ${getSubjectLabel(focusSubjectKey, focusSubjectName)}`;
  }

  if (profileAvatarShell) {
    profileAvatarShell.dataset.profileMedal = medal?.key || "none";
  }

  renderProfileAvatar(
    draftAvatarDataUrl ?? currentAvatarDataUrl,
    profileFirstNameInput?.value || profile.firstName,
    profileLastNameInput?.value || profile.lastName,
    profile.name
  );
}

function applyProfile(profile) {
  currentProfile = profile;
  currentAvatarDataUrl = String(profile?.avatarDataUrl || "");
  draftAvatarDataUrl = null;

  if (profileFirstNameInput) {
    profileFirstNameInput.value = profile?.firstName || "";
  }

  if (profileLastNameInput) {
    profileLastNameInput.value = profile?.lastName || "";
  }

  if (profileFocusSubjectSelect) {
    profileFocusSubjectSelect.value = getSubjectKey(profile?.focusSubjectKey);
  }

  if (profileFocusSubjectNameInput) {
    profileFocusSubjectNameInput.value = profile?.focusSubjectName || "";
  }

  toggleFocusSubjectNameField(getSubjectKey(profile?.focusSubjectKey));

  setUploadStatus(currentAvatarDataUrl ? "Foto atual carregada." : "Nenhuma nova foto selecionada.");
  updateOverviewLabels(profile);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel processar a imagem selecionada."));
    image.src = dataUrl;
  });
}

async function optimizeAvatarDataUrl(file) {
  if (!ACCEPTED_AVATAR_TYPES.has(file.type)) {
    throw new Error("Escolha uma imagem em PNG, JPG, WEBP ou GIF.");
  }

  if (file.size > MAX_RAW_FILE_SIZE) {
    throw new Error("A imagem esta muito grande. Escolha um arquivo menor.");
  }

  const originalDataUrl = await readFileAsDataUrl(file);

  if (file.type === "image/gif" && originalDataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH) {
    return originalDataUrl;
  }

  if (file.type === "image/gif") {
    throw new Error("GIF muito grande. Use um GIF menor ou uma imagem estatica.");
  }

  if (originalDataUrl.length <= MAX_AVATAR_DATA_URL_LENGTH && file.size <= 900 * 1024) {
    return originalDataUrl;
  }

  const image = await loadImage(originalDataUrl);
  const maxDimension = 720;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Seu navegador nao conseguiu preparar a imagem.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const attempts = [
    ["image/webp", 0.9],
    ["image/webp", 0.82],
    ["image/jpeg", 0.86],
    ["image/jpeg", 0.74],
  ];

  for (const [type, quality] of attempts) {
    const candidate = canvas.toDataURL(type, quality);

    if (candidate.length <= MAX_AVATAR_DATA_URL_LENGTH) {
      return candidate;
    }
  }

  throw new Error("A imagem ainda ficou muito grande. Tente uma foto menor.");
}

async function refreshMonthlyProgress() {
  const response = await window.Start5Auth.apiRequest("/api/sessions");
  const sessions = Array.isArray(response?.sessions) ? response.sessions : [];
  currentMonthMinutes = getCurrentMonthMinutes(sessions);
  window.Start5Auth.setHeaderMonthlyMinutes(currentMonthMinutes);
  updateOverviewLabels();
}

async function loadProfile() {
  const response = await window.Start5Auth.apiRequest("/api/profile");
  const profile = response?.user || window.Start5Auth.getSession();

  if (!profile) {
    throw new Error("Nao foi possivel carregar seu perfil.");
  }

  applyProfile(profile);
  window.Start5Auth.updateSession(profile);
  setFeedback("");
  await refreshMonthlyProgress();
}

async function handlePhotoSelection(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  setFeedback("");
  setUploadStatus("Processando foto...");

  try {
    draftAvatarDataUrl = await optimizeAvatarDataUrl(file);
    renderProfileAvatar(
      draftAvatarDataUrl,
      profileFirstNameInput?.value || currentProfile?.firstName,
      profileLastNameInput?.value || currentProfile?.lastName,
      currentProfile?.name
    );
    setUploadStatus(`Nova foto pronta: ${file.name}`);
  } catch (error) {
    draftAvatarDataUrl = null;
    setUploadStatus("Nenhuma nova foto selecionada.");
    setFeedback(error.message || "Nao foi possivel preparar a imagem.", "error");
  } finally {
    event.target.value = "";
  }
}

function handleRemovePhoto() {
  draftAvatarDataUrl = "";
  renderProfileAvatar(
    "",
    profileFirstNameInput?.value || currentProfile?.firstName,
    profileLastNameInput?.value || currentProfile?.lastName,
    currentProfile?.name
  );
  setUploadStatus("Foto removida da pre-visualizacao. Salve para confirmar.");
  setFeedback("");
}

async function handleSubmit(event) {
  event.preventDefault();

  const firstName = profileFirstNameInput?.value.trim() || "";
  const lastName = profileLastNameInput?.value.trim() || "";
  const focusSubjectKey = getSubjectKey(profileFocusSubjectSelect?.value);
  const focusSubjectName = focusSubjectKey === "outras"
    ? String(profileFocusSubjectNameInput?.value || "").trim()
    : "";

  if (firstName.length < 2) {
    setFeedback("Informe um nome com pelo menos 2 caracteres.", "error");
    return;
  }

  if (lastName.length < 2) {
    setFeedback("Informe um sobrenome com pelo menos 2 caracteres.", "error");
    return;
  }

  if (focusSubjectKey === "outras" && focusSubjectName.length < 2) {
    setFeedback("Informe o nome da materia foco com pelo menos 2 caracteres.", "error");
    return;
  }

  setLoading(true);
  setFeedback("");

  try {
    const response = await window.Start5Auth.apiRequest("/api/profile", {
      method: "PATCH",
      body: {
        firstName,
        lastName,
        avatarDataUrl: draftAvatarDataUrl !== null ? draftAvatarDataUrl : currentAvatarDataUrl,
        focusSubjectKey,
        focusSubjectName,
      },
    });
    const nextProfile = response?.user;

    if (!nextProfile) {
      throw new Error("O servidor nao retornou o perfil atualizado.");
    }

    applyProfile(nextProfile);
    window.Start5Auth.updateSession(nextProfile);
    updateOverviewLabels(nextProfile);
    setFeedback("Perfil atualizado com sucesso.", "success");
  } catch (error) {
    setFeedback(error.message || "Nao foi possivel salvar as alteracoes.", "error");
  } finally {
    setLoading(false);
  }
}

function bindEvents() {
  menuToggle?.addEventListener("click", toggleMenu);

  menuPanel?.addEventListener("click", (event) => {
    if (event.target === menuPanel) {
      closeMenu();
    }
  });

  profilePhotoInput?.addEventListener("change", handlePhotoSelection);
  profileRemovePhotoButton?.addEventListener("click", handleRemovePhoto);
  profileForm?.addEventListener("submit", handleSubmit);
  profileFocusSubjectSelect?.addEventListener("change", () => {
    toggleFocusSubjectNameField(getSubjectKey(profileFocusSubjectSelect.value));
    updateOverviewLabels();
  });

  [profileFirstNameInput, profileLastNameInput, profileFocusSubjectNameInput].filter(Boolean).forEach((input) => {
    input.addEventListener("input", () => {
      updateOverviewLabels();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && body.classList.contains("menu-open")) {
      closeMenu();
    }
  });
}

async function initializeProfilePage() {
  if (!window.Start5Auth?.ready) {
    throw new Error("Autenticacao indisponivel.");
  }

  bindEvents();
  await window.Start5Auth.ready;

  if (!window.Start5Auth.getSession()) {
    return;
  }

  await loadProfile();
}

initializeProfilePage().catch((error) => {
  console.error("Erro ao iniciar tela de perfil:", error);
  setFeedback(error.message || "Nao foi possivel carregar o perfil.", "error");
});
