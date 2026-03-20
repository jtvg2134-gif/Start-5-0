(function initializeStart5Main() {
  const body = document.body;
  const rawPage = window.location.pathname.split("/").pop().toLowerCase();
  const currentPage = rawPage || "login.html";
  const isProtectedPage = body?.classList.contains("protected-page");

  const PAGE_META = {
    "index.html": {
      documentTitle: "Start 5",
      title: "Inicio",
      kicker: "Comece aqui",
      subtitle: "warm streets / clear goals / daily ambition",
    },
    "dashboard.html": {
      documentTitle: "Start 5 | Painel",
      title: "Painel",
      kicker: "Centro de desempenho",
      subtitle: "overview / semanal / mensal",
    },
    "questoes.html": {
      documentTitle: "Questoes",
      title: "Questoes",
      kicker: "Banco Start 5",
      subtitle: "filtros / pratica / revisao",
    },
    "rotina.html": {
      documentTitle: "Start 5 | Rotina",
      title: "Rotina",
      kicker: "Disciplina semanal",
      subtitle: "constancia / blocos / execucao",
    },
    "redacao.html": {
      documentTitle: "Start 5 | Reda\u00e7\u00e3o",
      title: "Redacao",
      kicker: "Prestigio intelectual",
      subtitle: "clareza / foco / evolucao",
    },
    "profile.html": {
      documentTitle: "Start 5 | Perfil",
      title: "Perfil",
      kicker: "Conta e identidade",
      subtitle: "base pessoal / direcao / ajuste",
    },
    "admin.html": {
      documentTitle: "Start 5 | Admin",
      title: "Admin",
      kicker: "Visao administrativa",
      subtitle: "controle / uso / crescimento",
    },
  };

  const PRIMARY_NAV_ITEMS = [
    {
      page: "index.html",
      label: "Inicio",
      sublabel: "boas-vindas / energia / partida",
      className: "sidebar-link-primary",
    },
    {
      page: "dashboard.html",
      label: "Painel",
      sublabel: "visao geral / semanal / mensal",
      className: "sidebar-link-primary",
    },
    {
      page: "questoes.html",
      label: "Questoes",
      sublabel: "banco / filtros / pratica",
      className: "sidebar-link-primary",
    },
    {
      page: "rotina.html",
      label: "Rotina",
      sublabel: "disciplina / blocos / constancia",
      className: "sidebar-link-primary",
    },
    {
      page: "redacao.html",
      label: "Redacao",
      sublabel: "foco / correcao / nivel",
      className: "sidebar-link-primary",
    },
  ];

  const SECONDARY_NAV_ITEMS = [
    {
      page: "profile.html",
      label: "Perfil",
      sublabel: "conta / preferencias",
      className: "sidebar-link-secondary",
    },
    {
      page: "admin.html",
      label: "Admin",
      sublabel: "controle / acesso",
      className: "sidebar-link-secondary",
      adminOnly: true,
    },
  ];

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getPageMeta() {
    return PAGE_META[currentPage] || {
      documentTitle: "Start 5",
      title: "Start 5",
      kicker: "Urban system",
      subtitle: "discipline / growth / ambition",
    };
  }

  function buildHeaderMarkup() {
    if (currentPage === "index.html") {
      return buildMenuButtonMarkup();
    }

    const pageMeta = getPageMeta();

    return `
      <div class="header-page-copy">
        <strong class="header-page-title">Start 5</strong>
        <span class="header-page-kicker">${escapeHtml(pageMeta.title)}</span>
      </div>

      ${buildMenuButtonMarkup()}
    `;
  }

  function buildMenuButtonMarkup({ close = false } = {}) {
    return `
      <button
        class="${close ? "menu-close" : "menu-toggle"}"
        ${close ? 'id="menuClose"' : 'id="menuToggle"'}
        type="button"
        aria-label="${close ? "Fechar menu" : "Abrir menu"}"
        ${close ? "" : 'aria-expanded="false" aria-controls="menuPanel"'}
      >
        <span class="menu-icon" aria-hidden="true">
          <span></span>
          <span></span>
        </span>
      </button>
    `;
  }

  function buildMenuUserMarkup() {
    return `
      <section class="menu-user" aria-label="Conta conectada">
        <div class="menu-user-account">
          <div class="header-account-avatar menu-user-avatar" data-auth-avatar>
            <img
              class="header-account-avatar-image"
              data-auth-avatar-image
              alt="Foto do perfil"
              width="42"
              height="42"
              decoding="async"
              hidden
            />
            <span class="header-account-avatar-fallback" data-auth-initials>U</span>
          </div>
          <div class="menu-user-copy">
            <strong class="menu-user-name" data-auth-name>Usuario</strong>
            <span class="menu-user-email" data-auth-email>email@start5.app</span>
            <span class="menu-user-month" data-auth-month-minutes>0 min no mes</span>
          </div>
        </div>
      </section>
    `;
  }

  function buildSidebarLink(item) {
    const adminOnlyAttributes = item.adminOnly ? ' data-admin-only hidden' : "";

    return `
      <a href="${escapeHtml(item.page)}" class="menu-link sidebar-link ${escapeHtml(item.className || "")}" data-nav-page="${escapeHtml(item.page)}"${adminOnlyAttributes}>
        <span class="sidebar-link-main">${escapeHtml(item.label)}</span>
      </a>
    `;
  }

  function buildSidebarMarkup() {
    const navigationLinksMarkup = [...PRIMARY_NAV_ITEMS, ...SECONDARY_NAV_ITEMS]
      .map((item) => buildSidebarLink(item))
      .join("");

    return `
      <div class="menu-panel-inner">
        <header class="menu-panel-top">
          <a href="index.html" class="sidebar-brand-mark menu-panel-brand">Start 5</a>
          ${buildMenuButtonMarkup({ close: true })}
        </header>

        ${buildMenuUserMarkup()}

        <nav class="sidebar-nav" aria-label="Navegacao principal">
          <section class="sidebar-group sidebar-group-flat">
            ${navigationLinksMarkup}
          </section>
        </nav>

        <footer class="sidebar-footer">
          <button type="button" class="menu-link sidebar-link sidebar-link-logout" data-logout>
            <span class="sidebar-link-main">Sair</span>
          </button>
        </footer>
      </div>
    `;
  }

  function setActiveNavigation() {
    document.querySelectorAll("[data-nav-page]").forEach((link) => {
      const isActive = String(link.getAttribute("data-nav-page") || "").toLowerCase() === currentPage;
      link.classList.toggle("is-active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  function updateMenuButtonState(isOpen) {
    const menuToggle = document.getElementById("menuToggle");

    if (!menuToggle) {
      return;
    }

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  }

  function closeSidebar() {
    body?.classList.remove("menu-open");
    updateMenuButtonState(false);
  }

  function openSidebar() {
    body?.classList.add("menu-open");
    updateMenuButtonState(true);
  }

  function toggleSidebar() {
    if (body?.classList.contains("menu-open")) {
      closeSidebar();
      return;
    }

    openSidebar();
  }

  function bindSidebarNavigation() {
    const menuToggle = document.getElementById("menuToggle");
    const menuClose = document.getElementById("menuClose");
    const menuPanel = document.getElementById("menuPanel");

    menuToggle?.addEventListener("click", toggleSidebar);
    menuClose?.addEventListener("click", closeSidebar);

    menuPanel?.addEventListener("click", (event) => {
      if (event.target === menuPanel) {
        closeSidebar();
        return;
      }

      const interactiveTarget = event.target.closest("[data-nav-page], [data-logout]");

      if (interactiveTarget) {
        closeSidebar();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && body?.classList.contains("menu-open")) {
        closeSidebar();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1080) {
        closeSidebar();
      }
    });
  }

  function renderProtectedNavigation() {
    const headerInner = document.querySelector(".header-inner");
    const menuPanel = document.getElementById("menuPanel");

    if (!headerInner || !menuPanel) {
      return;
    }

    headerInner.innerHTML = buildHeaderMarkup();
    menuPanel.innerHTML = buildSidebarMarkup();
    setActiveNavigation();
    bindSidebarNavigation();
  }

  function applyJpgPageBackground() {
    if (!body) {
      return;
    }

    const jpgBackgroundByPage = {
      "index.html": "/images/home.jpg",
      "dashboard.html": "/images/painel.jpg",
      "questoes.html": "/images/painel.jpg",
      "rotina.html": "/images/rotina.jpg",
      "redacao.html": "/images/redacao.jpg",
    };

    const backgroundPath = jpgBackgroundByPage[currentPage];

    if (!backgroundPath) {
      return;
    }

    const probeImage = new Image();

    probeImage.onload = () => {
      body.style.setProperty("--page-background-image", `url("${backgroundPath}")`);
    };

    probeImage.src = backgroundPath;
  }

  window.Start5Main = {
    version: "2.0.0",
    currentPage,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    sidebarNavigation: {
      isManaged: false,
    },
  };

  if (!isProtectedPage) {
    return;
  }

  applyJpgPageBackground();
  renderProtectedNavigation();
  window.Start5Main.sidebarNavigation.isManaged = true;
})();
