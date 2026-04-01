const body = document.body;
const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const sidebarNavigationManaged = Boolean(window.Start5Main?.sidebarNavigation?.isManaged);
const adminPageView = body?.dataset.adminView || "hub";

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
const adminEmailAccountsValue = document.getElementById("adminEmailAccountsValue");
const adminEmailAdminsValue = document.getElementById("adminEmailAdminsValue");
const adminEmailActiveValue = document.getElementById("adminEmailActiveValue");
const adminEmailRecentValue = document.getElementById("adminEmailRecentValue");
const adminEmailList = document.getElementById("adminEmailList");
const adminProfileSelectionList = document.getElementById("adminProfileSelectionList");
const adminSelectionCountValue = document.getElementById("adminSelectionCountValue");
const adminSelectionHintValue = document.getElementById("adminSelectionHintValue");
const adminClearSelectionButton = document.getElementById("adminClearSelectionButton");
const adminGrantSelectedButton = document.getElementById("adminGrantSelectedButton");
const adminRevokeSelectedButton = document.getElementById("adminRevokeSelectedButton");
const adminDeleteSelectedButton = document.getElementById("adminDeleteSelectedButton");
const adminBulkFeedback = document.getElementById("adminBulkFeedback");
const adminProfileAvatar = document.getElementById("adminProfileAvatar");
const adminProfileNameValue = document.getElementById("adminProfileNameValue");
const adminProfileEmailValue = document.getElementById("adminProfileEmailValue");
const adminProfileRoleValue = document.getElementById("adminProfileRoleValue");
const adminProfileFocusValue = document.getElementById("adminProfileFocusValue");

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
const adminCanManageAdminsInput = document.getElementById("adminCanManageAdminsInput");
const closeAdminModalButtons = document.querySelectorAll("[data-close-admin-modal]");
const roleOptionButtons = [...document.querySelectorAll("[data-role-option]")];
const adminDeleteConfirmBackdrop = document.getElementById("adminDeleteConfirmBackdrop");
const adminDeleteConfirmSummary = document.getElementById("adminDeleteConfirmSummary");
const adminDeleteConfirmList = document.getElementById("adminDeleteConfirmList");
const adminDeleteConfirmFeedback = document.getElementById("adminDeleteConfirmFeedback");
const adminConfirmDeleteSelectedButton = document.getElementById("adminConfirmDeleteSelectedButton");
const closeAdminDeleteModalButtons = document.querySelectorAll("[data-close-admin-delete-modal]");

let adminUsers = [];
let selectedAdminUserIds = new Set();
let openUserMenuId = null;
let modalMode = "edit";
let modalUserId = null;
let selectedRole = "user";
let isApplyingBulkAction = false;

function getAdminSession() {
  return window.Start5Auth?.getSession?.() || null;
}

function currentAdminCanManageAdmins() {
  return Boolean(window.Start5Auth?.canManageAdmins?.(getAdminSession()));
}

function currentAdminIsPrimary() {
  return Boolean(window.Start5Auth?.isPrimaryAdmin?.(getAdminSession()));
}

function getAdminRoleLabel(user) {
  if (user?.isPrimaryAdmin) {
    return "Admin principal";
  }

  if (user?.adminCanManageAdmins) {
    return "Admin gestor";
  }

  return user?.role === "admin" ? "Admin" : "Usuario";
}

function isDialogElement(element) {
  return typeof HTMLDialogElement !== "undefined" && element instanceof HTMLDialogElement;
}

function isModalLayerOpen(element) {
  if (!element) {
    return false;
  }

  if (isDialogElement(element)) {
    return element.open;
  }

  return element.classList.contains("is-visible");
}

function showModalLayer(element) {
  if (!element) {
    return;
  }

  if (isDialogElement(element)) {
    if (!element.open) {
      element.showModal();
    }

    return;
  }

  element.classList.add("is-visible");
}

function hideModalLayer(element) {
  if (!element) {
    return;
  }

  if (isDialogElement(element)) {
    if (element.open) {
      element.close();
    }

    return;
  }

  element.classList.remove("is-visible");
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

function getNameInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "A";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

function getUserById(userId) {
  return adminUsers.find((user) => user.id === userId) || null;
}

function getSelectedAdminUsers() {
  return [...selectedAdminUserIds]
    .map((userId) => getUserById(userId))
    .filter(Boolean);
}

function getAdminSelectionRestrictionReason(user) {
  if (!user || !currentAdminCanManageAdmins()) {
    return "";
  }

  const session = getAdminSession();

  if (user.isPrimaryAdmin) {
    return "Admin principal protegido";
  }

  if (session?.id === user.id) {
    return "Sua conta nao entra em acoes em lote";
  }

  if (user.adminCanManageAdmins && !currentAdminIsPrimary()) {
    return "Somente o admin principal gerencia este perfil";
  }

  return "";
}

function isAdminUserSelectable(user) {
  return !getAdminSelectionRestrictionReason(user);
}

function syncSelectedAdminUserIds() {
  selectedAdminUserIds = new Set(
    [...selectedAdminUserIds].filter((userId) => {
      const user = adminUsers.find((entry) => entry.id === userId);
      return Boolean(user && isAdminUserSelectable(user));
    })
  );
}

function setAdminBulkFeedback(message, state = "") {
  if (!adminBulkFeedback) {
    return;
  }

  adminBulkFeedback.textContent = message;
  adminBulkFeedback.dataset.state = state;
}

function setAdminDeleteConfirmFeedback(message, state = "") {
  if (!adminDeleteConfirmFeedback) {
    return;
  }

  adminDeleteConfirmFeedback.textContent = message;
  adminDeleteConfirmFeedback.dataset.state = state;
}

function updateAdminSelectionSummary() {
  const selectedUsers = getSelectedAdminUsers();
  const selectedCount = selectedUsers.length;

  if (adminSelectionCountValue) {
    adminSelectionCountValue.textContent = `${selectedCount} perfil${selectedCount === 1 ? "" : "s"} selecionado${selectedCount === 1 ? "" : "s"}`;
  }

  if (adminSelectionHintValue) {
    adminSelectionHintValue.textContent = selectedCount
      ? "As acoes abaixo vao usar apenas os perfis destacados."
      : "Perfis protegidos continuam visiveis, mas ficam fora das acoes em lote.";
  }

  if (adminGrantSelectedButton) {
    adminGrantSelectedButton.disabled = !selectedCount || isApplyingBulkAction;
  }

  if (adminRevokeSelectedButton) {
    adminRevokeSelectedButton.disabled = !selectedCount || isApplyingBulkAction;
  }

  if (adminDeleteSelectedButton) {
    adminDeleteSelectedButton.disabled = !selectedCount || isApplyingBulkAction;
  }

  if (adminClearSelectionButton) {
    adminClearSelectionButton.disabled = !selectedCount || isApplyingBulkAction;
  }
}

function setAdminBulkActionLoading(isLoading) {
  isApplyingBulkAction = isLoading;

  if (adminGrantSelectedButton) {
    adminGrantSelectedButton.textContent = isLoading ? "Aplicando..." : "Dar permissao admin";
  }

  if (adminRevokeSelectedButton) {
    adminRevokeSelectedButton.textContent = isLoading ? "Aplicando..." : "Remover permissao admin";
  }

  if (adminDeleteSelectedButton) {
    adminDeleteSelectedButton.textContent = isLoading ? "Processando..." : "Excluir selecionados";
  }

  if (adminConfirmDeleteSelectedButton) {
    adminConfirmDeleteSelectedButton.disabled = isLoading;
    adminConfirmDeleteSelectedButton.textContent = isLoading ? "Excluindo..." : "Excluir perfis";
  }

  updateAdminSelectionSummary();
}

function toggleAdminUserSelection(userId) {
  const user = getUserById(userId);

  if (!currentAdminCanManageAdmins() || isApplyingBulkAction || !isAdminUserSelectable(user)) {
    return;
  }

  if (selectedAdminUserIds.has(userId)) {
    selectedAdminUserIds.delete(userId);
  } else {
    selectedAdminUserIds.add(userId);
  }

  renderAdminSelectionBar(adminUsers);
  renderAdminEmails(adminUsers);
}

function clearAdminUserSelection({ keepFeedback = false } = {}) {
  if (!selectedAdminUserIds.size) {
    return;
  }

  selectedAdminUserIds.clear();

  if (!keepFeedback) {
    setAdminBulkFeedback("");
  }

  renderAdminSelectionBar(adminUsers);
  renderAdminEmails(adminUsers);
}

function createAdminSelectionChip(user) {
  const restrictionReason = getAdminSelectionRestrictionReason(user);
  const isSelectable = !restrictionReason;
  const chip = document.createElement(isSelectable ? "button" : "div");
  chip.className = "admin-selection-chip";
  chip.dataset.userId = String(user.id);

  if (selectedAdminUserIds.has(user.id)) {
    chip.classList.add("is-selected");
  }

  if (user.isPrimaryAdmin) {
    chip.classList.add("is-protected");
  }

  if (isSelectable) {
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(selectedAdminUserIds.has(user.id)));
    chip.setAttribute("aria-label", `Selecionar perfil de ${user.name || "Usuario"}`);
    chip.addEventListener("click", () => {
      toggleAdminUserSelection(user.id);
    });
  } else {
    chip.classList.add("is-disabled");
    chip.setAttribute("aria-disabled", "true");
    chip.title = restrictionReason;
  }

  const avatar = document.createElement("span");
  avatar.className = "admin-selection-chip-avatar";
  avatar.textContent = getNameInitials(user.name || user.email || "U");

  const copy = document.createElement("span");
  copy.className = "admin-selection-chip-copy";

  const name = document.createElement("strong");
  name.textContent = user.name || "Sem nome";

  const email = document.createElement("span");
  email.textContent = user.email || user.maskedEmail || "Sem e-mail";

  copy.append(name, email);

  const meta = document.createElement("span");
  meta.className = "admin-selection-chip-meta";
  meta.textContent = restrictionReason || getAdminRoleLabel(user);

  chip.append(avatar, copy, meta);
  return chip;
}

function renderAdminSelectionBar(users = []) {
  if (!adminProfileSelectionList) {
    return;
  }

  adminProfileSelectionList.replaceChildren();

  const normalizedUsers = Array.isArray(users) ? users : [];

  if (!normalizedUsers.length) {
    const empty = document.createElement("div");
    empty.className = "admin-empty";
    empty.textContent = "Nenhum perfil carregado para gerenciamento.";
    adminProfileSelectionList.appendChild(empty);
    updateAdminSelectionSummary();
    return;
  }

  normalizedUsers.forEach((user) => {
    adminProfileSelectionList.appendChild(createAdminSelectionChip(user));
  });

  updateAdminSelectionSummary();
}

function closeAdminDeleteConfirmModal() {
  if (!adminDeleteConfirmBackdrop) {
    return;
  }

  hideModalLayer(adminDeleteConfirmBackdrop);
  body.classList.remove("modal-open");
  setAdminDeleteConfirmFeedback("");
}

function openAdminDeleteConfirmModal() {
  const selectedUsers = getSelectedAdminUsers();

  if (!adminDeleteConfirmBackdrop || !selectedUsers.length) {
    return;
  }

  if (adminDeleteConfirmSummary) {
    adminDeleteConfirmSummary.textContent =
      selectedUsers.length === 1
        ? `Excluir ${selectedUsers[0].name || "este perfil"} do banco?`
        : `Excluir ${selectedUsers.length} perfis do banco?`;
  }

  if (adminDeleteConfirmList) {
    adminDeleteConfirmList.replaceChildren();

    selectedUsers.forEach((user) => {
      const row = document.createElement("div");
      row.className = "admin-delete-confirm-row";

      const name = document.createElement("strong");
      name.textContent = user.name || "Sem nome";

      const meta = document.createElement("span");
      meta.textContent = `${user.email || user.maskedEmail || "Sem e-mail"} • ${getAdminRoleLabel(user)}`;

      row.append(name, meta);
      adminDeleteConfirmList.appendChild(row);
    });
  }

  setAdminDeleteConfirmFeedback("");
  showModalLayer(adminDeleteConfirmBackdrop);
  body.classList.add("modal-open");
}

async function applyAdminBulkAction(action) {
  const selectedUsers = getSelectedAdminUsers();

  if (!selectedUsers.length || isApplyingBulkAction) {
    return;
  }

  setAdminBulkActionLoading(true);
  setAdminBulkFeedback("");

  try {
    const response = await window.Start5Auth.apiRequest("/api/admin/users/batch", {
      method: "POST",
      body: {
        action,
        userIds: selectedUsers.map((user) => user.id),
      },
    });

    selectedAdminUserIds.clear();
    closeAdminDeleteConfirmModal();
    await loadAdminData();
    setAdminBulkFeedback(response?.message || "A acao foi aplicada com sucesso.", "success");
  } catch (error) {
    const message = error.message || "Nao foi possivel aplicar a acao selecionada.";
    setAdminBulkFeedback(message, "error");
    setAdminDeleteConfirmFeedback(message, "error");
  } finally {
    setAdminBulkActionLoading(false);
  }
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
      { label: "M\u00e9dia C1", value: formatAdminNumber(metrics.averageByCompetency?.competency1 || 0) },
      { label: "M\u00e9dia C2", value: formatAdminNumber(metrics.averageByCompetency?.competency2 || 0) },
      { label: "M\u00e9dia C3", value: formatAdminNumber(metrics.averageByCompetency?.competency3 || 0) },
      { label: "M\u00e9dia C4", value: formatAdminNumber(metrics.averageByCompetency?.competency4 || 0) },
      { label: "M\u00e9dia C5", value: formatAdminNumber(metrics.averageByCompetency?.competency5 || 0) },
    ],
    "Nenhum dado de reda\u00e7\u00e3o ainda."
  );

  renderMetricRows(
    adminEssayThemesList,
    Array.isArray(metrics.topThemes)
      ? metrics.topThemes.map((theme) => ({
          label: theme.themeTitle || "Tema sem t\u00edtulo",
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
  cell.colSpan = currentAdminCanManageAdmins() ? 7 : 6;
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

function updateModalFieldAvailability() {
  const isPermissionsMode = modalMode === "permissions";

  if (adminEditEmailInput) {
    adminEditEmailInput.disabled = isPermissionsMode;
    adminEditEmailInput.required = !isPermissionsMode;
  }

  if (adminEditPasswordInput) {
    adminEditPasswordInput.disabled = isPermissionsMode;
  }

  roleOptionButtons.forEach((button) => {
    button.disabled = !isPermissionsMode;
  });

  if (adminCanManageAdminsInput) {
    adminCanManageAdminsInput.disabled = !isPermissionsMode || !currentAdminIsPrimary() || selectedRole !== "admin";
  }
}

function resetModalState() {
  modalMode = "edit";
  modalUserId = null;
  selectedRole = "user";

  if (adminEditEmailInput) adminEditEmailInput.value = "";
  if (adminEditPasswordInput) adminEditPasswordInput.value = "";
  if (adminCanManageAdminsInput) adminCanManageAdminsInput.checked = false;

  if (adminModalSubmitButton) {
    adminModalSubmitButton.disabled = false;
    adminModalSubmitButton.textContent = "Salvar";
  }

  updateModalFieldAvailability();
  updateRoleOptionButtons();
  setModalFeedback("");
}

function openAdminModal() {
  if (!adminModalBackdrop) return;

  showModalLayer(adminModalBackdrop);
  body.classList.add("modal-open");
}

function closeAdminModal() {
  if (!adminModalBackdrop) return;

  hideModalLayer(adminModalBackdrop);
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

  if (!isLoading) {
    updateModalFieldAvailability();
  }
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

    updateModalFieldAvailability();
    openAdminModal();
  } catch (error) {
    console.error("Erro ao abrir edi\u00e7\u00e3o:", error);
  }
}

function openPermissionsModal(userId) {
  closeUserMenus();

  if (!currentAdminCanManageAdmins()) {
    return;
  }

  const user = getUserById(userId);

  if (!user) {
    return;
  }

  modalMode = "permissions";
  modalUserId = user.id;
  selectedRole = user.role || "user";
  if (adminCanManageAdminsInput) {
    adminCanManageAdminsInput.checked = Boolean(user.adminCanManageAdmins);
  }

  if (adminModalTitle) adminModalTitle.textContent = "Permiss\u00f5es";
  if (adminModalSubtitle) {
    adminModalSubtitle.textContent = `Escolha o perfil de acesso para ${user.name}.`;
  }

  adminEditFields?.classList.add("is-hidden");
  adminPermissionsFields?.classList.remove("is-hidden");
  updateModalFieldAvailability();
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
    setModalFeedback(error.message || "N\u00e3o foi poss\u00edvel atualizar o acesso.", "error");
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
      body: {
        role: selectedRole,
        ...(currentAdminIsPrimary() ? { adminCanManageAdmins: Boolean(adminCanManageAdminsInput?.checked) } : {}),
      },
    });

    await loadAdminData();
    closeAdminModal();
  } catch (error) {
    setModalFeedback(error.message || "N\u00e3o foi poss\u00edvel atualizar as permiss\u00f5es.", "error");
    setModalLoading(false);
  }
}

function createActionsCell(user) {
  if (!currentAdminCanManageAdmins()) {
    return null;
  }

  const cell = document.createElement("td");
  cell.className = "admin-actions-cell";
  cell.dataset.adminManagerOnly = "true";

  const wrapper = document.createElement("div");
  wrapper.className = "admin-user-actions";
  wrapper.dataset.userActions = String(user.id);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "admin-kebab-button";
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", `Abrir a\u00e7\u00f5es de ${user.name}`);
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
  permissionsButton.textContent = "Permiss\u00f5es";
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
  syncSelectedAdminUserIds();
  closeUserMenus();
  renderAdminSelectionBar(adminUsers);

  if (!adminUsers.length) {
    renderEmptyRow("Nenhum usu\u00e1rio encontrado.");
    return;
  }

  const rows = adminUsers.map((user) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(user.name || "Sem nome"));
    row.appendChild(createCell(user.maskedEmail || "Privado"));
    row.appendChild(createCell(getAdminRoleLabel(user)));
    row.appendChild(createCell(formatAdminNumber(user.totalSessions)));
    row.appendChild(createCell(formatAdminMinutes(user.totalMinutes)));
    row.appendChild(createCell(formatAdminDate(user.lastSessionAt)));
    const actionsCell = createActionsCell(user);
    if (actionsCell) {
      row.appendChild(actionsCell);
    }
    return row;
  });

  adminUsersTableBody.replaceChildren(...rows);
}

function renderAdminEmails(users = []) {
  const normalizedUsers = Array.isArray(users) ? users : [];
  const activeUsers = normalizedUsers.filter((user) => Number(user.totalSessions || 0) > 0);
  const adminUsersCount = normalizedUsers.filter((user) => user.role === "admin").length;
  const recentUsers = [...normalizedUsers]
    .sort((left, right) => {
      const leftTime = new Date(left.lastSessionAt || left.createdAt || 0).getTime() || 0;
      const rightTime = new Date(right.lastSessionAt || right.createdAt || 0).getTime() || 0;
      return rightTime - leftTime;
    });
  const mostRecentAccess = recentUsers[0]?.lastSessionAt || recentUsers[0]?.createdAt || "";

  if (adminEmailAccountsValue) {
    adminEmailAccountsValue.textContent = String(normalizedUsers.length);
  }

  if (adminEmailAdminsValue) {
    adminEmailAdminsValue.textContent = String(adminUsersCount);
  }

  if (adminEmailActiveValue) {
    adminEmailActiveValue.textContent = String(activeUsers.length);
  }

  if (adminEmailRecentValue) {
    adminEmailRecentValue.textContent = formatAdminDate(mostRecentAccess);
  }

  if (!adminEmailList) {
    return;
  }

  adminEmailList.replaceChildren();

  if (!recentUsers.length) {
    const empty = document.createElement("div");
    empty.className = "admin-empty";
    empty.textContent = "Nenhuma conta carregada ainda.";
    adminEmailList.appendChild(empty);
    return;
  }

  recentUsers.forEach((user) => {
    const isSelected = selectedAdminUserIds.has(user.id);
    const restrictionReason = getAdminSelectionRestrictionReason(user);
    const isSelectable = currentAdminCanManageAdmins() && !restrictionReason;
    const row = document.createElement(isSelectable ? "button" : "div");
    row.className = "admin-account-row";
    row.dataset.userId = String(user.id);

    if (isSelected) {
      row.classList.add("is-selected");
    }

    if (user.isPrimaryAdmin) {
      row.classList.add("is-protected");
    }

    if (currentAdminCanManageAdmins() && isSelectable) {
      row.type = "button";
      row.setAttribute("aria-pressed", String(isSelected));
      row.addEventListener("click", () => {
        toggleAdminUserSelection(user.id);
      });
    } else if (currentAdminCanManageAdmins() && restrictionReason) {
      row.classList.add("is-disabled");
      row.setAttribute("aria-disabled", "true");
      row.title = restrictionReason;
    }

    const accountMain = document.createElement("div");
    accountMain.className = "admin-account-main";

    const accountName = document.createElement("strong");
    accountName.textContent = user.name || "Sem nome";

    const accountEmail = document.createElement("span");
    accountEmail.textContent = user.email || user.maskedEmail || "Sem e-mail";

    accountMain.append(accountName, accountEmail);

    if (restrictionReason) {
      const accountNote = document.createElement("span");
      accountNote.className = "admin-account-note";
      accountNote.textContent = restrictionReason;
      accountMain.appendChild(accountNote);
    }

    const accountMeta = document.createElement("div");
    accountMeta.className = "admin-account-meta";

    const accountRole = document.createElement("span");
    accountRole.className = "admin-account-badge";
    accountRole.textContent = getAdminRoleLabel(user);

    const accountDate = document.createElement("span");
    accountDate.className = "admin-account-date";
    accountDate.textContent = formatAdminDate(user.lastSessionAt || user.createdAt);

    accountMeta.append(accountRole, accountDate);
    row.append(accountMain, accountMeta);
    adminEmailList.appendChild(row);
  });
}

function renderAdminProfile() {
  const session = window.Start5Auth?.getSession?.() || null;
  const displayName = session?.name || [session?.firstName, session?.lastName].filter(Boolean).join(" ").trim() || "Administrador";
  const displayEmail = session?.email || "Sem email";
  const displayRole = getAdminRoleLabel(session);
  const displayFocus = session?.focusSubjectLabel || "Sem foco definido";

  if (adminProfileAvatar) {
    adminProfileAvatar.textContent = getNameInitials(displayName);
  }

  if (adminProfileNameValue) {
    adminProfileNameValue.textContent = displayName;
  }

  if (adminProfileEmailValue) {
    adminProfileEmailValue.textContent = displayEmail;
  }

  if (adminProfileRoleValue) {
    adminProfileRoleValue.textContent = displayRole;
  }

  if (adminProfileFocusValue) {
    adminProfileFocusValue.textContent = displayFocus;
  }
}

async function loadAdminData() {
  let authReady = false;
  const passiveAdminViews = new Set([
    "hub",
    "question-bank",
    "proofs-hub",
    "proofs-list",
    "proofs-upload",
    "proofs-answer-keys",
    "proofs-questions",
    "proofs-correction",
    "proofs-results",
  ]);

  try {
    await window.Start5Auth?.ready;
    authReady = true;

    if (!window.Start5Auth?.canAccessAdmin?.(getAdminSession())) {
      window.location.replace("index.html");
      return;
    }

    if (passiveAdminViews.has(adminPageView)) {
      return;
    }

    if (adminPageView === "profile") {
      renderAdminProfile();
      return;
    }

    if (adminPageView === "email") {
      const usersResponse = await window.Start5Auth.apiRequest("/api/admin/users");
      renderAdminUsers(usersResponse.users || []);
      renderAdminEmails(usersResponse.users || []);
      return;
    }
  } catch (error) {
    console.error("Erro ao carregar admin:", error);

    if (!authReady) {
      return;
    }

    adminUsers = [];
    syncSelectedAdminUserIds();
    renderAdminSelectionBar([]);
    renderEmptyRow("N\u00e3o foi poss\u00edvel carregar os dados do admin.");
    renderAdminEmails([]);
    renderAdminProfile();
  }
}

if (!sidebarNavigationManaged) {
  menuToggle?.addEventListener("click", toggleMenu);

  menuPanel?.addEventListener("click", (event) => {
    if (!event.target.closest(".menu-nav")) {
      closeMenu();
    }
  });
}

closeAdminModalButtons.forEach((button) => {
  button.addEventListener("click", closeAdminModal);
});

if (adminModalBackdrop) {
  adminModalBackdrop.addEventListener("click", (event) => {
    if (event.target === adminModalBackdrop) {
      closeAdminModal();
    }
  });

  adminModalBackdrop.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAdminModal();
  });
}

closeAdminDeleteModalButtons.forEach((button) => {
  button.addEventListener("click", closeAdminDeleteConfirmModal);
});

if (adminDeleteConfirmBackdrop) {
  adminDeleteConfirmBackdrop.addEventListener("click", (event) => {
    if (event.target === adminDeleteConfirmBackdrop) {
      closeAdminDeleteConfirmModal();
    }
  });

  adminDeleteConfirmBackdrop.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAdminDeleteConfirmModal();
  });
}

adminClearSelectionButton?.addEventListener("click", () => {
  clearAdminUserSelection();
});

adminGrantSelectedButton?.addEventListener("click", async () => {
  await applyAdminBulkAction("grant-admin");
});

adminRevokeSelectedButton?.addEventListener("click", async () => {
  await applyAdminBulkAction("revoke-admin");
});

adminDeleteSelectedButton?.addEventListener("click", () => {
  openAdminDeleteConfirmModal();
});

adminConfirmDeleteSelectedButton?.addEventListener("click", async () => {
  await applyAdminBulkAction("delete");
});

roleOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedRole = button.dataset.roleOption || "user";
    if (selectedRole !== "admin" && adminCanManageAdminsInput) {
      adminCanManageAdminsInput.checked = false;
    }
    updateRoleOptionButtons();
    updateModalFieldAvailability();
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

  if (isModalLayerOpen(adminDeleteConfirmBackdrop)) {
    closeAdminDeleteConfirmModal();
    return;
  }

  if (isModalLayerOpen(adminModalBackdrop)) {
    closeAdminModal();
    return;
  }

  closeUserMenus();

  if (!sidebarNavigationManaged && body.classList.contains("menu-open")) {
    closeMenu();
  }
});

loadAdminData();
