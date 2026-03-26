import { createHttpError } from "../shared/errors.js";
import { OFFER_MATCH_STAGES } from "../shared/systemRules.js";

const MATCH_WEIGHTS = {
  institutionId: 30,
  campusId: 26,
  cityId: 20,
  stateId: 14,
  shift: 10,
};

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function evaluateCandidate(candidate, objective) {
  let score = 0;
  const matchedDimensions = [];
  const relaxedFields = [];

  for (const field of Object.keys(MATCH_WEIGHTS)) {
    const requestedValue = objective[field];

    if (requestedValue === null || requestedValue === undefined) {
      continue;
    }

    const candidateValue = candidate[field];

    if (candidateValue === requestedValue) {
      matchedDimensions.push(field);
      score += MATCH_WEIGHTS[field];
      continue;
    }

    relaxedFields.push(field);
    score -= Math.round(MATCH_WEIGHTS[field] * 0.6);
  }

  score += Math.min(Number(candidate.seatsTotal || 0), 60) / 10;

  return {
    score: round2(score),
    matchedDimensions,
    relaxedFields,
    exactContext: relaxedFields.length === 0,
  };
}

function pickBestCandidate(candidates, objective) {
  const ranked = candidates
    .map((candidate) => {
      const evaluation = evaluateCandidate(candidate, objective);
      return { candidate, evaluation };
    })
    .sort((left, right) => {
      if (right.evaluation.score !== left.evaluation.score) {
        return right.evaluation.score - left.evaluation.score;
      }

      if (right.evaluation.matchedDimensions.length !== left.evaluation.matchedDimensions.length) {
        return right.evaluation.matchedDimensions.length - left.evaluation.matchedDimensions.length;
      }

      return Number(right.candidate.seatsTotal || 0) - Number(left.candidate.seatsTotal || 0);
    });

  return ranked[0] || null;
}

function getStageLabel(stageCode) {
  return OFFER_MATCH_STAGES.find((stage) => stage.code === stageCode)?.label || stageCode;
}

export class OfferDiscoveryService {
  constructor({ offerRepository }) {
    this.offerRepository = offerRepository;
  }

  async resolve({ objective }) {
    const exactCandidates = await this.offerRepository.findExactProcessCandidates({
      courseId: objective.courseId,
      processId: objective.processId,
      targetYear: objective.targetYear,
    });

    if (exactCandidates.length) {
      const best = pickBestCandidate(exactCandidates, objective);
      const stageCode = best.evaluation.exactContext
        ? "exact_process_offer"
        : "exact_process_relaxed_context";

      return {
        matchedOffer: best.candidate,
        fallbackUsed: stageCode !== "exact_process_offer",
        fallbackRuleCode: stageCode,
        confidenceLevel: stageCode === "exact_process_offer" ? "high" : "medium",
        sourceType:
          stageCode === "exact_process_offer" ? "offer_match_exact" : "offer_match_relaxed_context",
        matchType: stageCode === "exact_process_offer" ? "exact" : "relaxed",
        audit: {
          stageCode,
          stageLabel: getStageLabel(stageCode),
          exactCandidatesChecked: exactCandidates.length,
          crossProcessCandidatesChecked: 0,
          matchedDimensions: best.evaluation.matchedDimensions,
          relaxedFields: best.evaluation.relaxedFields,
          candidateScore: best.evaluation.score,
        },
      };
    }

    const crossProcessCandidates = await this.offerRepository.findCrossProcessCandidates({
      courseId: objective.courseId,
      targetYear: objective.targetYear,
      excludedProcessId: objective.processId,
    });

    if (crossProcessCandidates.length) {
      const best = pickBestCandidate(crossProcessCandidates, objective);
      const stageCode = "cross_process_offer";

      return {
        matchedOffer: best.candidate,
        fallbackUsed: true,
        fallbackRuleCode: stageCode,
        confidenceLevel: "low",
        sourceType: "offer_match_cross_process",
        matchType: "fallback",
        audit: {
          stageCode,
          stageLabel: getStageLabel(stageCode),
          exactCandidatesChecked: exactCandidates.length,
          crossProcessCandidatesChecked: crossProcessCandidates.length,
          matchedDimensions: best.evaluation.matchedDimensions,
          relaxedFields: ["processId", ...best.evaluation.relaxedFields],
          candidateScore: best.evaluation.score,
        },
      };
    }

    throw createHttpError(404, "Nenhuma oferta compatível foi encontrada para esse objetivo.");
  }
}
