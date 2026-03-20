(function initializeQuestionBankPage() {
  const state = {
    reference: null,
    overview: null,
    questions: [],
    catalog: null,
    mode: "questions",
    selectedQuestionId: 0,
    selectedCatalogKey: "",
    questionDetail: null,
    selectedAnswer: "",
    lastResult: null,
    isLoadingList: false,
    isLoadingQuestion: false,
    isSubmittingAnswer: false,
  };

  const questionBankHeroPills = document.getElementById("questionBankHeroPills");
  const questionBankAvailableValue = document.getElementById("questionBankAvailableValue");
  const questionBankAnsweredValue = document.getElementById("questionBankAnsweredValue");
  const questionBankCorrectValue = document.getElementById("questionBankCorrectValue");
  const questionBankWrongValue = document.getElementById("questionBankWrongValue");
  const questionBankAccuracyValue = document.getElementById("questionBankAccuracyValue");
  const questionBankReviewValue = document.getElementById("questionBankReviewValue");

  const questionBankFilterForm = document.getElementById("questionBankFilterForm");
  const questionBankVestibularFilter = document.getElementById("questionBankVestibularFilter");
  const questionBankYearFilter = document.getElementById("questionBankYearFilter");
  const questionBankMatterFilter = document.getElementById("questionBankMatterFilter");
  const questionBankDifficultyFilter = document.getElementById("questionBankDifficultyFilter");
  const questionBankDayFilter = document.getElementById("questionBankDayFilter");
  const questionBankBookletFilter = document.getElementById("questionBankBookletFilter");
  const questionBankStatusFilter = document.getElementById("questionBankStatusFilter");
  const questionBankSearchButton = document.getElementById("questionBankSearchButton");
  const questionBankResetButton = document.getElementById("questionBankResetButton");
  const questionBankPageFeedback = document.getElementById("questionBankPageFeedback");

  const questionBankResultsMeta = document.getElementById("questionBankResultsMeta");
  const questionBankResultsList = document.getElementById("questionBankResultsList");
  const questionBankWorkspace = document.getElementById("questionBankWorkspace");

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function titleCase(value) {
    return String(value || "")
      .split(/[\s_-]+/g)
      .filter(Boolean)
      .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
      .join(" ");
  }

  function formatLabel(value, fallback = "Sem dado") {
    const normalized = String(value || "").trim();

    if (!normalized) {
      return fallback;
    }

    const lookup = {
      facil: "Facil",
      media: "Media",
      dificil: "Dificil",
      unanswered: "Nao resolvidas",
      wrong: "Erradas",
      favorites: "Favoritas",
      review: "Revisar depois",
      all: "Todas",
      ready: "Pronta",
      missing: "Pendente",
    };

    return lookup[normalized] || titleCase(normalized);
  }

  function isCatalogMode() {
    return Boolean(state.catalog?.active);
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

  function getFilters() {
    return {
      vestibular: questionBankVestibularFilter?.value || "",
      ano: questionBankYearFilter?.value || "",
      materia: questionBankMatterFilter?.value || "",
      dificuldade: questionBankDifficultyFilter?.value || "",
      dia: questionBankDayFilter?.value || "",
      caderno: questionBankBookletFilter?.value || "",
      status: questionBankStatusFilter?.value || "all",
    };
  }

  function setPageFeedback(message, stateName = "") {
    if (!questionBankPageFeedback) {
      return;
    }

    questionBankPageFeedback.textContent = message || "";
    questionBankPageFeedback.dataset.state = stateName;
  }

  function buildQueryString(filters) {
    const searchParams = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });

    return searchParams.toString();
  }

  function populateSelect(select, options, currentValue, emptyLabel) {
    if (!select) {
      return;
    }

    const normalizedOptions = Array.isArray(options) ? options : [];
    const optionMarkup = [`<option value="">${escapeHtml(emptyLabel)}</option>`];

    normalizedOptions.forEach((option) => {
      if (option && typeof option === "object") {
        const optionValue = String(option.value ?? option.id ?? "");
        const optionLabel = String(
          option.label ??
          (option.sigla && option.nome ? `${option.sigla} - ${option.nome}` : option.nome ?? option.value ?? "")
        );

        optionMarkup.push(
          `<option value="${escapeHtml(optionValue)}">${escapeHtml(optionLabel)}</option>`
        );
        return;
      }

      optionMarkup.push(
        `<option value="${escapeHtml(String(option || ""))}">${escapeHtml(formatLabel(option, String(option || "")))}</option>`
      );
    });

    select.innerHTML = optionMarkup.join("");

    if (currentValue && [...select.options].some((option) => option.value === currentValue)) {
      select.value = currentValue;
    }
  }

  function syncFilterMode() {
    const catalogMode = isCatalogMode();

    if (questionBankMatterFilter) {
      if (catalogMode) {
        questionBankMatterFilter.value = "";
      }
      questionBankMatterFilter.disabled = catalogMode;
    }

    if (questionBankDifficultyFilter) {
      if (catalogMode) {
        questionBankDifficultyFilter.value = "";
      }
      questionBankDifficultyFilter.disabled = catalogMode;
    }

    if (questionBankStatusFilter) {
      if (catalogMode) {
        questionBankStatusFilter.value = "all";
      }
      questionBankStatusFilter.disabled = catalogMode;
    }

    if (questionBankDayFilter) {
      questionBankDayFilter.disabled = !catalogMode;
    }

    if (questionBankBookletFilter) {
      questionBankBookletFilter.disabled = !catalogMode;
    }

    if (questionBankSearchButton) {
      if (state.isLoadingList) {
        questionBankSearchButton.textContent = catalogMode ? "Montando..." : "Buscando...";
      } else {
        questionBankSearchButton.textContent = catalogMode ? "Montar sessao" : "Buscar questoes";
      }
    }
  }

  function renderSummary() {
    if (isCatalogMode()) {
      const summary = state.catalog?.summary || {};

      if (questionBankAvailableValue) {
        questionBankAvailableValue.textContent = String(summary.totalSessions || 0);
      }

      if (questionBankAnsweredValue) {
        questionBankAnsweredValue.textContent = "0";
      }

      if (questionBankCorrectValue) {
        questionBankCorrectValue.textContent = String(summary.readySessions || 0);
      }

      if (questionBankWrongValue) {
        questionBankWrongValue.textContent = String(summary.missingProofSessions || 0);
      }

      if (questionBankAccuracyValue) {
        questionBankAccuracyValue.textContent = `${Math.round(summary.totalSessions ? ((summary.readySessions || 0) / summary.totalSessions) * 100 : 0)}%`;
      }

      if (questionBankReviewValue) {
        questionBankReviewValue.textContent = String((summary.reviewSessions || 0) + (summary.missingAnswerKeySessions || 0));
      }

      return;
    }

    const overview = state.overview || {};

    if (questionBankAvailableValue) {
      questionBankAvailableValue.textContent = String(overview.totalAvailable || 0);
    }

    if (questionBankAnsweredValue) {
      questionBankAnsweredValue.textContent = String(overview.answeredQuestions || 0);
    }

    if (questionBankCorrectValue) {
      questionBankCorrectValue.textContent = String(overview.correctQuestions || 0);
    }

    if (questionBankWrongValue) {
      questionBankWrongValue.textContent = String(overview.wrongQuestions || 0);
    }

    if (questionBankAccuracyValue) {
      questionBankAccuracyValue.textContent = `${Math.round((overview.accuracyRate || 0) * 100)}%`;
    }

    if (questionBankReviewValue) {
      questionBankReviewValue.textContent = String(overview.reviewQuestions || 0);
    }
  }

  function renderHeroPills() {
    if (!questionBankHeroPills) {
      return;
    }

    const filters = getFilters();
    const activeFilters = [
      filters.vestibular ? "Vestibular filtrado" : "",
      filters.ano ? "Ano filtrado" : "",
      filters.dia ? `Dia ${filters.dia}` : "",
      filters.caderno ? filters.caderno : "",
      !isCatalogMode() && filters.materia ? formatLabel(filters.materia) : "",
      !isCatalogMode() && filters.dificuldade ? formatLabel(filters.dificuldade) : "",
      !isCatalogMode() && filters.status && filters.status !== "all" ? formatLabel(filters.status) : "",
    ].filter(Boolean);

    if (isCatalogMode()) {
      const summary = state.catalog?.summary || {};

      questionBankHeroPills.innerHTML = [
        `<span class="analytics-pill">${escapeHtml(String(summary.totalSessions || 0))} sessoes catalogadas</span>`,
        `<span class="analytics-pill analytics-pill-muted">${escapeHtml(String(summary.readySessions || 0))} prontas</span>`,
        activeFilters.length
          ? `<span class="analytics-pill analytics-pill-muted">${escapeHtml(activeFilters.join(" / "))}</span>`
          : '<span class="analytics-pill analytics-pill-muted">Filtro por ano, dia e caderno</span>',
      ].join("");
      return;
    }

    const overview = state.overview || {};

    questionBankHeroPills.innerHTML = [
      `<span class="analytics-pill">${escapeHtml(String(overview.totalAvailable || 0))} questoes ativas</span>`,
      `<span class="analytics-pill analytics-pill-muted">${escapeHtml(String(overview.favoriteQuestions || 0))} favoritas</span>`,
      activeFilters.length
        ? `<span class="analytics-pill analytics-pill-muted">${escapeHtml(activeFilters.join(" / "))}</span>`
        : `<span class="analytics-pill analytics-pill-muted">Sem filtros extras</span>`,
    ].join("");
  }

  function renderFilters() {
    const filters = getFilters();
    const catalogMode = isCatalogMode();
    const catalogReference = state.catalog?.reference || {};

    populateSelect(
      questionBankVestibularFilter,
      catalogMode ? (catalogReference.vestibulares || []) : (state.reference?.vestibulares || []),
      filters.vestibular,
      "Todos"
    );
    populateSelect(
      questionBankYearFilter,
      catalogMode ? (catalogReference.anos || []) : (state.reference?.anos || []),
      filters.ano,
      "Todos"
    );
    populateSelect(
      questionBankMatterFilter,
      state.reference?.materias || [],
      filters.materia,
      "Todas"
    );
    populateSelect(
      questionBankDayFilter,
      catalogMode ? (catalogReference.dias || []) : [],
      filters.dia,
      "Todos"
    );
    populateSelect(
      questionBankBookletFilter,
      catalogMode ? (catalogReference.cadernos || []) : [],
      filters.caderno,
      "Todos"
    );
    syncFilterMode();
  }

  function getQuestionStatus(question) {
    if (question?.user?.lastAttemptCorrect === true) {
      return { label: "Acertou", state: "correct" };
    }

    if (question?.user?.lastAttemptCorrect === false) {
      return { label: "Errou", state: "wrong" };
    }

    if (question?.user?.answered) {
      return { label: "Respondida", state: "answered" };
    }

    return { label: "Nao respondida", state: "" };
  }

  function getCatalogSessionByKey(sessionKey) {
    const sessions = Array.isArray(state.catalog?.sessions) ? state.catalog.sessions : [];
    return sessions.find((session) => String(session.key || "") === String(sessionKey || "")) || null;
  }

  function renderCatalogResults() {
    if (!questionBankResultsList || !questionBankResultsMeta) {
      return;
    }

    const sessions = Array.isArray(state.catalog?.sessions) ? state.catalog.sessions : [];
    questionBankResultsMeta.textContent = `${sessions.length} sessoes encontradas`;

    if (!sessions.length) {
      questionBankResultsList.innerHTML = '<div class="question-bank-empty">Nenhuma sessao catalogada combinou com os filtros atuais. Tente ajustar ano, dia ou caderno.</div>';
      return;
    }

    questionBankResultsList.innerHTML = sessions.map((session) => {
      const isActive = String(session.key || "") === String(state.selectedCatalogKey || "");
      const chips = [
        `${session.vestibular} ${session.ano}`,
        `Dia ${session.dia}`,
        session.caderno,
        session.hasProof ? "Prova" : "Sem prova",
        session.hasAnswerKey ? "Gabarito" : "Sem gabarito",
      ];

      return `
        <article class="question-result-card ${isActive ? "is-active" : ""}">
          <div class="question-result-head">
            <div>
              <h3 class="question-result-title">${escapeHtml(`${session.vestibular} ${session.ano} • Dia ${session.dia} • ${session.caderno}`)}</h3>
              <p class="question-result-copy">
                ${escapeHtml(
                  session.statusState === "ready"
                    ? "Sessao pronta no catalogo para virar banco estruturado."
                    : "Sessao detectada, mas ainda com pendencias para revisao manual."
                )}
              </p>
            </div>

            <span class="question-result-status" data-state="${escapeHtml(session.statusState)}">
              ${escapeHtml(session.statusLabel)}
            </span>
          </div>

          <div class="question-result-meta">
            ${chips.map((chip) => `<span class="question-pill">${escapeHtml(chip)}</span>`).join("")}
          </div>

          <div class="question-workspace-actions">
            <button type="button" class="module-link" data-session-open="${escapeHtml(session.key)}">
              Abrir sessao
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderCatalogWorkspace() {
    if (!questionBankWorkspace) {
      return;
    }

    const session = getCatalogSessionByKey(state.selectedCatalogKey);

    if (!session) {
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">Escolha uma sessao do catalogo para ver o conjunto, as pendencias e o que ja esta pronto para o banco de questoes.</div>';
      return;
    }

    const notes = Array.isArray(session.notes) ? session.notes : [];
    const fileCards = [
      session.proof
        ? `
          <div class="question-workspace-state">
            <strong class="question-workspace-feedback-title">Prova</strong>
            <p class="question-workspace-copy">${escapeHtml(session.proof.nomeOriginal || session.proof.principal || "Arquivo principal encontrado")}</p>
            <div class="question-stats-strip">
              <span class="question-pill">${escapeHtml(session.proof.variantCount ? `${session.proof.variantCount} variantes` : "Sem variantes")}</span>
              <span class="question-pill">${escapeHtml(session.proof.duplicateCount ? `${session.proof.duplicateCount} duplicatas` : "Sem duplicatas")}</span>
            </div>
          </div>
        `
        : `
          <div class="question-workspace-state">
            <strong class="question-workspace-feedback-title">Prova</strong>
            <p class="question-workspace-copy">A prova principal ainda nao foi encontrada para esta sessao.</p>
          </div>
        `,
      session.answerKey
        ? `
          <div class="question-workspace-state">
            <strong class="question-workspace-feedback-title">Gabarito</strong>
            <p class="question-workspace-copy">${escapeHtml(session.answerKey.nomeOriginal || session.answerKey.principal || "Arquivo principal encontrado")}</p>
            <div class="question-stats-strip">
              <span class="question-pill">${escapeHtml(session.answerKey.variantCount ? `${session.answerKey.variantCount} variantes` : "Sem variantes")}</span>
              <span class="question-pill">${escapeHtml(session.answerKey.duplicateCount ? `${session.answerKey.duplicateCount} duplicatas` : "Sem duplicatas")}</span>
            </div>
          </div>
        `
        : `
          <div class="question-workspace-state">
            <strong class="question-workspace-feedback-title">Gabarito</strong>
            <p class="question-workspace-copy">O gabarito correspondente ainda nao foi localizado para esta sessao.</p>
          </div>
        `,
    ].join("");

    questionBankWorkspace.innerHTML = `
      <div class="question-workspace-shell">
        <header class="question-workspace-header">
          <div class="question-workspace-meta">
            <span class="question-pill">${escapeHtml(session.vestibular)}</span>
            <span class="question-pill">${escapeHtml(String(session.ano || ""))}</span>
            <span class="question-pill">${escapeHtml(`Dia ${session.dia}`)}</span>
            <span class="question-pill">${escapeHtml(session.caderno)}</span>
            <span class="question-pill">${escapeHtml(session.statusLabel)}</span>
          </div>

          <div>
            <h3 class="question-workspace-title">${escapeHtml(`${session.vestibular} ${session.ano} • Dia ${session.dia} • ${session.caderno}`)}</h3>
            <p class="question-workspace-copy">Sessao catalogada para preparacao do Banco de Questoes do Start 5.</p>
          </div>
        </header>

        <div class="question-workspace-feedback" data-tone="${escapeHtml(session.statusState === "ready" ? "correct" : "wrong")}">
          <strong class="question-workspace-feedback-title">
            ${escapeHtml(session.statusState === "ready" ? "Sessao pronta para integracao." : "Sessao com revisao pendente.")}
          </strong>
          <p class="question-workspace-feedback-copy">
            ${escapeHtml(
              session.statusState === "ready"
                ? "O conjunto ja tem prova e gabarito catalogados. O proximo passo e transformar isso em questoes estruturadas."
                : "A sessao ja foi identificada, mas ainda depende de ajuste manual antes de entrar como base estruturada."
            )}
          </p>
        </div>

        <div class="question-session-detail-grid">
          ${fileCards}
        </div>

        ${notes.length ? `
          <div class="question-workspace-state">
            <strong class="question-workspace-feedback-title">Notas da sessao</strong>
            <ul class="question-session-note-list">
              ${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
            </ul>
          </div>
        ` : ""}

        <div class="question-workspace-state">
          <strong class="question-workspace-feedback-title">Como esta sessao entra no fluxo</strong>
          <p class="question-workspace-copy">
            Primeiro o conjunto fica catalogado. Depois ele passa por extracao, revisao administrativa e publicacao. Assim que as questoes estruturadas forem publicadas, elas aparecem nesta mesma aba para resolucao normal.
          </p>
        </div>
      </div>
    `;
  }

  function renderResults() {
    if (!questionBankResultsList || !questionBankResultsMeta) {
      return;
    }

    if (state.isLoadingList) {
      questionBankResultsMeta.textContent = isCatalogMode() ? "Montando sessao..." : "Carregando questoes...";
      questionBankResultsList.innerHTML = `<div class="question-bank-empty">${isCatalogMode() ? "Montando sessao catalogada..." : "Carregando questoes publicadas..."}</div>`;
      return;
    }

    if (isCatalogMode()) {
      renderCatalogResults();
      return;
    }

    const questions = Array.isArray(state.questions) ? state.questions : [];
    const hasPublishedBase = Number(state.overview?.totalAvailable || 0) > 0;
    questionBankResultsMeta.textContent = `${questions.length} questoes encontradas`;

    if (!questions.length) {
      questionBankResultsList.innerHTML = hasPublishedBase
        ? '<div class="question-bank-empty">Nenhuma questao combinou com os filtros atuais. Tente limpar os filtros.</div>'
        : '<div class="question-bank-empty">O banco ainda nao tem questoes publicadas para estudo.</div>';
      return;
    }

    questionBankResultsList.innerHTML = questions.map((question) => {
      const isActive = Number(question.id) === Number(state.selectedQuestionId);
      const status = getQuestionStatus(question);
      const chips = [
        `${question.vestibular.sigla} ${question.prova.ano}`,
        formatLabel(question.materia, "Sem materia"),
        formatLabel(question.dificuldade),
        question.tema ? formatLabel(question.tema) : "",
        question.user?.isFavorite ? "Favorita" : "",
        question.user?.reviewLater ? "Revisar" : "",
      ].filter(Boolean);

      return `
        <article class="question-result-card ${isActive ? "is-active" : ""}">
          <div class="question-result-head">
            <div>
              <h3 class="question-result-title">Questao ${escapeHtml(String(question.numero || "?"))}</h3>
              <p class="question-result-copy">${escapeHtml(question.excerpt || "Sem enunciado")}</p>
            </div>

            <span class="question-result-status" data-state="${escapeHtml(status.state)}">
              ${escapeHtml(status.label)}
            </span>
          </div>

          <div class="question-result-meta">
            ${chips.map((chip) => `<span class="question-pill">${escapeHtml(chip)}</span>`).join("")}
          </div>

          <div class="question-workspace-actions">
            <button type="button" class="module-link" data-question-open="${Number(question.id) || 0}">
              Abrir questao
            </button>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderWorkspace() {
    if (isCatalogMode()) {
      renderCatalogWorkspace();
      return;
    }

    if (!questionBankWorkspace) {
      return;
    }

    if (state.isLoadingQuestion) {
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">Abrindo questao...</div>';
      return;
    }

    const question = state.questionDetail;

    if (!question) {
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">Escolha uma questao na lista para abrir o enunciado, responder e acompanhar a correcao.</div>';
      return;
    }

    const showResult = Boolean(state.lastResult && Number(state.lastResult.questaoId) === Number(question.id));
    const selectedAnswer = state.selectedAnswer || "";
    const answerButtonLabel = question.user?.answered ? "Responder novamente" : "Confirmar resposta";
    const feedbackTone = showResult ? (state.lastResult.acertou ? "correct" : "wrong") : "";
    const feedbackMarkup = showResult ? `
      <div class="question-workspace-feedback" data-tone="${escapeHtml(feedbackTone)}">
        <strong class="question-workspace-feedback-title">
          ${escapeHtml(state.lastResult.acertou ? "Voce acertou." : "Voce errou.")}
        </strong>
        <p class="question-workspace-feedback-copy">
          Marcada: ${escapeHtml(state.lastResult.respostaMarcada)}. Correta: ${escapeHtml(state.lastResult.respostaCorreta)}.
        </p>
      </div>
    ` : "";
    const stateMarkup = `
      <div class="question-workspace-state">
        <div class="question-stats-strip">
          <span class="question-pill">${escapeHtml(String(question.stats.totalAnswers || 0))} respostas</span>
          <span class="question-pill">${escapeHtml(String(question.stats.accuracyPercentage || 0))}% de acerto geral</span>
          <span class="question-pill">${escapeHtml(formatLabel(question.stats.usageDifficulty || question.dificuldade))}</span>
          <span class="question-pill">${escapeHtml(question.user?.isFavorite ? "Favorita" : "Nao favorita")}</span>
          <span class="question-pill">${escapeHtml(question.user?.reviewLater ? "Revisar depois" : "Sem revisao marcada")}</span>
        </div>

        <p class="question-workspace-copy">
          ${escapeHtml(question.user?.lastAttempt
            ? `Ultima tentativa em ${formatDate(question.user.lastAttempt.createdAt)}.`
            : "Essa questao ainda nao foi respondida por voce."
          )}
        </p>
      </div>
    `;

    questionBankWorkspace.innerHTML = `
      <div class="question-workspace-shell">
        <header class="question-workspace-header">
          <div class="question-workspace-meta">
            <span class="question-pill">${escapeHtml(question.vestibular.sigla)} ${escapeHtml(String(question.prova.ano || ""))}</span>
            <span class="question-pill">${escapeHtml(formatLabel(question.materia, "Sem materia"))}</span>
            <span class="question-pill">${escapeHtml(formatLabel(question.tema, "Sem tema"))}</span>
            <span class="question-pill">${escapeHtml(formatLabel(question.dificuldade))}</span>
          </div>

          <div>
            <h3 class="question-workspace-title">Questao ${escapeHtml(String(question.numero || "?"))}</h3>
            <p class="question-workspace-copy">${escapeHtml(question.prova.fase || "Sem fase")} • ${escapeHtml(question.prova.versao || "Sem versao")}</p>
          </div>
        </header>

        <p class="question-workspace-prompt">${escapeHtml(question.enunciado || "Sem enunciado")}</p>

        ${question.alternatives.length ? `
          <form id="questionBankAnswerForm">
            <div class="question-choice-list">
              ${question.alternatives.map((alternative) => {
                const isSelected = selectedAnswer === alternative.letra;
                const isCorrect = showResult && alternative.letra === state.lastResult.respostaCorreta;
                const isWrong = showResult && alternative.letra === state.lastResult.respostaMarcada && !state.lastResult.acertou;
                const classes = [
                  "question-choice",
                  isSelected ? "is-selected" : "",
                  isCorrect ? "is-correct" : "",
                  isWrong ? "is-wrong" : "",
                ].filter(Boolean).join(" ");

                return `
                  <label class="${classes}">
                    <input
                      type="radio"
                      name="answer"
                      value="${escapeHtml(alternative.letra)}"
                      ${isSelected ? "checked" : ""}
                    />
                    <div class="question-choice-head">
                      <span class="question-choice-letter">${escapeHtml(alternative.letra)}</span>
                    </div>
                    <div class="question-choice-text">${escapeHtml(alternative.texto)}</div>
                  </label>
                `;
              }).join("")}
            </div>

            <div class="question-workspace-actions">
              <button type="submit" class="modal-button modal-button-primary" ${selectedAnswer ? "" : "disabled"}>
                ${escapeHtml(state.isSubmittingAnswer ? "Enviando..." : answerButtonLabel)}
              </button>
              <button type="button" class="modal-button modal-button-secondary" data-toggle-favorite="true">
                ${escapeHtml(question.user?.isFavorite ? "Remover favorita" : "Favoritar")}
              </button>
              <button type="button" class="modal-button modal-button-secondary" data-toggle-review="true">
                ${escapeHtml(question.user?.reviewLater ? "Remover revisao" : "Revisar depois")}
              </button>
              <button type="button" class="modal-button modal-button-secondary" data-open-next="true">
                Proxima questao
              </button>
            </div>
          </form>
        ` : '<div class="question-bank-empty">Essa questao ainda nao tem alternativas publicadas para estudo.</div>'}

        ${feedbackMarkup}
        ${stateMarkup}
      </div>
    `;
  }

  async function loadQuestionDetail(questionId) {
    if (!questionId) {
      state.selectedQuestionId = 0;
      state.questionDetail = null;
      state.selectedAnswer = "";
      state.lastResult = null;
      renderResults();
      renderWorkspace();
      return;
    }

    state.isLoadingQuestion = true;
    state.selectedQuestionId = Number(questionId) || 0;
    renderResults();
    renderWorkspace();

    try {
      const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${questionId}`);
      state.questionDetail = response.question || null;
      state.selectedAnswer = state.questionDetail?.user?.lastAttempt?.respostaMarcada || "";
      state.lastResult = null;
      renderResults();
      renderWorkspace();
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel abrir a questao.", "error");
      state.questionDetail = null;
      renderWorkspace();
    } finally {
      state.isLoadingQuestion = false;
      renderWorkspace();
    }
  }

  async function loadQuestionList(options = {}) {
    const filters = getFilters();
    state.isLoadingList = true;
    if (questionBankSearchButton) {
      questionBankSearchButton.disabled = true;
    }
    if (questionBankResetButton) {
      questionBankResetButton.disabled = true;
    }
    syncFilterMode();
    renderResults();

    try {
      const queryString = buildQueryString(filters);
      const response = await window.Start5Auth.apiRequest(
        `/api/question-bank/questions${queryString ? `?${queryString}` : ""}`
      );

      state.reference = response.reference || {};
      state.overview = response.overview || {};
      state.questions = Array.isArray(response.questions) ? response.questions : [];
      state.catalog = response.catalog || null;
      state.mode = isCatalogMode() ? "catalog" : "questions";
      renderFilters();
      renderSummary();
      renderHeroPills();

      if (isCatalogMode()) {
        const sessions = Array.isArray(state.catalog?.sessions) ? state.catalog.sessions : [];
        const hasCurrentSelection = sessions.some((session) => String(session.key || "") === String(state.selectedCatalogKey || ""));

        state.selectedQuestionId = 0;
        state.questionDetail = null;
        state.selectedAnswer = "";
        state.lastResult = null;
        state.selectedCatalogKey = options.preserveSelection && hasCurrentSelection
          ? state.selectedCatalogKey
          : String(sessions[0]?.key || "");

        renderResults();
        renderWorkspace();
        setPageFeedback(
          sessions.length
            ? "A base de questoes publicada ainda esta vazia. Mostrando as sessoes ENEM catalogadas para voce montar o estudo."
            : "Ainda nao ha questoes publicadas e nenhuma sessao catalogada combinou com os filtros atuais.",
          sessions.length ? "info" : "warning"
        );
        return;
      }

      renderResults();
      setPageFeedback("");
      state.selectedCatalogKey = "";

      if (options.skipDetailLoad) {
        if (!state.questions.some((question) => Number(question.id) === Number(state.selectedQuestionId))) {
          state.selectedQuestionId = Number(state.questions[0]?.id) || 0;
          if (state.selectedQuestionId) {
            await loadQuestionDetail(state.selectedQuestionId);
            return;
          }

          if (!state.selectedQuestionId) {
            state.questionDetail = null;
            state.selectedAnswer = "";
            state.lastResult = null;
          }
        }
        renderResults();
        renderWorkspace();
        return;
      }

      const nextQuestionId = options.preserveSelection
        ? state.questions.some((question) => Number(question.id) === Number(state.selectedQuestionId))
          ? state.selectedQuestionId
          : Number(state.questions[0]?.id) || 0
        : Number(state.questions[0]?.id) || 0;

      if (nextQuestionId) {
        await loadQuestionDetail(nextQuestionId);
      } else {
        state.selectedQuestionId = 0;
        state.questionDetail = null;
        state.selectedAnswer = "";
        state.lastResult = null;
        renderWorkspace();
      }
    } catch (error) {
      console.error("Erro ao carregar questoes:", error);
      setPageFeedback(error.message || "Nao foi possivel carregar o Banco de Questoes.", "error");
      questionBankResultsMeta.textContent = "Nao foi possivel carregar";
      questionBankResultsList.innerHTML = '<div class="question-bank-empty">Nao foi possivel carregar as questoes agora.</div>';
      questionBankWorkspace.innerHTML = '<div class="question-bank-empty">A area da questao nao pode ser montada neste momento.</div>';
    } finally {
      state.isLoadingList = false;
      if (questionBankSearchButton) {
        questionBankSearchButton.disabled = false;
      }
      if (questionBankResetButton) {
        questionBankResetButton.disabled = false;
      }
      syncFilterMode();
      renderResults();
    }
  }

  function getNextQuestionId() {
    const currentIndex = state.questions.findIndex((question) => Number(question.id) === Number(state.selectedQuestionId));
    const nextUnanswered = state.questions.find((question, index) => index > currentIndex && !question.user?.answered);

    if (nextUnanswered) {
      return nextUnanswered.id;
    }

    const nextByOrder = currentIndex >= 0 ? state.questions[currentIndex + 1] : null;

    if (nextByOrder) {
      return nextByOrder.id;
    }

    const firstUnanswered = state.questions.find((question) => !question.user?.answered);

    return firstUnanswered?.id || state.questions[0]?.id || 0;
  }

  async function submitAnswer() {
    const question = state.questionDetail;

    if (!question || !state.selectedAnswer) {
      return;
    }

    try {
      state.isSubmittingAnswer = true;
      renderWorkspace();

      const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${question.id}/attempts`, {
        method: "POST",
        body: {
          respostaMarcada: state.selectedAnswer,
        },
      });

      state.questionDetail = response.question || question;
      state.overview = response.overview || state.overview;
      state.lastResult = response.result || null;
      state.selectedAnswer = response.result?.respostaMarcada || state.selectedAnswer;
      renderSummary();
      renderHeroPills();
      await loadQuestionList({ preserveSelection: true, skipDetailLoad: true });
      renderWorkspace();
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel registrar sua resposta.", "error");
    } finally {
      state.isSubmittingAnswer = false;
      renderWorkspace();
    }
  }

  async function toggleQuestionState(key) {
    const question = state.questionDetail;

    if (!question) {
      return;
    }

    const currentValue = key === "isFavorite" ? Boolean(question.user?.isFavorite) : Boolean(question.user?.reviewLater);

    try {
      const response = await window.Start5Auth.apiRequest(`/api/question-bank/questions/${question.id}/state`, {
        method: "PATCH",
        body: {
          [key]: !currentValue,
        },
      });

      state.questionDetail = response.question || state.questionDetail;
      state.overview = response.overview || state.overview;
      renderSummary();
      renderHeroPills();
      await loadQuestionList({ preserveSelection: true, skipDetailLoad: true });
      renderWorkspace();
    } catch (error) {
      setPageFeedback(error.message || "Nao foi possivel atualizar esse marcador.", "error");
    }
  }

  questionBankFilterForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await loadQuestionList({ preserveSelection: false });
  });

  questionBankResetButton?.addEventListener("click", async () => {
    questionBankFilterForm?.reset();
    if (questionBankStatusFilter) {
      questionBankStatusFilter.value = "all";
    }
    await loadQuestionList({ preserveSelection: false });
  });

  questionBankResultsList?.addEventListener("click", async (event) => {
    const openQuestionButton = event.target.closest("[data-question-open]");

    if (openQuestionButton) {
      await loadQuestionDetail(Number(openQuestionButton.dataset.questionOpen || 0));
      return;
    }

    const openSessionButton = event.target.closest("[data-session-open]");

    if (openSessionButton) {
      state.selectedCatalogKey = String(openSessionButton.dataset.sessionOpen || "");
      renderResults();
      renderWorkspace();
    }
  });

  questionBankWorkspace?.addEventListener("change", (event) => {
    const answerInput = event.target.closest('input[name="answer"]');

    if (!answerInput) {
      return;
    }

    state.selectedAnswer = answerInput.value || "";
    renderWorkspace();
  });

  questionBankWorkspace?.addEventListener("submit", async (event) => {
    if (event.target.id !== "questionBankAnswerForm") {
      return;
    }

    event.preventDefault();
    await submitAnswer();
  });

  questionBankWorkspace?.addEventListener("click", async (event) => {
    if (event.target.closest("[data-toggle-favorite]")) {
      await toggleQuestionState("isFavorite");
      return;
    }

    if (event.target.closest("[data-toggle-review]")) {
      await toggleQuestionState("reviewLater");
      return;
    }

    if (event.target.closest("[data-open-next]")) {
      await loadQuestionDetail(getNextQuestionId());
    }
  });

  loadQuestionList({ preserveSelection: false });
})();
