(function initializeAdminProofCenterOperations() {
  const view = document.body?.dataset?.proofCenterView || "";

  if (!["hub-operations", "answer-key-manager", "imports-manager"].includes(view)) {
    return;
  }

  const state = {
    reference: null,
    proofs: [],
    answerKeys: [],
    imports: [],
    queue: [],
    currentAnswerKey: null,
    currentImport: null,
  };

  const labels = {
    draft: "Rascunho",
    review: "Em revisao",
    active: "Ativa",
    archived: "Arquivada",
    oficial: "Oficial",
    ajustado: "Ajustado",
    provisorio: "Provisorio",
    manual: "Manual",
    importado: "Importado",
    revisado: "Revisado",
    multipla_escolha: "Multipla escolha",
    verdadeiro_falso: "Verdadeiro/Falso",
    numerica_exata: "Numerica exata",
    numerica_com_tolerancia: "Numerica com tolerancia",
    discursiva_manual: "Discursiva/manual",
    hibrida: "Hibrida",
    automatica: "Automatica",
    automatica_com_tolerancia: "Automatica com tolerancia",
    semiassistida: "Semiassistida",
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
    automatic: "Automatica",
    suggested: "Sugerida",
    pending: "Pendente",
    reviewed: "Revisado",
    imported: "Importado",
    ignored: "Ignorado",
    pdf_original: "PDF original",
    pdf_gabarito: "PDF gabarito",
    anexo: "Anexo",
    exatas: "Exatas",
    linguagens: "Linguagens",
    humanas: "Humanas",
    natureza: "Natureza",
    mista: "Mista",
  };

  function api(path, options) {
    return (window.Start5ProofCenterApi?.request || window.Start5Auth.apiRequest)(path, options);
  }

  function normalizeId(value) {
    return String(value || "").trim();
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
      labels[normalized] ||
      normalized
        .split(/[_\s-]+/g)
        .filter(Boolean)
        .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
        .join(" ")
    );
  }

  function getTone(value) {
    const normalized = String(value || "").trim().toLowerCase();
    if (["active", "automatic", "matched_automatic", "ready_for_correction", "imported"].includes(normalized)) return "active";
    if (["review", "suggested", "extracting_text", "matching_proof", "matched_suggested", "parsed_questions", "semiassistida", "automatica_com_tolerancia"].includes(normalized)) return "review";
    if (["draft", "manual", "uploaded", "ocr_required", "manual_review_required", "pending"].includes(normalized)) return "draft";
    if (["archived", "failed", "erro", "ignored"].includes(normalized)) return "archived";
    return "draft";
  }

  function buildStatusBadge(value) {
    return `<span class="proof-center-status" data-tone="${escapeHtml(getTone(value))}">${escapeHtml(formatLabel(value))}</span>`;
  }

  function formatNumber(value) {
    const safeValue = Number(value) || 0;
    return Number.isInteger(safeValue) ? String(safeValue) : safeValue.toFixed(2).replace(".", ",");
  }

  function formatDate(value) {
    if (!value) return "Sem data";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Sem data"
      : date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  function populateSelect(select, items, options = {}) {
    if (!select) return;
    const { includeEmpty = true, emptyLabel = "Selecione", selectedValue = "", getValue = (item) => item?.id ?? item, getLabel = (item) => item?.proofCode || item?.titulo || item?.proofTitle || formatLabel(item) } = options;
    const selected = String(selectedValue || select.value || "");
    const markup = [];
    if (includeEmpty) markup.push(`<option value="">${escapeHtml(emptyLabel)}</option>`);
    (Array.isArray(items) ? items : []).forEach((item) => {
      const optionValue = String(getValue(item) || "");
      markup.push(`<option value="${escapeHtml(optionValue)}"${optionValue === selected ? " selected" : ""}>${escapeHtml(getLabel(item))}</option>`);
    });
    select.innerHTML = markup.join("");
  }

  function renderEmpty(container, message) {
    if (container) container.innerHTML = `<div class="proof-center-empty">${escapeHtml(message)}</div>`;
  }

  function getQueryValue(name) {
    return normalizeId(new URLSearchParams(window.location.search).get(name));
  }

  function updateQueryValue(name, value) {
    const url = new URL(window.location.href);
    const normalized = normalizeId(value);
    if (normalized) url.searchParams.set(name, normalized);
    else url.searchParams.delete(name);
    window.history.replaceState({}, "", url.toString());
  }

  function buildAdminHref(page, paramName, value) {
    const normalized = normalizeId(value);
    return normalized ? `${page}?${paramName}=${encodeURIComponent(normalized)}` : page;
  }

  function resolveApiHref(path) {
    const normalizedPath = String(path || "").trim();
    if (!normalizedPath) return "";
    if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
    if (typeof window.Start5ProofCenterApi?.mapPath === "function") {
      return window.Start5ProofCenterApi.mapPath(normalizedPath);
    }
    return normalizedPath;
  }

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
  }

  function getValue(id) {
    return String(document.getElementById(id)?.value || "").trim();
  }

  async function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        resolve({ fileName: file.name, mimeType: file.type || "application/pdf", sizeBytes: Number(file.size) || 0, dataBase64: result.includes(",") ? result.split(",").pop() : result });
      };
      reader.onerror = () => reject(new Error("Nao foi possivel ler o arquivo selecionado."));
      reader.readAsDataURL(file);
    });
  }

  async function ensureReference(force = false) {
    if (!force && state.reference) return state.reference;
    const response = await api("/api/admin/proof-center/reference");
    state.reference = response.reference || response || {};
    return state.reference;
  }

  async function ensureProofs(force = false) {
    if (!force && state.proofs.length) return state.proofs;
    const response = await api("/api/admin/proof-center/proofs");
    state.proofs = Array.isArray(response.proofs) ? response.proofs : [];
    return state.proofs;
  }

  async function ensureAnswerKeys(force = false) {
    if (!force && state.answerKeys.length) return state.answerKeys;
    const response = await api("/api/admin/proof-center/answer-keys");
    state.answerKeys = Array.isArray(response.answerKeys) ? response.answerKeys : [];
    return state.answerKeys;
  }

  async function ensureImports(force = false) {
    if (!force && state.imports.length) return state.imports;
    const response = await api("/api/admin/proof-center/imports");
    state.imports = Array.isArray(response.imports) ? response.imports : [];
    return state.imports;
  }

  async function ensureQueue(force = false) {
    if (!force && state.queue.length) return state.queue;
    const response = await api("/api/admin/proof-center/correction/queue");
    state.queue = Array.isArray(response.queue) ? response.queue : [];
    return state.queue;
  }

  function buildProofIdentityParts(proof = {}) {
    return [proof.proofCode, proof.examProvider || proof.examName || proof.titulo, proof.examYear || proof.ano, proof.examDay, proof.subjectGroup || proof.area, proof.bookletColor ? `Caderno ${proof.bookletColor}` : ""].filter(Boolean);
  }

  function groupQueueByProofId() {
    return state.queue.reduce((accumulator, row) => {
      const proofId = normalizeId(row.provaId || row.prova?.id);
      if (proofId) accumulator[proofId] = (accumulator[proofId] || 0) + 1;
      return accumulator;
    }, {});
  }

  async function loadHubOperations() {
    const [summaryResponse] = await Promise.all([api("/api/admin/proof-center/summary"), ensureProofs(true), ensureAnswerKeys(true), ensureImports(true), ensureQueue(true)]);
    const counts = (summaryResponse.summary || summaryResponse || {}).counts || {};
    const queueByProofId = groupQueueByProofId();
    [["proofCenterSummaryProofs", counts.totalProofs], ["proofCenterSummaryKeys", state.answerKeys.length], ["proofCenterSummaryImports", counts.totalImports], ["proofCenterSummaryPending", counts.totalPendingReview]].forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = formatNumber(value || 0);
    });

    const operations = document.getElementById("proofCenterOperationsList");
    if (operations) {
      operations.innerHTML = state.proofs.length
        ? state.proofs.map((proof) => `
            <article class="proof-center-work-row">
              <div class="proof-center-work-main"><strong>${escapeHtml(proof.titulo || "Prova")}</strong><span>${escapeHtml(buildProofIdentityParts(proof).join(" · ") || "Identidade ainda em definicao")}</span></div>
              <div class="proof-center-work-cell">${buildStatusBadge(proof.activeAnswerKeyStatus || "draft")}</div>
              <div class="proof-center-work-cell">${buildStatusBadge(proof.latestImportProcessingStatus || proof.latestImportStatus || "uploaded")}</div>
              <div class="proof-center-work-cell">${buildStatusBadge(proof.latestImportMatchingLevel || (proof.latestImportReviewRequired ? "manual" : proof.latestImportId ? "automatic" : "manual"))}</div>
              <div class="proof-center-work-cell"><span class="proof-center-pill">${escapeHtml(formatNumber(queueByProofId[proof.id] || 0))} itens</span></div>
              <div class="proof-center-inline-actions"><a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-gabaritos.html", "proof", proof.id))}">Gabarito</a><a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-importacao.html", "proof", proof.id))}">PDF</a><a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-correcao.html", "proof", proof.id))}">Corrigir</a></div>
            </article>
          `).join("")
        : `<div class="proof-center-empty">Nenhuma prova estruturada foi criada ainda.</div>`;
    }

    const processing = document.getElementById("proofCenterProcessingList");
    if (processing) {
      processing.innerHTML = state.imports.length
        ? state.imports.slice(0, 8).map((item) => `
            <article class="proof-center-processing-row">
              <div class="proof-center-stack"><strong>${escapeHtml(item.arquivoNome || item.provaTitulo || "Importacao sem arquivo")}</strong><span class="proof-center-muted">${escapeHtml([item.recognizedProofCode || item.provaCode || item.provaTitulo || "Sem prova", item.reviewRequired ? "Revisao manual" : "Fluxo automatico", `${formatNumber(item.parsedQuestionCount || item.totalQuestoesDetectadas || 0)} questoes`].join(" · "))}</span></div>
              <div class="proof-center-inline-meta">${buildStatusBadge(item.processingStatus || item.status)}${buildStatusBadge(item.matchingLevel || "manual")}<a class="proof-center-inline-link" href="${escapeHtml(buildAdminHref("admin-importacao.html", "import", item.id))}">Abrir</a></div>
            </article>
          `).join("")
        : `<div class="proof-center-empty">Nenhum PDF entrou na fila ainda.</div>`;
    }
  }

  function inferMode(questionType) {
    if (["multipla_escolha", "verdadeiro_falso"].includes(questionType)) return "automatica";
    if (["numerica_exata", "numerica_com_tolerancia"].includes(questionType)) return "automatica_com_tolerancia";
    if (questionType === "hibrida") return "semiassistida";
    return "manual";
  }

  function buildProofCodeFromForm() {
    return [getValue("answerKeyExamProviderInput") || getValue("answerKeyExamNameInput"), getValue("answerKeyExamYearInput"), getValue("answerKeyExamDayInput"), getValue("answerKeySubjectGroupInput") || getValue("answerKeyAreaSelect"), getValue("answerKeyBookletColorInput"), getValue("answerKeyExamVersionInput")]
      .map((item) => String(item || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toUpperCase())
      .filter(Boolean)
      .join("-");
  }

  function parseRuleText(rawRuleText, suggestedMode, questionType) {
    const raw = String(rawRuleText || "").trim();
    let rule = {};
    if (raw) {
      try { rule = JSON.parse(raw); } catch { rule = { raw }; }
    }
    if (!rule.correctionMode) rule.correctionMode = suggestedMode || inferMode(questionType);
    if (questionType === "verdadeiro_falso" && !rule.acceptedValues) rule.acceptedValues = ["V", "F", "TRUE", "FALSE"];
    return rule;
  }

  function answerKeyDefaults() {
    return {
      questionType: getValue("answerKeyDefaultQuestionTypeSelect") || "multipla_escolha",
      numericTolerance: getValue("answerKeyDefaultToleranceInput"),
      weight: getValue("answerKeyDefaultWeightInput") || "1",
      validationRuleRaw: getValue("answerKeyDefaultValidationRuleInput"),
      suggestedMode: getValue("answerKeyDefaultModeSelect") || "automatica",
    };
  }

  function createAnswerKeyItem(defaults = {}, item = {}) {
    return {
      questionNumber: item.questionNumber ?? "",
      questionType: item.questionType || defaults.questionType || "multipla_escolha",
      expectedAnswer: item.expectedAnswer || "",
      numericTolerance: item.numericTolerance ?? defaults.numericTolerance ?? "",
      weight: item.weight ?? defaults.weight ?? "1",
      validationRuleRaw: item.validationRuleRaw || (item.validationRule ? JSON.stringify(item.validationRule, null, 2) : defaults.validationRuleRaw || ""),
      notes: item.notes || "",
    };
  }

  function renderAnswerKeyItems(items) {
    const container = document.getElementById("answerKeyItemRowsList");
    const questionTypes = state.reference?.answerKeyQuestionTypes || [];
    if (!container) return;
    container.innerHTML = items.length
      ? items.map((item, index) => `
          <article class="proof-center-item-row" data-answer-item-row="${index}">
            <div class="proof-center-toolbar"><div class="proof-center-inline-meta"><strong>Questao ${escapeHtml(item.questionNumber || index + 1)}</strong>${buildStatusBadge(inferMode(item.questionType))}</div><button type="button" class="proof-center-button proof-center-button-secondary" data-answer-item-remove="${index}">Remover</button></div>
            <div class="proof-center-item-grid">
              <label class="proof-center-field"><span class="proof-center-label">Numero</span><input type="number" class="admin-modal-input" data-field="questionNumber" value="${escapeHtml(item.questionNumber)}" /></label>
              <label class="proof-center-field"><span class="proof-center-label">Tipo</span><select class="admin-modal-input" data-field="questionType">${questionTypes.map((type) => `<option value="${escapeHtml(type)}"${type === item.questionType ? " selected" : ""}>${escapeHtml(formatLabel(type))}</option>`).join("")}</select></label>
              <label class="proof-center-field"><span class="proof-center-label">Resposta</span><input class="admin-modal-input" data-field="expectedAnswer" value="${escapeHtml(item.expectedAnswer)}" /></label>
              <label class="proof-center-field"><span class="proof-center-label">Tol.</span><input type="number" step="any" class="admin-modal-input" data-field="numericTolerance" value="${escapeHtml(item.numericTolerance)}" /></label>
              <label class="proof-center-field"><span class="proof-center-label">Peso</span><input type="number" step="any" class="admin-modal-input" data-field="weight" value="${escapeHtml(item.weight)}" /></label>
            </div>
            <div class="proof-center-grid">
              <label class="proof-center-field"><span class="proof-center-label">Regra</span><textarea class="admin-modal-input proof-center-textarea-small" data-field="validationRuleRaw">${escapeHtml(item.validationRuleRaw)}</textarea></label>
              <label class="proof-center-field"><span class="proof-center-label">Observacoes</span><textarea class="admin-modal-input proof-center-textarea-small" data-field="notes">${escapeHtml(item.notes)}</textarea></label>
            </div>
          </article>
        `).join("")
      : `<div class="proof-center-empty">Adicione os itens do gabarito para definir a prova mestre.</div>`;
  }

  function collectAnswerKeyItems() {
    const defaults = answerKeyDefaults();
    return Array.from(document.querySelectorAll("[data-answer-item-row]")).map((row) => {
      const questionType = row.querySelector('[data-field="questionType"]')?.value || defaults.questionType;
      return {
        questionNumber: row.querySelector('[data-field="questionNumber"]')?.value || "",
        questionType,
        expectedAnswer: row.querySelector('[data-field="expectedAnswer"]')?.value || "",
        numericTolerance: row.querySelector('[data-field="numericTolerance"]')?.value || defaults.numericTolerance || "",
        weight: row.querySelector('[data-field="weight"]')?.value || defaults.weight || "1",
        validationRule: parseRuleText(row.querySelector('[data-field="validationRuleRaw"]')?.value || defaults.validationRuleRaw || "", defaults.suggestedMode, questionType),
        notes: row.querySelector('[data-field="notes"]')?.value || "",
      };
    }).filter((item) => normalizeId(item.questionNumber) && item.expectedAnswer);
  }

  function populateAnswerKeyProof(proof = {}) {
    setValue("answerKeyProofIdInput", proof.id || "");
    setValue("answerKeyProofTitleInput", proof.titulo || "");
    setValue("answerKeyProofCodeInput", proof.proofCode || buildProofCodeFromForm());
    setValue("answerKeyProofDescriptionInput", proof.descricao || "");
    setValue("answerKeyProofDisciplineInput", proof.disciplina || "");
    setValue("answerKeyExamProviderInput", proof.examProvider || "");
    setValue("answerKeyExamNameInput", proof.examName || "");
    setValue("answerKeyExamYearInput", proof.examYear || proof.ano || "");
    setValue("answerKeyExamEditionInput", proof.examEdition || "");
    setValue("answerKeyExamDayInput", proof.examDay || "");
    setValue("answerKeyApplicationDateInput", proof.applicationDate ? String(proof.applicationDate).slice(0, 10) : "");
    setValue("answerKeyAreaSelect", proof.area || "exatas");
    setValue("answerKeySubjectGroupInput", proof.subjectGroup || "");
    setValue("answerKeyBookletColorInput", proof.bookletColor || "");
    setValue("answerKeyExamVersionInput", proof.examVersion || "");
    setValue("answerKeyLanguageInput", proof.examLanguage || "");
    setValue("answerKeyExpectedQuestionCountInput", proof.expectedQuestionCount || "");
    setValue("answerKeyParserProfileInput", proof.parserProfile || "");
    setValue("answerKeyAliasKeywordsInput", Array.isArray(proof.aliasKeywords) ? proof.aliasKeywords.join(", ") : "");
    setValue("answerKeyIdentificationNotesInput", proof.identificationNotes || proof.observacoes || "");
  }

  function renderAnswerKeyList() {
    const container = document.getElementById("answerKeyRecordList");
    const count = document.getElementById("answerKeyRecordCount");
    const proofId = getValue("answerKeyProofSelect");
    const currentId = normalizeId(state.currentAnswerKey?.id);
    const records = state.answerKeys.filter((item) => !proofId || normalizeId(item.proofId) === normalizeId(proofId));
    if (count) count.textContent = `${records.length} gabaritos`;
    if (!container) return;
    container.innerHTML = records.length
      ? records.map((item) => `
          <article class="proof-center-record-card${normalizeId(item.id) === currentId ? " is-active" : ""}" data-answer-key-id="${escapeHtml(item.id)}" tabindex="0">
            <div class="proof-center-card-head"><div class="proof-center-stack"><strong>${escapeHtml(item.proofCode || item.proofTitle || "Gabarito")}</strong><span>${escapeHtml([item.proofTitle || "Sem titulo", `${formatNumber(item.totalItems || 0)} itens`].join(" · "))}</span></div>${buildStatusBadge(item.status)}</div>
            <div class="proof-center-inline-meta"><span class="proof-center-pill">${escapeHtml(formatLabel(item.answerKeyType))}</span><span class="proof-center-pill">${escapeHtml(formatLabel(item.source))}</span></div>
          </article>
        `).join("")
      : `<div class="proof-center-empty">Nenhum gabarito foi encontrado para esse filtro.</div>`;
  }

  async function openAnswerKey(id) {
    const response = await api(`/api/admin/proof-center/answer-keys/${id}`);
    state.currentAnswerKey = response.answerKey || response || null;
    updateQueryValue("answerKey", state.currentAnswerKey?.id || "");
    updateQueryValue("proof", state.currentAnswerKey?.proofId || "");
    setValue("answerKeyProofSelect", state.currentAnswerKey?.proofId || "");
    setValue("answerKeyRecordIdInput", state.currentAnswerKey?.id || "");
    const proofResponse = state.currentAnswerKey?.proofId ? await api(`/api/admin/proof-center/proofs/${state.currentAnswerKey.proofId}`) : null;
    populateAnswerKeyProof(proofResponse?.proof || {});
    setValue("answerKeyTypeSelect", state.currentAnswerKey?.answerKeyType || "oficial");
    setValue("answerKeySourceSelect", state.currentAnswerKey?.source || "manual");
    setValue("answerKeyStatusSelect", state.currentAnswerKey?.status || "draft");
    setValue("answerKeyConfidenceInput", state.currentAnswerKey?.confidence ?? "");
    setValue("answerKeyNotesInput", state.currentAnswerKey?.notes || "");
    renderAnswerKeyItems((state.currentAnswerKey?.items || []).map((item) => createAnswerKeyItem(answerKeyDefaults(), item)));
    renderAnswerKeyList();
  }

  function resetAnswerKeyForm(proof = null) {
    state.currentAnswerKey = null;
    setValue("answerKeyRecordIdInput", "");
    setValue("answerKeyTypeSelect", "oficial");
    setValue("answerKeySourceSelect", "manual");
    setValue("answerKeyStatusSelect", "draft");
    setValue("answerKeyConfidenceInput", "");
    setValue("answerKeyNotesInput", "");
    populateAnswerKeyProof(proof || {});
    renderAnswerKeyItems([createAnswerKeyItem(answerKeyDefaults(), { questionNumber: 1 })]);
    renderAnswerKeyList();
  }

  function generateAnswerKeyLines() {
    const total = Number(getValue("answerKeyExpectedQuestionCountInput")) || 0;
    if (!total) return;
    const current = collectAnswerKeyItems();
    const byNumber = new Map(current.map((item) => [String(item.questionNumber), item]));
    renderAnswerKeyItems(Array.from({ length: total }, (_, index) => createAnswerKeyItem(answerKeyDefaults(), { ...(byNumber.get(String(index + 1)) || {}), questionNumber: index + 1 })));
  }

  async function loadAnswerKeyManager() {
    await Promise.all([ensureReference(), ensureProofs(true), ensureAnswerKeys(true)]);
    populateSelect(document.getElementById("answerKeyProofSelect"), state.proofs, { includeEmpty: true, emptyLabel: "Todas as provas", selectedValue: getQueryValue("proof") });
    populateSelect(document.getElementById("answerKeyAreaSelect"), state.reference?.proofAreas || [], { includeEmpty: false, getValue: (item) => item, getLabel: (item) => formatLabel(item), selectedValue: "exatas" });
    populateSelect(document.getElementById("answerKeyTypeSelect"), state.reference?.answerKeyRecordTypes || [], { includeEmpty: false, getValue: (item) => item, getLabel: (item) => formatLabel(item), selectedValue: "oficial" });
    populateSelect(document.getElementById("answerKeySourceSelect"), state.reference?.answerKeySources || [], { includeEmpty: false, getValue: (item) => item, getLabel: (item) => formatLabel(item), selectedValue: "manual" });
    populateSelect(document.getElementById("answerKeyStatusSelect"), state.reference?.answerKeyRecordStatuses || [], { includeEmpty: false, getValue: (item) => item, getLabel: (item) => formatLabel(item), selectedValue: "draft" });
    populateSelect(document.getElementById("answerKeyDefaultQuestionTypeSelect"), state.reference?.answerKeyQuestionTypes || [], { includeEmpty: false, getValue: (item) => item, getLabel: (item) => formatLabel(item), selectedValue: "multipla_escolha" });
    const proofId = getQueryValue("proof") || state.proofs[0]?.id || "";
    if (proofId) setValue("answerKeyProofSelect", proofId);
    const answerKeyId = getQueryValue("answerKey");
    if (answerKeyId) await openAnswerKey(answerKeyId);
    else resetAnswerKeyForm(state.proofs.find((item) => normalizeId(item.id) === normalizeId(proofId)));
    document.getElementById("answerKeyProofSelect")?.addEventListener("change", () => { updateQueryValue("proof", getValue("answerKeyProofSelect")); renderAnswerKeyList(); if (!state.currentAnswerKey) resetAnswerKeyForm(state.proofs.find((item) => normalizeId(item.id) === normalizeId(getValue("answerKeyProofSelect")))); });
    document.getElementById("answerKeyNewButton")?.addEventListener("click", () => { updateQueryValue("answerKey", ""); resetAnswerKeyForm(state.proofs.find((item) => normalizeId(item.id) === normalizeId(getValue("answerKeyProofSelect")))); });
    document.getElementById("answerKeyItemGenerateButton")?.addEventListener("click", generateAnswerKeyLines);
    document.getElementById("answerKeyItemAddButton")?.addEventListener("click", () => { const items = collectAnswerKeyItems(); items.push(createAnswerKeyItem(answerKeyDefaults(), { questionNumber: items.length + 1 })); renderAnswerKeyItems(items); });
    document.getElementById("answerKeyItemRowsList")?.addEventListener("click", (event) => { const button = event.target.closest("[data-answer-item-remove]"); if (!button) return; const items = collectAnswerKeyItems(); items.splice(Number(button.dataset.answerItemRemove || 0) || 0, 1); renderAnswerKeyItems(items.length ? items : [createAnswerKeyItem(answerKeyDefaults(), { questionNumber: 1 })]); });
    document.getElementById("answerKeyRecordList")?.addEventListener("click", async (event) => { const card = event.target.closest("[data-answer-key-id]"); if (card) await openAnswerKey(card.dataset.answerKeyId); });
    document.getElementById("answerKeyRecordList")?.addEventListener("keydown", async (event) => { if (!["Enter", " "].includes(event.key)) return; const card = event.target.closest("[data-answer-key-id]"); if (card) { event.preventDefault(); await openAnswerKey(card.dataset.answerKeyId); } });
    document.getElementById("answerKeyManagerForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = document.getElementById("answerKeyManagerFeedback");
      feedback.textContent = "Salvando gabarito mestre...";
      try {
        const selectedProof = state.proofs.find((item) => normalizeId(item.id) === normalizeId(getValue("answerKeyProofSelect"))) || {};
        const payload = {
          proof: {
            id: getValue("answerKeyProofIdInput") || selectedProof.id || "",
            titulo: getValue("answerKeyProofTitleInput") || [getValue("answerKeyExamProviderInput"), getValue("answerKeyExamYearInput"), getValue("answerKeyExamDayInput"), getValue("answerKeySubjectGroupInput"), getValue("answerKeyBookletColorInput")].filter(Boolean).join(" ") || "Prova estruturada",
            descricao: getValue("answerKeyProofDescriptionInput"),
            disciplina: getValue("answerKeyProofDisciplineInput") || getValue("answerKeySubjectGroupInput") || selectedProof.disciplina || getValue("answerKeyAreaSelect"),
            area: getValue("answerKeyAreaSelect") || selectedProof.area || "exatas",
            nivel: selectedProof.nivel || "misto",
            ano: getValue("answerKeyExamYearInput") || selectedProof.ano || "",
            tipoProva: selectedProof.tipoProva || "outro",
            status: selectedProof.status || "draft",
            origem: selectedProof.origem || "manual",
            observacoes: getValue("answerKeyIdentificationNotesInput"),
            proofCode: getValue("answerKeyProofCodeInput") || buildProofCodeFromForm(),
            examProvider: getValue("answerKeyExamProviderInput"),
            examName: getValue("answerKeyExamNameInput"),
            examYear: getValue("answerKeyExamYearInput"),
            examEdition: getValue("answerKeyExamEditionInput"),
            examDay: getValue("answerKeyExamDayInput"),
            applicationDate: getValue("answerKeyApplicationDateInput"),
            subjectGroup: getValue("answerKeySubjectGroupInput"),
            bookletColor: getValue("answerKeyBookletColorInput"),
            examVersion: getValue("answerKeyExamVersionInput"),
            language: getValue("answerKeyLanguageInput"),
            expectedQuestionCount: getValue("answerKeyExpectedQuestionCountInput"),
            parserProfile: getValue("answerKeyParserProfileInput"),
            aliasKeywords: getValue("answerKeyAliasKeywordsInput"),
            identificationNotes: getValue("answerKeyIdentificationNotesInput"),
          },
          answerKey: {
            id: getValue("answerKeyRecordIdInput"),
            answerKeyType: getValue("answerKeyTypeSelect"),
            source: getValue("answerKeySourceSelect"),
            status: getValue("answerKeyStatusSelect"),
            confidence: getValue("answerKeyConfidenceInput"),
            notes: getValue("answerKeyNotesInput"),
            items: collectAnswerKeyItems(),
          },
        };
        const response = normalizeId(payload.answerKey.id)
          ? await api(`/api/admin/proof-center/answer-keys/${payload.answerKey.id}`, { method: "PATCH", body: JSON.stringify(payload) })
          : await api("/api/admin/proof-center/answer-keys", { method: "POST", body: JSON.stringify(payload) });
        await Promise.all([ensureProofs(true), ensureAnswerKeys(true)]);
        const savedAnswerKey = response.answerKey || null;
        if (savedAnswerKey?.id) await openAnswerKey(savedAnswerKey.id);
        feedback.dataset.state = "success";
        feedback.textContent = "Gabarito mestre salvo com sucesso.";
      } catch (error) {
        feedback.dataset.state = "error";
        feedback.textContent = error?.message || "Nao foi possivel salvar o gabarito mestre.";
      }
    });
  }

  function renderImportList() {
    const container = document.getElementById("importListContainer");
    const search = getValue("importSearchInput").toLowerCase();
    const proofId = getQueryValue("proof");
    const currentId = normalizeId(state.currentImport?.id);
    const imports = state.imports.filter((item) => {
      if (proofId && ![item.provaId, item.recognizedProofId].some((candidate) => normalizeId(candidate) === proofId)) return false;
      if (!search) return true;
      return [item.arquivoNome, item.provaTitulo, item.provaCode, item.recognizedProofCode, item.processingStatus, item.matchingLevel].join(" ").toLowerCase().includes(search);
    });
    if (!container) return;
    container.innerHTML = imports.length
      ? imports.map((item) => `
          <article class="proof-center-record-card${normalizeId(item.id) === currentId ? " is-active" : ""}" data-import-id="${escapeHtml(item.id)}" tabindex="0">
            <div class="proof-center-card-head"><div class="proof-center-stack"><strong>${escapeHtml(item.arquivoNome || item.provaTitulo || "Importacao")}</strong><span>${escapeHtml([item.recognizedProofCode || item.provaCode || item.provaTitulo || "Sem prova", `${formatNumber(item.parsedQuestionCount || item.totalQuestoesDetectadas || 0)} questoes`].join(" · "))}</span></div>${buildStatusBadge(item.processingStatus || item.status)}</div>
            <div class="proof-center-inline-meta">${buildStatusBadge(item.matchingLevel || "manual")}${item.reviewRequired ? `<span class="proof-center-pill">Revisao manual</span>` : ""}</div>
          </article>
        `).join("")
      : `<div class="proof-center-empty">Nenhuma importacao encontrada para o filtro atual.</div>`;
  }

  function populateImportAnswerKeys(proofId, selectedAnswerKeyId = "") {
    populateSelect(document.getElementById("importDetailAnswerKeySelect"), state.answerKeys.filter((item) => !proofId || normalizeId(item.proofId) === normalizeId(proofId)), {
      includeEmpty: true,
      emptyLabel: "Selecione",
      selectedValue: selectedAnswerKeyId,
      getValue: (item) => item.id,
      getLabel: (item) => `${item.proofCode || item.proofTitle || "Gabarito"} · ${formatLabel(item.status)}`,
    });
  }

  function renderImportDetail(detail) {
    const header = document.getElementById("importDetailHeader");
    const summary = document.getElementById("importDetailSummary");
    const detected = document.getElementById("importDetailDetected");
    const text = document.getElementById("importDetailText");
    const parsed = document.getElementById("importDetailParsedQuestions");
    const logs = document.getElementById("importDetailLogs");
    const candidates = document.getElementById("importMatchCandidates");
    if (!detail) {
      [header, summary, detected, text, parsed, logs, candidates].forEach((container, index) => renderEmpty(container, ["Selecione uma importacao para abrir o fluxo completo.", "Nenhuma importacao selecionada.", "Os sinais detectados no PDF vao aparecer aqui.", "Nenhum texto extraido ainda.", "As questoes detectadas vao aparecer aqui.", "Os logs da importacao vao aparecer aqui.", "As sugestoes de correspondencia vao aparecer aqui."][index]));
      return;
    }
    if (header) header.innerHTML = `<div class="proof-center-stack"><strong>${escapeHtml(detail.arquivoNome || "Importacao")}</strong><span class="proof-center-muted">${escapeHtml([detail.recognizedProofCode || detail.provaCode || detail.provaTitulo || "Sem prova", formatDate(detail.updatedAt || detail.createdAt)].join(" · "))}</span>${detail.arquivoUrl ? `<a class="proof-center-inline-link" href="${escapeHtml(resolveApiHref(detail.arquivoUrl))}" target="_blank" rel="noreferrer">Abrir PDF</a>` : ""}</div><div class="proof-center-inline-meta">${buildStatusBadge(detail.processingStatus || detail.status)}${buildStatusBadge(detail.matchingLevel || "manual")}</div>`;
    if (summary) summary.innerHTML = `<article class="proof-center-info-card"><span>Score</span><strong>${escapeHtml(formatNumber(detail.matchingConfidence || 0))}%</strong></article><article class="proof-center-info-card"><span>Questoes</span><strong>${escapeHtml(formatNumber(detail.parsedQuestionCount || detail.totalQuestoesDetectadas || 0))}</strong></article><article class="proof-center-info-card"><span>Revisao</span><strong>${escapeHtml(detail.reviewRequired ? "Manual" : "Nao")}</strong></article><article class="proof-center-info-card"><span>OCR</span><strong>${escapeHtml(detail.ocrRequired ? "Necessario" : "Nao")}</strong></article>`;
    const extracted = detail.detectedMetadata?.extracted || {};
    const inconsistencies = Array.isArray(detail.processingSummary?.inconsistencies) ? detail.processingSummary.inconsistencies : [];
    if (detected) detected.innerHTML = `<article class="proof-center-card"><strong class="proof-center-card-title">Sinais detectados</strong><p class="proof-center-copy">${escapeHtml([extracted.examYear ? `Ano ${extracted.examYear}` : "", extracted.examDay || "", extracted.examArea || "", extracted.bookletColor ? `Caderno ${extracted.bookletColor}` : "", extracted.expectedQuestionCount ? `${extracted.expectedQuestionCount} questoes` : ""].filter(Boolean).join(" · ") || "O PDF ainda nao foi analisado.")}</p></article>${inconsistencies.length ? inconsistencies.map((item) => `<article class="proof-center-card"><strong class="proof-center-card-title">Inconsistencia</strong><p class="proof-center-copy">${escapeHtml(item)}</p></article>`).join("") : ""}`;
    if (text) text.innerHTML = detail.textoExtraido ? `<pre>${escapeHtml(detail.textoExtraido)}</pre>` : `<div class="proof-center-empty">Nenhum texto extraido ainda.</div>`;
    if (parsed) parsed.innerHTML = detail.parsedQuestions?.length ? detail.parsedQuestions.map((item) => `<article class="proof-center-card"><div class="proof-center-card-head"><div class="proof-center-stack"><strong class="proof-center-card-title">Q${escapeHtml(formatNumber(item.questionNumber || 0))}</strong><span class="proof-center-muted">${escapeHtml((item.stem || item.rawBlock || "").slice(0, 220))}</span></div>${buildStatusBadge(item.reviewStatus)}</div><div class="proof-center-meta"><span class="proof-center-pill">${escapeHtml(formatNumber(item.parsingConfidence || 0))}% confianca</span><span class="proof-center-pill">${escapeHtml(formatNumber(item.alternatives?.length || 0))} alternativas</span></div></article>`).join("") : `<div class="proof-center-empty">O parser ainda nao separou questoes para revisao.</div>`;
    if (logs) logs.innerHTML = detail.logs?.length ? detail.logs.map((item) => `<article class="proof-center-card"><div class="proof-center-card-head"><strong class="proof-center-card-title">${escapeHtml(formatLabel(item.status || "pendente"))}</strong><span class="proof-center-muted">${escapeHtml(formatDate(item.createdAt))}</span></div><p class="proof-center-copy">${escapeHtml(item.message || "Sem mensagem registrada")}</p></article>`).join("") : `<div class="proof-center-empty">Nenhum log de processamento registrado ainda.</div>`;
    if (candidates) candidates.innerHTML = detail.matchCandidates?.length ? detail.matchCandidates.map((item) => `<article class="proof-center-card"><div class="proof-center-card-head"><div class="proof-center-stack"><strong class="proof-center-card-title">${escapeHtml(item.proofCode || item.proofId)}</strong><span class="proof-center-muted">${escapeHtml(formatNumber(item.score || 0))}% de compatibilidade</span></div>${buildStatusBadge(item.score >= 78 ? "automatic" : item.score >= 52 ? "suggested" : "manual")}</div></article>`).join("") : `<div class="proof-center-empty">As sugestoes de vinculo vao aparecer depois da analise.</div>`;
    populateSelect(document.getElementById("importDetailProofSelect"), state.proofs, { includeEmpty: true, emptyLabel: "Selecione", selectedValue: detail.recognizedProofId || detail.provaId || "", getValue: (item) => item.id, getLabel: (item) => item.proofCode || item.titulo });
    populateImportAnswerKeys(detail.recognizedProofId || detail.provaId || "", detail.recognizedAnswerKeyId || "");
  }

  async function openImport(id) {
    const response = await api(`/api/admin/proof-center/imports/${id}`);
    state.currentImport = response.import || response || null;
    updateQueryValue("import", state.currentImport?.id || "");
    renderImportList();
    renderImportDetail(state.currentImport);
  }

  async function loadImportsManager() {
    await Promise.all([ensureReference(), ensureProofs(true), ensureAnswerKeys(true), ensureImports(true)]);
    populateSelect(document.getElementById("importProofSelect"), state.proofs, { includeEmpty: true, emptyLabel: "Reconhecer automaticamente", selectedValue: getQueryValue("proof"), getValue: (item) => item.id, getLabel: (item) => item.proofCode || item.titulo });
    populateSelect(document.getElementById("importFileTypeSelect"), (state.reference?.fileTypes || []).filter((item) => ["pdf_original", "pdf_gabarito", "anexo"].includes(item)), { includeEmpty: false, selectedValue: "pdf_original", getValue: (item) => item, getLabel: (item) => formatLabel(item) });
    renderImportList();
    document.getElementById("importSearchInput")?.addEventListener("input", renderImportList);
    document.getElementById("importListContainer")?.addEventListener("click", async (event) => { const card = event.target.closest("[data-import-id]"); if (card) await openImport(card.dataset.importId); });
    document.getElementById("importListContainer")?.addEventListener("keydown", async (event) => { if (!["Enter", " "].includes(event.key)) return; const card = event.target.closest("[data-import-id]"); if (card) { event.preventDefault(); await openImport(card.dataset.importId); } });
    document.getElementById("importDetailProofSelect")?.addEventListener("change", () => populateImportAnswerKeys(getValue("importDetailProofSelect"), state.currentImport?.recognizedAnswerKeyId || ""));
    document.getElementById("importForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const feedback = document.getElementById("importFeedback");
      feedback.textContent = "Enviando PDF para a fila de analise...";
      try {
        const file = document.getElementById("importFileInput")?.files?.[0] || null;
        const textOverride = getValue("importTextOverrideInput");
        if (!file && !textOverride) throw new Error("Envie um PDF ou informe um texto extraido manualmente.");
        const payload = { proofId: getValue("importProofSelect"), fileType: getValue("importFileTypeSelect") || "pdf_original", textoExtraido: textOverride, logParser: getValue("importLogInput") };
        if (file) payload.file = await readFileAsBase64(file);
        const response = await api("/api/admin/proof-center/imports", { method: "POST", body: JSON.stringify(payload) });
        await Promise.all([ensureImports(true), ensureProofs(true)]);
        feedback.dataset.state = "success";
        feedback.textContent = "PDF registrado na fila de analise.";
        setValue("importTextOverrideInput", "");
        setValue("importLogInput", "");
        const fileInput = document.getElementById("importFileInput");
        if (fileInput) fileInput.value = "";
        renderImportList();
        if (response.import?.id) await openImport(response.import.id);
      } catch (error) {
        feedback.dataset.state = "error";
        feedback.textContent = error?.message || "Nao foi possivel registrar o PDF.";
      }
    });
    document.getElementById("importAnalyzeButton")?.addEventListener("click", async () => {
      const feedback = document.getElementById("importDetailFeedback");
      if (!state.currentImport?.id) return;
      feedback.textContent = "Analisando PDF e procurando a prova correspondente...";
      try {
        const response = await api(`/api/admin/proof-center/imports/${state.currentImport.id}/analyze`, { method: "POST", body: JSON.stringify({}) });
        await Promise.all([ensureImports(true), ensureProofs(true)]);
        state.currentImport = response.import || response || null;
        renderImportList();
        renderImportDetail(state.currentImport);
        feedback.dataset.state = "success";
        feedback.textContent = "Analise concluida.";
      } catch (error) {
        feedback.dataset.state = "error";
        feedback.textContent = error?.message || "Nao foi possivel analisar o PDF.";
      }
    });
    document.getElementById("importConfirmMatchButton")?.addEventListener("click", async () => {
      const feedback = document.getElementById("importDetailFeedback");
      if (!state.currentImport?.id) return;
      feedback.textContent = "Confirmando identificacao da prova...";
      try {
        const response = await api(`/api/admin/proof-center/imports/${state.currentImport.id}/match`, { method: "PATCH", body: JSON.stringify({ proofId: getValue("importDetailProofSelect"), answerKeyId: getValue("importDetailAnswerKeySelect") }) });
        await Promise.all([ensureImports(true), ensureProofs(true)]);
        state.currentImport = response.import || response || null;
        renderImportList();
        renderImportDetail(state.currentImport);
        feedback.dataset.state = "success";
        feedback.textContent = "Vinculo confirmado.";
      } catch (error) {
        feedback.dataset.state = "error";
        feedback.textContent = error?.message || "Nao foi possivel confirmar o vinculo.";
      }
    });
    document.getElementById("importImportQuestionsButton")?.addEventListener("click", async () => {
      const feedback = document.getElementById("importDetailFeedback");
      if (!state.currentImport?.id) return;
      feedback.textContent = "Importando questoes parseadas...";
      try {
        const response = await api(`/api/admin/proof-center/imports/${state.currentImport.id}/import-questions`, { method: "POST", body: JSON.stringify({}) });
        await Promise.all([ensureImports(true), ensureProofs(true)]);
        state.currentImport = response.import || response || null;
        renderImportList();
        renderImportDetail(state.currentImport);
        feedback.dataset.state = "success";
        feedback.textContent = "Questoes importadas para revisao.";
      } catch (error) {
        feedback.dataset.state = "error";
        feedback.textContent = error?.message || "Nao foi possivel importar as questoes.";
      }
    });
    const importId = getQueryValue("import") || state.imports[0]?.id || "";
    if (importId) await openImport(importId);
    else renderImportDetail(null);
  }

  async function bootstrap() {
    await (window.Start5Auth?.ready || Promise.resolve());
    switch (view) {
      case "hub-operations":
        await loadHubOperations();
        break;
      case "answer-key-manager":
        await loadAnswerKeyManager();
        break;
      case "imports-manager":
        await loadImportsManager();
        break;
      default:
        break;
    }
  }

  bootstrap().catch((error) => {
    console.error("Erro ao carregar operacoes do proof center:", error);
  });
})();
