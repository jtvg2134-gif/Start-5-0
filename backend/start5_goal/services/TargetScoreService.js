import { createHttpError } from "../shared/errors.js";
import {
  AREA_PRIORITY_LABELS,
  CUTOFF_FALLBACK_STAGES,
  FOCUS_MODE_LABELS,
  getCompetitivenessRule,
  getEffortRule,
} from "../shared/systemRules.js";

const SCORE_WEIGHT_FIELDS = {
  linguagens: "weightLanguages",
  humanas: "weightHumanities",
  natureza: "weightNature",
  matematica: "weightMath",
  redacao: "weightEssay",
};

const SUBJECT_PRIORITY_BOOST = {
  baixa: 6,
  media: 12,
  alta: 20,
};

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function compareWeeklyGoal(goalHours, recommendedHours) {
  if (!Number.isFinite(goalHours) || goalHours <= 0) {
    return "indefinido";
  }

  if (goalHours >= recommendedHours) {
    return "adequada";
  }

  if (goalHours >= recommendedHours * 0.8) {
    return "quase_adequada";
  }

  return "abaixo_do_ideal";
}

function extractWeights(scoreRule) {
  return Object.fromEntries(
    Object.entries(SCORE_WEIGHT_FIELDS).map(([area, field]) => [area, Number(scoreRule?.[field] || 1)])
  );
}

function applyFocusModeBoosts(entries, focusMode, base) {
  const sortedByWeight = [...entries].sort((left, right) => right.weight - left.weight);
  const topWeightedAreas = sortedByWeight.slice(0, 3).map((entry) => entry.subjectArea);

  for (const entry of entries) {
    switch (focusMode) {
      case "melhorar_redacao":
        if (entry.subjectArea === "redacao") {
          entry.priorityScore += 18;
          entry.reasons.push("foco_em_redacao");
        }
        break;
      case "melhorar_materias_de_maior_peso":
        if (topWeightedAreas[0] === entry.subjectArea) {
          entry.priorityScore += 16;
          entry.reasons.push("maior_peso_da_vaga");
        } else if (topWeightedAreas[1] === entry.subjectArea) {
          entry.priorityScore += 9;
          entry.reasons.push("segundo_maior_peso");
        }
        break;
      case "subir_nota_geral":
        if (topWeightedAreas.includes(entry.subjectArea)) {
          entry.priorityScore += 7;
          entry.reasons.push("subir_nota_geral");
        }
        break;
      case "recuperar_base":
        if (entry.subjectArea === base.worstArea) {
          entry.priorityScore += 16;
          entry.reasons.push("recuperar_pior_area");
        }
        break;
      case "ganhar_constancia":
      default:
        break;
    }
  }

  return entries;
}

function buildPriorityAreas({ scoreRule, base, priorities }) {
  const weights = extractWeights(scoreRule);
  const userPriorityMap = new Map((priorities.subjectPriorities || []).map((item) => [item.subjectArea, item.priorityLevel]));
  const entries = Object.keys(SCORE_WEIGHT_FIELDS).map((subjectArea) => {
    const weight = Number(weights[subjectArea] || 1);
    const entry = {
      subjectArea,
      label: AREA_PRIORITY_LABELS[subjectArea],
      weight,
      priorityScore: weight * 24,
      reasons: [],
    };

    if (weight > 1) {
      entry.reasons.push(`peso_${weight}`);
    }

    if (base.worstArea === subjectArea) {
      entry.priorityScore += 18;
      entry.reasons.push("pior_area_atual");
    }

    if (base.bestArea === subjectArea) {
      entry.priorityScore -= 8;
      entry.reasons.push("melhor_area_atual");
    }

    const selectedPriority = userPriorityMap.get(subjectArea);
    if (selectedPriority) {
      entry.priorityScore += SUBJECT_PRIORITY_BOOST[selectedPriority];
      entry.reasons.push(`ajuste_manual_${selectedPriority}`);
    }

    if (
      subjectArea === "redacao" &&
      Number.isFinite(base.currentEssayScore) &&
      Number.isFinite(Number(scoreRule?.minimumEssayScore)) &&
      Number(base.currentEssayScore) < Number(scoreRule.minimumEssayScore)
    ) {
      entry.priorityScore += 18;
      entry.reasons.push("abaixo_do_minimo_de_redacao");
    }

    return entry;
  });

  applyFocusModeBoosts(entries, priorities.focusMode, base);

  return entries
    .map((entry) => ({
      ...entry,
      priorityScore: round2(entry.priorityScore),
      focusModeApplied: priorities.focusMode ? FOCUS_MODE_LABELS[priorities.focusMode] : null,
    }))
    .sort((left, right) => right.priorityScore - left.priorityScore);
}

export class TargetScoreService {
  constructor({ cutoffRepository, quotaRepository, scoreRuleRepository }) {
    this.cutoffRepository = cutoffRepository;
    this.quotaRepository = quotaRepository;
    this.scoreRuleRepository = scoreRuleRepository;
  }

  async resolve({ objective, base, priorities, offerDiscovery }) {
    const matchedOffer = offerDiscovery.matchedOffer;
    const quotaOptions = await this.quotaRepository.findOfferQuotaOptions({ courseOfferId: matchedOffer.id });
    const exactQuotaAvailable = quotaOptions.some((option) => option.id === objective.quotaCategoryId);
    const scoreRule = await this.scoreRuleRepository.findByOfferId(matchedOffer.id);
    const cutoffResolution = await this.findBestCutoff({ objective, matchedOffer });
    const referenceCutoff = round2(cutoffResolution.referenceCutoff);
    const competitivenessRule = getCompetitivenessRule(referenceCutoff);
    const suggestedGoalScore = round2(Math.min(1000, referenceCutoff + competitivenessRule.margin));
    const currentScore = Number(base.currentEnemScore || 0);
    const distanceFromCurrentScore = round2(Math.max(0, suggestedGoalScore - currentScore));
    const effortRule = getEffortRule(distanceFromCurrentScore);
    const weeklyGoalStatus = compareWeeklyGoal(Number(objective.weeklyGoalHours || 0), effortRule.recommendedWeeklyHours);
    const priorityAreas = buildPriorityAreas({ scoreRule, base, priorities });

    return {
      quotaMatch: {
        requestedQuotaCategoryId: objective.quotaCategoryId,
        exactQuotaAvailable,
        matchedQuotaCategoryId:
          cutoffResolution.record.quotaCategoryId ||
          (exactQuotaAvailable ? objective.quotaCategoryId : null),
        availableOptions: quotaOptions.map((option) => ({
          id: option.id,
          code: option.code,
          label: option.label,
          seats: option.seats,
        })),
      },
      targetScore: referenceCutoff,
      referenceCutoff,
      suggestedGoalScore,
      scoreType: cutoffResolution.scoreType,
      confidenceLevel: cutoffResolution.confidenceLevel,
      fallbackUsed: cutoffResolution.fallbackUsed,
      sourceType: cutoffResolution.sourceType,
      competitivenessLevel: competitivenessRule.level,
      distanceFromCurrentScore,
      effortLevel: effortRule.level,
      recommendedWeeklyHours: effortRule.recommendedWeeklyHours,
      weeklyGoalStatus,
      priorityAreas,
      scoreRule,
      audit: {
        fallbackTrace: cutoffResolution.trace,
        sourceRecord: cutoffResolution.sourceRecord,
      },
    };
  }

  async findBestCutoff({ objective, matchedOffer }) {
    const trace = [];
    const stages = [
      {
        code: "exact_offer_quota",
        scoreType: "historical_cutoff",
        sourceType: "exact_offer_quota",
        fallbackUsed: false,
        run: () =>
          this.cutoffRepository.findExactOfferQuota({
            courseOfferId: matchedOffer.id,
            quotaCategoryId: objective.quotaCategoryId,
          }),
      },
      {
        code: "exact_offer_any_quota",
        scoreType: "historical_cutoff",
        sourceType: "exact_offer_any_quota",
        fallbackUsed: true,
        run: () => this.cutoffRepository.findExactOfferAnyQuota({ courseOfferId: matchedOffer.id }),
      },
      {
        code: "same_course_same_institution",
        scoreType: "historical_cutoff",
        sourceType: "same_course_same_institution",
        fallbackUsed: true,
        run: () =>
          this.cutoffRepository.findByCourseInstitution({
            courseId: matchedOffer.courseId,
            institutionId: matchedOffer.institutionId,
            processId: matchedOffer.processId,
          }),
      },
      {
        code: "same_course_same_city",
        scoreType: "historical_cutoff",
        sourceType: "same_course_same_city",
        fallbackUsed: true,
        run: () =>
          this.cutoffRepository.findByCourseCity({
            courseId: matchedOffer.courseId,
            cityId: matchedOffer.cityId,
            processId: matchedOffer.processId,
          }),
      },
      {
        code: "same_course_same_state",
        scoreType: "historical_cutoff",
        sourceType: "same_course_same_state",
        fallbackUsed: true,
        run: () =>
          this.cutoffRepository.findByCourseState({
            courseId: matchedOffer.courseId,
            stateId: matchedOffer.stateId,
            processId: matchedOffer.processId,
          }),
      },
      {
        code: "course_reference_state",
        scoreType: "course_reference",
        sourceType: "course_reference_state",
        fallbackUsed: true,
        run: () =>
          this.cutoffRepository.findCourseReference({
            courseId: matchedOffer.courseId,
            processId: objective.processId,
            stateId: objective.stateId,
          }),
      },
      {
        code: "course_reference_national",
        scoreType: "course_reference",
        sourceType: "course_reference_national",
        fallbackUsed: true,
        run: () =>
          this.cutoffRepository.findCourseReference({
            courseId: matchedOffer.courseId,
            processId: objective.processId,
            stateId: null,
          }),
      },
    ];

    for (const stage of stages) {
      const record = await stage.run();

      trace.push({
        code: stage.code,
        matched: Boolean(record),
        sourceRecordId: record?.id || null,
      });

      if (!record) {
        continue;
      }

      const rule = CUTOFF_FALLBACK_STAGES.find((item) => item.code === stage.code);
      const referenceCutoff = Number(record.cutoffScore ?? record.averageScore);

      return {
        record,
        trace,
        referenceCutoff,
        scoreType: stage.scoreType,
        sourceType: stage.sourceType,
        confidenceLevel: rule?.confidenceLevel || "estimated",
        fallbackUsed: stage.fallbackUsed,
        sourceRecord: record,
      };
    }

    throw createHttpError(
      404,
      "Nao foi possivel encontrar nota de referencia nem fallback valido para a vaga selecionada."
    );
  }
}
