const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");

const adminUsersValue = document.getElementById("adminUsersValue");
const adminAdminsValue = document.getElementById("adminAdminsValue");
const adminSessionsValue = document.getElementById("adminSessionsValue");
const adminMinutesValue = document.getElementById("adminMinutesValue");
const adminActiveUsersValue = document.getElementById("adminActiveUsersValue");
const adminEssayTotalValue = document.getElementById("adminEssayTotalValue");
const adminEssayWeekValue = document.getElementById("adminEssayWeekValue");
const adminEssayMonthValue = document.getElementById("adminEssayMonthValue");
const adminEssayAverageValue = document.getElementById("adminEssayAverageValue");
const adminEssayUsersValue = document.getElementById("adminEssayUsersValue");
const adminEssayStatusList = document.getElementById("adminEssayStatusList");
const adminEssayThemesList = document.getElementById("adminEssayThemesList");
const adminUsersTableBody = document.getElementById("adminUsersTableBody");

const adminModalBackdrop = document.getElementById("adminModalBackdrop");
const adminModalForm = document.getElementById("adminModalForm");
const adminModalTitle = document.getElementById("adminModalTitle");
const adminModalSubtitle = document.getElementById("adminModalSubtitle");
const adminModalFeedback = document.getElementById("adminModalFeedback");
const adminModalSubmitButton = document.getElementById("adminModalSubmitButton");
const adminEditFields = document.getElementById("adminEditFields");
const adminPermissionsFields = document.getElementById("adminPermissionsFields");
const adminEditEmailInput = document.getElementById("adminEditEmailInput");
const adminEditPasswordInput = document.getElementById("adminEditPasswordInput");
const closeAdminModalButtons = document.querySelectorAll("[data-close-admin-modal]");
const roleOptionButtons = [...document.querySelectorAll("[data-role-option]")];

let adminUsers = [];
let openUserMenuId = null;
let modalMode = "edit";
let modalUserId = null;
let selectedRole = "user";

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

function formatAdminNumber(value) {
  const safeValue = Number(value) || 0;
  return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(1).replace(".", ",");
}

function formatAdminMinutes(value) {
  return `${formatAdminNumber(value)} min`;
}

function formatAdminScore(value) {
  return `${formatAdminNumber(value)} pts`;
}

function formatAdminDate(value) {
  if (!value) return "Sem registro";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Sem registro";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUserById(userId) {
  return adminUsers.find((user) => user.id === userId) || null;
}

function renderAdminOverview(overview) {
  if (adminUsersValue) adminUsersValue.textContent = String(overview.totalUsers || 0);
  if (adminAdminsValue) adminAdminsValue.textContent = String(overview.adminUsers || 0);
  if (adminSessionsValue) adminSessionsValue.textContent = String(overview.totalSessions || 0);
  if (adminMinutesValue) adminMinutesValue.textContent = formatAdminMinutes(overview.totalMinutes || 0);
  if (adminActiveUsersValue) adminActiveUsersValue.textContent = String(overview.activeUsers || 0);
}

function renderMetricRows(container, rows, emptyMessage) {
  if (!container) return;

  container.replaceChildren();

  if (!rows.length) {
    const row = document.createElement("div");
    row.className = "admin-metric-row";

    const label = document.createElement("span");
    label.className = "admin-metric-key";
    label.textContent = emptyMessage;

    const value = document.createElement("strong");
    value.className = "admin-metric-value";
    value.textContent = "0";

    row.append(label, value);
    container.appendChild(row);
    return;
  }

  rows.forEach((item) => {
    const row = document.createElement("div");
    row.className = "admin-metric-row";

    const label = document.createElement("span");
    label.className = "admin-metric-key";
    label.textContent = item.label;

    const value = document.createElement("strong");
    value.className = "admin-metric-value";
    value.textContent = item.value;

    row.append(label, value);
    container.appendChild(row);
  });
}

function renderAdminEssayMetrics(metrics = {}) {
  if (adminEssayTotalValue) adminEssayTotalValue.textContent = String(metrics.totalEssays || 0);
  if (adminEssayWeekValue) adminEssayWeekValue.textContent = String(metrics.correctedThisWeek || 0);
  if (adminEssayMonthValue) adminEssayMonthValue.textContent = String(metrics.correctedThisMonth || 0);
  if (adminEssayAverageValue) adminEssayAverageValue.textContent = formatAdminScore(metrics.averageTotalScore || 0);
  if (adminEssayUsersValue) adminEssayUsersValue.textContent = String(metrics.usersWithEssays || 0);

  renderMetricRows(
    adminEssayStatusList,
    [
      { label: "Corrigidas com sucesso", value: String(metrics.statusBreakdown?.evaluated || 0) },
      { label: "Pendentes", value: String(metrics.statusBreakdown?.pending || 0) },
      { label: "Falharam", value: String(metrics.statusBreakdown?.failed || 0) },
      { label: "Media C1", value: formatAdminNumber(metrics.averageByCompetency?.competency1 || 0) },
      { label: "Media C2", value: formatAdminNumber(metrics.averageByCompetency?.competency2 || 0) },
      { label: "Media C3", value: formatAdminNumber(metrics.averageByCompetency?.competency3 || 0) },
      { label: "Media C4", value: formatAdminNumber(metrics.averageByCompetency?.competency4 || 0) },
      { label: "Media C5", value: formatAdminNumber(metrics.averageByCompetency?.competency5 || 0) },
    ],
    "Nenhum dado de redacao ainda."
  );

  renderMetricRows(
    adminEssayThemesList,
    Array.isArray(metrics.topThemes)
      ? metrics.topThemes.map((theme) => ({
          label: theme.themeTitle || "Tema sem titulo",
          value: String(theme.total || 0),
        }))
      : [],
    "Nenhum tema usado ainda."
  );
}

function renderEmptyRow(message) {
  if (!adminUsersTableBody) return;

  adminUsersTableBody.replaceChildren();

  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 7;
  cell.className = "admin-empty";
  cell.textContent = message;
  row.appendChild(cell);
  adminUsersTableBody.appendChild(row);
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function setModalFeedback(message, state = "") {
  if (!adminModalFeedback) return;

  adminModalFeedback.textContent = message;
  adminModalFeedback.dataset.state = state;
}

function updateRoleOptionButtons() {
  roleOptionButtons.forEach((button) => {
    const isActive = button.dataset.roleOption === selectedRole;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function resetModalState() {
  modalMode = "edit";
  modalUserId = null;
  selectedRole = "user";

  if (adminEditEmailInput) adminEditEmailInput.value = "";
  if (adminEditPasswordInput) adminEditPasswordInput.value = "";

  if (adminModalSubmitButton) {
    adminModalSubmitButton.disabled = false;
    adminModalSubmitButton.textContent = "Salvar";
  }

  updateRoleOptionButtons();
  setModalFeedback("");
}

function openAdminModal() {
  if (!adminModalBackdrop) return;

  adminModalBackdrop.classList.add("is-visible");
  adminModalBackdrop.setAttribute("aria-hidden", "false");
  body.classList.add("modal-open");
}

function closeAdminModal() {
  if (!adminModalBackdrop) return;

  adminModalBackdrop.classList.remove("is-visible");
  adminModalBackdrop.setAttribute("aria-hidden", "true");
  body.classList.remove("modal-open");
  resetModalState();
}

function setModalLoading(isLoading) {
  if (!adminModalForm || !adminModalSubmitButton) return;

  adminModalForm.querySelectorAll("input, button").forEach((element) => {
    if (element.hasAttribute("data-close-admin-modal")) return;
    element.disabled = isLoading;
  });

  adminModalSubmitButton.textContent = isLoading ? "Salvando..." : "Salvar";
}

function closeUserMenus() {
  openUserMenuId = null;

  document.querySelectorAll(".admin-user-menu").forEach((menu) => {
    menu.classList.remove("is-visible");
  });

  document.querySelectorAll(".admin-kebab-button").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

function toggleUserMenu(userId) {
  const nextIsOpen = openUserMenuId !== userId;
  closeUserMenus();

  if (!nextIsOpen) {
    return;
  }

  openUserMenuId = userId;

  const wrapper = document.querySelector(`[data-user-actions="${userId}"]`);
  const button = wrapper?.querySelector(".admin-kebab-button");
  const menu = wrapper?.querySelector(".admin-user-menu");

  if (button) {
    button.setAttribute("aria-expanded", "true");
  }

  if (menu) {
    menu.classList.add("is-visible");
  }
}

async function openEditModal(userId) {
  closeUserMenus();
  setModalFeedback("");

  try {
    const response = await window.Start5Auth.apiRequest(`/api/admin/users/${userId}`);
    const user = response.user;

    modalMode = "edit";
    modalUserId = user.id;

    if (adminModalTitle) adminModalTitle.textContent = "Editar acesso";
    if (adminModalSubtitle) {
      adminModalSubtitle.textContent = `Atualize e-mail e senha de ${user.name}.`;
    }

    adminEditFields?.classList.remove("is-hidden");
    adminPermissionsFields?.classList.add("is-hidden");

    if (adminEditEmailInput) adminEditEmailInput.value = user.email || "";
    if (adminEditPasswordInput) adminEditPasswordInput.value = "";

    openAdminModal();
  } catch (error) {
    console.error("Erro ao abrir edicao:", error);
  }
}

function openPermissionsModal(userId) {
  closeUserMenus();

  const user = getUserById(userId);

  if (!user) {
    return;
  }

  modalMode = "permissions";
  modalUserId = user.id;
  selectedRole = user.role || "user";

  if (adminModalTitle) adminModalTitle.textContent = "Permissoes";
  if (adminModalSubtitle) {
    adminModalSubtitle.textContent = `Escolha o perfil de acesso para ${user.name}.`;
  }

  adminEditFields?.classList.add("is-hidden");
  adminPermissionsFields?.classList.remove("is-hidden");
  updateRoleOptionButtons();
  openAdminModal();
}

async function submitEditMode() {
  if (!modalUserId) return;

  const email = adminEditEmailInput?.value.trim().toLowerCase() || "";
  const password = adminEditPasswordInput?.value || "";

  if (!email) {
    setModalFeedback("Informe um e-mail para continuar.", "error");
    return;
  }

  setModalLoading(true);
  setModalFeedback("");

  try {
    await window.Start5Auth.apiRequest(`/api/admin/users/${modalUserId}`, {
      method: "PATCH",
      body: {
        email,
        password,
      },
    });

    await loadAdminData();
    closeAdminModal();
  } catch (error) {
    setModalFeedback(error.message || "Nao foi possivel atualizar o acesso.", "error");
    setModalLoading(false);
  }
}

async function submitPermissionsMode() {
  if (!modalUserId) return;

  setModalLoading(true);
  setModalFeedback("");

  try {
    await window.Start5Auth.apiRequest(`/api/admin/users/${modalUserId}/role`, {
      method: "PATCH",
      body: { role: selectedRole },
    });

    await loadAdminData();
    closeAdminModal();
  } catch (error) {
    setModalFeedback(error.message || "Nao foi possivel atualizar as permissoes.", "error");
    setModalLoading(false);
  }
}

function createActionsCell(user) {
  const cell = document.createElement("td");
  cell.className = "admin-actions-cell";

  const wrapper = document.createElement("div");
  wrapper.className = "admin-user-actions";
  wrapper.dataset.userActions = String(user.id);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "admin-kebab-button";
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", `Abrir acoes de ${user.name}`);
  button.textContent = "⋯";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenu(user.id);
  });

  const menu = document.createElement("div");
  menu.className = "admin-user-menu";

  const permissionsButton = document.createElement("button");
  permissionsButton.type = "button";
  permissionsButton.className = "admin-user-menu-button";
  permissionsButton.textContent = "Permissoes";
  permissionsButton.addEventListener("click", () => {
    openPermissionsModal(user.id);
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "admin-user-menu-button";
  editButton.textContent = "Editar";
  editButton.addEventListener("click", () => {
    openEditModal(user.id);
  });

  menu.append(permissionsButton, editButton);
  wrapper.append(button, menu);
  cell.appendChild(wrapper);
  return cell;
}

function renderAdminUsers(users) {
  if (!adminUsersTableBody) return;

  adminUsers = Array.isArray(users) ? users : [];
  closeUserMenus();

  if (!adminUsers.length) {
    renderEmptyRow("Nenhum usuario encontrado.");
    return;
  }

  const rows = adminUsers.map((user) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(user.name || "Sem nome"));
    row.appendChild(createCell(user.maskedEmail || "Privado"));
    row.appendChild(createCell(user.role === "admin" ? "Admin" : "Usuario"));
    row.appendChild(createCell(formatAdminNumber(user.totalSessions)));
    row.appendChild(createCell(formatAdminMinutes(user.totalMinutes)));
    row.appendChild(createCell(formatAdminDate(user.lastSessionAt)));
    row.appendChild(createActionsCell(user));
    return row;
  });

  adminUsersTableBody.replaceChildren(...rows);
}

async function loadAdminData() {
  try {
    await window.Start5Auth?.ready;

    const [overviewResponse, usersResponse, essayMetricsResponse] = await Promise.all([
      window.Start5Auth.apiRequest("/api/admin/overview"),
      window.Start5Auth.apiRequest("/api/admin/users"),
      window.Start5Auth.apiRequest("/api/admin/essay-metrics"),
    ]);

    renderAdminOverview(overviewResponse.overview || {});
    renderAdminEssayMetrics(essayMetricsResponse.metrics || {});
    renderAdminUsers(usersResponse.users || []);
  } catch (error) {
    console.error("Erro ao carregar admin:", error);
    renderAdminEssayMetrics({});
    renderEmptyRow("Nao foi possivel carregar os dados do admin.");
  }
}

menuToggle?.addEventListener("click", toggleMenu);

menuPanel?.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-nav")) {
    closeMenu();
  }
});

closeAdminModalButtons.forEach((button) => {
  button.addEventListener("click", closeAdminModal);
});

if (adminModalBackdrop) {
  adminModalBackdrop.addEventListener("click", (event) => {
    if (event.target === adminModalBackdrop) {
      closeAdminModal();
    }
  });
}

roleOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedRole = button.dataset.roleOption || "user";
    updateRoleOptionButtons();
  });
});

if (adminModalForm) {
  adminModalForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (modalMode === "permissions") {
      await submitPermissionsMode();
      return;
    }

    await submitEditMode();
  });
}

document.addEventListener("click", (event) => {
  if (!event.target.closest(".admin-user-actions")) {
    closeUserMenus();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (adminModalBackdrop?.classList.contains("is-visible")) {
    closeAdminModal();
    return;
  }

  closeUserMenus();

  if (body.classList.contains("menu-open")) {
    closeMenu();
  }
});

loadAdminData();
