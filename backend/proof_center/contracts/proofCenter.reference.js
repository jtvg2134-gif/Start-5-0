export const PROOF_CENTER_PROOF_TYPES = [
  "simulado",
  "lista",
  "prova_antiga",
  "diagnostico",
  "revisao",
  "outro",
];

export const PROOF_CENTER_PROOF_STATUSES = ["draft", "review", "active", "archived"];
export const PROOF_CENTER_PROOF_AREAS = ["exatas", "linguagens", "humanas", "natureza", "mista"];
export const PROOF_CENTER_PROOF_LEVELS = ["fundamentos", "intermediario", "avancado", "misto"];
export const PROOF_CENTER_PROOF_ORIGINS = ["manual", "banco_questoes", "pdf_assistido"];

export const PROOF_CENTER_QUESTION_TYPES = [
  "objetiva",
  "numerica",
  "expressao_simples",
  "discursiva_calculo",
];

export const PROOF_CENTER_QUESTION_STATUSES = ["draft", "review", "active", "archived"];
export const PROOF_CENTER_QUESTION_ORIGINS = ["manual", "colar_texto", "pdf_assistido"];
export const PROOF_CENTER_CORRECTION_METHODS = [
  "automatica",
  "automatica_com_tolerancia",
  "semiassistida",
  "manual",
];
export const PROOF_CENTER_DIFFICULTIES = ["facil", "media", "dificil"];
export const PROOF_CENTER_ANSWER_KEY_TYPES = ["alternativa", "texto", "numero", "expressao"];
export const PROOF_CENTER_FILE_TYPES = ["pdf_original", "pdf_gabarito", "imagem_apoio", "anexo"];
export const PROOF_CENTER_ATTEMPT_STATUSES = ["em_andamento", "enviada", "em_correcao", "finalizada"];
export const PROOF_CENTER_ANSWER_STATUSES = [
  "pendente",
  "corrigida_automatica",
  "baixa_confianca",
  "revisao_manual",
  "concluida",
];
export const PROOF_CENTER_IMPORT_STATUSES = ["pendente", "processando", "concluida", "falhou"];
export const PROOF_CENTER_REVIEW_DECISIONS = ["ajustada", "confirmada", "invalidada", "comentada"];
export const PROOF_CENTER_ANSWER_KEY_RECORD_TYPES = ["oficial", "ajustado", "provisorio"];
export const PROOF_CENTER_ANSWER_KEY_RECORD_STATUSES = ["draft", "active", "archived"];
export const PROOF_CENTER_ANSWER_KEY_SOURCES = ["manual", "importado", "revisado"];
export const PROOF_CENTER_ANSWER_KEY_QUESTION_TYPES = [
  "multipla_escolha",
  "verdadeiro_falso",
  "numerica_exata",
  "numerica_com_tolerancia",
  "discursiva_manual",
  "hibrida",
];
export const PROOF_CENTER_MATCHING_LEVELS = ["automatic", "suggested", "manual"];
export const PROOF_CENTER_IMPORT_PROCESSING_STATUSES = [
  "uploaded",
  "extracting_text",
  "ocr_required",
  "matching_proof",
  "matched_automatic",
  "matched_suggested",
  "manual_review_required",
  "parsed_questions",
  "questions_imported",
  "ready_for_correction",
  "failed",
];
export const PROOF_CENTER_PARSED_QUESTION_REVIEW_STATUSES = ["pending", "reviewed", "imported", "ignored"];

export function buildProofCenterReferenceData() {
  return {
    proofTypes: PROOF_CENTER_PROOF_TYPES.slice(),
    proofStatuses: PROOF_CENTER_PROOF_STATUSES.slice(),
    proofAreas: PROOF_CENTER_PROOF_AREAS.slice(),
    proofLevels: PROOF_CENTER_PROOF_LEVELS.slice(),
    proofOrigins: PROOF_CENTER_PROOF_ORIGINS.slice(),
    questionTypes: PROOF_CENTER_QUESTION_TYPES.slice(),
    questionStatuses: PROOF_CENTER_QUESTION_STATUSES.slice(),
    questionOrigins: PROOF_CENTER_QUESTION_ORIGINS.slice(),
    correctionMethods: PROOF_CENTER_CORRECTION_METHODS.slice(),
    difficulties: PROOF_CENTER_DIFFICULTIES.slice(),
    answerKeyTypes: PROOF_CENTER_ANSWER_KEY_TYPES.slice(),
    fileTypes: PROOF_CENTER_FILE_TYPES.slice(),
    attemptStatuses: PROOF_CENTER_ATTEMPT_STATUSES.slice(),
    answerStatuses: PROOF_CENTER_ANSWER_STATUSES.slice(),
    importStatuses: PROOF_CENTER_IMPORT_STATUSES.slice(),
    reviewDecisions: PROOF_CENTER_REVIEW_DECISIONS.slice(),
    answerKeyRecordTypes: PROOF_CENTER_ANSWER_KEY_RECORD_TYPES.slice(),
    answerKeyRecordStatuses: PROOF_CENTER_ANSWER_KEY_RECORD_STATUSES.slice(),
    answerKeySources: PROOF_CENTER_ANSWER_KEY_SOURCES.slice(),
    answerKeyQuestionTypes: PROOF_CENTER_ANSWER_KEY_QUESTION_TYPES.slice(),
    matchingLevels: PROOF_CENTER_MATCHING_LEVELS.slice(),
    importProcessingStatuses: PROOF_CENTER_IMPORT_PROCESSING_STATUSES.slice(),
    parsedQuestionReviewStatuses: PROOF_CENTER_PARSED_QUESTION_REVIEW_STATUSES.slice(),
  };
}

export function normalizeEnumValue(value, allowedValues, fallback = "") {
  const normalized = String(value || "").trim().toLowerCase();
  return allowedValues.includes(normalized) ? normalized : fallback;
}
