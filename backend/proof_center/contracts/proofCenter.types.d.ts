export type ProofCenterProofType =
  | "simulado"
  | "lista"
  | "prova_antiga"
  | "diagnostico"
  | "revisao"
  | "outro";

export type ProofCenterProofStatus = "draft" | "review" | "active" | "archived" | "published";
export type ProofCenterArea = "exatas" | "linguagens" | "humanas" | "natureza" | "mista";
export type ProofCenterLevel = "fundamentos" | "intermediario" | "avancado" | "misto";
export type ProofCenterProofOrigin = "manual" | "banco_questoes" | "pdf_assistido";
export type ProofCenterQuestionType =
  | "objetiva"
  | "numerica"
  | "expressao_simples"
  | "discursiva_calculo";
export type ProofCenterQuestionStatus = "draft" | "review" | "active" | "archived";
export type ProofCenterQuestionOrigin = "manual" | "colar_texto" | "pdf_assistido";
export type ProofCenterCorrectionMethod =
  | "automatica"
  | "automatica_com_tolerancia"
  | "semiassistida"
  | "manual";
export type ProofCenterDifficulty = "facil" | "media" | "dificil";
export type ProofCenterAnswerKeyType = "alternativa" | "texto" | "numero" | "expressao";
export type ProofCenterFileType = "pdf_original" | "pdf_gabarito" | "imagem_apoio" | "anexo";
export type ProofCenterAttemptStatus = "em_andamento" | "enviada" | "em_correcao" | "finalizada";
export type ProofCenterAnswerStatus =
  | "pendente"
  | "corrigida_automatica"
  | "baixa_confianca"
  | "revisao_manual"
  | "concluida";
export type ProofCenterImportStatus =
  | "pendente"
  | "processando"
  | "revisao"
  | "concluida"
  | "erro"
  | "falhou";
export type ProofCenterReviewDecision = "ajustada" | "confirmada" | "invalidada" | "comentada";
export type ProofCenterAnswerKeyRecordType = "oficial" | "ajustado" | "provisorio";
export type ProofCenterAnswerKeyRecordStatus = "draft" | "active" | "archived";
export type ProofCenterAnswerKeySource = "manual" | "importado" | "revisado";
export type ProofCenterAnswerKeyQuestionType =
  | "multipla_escolha"
  | "verdadeiro_falso"
  | "numerica_exata"
  | "numerica_com_tolerancia"
  | "discursiva_manual"
  | "hibrida";
export type ProofCenterMatchingLevel = "automatic" | "suggested" | "manual";
export type ProofCenterImportProcessingStatus =
  | "uploaded"
  | "extracting_text"
  | "ocr_required"
  | "matching_proof"
  | "matched_automatic"
  | "matched_suggested"
  | "manual_review_required"
  | "parsed_questions"
  | "questions_imported"
  | "ready_for_correction"
  | "failed";
export type ProofCenterParsedQuestionReviewStatus = "pending" | "reviewed" | "imported" | "ignored";

export interface ProofCenterReferenceData {
  proofTypes: ProofCenterProofType[];
  proofStatuses: ProofCenterProofStatus[];
  proofAreas: ProofCenterArea[];
  proofLevels: ProofCenterLevel[];
  proofOrigins: ProofCenterProofOrigin[];
  questionTypes: ProofCenterQuestionType[];
  questionStatuses: ProofCenterQuestionStatus[];
  questionOrigins: ProofCenterQuestionOrigin[];
  correctionMethods: ProofCenterCorrectionMethod[];
  difficulties: ProofCenterDifficulty[];
  answerKeyTypes: ProofCenterAnswerKeyType[];
  fileTypes: ProofCenterFileType[];
  attemptStatuses: ProofCenterAttemptStatus[];
  answerStatuses: ProofCenterAnswerStatus[];
  importStatuses: ProofCenterImportStatus[];
  reviewDecisions: ProofCenterReviewDecision[];
  answerKeyRecordTypes: ProofCenterAnswerKeyRecordType[];
  answerKeyRecordStatuses: ProofCenterAnswerKeyRecordStatus[];
  answerKeySources: ProofCenterAnswerKeySource[];
  answerKeyQuestionTypes: ProofCenterAnswerKeyQuestionType[];
  matchingLevels: ProofCenterMatchingLevel[];
  importProcessingStatuses: ProofCenterImportProcessingStatus[];
  parsedQuestionReviewStatuses: ProofCenterParsedQuestionReviewStatus[];
}

export interface ProofCenterFileAsset {
  id: string;
  provaId: string;
  tipoArquivo: ProofCenterFileType;
  nomeOriginal: string;
  storagePath: string;
  url: string;
  mimeType: string;
  tamanhoBytes: number;
  metadados: Record<string, unknown>;
  createdAt: string | null;
}

export interface ProofCenterAnswerKey {
  id: string;
  questaoId: string;
  tipoGabarito: ProofCenterAnswerKeyType;
  respostaBruta: string;
  respostaNormalizada: string;
  valorNumerico: number | null;
  expressaoCanonica: string;
  toleranciaAbsoluta: number | null;
  toleranciaPercentual: number | null;
  unidade: string;
  principal: boolean;
  observacao: string;
  createdAt: string | null;
}

export interface ProofCenterAlternative {
  id: string;
  questaoId: string;
  letra: string;
  texto: string;
  ordem: number;
  isCorreta: boolean;
}

export interface ProofCenterQuestionSummary {
  id: string;
  tituloInterno: string;
  enunciado: string;
  tipoQuestao: ProofCenterQuestionType;
  area: ProofCenterArea;
  assunto: string;
  subassunto: string;
  formulaPrincipal: string;
  unidadeResposta: string;
  casasDecimaisEsperadas: number | null;
  aceitaNotacaoCientifica: boolean;
  metodoCorrecao: ProofCenterCorrectionMethod;
  toleranciaAbsoluta: number | null;
  toleranciaPercentual: number | null;
  pesoPadrao: number;
  dificuldadeInterna: ProofCenterDifficulty | "";
  possuiImagem: boolean;
  imagemUrl: string;
  observacoesAdmin: string;
  origemCadastro: ProofCenterQuestionOrigin;
  status: ProofCenterQuestionStatus;
  usageCount: number;
  totalAlternativas?: number;
  totalGabaritos?: number;
  createdAt: string | null;
  updatedAt: string | null;
  alternatives?: ProofCenterAlternative[];
  answerKeys?: ProofCenterAnswerKey[];
}

export interface ProofCenterProofSummary {
  id: string;
  titulo: string;
  proofCode: string;
  descricao: string;
  disciplina: string;
  area: ProofCenterArea;
  nivel: ProofCenterLevel;
  ano: number | null;
  tipoProva: ProofCenterProofType;
  status: ProofCenterProofStatus;
  origem: ProofCenterProofOrigin;
  tempoLimiteMin: number | null;
  observacoes: string;
  examProvider: string;
  examName: string;
  examYear: number | null;
  examEdition: string;
  examDay: string;
  applicationDate: string | null;
  examArea: ProofCenterArea;
  subjectGroup: string;
  bookletColor: string;
  examVersion: string;
  examLanguage: string;
  expectedQuestionCount: number | null;
  parserProfile: string;
  aliasKeywords: string[];
  identificationNotes: string;
  activeAnswerKeyId: string | null;
  activeAnswerKeyStatus: ProofCenterAnswerKeyRecordStatus | "";
  activeAnswerKeyConfidence: number | null;
  activeAnswerKeyItemCount: number;
  latestImportId: string | null;
  latestImportStatus: ProofCenterImportStatus | "";
  latestImportProcessingStatus: ProofCenterImportProcessingStatus | "";
  latestImportMatchingLevel: ProofCenterMatchingLevel | "";
  latestImportMatchingConfidence: number | null;
  latestImportReviewRequired: boolean;
  counts: {
    totalQuestions: number;
    totalFiles: number;
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProofCenterMountedQuestion {
  id: string;
  provaId: string;
  questaoId: string;
  numeroNaProva: number;
  ordem: number;
  peso: number;
  obrigatoria: boolean;
  versaoEnunciado: string;
  createdAt: string | null;
  updatedAt: string | null;
  questao: ProofCenterQuestionSummary | null;
}

export interface ProofCenterAnswerKeyItemRecord {
  id: string;
  answerKeyId: string;
  questionNumber: number;
  questionType: ProofCenterAnswerKeyQuestionType;
  expectedAnswer: string;
  validationRule: Record<string, unknown>;
  numericTolerance: number | null;
  weight: number;
  metadata: Record<string, unknown>;
  notes: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProofCenterAnswerKeyRecord {
  id: string;
  proofId: string;
  proofTitle?: string;
  proofCode?: string;
  answerKeyType: ProofCenterAnswerKeyRecordType;
  source: ProofCenterAnswerKeySource;
  status: ProofCenterAnswerKeyRecordStatus;
  confidence: number | null;
  notes: string;
  totalItems?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProofCenterAnswerKeyDetail extends ProofCenterAnswerKeyRecord {
  items: ProofCenterAnswerKeyItemRecord[];
}

export interface ProofCenterImportMatchCandidate {
  proofId: string;
  answerKeyId: string | null;
  proofCode: string | null;
  score: number;
  matchedFields: {
    provider: boolean;
    name: boolean;
    year: boolean;
    day: boolean;
    area: boolean;
    booklet: boolean;
    version: boolean;
    expectedQuestionCount: boolean;
  };
}

export interface ProofCenterParsedQuestion {
  id: string;
  importId: string;
  questionNumber: number;
  rawBlock: string;
  stem: string;
  alternatives: Array<{ letra: string; texto: string }>;
  parsingConfidence: number | null;
  reviewStatus: ProofCenterParsedQuestionReviewStatus;
  metadata: Record<string, unknown>;
  linkedQuestionId: string | null;
  linkedProofItemId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ProofCenterImportLog {
  id: string;
  status: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
}

export interface ProofCenterImportEntry {
  id: string;
  provaId: string | null;
  provaTitulo: string;
  provaCode?: string;
  arquivoId: string | null;
  arquivoNome: string;
  arquivoUrl?: string;
  tipoArquivo: ProofCenterFileType | "";
  status: ProofCenterImportStatus;
  processingStatus: ProofCenterImportProcessingStatus | "";
  matchingLevel: ProofCenterMatchingLevel | "";
  matchingConfidence: number | null;
  recognizedProofId: string | null;
  recognizedProofTitle: string;
  recognizedProofCode: string;
  recognizedAnswerKeyId: string | null;
  recognizedAnswerKeyType: ProofCenterAnswerKeyRecordType | "";
  reviewRequired: boolean;
  ocrRequired: boolean;
  errorMessage: string;
  detectedMetadata: Record<string, unknown>;
  processingSummary: Record<string, unknown>;
  textoExtraido: string;
  confiancaMedia: number | null;
  totalQuestoesDetectadas: number | null;
  parsedQuestionCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  finishedAt: string | null;
}

export interface ProofCenterImportDetail extends ProofCenterImportEntry {
  parsedQuestions: ProofCenterParsedQuestion[];
  logs: ProofCenterImportLog[];
  matchCandidates: ProofCenterImportMatchCandidate[];
}

export interface ProofCenterProofDetail {
  proof: ProofCenterProofSummary;
  items: ProofCenterMountedQuestion[];
  files: ProofCenterFileAsset[];
  answerKeys?: ProofCenterAnswerKeyRecord[];
  imports?: ProofCenterImportEntry[];
}

export interface ProofCenterCorrectionQueueItem {
  id: string;
  statusCorrecao: ProofCenterAnswerStatus;
  confiancaCorrecao: number | null;
  notaAtribuida: number | null;
  correta: boolean | null;
  motivoPendencia: string;
  createdAt: string | null;
  updatedAt: string | null;
  provaId?: string;
  prova?: {
    id: string;
    titulo: string;
    disciplina: string;
  };
  aluno: {
    id: string;
    nome: string;
    email: string;
  };
  questao: {
    id: string;
    numeroNaProva: number;
    tituloInterno: string;
    enunciado: string;
    tipoQuestao: ProofCenterQuestionType;
    metodoCorrecao: ProofCenterCorrectionMethod;
    assunto: string;
    subassunto: string;
  };
}

export interface ProofCenterResultsResponse {
  byProof: Array<{
    provaId: string;
    provaTitulo: string;
    disciplina: string;
    totalTentativas: number;
    notaTotal: number;
    totalAcertos: number;
    totalErros: number;
  }>;
  bySubject: Array<{
    assunto: string;
    totalRespostas: number;
    totalAcertos: number;
    totalErros: number;
  }>;
  history: Array<{
    tentativaId: string;
    provaId: string;
    provaTitulo: string;
    disciplina: string;
    alunoId: string;
    alunoNome: string;
    alunoEmail: string;
    status: ProofCenterAttemptStatus;
    notaFinal: number;
    totalAcertos: number;
    totalErros: number;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
}

export interface ProofCenterSummaryResponse {
  counts: {
    totalProofs: number;
    totalMasterQuestions: number;
    totalMountedQuestions: number;
    totalResponses: number;
    totalPendingReview: number;
    totalImports: number;
  };
  recentProofs: ProofCenterProofSummary[];
  recentQuestions: ProofCenterQuestionSummary[];
  recentImports: ProofCenterImportEntry[];
}
