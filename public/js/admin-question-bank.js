(function initializeAdminQuestionBank() {
  const ALTERNATIVE_LETTERS = ["A", "B", "C", "D", "E"];
  const state = {
    reference: null,
    proofs: [],
    selectedProof: null,
    selectedProofId: 0,
    selectedQuestionId: 0,
  };

  const questionBankRefreshButton = document.getElementById("questionBankRefreshButton");
  const questionBankProofsValue = document.getElementById("questionBankProofsValue");
  const questionBankPublishedProofsValue = document.getElementById("questionBankPublishedProofsValue");
  const questionBankQuestionsValue = document.getElementById("questionBankQuestionsValue");
  const questionBankPendingQuestionsValue = document.getElementById("questionBankPendingQuestionsValue");
  const questionBankAttemptsValue = document.getElementById("questionBankAttemptsValue");

  const questionProofForm = document.getElementById("questionProofForm");
  const questionProofIdInput = document.getElementById("questionProofIdInput");
  const questionProofExamSelect = document.getElementById("questionProofExamSelect");
  const questionProofYearInput = document.getElementById("questionProofYearInput");
  const questionProofStatusSelect = document.getElementById("questionProofStatusSelect");
  const questionProofPhaseInput = document.getElementById("questionProofPhaseInput");
  const questionProofVersionInput = document.getElementById("questionProofVersionInput");
  const questionProofSubjectInput = document.getElementById("questionProofSubjectInput");
  const questionProofPdfInput = document.getElementById("questionProofPdfInput");
  const questionProofNewExamNameInput = document.getElementById("questionProofNewExamNameInput");
  const questionProofNewExamSiglaInput = document.getElementById("questionProofNewExamSiglaInput");
  const questionProofExtractedTextInput = document.getElementById("questionProofExtractedTextInput");
  const questionProofFormFeedback = document.getElementById("questionProofFormFeedback");
  const questionProofResetButton = document.getElementById("questionProofResetButton");
  const questionProofSubmitButton = document.getElementById("questionProofSubmitButton");

  const questionProofList = document.getElementById("questionProofList");
  const questionProofDetail = document.getElementById("questionProofDetail");
  const questionProofQuestions = document.getElementById("questionProofQuestions");
  const questionProofProcessButton = document.getElementById("questionProofProcessButton");
  const questionProofPublishButton = document.getElementById("questionProofPublishButton");
  const questionProofDownloadButton = document.getElementById("questionProofDownloadButton");

  const questionEditorForm = document.getElementById("questionEditorForm");
  const questionEditorIdInput = document.getElementById("questionEditorIdInput");
  const questionEditorProofIdInput = document.getElementById("questionEditorProofIdInput");
  const questionEditorNumberInput = document.getElementById("questionEditorNumberInput");
  const questionEditorDifficultySelect = document.getElementById("questionEditorDifficultySelect");
  const questionEditorReviewStatusSelect = document.getElementById("questionEditorReviewStatusSelect");
  const questionEditorMatterInput = document.getElementById("questionEditorMatterInput");
  const questionEditorThemeInput = document.getElementById("questionEditorThemeInput");
  const questionEditorOriginInput = document.getElementById("questionEditorOriginInput");
  const questionEditorPromptInput = document.getElementById("questionEditorPromptInput");
  const questionEditorCorrectAnswerSelect = document.getElementById("questionEditorCorrectAnswerSelect");
  const questionEditorSuggestionInput = document.getElementById("questionEditorSuggestionInput");
  const questionEditorNotesInput = document.getElementById("questionEditorNotesInput");
  const questionEditorFeedback = document.getElementById("questionEditorFeedback");
  const questionEditorResetButton = document.getElementById("questionEditorResetButton");
  const questionEditorSubmitButton = document.getElementById("questionEditorSubmitButton");
  const questionEditorNewButton = document.getElementById("questionEditorNewButton");

  const questionAlternativeInputs = Object.fromEntries(
    ALTERNATIVE_LETTERS.map((letter) => [letter, document.getElementById(`questionAlternative${letter}Input`)])
  );

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatShortText(value, fallback = "Sem dado") {
    const text = String(value || "").trim();
    return text || fallback;
  }

  function titleCase(value) {
    return String(value || "")
      .split(/[\s_-]+/g)
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
  }

  function formatQuestionBankLabel(value, fallback = "Sem dado") {
    const normalized = String(value || "").trim();

    if (!normalized) {
      return fallback;
    }

    const lookup = {
      draft: "Rascunho",
      review: "Em revisao",
      published: "Publicada",
      processed: "Processada",
      needs_review: "Revisar extracao",
      pending: "Pendente",
      approved: "Aprovada",
      rejected: "Reprovada",
      facil: "Facil",
      media: "Media",
      dificil: "Dificil",
    };

    return lookup[normalized] || titleCase(normalized);
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
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatFileSize(value) {
    const size = Number(value) || 0;

    if (size <= 0) {
      return "Sem arquivo";
    }

    if (size >= 1_000_000) {
      return `${(size / 1_000_000).toFixed(1).replace(".", ",")} MB`;
    }

    return `${Math.max(1, Math.round(size / 1_000))} KB`;
  }

  function getStatusTone(value) {
    const normalized = String(value || "").trim();

    if (["published", "approved"].includes(normalized)) {
      return normalized;
    }

    if (["review", "pending", "processed"].includes(normalized)) {
      return normalized;
    }

    if (["rejected"].includes(normalized)) {
      return normalized;
    }

    return normalized || "draft";
  }

  function setFeedback(element, message, stateName = "") {
    if (!element) {
      return;
    }

    element.textContent = message || "";
    element.dataset.state = stateName;
  }

  function setButtonLoading(button, loading, loadingText, idleText) {
    if (!button) {
      return;
    }

    button.disabled = loading;
    button.textContent = loading ? loadingText : idleText;
  }

  function getSelectedProof() {
    return state.selectedProof;
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = String(reader.result || "");
        const dataBase64 = result.includes(",") ? result.split(",").pop() : result;
        resolve({
          fileName: file.name,
          mimeType: file.type || "application/pdf",
          dataBase64,
        });
      };

      reader.onerror = () => {
        reject(new Error("Nao foi possivel ler o PDF selecionado."));
      };

      reader.readAsDataURL(file);
    });
  }

  function renderAdminMetrics(overview = {}) {
    if (questionBankProofsValue) {
      questionBankProofsValue.textContent = String(overview.totalProofs || 0);
    }

    if (questionBankPublishedProofsValue) {
      questionBankPublishedProofsValue.textContent = String(overview.publishedProofs || 0);
    }

    if (questionBankQuestionsValue) {
      questionBankQuestionsValue.textContent = String(overview.totalQuestions || 0);
    }

    if (questionBankPendingQuestionsValue) {
      questionBankPendingQuestionsValue.textContent = String(overview.pendingQuestions || 0);
    }

    if (questionBankAttemptsValue) {
      questionBankAttemptsValue.textContent = String(overview.totalAttempts || 0);
    }
  }

  function renderExamOptions() {
    if (!questionProofExamSelect) {
      return;
    }

    const currentValue = questionProofExamSelect.value;
    const options = Array.isArray(state.reference?.vestibulares) ? state.reference.vestibulares : [];
    const markup = [
      '<option value="">Selecione um vestibular</option>',
      ...options.map((exam) => (
        `<option value="${Number(exam.id) || 0}">${escapeHtml(exam.sigla)} - ${escapeHtml(exam.nome)}</option>`
      )),
    ].join("");

    questionProofExamSelect.innerHTML = markup;

    if (currentValue && [...questionProofExamSelect.options].some((option) => option.value === currentValue)) {
      questionProofExamSelect.value = currentValue;
    }
  }

  function renderProofList() {
    if (!questionProofList) {
      return;
    }

    if (!state.proofs.length) {
      questionProofList.innerHTML = '<div class="question-bank-proof-empty">Nenhuma prova cadastrada ainda.</div>';
      return;
    }

    questionProofList.innerHTML = state.proofs.map((proof) => {
      const isActive = Number(proof.id) === Number(state.selectedProofId);

      return `
        <article class="question-bank-proof-card ${isActive ? "is-active" : ""}">
          <div class="question-bank-proof-card-head">
            <div>
              <h4 class="question-bank-proof-title">${escapeHtml(proof.vestibular.sigla)} ${escapeHtml(String(proof.ano || ""))}</h4>
              <p class="question-bank-proof-copy">${escapeHtml(formatShortText(proof.fase, "Sem fase"))} • ${escapeHtml(formatShortText(proof.versao, "Sem versao"))}</p>
            </div>

            <span class="question-bank-status" data-tone="${escapeHtml(getStatusTone(proof.status))}">
              ${escapeHtml(formatQuestionBankLabel(proof.status))}
            </span>
          </div>

          <div class="question-bank-proof-meta">
            <span class="question-bank-pill">${escapeHtml(proof.vestibular.nome)}</span>
            <span class="question-bank-pill">${escapeHtml(formatShortText(proof.materiaGeral, "Materia livre"))}</span>
            <span class="question-bank-pill">${escapeHtml(String(proof.counts.totalQuestions || 0))} questoes</span>
            <span class="question-bank-pill">${escapeHtml(String(proof.counts.approvedQuestions || 0))} aprovadas</span>
          </div>

          <div class="question-bank-proof-actions">
            <button type="button" class="module-link" data-proof-open="${Number(proof.id) || 0}">
              Abrir revisao
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderProofDetail() {
    if (!questionProofDetail) {
      return;
    }

    const proof = getSelectedProof();

    questionProofProcessButton.disabled = !proof;
    questionProofPublishButton.disabled = !proof;
    questionProofDownloadButton.disabled = !proof?.pdf?.downloadUrl;
    questionEditorNewButton.disabled = !proof;

    if (!proof) {
      questionProofDetail.innerHTML = '<div class="question-bank-empty">Selecione uma prova para abrir a revisao.</div>';
      return;
    }

    questionProofDetail.innerHTML = `
      <article class="question-bank-proof-detail-card">
        <div class="question-bank-proof-card-head">
          <div>
            <h4 class="question-bank-proof-title">${escapeHtml(proof.vestibular.sigla)} ${escapeHtml(String(proof.ano || ""))}</h4>
            <p class="question-bank-proof-copy">
              ${escapeHtml(formatShortText(proof.fase, "Sem fase"))} • ${escapeHtml(formatShortText(proof.versao, "Sem versao"))}
            </p>
          </div>

          <div class="question-bank-proof-chips">
            <span class="question-bank-status" data-tone="${escapeHtml(getStatusTone(proof.status))}">
              ${escapeHtml(formatQuestionBankLabel(proof.status))}
            </span>
            <span class="question-bank-status" data-tone="${escapeHtml(getStatusTone(proof.processStatus))}">
              ${escapeHtml(formatQuestionBankLabel(proof.processStatus))}
            </span>
          </div>
        </div>

        <div class="question-bank-proof-meta">
          <span class="question-bank-pill">${escapeHtml(formatShortText(proof.materiaGeral, "Materia geral livre"))}</span>
          <span class="question-bank-pill">${escapeHtml(String(proof.counts.totalQuestions || 0))} questoes</span>
          <span class="question-bank-pill">${escapeHtml(String(proof.counts.approvedQuestions || 0))} aprovadas</span>
          <span class="question-bank-pill">${escapeHtml(String(proof.counts.pendingQuestions || 0))} pendentes</span>
          <span class="question-bank-pill">${escapeHtml(formatFileSize(proof.pdf.sizeBytes))}</span>
        </div>

        <p class="question-bank-proof-copy">
          Ultima atualizacao em ${escapeHtml(formatDate(proof.updatedAt))}. Texto bruto salvo: ${escapeHtml(String(proof.extractedTextLength || 0))} caracteres.
        </p>

        <div class="question-bank-proof-actions">
          <button type="button" class="module-link" data-proof-edit="${Number(proof.id) || 0}">
            Editar metadados
          </button>
          <button type="button" class="module-link" data-proof-new-question="${Number(proof.id) || 0}">
            Nova questao manual
          </button>
        </div>
      </article>
    `;
  }

  function renderQuestionList() {
    if (!questionProofQuestions) {
      return;
    }

    const proof = getSelectedProof();
    const questions = Array.isArray(proof?.questions) ? proof.questions : [];

    if (!proof) {
      questionProofQuestions.innerHTML = '<div class="question-bank-empty">As questoes da prova aparecem aqui depois da selecao.</div>';
      return;
    }

    if (!questions.length) {
      questionProofQuestions.innerHTML = '<div class="question-bank-empty">Essa prova ainda nao tem questoes salvas.</div>';
      return;
    }

    questionProofQuestions.innerHTML = questions.map((question) => {
      const isActive = Number(question.id) === Number(state.selectedQuestionId);
      const excerpt = formatShortText(question.enunciado, "");

      return `
        <article class="question-bank-question-card ${isActive ? "is-active" : ""}">
          <div class="question-bank-question-head">
            <div>
              <h4 class="question-bank-question-title">Questao ${escapeHtml(String(question.numero || "?"))}</h4>
              <p class="question-bank-question-copy">${escapeHtml(excerpt.length > 180 ? `${excerpt.slice(0, 180)}...` : excerpt || "Sem enunciado ainda.")}</p>
            </div>

            <span class="question-bank-status" data-tone="${escapeHtml(getStatusTone(question.statusRevisao))}">
              ${escapeHtml(formatQuestionBankLabel(question.statusRevisao))}
            </span>
          </div>

          <div class="question-bank-question-meta">
            <span class="question-bank-pill">${escapeHtml(formatQuestionBankLabel(question.materia, "Sem materia"))}</span>
            <span class="question-bank-pill">${escapeHtml(formatQuestionBankLabel(question.tema, "Sem tema"))}</span>
            <span class="question-bank-pill">${escapeHtml(formatQuestionBankLabel(question.dificuldade))}</span>
            <span class="question-bank-pill">${escapeHtml(String(question.stats.totalAnswers || 0))} respostas</span>
          </div>

          <div class="question-bank-proof-actions">
            <button type="button" class="module-link" data-question-open="${Number(question.id) || 0}">
              Revisar questao
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function setProofFormMode(isEditing) {
    if (!questionProofSubmitButton || !questionProofPdfInput) {
      return;
    }

    questionProofSubmitButton.textContent = isEditing ? "Atualizar prova" : "Salvar prova";
    questionProofPdfInput.required = !isEditing;
  }

  function resetProofForm() {
    if (!questionProofForm) {
      return;
    }

    questionProofForm.reset();

    if (questionProofIdInput) questionProofIdInput.value = "";
    if (questionProofStatusSelect) questionProofStatusSelect.value = "draft";
    if (questionProofSubjectInput) questionProofSubjectInput.value = "";
    if (questionProofExtractedTextInput) questionProofExtractedTextInput.value = "";
    if (questionProofNewExamNameInput) questionProofNewExamNameInput.value = "";
    if (questionProofNewExamSiglaInput) questionProofNewExamSiglaInput.value = "";
    setFeedback(questionProofFormFeedback, "");
    setProofFormMode(false);
  }

  function populateProofForm(proof) {
    if (!proof) {
      resetProofForm();
      return;
    }

    if (questionProofIdInput) questionProofIdInput.value = String(proof.id || "");
    if (questionProofExamSelect) questionProofExamSelect.value = String(proof.vestibular.id || "");
    if (questionProofYearInput) questionProofYearInput.value = String(proof.ano || "");
    if (questionProofStatusSelect) questionProofStatusSelect.value = String(proof.status || "draft");
    if (questionProofPhaseInput) questionProofPhaseInput.value = proof.fase || "";
    if (questionProofVersionInput) questionProofVersionInput.value = proof.versao || "";
    if (questionProofSubjectInput) questionProofSubjectInput.value = proof.materiaGeral || "";
    if (questionProofExtractedTextInput) questionProofExtractedTextInput.value = proof.extractedText || "";
    if (questionProofNewExamNameInput) questionProofNewExamNameInput.value = "";
    if (questionProofNewExamSiglaInput) questionProofNewExamSiglaInput.value = "";
    setFeedback(questionProofFormFeedback, "");
    setProofFormMode(true);
  }

  function setQuestionEditorEnabled(enabled) {
    if (!questionEditorForm) {
      return;
    }

    questionEditorForm.querySelectorAll("input, textarea, select, button").forEach((element) => {
      if (element === questionEditorResetButton || element === questionEditorSubmitButton) {
        return;
      }

      element.disabled = !enabled;
    });

    if (questionEditorResetButton) {
      questionEditorResetButton.disabled = !enabled;
    }

    if (questionEditorSubmitButton) {
      questionEditorSubmitButton.disabled = !enabled;
    }
  }

  function resetQuestionEditor(options = {}) {
    if (!questionEditorForm) {
      return;
    }

    const proof = getSelectedProof();
    const keepProof = options.keepProof !== false && proof;

    questionEditorForm.reset();
    if (questionEditorIdInput) questionEditorIdInput.value = "";
    if (questionEditorProofIdInput) questionEditorProofIdInput.value = keepProof ? String(proof.id || "") : "";
    if (questionEditorSuggestionInput) questionEditorSuggestionInput.value = "";
    ALTERNATIVE_LETTERS.forEach((letter) => {
      if (questionAlternativeInputs[letter]) {
        questionAlternativeInputs[letter].value = "";
      }
    });
    setFeedback(questionEditorFeedback, "");
    state.selectedQuestionId = 0;
    setQuestionEditorEnabled(Boolean(keepProof));
    renderQuestionList();
  }

  function populateQuestionEditor(question) {
    if (!question) {
      resetQuestionEditor({ keepProof: Boolean(getSelectedProof()) });
      return;
    }

    if (questionEditorIdInput) questionEditorIdInput.value = String(question.id || "");
    if (questionEditorProofIdInput) questionEditorProofIdInput.value = String(question.provaId || "");
    if (questionEditorNumberInput) questionEditorNumberInput.value = String(question.numero || "");
    if (questionEditorDifficultySelect) questionEditorDifficultySelect.value = String(question.dificuldade || "media");
    if (questionEditorReviewStatusSelect) {
      questionEditorReviewStatusSelect.value = String(question.statusRevisao || "pending");
    }
    if (questionEditorMatterInput) questionEditorMatterInput.value = question.materia || "";
    if (questionEditorThemeInput) questionEditorThemeInput.value = question.tema || "";
    if (questionEditorOriginInput) questionEditorOriginInput.value = question.origemPdf || "";
    if (questionEditorPromptInput) questionEditorPromptInput.value = question.enunciado || "";
    if (questionEditorCorrectAnswerSelect) {
      questionEditorCorrectAnswerSelect.value = question.respostaCorreta || "";
    }
    if (questionEditorNotesInput) questionEditorNotesInput.value = question.observacoesAdm || "";
    if (questionEditorSuggestionInput) {
      questionEditorSuggestionInput.value = [
        question.sugestoes?.materia ? `Materia: ${question.sugestoes.materia}` : "",
        question.sugestoes?.tema ? `Tema: ${question.sugestoes.tema}` : "",
        question.sugestoes?.dificuldade ? `Dificuldade: ${question.sugestoes.dificuldade}` : "",
      ].filter(Boolean).join(" | ");
    }

    ALTERNATIVE_LETTERS.forEach((letter) => {
      const match = Array.isArray(question.alternatives)
        ? question.alternatives.find((item) => item.letra === letter)
        : null;

      if (questionAlternativeInputs[letter]) {
        questionAlternativeInputs[letter].value = match?.texto || "";
      }
    });

    setFeedback(questionEditorFeedback, "");
    setQuestionEditorEnabled(true);
  }

  async function loadQuestionProof(proofId, options = {}) {
    if (!proofId) {
      state.selectedProofId = 0;
      state.selectedProof = null;
      state.selectedQuestionId = 0;
      renderProofDetail();
      renderQuestionList();
      resetQuestionEditor({ keepProof: false });
      return;
    }

    const response = await window.Start5Auth.apiRequest(`/api/admin/question-bank/provas/${proofId}`);
    state.selectedProofId = Number(response.proof?.id) || 0;
    state.selectedProof = {
      ...response.proof,
      questions: Array.isArray(response.questions) ? response.questions : [],
    };

    renderProofDetail();
    populateProofForm(response.proof);

    const requestedQuestionId = Number(options.questionId || state.selectedQuestionId || 0);
    const nextQuestion = state.selectedProof.questions.find((question) => Number(question.id) === requestedQuestionId)
      || state.selectedProof.questions[0]
      || null;

    state.selectedQuestionId = Number(nextQuestion?.id) || 0;
    renderQuestionList();

    if (nextQuestion) {
      populateQuestionEditor(nextQuestion);
    } else {
      resetQuestionEditor({ keepProof: true });
    }
  }

  async function loadQuestionBankAdminData(options = {}) {
    try {
      await window.Start5Auth?.ready;

      const [referenceResponse, proofsResponse] = await Promise.all([
        window.Start5Auth.apiRequest("/api/admin/question-bank/reference"),
        window.Start5Auth.apiRequest("/api/admin/question-bank/provas"),
      ]);

      state.reference = referenceResponse.reference || {};
      state.proofs = Array.isArray(proofsResponse.proofs) ? proofsResponse.proofs : [];

      renderAdminMetrics(proofsResponse.overview || referenceResponse.overview || {});
      renderExamOptions();
      renderProofList();

      const shouldPreserveSelection = options.preserveSelection !== false;
      const nextProofId = shouldPreserveSelection
        ? state.selectedProofId && state.proofs.some((proof) => Number(proof.id) === Number(state.selectedProofId))
          ? state.selectedProofId
          : 0
        : 0;

      if (nextProofId) {
        await loadQuestionProof(nextProofId, {
          questionId: state.selectedQuestionId,
        });
      } else if (options.autoSelectFirst && state.proofs.length) {
        await loadQuestionProof(state.proofs[0].id);
      } else {
        state.selectedProofId = 0;
        state.selectedProof = null;
        state.selectedQuestionId = 0;
        renderProofDetail();
        renderQuestionList();
        resetProofForm();
        resetQuestionEditor({ keepProof: false });
      }
    } catch (error) {
      console.error("Erro ao carregar Banco de Questoes:", error);
      if (questionProofList) {
        questionProofList.innerHTML = `<div class="question-bank-proof-empty">${escapeHtml(error.message || "Nao foi possivel carregar o Banco de Questoes.")}</div>`;
      }
      if (questionProofDetail) {
        questionProofDetail.innerHTML = '<div class="question-bank-empty">Nao foi possivel carregar os dados da revisao.</div>';
      }
      if (questionProofQuestions) {
        questionProofQuestions.innerHTML = '<div class="question-bank-empty">As questoes nao puderam ser carregadas.</div>';
      }
    }
  }

  async function readProofFormPayload() {
    const pdfFile = questionProofPdfInput?.files?.[0] || null;
    const payload = {
      vestibularId: questionProofExamSelect?.value || "",
      vestibularNome: questionProofNewExamNameInput?.value.trim() || "",
      vestibularSigla: questionProofNewExamSiglaInput?.value.trim() || "",
      ano: Number(questionProofYearInput?.value || 0),
      status: questionProofStatusSelect?.value || "draft",
      fase: questionProofPhaseInput?.value.trim() || "",
      versao: questionProofVersionInput?.value.trim() || "",
      materiaGeral: questionProofSubjectInput?.value.trim() || "",
      extractedText: questionProofExtractedTextInput?.value || "",
    };

    if (pdfFile) {
      payload.pdfFile = await readFileAsBase64(pdfFile);
    }

    return payload;
  }

  function buildQuestionPayload() {
    const proofId = Number(questionEditorProofIdInput?.value || state.selectedProofId || 0);
    const alternatives = ALTERNATIVE_LETTERS.map((letter) => ({
      letra: letter,
      texto: questionAlternativeInputs[letter]?.value || "",
    }));

    return {
      provaId: proofId,
      numero: Number(questionEditorNumberInput?.value || 0),
      dificuldade: questionEditorDifficultySelect?.value || "media",
      statusRevisao: questionEditorReviewStatusSelect?.value || "pending",
      materia: questionEditorMatterInput?.value.trim() || "",
      tema: questionEditorThemeInput?.value.trim() || "",
      origemPdf: questionEditorOriginInput?.value.trim() || "",
      enunciado: questionEditorPromptInput?.value || "",
      alternativas: alternatives,
      respostaCorreta: questionEditorCorrectAnswerSelect?.value || "",
      observacoesAdm: questionEditorNotesInput?.value || "",
    };
  }

  async function submitProofForm(event) {
    event.preventDefault();

    if (!questionProofForm) {
      return;
    }

    try {
      setFeedback(questionProofFormFeedback, "");
      setButtonLoading(
        questionProofSubmitButton,
        true,
        "Salvando...",
        questionProofIdInput?.value ? "Atualizar prova" : "Salvar prova"
      );
      const payload = await readProofFormPayload();
      const proofId = Number(questionProofIdInput?.value || 0);
      const response = proofId
        ? await window.Start5Auth.apiRequest(`/api/admin/question-bank/provas/${proofId}`, {
            method: "PATCH",
            body: payload,
          })
        : await window.Start5Auth.apiRequest("/api/admin/question-bank/provas", {
            method: "POST",
            body: payload,
          });

      setFeedback(
        questionProofFormFeedback,
        proofId ? "Prova atualizada com sucesso." : "Prova salva com sucesso.",
        "success"
      );

      if (questionProofPdfInput) {
        questionProofPdfInput.value = "";
      }

      await loadQuestionBankAdminData({ preserveSelection: false });
      await loadQuestionProof(response.proof?.id, { questionId: 0 });
    } catch (error) {
      setFeedback(questionProofFormFeedback, error.message || "Nao foi possivel salvar a prova.", "error");
    } finally {
      setButtonLoading(
        questionProofSubmitButton,
        false,
        "Salvando...",
        questionProofIdInput?.value ? "Atualizar prova" : "Salvar prova"
      );
    }
  }

  async function processSelectedProof() {
    const proof = getSelectedProof();

    if (!proof) {
      return;
    }

    const shouldReplace = proof.counts.totalQuestions > 0
      ? window.confirm("Essa prova ja tem questoes. Deseja substituir as questoes atuais pelo novo processamento?")
      : true;

    if (!shouldReplace) {
      return;
    }

    try {
      setButtonLoading(questionProofProcessButton, true, "Processando...", "Processar prova");
      await window.Start5Auth.apiRequest(`/api/admin/question-bank/provas/${proof.id}/process`, {
        method: "POST",
        body: {
          replaceExisting: Boolean(proof.counts.totalQuestions),
          extractedText: questionProofExtractedTextInput?.value || proof.extractedText || "",
        },
      });

      await loadQuestionBankAdminData({ preserveSelection: true });
      await loadQuestionProof(proof.id);
      setFeedback(questionProofFormFeedback, "Processamento concluido. Revise as questoes extraidas.", "success");
    } catch (error) {
      setFeedback(questionProofFormFeedback, error.message || "Nao foi possivel processar a prova.", "error");
    } finally {
      setButtonLoading(questionProofProcessButton, false, "Processando...", "Processar prova");
    }
  }

  async function publishSelectedProof() {
    const proof = getSelectedProof();

    if (!proof) {
      return;
    }

    try {
      setButtonLoading(questionProofPublishButton, true, "Publicando...", "Publicar aprovadas");
      await window.Start5Auth.apiRequest(`/api/admin/question-bank/provas/${proof.id}/publish`, {
        method: "POST",
      });
      await loadQuestionBankAdminData({ preserveSelection: true });
      await loadQuestionProof(proof.id, { questionId: state.selectedQuestionId });
      setFeedback(questionProofFormFeedback, "Questoes aprovadas publicadas no banco ativo.", "success");
    } catch (error) {
      setFeedback(questionProofFormFeedback, error.message || "Nao foi possivel publicar a prova.", "error");
    } finally {
      setButtonLoading(questionProofPublishButton, false, "Publicando...", "Publicar aprovadas");
    }
  }

  async function submitQuestionEditor(event) {
    event.preventDefault();

    const proof = getSelectedProof();

    if (!proof) {
      setFeedback(questionEditorFeedback, "Selecione uma prova antes de salvar questoes.", "error");
      return;
    }

    try {
      setFeedback(questionEditorFeedback, "");
      setButtonLoading(questionEditorSubmitButton, true, "Salvando...", "Salvar questao");
      const payload = buildQuestionPayload();
      const questionId = Number(questionEditorIdInput?.value || 0);
      const response = questionId
        ? await window.Start5Auth.apiRequest(`/api/admin/question-bank/questoes/${questionId}`, {
            method: "PATCH",
            body: payload,
          })
        : await window.Start5Auth.apiRequest("/api/admin/question-bank/questoes", {
            method: "POST",
            body: payload,
          });

      setFeedback(questionEditorFeedback, "Questao salva com sucesso.", "success");
      await loadQuestionBankAdminData({ preserveSelection: true });
      await loadQuestionProof(proof.id, { questionId: response.question?.id });
    } catch (error) {
      setFeedback(questionEditorFeedback, error.message || "Nao foi possivel salvar a questao.", "error");
    } finally {
      setButtonLoading(questionEditorSubmitButton, false, "Salvando...", "Salvar questao");
    }
  }

  questionBankRefreshButton?.addEventListener("click", () => {
    loadQuestionBankAdminData({ preserveSelection: true });
  });

  questionProofForm?.addEventListener("submit", submitProofForm);

  questionProofResetButton?.addEventListener("click", () => {
    state.selectedProofId = 0;
    state.selectedProof = null;
    state.selectedQuestionId = 0;
    renderProofList();
    renderProofDetail();
    renderQuestionList();
    resetProofForm();
    resetQuestionEditor({ keepProof: false });
  });

  questionProofList?.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-proof-open]");

    if (openButton) {
      await loadQuestionProof(Number(openButton.dataset.proofOpen || 0));
    }
  });

  questionProofDetail?.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-proof-edit]");
    const newQuestionButton = event.target.closest("[data-proof-new-question]");

    if (editButton) {
      populateProofForm(getSelectedProof());
      questionProofYearInput?.focus();
      return;
    }

    if (newQuestionButton) {
      resetQuestionEditor({ keepProof: true });
      questionEditorNumberInput?.focus();
    }
  });

  questionProofQuestions?.addEventListener("click", (event) => {
    const openButton = event.target.closest("[data-question-open]");

    if (!openButton || !state.selectedProof) {
      return;
    }

    const questionId = Number(openButton.dataset.questionOpen || 0);
    const question = state.selectedProof.questions.find((item) => Number(item.id) === questionId);

    if (!question) {
      return;
    }

    state.selectedQuestionId = questionId;
    renderQuestionList();
    populateQuestionEditor(question);
  });

  questionProofProcessButton?.addEventListener("click", processSelectedProof);
  questionProofPublishButton?.addEventListener("click", publishSelectedProof);

  questionProofDownloadButton?.addEventListener("click", () => {
    const proof = getSelectedProof();

    if (proof?.pdf?.downloadUrl) {
      window.open(proof.pdf.downloadUrl, "_blank", "noopener");
    }
  });

  questionEditorNewButton?.addEventListener("click", () => {
    resetQuestionEditor({ keepProof: true });
    questionEditorNumberInput?.focus();
  });

  questionEditorResetButton?.addEventListener("click", () => {
    if (!state.selectedProof) {
      resetQuestionEditor({ keepProof: false });
      return;
    }

    const currentQuestion = state.selectedProof.questions.find(
      (question) => Number(question.id) === Number(state.selectedQuestionId)
    );

    if (currentQuestion) {
      populateQuestionEditor(currentQuestion);
      return;
    }

    resetQuestionEditor({ keepProof: true });
  });

  questionEditorForm?.addEventListener("submit", submitQuestionEditor);

  loadQuestionBankAdminData({ autoSelectFirst: false });
})();
