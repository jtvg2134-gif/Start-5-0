export const COMPETITIVENESS_RULES = [
  { level: "baixa", min: 0, max: 650, margin: 5 },
  { level: "media", min: 651, max: 720, margin: 10 },
  { level: "alta", min: 721, max: 780, margin: 15 },
  { level: "extrema", min: 781, max: Number.POSITIVE_INFINITY, margin: 25 },
];

export const EFFORT_RULES = [
  { level: "ajuste_fino", min: 0, max: 30, recommendedWeeklyHours: 6 },
  { level: "progresso_moderado", min: 31, max: 70, recommendedWeeklyHours: 10 },
  { level: "progresso_intenso", min: 71, max: 120, recommendedWeeklyHours: 15 },
  { level: "meta_agressiva", min: 121, max: Number.POSITIVE_INFINITY, recommendedWeeklyHours: 20 },
];

export const OFFER_MATCH_STAGES = [
  { code: "exact_process_offer", label: "Mesmo curso, processo e ano" },
  { code: "exact_process_relaxed_context", label: "Mesmo curso, processo e ano com relaxamento de contexto" },
  { code: "cross_process_offer", label: "Mesmo curso e ano com relaxamento de processo" },
];

export const CUTOFF_FALLBACK_STAGES = [
  { code: "exact_offer_quota", label: "Mesma oferta + mesma modalidade", confidenceLevel: "high" },
  { code: "exact_offer_any_quota", label: "Mesma oferta + qualquer modalidade", confidenceLevel: "high" },
  { code: "same_course_same_institution", label: "Mesmo curso + mesma instituicao", confidenceLevel: "medium" },
  { code: "same_course_same_city", label: "Mesmo curso + mesma cidade", confidenceLevel: "medium" },
  { code: "same_course_same_state", label: "Mesmo curso + mesmo estado", confidenceLevel: "low" },
  { code: "course_reference_state", label: "Referencia por curso + processo + estado", confidenceLevel: "low" },
  { code: "course_reference_national", label: "Referencia nacional por curso + processo", confidenceLevel: "estimated" },
];

export const AREA_PRIORITY_LABELS = {
  linguagens: "Linguagens",
  humanas: "Humanas",
  natureza: "Natureza",
  matematica: "Matematica",
  redacao: "Redacao",
};

export const FOCUS_MODE_LABELS = {
  subir_nota_geral: "Subir nota geral",
  melhorar_redacao: "Melhorar redacao",
  melhorar_materias_de_maior_peso: "Melhorar materias de maior peso",
  ganhar_constancia: "Ganhar constancia",
  recuperar_base: "Recuperar base",
};

export const WEEKLY_PLAN_PROFILES = [
  {
    code: "leve",
    minHours: 0,
    maxHours: 6,
    weeklyStudySessions: 4,
    weeklyQuestionTarget: 60,
    weeklyEssayTarget: 1,
    weeklyReviewBlocks: 2,
  },
  {
    code: "moderado",
    minHours: 7,
    maxHours: 10,
    weeklyStudySessions: 6,
    weeklyQuestionTarget: 120,
    weeklyEssayTarget: 1,
    weeklyReviewBlocks: 3,
  },
  {
    code: "forte",
    minHours: 11,
    maxHours: 15,
    weeklyStudySessions: 8,
    weeklyQuestionTarget: 180,
    weeklyEssayTarget: 2,
    weeklyReviewBlocks: 4,
  },
  {
    code: "intenso",
    minHours: 16,
    maxHours: Number.POSITIVE_INFINITY,
    weeklyStudySessions: 10,
    weeklyQuestionTarget: 250,
    weeklyEssayTarget: 2,
    weeklyReviewBlocks: 5,
  },
];

export function getCompetitivenessRule(referenceCutoff) {
  const score = Number(referenceCutoff || 0);
  return (
    COMPETITIVENESS_RULES.find((rule) => score >= rule.min && score <= rule.max) ||
    COMPETITIVENESS_RULES[COMPETITIVENESS_RULES.length - 1]
  );
}

export function getEffortRule(distanceFromCurrentScore) {
  const distance = Math.max(0, Number(distanceFromCurrentScore || 0));
  return (
    EFFORT_RULES.find((rule) => distance >= rule.min && distance <= rule.max) ||
    EFFORT_RULES[EFFORT_RULES.length - 1]
  );
}

export function getWeeklyPlanProfile(weeklyHours) {
  const hours = Math.max(0, Number(weeklyHours || 0));
  return (
    WEEKLY_PLAN_PROFILES.find((profile) => hours >= profile.minHours && hours <= profile.maxHours) ||
    WEEKLY_PLAN_PROFILES[WEEKLY_PLAN_PROFILES.length - 1]
  );
}
