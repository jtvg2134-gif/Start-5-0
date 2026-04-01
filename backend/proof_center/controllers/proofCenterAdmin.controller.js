import {
  PROOF_CENTER_ANSWER_KEY_RECORD_STATUSES,
  PROOF_CENTER_ANSWER_KEY_RECORD_TYPES,
  PROOF_CENTER_ANSWER_KEY_QUESTION_TYPES,
  PROOF_CENTER_ANSWER_KEY_SOURCES,
  PROOF_CENTER_ANSWER_KEY_TYPES,
  PROOF_CENTER_CORRECTION_METHODS,
  PROOF_CENTER_DIFFICULTIES,
  PROOF_CENTER_FILE_TYPES,
  PROOF_CENTER_IMPORT_STATUSES,
  PROOF_CENTER_PROOF_AREAS,
  PROOF_CENTER_PROOF_LEVELS,
  PROOF_CENTER_PROOF_ORIGINS,
  PROOF_CENTER_PROOF_STATUSES,
  PROOF_CENTER_PROOF_TYPES,
  PROOF_CENTER_QUESTION_ORIGINS,
  PROOF_CENTER_QUESTION_STATUSES,
  PROOF_CENTER_QUESTION_TYPES,
  PROOF_CENTER_REVIEW_DECISIONS,
  buildProofCenterReferenceData,
  normalizeEnumValue,
} from "../contracts/proofCenter.reference.js";
import { createHttpError } from "../shared/errors.js";
import { readJsonBody, sendJson } from "../shared/http.js";

function toTrimmedString(value, maxLength = 0) {
  const normalized = String(value ?? "").trim();
  return maxLength > 0 ? normalized.slice(0, maxLength) : normalized;
}

function toNullableString(value, maxLength = 0) {
  const normalized = toTrimmedString(value, maxLength);
  return normalized || null;
}

function toNullableNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableInteger(value) {
  const parsed = toNullableNumber(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function toBooleanValue(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value ?? "").trim().toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return ["1", "true", "sim", "yes", "on"].includes(normalized);
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function assertUuidParam(value, fieldLabel) {
  const normalized = toTrimmedString(value);

  if (!isUuid(normalized)) {
    throw createHttpError(400, `${fieldLabel} invalido.`);
  }

  return normalized;
}

function normalizeProofPayload(payload = {}) {
  const titulo = toTrimmedString(payload.titulo, 180);

  if (!titulo) {
    throw createHttpError(400, "Informe o nome da prova.");
  }

  return {
    titulo,
    descricao: toTrimmedString(payload.descricao, 4000),
    disciplina: toTrimmedString(payload.disciplina, 120),
    area: normalizeEnumValue(payload.area, PROOF_CENTER_PROOF_AREAS, "exatas"),
    nivel: normalizeEnumValue(payload.nivel, PROOF_CENTER_PROOF_LEVELS, "misto"),
    ano: toNullableInteger(payload.ano),
    tipoProva: normalizeEnumValue(payload.tipoProva || payload.tipo_prova, PROOF_CENTER_PROOF_TYPES, "outro"),
    status: normalizeEnumValue(payload.status, PROOF_CENTER_PROOF_STATUSES, "draft"),
    origem: normalizeEnumValue(payload.origem, PROOF_CENTER_PROOF_ORIGINS, "manual"),
    tempoLimiteMin: toNullableInteger(payload.tempoLimiteMin ?? payload.tempo_limite_min),
    observacoes: toTrimmedString(payload.observacoes, 6000),
    proofCode: toTrimmedString(payload.proofCode || payload.proof_code, 180),
    examProvider: toTrimmedString(payload.examProvider || payload.exam_provider, 120),
    examName: toTrimmedString(payload.examName || payload.exam_name, 180),
    examYear: toNullableInteger(payload.examYear ?? payload.exam_year ?? payload.ano),
    examEdition: toTrimmedString(payload.examEdition || payload.exam_edition, 80),
    examDay: toTrimmedString(payload.examDay || payload.exam_day, 40),
    applicationDate: toNullableString(payload.applicationDate || payload.application_date, 40),
    subjectGroup: toTrimmedString(payload.subjectGroup || payload.subject_group, 120),
    bookletColor: toTrimmedString(payload.bookletColor || payload.booklet_color, 80),
    examVersion: toTrimmedString(payload.examVersion || payload.exam_version, 80),
    examLanguage: toTrimmedString(payload.language || payload.examLanguage || payload.exam_language, 80),
    expectedQuestionCount: toNullableInteger(payload.expectedQuestionCount ?? payload.expected_question_count),
    parserProfile: toTrimmedString(payload.parserProfile || payload.parser_profile, 120),
    aliasKeywords: Array.isArray(payload.aliasKeywords)
      ? payload.aliasKeywords.map((item) => toTrimmedString(item, 120)).filter(Boolean)
      : String(payload.aliasKeywords || payload.alias_keywords || "")
          .split(/[\n,;|]+/g)
          .map((item) => toTrimmedString(item, 120))
          .filter(Boolean),
    identificationNotes: toTrimmedString(payload.identificationNotes || payload.identification_notes, 4000),
    pdfOriginal: payload.pdfOriginal || null,
    gabaritoPdf: payload.gabaritoPdf || null,
    files: Array.isArray(payload.files) ? payload.files : [],
  };
}

function normalizeAnswerKeyPayload(payload = {}) {
  const proof = normalizeProofPayload(payload.proof || payload.prova || payload);
  const answerKey = payload.answerKey || payload.gabarito || {};
  const items = Array.isArray(answerKey.items || payload.items)
    ? (answerKey.items || payload.items).map((item, index) => ({
        id: toNullableString(item.id, 80),
        questionNumber: toNullableInteger(item.questionNumber ?? item.question_number ?? index + 1),
        questionType: normalizeEnumValue(
          item.questionType || item.question_type,
          PROOF_CENTER_ANSWER_KEY_QUESTION_TYPES,
          "multipla_escolha"
        ),
        expectedAnswer: toTrimmedString(item.expectedAnswer || item.expected_answer, 400),
        validationRule:
          typeof item.validationRule === "string"
            ? { raw: item.validationRule }
            : item.validationRule && typeof item.validationRule === "object"
              ? item.validationRule
              : {},
        numericTolerance: toNullableNumber(item.numericTolerance ?? item.numeric_tolerance),
        weight: toNullableNumber(item.weight) ?? 1,
        metadata:
          typeof item.metadata === "string"
            ? { raw: item.metadata }
            : item.metadata && typeof item.metadata === "object"
              ? item.metadata
              : {},
        notes: toTrimmedString(item.notes || item.observacao, 1000),
      }))
    : [];

  if (!items.length) {
    throw createHttpError(400, "Adicione pelo menos um item no gabarito.");
  }

  return {
    proof,
    answerKey: {
      id: toNullableString(answerKey.id, 80),
      answerKeyType: normalizeEnumValue(
        answerKey.answerKeyType || answerKey.answer_key_type,
        PROOF_CENTER_ANSWER_KEY_RECORD_TYPES,
        "oficial"
      ),
      source: normalizeEnumValue(answerKey.source, PROOF_CENTER_ANSWER_KEY_SOURCES, "manual"),
      status: normalizeEnumValue(answerKey.status, PROOF_CENTER_ANSWER_KEY_RECORD_STATUSES, "draft"),
      confidence: toNullableNumber(answerKey.confidence),
      notes: toTrimmedString(answerKey.notes, 4000),
      items,
    },
  };
}

function normalizeQuestionPayload(payload = {}) {
  const enunciado = toTrimmedString(payload.enunciado, 12000);

  if (!enunciado) {
    throw createHttpError(400, "Preencha o enunciado da questao.");
  }

  const tipoQuestao = normalizeEnumValue(payload.tipoQuestao || payload.tipo_questao, PROOF_CENTER_QUESTION_TYPES, "objetiva");
  const metodoCorrecao = normalizeEnumValue(
    payload.metodoCorrecao || payload.metodo_correcao,
    PROOF_CENTER_CORRECTION_METHODS,
    tipoQuestao === "objetiva" ? "automatica" : "manual"
  );

  const alternatives = (Array.isArray(payload.alternatives) ? payload.alternatives : []).map((item, index) => ({
    letra: toTrimmedString(item.letra, 2).toUpperCase() || String.fromCharCode(65 + index),
    texto: toTrimmedString(item.texto, 2000),
    ordem: toNullableInteger(item.ordem) || index + 1,
    isCorreta: toBooleanValue(item.isCorreta),
  }));

  const answerKeys = (Array.isArray(payload.answerKeys) ? payload.answerKeys : []).map((item) => ({
    tipoGabarito: normalizeEnumValue(item.tipoGabarito, PROOF_CENTER_ANSWER_KEY_TYPES, "texto"),
    respostaBruta: toTrimmedString(item.respostaBruta, 1000),
    respostaNormalizada: toTrimmedString(item.respostaNormalizada, 1000),
    valorNumerico: toNullableNumber(item.valorNumerico),
    expressaoCanonica: toTrimmedString(item.expressaoCanonica, 1000),
    toleranciaAbsoluta: toNullableNumber(item.toleranciaAbsoluta),
    toleranciaPercentual: toNullableNumber(item.toleranciaPercentual),
    unidade: toTrimmedString(item.unidade, 80),
    principal: toBooleanValue(item.principal),
    observacao: toTrimmedString(item.observacao, 2000),
  }));

  if (tipoQuestao === "objetiva" && alternatives.filter((item) => item.texto).length < 2) {
    throw createHttpError(400, "Questoes objetivas precisam de pelo menos duas alternativas.");
  }

  const explicitCorrectAlternative = toTrimmedString(payload.alternativaCorreta || payload.alternativa_correta, 2).toUpperCase();
  const hasAlternativeKey =
    explicitCorrectAlternative ||
    answerKeys.some((item) => item.tipoGabarito === "alternativa" && item.respostaBruta);

  if (tipoQuestao === "objetiva" && !hasAlternativeKey) {
    throw createHttpError(400, "Defina a alternativa correta da questao.");
  }

  if (tipoQuestao === "numerica" && !answerKeys.some((item) => item.tipoGabarito === "numero")) {
    throw createHttpError(400, "Questoes numericas precisam de pelo menos um gabarito numerico.");
  }

  return {
    tituloInterno: toTrimmedString(payload.tituloInterno || payload.titulo_interno, 180) || enunciado.slice(0, 180),
    enunciado,
    tipoQuestao,
    area: normalizeEnumValue(payload.area, PROOF_CENTER_PROOF_AREAS, "exatas"),
    assunto: toTrimmedString(payload.assunto, 180),
    subassunto: toTrimmedString(payload.subassunto, 180),
    formulaPrincipal: toTrimmedString(payload.formulaPrincipal || payload.formula_principal, 280),
    unidadeResposta: toTrimmedString(payload.unidadeResposta || payload.unidade_resposta, 80),
    casasDecimaisEsperadas: toNullableInteger(payload.casasDecimaisEsperadas ?? payload.casas_decimais_esperadas),
    aceitaNotacaoCientifica: toBooleanValue(payload.aceitaNotacaoCientifica ?? payload.aceita_notacao_cientifica),
    metodoCorrecao,
    toleranciaAbsoluta: toNullableNumber(payload.toleranciaAbsoluta ?? payload.tolerancia_absoluta),
    toleranciaPercentual: toNullableNumber(payload.toleranciaPercentual ?? payload.tolerancia_percentual),
    pesoPadrao: toNullableNumber(payload.pesoPadrao ?? payload.peso_padrao) ?? 1,
    dificuldadeInterna: normalizeEnumValue(payload.dificuldadeInterna ?? payload.dificuldade_interna, PROOF_CENTER_DIFFICULTIES, ""),
    possuiImagem: toBooleanValue(payload.possuiImagem ?? payload.possui_imagem),
    imagemUrl: toTrimmedString(payload.imagemUrl || payload.imagem_url, 1000),
    observacoesAdmin: toTrimmedString(payload.observacoesAdmin || payload.observacoes_admin, 6000),
    origemCadastro: normalizeEnumValue(payload.origemCadastro || payload.origem_cadastro, PROOF_CENTER_QUESTION_ORIGINS, "manual"),
    status: normalizeEnumValue(payload.status, PROOF_CENTER_QUESTION_STATUSES, "draft"),
    alternativaCorreta: explicitCorrectAlternative,
    alternatives,
    answerKeys,
  };
}

function normalizeMountPayload(payload = {}) {
  const questaoId = toTrimmedString(payload.questaoId || payload.questao_id);

  if (!isUuid(questaoId)) {
    throw createHttpError(400, "Questao invalida para montagem.");
  }

  return {
    questaoId,
    numeroNaProva: toNullableInteger(payload.numeroNaProva ?? payload.numero_na_prova),
    ordem: toNullableInteger(payload.ordem),
    peso: toNullableNumber(payload.peso) ?? 1,
    obrigatoria: toBooleanValue(payload.obrigatoria, true),
    versaoEnunciado: toTrimmedString(payload.versaoEnunciado || payload.versao_enunciado, 12000),
  };
}

function normalizeImportPayload(payload = {}) {
  const provaId = toTrimmedString(payload.proofId || payload.provaId || payload.prova_id);

  return {
    provaId: isUuid(provaId) ? provaId : null,
    arquivoId: isUuid(payload.arquivoId) ? payload.arquivoId : null,
    fileType: normalizeEnumValue(payload.fileType || payload.tipoArquivo, PROOF_CENTER_FILE_TYPES, "anexo"),
    status: normalizeEnumValue(payload.status, PROOF_CENTER_IMPORT_STATUSES, "pendente"),
    textoExtraido: toTrimmedString(payload.textoExtraido || payload.texto_extraido, 40000),
    confiancaMedia: toNullableNumber(payload.confiancaMedia ?? payload.confianca_media),
    totalQuestoesDetectadas: toNullableInteger(payload.totalQuestoesDetectadas ?? payload.total_questoes_detectadas),
    logParser: typeof payload.logParser === "string"
      ? { raw: payload.logParser }
      : payload.logParser && typeof payload.logParser === "object"
        ? payload.logParser
        : {},
    file: payload.file || null,
  };
}

function normalizeImportMatchPayload(payload = {}) {
  const proofId = toTrimmedString(payload.proofId || payload.provaId);
  const answerKeyId = toTrimmedString(payload.answerKeyId || payload.gabaritoId);

  if (!isUuid(proofId)) {
    throw createHttpError(400, "Escolha uma prova valida para confirmar o vinculo.");
  }

  return {
    proofId,
    answerKeyId: isUuid(answerKeyId) ? answerKeyId : null,
  };
}

function normalizeReviewPayload(payload = {}) {
  const notaAtribuida = toNullableNumber(payload.notaAtribuida ?? payload.nota_atribuida);

  if (notaAtribuida === null) {
    throw createHttpError(400, "Informe a nota da revisao.");
  }

  return {
    notaAtribuida,
    correta: toBooleanValue(payload.correta),
    decisao: normalizeEnumValue(payload.decisao, PROOF_CENTER_REVIEW_DECISIONS, "comentada"),
    motivo: toTrimmedString(payload.motivo, 2000),
    feedback: toTrimmedString(payload.feedback, 4000),
  };
}

export class ProofCenterAdminController {
  constructor({ proofCenterAdminRepository }) {
    this.proofCenterAdminRepository = proofCenterAdminRepository;
  }

  async getReference({ response }) {
    sendJson(response, 200, { reference: buildProofCenterReferenceData() });
  }

  async getSummary({ response }) {
    sendJson(response, 200, { summary: await this.proofCenterAdminRepository.getSummary() });
  }

  async listProofs({ response }) {
    sendJson(response, 200, { proofs: await this.proofCenterAdminRepository.listProofs() });
  }

  async getProof({ response, proofId }) {
    const detail = await this.proofCenterAdminRepository.getProofById(assertUuidParam(proofId, "Prova"));

    if (!detail) {
      throw createHttpError(404, "Prova nao encontrada.");
    }

    sendJson(response, 200, detail);
  }

  async createProof({ request, response, adminContext }) {
    const payload = normalizeProofPayload(await readJsonBody(request));
    const detail = await this.proofCenterAdminRepository.createProof(payload, adminContext?.actor || null);
    sendJson(response, 201, detail);
  }

  async updateProof({ request, response, proofId, adminContext }) {
    const payload = normalizeProofPayload(await readJsonBody(request));
    const detail = await this.proofCenterAdminRepository.updateProof(
      assertUuidParam(proofId, "Prova"),
      payload,
      adminContext?.actor || null
    );

    if (!detail) {
      throw createHttpError(404, "Prova nao encontrada.");
    }

    sendJson(response, 200, detail);
  }

  async addProofItem({ request, response, proofId }) {
    const detail = await this.proofCenterAdminRepository.addProofItem(
      assertUuidParam(proofId, "Prova"),
      normalizeMountPayload(await readJsonBody(request))
    );
    sendJson(response, 201, detail?.detail || null);
  }

  async updateProofItem({ request, response, itemId }) {
    const detail = await this.proofCenterAdminRepository.updateProofItem(
      assertUuidParam(itemId, "Item da prova"),
      normalizeMountPayload(await readJsonBody(request))
    );

    if (!detail) {
      throw createHttpError(404, "Item da prova nao encontrado.");
    }

    sendJson(response, 200, detail);
  }

  async deleteProofItem({ response, itemId }) {
    const detail = await this.proofCenterAdminRepository.deleteProofItem(assertUuidParam(itemId, "Item da prova"));

    if (!detail) {
      throw createHttpError(404, "Item da prova nao encontrado.");
    }

    sendJson(response, 200, detail);
  }

  async listQuestions({ response }) {
    sendJson(response, 200, { questions: await this.proofCenterAdminRepository.listQuestions() });
  }

  async getQuestion({ response, questionId }) {
    const question = await this.proofCenterAdminRepository.getQuestionById(assertUuidParam(questionId, "Questao"));

    if (!question) {
      throw createHttpError(404, "Questao nao encontrada.");
    }

    sendJson(response, 200, { question });
  }

  async createQuestion({ request, response, adminContext }) {
    const question = await this.proofCenterAdminRepository.createQuestion(
      normalizeQuestionPayload(await readJsonBody(request)),
      adminContext?.actor || null
    );

    sendJson(response, 201, { question });
  }

  async updateQuestion({ request, response, questionId, adminContext }) {
    const question = await this.proofCenterAdminRepository.updateQuestion(
      assertUuidParam(questionId, "Questao"),
      normalizeQuestionPayload(await readJsonBody(request)),
      adminContext?.actor || null
    );

    if (!question) {
      throw createHttpError(404, "Questao nao encontrada.");
    }

    sendJson(response, 200, { question });
  }

  async listAnswerKeys({ response, url }) {
    const proofId = url.searchParams.get("proofId") || url.searchParams.get("proof");
    sendJson(response, 200, {
      answerKeys: await this.proofCenterAdminRepository.listAnswerKeys({
        proofId: isUuid(proofId) ? proofId : null,
      }),
    });
  }

  async getAnswerKey({ response, answerKeyId }) {
    const answerKey = await this.proofCenterAdminRepository.getAnswerKeyById(assertUuidParam(answerKeyId, "Gabarito"));

    if (!answerKey) {
      throw createHttpError(404, "Gabarito nao encontrado.");
    }

    sendJson(response, 200, { answerKey });
  }

  async createAnswerKey({ request, response, adminContext }) {
    const result = await this.proofCenterAdminRepository.upsertAnswerKey(
      normalizeAnswerKeyPayload(await readJsonBody(request)),
      adminContext?.actor || null
    );
    sendJson(response, 201, result);
  }

  async updateAnswerKey({ request, response, answerKeyId, adminContext }) {
    const payload = normalizeAnswerKeyPayload(await readJsonBody(request));
    payload.answerKey.id = assertUuidParam(answerKeyId, "Gabarito");
    const result = await this.proofCenterAdminRepository.upsertAnswerKey(payload, adminContext?.actor || null);
    sendJson(response, 200, result);
  }

  async listImports({ response, url }) {
    const proofId = url.searchParams.get("proofId") || url.searchParams.get("proof");
    sendJson(response, 200, {
      imports: await this.proofCenterAdminRepository.listImports({
        proofId: isUuid(proofId) ? proofId : null,
      }),
    });
  }

  async getImport({ response, importId }) {
    const detail = await this.proofCenterAdminRepository.getImportById(assertUuidParam(importId, "Importacao"));

    if (!detail) {
      throw createHttpError(404, "Importacao nao encontrada.");
    }

    sendJson(response, 200, { import: detail });
  }

  async createImport({ request, response, adminContext }) {
    const entry = await this.proofCenterAdminRepository.createImport(
      normalizeImportPayload(await readJsonBody(request)),
      adminContext?.actor || null
    );

    sendJson(response, 201, { import: entry });
  }

  async analyzeImport({ response, importId }) {
    const entry = await this.proofCenterAdminRepository.analyzeImport(assertUuidParam(importId, "Importacao"));

    if (!entry) {
      throw createHttpError(404, "Importacao nao encontrada.");
    }

    sendJson(response, 200, { import: entry });
  }

  async confirmImportMatch({ request, response, importId }) {
    const entry = await this.proofCenterAdminRepository.confirmImportMatch(
      assertUuidParam(importId, "Importacao"),
      normalizeImportMatchPayload(await readJsonBody(request))
    );

    if (!entry) {
      throw createHttpError(404, "Importacao nao encontrada.");
    }

    sendJson(response, 200, { import: entry });
  }

  async importParsedQuestions({ request, response, importId, adminContext }) {
    await readJsonBody(request);
    const entry = await this.proofCenterAdminRepository.importParsedQuestions(
      assertUuidParam(importId, "Importacao"),
      adminContext?.actor || null
    );

    if (!entry) {
      throw createHttpError(404, "Importacao nao encontrada.");
    }

    sendJson(response, 200, { import: entry });
  }

  async downloadFile({ response, fileId }) {
    const file = await this.proofCenterAdminRepository.getFileById(assertUuidParam(fileId, "Arquivo"));

    if (!file) {
      throw createHttpError(404, "Arquivo nao encontrado.");
    }

    if (!file.storagePath && /^https?:\/\//i.test(file.url || "")) {
      response.writeHead(302, { Location: file.url });
      response.end();
      return;
    }

    if (!this.proofCenterAdminRepository.storageService) {
      throw createHttpError(503, "O Supabase Storage ainda nao foi configurado para o modulo de provas.");
    }

    const download = await this.proofCenterAdminRepository.storageService.downloadStoredFile(file);
    response.writeHead(200, {
      "Content-Type": download.contentType,
      "Content-Length": String(download.contentLength),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${download.fileName.replaceAll('"', "")}"`,
    });
    response.end(download.buffer);
  }

  async listCorrectionQueue({ response }) {
    sendJson(response, 200, { queue: await this.proofCenterAdminRepository.listCorrectionQueue() });
  }

  async getCorrectionResponse({ response, responseId }) {
    const nextResponse = await this.proofCenterAdminRepository.getCorrectionResponseById(
      assertUuidParam(responseId, "Resposta")
    );

    if (!nextResponse) {
      throw createHttpError(404, "Resposta nao encontrada.");
    }

    sendJson(response, 200, { response: nextResponse });
  }

  async updateCorrectionResponse({ request, response, responseId, adminContext }) {
    const nextResponse = await this.proofCenterAdminRepository.updateCorrectionResponse(
      assertUuidParam(responseId, "Resposta"),
      normalizeReviewPayload(await readJsonBody(request)),
      adminContext?.actor || null
    );

    if (!nextResponse) {
      throw createHttpError(404, "Resposta nao encontrada.");
    }

    sendJson(response, 200, { response: nextResponse });
  }

  async reprocessCorrections({ request, response }) {
    const payload = await readJsonBody(request);
    const proofId = toTrimmedString(payload.proofId || payload.provaId);

    sendJson(
      response,
      200,
      await this.proofCenterAdminRepository.reprocessCorrections({
        proofId: isUuid(proofId) ? proofId : null,
        force: toBooleanValue(payload.force, false),
      })
    );
  }

  async getResults({ response }) {
    sendJson(response, 200, { results: await this.proofCenterAdminRepository.getResults() });
  }
}
