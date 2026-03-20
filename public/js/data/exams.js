const EXAM_ENRICHMENTS = {
  enem: {
    name: "ENEM / SISU",
    description: "Modelo amplo com peso forte de redacao e equilibrio entre areas.",
    popularity: 10,
    regions: ["Nacional"],
    profileHint: "prova-ampla",
  },
  fuvest: {
    description: "Vestibular tradicional, concorrido e com peso forte de leitura e consistencia.",
    popularity: 9,
    regions: ["Sudeste"],
    profileHint: "paulista-tradicional",
  },
  unicamp: {
    description: "Prova forte em interpretacao, conteudo e articulacao de ideias.",
    popularity: 9,
    regions: ["Sudeste"],
    profileHint: "interdisciplinar",
  },
  unesp: {
    description: "Vestibular amplo e conteudista, com equilibrio entre areas e boa redacao.",
    popularity: 8,
    regions: ["Sudeste"],
    profileHint: "conteudista",
  },
  uerj: {
    description: "Historicamente valoriza leitura, redacao e humanas.",
    popularity: 8,
    regions: ["Sudeste"],
    profileHint: "redacao-decisiva",
  },
};

export function buildExams(examTemplates = []) {
  return examTemplates.map((exam) => {
    const enrichment = EXAM_ENRICHMENTS[exam.key] || {};

    return {
      id: exam.key,
      name: enrichment.name || exam.label,
      group: exam.group || "Outros",
      profileHint: enrichment.profileHint || "geral",
      description: enrichment.description || "Vestibular usado como refinamento da distribuicao semanal.",
      subjectAdjustments: { ...(exam.subjectWeights || {}) },
      popularity: enrichment.popularity || (exam.featured ? 8 : 5),
      regions: enrichment.regions || ["Brasil"],
      aliases: [...(exam.searchTerms || [])],
      featured: exam.featured === true,
      scoreScaleType: exam.scoreScaleType || "enem_points",
      percentAdjustment: Number(exam.percentAdjustment || 0),
      label: exam.label,
    };
  });
}
