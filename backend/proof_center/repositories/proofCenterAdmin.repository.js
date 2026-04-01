import { randomUUID } from "node:crypto";
import { createHttpError } from "../shared/errors.js";

function toStringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function toTrimmedString(value) {
  return toStringValue(value).trim();
}

function toNullableString(value) {
  const normalized = toTrimmedString(value);
  return normalized || null;
}

function toBooleanValue(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = toTrimmedString(value).toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return ["1", "true", "yes", "on", "sim"].includes(normalized);
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

function parseJsonValue(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return value;
}

function buildIncomingFilePayload(file, type) {
  if (!file || typeof file !== "object") {
    return null;
  }

  const nomeOriginal = toTrimmedString(file.fileName || file.nomeOriginal || file.name);

  if (!nomeOriginal) {
    return null;
  }

  const dataBase64 = toTrimmedString(file.dataBase64 || "");

  return {
    tipoArquivo: type,
    nomeOriginal,
    storagePath: toNullableString(file.storagePath || file.path),
    url: toNullableString(file.url),
    mimeType: toNullableString(file.mimeType || file.type),
    tamanhoBytes: toNullableInteger(file.sizeBytes || file.tamanhoBytes || (dataBase64 ? Math.round((dataBase64.length * 3) / 4) : null)),
    dataBase64,
    metadados: {
      uploadMode: dataBase64 ? "inline_upload" : "metadata_only",
      inlineByteLength: dataBase64 ? dataBase64.length : 0,
      originalField: type,
    },
  };
}

function mapFileRow(row) {
  return {
    id: row.id,
    provaId: row.prova_id,
    tipoArquivo: row.tipo_arquivo || "",
    nomeOriginal: row.nome_original || "",
    storagePath: row.storage_path || "",
    url: row.url || `/api/admin/proof-center/files/${row.id}`,
    mimeType: row.mime_type || "",
    tamanhoBytes: Number(row.tamanho_bytes || 0),
    metadados: parseJsonValue(row.metadados, {}),
    createdAt: row.created_at || null,
  };
}

function mapAlternativeRow(row) {
  return {
    id: row.id,
    questaoId: row.questao_id,
    letra: row.letra || "",
    texto: row.texto || "",
    ordem: Number(row.ordem || 0),
    isCorreta: Boolean(row.is_correta),
  };
}

function mapAnswerKeyRow(row) {
  return {
    id: row.id,
    questaoId: row.questao_id,
    tipoGabarito: row.tipo_gabarito || "texto",
    respostaBruta: row.resposta_bruta || "",
    respostaNormalizada: row.resposta_normalizada || "",
    valorNumerico: toNullableNumber(row.valor_numerico),
    expressaoCanonica: row.expressao_canonica || "",
    toleranciaAbsoluta: toNullableNumber(row.tolerancia_absoluta),
    toleranciaPercentual: toNullableNumber(row.tolerancia_percentual),
    unidade: row.unidade || "",
    principal: Boolean(row.principal),
    observacao: row.observacao || "",
    createdAt: row.created_at || null,
  };
}

function mapAnswerKeyRecordRow(row) {
  return {
    id: row.id,
    proofId: row.proof_id,
    answerKeyType: row.answer_key_type || "oficial",
    source: row.source || "manual",
    status: row.status || "draft",
    confidence: toNullableNumber(row.confidence),
    notes: row.notes || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapAnswerKeyItemRecordRow(row) {
  return {
    id: row.id,
    answerKeyId: row.answer_key_id,
    questionNumber: Number(row.question_number || 0),
    questionType: row.question_type || "multipla_escolha",
    expectedAnswer: row.expected_answer || "",
    validationRule: parseJsonValue(row.validation_rule, {}),
    numericTolerance: toNullableNumber(row.numeric_tolerance),
    weight: toNullableNumber(row.weight) ?? 1,
    metadata: parseJsonValue(row.metadata, {}),
    notes: row.notes || "",
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapParsedQuestionRow(row) {
  return {
    id: row.id,
    importId: row.importacao_id,
    questionNumber: Number(row.question_number || 0),
    rawBlock: row.raw_block || "",
    stem: row.stem || "",
    alternatives: parseJsonValue(row.alternatives, []),
    parsingConfidence: toNullableNumber(row.parsing_confidence),
    reviewStatus: row.review_status || "pending",
    metadata: parseJsonValue(row.metadata, {}),
    linkedQuestionId: row.linked_question_id || null,
    linkedProofItemId: row.linked_proof_item_id || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapQuestionSummaryRow(row) {
  return {
    id: row.id,
    tituloInterno: row.titulo_interno || "",
    enunciado: row.enunciado || "",
    tipoQuestao: row.tipo_questao || "objetiva",
    area: row.area || "exatas",
    assunto: row.assunto || "",
    subassunto: row.subassunto || "",
    formulaPrincipal: row.formula_principal || "",
    unidadeResposta: row.unidade_resposta || "",
    casasDecimaisEsperadas: toNullableInteger(row.casas_decimais_esperadas),
    aceitaNotacaoCientifica: Boolean(row.aceita_notacao_cientifica),
    metodoCorrecao: row.metodo_correcao || "manual",
    toleranciaAbsoluta: toNullableNumber(row.tolerancia_absoluta),
    toleranciaPercentual: toNullableNumber(row.tolerancia_percentual),
    pesoPadrao: toNullableNumber(row.peso_padrao) ?? 1,
    dificuldadeInterna: row.dificuldade_interna || "",
    possuiImagem: Boolean(row.possui_imagem),
    imagemUrl: row.imagem_url || "",
    observacoesAdmin: row.observacoes_admin || "",
    origemCadastro: row.origem_cadastro || "manual",
    status: row.status || "draft",
    usageCount: Number(row.usage_count || 0),
    totalAlternativas: Number(row.total_alternativas || 0),
    totalGabaritos: Number(row.total_gabaritos || 0),
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapProofSummaryRow(row) {
  return {
    id: row.id,
    titulo: row.titulo || "",
    proofCode: row.proof_code || "",
    descricao: row.descricao || "",
    disciplina: row.disciplina || "",
    area: row.area || "exatas",
    nivel: row.nivel || "misto",
    ano: toNullableInteger(row.ano),
    tipoProva: row.tipo_prova || "outro",
    status: row.status || "draft",
    origem: row.origem || "manual",
    tempoLimiteMin: toNullableInteger(row.tempo_limite_min),
    observacoes: row.observacoes || "",
    examProvider: row.exam_provider || "",
    examName: row.exam_name || "",
    examYear: toNullableInteger(row.exam_year),
    examEdition: row.exam_edition || "",
    examDay: row.exam_day || "",
    applicationDate: row.application_date || null,
    examArea: row.area || "exatas",
    subjectGroup: row.subject_group || "",
    bookletColor: row.booklet_color || "",
    examVersion: row.exam_version || "",
    examLanguage: row.exam_language || "",
    expectedQuestionCount: toNullableInteger(row.expected_question_count),
    parserProfile: row.parser_profile || "",
    aliasKeywords: parseJsonValue(row.alias_keywords, []),
    identificationNotes: row.identification_notes || "",
    activeAnswerKeyId: row.active_answer_key_id || null,
    activeAnswerKeyStatus: row.active_answer_key_status || "",
    activeAnswerKeyConfidence: toNullableNumber(row.active_answer_key_confidence),
    activeAnswerKeyItemCount: Number(row.active_answer_key_item_count || 0),
    latestImportId: row.latest_import_id || null,
    latestImportStatus: row.latest_import_status || "",
    latestImportProcessingStatus: row.latest_import_processing_status || "",
    latestImportMatchingLevel: row.latest_import_matching_level || "",
    latestImportMatchingConfidence: toNullableNumber(row.latest_import_matching_confidence),
    latestImportReviewRequired: Boolean(row.latest_import_review_required),
    counts: {
      totalQuestions: Number(row.total_questoes || 0),
      totalFiles: Number(row.total_arquivos || 0),
    },
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

function mapMountedQuestionRow(row) {
  return {
    id: row.id,
    provaId: row.prova_id,
    questaoId: row.questao_id,
    numeroNaProva: Number(row.numero_na_prova || 0),
    ordem: Number(row.ordem || 0),
    peso: toNullableNumber(row.peso) ?? 1,
    obrigatoria: Boolean(row.obrigatoria),
    versaoEnunciado: row.versao_enunciado || "",
    createdAt: row.item_created_at || null,
    updatedAt: row.item_updated_at || null,
    questao: mapQuestionSummaryRow(row),
  };
}

async function runQuery(dbOrClient, text, params = []) {
  return dbOrClient.query(text, params);
}

function getActorAudit(actor = null) {
  return {
    uuidUserId: actor?.uuidUserId || null,
    legacyUserId: actor?.legacyUserId || null,
  };
}

function slugifyProofPart(value) {
  return toTrimmedString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

function buildProofCode(payload = {}) {
  const provider = payload.examProvider || payload.examName || payload.titulo || "";
  const year = payload.examYear || payload.ano || "";
  const day = payload.examDay || "";
  const area = payload.subjectGroup || payload.area || "";
  const booklet = payload.bookletColor || "";
  const version = payload.examVersion || "";

  return [provider, year, day, area, booklet, version].map(slugifyProofPart).filter(Boolean).join("-");
}

function mapAnswerKeyItemTypeToQuestionType(questionType) {
  switch (questionType) {
    case "multipla_escolha":
      return "objetiva";
    case "numerica_exata":
    case "numerica_com_tolerancia":
      return "numerica";
    case "discursiva_manual":
      return "discursiva_calculo";
    case "hibrida":
      return "expressao_simples";
    default:
      return "objetiva";
  }
}

function mapAnswerKeyItemTypeToCorrectionMethod(questionType) {
  switch (questionType) {
    case "multipla_escolha":
    case "verdadeiro_falso":
      return "automatica";
    case "numerica_exata":
    case "numerica_com_tolerancia":
      return "automatica_com_tolerancia";
    case "hibrida":
      return "semiassistida";
    default:
      return "manual";
  }
}

export class ProofCenterAdminRepository {
  constructor({ db, storageService = null, pdfAnalysisService = null }) {
    this.db = db;
    this.storageService = storageService;
    this.pdfAnalysisService = pdfAnalysisService;
  }

  async prepareStoredFiles({ proofId, files = [], actor = null, importId = null }) {
    const preparedFiles = [];

    for (const file of Array.isArray(files) ? files : []) {
      if (!file?.nomeOriginal) {
        continue;
      }

      if (file.dataBase64) {
        if (!this.storageService) {
          throw createHttpError(
            503,
            "Configure o Supabase Storage no backend Proof Center para receber uploads reais."
          );
        }

        const uploadedFile = await this.storageService.uploadBase64File({
          proofId,
          fileType: file.tipoArquivo,
          file,
          importId,
          actor,
        });

        preparedFiles.push({
          ...uploadedFile,
          metadados: {
            ...(file.metadados || {}),
            ...(uploadedFile.metadados || {}),
          },
        });
        continue;
      }

      preparedFiles.push({
        tipoArquivo: file.tipoArquivo,
        nomeOriginal: file.nomeOriginal,
        storagePath: file.storagePath || null,
        url: file.url || null,
        mimeType: file.mimeType || null,
        tamanhoBytes: file.tamanhoBytes || null,
        metadados: {
          ...(file.metadados || {}),
          uploadMode: file.storagePath ? "prelinked_storage" : file.metadados?.uploadMode || "metadata_only",
        },
      });
    }

    return preparedFiles;
  }

  async cleanupStoredFiles(files = []) {
    if (!this.storageService || !Array.isArray(files) || !files.length) {
      return;
    }

    await Promise.allSettled(
      files
        .filter((file) => file?.storagePath && file?.metadados?.storageProvider === "supabase")
        .map((file) => this.storageService.deleteStoredFile(file.storagePath))
    );
  }

  async appendImportLog(client, importId, status, message, metadata = {}) {
    await client.query(
      `
        insert into proof_center.import_process_logs (
          importacao_id,
          status,
          message,
          metadata
        )
        values ($1, $2, $3, $4::jsonb)
      `,
      [importId, status, message, JSON.stringify(metadata || {})]
    );
  }

  async getSummary() {
    const [{ rows }, recentProofs, recentQuestions, recentImports] = await Promise.all([
      this.db.query(
        `
          select
            (select count(*) from proof_center.provas) as total_proofs,
            (select count(*) from proof_center.questoes_master) as total_master_questions,
            (select count(*) from proof_center.prova_questoes) as total_mounted_questions,
            (select count(*) from proof_center.respostas_aluno) as total_responses,
            (
              select count(*)
              from proof_center.respostas_aluno
              where status_correcao in ('pendente', 'baixa_confianca', 'revisao_manual')
            ) as total_pending_review,
            (select count(*) from proof_center.importacoes_assistidas) as total_imports
        `
      ),
      this.listProofs(),
      this.listQuestions(),
      this.listImports(),
    ]);

    const row = rows[0] || {};
    return {
      counts: {
        totalProofs: Number(row.total_proofs || 0),
        totalMasterQuestions: Number(row.total_master_questions || 0),
        totalMountedQuestions: Number(row.total_mounted_questions || 0),
        totalResponses: Number(row.total_responses || 0),
        totalPendingReview: Number(row.total_pending_review || 0),
        totalImports: Number(row.total_imports || 0),
      },
      recentProofs: recentProofs.slice(0, 4),
      recentQuestions: recentQuestions.slice(0, 4),
      recentImports: recentImports.slice(0, 4),
    };
  }

  async listProofs() {
    const { rows } = await this.db.query(
      `
        select
          p.*,
          coalesce(items.total_questoes, 0) as total_questoes,
          coalesce(files.total_arquivos, 0) as total_arquivos,
          ak.id as active_answer_key_id,
          ak.status as active_answer_key_status,
          ak.confidence as active_answer_key_confidence,
          coalesce(ak.total_items, 0) as active_answer_key_item_count,
          latest_import.id as latest_import_id,
          latest_import.status as latest_import_status,
          latest_import.processamento_status as latest_import_processing_status,
          latest_import.matching_level as latest_import_matching_level,
          latest_import.matching_confidence as latest_import_matching_confidence,
          coalesce(latest_import.review_required, false) as latest_import_review_required
        from proof_center.provas p
        left join lateral (
          select count(*) as total_questoes
          from proof_center.prova_questoes pq
          where pq.prova_id = p.id
        ) items on true
        left join lateral (
          select count(*) as total_arquivos
          from proof_center.prova_arquivos pa
          where pa.prova_id = p.id
        ) files on true
        left join lateral (
          select
            g.id,
            g.status,
            g.confidence,
            count(gi.id) as total_items
          from proof_center.gabaritos g
          left join proof_center.gabarito_itens gi on gi.answer_key_id = g.id
          where g.proof_id = p.id
          group by g.id
          order by
            case g.status when 'active' then 0 when 'draft' then 1 else 2 end,
            g.updated_at desc
          limit 1
        ) ak on true
        left join lateral (
          select
            ia.id,
            ia.status,
            ia.processamento_status,
            ia.matching_level,
            ia.matching_confidence,
            ia.review_required
          from proof_center.importacoes_assistidas ia
          where ia.prova_id = p.id
             or ia.recognized_proof_id = p.id
          order by ia.updated_at desc nulls last, ia.created_at desc
          limit 1
        ) latest_import on true
        order by p.updated_at desc, p.created_at desc
      `
    );

    return rows.map(mapProofSummaryRow);
  }

  async getProofById(proofId, dbOrClient = this.db) {
    const proofResult = await runQuery(
      dbOrClient,
      `
        select
          p.*,
          coalesce(items.total_questoes, 0) as total_questoes,
          coalesce(files.total_arquivos, 0) as total_arquivos,
          ak.id as active_answer_key_id,
          ak.status as active_answer_key_status,
          ak.confidence as active_answer_key_confidence,
          coalesce(ak.total_items, 0) as active_answer_key_item_count,
          latest_import.id as latest_import_id,
          latest_import.status as latest_import_status,
          latest_import.processamento_status as latest_import_processing_status,
          latest_import.matching_level as latest_import_matching_level,
          latest_import.matching_confidence as latest_import_matching_confidence,
          coalesce(latest_import.review_required, false) as latest_import_review_required
        from proof_center.provas p
        left join lateral (
          select count(*) as total_questoes
          from proof_center.prova_questoes pq
          where pq.prova_id = p.id
        ) items on true
        left join lateral (
          select count(*) as total_arquivos
          from proof_center.prova_arquivos pa
          where pa.prova_id = p.id
        ) files on true
        left join lateral (
          select
            g.id,
            g.status,
            g.confidence,
            count(gi.id) as total_items
          from proof_center.gabaritos g
          left join proof_center.gabarito_itens gi on gi.answer_key_id = g.id
          where g.proof_id = p.id
          group by g.id
          order by
            case g.status when 'active' then 0 when 'draft' then 1 else 2 end,
            g.updated_at desc
          limit 1
        ) ak on true
        left join lateral (
          select
            ia.id,
            ia.status,
            ia.processamento_status,
            ia.matching_level,
            ia.matching_confidence,
            ia.review_required
          from proof_center.importacoes_assistidas ia
          where ia.prova_id = p.id
             or ia.recognized_proof_id = p.id
          order by ia.updated_at desc nulls last, ia.created_at desc
          limit 1
        ) latest_import on true
        where p.id = $1
        limit 1
      `,
      [proofId]
    );

    const proofRow = proofResult.rows[0] || null;

    if (!proofRow) {
      return null;
    }

    const itemsResult = await runQuery(
      dbOrClient,
      `
        select
          pq.*,
          pq.created_at as item_created_at,
          pq.updated_at as item_updated_at,
          qm.titulo_interno,
          qm.enunciado,
          qm.tipo_questao,
          qm.area,
          qm.assunto,
          qm.subassunto,
          qm.formula_principal,
          qm.unidade_resposta,
          qm.casas_decimais_esperadas,
          qm.aceita_notacao_cientifica,
          qm.metodo_correcao,
          qm.tolerancia_absoluta,
          qm.tolerancia_percentual,
          qm.peso_padrao,
          qm.dificuldade_interna,
          qm.possui_imagem,
          qm.imagem_url,
          qm.observacoes_admin,
          qm.origem_cadastro,
          qm.status,
          qm.created_by,
          qm.updated_by,
          qm.created_at,
          qm.updated_at,
          qm.usage_count,
          qm.total_alternativas,
          qm.total_gabaritos
        from proof_center.prova_questoes pq
        join proof_center.vw_questoes_master_catalogo qm on qm.id = pq.questao_id
        where pq.prova_id = $1
        order by pq.ordem asc, pq.numero_na_prova asc
      `,
      [proofId]
    );

    const filesResult = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.prova_arquivos
        where prova_id = $1
        order by created_at asc
      `,
      [proofId]
    );

    return {
      proof: mapProofSummaryRow(proofRow),
      items: itemsResult.rows.map(mapMountedQuestionRow),
      files: filesResult.rows.map(mapFileRow),
      answerKeys: await this.listAnswerKeys({ proofId }, dbOrClient),
      imports: await this.listImports({ proofId }, dbOrClient),
    };
  }

  async getFileById(fileId, dbOrClient = this.db) {
    const { rows } = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.prova_arquivos
        where id = $1
        limit 1
      `,
      [fileId]
    );

    return rows[0] ? mapFileRow(rows[0]) : null;
  }

  async createProof(payload, actor = null) {
    const audit = getActorAudit(actor);
    const proofId = randomUUID();
    const proofCode = toTrimmedString(payload.proofCode) || buildProofCode(payload) || null;
    const preparedFiles = await this.prepareStoredFiles({
      proofId,
      actor: audit,
      files: [
        buildIncomingFilePayload(payload?.pdfOriginal, "pdf_original"),
        buildIncomingFilePayload(payload?.gabaritoPdf, "pdf_gabarito"),
        ...(Array.isArray(payload?.files)
          ? payload.files
              .map((file) =>
                buildIncomingFilePayload(
                  {
                    ...file,
                    tipoArquivo: toTrimmedString(file.tipoArquivo || "anexo") || "anexo",
                  },
                  toTrimmedString(file.tipoArquivo || "anexo") || "anexo"
                )
              )
              .filter(Boolean)
          : []),
      ].filter(Boolean),
    });

    try {
      return await this.db.withTransaction(async (client) => {
        await client.query(
          `
            insert into proof_center.provas (
              id,
              titulo,
              descricao,
              disciplina,
              area,
              nivel,
              ano,
              tipo_prova,
              status,
              origem,
            tempo_limite_min,
            observacoes,
            proof_code,
            exam_provider,
            exam_name,
            exam_year,
            exam_edition,
            exam_day,
            application_date,
            subject_group,
            booklet_color,
            exam_version,
            exam_language,
            expected_question_count,
            parser_profile,
            alias_keywords,
            identification_notes,
            created_by,
            updated_by,
            created_by_legacy_id,
            updated_by_legacy_id
          )
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26::jsonb, $27, $28, $28, $29, $29)
          `,
          [
            proofId,
            payload.titulo,
            payload.descricao,
            payload.disciplina,
            payload.area,
            payload.nivel,
            payload.ano,
            payload.tipoProva,
            payload.status,
            payload.origem,
            payload.tempoLimiteMin,
            payload.observacoes,
            proofCode,
            payload.examProvider,
            payload.examName,
            payload.examYear,
            payload.examEdition,
            payload.examDay,
            payload.applicationDate,
            payload.subjectGroup,
            payload.bookletColor,
            payload.examVersion,
            payload.examLanguage,
            payload.expectedQuestionCount,
            payload.parserProfile,
            JSON.stringify(payload.aliasKeywords || []),
            payload.identificationNotes,
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );

        await this.replaceProofFiles(client, proofId, preparedFiles, audit, false);
        return this.getProofById(proofId, client);
      });
    } catch (error) {
      await this.cleanupStoredFiles(preparedFiles);
      throw error;
    }
  }

  async updateProof(proofId, payload, actor = null) {
    const audit = getActorAudit(actor);
    const proofCode = toTrimmedString(payload.proofCode) || buildProofCode(payload) || null;
    const preparedFiles = await this.prepareStoredFiles({
      proofId,
      actor: audit,
      files: [
        buildIncomingFilePayload(payload?.pdfOriginal, "pdf_original"),
        buildIncomingFilePayload(payload?.gabaritoPdf, "pdf_gabarito"),
        ...(Array.isArray(payload?.files)
          ? payload.files
              .map((file) =>
                buildIncomingFilePayload(
                  {
                    ...file,
                    tipoArquivo: toTrimmedString(file.tipoArquivo || "anexo") || "anexo",
                  },
                  toTrimmedString(file.tipoArquivo || "anexo") || "anexo"
                )
              )
              .filter(Boolean)
          : []),
      ].filter(Boolean),
    });
    const replaceTypes = new Set(preparedFiles.map((file) => file.tipoArquivo));
    const currentDetail = replaceTypes.size ? await this.getProofById(proofId) : null;
    const previousFiles = (currentDetail?.files || []).filter((file) => replaceTypes.has(file.tipoArquivo));

    try {
      const detail = await this.db.withTransaction(async (client) => {
        const updateResult = await client.query(
          `
            update proof_center.provas
            set
              titulo = $2,
              descricao = $3,
              disciplina = $4,
              area = $5,
              nivel = $6,
              ano = $7,
              tipo_prova = $8,
              status = $9,
              origem = $10,
              tempo_limite_min = $11,
              observacoes = $12,
              proof_code = $13,
              exam_provider = $14,
              exam_name = $15,
              exam_year = $16,
              exam_edition = $17,
              exam_day = $18,
              application_date = $19,
              subject_group = $20,
              booklet_color = $21,
              exam_version = $22,
              exam_language = $23,
              expected_question_count = $24,
              parser_profile = $25,
              alias_keywords = $26::jsonb,
              identification_notes = $27,
              updated_by = $28,
              updated_by_legacy_id = $29,
              updated_at = now()
            where id = $1
          `,
          [
            proofId,
            payload.titulo,
            payload.descricao,
            payload.disciplina,
            payload.area,
            payload.nivel,
            payload.ano,
            payload.tipoProva,
            payload.status,
            payload.origem,
            payload.tempoLimiteMin,
            payload.observacoes,
            proofCode,
            payload.examProvider,
            payload.examName,
            payload.examYear,
            payload.examEdition,
            payload.examDay,
            payload.applicationDate,
            payload.subjectGroup,
            payload.bookletColor,
            payload.examVersion,
            payload.examLanguage,
            payload.expectedQuestionCount,
            payload.parserProfile,
            JSON.stringify(payload.aliasKeywords || []),
            payload.identificationNotes,
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );

        if (!updateResult.rowCount) {
          return null;
        }

        await this.replaceProofFiles(client, proofId, preparedFiles, audit, true);
        return this.getProofById(proofId, client);
      });

      await this.cleanupStoredFiles(previousFiles);
      return detail;
    } catch (error) {
      await this.cleanupStoredFiles(preparedFiles);
      throw error;
    }
  }

  async replaceProofFiles(client, proofId, fileRows, actor, isUpdate) {
    const normalizedFileRows = Array.isArray(fileRows) ? fileRows.filter(Boolean) : [];

    if (!normalizedFileRows.length) {
      return;
    }

    if (isUpdate) {
      const replaceTypes = [...new Set(normalizedFileRows.map((item) => item.tipoArquivo))];
      await client.query(
        `
          delete from proof_center.prova_arquivos
          where prova_id = $1
            and tipo_arquivo = any($2::proof_center.tipo_arquivo_prova_enum[])
        `,
        [proofId, replaceTypes]
      );
    }

    for (const file of normalizedFileRows) {
      const insertResult = await client.query(
        `
          insert into proof_center.prova_arquivos (
            prova_id,
            tipo_arquivo,
            nome_original,
            storage_path,
            url,
            mime_type,
            tamanho_bytes,
            metadados,
            created_by,
            created_by_legacy_id
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
          returning id
        `,
        [
          proofId,
          file.tipoArquivo,
          file.nomeOriginal,
          file.storagePath,
          file.url || null,
          file.mimeType,
          file.tamanhoBytes,
          JSON.stringify(file.metadados || {}),
          actor?.uuidUserId || null,
          actor?.legacyUserId || null,
        ]
      );

      const fileId = insertResult.rows[0]?.id || null;
      const fileUrl = file.url || (fileId ? `/api/admin/proof-center/files/${fileId}` : null);

      if (fileId && fileUrl) {
        await client.query(`update proof_center.prova_arquivos set url = $2 where id = $1`, [fileId, fileUrl]);
      }
    }
  }

  async addProofItem(proofId, payload) {
    return this.db.withTransaction(async (client) => {
      const currentStats = await client.query(
        `
          select
            coalesce(max(numero_na_prova), 0) as max_numero,
            coalesce(max(ordem), 0) as max_ordem
          from proof_center.prova_questoes
          where prova_id = $1
        `,
        [proofId]
      );

      const nextNumber =
        toNullableInteger(payload.numeroNaProva) || Number(currentStats.rows[0]?.max_numero || 0) + 1;
      const nextOrder =
        toNullableInteger(payload.ordem) || Number(currentStats.rows[0]?.max_ordem || 0) + 1;

      const result = await client.query(
        `
          insert into proof_center.prova_questoes (
            prova_id,
            questao_id,
            numero_na_prova,
            ordem,
            peso,
            obrigatoria,
            versao_enunciado
          )
          values ($1, $2, $3, $4, $5, $6, $7)
          returning id
        `,
        [
          proofId,
          payload.questaoId,
          nextNumber,
          nextOrder,
          payload.peso,
          payload.obrigatoria,
          payload.versaoEnunciado,
        ]
      );

      return {
        itemId: result.rows[0]?.id || null,
        detail: await this.getProofById(proofId, client),
      };
    });
  }

  async updateProofItem(itemId, payload) {
    return this.db.withTransaction(async (client) => {
      const current = await client.query(
        `
          select prova_id
          from proof_center.prova_questoes
          where id = $1
          limit 1
        `,
        [itemId]
      );

      const proofId = current.rows[0]?.prova_id || null;

      if (!proofId) {
        return null;
      }

      await client.query(
        `
          update proof_center.prova_questoes
          set
            numero_na_prova = $2,
            ordem = $3,
            peso = $4,
            obrigatoria = $5,
            versao_enunciado = $6,
            updated_at = now()
          where id = $1
        `,
        [
          itemId,
          payload.numeroNaProva,
          payload.ordem,
          payload.peso,
          payload.obrigatoria,
          payload.versaoEnunciado,
        ]
      );

      return proofId ? this.getProofById(proofId, client) : null;
    });
  }

  async deleteProofItem(itemId) {
    return this.db.withTransaction(async (client) => {
      const current = await client.query(
        `
          delete from proof_center.prova_questoes
          where id = $1
          returning prova_id
        `,
        [itemId]
      );

      const proofId = current.rows[0]?.prova_id || null;
      return proofId ? this.getProofById(proofId, client) : null;
    });
  }

  async listQuestions() {
    const { rows } = await this.db.query(
      `
        select *
        from proof_center.vw_questoes_master_catalogo
        order by updated_at desc, created_at desc
      `
    );

    return rows.map(mapQuestionSummaryRow);
  }

  async getQuestionById(questionId, dbOrClient = this.db) {
    const questionResult = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.vw_questoes_master_catalogo
        where id = $1
        limit 1
      `,
      [questionId]
    );

    const questionRow = questionResult.rows[0] || null;

    if (!questionRow) {
      return null;
    }

    const alternativesResult = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.questao_alternativas
        where questao_id = $1
        order by ordem asc, letra asc
      `,
      [questionId]
    );

    const answerKeysResult = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.questao_gabaritos
        where questao_id = $1
        order by principal desc, created_at asc
      `,
      [questionId]
    );

    return {
      ...mapQuestionSummaryRow(questionRow),
      alternatives: alternativesResult.rows.map(mapAlternativeRow),
      answerKeys: answerKeysResult.rows.map(mapAnswerKeyRow),
    };
  }

  async createQuestion(payload, actor = null) {
    const audit = getActorAudit(actor);

    return this.db.withTransaction(async (client) => {
      const insertResult = await client.query(
        `
          insert into proof_center.questoes_master (
            titulo_interno,
            enunciado,
            tipo_questao,
            area,
            assunto,
            subassunto,
            formula_principal,
            unidade_resposta,
            casas_decimais_esperadas,
            aceita_notacao_cientifica,
            metodo_correcao,
            tolerancia_absoluta,
            tolerancia_percentual,
            peso_padrao,
            dificuldade_interna,
            possui_imagem,
            imagem_url,
            observacoes_admin,
            origem_cadastro,
            status,
            created_by,
            updated_by,
            created_by_legacy_id,
            updated_by_legacy_id
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $21, $22, $22)
          returning id
        `,
        [
          payload.tituloInterno,
          payload.enunciado,
          payload.tipoQuestao,
          payload.area,
          payload.assunto,
          payload.subassunto,
          payload.formulaPrincipal,
          payload.unidadeResposta,
          payload.casasDecimaisEsperadas,
          payload.aceitaNotacaoCientifica,
          payload.metodoCorrecao,
          payload.toleranciaAbsoluta,
          payload.toleranciaPercentual,
          payload.pesoPadrao,
          payload.dificuldadeInterna || null,
          payload.possuiImagem,
          payload.imagemUrl,
          payload.observacoesAdmin,
          payload.origemCadastro,
          payload.status,
          audit.uuidUserId,
          audit.legacyUserId,
        ]
      );

      const questionId = insertResult.rows[0]?.id || null;
      await this.replaceQuestionRelations(client, questionId, payload);
      return this.getQuestionById(questionId, client);
    });
  }

  async updateQuestion(questionId, payload, actor = null) {
    const audit = getActorAudit(actor);

    return this.db.withTransaction(async (client) => {
      const updateResult = await client.query(
        `
          update proof_center.questoes_master
          set
            titulo_interno = $2,
            enunciado = $3,
            tipo_questao = $4,
            area = $5,
            assunto = $6,
            subassunto = $7,
            formula_principal = $8,
            unidade_resposta = $9,
            casas_decimais_esperadas = $10,
            aceita_notacao_cientifica = $11,
            metodo_correcao = $12,
            tolerancia_absoluta = $13,
            tolerancia_percentual = $14,
            peso_padrao = $15,
            dificuldade_interna = $16,
            possui_imagem = $17,
            imagem_url = $18,
            observacoes_admin = $19,
            origem_cadastro = $20,
            status = $21,
            updated_by = $22,
            updated_by_legacy_id = $23,
            updated_at = now()
          where id = $1
        `,
        [
          questionId,
          payload.tituloInterno,
          payload.enunciado,
          payload.tipoQuestao,
          payload.area,
          payload.assunto,
          payload.subassunto,
          payload.formulaPrincipal,
          payload.unidadeResposta,
          payload.casasDecimaisEsperadas,
          payload.aceitaNotacaoCientifica,
          payload.metodoCorrecao,
          payload.toleranciaAbsoluta,
          payload.toleranciaPercentual,
          payload.pesoPadrao,
          payload.dificuldadeInterna || null,
          payload.possuiImagem,
          payload.imagemUrl,
          payload.observacoesAdmin,
          payload.origemCadastro,
          payload.status,
          audit.uuidUserId,
          audit.legacyUserId,
        ]
      );

      if (!updateResult.rowCount) {
        return null;
      }

      await this.replaceQuestionRelations(client, questionId, payload);
      return this.getQuestionById(questionId, client);
    });
  }

  async replaceQuestionRelations(client, questionId, payload) {
    await client.query(`delete from proof_center.questao_alternativas where questao_id = $1`, [questionId]);
    await client.query(`delete from proof_center.questao_gabaritos where questao_id = $1`, [questionId]);

    for (const alternative of Array.isArray(payload.alternatives) ? payload.alternatives : []) {
      if (!toTrimmedString(alternative.texto)) {
        continue;
      }

      await client.query(
        `
          insert into proof_center.questao_alternativas (
            questao_id,
            letra,
            texto,
            ordem,
            is_correta
          )
          values ($1, $2, $3, $4, $5)
        `,
        [
          questionId,
          toTrimmedString(alternative.letra).toUpperCase(),
          toTrimmedString(alternative.texto),
          toNullableInteger(alternative.ordem) || 1,
          toBooleanValue(alternative.isCorreta),
        ]
      );
    }

    const answerKeys = Array.isArray(payload.answerKeys) ? payload.answerKeys : [];
    const normalizedKeys = answerKeys.length
      ? answerKeys
      : payload.tipoQuestao === "objetiva" && toTrimmedString(payload.alternativaCorreta)
        ? [{ tipoGabarito: "alternativa", respostaBruta: payload.alternativaCorreta, principal: true }]
        : [];

    for (let index = 0; index < normalizedKeys.length; index += 1) {
      const answerKey = normalizedKeys[index];
      const tipoGabarito = toTrimmedString(answerKey.tipoGabarito || "texto") || "texto";
      const respostaBruta = toTrimmedString(answerKey.respostaBruta);
      const respostaNormalizada = toTrimmedString(answerKey.respostaNormalizada);
      const expressaoCanonica = toTrimmedString(answerKey.expressaoCanonica);
      const valorNumerico = toNullableNumber(answerKey.valorNumerico);
      const hasSomeContent =
        Boolean(respostaBruta) ||
        Boolean(respostaNormalizada) ||
        Boolean(expressaoCanonica) ||
        valorNumerico !== null;

      if (!hasSomeContent && tipoGabarito !== "alternativa") {
        continue;
      }

      await client.query(
        `
          insert into proof_center.questao_gabaritos (
            questao_id,
            tipo_gabarito,
            resposta_bruta,
            resposta_normalizada,
            valor_numerico,
            expressao_canonica,
            tolerancia_absoluta,
            tolerancia_percentual,
            unidade,
            principal,
            observacao
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `,
        [
          questionId,
          tipoGabarito,
          respostaBruta || null,
          respostaNormalizada || null,
          valorNumerico,
          expressaoCanonica || null,
          toNullableNumber(answerKey.toleranciaAbsoluta ?? payload.toleranciaAbsoluta),
          toNullableNumber(answerKey.toleranciaPercentual ?? payload.toleranciaPercentual),
          toNullableString(answerKey.unidade ?? payload.unidadeResposta),
          toBooleanValue(answerKey.principal, index === 0),
          toNullableString(answerKey.observacao),
        ]
      );
    }
  }

  async listAnswerKeys({ proofId = null } = {}, dbOrClient = this.db) {
    const { rows } = await runQuery(
      dbOrClient,
      `
        select
          g.*,
          p.titulo as proof_title,
          p.proof_code,
          count(gi.id) as total_items
        from proof_center.gabaritos g
        join proof_center.provas p on p.id = g.proof_id
        left join proof_center.gabarito_itens gi on gi.answer_key_id = g.id
        where ($1::uuid is null or g.proof_id = $1::uuid)
        group by g.id, p.titulo, p.proof_code
        order by
          case g.status when 'active' then 0 when 'draft' then 1 else 2 end,
          g.updated_at desc
      `,
      [proofId || null]
    );

    return rows.map((row) => ({
      ...mapAnswerKeyRecordRow(row),
      proofTitle: row.proof_title || "",
      proofCode: row.proof_code || "",
      totalItems: Number(row.total_items || 0),
    }));
  }

  async getAnswerKeyById(answerKeyId, dbOrClient = this.db) {
    const { rows } = await runQuery(
      dbOrClient,
      `
        select g.*, p.titulo as proof_title, p.proof_code
        from proof_center.gabaritos g
        join proof_center.provas p on p.id = g.proof_id
        where g.id = $1
        limit 1
      `,
      [answerKeyId]
    );

    const answerKeyRow = rows[0] || null;

    if (!answerKeyRow) {
      return null;
    }

    const itemsResult = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.gabarito_itens
        where answer_key_id = $1
        order by question_number asc
      `,
      [answerKeyId]
    );

    return {
      ...mapAnswerKeyRecordRow(answerKeyRow),
      proofTitle: answerKeyRow.proof_title || "",
      proofCode: answerKeyRow.proof_code || "",
      items: itemsResult.rows.map(mapAnswerKeyItemRecordRow),
    };
  }

  async syncAnswerKeyToProofQuestions(client, proofId, answerKeyId) {
    const itemsResult = await client.query(
      `
        select
          pq.id as proof_item_id,
          pq.questao_id,
          pq.numero_na_prova,
          gi.*
        from proof_center.prova_questoes pq
        join proof_center.gabarito_itens gi
          on gi.answer_key_id = $2
         and gi.question_number = pq.numero_na_prova
        where pq.prova_id = $1
      `,
      [proofId, answerKeyId]
    );

    for (const row of itemsResult.rows) {
      const questionId = row.questao_id;
      const questionType = row.question_type;
      const correctionMethod = mapAnswerKeyItemTypeToCorrectionMethod(questionType);
      const questionModel = mapAnswerKeyItemTypeToQuestionType(questionType);
      const validationRule = parseJsonValue(row.validation_rule, {});

      await client.query(
        `
          update proof_center.questoes_master
          set
            tipo_questao = $2,
            metodo_correcao = $3,
            tolerancia_absoluta = $4,
            peso_padrao = $5
          where id = $1
        `,
        [questionId, questionModel, correctionMethod, row.numeric_tolerance, row.weight]
      );

      await client.query(`delete from proof_center.questao_gabaritos where questao_id = $1`, [questionId]);
      await client.query(`update proof_center.questao_alternativas set is_correta = false where questao_id = $1`, [questionId]);
      await client.query(`update proof_center.prova_questoes set peso = $2 where id = $1`, [row.proof_item_id, row.weight]);

      if (questionType === "multipla_escolha") {
        const expected = toTrimmedString(row.expected_answer).toUpperCase();
        await client.query(
          `update proof_center.questao_alternativas set is_correta = true where questao_id = $1 and upper(letra) = $2`,
          [questionId, expected]
        );
        await client.query(
          `
            insert into proof_center.questao_gabaritos (
              questao_id,
              tipo_gabarito,
              resposta_bruta,
              resposta_normalizada,
              principal,
              observacao
            )
            values ($1, 'alternativa', $2, $2, true, $3)
          `,
          [questionId, expected, row.notes || null]
        );
        continue;
      }

      if (["numerica_exata", "numerica_com_tolerancia"].includes(questionType)) {
        const expectedNumber = toNullableNumber(row.expected_answer);
        await client.query(
          `
            insert into proof_center.questao_gabaritos (
              questao_id,
              tipo_gabarito,
              resposta_bruta,
              resposta_normalizada,
              valor_numerico,
              tolerancia_absoluta,
              unidade,
              principal,
              observacao
            )
            values ($1, 'numero', $2, $2, $3, $4, $5, true, $6)
          `,
          [questionId, row.expected_answer, expectedNumber, row.numeric_tolerance, validationRule?.unit || null, row.notes || null]
        );
        continue;
      }

      const answerType = questionType === "hibrida" ? "expressao" : "texto";
      await client.query(
        `
          insert into proof_center.questao_gabaritos (
            questao_id,
            tipo_gabarito,
            resposta_bruta,
            resposta_normalizada,
            principal,
            observacao
          )
          values ($1, $2, $3, $4, true, $5)
        `,
        [questionId, answerType, row.expected_answer, row.expected_answer, row.notes || null]
      );
    }
  }

  async upsertAnswerKey(payload, actor = null) {
    const audit = getActorAudit(actor);

    return this.db.withTransaction(async (client) => {
      const proofPayload = payload.proof || {};
      const answerKeyPayload = payload.answerKey || {};
      const proofCode = toTrimmedString(proofPayload.proofCode) || buildProofCode(proofPayload) || null;

      let proofId = proofPayload.id || null;

      if (!proofId && proofCode) {
        const existing = await client.query(`select id from proof_center.provas where proof_code = $1 limit 1`, [proofCode]);
        proofId = existing.rows[0]?.id || null;
      }

      if (proofId) {
        await client.query(
          `
            update proof_center.provas
            set
              titulo = $2,
              descricao = $3,
              disciplina = $4,
              area = $5,
              nivel = $6,
              ano = $7,
              tipo_prova = $8,
              status = $9,
              origem = $10,
              tempo_limite_min = $11,
              observacoes = $12,
              proof_code = $13,
              exam_provider = $14,
              exam_name = $15,
              exam_year = $16,
              exam_edition = $17,
              exam_day = $18,
              application_date = $19,
              subject_group = $20,
              booklet_color = $21,
              exam_version = $22,
              exam_language = $23,
              expected_question_count = $24,
              parser_profile = $25,
              alias_keywords = $26::jsonb,
              identification_notes = $27,
              updated_by = $28,
              updated_by_legacy_id = $29,
              updated_at = now()
            where id = $1
          `,
          [
            proofId,
            proofPayload.titulo,
            proofPayload.descricao,
            proofPayload.disciplina,
            proofPayload.area,
            proofPayload.nivel,
            proofPayload.ano,
            proofPayload.tipoProva,
            proofPayload.status,
            proofPayload.origem,
            proofPayload.tempoLimiteMin,
            proofPayload.observacoes,
            proofCode,
            proofPayload.examProvider,
            proofPayload.examName,
            proofPayload.examYear,
            proofPayload.examEdition,
            proofPayload.examDay,
            proofPayload.applicationDate,
            proofPayload.subjectGroup,
            proofPayload.bookletColor,
            proofPayload.examVersion,
            proofPayload.examLanguage,
            proofPayload.expectedQuestionCount,
            proofPayload.parserProfile,
            JSON.stringify(proofPayload.aliasKeywords || []),
            proofPayload.identificationNotes,
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );
      } else {
        proofId = randomUUID();
        await client.query(
          `
            insert into proof_center.provas (
              id,
              titulo,
              descricao,
              disciplina,
              area,
              nivel,
              ano,
              tipo_prova,
              status,
              origem,
              tempo_limite_min,
              observacoes,
              proof_code,
              exam_provider,
              exam_name,
              exam_year,
              exam_edition,
              exam_day,
              application_date,
              subject_group,
              booklet_color,
              exam_version,
              exam_language,
              expected_question_count,
              parser_profile,
              alias_keywords,
              identification_notes,
              created_by,
              updated_by,
              created_by_legacy_id,
              updated_by_legacy_id
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26::jsonb, $27, $28, $28, $29, $29)
          `,
          [
            proofId,
            proofPayload.titulo,
            proofPayload.descricao,
            proofPayload.disciplina,
            proofPayload.area,
            proofPayload.nivel,
            proofPayload.ano,
            proofPayload.tipoProva,
            proofPayload.status,
            proofPayload.origem,
            proofPayload.tempoLimiteMin,
            proofPayload.observacoes,
            proofCode,
            proofPayload.examProvider,
            proofPayload.examName,
            proofPayload.examYear,
            proofPayload.examEdition,
            proofPayload.examDay,
            proofPayload.applicationDate,
            proofPayload.subjectGroup,
            proofPayload.bookletColor,
            proofPayload.examVersion,
            proofPayload.examLanguage,
            proofPayload.expectedQuestionCount,
            proofPayload.parserProfile,
            JSON.stringify(proofPayload.aliasKeywords || []),
            proofPayload.identificationNotes,
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );
      }

      let answerKeyId = answerKeyPayload.id || null;

      if (answerKeyId) {
        await client.query(
          `
            update proof_center.gabaritos
            set
              answer_key_type = $2,
              source = $3,
              status = $4,
              confidence = $5,
              notes = $6,
              updated_by = $7,
              updated_by_legacy_id = $8,
              updated_at = now()
            where id = $1
          `,
          [
            answerKeyId,
            answerKeyPayload.answerKeyType,
            answerKeyPayload.source,
            answerKeyPayload.status,
            answerKeyPayload.confidence,
            answerKeyPayload.notes,
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );
      } else {
        const insertAnswerKey = await client.query(
          `
            insert into proof_center.gabaritos (
              proof_id,
              answer_key_type,
              source,
              status,
              confidence,
              notes,
              created_by,
              updated_by,
              created_by_legacy_id,
              updated_by_legacy_id
            )
            values ($1, $2, $3, $4, $5, $6, $7, $7, $8, $8)
            returning id
          `,
          [
            proofId,
            answerKeyPayload.answerKeyType,
            answerKeyPayload.source,
            answerKeyPayload.status,
            answerKeyPayload.confidence,
            answerKeyPayload.notes,
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );
        answerKeyId = insertAnswerKey.rows[0]?.id || null;
      }

      await client.query(`delete from proof_center.gabarito_itens where answer_key_id = $1`, [answerKeyId]);

      for (const item of Array.isArray(answerKeyPayload.items) ? answerKeyPayload.items : []) {
        await client.query(
          `
            insert into proof_center.gabarito_itens (
              answer_key_id,
              question_number,
              question_type,
              expected_answer,
              validation_rule,
              numeric_tolerance,
              weight,
              metadata,
              notes
            )
            values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9)
          `,
          [
            answerKeyId,
            item.questionNumber,
            item.questionType,
            item.expectedAnswer,
            JSON.stringify(item.validationRule || {}),
            item.numericTolerance,
            item.weight,
            JSON.stringify(item.metadata || {}),
            item.notes || null,
          ]
        );
      }

      await this.syncAnswerKeyToProofQuestions(client, proofId, answerKeyId);

      return {
        proof: await this.getProofById(proofId, client),
        answerKey: await this.getAnswerKeyById(answerKeyId, client),
      };
    });
  }

  async listImports({ proofId = null } = {}, dbOrClient = this.db) {
    const { rows } = await runQuery(
      dbOrClient,
      `
        select
          ia.*,
          p.titulo as prova_titulo,
          p.proof_code as prova_code,
          rp.titulo as recognized_proof_titulo,
          rp.proof_code as recognized_proof_code,
          g.answer_key_type as recognized_answer_key_type,
          pa.nome_original as arquivo_nome,
          pa.tipo_arquivo,
          pa.url as arquivo_url,
          (
            select count(*)
            from proof_center.import_questoes_detectadas iq
            where iq.importacao_id = ia.id
          ) as detected_question_rows
        from proof_center.importacoes_assistidas ia
        left join proof_center.provas p on p.id = ia.prova_id
        left join proof_center.provas rp on rp.id = ia.recognized_proof_id
        left join proof_center.gabaritos g on g.id = ia.recognized_answer_key_id
        left join proof_center.prova_arquivos pa on pa.id = ia.arquivo_id
        where ($1::uuid is null or ia.prova_id = $1::uuid or ia.recognized_proof_id = $1::uuid)
        order by ia.updated_at desc nulls last, ia.created_at desc
      `,
      [proofId || null]
    );

    return rows.map((row) => ({
      id: row.id,
      provaId: row.prova_id,
      provaTitulo: row.prova_titulo || "",
      provaCode: row.prova_code || "",
      arquivoId: row.arquivo_id,
      arquivoNome: row.arquivo_nome || "",
      arquivoUrl: row.arquivo_url || (row.arquivo_id ? `/api/admin/proof-center/files/${row.arquivo_id}` : ""),
      tipoArquivo: row.tipo_arquivo || "",
      status: row.status || "pendente",
      processingStatus: row.processamento_status || "uploaded",
      matchingLevel: row.matching_level || "",
      matchingConfidence: toNullableNumber(row.matching_confidence),
      recognizedProofId: row.recognized_proof_id || null,
      recognizedProofTitle: row.recognized_proof_titulo || "",
      recognizedProofCode: row.recognized_proof_code || "",
      recognizedAnswerKeyId: row.recognized_answer_key_id || null,
      recognizedAnswerKeyType: row.recognized_answer_key_type || "",
      reviewRequired: Boolean(row.review_required),
      ocrRequired: Boolean(row.ocr_required),
      errorMessage: row.error_message || "",
      detectedMetadata: parseJsonValue(row.detected_metadata, {}),
      processingSummary: parseJsonValue(row.processing_summary, {}),
      textoExtraido: row.texto_extraido || "",
      confiancaMedia: toNullableNumber(row.confianca_media),
      totalQuestoesDetectadas: toNullableInteger(row.total_questoes_detectadas),
      parsedQuestionCount: toNullableInteger(row.parsed_question_count) ?? Number(row.detected_question_rows || 0),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      finishedAt: row.finished_at || null,
    }));
  }

  async getImportById(importId, dbOrClient = this.db) {
    const importRows = await this.listImports({}, dbOrClient);
    const current = importRows.find((item) => item.id === importId) || null;

    if (!current) {
      return null;
    }

    const [parsedQuestionsResult, logsResult, matchMetaResult] = await Promise.all([
      runQuery(
        dbOrClient,
        `
          select *
          from proof_center.import_questoes_detectadas
          where importacao_id = $1
          order by question_number asc
        `,
        [importId]
      ),
      runQuery(
        dbOrClient,
        `
          select *
          from proof_center.import_process_logs
          where importacao_id = $1
          order by created_at desc
        `,
        [importId]
      ),
      runQuery(
        dbOrClient,
        `select detected_metadata from proof_center.importacoes_assistidas where id = $1 limit 1`,
        [importId]
      ),
    ]);

    return {
      ...current,
      parsedQuestions: parsedQuestionsResult.rows.map(mapParsedQuestionRow),
      logs: logsResult.rows.map((row) => ({
        id: row.id,
        status: row.status || "",
        message: row.message || "",
        metadata: parseJsonValue(row.metadata, {}),
        createdAt: row.created_at || null,
      })),
      matchCandidates: parseJsonValue(matchMetaResult.rows[0]?.detected_metadata, {}).matchCandidates || [],
    };
  }

  async createImport(payload, actor = null) {
    const audit = getActorAudit(actor);
    const importId = randomUUID();

    let preparedFiles = [];

    try {
      return await this.db.withTransaction(async (client) => {
        let arquivoId = payload.arquivoId || null;
        const proofIdForStorage = payload.provaId || randomUUID();

        if (!arquivoId && payload.file) {
          preparedFiles = await this.prepareStoredFiles({
            proofId: proofIdForStorage,
            actor: audit,
            importId,
            files: [buildIncomingFilePayload(payload.file, payload.fileType || "pdf_original")].filter(Boolean),
          });
          const fileRow = preparedFiles[0] || null;

          if (fileRow) {
            const fileInsert = await client.query(
              `
                insert into proof_center.prova_arquivos (
                  prova_id,
                  tipo_arquivo,
                  nome_original,
                  storage_path,
                  url,
                  mime_type,
                  tamanho_bytes,
                  metadados,
                  created_by,
                  created_by_legacy_id
                )
                values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)
                returning id
              `,
              [
                payload.provaId,
                fileRow.tipoArquivo,
                fileRow.nomeOriginal,
                fileRow.storagePath,
                fileRow.url,
                fileRow.mimeType,
                fileRow.tamanhoBytes,
                JSON.stringify(fileRow.metadados || {}),
                audit.uuidUserId,
                audit.legacyUserId,
              ]
            );

            arquivoId = fileInsert.rows[0]?.id || null;
            if (arquivoId) {
              await client.query(`update proof_center.prova_arquivos set url = $2 where id = $1`, [
                arquivoId,
                `/api/admin/proof-center/files/${arquivoId}`,
              ]);
            }
          }
        }

        await client.query(
        `
          insert into proof_center.importacoes_assistidas (
            id,
            arquivo_id,
            prova_id,
            status,
            processamento_status,
            texto_extraido,
            confianca_media,
            total_questoes_detectadas,
            log_parser,
            created_by,
            created_by_legacy_id
          )
          values ($1, $2, $3, $4, 'uploaded', $5, $6, $7, $8::jsonb, $9, $10)
        `,
        [
          importId,
          arquivoId,
          payload.provaId,
          payload.status,
          payload.textoExtraido,
          payload.confiancaMedia,
          payload.totalQuestoesDetectadas,
          JSON.stringify(payload.logParser || {}),
          audit.uuidUserId,
          audit.legacyUserId,
        ]
      );

        await this.appendImportLog(client, importId, "uploaded", "Arquivo recebido na fila de importacao.", {
          fileType: payload.fileType || "pdf_original",
        });

        return this.getImportById(importId, client);
      });
    } catch (error) {
      await this.cleanupStoredFiles(preparedFiles);
      throw error;
    }
  }

  async analyzeImport(importId) {
    if (!this.pdfAnalysisService) {
      throw createHttpError(503, "O analisador de PDF ainda nao foi configurado no backend Proof Center.");
    }

    const importDetail = await this.getImportById(importId);

    if (!importDetail) {
      return null;
    }

    const fileRecord = importDetail.arquivoId ? await this.getFileById(importDetail.arquivoId) : null;
    let extraction = {
      text: importDetail.textoExtraido || "",
      pageCount: null,
      extractedCharacterCount: (importDetail.textoExtraido || "").length,
      ocrRequired: false,
      detected: {},
    };

    if (!extraction.text && fileRecord) {
      if (!this.storageService) {
        throw createHttpError(503, "O Storage precisa estar configurado para analisar PDFs enviados.");
      }

      const download = await this.storageService.downloadStoredFile(fileRecord);
      extraction = await this.pdfAnalysisService.extractPdfMetadata(download.buffer);
    }

    const proofs = await this.listProofs();
    const match = this.pdfAnalysisService.buildMatchCandidates(extraction.text, proofs);
    const expectedQuestionCount =
      match.topMatch?.proofId
        ? proofs.find((proof) => proof.id === match.topMatch.proofId)?.expectedQuestionCount || null
        : importDetail.totalQuestoesDetectadas || null;
    const parsed = this.pdfAnalysisService.parseQuestions(extraction.text, expectedQuestionCount);
    const matchedProofId = match.level === "manual" ? null : match.topMatch?.proofId || null;
    const matchedAnswerKeyId = match.level === "manual" ? null : match.topMatch?.answerKeyId || null;
    const processingStatusMap = {
      automatic: "matched_automatic",
      suggested: "matched_suggested",
      manual: extraction.ocrRequired ? "ocr_required" : "manual_review_required",
    };

    return this.db.withTransaction(async (client) => {
      await client.query(
        `
          update proof_center.importacoes_assistidas
          set
            texto_extraido = $2,
            processamento_status = $3,
            matching_level = $4,
            matching_confidence = $5,
            recognized_proof_id = $6,
            recognized_answer_key_id = $7,
            detected_metadata = $8::jsonb,
            processing_summary = $9::jsonb,
            review_required = $10,
            ocr_required = $11,
            parsed_question_count = $12,
            total_questoes_detectadas = $13,
            error_message = null,
            finished_at = now(),
            updated_at = now()
          where id = $1
        `,
        [
          importId,
          extraction.text,
          parsed.questions.length ? "parsed_questions" : processingStatusMap[match.level],
          match.level,
          match.topMatch?.score || null,
          matchedProofId,
          matchedAnswerKeyId,
          JSON.stringify({
            extracted: extraction.detected,
            matchCandidates: match.candidates,
          }),
          JSON.stringify({
            pageCount: extraction.pageCount,
            extractedCharacterCount: extraction.extractedCharacterCount,
            inconsistencies: parsed.inconsistencies,
          }),
          match.level === "manual" || parsed.inconsistencies.length > 0,
          extraction.ocrRequired,
          parsed.questions.length,
          parsed.detectedQuestionCount,
        ]
      );

      await client.query(`delete from proof_center.import_questoes_detectadas where importacao_id = $1`, [importId]);

      for (const question of parsed.questions) {
        await client.query(
          `
            insert into proof_center.import_questoes_detectadas (
              importacao_id,
              question_number,
              raw_block,
              stem,
              alternatives,
              parsing_confidence,
              metadata
            )
            values ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb)
          `,
          [
            importId,
            question.questionNumber,
            question.rawBlock,
            question.stem,
            JSON.stringify(question.alternatives || []),
            question.parsingConfidence,
            JSON.stringify(question.metadata || {}),
          ]
        );
      }

      await this.appendImportLog(client, importId, "extracting_text", "Texto do PDF analisado.", {
        extractedCharacterCount: extraction.extractedCharacterCount,
        ocrRequired: extraction.ocrRequired,
      });
      await this.appendImportLog(client, importId, processingStatusMap[match.level], "Reconhecimento da prova concluido.", {
        level: match.level,
        topMatch: match.topMatch,
      });
      if (parsed.questions.length) {
        await this.appendImportLog(client, importId, "parsed_questions", "Questoes segmentadas para revisao.", {
          parsedQuestionCount: parsed.questions.length,
          inconsistencies: parsed.inconsistencies,
        });
      }

      return this.getImportById(importId, client);
    });
  }

  async confirmImportMatch(importId, { proofId, answerKeyId = null } = {}) {
    return this.db.withTransaction(async (client) => {
      await client.query(
        `
          update proof_center.importacoes_assistidas
          set
            recognized_proof_id = $2,
            recognized_answer_key_id = $3,
            matching_level = 'manual',
            review_required = false,
            processamento_status = case when parsed_question_count > 0 then 'parsed_questions' else 'matched_suggested' end,
            updated_at = now()
          where id = $1
        `,
        [importId, proofId, answerKeyId]
      );

      await this.appendImportLog(client, importId, "matched_suggested", "Vinculo da prova confirmado manualmente.", {
        proofId,
        answerKeyId,
      });

      return this.getImportById(importId, client);
    });
  }

  async importParsedQuestions(importId, actor = null) {
    const audit = getActorAudit(actor);

    return this.db.withTransaction(async (client) => {
      const importDetail = await this.getImportById(importId, client);

      if (!importDetail) {
        return null;
      }

      const proofId = importDetail.recognizedProofId || importDetail.provaId;

      if (!proofId) {
        throw createHttpError(400, "Confirme a identificacao da prova antes de importar as questoes.");
      }

      const proofDetail = await this.getProofById(proofId, client);
      const parsedQuestions = importDetail.parsedQuestions || [];
      let importedCount = 0;

      for (const parsedQuestion of parsedQuestions) {
        const existingItem = (proofDetail?.items || []).find(
          (item) => Number(item.numeroNaProva) === Number(parsedQuestion.questionNumber)
        );

        if (existingItem) {
          await client.query(
            `
              update proof_center.import_questoes_detectadas
              set
                linked_question_id = $2,
                linked_proof_item_id = $3,
                review_status = 'imported',
                updated_at = now()
              where id = $1
            `,
            [parsedQuestion.id, existingItem.questaoId, existingItem.id]
          );
          continue;
        }

        const newQuestionId = randomUUID();
        const newProofItemId = randomUUID();
        const hasAlternatives = Array.isArray(parsedQuestion.alternatives) && parsedQuestion.alternatives.length >= 2;

        await client.query(
          `
            insert into proof_center.questoes_master (
              id,
              titulo_interno,
              enunciado,
              tipo_questao,
              area,
              assunto,
              subassunto,
              metodo_correcao,
              origem_cadastro,
              status,
              created_by,
              updated_by,
              created_by_legacy_id,
              updated_by_legacy_id
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8, 'pdf_assistido', 'draft', $9, $9, $10, $10)
          `,
          [
            newQuestionId,
            `${proofDetail?.proof?.proofCode || proofDetail?.proof?.titulo || "PROVA"} Q${parsedQuestion.questionNumber}`,
            parsedQuestion.stem || parsedQuestion.rawBlock,
            hasAlternatives ? "objetiva" : "expressao_simples",
            proofDetail?.proof?.area || "exatas",
            proofDetail?.proof?.subjectGroup || "",
            proofDetail?.proof?.examName || "",
            hasAlternatives ? "automatica" : "semiassistida",
            audit.uuidUserId,
            audit.legacyUserId,
          ]
        );

        for (let index = 0; index < (parsedQuestion.alternatives || []).length; index += 1) {
          const alternative = parsedQuestion.alternatives[index];
          await client.query(
            `
              insert into proof_center.questao_alternativas (
                questao_id,
                letra,
                texto,
                ordem,
                is_correta
              )
              values ($1, $2, $3, $4, false)
            `,
            [newQuestionId, alternative.letra, alternative.texto, index + 1]
          );
        }

        await client.query(
          `
            insert into proof_center.prova_questoes (
              id,
              prova_id,
              questao_id,
              numero_na_prova,
              ordem,
              peso,
              obrigatoria,
              versao_enunciado
            )
            values ($1, $2, $3, $4, $5, 1, true, $6)
          `,
          [
            newProofItemId,
            proofId,
            newQuestionId,
            parsedQuestion.questionNumber,
            parsedQuestion.questionNumber,
            parsedQuestion.stem || parsedQuestion.rawBlock,
          ]
        );

        await client.query(
          `
            update proof_center.import_questoes_detectadas
            set
              linked_question_id = $2,
              linked_proof_item_id = $3,
              review_status = 'imported',
              updated_at = now()
            where id = $1
          `,
          [parsedQuestion.id, newQuestionId, newProofItemId]
        );

        importedCount += 1;
      }

      if (importDetail.recognizedAnswerKeyId) {
        await this.syncAnswerKeyToProofQuestions(client, proofId, importDetail.recognizedAnswerKeyId);
      }

      await client.query(
        `
          update proof_center.importacoes_assistidas
          set
            processamento_status = case when recognized_answer_key_id is not null then 'ready_for_correction' else 'questions_imported' end,
            review_required = false,
            updated_at = now()
          where id = $1
        `,
        [importId]
      );

      await this.appendImportLog(client, importId, "questions_imported", "Questoes importadas para a prova.", {
        importedCount,
        proofId,
      });

      return this.getImportById(importId, client);
    });
  }

  async listCorrectionQueue() {
    const { rows } = await this.db.query(
      `
        select *
        from proof_center.vw_fila_correcao
        order by updated_at desc, created_at desc
      `
    );

    return rows.map((row) => ({
      id: row.resposta_id,
      provaId: row.prova_id,
      statusCorrecao: row.status_correcao || "pendente",
      confiancaCorrecao: toNullableNumber(row.confianca_correcao),
      notaAtribuida: toNullableNumber(row.nota_atribuida),
      correta: row.correta === null ? null : Boolean(row.correta),
      motivoPendencia: row.motivo_pendencia || "",
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
      prova: {
        id: row.prova_id,
        titulo: row.prova_titulo || "",
        disciplina: row.disciplina || "",
      },
      aluno: {
        id: row.aluno_id,
        nome: row.aluno_nome || "",
        email: row.aluno_email || "",
      },
      questao: {
        id: row.questao_id || "",
        numeroNaProva: Number(row.numero_na_prova || 0),
        tituloInterno: row.titulo_interno || "",
        enunciado: row.enunciado || "",
        tipoQuestao: row.tipo_questao || "objetiva",
        metodoCorrecao: row.metodo_correcao || "manual",
        assunto: row.assunto || "",
        subassunto: row.subassunto || "",
      },
    }));
  }

  async getCorrectionResponseById(responseId, dbOrClient = this.db) {
    const { rows } = await runQuery(
      dbOrClient,
      `
        select *
        from proof_center.vw_fila_correcao
        where resposta_id = $1
        limit 1
      `,
      [responseId]
    );

    const row = rows[0] || null;

    if (!row) {
      return null;
    }

    const answerKeys = await runQuery(
      dbOrClient,
      `
        select qg.*
        from proof_center.respostas_aluno ra
        join proof_center.questao_gabaritos qg on qg.questao_id = ra.questao_id
        where ra.id = $1
        order by qg.principal desc, qg.created_at asc
      `,
      [responseId]
    );

    return {
      id: row.resposta_id,
      statusCorrecao: row.status_correcao || "pendente",
      confiancaCorrecao: toNullableNumber(row.confianca_correcao),
      notaAtribuida: toNullableNumber(row.nota_atribuida),
      correta: row.correta === null ? null : Boolean(row.correta),
      motivoPendencia: row.motivo_pendencia || "",
      feedback: row.feedback || "",
      prova: {
        id: row.prova_id,
        titulo: row.prova_titulo || "",
        disciplina: row.disciplina || "",
      },
      aluno: {
        id: row.aluno_id,
        nome: row.aluno_nome || "",
        email: row.aluno_email || "",
      },
      questao: {
        id: row.questao_id || "",
        numeroNaProva: Number(row.numero_na_prova || 0),
        tituloInterno: row.titulo_interno || "",
        enunciado: row.enunciado || "",
        tipoQuestao: row.tipo_questao || "objetiva",
        metodoCorrecao: row.metodo_correcao || "manual",
        assunto: row.assunto || "",
        subassunto: row.subassunto || "",
      },
      resposta: {
        bruta: row.resposta_bruta || "",
        normalizada: row.resposta_normalizada || "",
        alternativaMarcada: row.alternativa_marcada || "",
        valorNumerico: toNullableNumber(row.valor_numerico),
        expressaoBruta: row.expressao_bruta || "",
      },
      answerKeys: answerKeys.rows.map(mapAnswerKeyRow),
      createdAt: row.created_at || null,
      updatedAt: row.updated_at || null,
    };
  }

  async updateCorrectionResponse(responseId, payload, actor = null) {
    const audit = getActorAudit(actor);

    return this.db.withTransaction(async (client) => {
      const current = await this.getCorrectionResponseById(responseId, client);

      if (!current) {
        return null;
      }

      await client.query(
        `
          update proof_center.respostas_aluno
          set
            nota_atribuida = $2,
            correta = $3,
            status_correcao = 'concluida',
            motivo_pendencia = $4,
            feedback = $5,
            corrigido_por = $6,
            corrigido_por_legacy_id = $7,
            corrigido_em = now(),
            updated_at = now()
          where id = $1
        `,
        [
          responseId,
          payload.notaAtribuida,
          payload.correta,
          payload.motivo,
          payload.feedback,
          audit.uuidUserId,
          audit.legacyUserId,
        ]
      );

      await client.query(
        `
          insert into proof_center.revisoes_correcao (
            resposta_aluno_id,
            admin_id,
            admin_legacy_id,
            decisao,
            nota_anterior,
            nota_nova,
            motivo,
            comentario
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          responseId,
          audit.uuidUserId,
          audit.legacyUserId,
          payload.decisao,
          current.notaAtribuida,
          payload.notaAtribuida,
          payload.motivo,
          payload.feedback,
        ]
      );

      await client.query(
        `
          insert into proof_center.correcoes_log (
            resposta_aluno_id,
            acao,
            valor_anterior_json,
            valor_novo_json,
            observacao,
            admin_id,
            admin_legacy_id
          )
          values ($1, 'revisao_manual', $2::jsonb, $3::jsonb, $4, $5, $6)
        `,
        [
          responseId,
          JSON.stringify(current),
          JSON.stringify(payload),
          payload.motivo,
          audit.uuidUserId,
          audit.legacyUserId,
        ]
      );

      await client.query(
        `
          select proof_center.recalculate_tentativa_totals(tentativa_id)
          from proof_center.respostas_aluno
          where id = $1
        `,
        [responseId]
      );

      return this.getCorrectionResponseById(responseId, client);
    });
  }

  async reprocessCorrections({ proofId = null, force = false } = {}) {
    const { rows } = await this.db.query(
      `
        select ra.id
        from proof_center.respostas_aluno ra
        join proof_center.tentativas_prova tp on tp.id = ra.tentativa_id
        where ($1::uuid is null or tp.prova_id = $1::uuid)
          and (
            $2::boolean = true
            or ra.status_correcao in ('pendente', 'baixa_confianca', 'revisao_manual')
          )
        order by ra.updated_at desc, ra.created_at desc
      `,
      [proofId || null, force]
    );

    for (const row of rows) {
      await this.db.query(`select proof_center.executar_correcao_base($1::uuid)`, [row.id]);
    }

    return { processed: rows.length };
  }

  async getResults() {
    const byProofResult = await this.db.query(
      `
        select
          prova_id,
          prova_titulo,
          disciplina,
          count(*) as total_tentativas,
          coalesce(sum(coalesce(nota_final, nota_parcial, soma_notas)), 0) as nota_total,
          coalesce(sum(total_acertos), 0) as total_acertos,
          coalesce(sum(total_erros), 0) as total_erros
        from proof_center.vw_resultados_tentativa
        group by prova_id, prova_titulo, disciplina
        order by max(updated_at) desc
      `
    );

    const bySubjectResult = await this.db.query(
      `
        select
          qm.assunto,
          count(ra.id) as total_respostas,
          count(*) filter (where ra.correta is true) as total_acertos,
          count(*) filter (where ra.correta is false) as total_erros
        from proof_center.respostas_aluno ra
        join proof_center.questoes_master qm on qm.id = ra.questao_id
        group by qm.assunto
        order by count(ra.id) desc, qm.assunto asc
      `
    );

    const historyResult = await this.db.query(
      `
        select *
        from proof_center.vw_resultados_tentativa
        order by updated_at desc, created_at desc
      `
    );

    return {
      byProof: byProofResult.rows.map((row) => ({
        provaId: row.prova_id,
        provaTitulo: row.prova_titulo || "",
        disciplina: row.disciplina || "",
        totalTentativas: Number(row.total_tentativas || 0),
        notaTotal: toNullableNumber(row.nota_total) ?? 0,
        totalAcertos: Number(row.total_acertos || 0),
        totalErros: Number(row.total_erros || 0),
      })),
      bySubject: bySubjectResult.rows.map((row) => ({
        assunto: row.assunto || "",
        totalRespostas: Number(row.total_respostas || 0),
        totalAcertos: Number(row.total_acertos || 0),
        totalErros: Number(row.total_erros || 0),
      })),
      history: historyResult.rows.map((row) => ({
        tentativaId: row.tentativa_id,
        provaId: row.prova_id,
        provaTitulo: row.prova_titulo || "",
        disciplina: row.disciplina || "",
        alunoId: row.aluno_id,
        alunoNome: row.aluno_nome || "",
        alunoEmail: row.aluno_email || "",
        status: row.status || "em_andamento",
        notaFinal: toNullableNumber(row.nota_final) ?? toNullableNumber(row.nota_parcial) ?? toNullableNumber(row.soma_notas) ?? 0,
        totalAcertos: Number(row.total_acertos || 0),
        totalErros: Number(row.total_erros || 0),
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
      })),
    };
  }
}
