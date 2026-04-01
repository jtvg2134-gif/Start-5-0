(function initializeAdminProofCenter() {
  const body = document.body;
  const view = body?.dataset.proofCenterView || "";

  if (!view) {
    return;
  }

  const state = {
    reference: null,
    summary: null,
    proofs: [],
    questions: [],
    answerKeys: [],
    imports: [],
    queue: [],
    results: null,
    currentProofDetail: null,
    currentQuestionDetail: null,
    currentAnswerKeyRows: [],
    currentAnswerKeyItems: [],
    currentAnswerKeyQuestion: null,
    currentAnswerKeyDetail: null,
    currentImportDetail: null,
  };

  const labelMap = {
    draft: "Rascunho",
    review: "Em revisao",
    published: "Publicada",
    active: "Ativa",
    archived: "Arquivada",
    manual: "Manual",
    semiassistida: "Semiassistida",
    automatica: "Automatica",
    automatica_com_tolerancia: "Automatica com tolerancia",
    objetiva: "Objetiva",
    numerica: "Numerica",
    expressao_simples: "Expressao simples",
    discursiva_calculo: "Discursiva de calculo",
    alternativa: "Alternativa",
    texto: "Texto",
    numero: "Numero",
    expressao: "Expressao",
    exatas: "Exatas",
    linguagens: "Linguagens",
    humanas: "Humanas",
    natureza: "Natureza",
    mista: "Mista",
    fundamentos: "Fundamentos",
    intermediario: "Intermediario",
    avancado: "Avancado",
    colar_texto: "Colar texto",
    pdf_assistido: "PDF assistido",
    banco_questoes: "Banco de questoes",
    simulado: "Simulado",
    lista: "Lista",
    prova_antiga: "Prova antiga",
    diagnostico: "Diagnostico",
    revisao: "Revisao",
    outro: "Outro",
    pendente: "Pendente",
    processando: "Processando",
    revisao: "Em revisao",
    concluida: "Concluida",
    erro: "Erro",
    falhou: "Falhou",
    failed: "Falhou",
    corrigida_automatica: "Corrigida automatica",
    baixa_confianca: "Baixa confianca",
    revisao_manual: "Revisao manual",
    em_andamento: "Em andamento",
    enviada: "Enviada",
    em_correcao: "Em correcao",
    finalizada: "Finalizada",
    ajustada: "Ajustada",
    confirmada: "Confirmada",
    invalidada: "Invalidada",
    comentada: "Comentada",
    pdf_original: "PDF original",
    pdf_gabarito: "PDF gabarito",
    imagem_apoio: "Imagem de apoio",
    anexo: "Anexo",
    media: "Media",
    facil: "Facil",
    dificil: "Dificil",
    oficial: "Oficial",
    ajustado: "Ajustado",
    provisorio: "Provisorio",
    importado: "Importado",
    revisado: "Revisado",
    multipla_escolha: "Multipla escolha",
    verdadeiro_falso: "Verdadeiro/Falso",
    numerica_exata: "Numerica exata",
    numerica_com_tolerancia: "Numerica com tolerancia",
    discursiva_manual: "Discursiva/manual",
    hibrida: "Hibrida",
    automatic: "Automatica",
    suggested: "Sugerida",
    manual: "Manual",
    uploaded: "Enviado",
    extracting_text: "Extraindo texto",
    ocr_required: "OCR necessario",
    matching_proof: "Reconhecendo prova",
    matched_automatic: "Correspondencia automatica",
    matched_suggested: "Correspondencia sugerida",
    manual_review_required: "Revisao manual",
    parsed_questions: "Questoes segmentadas",
    questions_imported: "Questoes importadas",
    ready_for_correction: "Pronta para correcao",
    pending: "Pendente",
    reviewed: "Revisado",
    imported: "Importado",
    ignored: "Ignorado",
  };

  function api(path, options) {
    return (window.Start5ProofCenterApi?.request || window.Start5Auth.apiRequest)(path, options);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatLabel(value, fallback = "Sem dado") {
    const normalized = String(value || "").trim();

    if (!normalized) {
      return fallback;
    }

    return (
      labelMap[normalized] ||
      normalized
        .split(/[_\s-]+/g)
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join(" ")
    );
  }

  function getTone(value) {
    const normalized = String(value || "").trim().toLowerCase();

    if (
      [
        "published",
        "active",
        "finalizada",
        "corrigida_automatica",
        "concluida",
        "automatic",
        "matched_automatic",
        "ready_for_correction",
        "imported",
      ].includes(normalized)
    ) {
      return normalized;
    }

    if (
      [
        "review",
        "revisao",
        "processando",
        "revisao_manual",
        "semiassistida",
        "em_correcao",
        "baixa_confianca",
        "suggested",
        "extracting_text",
        "matching_proof",
        "matched_suggested",
        "parsed_questions",
        "reviewed",
      ].includes(normalized)
    ) {
      return normalized;
    }

    if (
      [
        "draft",
        "pendente",
        "manual",
        "enviada",
        "uploaded",
        "ocr_required",
        "manual_review_required",
        "pending",
      ].includes(normalized)
    ) {
      return normalized;
    }

    if (["archived", "rejected", "falhou", "erro", "failed", "ignored"].includes(normalized)) {
      return normalized;
    }

    return "draft";
  }

  function buildStatusBadge(value) {
    return `<span class="proof-center-status" data-tone="${escapeHtml(getTone(value))}">${escapeHtml(formatLabel(value))}</span>`;
  }

  function formatDate(value) {
    if (!value) {
      return "Sem data";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Sem data";
    }

    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatNumber(value) {
    const safeValue = Number(value) || 0;
    return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(2).replace(".", ",");
  }

  function normalizeId(value) {
    return String(value || "").trim();
  }

  function getQueryValue(name) {
    const params = new URLSearchParams(window.location.search);
    return normalizeId(params.get(name));
  }

  function updateQueryValue(name, value) {
    const url = new URL(window.location.href);
    const normalizedValue = normalizeId(value);

    if (normalizedValue) {
      url.searchParams.set(name, normalizedValue);
    } else {
      url.searchParams.delete(name);
    }

    window.history.replaceState({}, "", url.toString());
  }

  function buildAdminHref(page, paramName, value) {
    const normalizedValue = normalizeId(value);
    return normalizedValue ? `${page}?${paramName}=${encodeURIComponent(normalizedValue)}` : page;
  }

  function resolveApiHref(path) {
    const normalizedPath = String(path || "").trim();

    if (!normalizedPath) {
      return "";
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    if (typeof window.Start5ProofCenterApi?.mapPath === "function") {
      return window.Start5ProofCenterApi.mapPath(normalizedPath);
    }

    return normalizedPath;
  }

  function setFeedback(element, message, stateName = "") {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    if (stateName) {
      element.dataset.state = stateName;
    } else {
      delete element.dataset.state;
    }
  }

  function renderEmpty(container, message) {
    if (!container) {
      return;
    }

    container.innerHTML = `<div class="proof-center-empty">${escapeHtml(message)}</div>`;
  }

  function buildFileLinkMarkup(file, label = "") {
    const href = resolveApiHref(file?.url || "");

    if (!href) {
      return "";
    }

    return `
      <a class="proof-center-inline-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer">
        ${escapeHtml(label || file?.nomeOriginal || "Abrir arquivo")}
      </a>
    `;
  }

  function renderProofFilesSummary(container, files) {
    if (!container) {
      return;
    }

    const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];

    container.innerHTML = safeFiles.length
      ? safeFiles
          .map(
            (file) => `
              <article class="proof-center-file-row">
                <div class="proof-center-stack">
                  <strong>${escapeHtml(file.nomeOriginal || "Arquivo")}</strong>
                  <span class="proof-center-muted">${escapeHtml([formatLabel(file.tipoArquivo), formatNumber(file.tamanhoBytes || 0), "bytes"].join(" · "))}</span>
                </div>
                ${buildFileLinkMarkup(file, "Abrir")}
              </article>
            `
          )
          .join("")
      : `<div class="proof-center-empty">Nenhum arquivo vinculado a essa prova ainda.</div>`;
  }

  function populateSelect(select, items, options = {}) {
    if (!select) {
      return;
    }

    const {
      includeEmpty = true,
      emptyLabel = "Todos",
      selectedValue = "",
      getValue = (item) => item?.value ?? item?.id ?? item,
      getLabel = (item) => item?.label ?? item?.titulo ?? item?.title ?? item?.nome ?? formatLabel(item?.value ?? item),
    } = options;
    const normalizedSelected = String(selectedValue ?? select.value ?? "");
    const markup = [];

    if (includeEmpty) {
      markup.push(`<option value="">${escapeHtml(emptyLabel)}</option>`);
    }

    (Array.isArray(items) ? items : []).forEach((item) => {
      const optionValue = String(getValue(item) ?? "");
      const optionLabel = String(getLabel(item) ?? optionValue);
      markup.push(
        `<option value="${escapeHtml(optionValue)}"${optionValue === normalizedSelected ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`
      );
    });

    select.innerHTML = markup.join("");
  }

  function proofDisplayTitle(proof) {
    return proof?.titulo || "Prova sem titulo";
  }

  function questionDisplayTitle(question) {
    return question?.tituloInterno || (question?.enunciado ? question.enunciado.slice(0, 80) : "Questao sem titulo");
  }

  function slugifyProofPart(value) {
    return String(value || "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toUpperCase();
  }

  function buildProofCodeFromValueParts(parts) {
    return (Array.isArray(parts) ? parts : [])
      .map((item) => slugifyProofPart(item))
      .filter(Boolean)
      .join("-");
  }

  function buildProofIdentityParts(proof = {}) {
    return [
      proof.examProvider || proof.disciplina || "",
      proof.examYear || proof.ano || "",
      proof.examDay || "",
      proof.subjectGroup || proof.area || "",
      proof.bookletColor || "",
      proof.examVersion || "",
    ].filter(Boolean);
  }

  function buildProofIdentityText(proof = {}) {
    const parts = [
      proof.proofCode || buildProofCodeFromValueParts(buildProofIdentityParts(proof)),
      proof.examProvider || proof.examName || "",
      proof.examYear || proof.ano || "",
      proof.examDay || "",
      proof.subjectGroup || "",
      proof.bookletColor ? `Caderno ${proof.bookletColor}` : "",
    ].filter(Boolean);

    return parts.join(" · ");
  }

  function buildProofMatchLabel(importEntry = {}) {
    if (!importEntry?.matchingLevel) {
      return "Sem correspondencia";
    }

    const base = formatLabel(importEntry.matchingLevel);
    const confidence = Number(importEntry.matchingConfidence);

    if (Number.isFinite(confidence) && confidence > 0) {
      return `${base} · ${formatNumber(confidence)}%`;
    }

    return base;
  }

  function groupQueueByProofId(queue = []) {
    return (Array.isArray(queue) ? queue : []).reduce((accumulator, row) => {
      const proofId = normalizeId(row.provaId || row.prova?.id);

      if (!proofId) {
        return accumulator;
      }

      accumulator[proofId] = (accumulator[proofId] || 0) + 1;
      return accumulator;
    }, {});
  }

  async function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const dataBase64 = result.includes(",") ? result.split(",").pop() : result;
        resolve({
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          sizeBytes: Number(file.size) || 0,
          dataBase64,
        });
      };
      reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
      reader.readAsDataURL(file);
    });
  }

  async function ensureReference() {
    if (state.reference) {
      return state.reference;
    }

    const response = await api("/api/admin/proof-center/reference");
    state.reference = response.reference || response || {};
    return state.reference;
  }

  async function ensureProofs(force = false) {
    if (!force && state.proofs.length) {
      return state.proofs;
    }

    const response = await api("/api/admin/proof-center/proofs");
    state.proofs = Array.isArray(response.proofs) ? response.proofs : [];
    return state.proofs;
  }

  async function ensureQuestions(force = false) {
    if (!force && state.questions.length) {
      return state.questions;
    }

    const response = await api("/api/admin/proof-center/questions");
    state.questions = Array.isArray(response.questions) ? response.questions : [];
    return state.questions;
  }

  async function ensureImports(force = false) {
    if (!force && state.imports.length) {
      return state.imports;
    }

    const response = await api("/api/admin/proof-center/imports");
    state.imports = Array.isArray(response.imports) ? response.imports : [];
    return state.imports;
  }

  async function ensureAnswerKeys(force = false) {
    if (!force && state.answerKeys.length) {
      return state.answerKeys;
    }

    const response = await api("/api/admin/proof-center/answer-keys");
    state.answerKeys = Array.isArray(response.answerKeys) ? response.answerKeys : [];
    return state.answerKeys;
  }

  async function ensureQueue(force = false) {
    if (!force && state.queue.length) {
      return state.queue;
    }

    const response = await api("/api/admin/proof-center/correction/queue");
    state.queue = Array.isArray(response.queue) ? response.queue : [];
    return state.queue;
  }

  async function ensureResults(force = false) {
    if (!force && state.results) {
      return state.results;
    }

    const response = await api("/api/admin/proof-center/results");
    state.results = response.results || response || null;
    return state.results;
  }

  function createAnswerKeyRow(type = "texto") {
    return {
      tipoGabarito: type,
      respostaBruta: "",
      respostaNormalizada: "",
      valorNumerico: "",
      expressaoCanonica: "",
      unidade: "",
      toleranciaAbsoluta: "",
      toleranciaPercentual: "",
      principal: false,
      observacao: "",
    };
  }

  function renderAnswerKeyRows(container, rows, options = {}) {
    if (!container) {
      return;
    }

    const keyTypes = state.reference?.answerKeyTypes || ["alternativa", "texto", "numero", "expressao"];
    const prefix = String(options.prefix || "answerKey");

    if (!rows.length) {
      container.innerHTML = "";
      return;
    }

    container.innerHTML = rows
      .map((row, index) => `
        <article class="proof-center-answer-row" data-answer-row="${index}" data-prefix="${escapeHtml(prefix)}">
          <div class="proof-center-toolbar">
            <strong>Gabarito ${index + 1}</strong>
            <button type="button" class="proof-center-button proof-center-button-secondary" data-answer-remove="${index}">
              Remover
            </button>
          </div>
          <div class="proof-center-answer-grid">
            <label class="proof-center-field">
              <span class="proof-center-label">Tipo</span>
              <select class="admin-modal-input" data-answer-field="tipoGabarito">
                ${keyTypes
                  .map((type) => `<option value="${escapeHtml(type)}"${type === row.tipoGabarito ? " selected" : ""}>${escapeHtml(formatLabel(type))}</option>`)
                  .join("")}
              </select>
            </label>
            <label class="proof-center-field">
              <span class="proof-center-label">Resposta bruta</span>
              <input class="admin-modal-input" data-answer-field="respostaBruta" value="${escapeHtml(row.respostaBruta)}" />
            </label>
            <label class="proof-center-field">
              <span class="proof-center-label">Resposta normalizada</span>
              <input class="admin-modal-input" data-answer-field="respostaNormalizada" value="${escapeHtml(row.respostaNormalizada)}" />
            </label>
          </div>
          <div class="proof-center-answer-grid">
            <label class="proof-center-field">
              <span class="proof-center-label">Valor numerico</span>
              <input type="number" step="any" class="admin-modal-input" data-answer-field="valorNumerico" value="${escapeHtml(row.valorNumerico)}" />
            </label>
            <label class="proof-center-field">
              <span class="proof-center-label">Expressao canonica</span>
              <input class="admin-modal-input" data-answer-field="expressaoCanonica" value="${escapeHtml(row.expressaoCanonica)}" />
            </label>
            <label class="proof-center-field">
              <span class="proof-center-label">Unidade</span>
              <input class="admin-modal-input" data-answer-field="unidade" value="${escapeHtml(row.unidade)}" />
            </label>
          </div>
          <div class="proof-center-answer-grid">
            <label class="proof-center-field">
              <span class="proof-center-label">Tol. absoluta</span>
              <input type="number" step="any" class="admin-modal-input" data-answer-field="toleranciaAbsoluta" value="${escapeHtml(row.toleranciaAbsoluta)}" />
            </label>
            <label class="proof-center-field">
              <span class="proof-center-label">Tol. percentual</span>
              <input type="number" step="any" class="admin-modal-input" data-answer-field="toleranciaPercentual" value="${escapeHtml(row.toleranciaPercentual)}" />
            </label>
            <label class="proof-center-field">
              <span class="proof-center-label">Principal</span>
              <select class="admin-modal-input" data-answer-field="principal">
                <option value="0"${row.principal ? "" : " selected"}>Nao</option>
                <option value="1"${row.principal ? " selected" : ""}>Sim</option>
              </select>
            </label>
          </div>
          <label class="proof-center-field">
            <span class="proof-center-label">Observacao</span>
            <textarea class="admin-modal-input proof-center-textarea-small" data-answer-field="observacao">${escapeHtml(row.observacao)}</textarea>
          </label>
        </article>
      `)
      .join("");
  }

  function collectAnswerKeyRows(container) {
    if (!container) {
      return [];
    }

    return Array.from(container.querySelectorAll("[data-answer-row]")).map((row) => ({
      tipoGabarito: row.querySelector('[data-answer-field="tipoGabarito"]')?.value || "texto",
      respostaBruta: row.querySelector('[data-answer-field="respostaBruta"]')?.value || "",
      respostaNormalizada: row.querySelector('[data-answer-field="respostaNormalizada"]')?.value || "",
      valorNumerico: row.querySelector('[data-answer-field="valorNumerico"]')?.value || "",
      expressaoCanonica: row.querySelector('[data-answer-field="expressaoCanonica"]')?.value || "",
      unidade: row.querySelector('[data-answer-field="unidade"]')?.value || "",
      toleranciaAbsoluta: row.querySelector('[data-answer-field="toleranciaAbsoluta"]')?.value || "",
      toleranciaPercentual: row.querySelector('[data-answer-field="toleranciaPercentual"]')?.value || "",
      principal: row.querySelector('[data-answer-field="principal"]')?.value === "1",
      observacao: row.querySelector('[data-answer-field="observacao"]')?.value || "",
    }));
  }

  function buildProofCard(proof) {
    const identityText = buildProofIdentityText(proof);
    const importStatus = proof.latestImportProcessingStatus || proof.latestImportStatus || "";
    const matchStatus = proof.latestImportMatchingLevel || "";

    return `
      <article class="proof-center-card">
        <div class="proof-center-card-head">
          <div class="proof-center-stack">
            <strong class="proof-center-card-title">${escapeHtml(proofDisplayTitle(proof))}</strong>
            <span class="proof-center-muted">${escapeHtml(identityText || proof.proofCode || "Identidade ainda em definicao")}</span>
          </div>
          ${buildStatusBadge(proof.status)}
        </div>
        <div class="proof-center-meta">
          <span class="proof-center-pill">${escapeHtml(proof.proofCode || "Sem codigo")}</span>
          <span class="proof-center-pill">${escapeHtml(formatLabel(proof.disciplina || proof.area || "exatas"))}</span>
          <span class="proof-center-pill">${escapeHtml(formatNumber(proof.counts?.totalQuestions || 0))} questoes</span>
          <span class="proof-center-pill">${escapeHtml(formatNumber(proof.activeAnswerKeyItemCount || 0))} itens no gabarito</span>
          ${importStatus ? `<span class="proof-center-pill">${escapeHtml(formatLabel(importStatus))}</span>` : ""}
          ${matchStatus ? `<span class="proof-center-pill">${escapeHtml(buildProofMatchLabel({ matchingLevel: matchStatus, matchingConfidence: proof.latestImportMatchingConfidence }))}</span>` : ""}
        </div>
        <div class="proof-center-card-actions">
          <span class="proof-center-muted">Atualizada em ${escapeHtml(formatDate(proof.updatedAt))}</span>
          <div class="proof-center-inline-actions">
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-provas-criar.html", "proof", proof.id))}">Editar</a>
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-gabaritos.html", "proof", proof.id))}">Gabarito</a>
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-importacao.html", "proof", proof.id))}">PDF</a>
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-provas-montagem.html", "proof", proof.id))}">Montagem</a>
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-correcao.html", "proof", proof.id))}">Correcao</a>
          </div>
        </div>
      </article>
    `;
  }

  function buildQuestionCard(question) {
    return `
      <article class="proof-center-card">
        <div class="proof-center-card-head">
          <div class="proof-center-stack">
            <strong class="proof-center-card-title">${escapeHtml(questionDisplayTitle(question))}</strong>
            <p class="proof-center-copy">${escapeHtml((question.enunciado || "").slice(0, 220) || "Questao pronta para receber gabarito e montagem.")}</p>
          </div>
          ${buildStatusBadge(question.status)}
        </div>
        <div class="proof-center-meta">
          <span class="proof-center-pill">${escapeHtml(formatLabel(question.tipoQuestao))}</span>
          <span class="proof-center-pill">${escapeHtml(formatLabel(question.metodoCorrecao))}</span>
          <span class="proof-center-pill">${escapeHtml(formatLabel(question.area || "exatas"))}</span>
          <span class="proof-center-pill">${escapeHtml(formatNumber(question.usageCount || 0))} provas</span>
        </div>
        <div class="proof-center-card-actions">
          <span class="proof-center-muted">${escapeHtml(question.assunto || "Sem assunto")} · ${escapeHtml(question.subassunto || "Sem subassunto")}</span>
          <div class="proof-center-inline-actions">
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-questao-editar.html", "question", question.id))}">Editar</a>
            <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-questao-editar.html", "question", question.id))}">Questao</a>
          </div>
        </div>
      </article>
    `;
  }

  function buildHubProofRow(proof) {
    return `
      <a class="proof-center-hub-row" href="${escapeHtml(buildAdminHref("admin-provas-montagem.html", "proof", proof.id))}">
        <div class="proof-center-hub-row-head">
          <div class="proof-center-hub-row-copy">
            <strong>${escapeHtml(proofDisplayTitle(proof))}</strong>
            <span>${escapeHtml([formatLabel(proof.disciplina || proof.area || "exatas"), proof.ano || "Sem ano", `${formatNumber(proof.counts?.totalQuestions || 0)} questoes`].join(" · "))}</span>
          </div>
          ${buildStatusBadge(proof.status)}
        </div>
      </a>
    `;
  }

  function buildHubQuestionRow(question) {
    return `
      <a class="proof-center-hub-row" href="${escapeHtml(buildAdminHref("admin-questao-editar.html", "question", question.id))}">
        <div class="proof-center-hub-row-head">
          <div class="proof-center-hub-row-copy">
            <strong>${escapeHtml(questionDisplayTitle(question))}</strong>
            <span>${escapeHtml([formatLabel(question.tipoQuestao), formatLabel(question.metodoCorrecao), question.assunto || "Sem assunto"].join(" · "))}</span>
          </div>
          ${buildStatusBadge(question.status)}
        </div>
      </a>
    `;
  }

  function buildHubImportRow(item) {
    return `
      <a class="proof-center-hub-row" href="${escapeHtml(buildAdminHref("admin-importacao.html", "proof", item.provaId || ""))}">
        <div class="proof-center-hub-row-head">
          <div class="proof-center-hub-row-copy">
            <strong>${escapeHtml(item.provaTitulo || "Importacao sem prova")}</strong>
            <span>${escapeHtml([formatLabel(item.tipoArquivo || "anexo"), `${String(item.totalQuestoesDetectadas || 0)} questoes`, formatDate(item.createdAt)].join(" · "))}</span>
          </div>
          ${buildStatusBadge(item.status)}
        </div>
      </a>
    `;
  }

  async function loadHub() {
    const summaryResponse = await api("/api/admin/proof-center/summary");
    state.summary = summaryResponse.summary || summaryResponse || null;

    const counts = state.summary?.counts || {};
    const countMap = {
      proofCenterSummaryProofs: counts.totalProofs,
      proofCenterSummaryBank: counts.totalMasterQuestions,
      proofCenterSummaryMounted: counts.totalMountedQuestions,
      proofCenterSummaryResponses: counts.totalResponses,
      proofCenterSummaryPending: counts.totalPendingReview,
      proofCenterSummaryImports: counts.totalImports,
    };

    Object.entries(countMap).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = formatNumber(value || 0);
      }
    });

    const recentProofs = document.getElementById("proofCenterRecentProofs");
    const recentQuestions = document.getElementById("proofCenterRecentQuestions");
    const recentImports = document.getElementById("proofCenterRecentImports");

    if (recentProofs) {
      recentProofs.innerHTML = state.summary?.recentProofs?.length
        ? state.summary.recentProofs.map(buildHubProofRow).join("")
        : `<div class="proof-center-empty">Nenhuma prova estruturada cadastrada ainda.</div>`;
    }

    if (recentQuestions) {
      recentQuestions.innerHTML = state.summary?.recentQuestions?.length
        ? state.summary.recentQuestions.map(buildHubQuestionRow).join("")
        : `<div class="proof-center-empty">O banco de questoes ainda esta vazio.</div>`;
    }

    if (recentImports) {
      recentImports.innerHTML = state.summary?.recentImports?.length
        ? state.summary.recentImports.map(buildHubImportRow).join("")
        : `<div class="proof-center-empty">Nenhuma importacao assistida foi registrada ainda.</div>`;
    }
  }

  function renderProofListPage() {
    const searchValue = String(document.getElementById("proofListSearchInput")?.value || "").trim().toLowerCase();
    const statusValue = String(document.getElementById("proofListStatusSelect")?.value || "").trim();
    const areaValue = String(document.getElementById("proofListAreaSelect")?.value || "").trim();
    const container = document.getElementById("proofListContainer");
    const countValue = document.getElementById("proofListCountValue");
    const filteredProofs = state.proofs.filter((proof) => {
      const haystack = [
        proof.titulo,
        proof.proofCode,
        proof.disciplina,
        proof.examProvider,
        proof.examName,
        proof.subjectGroup,
        proof.tipoProva,
        proof.area,
        proof.ano,
      ]
        .join(" ")
        .toLowerCase();

      if (searchValue && !haystack.includes(searchValue)) {
        return false;
      }

      if (statusValue && proof.status !== statusValue) {
        return false;
      }

      if (areaValue && proof.area !== areaValue) {
        return false;
      }

      return true;
    });

    if (countValue) {
      countValue.textContent = `${filteredProofs.length} provas`;
    }

    if (!container) {
      return;
    }

    container.innerHTML = filteredProofs.length
      ? filteredProofs.map(buildProofCard).join("")
      : `<div class="proof-center-empty">Nenhuma prova combina com os filtros atuais.</div>`;
  }

  async function loadProofListPage() {
    await Promise.all([ensureReference(), ensureProofs(true)]);
    populateSelect(document.getElementById("proofListStatusSelect"), state.reference?.proofStatuses || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("proofListAreaSelect"), state.reference?.proofAreas || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });

    ["proofListSearchInput", "proofListStatusSelect", "proofListAreaSelect"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", renderProofListPage);
      document.getElementById(id)?.addEventListener("change", renderProofListPage);
    });

    renderProofListPage();
  }

  function fillProofForm(detail) {
    const proof = detail?.proof || detail;
    const files = Array.isArray(detail?.files) ? detail.files : [];

    state.currentProofDetail = detail?.proof ? detail : state.currentProofDetail;

    document.getElementById("proofCreateIdInput").value = proof?.id || "";
    document.getElementById("proofCreateTitleInput").value = proof?.titulo || "";
    document.getElementById("proofCreateDescriptionInput").value = proof?.descricao || "";
    document.getElementById("proofCreateAreaSelect").value = proof?.area || "exatas";
    document.getElementById("proofCreateLevelSelect").value = proof?.nivel || "misto";
    document.getElementById("proofCreateYearInput").value = proof?.ano || "";
    document.getElementById("proofCreateDisciplineInput").value = proof?.disciplina || "";
    document.getElementById("proofCreateTypeSelect").value = proof?.tipoProva || "";
    document.getElementById("proofCreateStatusSelect").value = proof?.status || "draft";
    document.getElementById("proofCreateOriginSelect").value = proof?.origem || "manual";
    document.getElementById("proofCreateTimeInput").value = proof?.tempoLimiteMin || "";
    document.getElementById("proofCreateNotesInput").value = proof?.observacoes || "";
    renderProofFilesSummary(document.getElementById("proofCreateFilesList"), files);
  }

  async function loadProofCreatePage() {
    await Promise.all([ensureReference(), ensureProofs(true)]);
    populateSelect(document.getElementById("proofCreateAreaSelect"), state.reference?.proofAreas || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "exatas",
    });
    populateSelect(document.getElementById("proofCreateLevelSelect"), state.reference?.proofLevels || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "misto",
    });
    populateSelect(document.getElementById("proofCreateTypeSelect"), state.reference?.proofTypes || [], {
      includeEmpty: true,
      emptyLabel: "Selecione",
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("proofCreateStatusSelect"), state.reference?.proofStatuses || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "draft",
    });
    populateSelect(document.getElementById("proofCreateOriginSelect"), state.reference?.proofOrigins || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "manual",
    });

    const proofId = getQueryValue("proof");
    if (proofId) {
      const detail = await api(`/api/admin/proof-center/proofs/${proofId}`);
      fillProofForm(detail);
    }

    const recentList = document.getElementById("proofCreateRecentList");
    if (recentList) {
      recentList.innerHTML = state.proofs.length
        ? state.proofs.slice(0, 4).map(buildProofCard).join("")
        : `<div class="proof-center-empty">As provas criadas vao aparecer aqui.</div>`;
    }

    const form = document.getElementById("proofCreateForm");
    const feedback = document.getElementById("proofCreateFeedback");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback(feedback, "Salvando prova...", "");

      try {
        const payload = {
          titulo: document.getElementById("proofCreateTitleInput").value,
          descricao: document.getElementById("proofCreateDescriptionInput").value,
          area: document.getElementById("proofCreateAreaSelect").value,
          nivel: document.getElementById("proofCreateLevelSelect").value,
          ano: document.getElementById("proofCreateYearInput").value,
          disciplina: document.getElementById("proofCreateDisciplineInput").value,
          tipoProva: document.getElementById("proofCreateTypeSelect").value,
          status: document.getElementById("proofCreateStatusSelect").value,
          origem: document.getElementById("proofCreateOriginSelect").value,
          tempoLimiteMin: document.getElementById("proofCreateTimeInput").value,
          observacoes: document.getElementById("proofCreateNotesInput").value,
        };
        const pdfFile = document.getElementById("proofCreatePdfInput")?.files?.[0] || null;
        const answerKeyFile = document.getElementById("proofCreateAnswerKeyPdfInput")?.files?.[0] || null;

        if (pdfFile) {
          payload.pdfOriginal = await readFileAsBase64(pdfFile);
        }

        if (answerKeyFile) {
          payload.gabaritoPdf = await readFileAsBase64(answerKeyFile);
        }

        const currentProofId = normalizeId(document.getElementById("proofCreateIdInput").value);
        const detail = currentProofId
          ? await api(`/api/admin/proof-center/proofs/${currentProofId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          : await api("/api/admin/proof-center/proofs", {
              method: "POST",
              body: JSON.stringify(payload),
            });
        const nextProofId = normalizeId(detail?.proof?.id || currentProofId);

        await ensureProofs(true);
        fillProofForm(detail);
        if (nextProofId) {
          updateQueryValue("proof", nextProofId);
        }
        const pdfInput = document.getElementById("proofCreatePdfInput");
        const answerKeyInput = document.getElementById("proofCreateAnswerKeyPdfInput");
        if (pdfInput) {
          pdfInput.value = "";
        }
        if (answerKeyInput) {
          answerKeyInput.value = "";
        }

        setFeedback(feedback, "Prova salva na arquitetura estruturada.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel salvar a prova.", "error");
      }
    });
  }

  function renderAssemblySummary(detail) {
    const container = document.getElementById("proofAssemblySummary");

    if (!container) {
      return;
    }

    if (!detail?.proof) {
      renderEmpty(container, "Selecione uma prova para montar.");
      return;
    }

    container.innerHTML = `
      <article class="proof-center-highlight">
        <div class="proof-center-card-head">
          <div class="proof-center-stack">
            <strong class="proof-center-card-title">${escapeHtml(proofDisplayTitle(detail.proof))}</strong>
            <p class="proof-center-copy">${escapeHtml(detail.proof.descricao || "Montagem manual a partir do banco estruturado de questoes.")}</p>
          </div>
          ${buildStatusBadge(detail.proof.status)}
        </div>
        <div class="proof-center-info-grid">
          <article class="proof-center-info-card">
            <span>Disciplina</span>
            <strong>${escapeHtml(formatLabel(detail.proof.disciplina || detail.proof.area))}</strong>
          </article>
          <article class="proof-center-info-card">
            <span>Questoes montadas</span>
            <strong>${escapeHtml(formatNumber(detail.items?.length || 0))}</strong>
          </article>
          <article class="proof-center-info-card">
            <span>Tempo limite</span>
            <strong>${escapeHtml(formatNumber(detail.proof.tempoLimiteMin || 0))} min</strong>
          </article>
          <article class="proof-center-info-card">
            <span>Arquivos</span>
            <strong>${escapeHtml(formatNumber(detail.files?.length || 0))}</strong>
          </article>
        </div>
      </article>
    `;
  }

  function renderAssemblyMounted(detail) {
    const container = document.getElementById("proofAssemblyMountedList");

    if (!container) {
      return;
    }

    if (!detail?.items?.length) {
      renderEmpty(container, "Nenhuma questao foi montada nessa prova ainda.");
      return;
    }

    container.innerHTML = detail.items
      .map(
        (item) => `
          <article class="proof-center-mount-card" data-mount-card="${escapeHtml(normalizeId(item.id))}">
            <div class="proof-center-card-head">
              <div class="proof-center-stack">
                <strong class="proof-center-card-title">Q${escapeHtml(formatNumber(item.numeroNaProva || 0))} · ${escapeHtml(questionDisplayTitle(item.questao))}</strong>
                <p class="proof-center-copy">${escapeHtml((item.questao?.enunciado || "").slice(0, 180) || "Sem enunciado congelado na prova.")}</p>
              </div>
              ${buildStatusBadge(item.questao?.status)}
            </div>
            <div class="proof-center-meta">
              <span class="proof-center-pill">${escapeHtml(formatLabel(item.questao?.tipoQuestao))}</span>
              <span class="proof-center-pill">${escapeHtml(formatLabel(item.questao?.metodoCorrecao))}</span>
              <span class="proof-center-pill">${escapeHtml(item.questao?.assunto || "Sem assunto")}</span>
            </div>
            <div class="proof-center-mount-inputs">
              <label class="proof-center-field">
                <span class="proof-center-label">Numero</span>
                <input type="number" class="admin-modal-input" data-mount-field="numeroNaProva" value="${escapeHtml(item.numeroNaProva)}" />
              </label>
              <label class="proof-center-field">
                <span class="proof-center-label">Ordem</span>
                <input type="number" class="admin-modal-input" data-mount-field="ordem" value="${escapeHtml(item.ordem)}" />
              </label>
              <label class="proof-center-field">
                <span class="proof-center-label">Peso</span>
                <input type="number" step="any" class="admin-modal-input" data-mount-field="peso" value="${escapeHtml(item.peso)}" />
              </label>
              <label class="proof-center-field">
                <span class="proof-center-label">Obrigatoria</span>
                <select class="admin-modal-input" data-mount-field="obrigatoria">
                  <option value="1"${item.obrigatoria ? " selected" : ""}>Sim</option>
                  <option value="0"${item.obrigatoria ? "" : " selected"}>Nao</option>
                </select>
              </label>
            </div>
            <label class="proof-center-field">
              <span class="proof-center-label">Versao do enunciado na prova</span>
              <textarea class="admin-modal-input proof-center-textarea-small" data-mount-field="versaoEnunciado">${escapeHtml(item.versaoEnunciado || "")}</textarea>
            </label>
            <div class="proof-center-mount-actions">
              <span class="proof-center-muted">Vinculada ao banco estruturado${normalizeId(item.questaoId) ? ` · ID ${escapeHtml(normalizeId(item.questaoId).slice(0, 8))}` : ""}.</span>
              <div class="proof-center-inline-actions">
                <button type="button" class="proof-center-button" data-mount-save="${escapeHtml(normalizeId(item.id))}">Salvar ajuste</button>
                <button type="button" class="proof-center-button proof-center-button-danger" data-mount-remove="${escapeHtml(normalizeId(item.id))}">Remover</button>
              </div>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderAssemblyBank(detail) {
    const container = document.getElementById("proofAssemblyBankList");

    if (!container) {
      return;
    }

    const searchValue = String(document.getElementById("proofAssemblyQuestionSearchInput")?.value || "").trim().toLowerCase();
    const typeValue = String(document.getElementById("proofAssemblyQuestionTypeSelect")?.value || "").trim();
    const statusValue = String(document.getElementById("proofAssemblyQuestionStatusSelect")?.value || "").trim();
    const mountedIds = new Set((detail?.items || []).map((item) => normalizeId(item.questaoId)).filter(Boolean));
    const filteredQuestions = state.questions.filter((question) => {
      const haystack = [question.tituloInterno, question.enunciado, question.assunto, question.subassunto]
        .join(" ")
        .toLowerCase();

      if (mountedIds.has(normalizeId(question.id))) {
        return false;
      }

      if (searchValue && !haystack.includes(searchValue)) {
        return false;
      }

      if (typeValue && question.tipoQuestao !== typeValue) {
        return false;
      }

      if (statusValue && question.status !== statusValue) {
        return false;
      }

      return true;
    });

    container.innerHTML = filteredQuestions.length
      ? filteredQuestions
          .map(
            (question) => `
              <article class="proof-center-card">
                <div class="proof-center-card-head">
                  <div class="proof-center-stack">
                    <strong class="proof-center-card-title">${escapeHtml(questionDisplayTitle(question))}</strong>
                    <p class="proof-center-copy">${escapeHtml((question.enunciado || "").slice(0, 170))}</p>
                  </div>
                  ${buildStatusBadge(question.status)}
                </div>
                <div class="proof-center-meta">
                  <span class="proof-center-pill">${escapeHtml(formatLabel(question.tipoQuestao))}</span>
                  <span class="proof-center-pill">${escapeHtml(question.assunto || "Sem assunto")}</span>
                </div>
                <div class="proof-center-card-actions">
                  <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-questao-editar.html", "question", question.id))}">Editar</a>
                  <button type="button" class="proof-center-button" data-assembly-add="${escapeHtml(normalizeId(question.id))}">Adicionar na prova</button>
                </div>
              </article>
            `
          )
          .join("")
      : `<div class="proof-center-empty">Nenhuma questao disponivel com os filtros atuais.</div>`;
  }

  async function loadProofAssemblyPage() {
    await Promise.all([ensureReference(), ensureProofs(true), ensureQuestions(true)]);

    const proofSelect = document.getElementById("proofAssemblyProofSelect");
    populateSelect(proofSelect, state.proofs, {
      includeEmpty: false,
      getValue: (item) => item.id,
      getLabel: (item) => proofDisplayTitle(item),
      selectedValue: getQueryValue("proof") || state.proofs[0]?.id || "",
    });
    populateSelect(document.getElementById("proofAssemblyQuestionTypeSelect"), state.reference?.questionTypes || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("proofAssemblyQuestionStatusSelect"), state.reference?.questionStatuses || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });

    async function refreshDetail() {
      const proofId = normalizeId(proofSelect?.value);

      if (!proofId) {
        state.currentProofDetail = null;
        renderAssemblySummary(null);
        renderAssemblyMounted(null);
        renderAssemblyBank(null);
        return;
      }

      updateQueryValue("proof", proofId);
      state.currentProofDetail = await api(`/api/admin/proof-center/proofs/${proofId}`);
      renderAssemblySummary(state.currentProofDetail);
      renderAssemblyMounted(state.currentProofDetail);
      renderAssemblyBank(state.currentProofDetail);
    }

    proofSelect?.addEventListener("change", refreshDetail);
    ["proofAssemblyQuestionSearchInput", "proofAssemblyQuestionTypeSelect", "proofAssemblyQuestionStatusSelect"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => renderAssemblyBank(state.currentProofDetail));
      document.getElementById(id)?.addEventListener("change", () => renderAssemblyBank(state.currentProofDetail));
    });

    document.getElementById("proofAssemblyBankList")?.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-assembly-add]");

      if (!button || !state.currentProofDetail?.proof?.id) {
        return;
      }

      const questionId = normalizeId(button.dataset.assemblyAdd);
      const feedback = document.getElementById("proofAssemblyFeedback");

      try {
        setFeedback(feedback, "Adicionando questao na prova...", "");
        await api(`/api/admin/proof-center/proofs/${state.currentProofDetail.proof.id}/items`, {
          method: "POST",
          body: JSON.stringify({
            questaoId: questionId,
          }),
        });
        await refreshDetail();
        setFeedback(feedback, "Questao adicionada na montagem da prova.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel adicionar a questao.", "error");
      }
    });

    document.getElementById("proofAssemblyMountedList")?.addEventListener("click", async (event) => {
      const saveButton = event.target.closest("[data-mount-save]");
      const removeButton = event.target.closest("[data-mount-remove]");
      const feedback = document.getElementById("proofAssemblyFeedback");

      if (!saveButton && !removeButton) {
        return;
      }

      const mountId = normalizeId(saveButton?.dataset.mountSave || removeButton?.dataset.mountRemove);
      const card = event.target.closest("[data-mount-card]");

      if (!mountId || !card) {
        return;
      }

      try {
        if (saveButton) {
          setFeedback(feedback, "Salvando ajustes da montagem...", "");
          await api(`/api/admin/proof-center/proof-items/${mountId}`, {
            method: "PATCH",
            body: JSON.stringify({
              numeroNaProva: card.querySelector('[data-mount-field="numeroNaProva"]')?.value,
              ordem: card.querySelector('[data-mount-field="ordem"]')?.value,
              peso: card.querySelector('[data-mount-field="peso"]')?.value,
              obrigatoria: card.querySelector('[data-mount-field="obrigatoria"]')?.value === "1",
              versaoEnunciado: card.querySelector('[data-mount-field="versaoEnunciado"]')?.value,
            }),
          });
          setFeedback(feedback, "Montagem atualizada com sucesso.", "success");
        }

        if (removeButton) {
          setFeedback(feedback, "Removendo questao da prova...", "");
          await api(`/api/admin/proof-center/proof-items/${mountId}`, {
            method: "DELETE",
          });
          setFeedback(feedback, "Questao removida da prova.", "success");
        }

        await refreshDetail();
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel atualizar a montagem.", "error");
      }
    });

    await refreshDetail();
  }

  function renderQuestionBankPage() {
    const searchValue = String(document.getElementById("questionBankSearchInput")?.value || "").trim().toLowerCase();
    const areaValue = String(document.getElementById("questionBankAreaSelect")?.value || "").trim();
    const typeValue = String(document.getElementById("questionBankTypeSelect")?.value || "").trim();
    const methodValue = String(document.getElementById("questionBankMethodSelect")?.value || "").trim();
    const statusValue = String(document.getElementById("questionBankStatusSelect")?.value || "").trim();
    const container = document.getElementById("questionBankMasterList");
    const countValue = document.getElementById("questionBankCountValue");
    const filteredQuestions = state.questions.filter((question) => {
      const haystack = [question.tituloInterno, question.enunciado, question.assunto, question.subassunto].join(" ").toLowerCase();

      if (searchValue && !haystack.includes(searchValue)) {
        return false;
      }

      if (areaValue && question.area !== areaValue) {
        return false;
      }

      if (typeValue && question.tipoQuestao !== typeValue) {
        return false;
      }

      if (methodValue && question.metodoCorrecao !== methodValue) {
        return false;
      }

      if (statusValue && question.status !== statusValue) {
        return false;
      }

      return true;
    });

    if (countValue) {
      countValue.textContent = `${filteredQuestions.length} questoes`;
    }

    if (!container) {
      return;
    }

    container.innerHTML = filteredQuestions.length
      ? filteredQuestions.map(buildQuestionCard).join("")
      : `<div class="proof-center-empty">Nenhuma questao atende aos filtros atuais.</div>`;
  }

  async function loadQuestionBankPage() {
    await Promise.all([ensureReference(), ensureQuestions(true)]);
    populateSelect(document.getElementById("questionBankAreaSelect"), state.reference?.proofAreas || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("questionBankTypeSelect"), state.reference?.questionTypes || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("questionBankMethodSelect"), state.reference?.correctionMethods || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("questionBankStatusSelect"), state.reference?.questionStatuses || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });

    ["questionBankSearchInput", "questionBankAreaSelect", "questionBankTypeSelect", "questionBankMethodSelect", "questionBankStatusSelect"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", renderQuestionBankPage);
      document.getElementById(id)?.addEventListener("change", renderQuestionBankPage);
    });

    renderQuestionBankPage();
  }

  function populateQuestionEditForm(question) {
    if (!question) {
      return;
    }

    document.getElementById("questionEditIdInput").value = question.id || "";
    document.getElementById("questionEditTitleInput").value = question.tituloInterno || "";
    document.getElementById("questionEditPromptInput").value = question.enunciado || "";
    document.getElementById("questionEditTypeSelect").value = question.tipoQuestao || "objetiva";
    document.getElementById("questionEditAreaSelect").value = question.area || "exatas";
    document.getElementById("questionEditSubjectInput").value = question.assunto || "";
    document.getElementById("questionEditSubsubjectInput").value = question.subassunto || "";
    document.getElementById("questionEditFormulaInput").value = question.formulaPrincipal || "";
    document.getElementById("questionEditMethodSelect").value = question.metodoCorrecao || "automatica";
    document.getElementById("questionEditWeightInput").value = question.pesoPadrao || 1;
    document.getElementById("questionEditDifficultySelect").value = question.dificuldadeInterna || "media";
    document.getElementById("questionEditStatusSelect").value = question.status || "draft";
    document.getElementById("questionEditOriginSelect").value = question.origemCadastro || "manual";
    document.getElementById("questionEditDecimalsInput").value = question.casasDecimaisEsperadas || 0;
    document.getElementById("questionEditScientificCheckbox").checked = Boolean(question.aceitaNotacaoCientifica);
    document.getElementById("questionEditUnitInput").value = question.unidadeResposta || "";
    document.getElementById("questionEditToleranceAbsInput").value = question.toleranciaAbsoluta || 0;
    document.getElementById("questionEditTolerancePercentInput").value = question.toleranciaPercentual || 0;
    document.getElementById("questionEditHasImageCheckbox").checked = Boolean(question.possuiImagem);
    document.getElementById("questionEditImageUrlInput").value = question.imagemUrl || "";
    document.getElementById("questionEditNotesInput").value = question.observacoesAdmin || "";

    ["A", "B", "C", "D", "E"].forEach((letter) => {
      const alternative = question.alternatives?.find((item) => item.letra === letter);
      const input = document.getElementById(`questionEditAlternative${letter}Input`);
      if (input) {
        input.value = alternative?.texto || "";
      }
    });

    const correctAlternative = question.answerKeys?.find((item) => item.tipoGabarito === "alternativa")?.respostaBruta || "";
    document.getElementById("questionEditCorrectAlternativeSelect").value = correctAlternative;

    state.currentAnswerKeyRows = question.answerKeys?.filter((item) => item.tipoGabarito !== "alternativa").length
      ? question.answerKeys.filter((item) => item.tipoGabarito !== "alternativa")
      : [createAnswerKeyRow(question.tipoQuestao === "numerica" ? "numero" : question.tipoQuestao === "expressao_simples" ? "expressao" : "texto")];
    renderAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"), state.currentAnswerKeyRows, {
      prefix: "questionEdit",
    });

    const usageList = document.getElementById("questionEditUsageList");
    if (usageList) {
      usageList.innerHTML = `<div class="proof-center-info-card"><span>Uso atual</span><strong>${escapeHtml(formatNumber(question.usageCount || 0))} provas</strong></div>`;
    }
  }

  function collectQuestionEditPayload() {
    const typeValue = document.getElementById("questionEditTypeSelect").value || "objetiva";
    const correctAlternative = document.getElementById("questionEditCorrectAlternativeSelect").value || "";
    const extraAnswerKeys = collectAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"));
    const answerKeys = typeValue === "objetiva" && correctAlternative
      ? [{ tipoGabarito: "alternativa", respostaBruta: correctAlternative, principal: true }]
      : extraAnswerKeys;

    return {
      tituloInterno: document.getElementById("questionEditTitleInput").value,
      enunciado: document.getElementById("questionEditPromptInput").value,
      tipoQuestao: typeValue,
      area: document.getElementById("questionEditAreaSelect").value,
      assunto: document.getElementById("questionEditSubjectInput").value,
      subassunto: document.getElementById("questionEditSubsubjectInput").value,
      formulaPrincipal: document.getElementById("questionEditFormulaInput").value,
      metodoCorrecao: document.getElementById("questionEditMethodSelect").value,
      pesoPadrao: document.getElementById("questionEditWeightInput").value,
      dificuldadeInterna: document.getElementById("questionEditDifficultySelect").value,
      status: document.getElementById("questionEditStatusSelect").value,
      origemCadastro: document.getElementById("questionEditOriginSelect").value,
      casasDecimaisEsperadas: document.getElementById("questionEditDecimalsInput").value,
      aceitaNotacaoCientifica: document.getElementById("questionEditScientificCheckbox").checked,
      unidadeResposta: document.getElementById("questionEditUnitInput").value,
      toleranciaAbsoluta: document.getElementById("questionEditToleranceAbsInput").value,
      toleranciaPercentual: document.getElementById("questionEditTolerancePercentInput").value,
      possuiImagem: document.getElementById("questionEditHasImageCheckbox").checked,
      imagemUrl: document.getElementById("questionEditImageUrlInput").value,
      observacoesAdmin: document.getElementById("questionEditNotesInput").value,
      alternatives: ["A", "B", "C", "D", "E"].map((letter, index) => ({
        letra: letter,
        texto: document.getElementById(`questionEditAlternative${letter}Input`).value,
        ordem: index + 1,
      })),
      answerKeys,
    };
  }

  function toggleQuestionEditSections() {
    const typeValue = document.getElementById("questionEditTypeSelect")?.value || "objetiva";
    const alternativesSection = document.getElementById("questionEditAlternativesSection");
    const objectiveSection = document.getElementById("questionEditObjectiveSection");
    const advancedKeysSection = document.getElementById("questionEditAdvancedKeysSection");
    const isObjective = typeValue === "objetiva";

    alternativesSection?.classList.toggle("proof-center-hidden", !isObjective);
    objectiveSection?.classList.toggle("proof-center-hidden", !isObjective);
    advancedKeysSection?.classList.toggle("proof-center-hidden", isObjective);
  }

  async function loadQuestionEditPage() {
    await ensureReference();
    populateSelect(document.getElementById("questionEditTypeSelect"), state.reference?.questionTypes || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "objetiva",
    });
    populateSelect(document.getElementById("questionEditAreaSelect"), state.reference?.proofAreas || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "exatas",
    });
    populateSelect(document.getElementById("questionEditMethodSelect"), state.reference?.correctionMethods || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "automatica",
    });
    populateSelect(document.getElementById("questionEditDifficultySelect"), state.reference?.difficulties || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "media",
    });
    populateSelect(document.getElementById("questionEditStatusSelect"), state.reference?.questionStatuses || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "draft",
    });
    populateSelect(document.getElementById("questionEditOriginSelect"), state.reference?.questionOrigins || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "manual",
    });

    const questionId = getQueryValue("question");
    if (questionId) {
      const response = await api(`/api/admin/proof-center/questions/${questionId}`);
      state.currentQuestionDetail = response.question || null;
      populateQuestionEditForm(state.currentQuestionDetail);
    } else {
      state.currentAnswerKeyRows = [createAnswerKeyRow("texto")];
      renderAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"), state.currentAnswerKeyRows, {
        prefix: "questionEdit",
      });
    }

    toggleQuestionEditSections();
    document.getElementById("questionEditTypeSelect")?.addEventListener("change", toggleQuestionEditSections);
    document.getElementById("questionEditAddAnswerKeyButton")?.addEventListener("click", () => {
      const rows = collectAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"));
      rows.push(createAnswerKeyRow("texto"));
      renderAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"), rows, { prefix: "questionEdit" });
    });
    document.getElementById("questionEditAnswerKeysList")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer-remove]");

      if (!button) {
        return;
      }

      const rows = collectAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"));
      rows.splice(Number(button.dataset.answerRemove || 0) || 0, 1);
      renderAnswerKeyRows(document.getElementById("questionEditAnswerKeysList"), rows.length ? rows : [createAnswerKeyRow("texto")], {
        prefix: "questionEdit",
      });
    });

    const form = document.getElementById("questionEditForm");
    const feedback = document.getElementById("questionEditFeedback");

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback(feedback, "Salvando questao...", "");

      try {
        const payload = collectQuestionEditPayload();
        const currentQuestionId = normalizeId(document.getElementById("questionEditIdInput").value);
        const response = currentQuestionId
          ? await api(`/api/admin/proof-center/questions/${currentQuestionId}`, {
              method: "PATCH",
              body: JSON.stringify(payload),
            })
          : await api("/api/admin/proof-center/questions", {
              method: "POST",
              body: JSON.stringify(payload),
            });

        state.currentQuestionDetail = response.question || null;
        await ensureQuestions(true);
        populateQuestionEditForm(state.currentQuestionDetail);
        updateQueryValue("question", state.currentQuestionDetail?.id || "");
        toggleQuestionEditSections();
        setFeedback(feedback, "Questao salva no banco estruturado.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel salvar a questao.", "error");
      }
    });
  }

  async function loadAnswerKeyPage() {
    await Promise.all([ensureReference(), ensureProofs(true), ensureQuestions(true)]);
    const proofSelect = document.getElementById("answerKeyProofSelect");
    const questionSelect = document.getElementById("answerKeyQuestionSelect");
    const summary = document.getElementById("answerKeyQuestionSummary");
    const feedback = document.getElementById("answerKeyEditorFeedback");

    populateSelect(proofSelect, state.proofs, {
      includeEmpty: true,
      emptyLabel: "Escolha a prova",
      getValue: (item) => item.id,
      getLabel: (item) => proofDisplayTitle(item),
      selectedValue: getQueryValue("proof"),
    });
    populateSelect(document.getElementById("answerKeyMethodSelect"), state.reference?.correctionMethods || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });

    async function refreshSelectedQuestion() {
      const questionId = normalizeId(questionSelect?.value);

      if (!questionId) {
        state.currentAnswerKeyQuestion = null;
        renderEmpty(summary, "Escolha uma questao para editar o gabarito.");
        renderAnswerKeyRows(document.getElementById("answerKeyRowsList"), [], { prefix: "answerKey" });
        return;
      }

      updateQueryValue("question", questionId);
      const response = await api(`/api/admin/proof-center/questions/${questionId}`);
      state.currentAnswerKeyQuestion = response.question || null;

      if (summary) {
        summary.innerHTML = `
          <article class="proof-center-highlight">
            <div class="proof-center-card-head">
              <div class="proof-center-stack">
                <strong class="proof-center-card-title">${escapeHtml(questionDisplayTitle(state.currentAnswerKeyQuestion))}</strong>
                <p class="proof-center-copy">${escapeHtml((state.currentAnswerKeyQuestion?.enunciado || "").slice(0, 220))}</p>
              </div>
              ${buildStatusBadge(state.currentAnswerKeyQuestion?.status)}
            </div>
            <div class="proof-center-meta">
              <span class="proof-center-pill">${escapeHtml(formatLabel(state.currentAnswerKeyQuestion?.tipoQuestao))}</span>
              <span class="proof-center-pill">${escapeHtml(formatLabel(state.currentAnswerKeyQuestion?.metodoCorrecao))}</span>
              <span class="proof-center-pill">${escapeHtml(state.currentAnswerKeyQuestion?.assunto || "Sem assunto")}</span>
            </div>
          </article>
        `;
      }

      document.getElementById("answerKeyMethodSelect").value = state.currentAnswerKeyQuestion?.metodoCorrecao || "automatica";
      document.getElementById("answerKeyUnitInput").value = state.currentAnswerKeyQuestion?.unidadeResposta || "";
      document.getElementById("answerKeyToleranceAbsInput").value = state.currentAnswerKeyQuestion?.toleranciaAbsoluta || 0;
      document.getElementById("answerKeyTolerancePercentInput").value = state.currentAnswerKeyQuestion?.toleranciaPercentual || 0;
      document.getElementById("answerKeyNotesInput").value = state.currentAnswerKeyQuestion?.observacoesAdmin || "";
      document.getElementById("answerKeyCorrectAlternativeSelect").value =
        state.currentAnswerKeyQuestion?.answerKeys?.find((item) => item.tipoGabarito === "alternativa")?.respostaBruta || "";

      const advancedRows = state.currentAnswerKeyQuestion?.answerKeys?.filter((item) => item.tipoGabarito !== "alternativa") || [];
      renderAnswerKeyRows(document.getElementById("answerKeyRowsList"), advancedRows.length ? advancedRows : [createAnswerKeyRow("texto")], {
        prefix: "answerKey",
      });
    }

    async function refreshQuestionOptions() {
      const proofId = normalizeId(proofSelect?.value);
      const directQuestionId = getQueryValue("question");

      if (proofId) {
        const proofDetail = await api(`/api/admin/proof-center/proofs/${proofId}`);
        state.currentProofDetail = proofDetail;
        populateSelect(questionSelect, proofDetail.items || [], {
          includeEmpty: true,
          emptyLabel: "Escolha a questao",
          getValue: (item) => item.questaoId,
          getLabel: (item) => `Q${item.numeroNaProva || 0} · ${questionDisplayTitle(item.questao)}`,
          selectedValue: directQuestionId,
        });
      } else {
        populateSelect(questionSelect, state.questions, {
          includeEmpty: true,
          emptyLabel: "Escolha a questao",
          getValue: (item) => item.id,
          getLabel: (item) => questionDisplayTitle(item),
          selectedValue: directQuestionId,
        });
      }

      await refreshSelectedQuestion();
    }

    proofSelect?.addEventListener("change", async () => {
      updateQueryValue("proof", proofSelect.value);
      await refreshQuestionOptions();
    });
    questionSelect?.addEventListener("change", refreshSelectedQuestion);
    document.getElementById("answerKeyAddRowButton")?.addEventListener("click", () => {
      const rows = collectAnswerKeyRows(document.getElementById("answerKeyRowsList"));
      rows.push(createAnswerKeyRow("texto"));
      renderAnswerKeyRows(document.getElementById("answerKeyRowsList"), rows, { prefix: "answerKey" });
    });
    document.getElementById("answerKeyRowsList")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer-remove]");
      if (!button) {
        return;
      }
      const rows = collectAnswerKeyRows(document.getElementById("answerKeyRowsList"));
      rows.splice(Number(button.dataset.answerRemove || 0) || 0, 1);
      renderAnswerKeyRows(document.getElementById("answerKeyRowsList"), rows.length ? rows : [createAnswerKeyRow("texto")], {
        prefix: "answerKey",
      });
    });

    document.getElementById("answerKeyEditorForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!state.currentAnswerKeyQuestion?.id) {
        setFeedback(feedback, "Escolha uma questao antes de salvar o gabarito.", "error");
        return;
      }

      try {
        setFeedback(feedback, "Salvando gabarito...", "");
        const answerRows = collectAnswerKeyRows(document.getElementById("answerKeyRowsList"));
        const correctAlternative = document.getElementById("answerKeyCorrectAlternativeSelect").value || "";
        const answerKeys = state.currentAnswerKeyQuestion.tipoQuestao === "objetiva" && correctAlternative
          ? [{ tipoGabarito: "alternativa", respostaBruta: correctAlternative, principal: true }]
          : answerRows;
        const payload = {
          ...state.currentAnswerKeyQuestion,
          metodoCorrecao: document.getElementById("answerKeyMethodSelect").value,
          unidadeResposta: document.getElementById("answerKeyUnitInput").value,
          toleranciaAbsoluta: document.getElementById("answerKeyToleranceAbsInput").value,
          toleranciaPercentual: document.getElementById("answerKeyTolerancePercentInput").value,
          observacoesAdmin: document.getElementById("answerKeyNotesInput").value,
          answerKeys,
        };

        const response = await api(`/api/admin/proof-center/questions/${state.currentAnswerKeyQuestion.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        state.currentAnswerKeyQuestion = response.question || null;
        await ensureQuestions(true);
        await refreshSelectedQuestion();
        setFeedback(feedback, "Gabarito atualizado com sucesso.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel salvar o gabarito.", "error");
      }
    });

    await refreshQuestionOptions();
  }

  async function loadImportPage() {
    await Promise.all([ensureReference(), ensureProofs(true), ensureImports(true)]);
    populateSelect(document.getElementById("importProofSelect"), state.proofs, {
      includeEmpty: false,
      getValue: (item) => item.id,
      getLabel: (item) => proofDisplayTitle(item),
      selectedValue: getQueryValue("proof") || state.proofs[0]?.id || "",
    });
    populateSelect(document.getElementById("importFileTypeSelect"), state.reference?.fileTypes || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "pdf_original",
    });
    populateSelect(document.getElementById("importStatusSelect"), state.reference?.importStatuses || [], {
      includeEmpty: false,
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
      selectedValue: "pendente",
    });

    const listContainer = document.getElementById("importListContainer");
    const feedback = document.getElementById("importFeedback");

    const renderImports = () => {
      if (!listContainer) {
        return;
      }

      listContainer.innerHTML = state.imports.length
        ? state.imports
            .map(
              (item) => `
                <article class="proof-center-card">
                  <div class="proof-center-card-head">
                    <div class="proof-center-stack">
                      <strong class="proof-center-card-title">${escapeHtml(item.provaTitulo || "Importacao sem prova")}</strong>
                      <p class="proof-center-copy">${escapeHtml(item.arquivoNome || "Sem arquivo vinculado")}</p>
                    </div>
                    ${buildStatusBadge(item.status)}
                  </div>
                  <div class="proof-center-meta">
                    <span class="proof-center-pill">${escapeHtml(formatLabel(item.tipoArquivo || "anexo"))}</span>
                    <span class="proof-center-pill">${escapeHtml(String(item.totalQuestoesDetectadas || 0))} questoes</span>
                    <span class="proof-center-pill">${escapeHtml(formatNumber(item.confiancaMedia || 0))}% confianca</span>
                  </div>
                  <div class="proof-center-card-actions">
                    <span class="proof-center-muted">${escapeHtml(formatDate(item.createdAt))}</span>
                    ${item.arquivoUrl ? buildFileLinkMarkup({ url: item.arquivoUrl, nomeOriginal: item.arquivoNome }, "Abrir PDF") : ""}
                  </div>
                </article>
              `
            )
            .join("")
        : `<div class="proof-center-empty">As importacoes assistidas vao aparecer aqui.</div>`;
    };

    renderImports();
    document.getElementById("importProofSelect")?.addEventListener("change", () => {
      updateQueryValue("proof", document.getElementById("importProofSelect").value);
    });

    document.getElementById("importForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      setFeedback(feedback, "Registrando importacao assistida...", "");

      try {
        const file = document.getElementById("importFileInput")?.files?.[0] || null;
        const payload = {
          proofId: document.getElementById("importProofSelect").value,
          fileType: document.getElementById("importFileTypeSelect").value,
          status: document.getElementById("importStatusSelect").value,
          textoExtraido: document.getElementById("importExtractedTextInput").value,
          confiancaMedia: document.getElementById("importConfidenceInput").value,
          totalQuestoesDetectadas: document.getElementById("importQuestionCountInput").value,
          logParser: document.getElementById("importLogInput").value,
        };

        if (file) {
          payload.file = await readFileAsBase64(file);
        }

        await api("/api/admin/proof-center/imports", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        await ensureImports(true);
        renderImports();
        const fileInput = document.getElementById("importFileInput");
        if (fileInput) {
          fileInput.value = "";
        }
        setFeedback(feedback, "Importacao salva na fila assistida.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel salvar a importacao.", "error");
      }
    });
  }

  function getCorrectionBucket(row) {
    if (row.statusCorrecao === "corrigida_automatica") {
      return "automaticas";
    }
    if (row.statusCorrecao === "baixa_confianca") {
      return "conflitos";
    }
    if (row.statusCorrecao === "revisao_manual" && row.questao?.metodoCorrecao === "semiassistida") {
      return "semiassistidas";
    }
    if (row.statusCorrecao === "revisao_manual" || row.questao?.metodoCorrecao === "manual") {
      return "manuais";
    }
    return "pendentes";
  }

  function renderCorrectionPage() {
    const proofValue = String(document.getElementById("correctionProofSelect")?.value || "").trim();
    const studentValue = String(document.getElementById("correctionStudentInput")?.value || "").trim().toLowerCase();
    const disciplineValue = String(document.getElementById("correctionDisciplineInput")?.value || "").trim().toLowerCase();
    const statusValue = String(document.getElementById("correctionStatusSelect")?.value || "").trim();
    const typeValue = String(document.getElementById("correctionTypeSelect")?.value || "").trim();
    const filteredRows = state.queue.filter((row) => {
      if (proofValue && String(row.provaId) !== proofValue) {
        return false;
      }
      if (studentValue) {
        const haystack = [row.aluno?.nome, row.aluno?.email].join(" ").toLowerCase();
        if (!haystack.includes(studentValue)) {
          return false;
        }
      }
      if (disciplineValue && !String(row.prova?.disciplina || "").toLowerCase().includes(disciplineValue)) {
        return false;
      }
      if (statusValue && row.statusCorrecao !== statusValue) {
        return false;
      }
      if (typeValue && row.questao?.tipoQuestao !== typeValue) {
        return false;
      }
      return true;
    });

    const buckets = { automaticas: [], pendentes: [], conflitos: [], semiassistidas: [], manuais: [] };
    filteredRows.forEach((row) => {
      buckets[getCorrectionBucket(row)].push(row);
    });

    const summaryMap = {
      correctionAutoValue: buckets.automaticas.length,
      correctionPendingValue: buckets.pendentes.length,
      correctionConflictValue: buckets.conflitos.length,
      correctionSemiValue: buckets.semiassistidas.length,
      correctionManualValue: buckets.manuais.length,
    };

    Object.entries(summaryMap).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = formatNumber(value);
      }
    });

    const renderBucket = (containerId, rows, emptyMessage) => {
      const container = document.getElementById(containerId);
      if (!container) {
        return;
      }
      container.innerHTML = rows.length
        ? rows.map((row) => `
            <article class="proof-center-queue-card">
              <div class="proof-center-card-head">
                <div class="proof-center-stack">
                  <strong class="proof-center-card-title">${escapeHtml(row.prova?.titulo || "Prova")} · Q${escapeHtml(formatNumber(row.questao?.numeroNaProva || 0))}</strong>
                  <p class="proof-center-copy">${escapeHtml(row.aluno?.nome || "Aluno sem nome")} · ${escapeHtml(questionDisplayTitle(row.questao))}</p>
                </div>
                ${buildStatusBadge(row.statusCorrecao)}
              </div>
              <div class="proof-center-meta">
                <span class="proof-center-pill">${escapeHtml(formatLabel(row.questao?.tipoQuestao))}</span>
                <span class="proof-center-pill">${escapeHtml(formatLabel(row.questao?.metodoCorrecao))}</span>
                <span class="proof-center-pill">${escapeHtml(row.prova?.disciplina || "Sem disciplina")}</span>
              </div>
              <div class="proof-center-card-actions">
                <span class="proof-center-muted">Atualizada em ${escapeHtml(formatDate(row.updatedAt))}</span>
                <a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-correcao-detalhe.html", "response", row.id))}">Abrir detalhe</a>
              </div>
            </article>
          `).join("")
        : `<div class="proof-center-empty">${escapeHtml(emptyMessage)}</div>`;
    };

    renderBucket("correctionAutomaticList", buckets.automaticas, "Nenhuma correcao automatica nesse filtro.");
    renderBucket("correctionPendingList", buckets.pendentes, "Nenhuma resposta pendente.");
    renderBucket("correctionConflictList", buckets.conflitos, "Nenhum conflito de correcao.");
    renderBucket("correctionSemiList", buckets.semiassistidas, "Nenhuma resposta semiassistida.");
    renderBucket("correctionManualList", buckets.manuais, "Nenhuma resposta manual nesse momento.");
  }

  async function loadCorrectionPage() {
    await Promise.all([ensureReference(), ensureProofs(true), ensureQueue(true)]);
    populateSelect(document.getElementById("correctionProofSelect"), state.proofs, {
      getValue: (item) => item.id,
      getLabel: (item) => proofDisplayTitle(item),
      selectedValue: getQueryValue("proof"),
    });
    populateSelect(document.getElementById("correctionStatusSelect"), state.reference?.answerStatuses || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });
    populateSelect(document.getElementById("correctionTypeSelect"), state.reference?.questionTypes || [], {
      getValue: (item) => item,
      getLabel: (item) => formatLabel(item),
    });

    ["correctionProofSelect", "correctionStudentInput", "correctionDisciplineInput", "correctionStatusSelect", "correctionTypeSelect"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", renderCorrectionPage);
      document.getElementById(id)?.addEventListener("change", renderCorrectionPage);
    });

    document.getElementById("correctionReprocessButton")?.addEventListener("click", async () => {
      const feedback = document.getElementById("correctionFeedback");

      try {
        setFeedback(feedback, "Rodando correcao automatica novamente...", "");
        await api("/api/admin/proof-center/correction/reprocess", {
          method: "POST",
          body: JSON.stringify({
            proofId: document.getElementById("correctionProofSelect")?.value || "",
            force: true,
          }),
        });
        await ensureQueue(true);
        renderCorrectionPage();
        setFeedback(feedback, "Fila recalculada com a regra automatica.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel reprocessar a fila.", "error");
      }
    });

    renderCorrectionPage();
  }

  async function loadCorrectionDetailPage() {
    const responseId = getQueryValue("response");
    const feedback = document.getElementById("correctionDetailFeedback");

    if (!responseId) {
      renderEmpty(document.getElementById("correctionDetailSummary"), "Selecione uma resposta na fila de correcao.");
      renderEmpty(document.getElementById("correctionDetailExpected"), "Sem resposta escolhida.");
      return;
    }

    const response = await api(`/api/admin/proof-center/correction/responses/${responseId}`);
    const detail = response.response || null;
    if (!detail) {
      renderEmpty(document.getElementById("correctionDetailSummary"), "Resposta nao encontrada.");
      return;
    }

    const summary = document.getElementById("correctionDetailSummary");
    const expected = document.getElementById("correctionDetailExpected");

    if (summary) {
      summary.innerHTML = `
        <article class="proof-center-highlight">
          <div class="proof-center-card-head">
            <div class="proof-center-stack">
              <strong class="proof-center-card-title">${escapeHtml(detail.prova?.titulo || "Prova")} · ${escapeHtml(detail.aluno?.nome || "Aluno")}</strong>
              <p class="proof-center-copy">${escapeHtml(questionDisplayTitle(detail.questao))}</p>
            </div>
            ${buildStatusBadge(detail.statusCorrecao)}
          </div>
          <div class="proof-center-info-grid">
            <article class="proof-center-info-card">
              <span>Resposta do aluno</span>
              <strong>${escapeHtml(detail.resposta?.bruta || detail.resposta?.expressaoBruta || detail.resposta?.alternativaMarcada || "Sem resposta")}</strong>
            </article>
            <article class="proof-center-info-card">
              <span>Nota atual</span>
              <strong>${escapeHtml(formatNumber(detail.notaAtribuida || 0))}</strong>
            </article>
            <article class="proof-center-info-card">
              <span>Metodo</span>
              <strong>${escapeHtml(formatLabel(detail.questao?.metodoCorrecao))}</strong>
            </article>
            <article class="proof-center-info-card">
              <span>Confianca</span>
              <strong>${escapeHtml(formatNumber(detail.confiancaCorrecao || 0))}</strong>
            </article>
          </div>
        </article>
      `;
    }

    if (expected) {
      expected.innerHTML = `
        <article class="proof-center-card">
          <div class="proof-center-card-head">
            <div class="proof-center-stack">
              <strong class="proof-center-card-title">Gabarito estruturado</strong>
              <p class="proof-center-copy">Use o gabarito e os metadados abaixo para confirmar ou ajustar a nota.</p>
            </div>
          </div>
          <div class="proof-center-card-list">
            ${(detail.answerKeys || [])
              .map(
                (item, index) => `
                  <article class="proof-center-info-card">
                    <span>Gabarito ${index + 1}</span>
                    <strong>${escapeHtml(item.respostaBruta || item.respostaNormalizada || item.expressaoCanonica || formatNumber(item.valorNumerico || 0))}</strong>
                    <span class="proof-center-copy">${escapeHtml(formatLabel(item.tipoGabarito))} · Unidade ${escapeHtml(item.unidade || "nao definida")}</span>
                  </article>
                `
              )
              .join("") || `<div class="proof-center-empty">Essa questao ainda nao recebeu gabarito estruturado.</div>`}
          </div>
        </article>
      `;
    }

    document.getElementById("correctionDetailScoreInput").value = detail.notaAtribuida || 0;
    document.getElementById("correctionDetailCorrectSelect").value = detail.correta ? "1" : "0";
    document.getElementById("correctionDetailDecisionSelect").value = "confirmada";
    document.getElementById("correctionDetailReasonInput").value = detail.motivoPendencia || "";
    document.getElementById("correctionDetailFeedbackInput").value = detail.feedback || "";

    document.getElementById("correctionDetailForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        setFeedback(feedback, "Salvando revisao manual...", "");
        const nextResponse = await api(`/api/admin/proof-center/correction/responses/${responseId}`, {
          method: "PATCH",
          body: JSON.stringify({
            notaAtribuida: document.getElementById("correctionDetailScoreInput").value,
            correta: document.getElementById("correctionDetailCorrectSelect").value === "1",
            decisao: document.getElementById("correctionDetailDecisionSelect").value,
            motivo: document.getElementById("correctionDetailReasonInput").value,
            feedback: document.getElementById("correctionDetailFeedbackInput").value,
          }),
        });
        document.getElementById("correctionDetailScoreInput").value = nextResponse.response?.notaAtribuida || 0;
        setFeedback(feedback, "Revisao registrada com rastreabilidade.", "success");
      } catch (error) {
        setFeedback(feedback, error?.message || "Nao foi possivel salvar a revisao.", "error");
      }
    });
  }

  function renderResultsPage() {
    const searchValue = String(document.getElementById("resultsSearchInput")?.value || "").trim().toLowerCase();
    const disciplineValue = String(document.getElementById("resultsDisciplineInput")?.value || "").trim().toLowerCase();
    const results = state.results || { byProof: [], bySubject: [], history: [] };
    const byProof = (results.byProof || []).filter((item) => {
      const haystack = [item.provaTitulo, item.disciplina].join(" ").toLowerCase();
      if (searchValue && !haystack.includes(searchValue)) return false;
      if (disciplineValue && !String(item.disciplina || "").toLowerCase().includes(disciplineValue)) return false;
      return true;
    });
    const history = (results.history || []).filter((item) => {
      const haystack = [item.provaTitulo, item.alunoNome, item.alunoEmail, item.disciplina].join(" ").toLowerCase();
      if (searchValue && !haystack.includes(searchValue)) return false;
      if (disciplineValue && !String(item.disciplina || "").toLowerCase().includes(disciplineValue)) return false;
      return true;
    });
    const totals = history.reduce((accumulator, item) => {
      accumulator.totalAttempts += 1;
      accumulator.totalScore += Number(item.notaFinal) || 0;
      accumulator.totalCorrect += Number(item.totalAcertos) || 0;
      accumulator.totalErrors += Number(item.totalErros) || 0;
      return accumulator;
    }, { totalAttempts: 0, totalScore: 0, totalCorrect: 0, totalErrors: 0 });

    const metrics = {
      resultsScoreValue: totals.totalScore,
      resultsCorrectValue: totals.totalCorrect,
      resultsWrongValue: totals.totalErrors,
      resultsAttemptsValue: totals.totalAttempts,
    };

    Object.entries(metrics).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = formatNumber(value || 0);
      }
    });

    const byProofList = document.getElementById("resultsByProofList");
    if (byProofList) {
      byProofList.innerHTML = byProof.length
        ? byProof.map((item) => `
            <article class="proof-center-card">
              <div class="proof-center-card-head">
                <div class="proof-center-stack">
                  <strong class="proof-center-card-title">${escapeHtml(item.provaTitulo || "Prova")}</strong>
                  <p class="proof-center-copy">${escapeHtml(item.disciplina || "Sem disciplina")}</p>
                </div>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalTentativas || 0))} tentativas</span>
              </div>
              <div class="proof-center-meta">
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.notaTotal || 0))} nota</span>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalAcertos || 0))} acertos</span>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalErros || 0))} erros</span>
              </div>
            </article>
          `).join("")
        : `<div class="proof-center-empty">Nenhuma prova encontrada com esse filtro.</div>`;
    }

    const bySubjectList = document.getElementById("resultsBySubjectList");
    if (bySubjectList) {
      bySubjectList.innerHTML = (results.bySubject || []).length
        ? results.bySubject.map((item) => `
            <article class="proof-center-card">
              <div class="proof-center-card-head">
                <strong class="proof-center-card-title">${escapeHtml(item.assunto || "Sem assunto")}</strong>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalRespostas || 0))} respostas</span>
              </div>
              <div class="proof-center-meta">
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalAcertos || 0))} acertos</span>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalErros || 0))} erros</span>
              </div>
            </article>
          `).join("")
        : `<div class="proof-center-empty">O desempenho por assunto vai aparecer quando houver respostas corrigidas.</div>`;
    }

    const historyList = document.getElementById("resultsHistoryList");
    if (historyList) {
      historyList.innerHTML = history.length
        ? history.map((item) => `
            <article class="proof-center-card">
              <div class="proof-center-card-head">
                <div class="proof-center-stack">
                  <strong class="proof-center-card-title">${escapeHtml(item.provaTitulo || "Prova")}</strong>
                  <p class="proof-center-copy">${escapeHtml(item.alunoNome || "Aluno")} · ${escapeHtml(item.alunoEmail || "Sem email")}</p>
                </div>
                ${buildStatusBadge(item.status)}
              </div>
              <div class="proof-center-meta">
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.notaFinal || 0))} nota</span>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalAcertos || 0))} acertos</span>
                <span class="proof-center-pill">${escapeHtml(formatNumber(item.totalErros || 0))} erros</span>
              </div>
              <span class="proof-center-muted">${escapeHtml(formatDate(item.updatedAt || item.createdAt))}</span>
            </article>
          `).join("")
        : `<div class="proof-center-empty">O historico de correcoes vai aparecer aqui.</div>`;
    }
  }

  async function loadResultsPage() {
    await ensureResults(true);
    ["resultsSearchInput", "resultsDisciplineInput"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", renderResultsPage);
    });
    renderResultsPage();
  }

  async function bootstrap() {
    await (window.Start5Auth?.ready || Promise.resolve());

    switch (view) {
      case "hub":
        await loadHub();
        break;
      case "proofs-list":
        await loadProofListPage();
        break;
      case "proofs-create":
        await loadProofCreatePage();
        break;
      case "proofs-assembly":
        await loadProofAssemblyPage();
        break;
      case "question-bank":
        await loadQuestionBankPage();
        break;
      case "question-edit":
        await loadQuestionEditPage();
        break;
      case "answer-keys":
        await loadAnswerKeyPage();
        break;
      case "imports":
        await loadImportPage();
        break;
      case "correction":
        await loadCorrectionPage();
        break;
      case "correction-detail":
        await loadCorrectionDetailPage();
        break;
      case "results":
        await loadResultsPage();
        break;
      default:
        break;
    }
  }

  bootstrap().catch((error) => {
    console.error("Erro ao carregar proof center:", error);
  });
})();
