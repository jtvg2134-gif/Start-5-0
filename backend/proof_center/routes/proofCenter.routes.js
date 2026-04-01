export function buildProofCenterRoutes({ proofCenterAdminController }) {
  return [
    {
      method: "GET",
      path: "/proof-center/reference",
      handler: (context) => proofCenterAdminController.getReference(context),
    },
    {
      method: "GET",
      path: "/proof-center/summary",
      handler: (context) => proofCenterAdminController.getSummary(context),
    },
    {
      method: "GET",
      path: "/proof-center/proofs",
      handler: (context) => proofCenterAdminController.listProofs(context),
    },
    {
      method: "POST",
      path: "/proof-center/proofs",
      handler: (context) => proofCenterAdminController.createProof(context),
    },
    {
      method: "GET",
      pattern: /^\/proof-center\/proofs\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.getProof({ ...context, proofId: decodeURIComponent(match[1]) }),
    },
    {
      method: "PATCH",
      pattern: /^\/proof-center\/proofs\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.updateProof({ ...context, proofId: decodeURIComponent(match[1]) }),
    },
    {
      method: "POST",
      pattern: /^\/proof-center\/proofs\/([^/]+)\/items$/,
      handler: (context, match) => proofCenterAdminController.addProofItem({ ...context, proofId: decodeURIComponent(match[1]) }),
    },
    {
      method: "PATCH",
      pattern: /^\/proof-center\/proof-items\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.updateProofItem({ ...context, itemId: decodeURIComponent(match[1]) }),
    },
    {
      method: "DELETE",
      pattern: /^\/proof-center\/proof-items\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.deleteProofItem({ ...context, itemId: decodeURIComponent(match[1]) }),
    },
    {
      method: "GET",
      path: "/proof-center/questions",
      handler: (context) => proofCenterAdminController.listQuestions(context),
    },
    {
      method: "POST",
      path: "/proof-center/questions",
      handler: (context) => proofCenterAdminController.createQuestion(context),
    },
    {
      method: "GET",
      pattern: /^\/proof-center\/questions\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.getQuestion({ ...context, questionId: decodeURIComponent(match[1]) }),
    },
    {
      method: "PATCH",
      pattern: /^\/proof-center\/questions\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.updateQuestion({ ...context, questionId: decodeURIComponent(match[1]) }),
    },
    {
      method: "GET",
      path: "/proof-center/answer-keys",
      handler: (context) => proofCenterAdminController.listAnswerKeys(context),
    },
    {
      method: "POST",
      path: "/proof-center/answer-keys",
      handler: (context) => proofCenterAdminController.createAnswerKey(context),
    },
    {
      method: "GET",
      pattern: /^\/proof-center\/answer-keys\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.getAnswerKey({ ...context, answerKeyId: decodeURIComponent(match[1]) }),
    },
    {
      method: "PATCH",
      pattern: /^\/proof-center\/answer-keys\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.updateAnswerKey({ ...context, answerKeyId: decodeURIComponent(match[1]) }),
    },
    {
      method: "GET",
      path: "/proof-center/imports",
      handler: (context) => proofCenterAdminController.listImports(context),
    },
    {
      method: "POST",
      path: "/proof-center/imports",
      handler: (context) => proofCenterAdminController.createImport(context),
    },
    {
      method: "GET",
      pattern: /^\/proof-center\/imports\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.getImport({ ...context, importId: decodeURIComponent(match[1]) }),
    },
    {
      method: "POST",
      pattern: /^\/proof-center\/imports\/([^/]+)\/analyze$/,
      handler: (context, match) => proofCenterAdminController.analyzeImport({ ...context, importId: decodeURIComponent(match[1]) }),
    },
    {
      method: "PATCH",
      pattern: /^\/proof-center\/imports\/([^/]+)\/match$/,
      handler: (context, match) => proofCenterAdminController.confirmImportMatch({ ...context, importId: decodeURIComponent(match[1]) }),
    },
    {
      method: "POST",
      pattern: /^\/proof-center\/imports\/([^/]+)\/import-questions$/,
      handler: (context, match) => proofCenterAdminController.importParsedQuestions({ ...context, importId: decodeURIComponent(match[1]) }),
    },
    {
      method: "GET",
      pattern: /^\/proof-center\/files\/([^/]+)$/,
      handler: (context, match) => proofCenterAdminController.downloadFile({ ...context, fileId: decodeURIComponent(match[1]) }),
    },
    {
      method: "GET",
      path: "/proof-center/correction/queue",
      handler: (context) => proofCenterAdminController.listCorrectionQueue(context),
    },
    {
      method: "POST",
      path: "/proof-center/correction/reprocess",
      handler: (context) => proofCenterAdminController.reprocessCorrections(context),
    },
    {
      method: "GET",
      pattern: /^\/proof-center\/correction\/responses\/([^/]+)$/,
      handler: (context, match) =>
        proofCenterAdminController.getCorrectionResponse({ ...context, responseId: decodeURIComponent(match[1]) }),
    },
    {
      method: "PATCH",
      pattern: /^\/proof-center\/correction\/responses\/([^/]+)$/,
      handler: (context, match) =>
        proofCenterAdminController.updateCorrectionResponse({ ...context, responseId: decodeURIComponent(match[1]) }),
    },
    {
      method: "GET",
      path: "/proof-center/results",
      handler: (context) => proofCenterAdminController.getResults(context),
    },
  ];
}
