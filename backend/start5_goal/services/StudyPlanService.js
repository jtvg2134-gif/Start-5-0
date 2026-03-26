import { getWeeklyPlanProfile } from "../shared/systemRules.js";

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export class StudyPlanService {
  async resolve({ objective, base, target }) {
    const profile = getWeeklyPlanProfile(target.recommendedWeeklyHours);
    const focusAreas = target.priorityAreas.slice(0, 3).map((area) => ({
      subjectArea: area.subjectArea,
      label: area.label,
      priorityScore: area.priorityScore,
    }));
    const availableWeeklyHours =
      Number.isFinite(base.studyDaysPerWeek) && Number.isFinite(base.studyTimePerDayMinutes)
        ? round2((Number(base.studyDaysPerWeek) * Number(base.studyTimePerDayMinutes)) / 60)
        : null;
    const weeklyStudySessions = base.studyDaysPerWeek
      ? Math.max(Number(base.studyDaysPerWeek), Math.min(profile.weeklyStudySessions, Number(base.studyDaysPerWeek) * 2))
      : profile.weeklyStudySessions;
    const weeklyEssayTarget =
      focusAreas.some((area) => area.subjectArea === "redacao") || Number(target.distanceFromCurrentScore) > 100
        ? profile.weeklyEssayTarget + 1
        : profile.weeklyEssayTarget;

    return {
      weeklyStudySessions,
      weeklyQuestionTarget: profile.weeklyQuestionTarget,
      weeklyEssayTarget,
      weeklyReviewBlocks: Math.min(profile.weeklyReviewBlocks, Math.max(2, weeklyStudySessions - 1)),
      focusAreas,
      intensity: profile.code,
      audit: {
        availableWeeklyHours,
        plannedWeeklyHours: round2(Number(objective.weeklyGoalHours || 0)),
        recommendedWeeklyHours: target.recommendedWeeklyHours,
        weeklyGoalStatus: target.weeklyGoalStatus,
      },
    };
  }
}
