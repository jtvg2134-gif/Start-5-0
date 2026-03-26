import { withTransaction } from "../db/connection.js";
import { buildResolveGoalResponse } from "../dtos/resolveGoalResponse.dto.js";

export class OnboardingResolutionService {
  constructor({
    offerDiscoveryService,
    targetScoreService,
    studyPlanService,
    userProfileRepository,
    targetResultRepository,
  }) {
    this.offerDiscoveryService = offerDiscoveryService;
    this.targetScoreService = targetScoreService;
    this.studyPlanService = studyPlanService;
    this.userProfileRepository = userProfileRepository;
    this.targetResultRepository = targetResultRepository;
  }

  async resolve(requestDto) {
    const offerDiscovery = await this.offerDiscoveryService.resolve({
      objective: requestDto.objective,
    });
    const target = await this.targetScoreService.resolve({
      objective: requestDto.objective,
      base: requestDto.base,
      priorities: requestDto.priorities,
      offerDiscovery,
    });
    const studyPlan = await this.studyPlanService.resolve({
      objective: requestDto.objective,
      base: requestDto.base,
      target,
    });
    const persistence = await this.persistIfNeeded({
      requestDto,
      offerDiscovery,
      target,
      studyPlan,
    });
    const summary = this.buildSummary({ offerDiscovery, target, studyPlan });

    return buildResolveGoalResponse({
      matchedOffer: offerDiscovery.matchedOffer,
      offerDiscovery,
      quotaMatch: target.quotaMatch,
      target,
      priorityAreas: target.priorityAreas,
      studyPlan,
      persistence,
      summary,
    });
  }

  async persistIfNeeded({ requestDto, offerDiscovery, target, studyPlan }) {
    if (!requestDto.userId) {
      return {
        profileSaved: false,
        targetSaved: false,
        subjectPrioritiesSaved: false,
      };
    }

    return withTransaction(async (client) => {
      const profile = await this.userProfileRepository.upsertProfile(client, {
        userId: requestDto.userId,
        targetCourseId: requestDto.objective.courseId,
        targetProcessId: requestDto.objective.processId,
        targetInstitutionId: requestDto.objective.institutionId,
        targetCampusId: requestDto.objective.campusId,
        targetStateId: requestDto.objective.stateId,
        targetCityId: requestDto.objective.cityId,
        targetShift: requestDto.objective.shift,
        targetQuotaCategoryId: requestDto.objective.quotaCategoryId,
        targetYear: requestDto.objective.targetYear,
        weeklyGoalHours: requestDto.objective.weeklyGoalHours,
        currentEnemScore: requestDto.base.currentEnemScore,
        currentEssayScore: requestDto.base.currentEssayScore,
        alreadyTookEnem: requestDto.base.alreadyTookEnem,
        bestArea: requestDto.base.bestArea,
        worstArea: requestDto.base.worstArea,
        studyDaysPerWeek: requestDto.base.studyDaysPerWeek,
        studyTimePerDayMinutes: requestDto.base.studyTimePerDayMinutes,
        works: requestDto.base.works,
        schoolStage: requestDto.base.schoolStage,
        baseLevel: requestDto.base.baseLevel,
        focusMode: requestDto.priorities.focusMode,
        onboardingCompleted: true,
      });

      await this.userProfileRepository.replaceSubjectPriorities(client, {
        userProfileId: profile.id,
        subjectPriorities: requestDto.priorities.subjectPriorities,
      });

      const targetResult = await this.targetResultRepository.create(client, {
        userId: requestDto.userId,
        courseOfferId: offerDiscovery.matchedOffer.id,
        quotaCategoryId: target.quotaMatch.matchedQuotaCategoryId || requestDto.objective.quotaCategoryId,
        referenceCutoff: target.referenceCutoff,
        referenceConfidence: target.confidenceLevel,
        referenceSourceType: target.sourceType,
        safeTargetScore: target.suggestedGoalScore,
        competitivenessLevel: target.competitivenessLevel,
        distanceFromCurrentScore: target.distanceFromCurrentScore,
        effortLevel: target.effortLevel,
        recommendedWeeklyHours: target.recommendedWeeklyHours,
        weeklyGoalStatus: target.weeklyGoalStatus,
        primaryFocusAreas: target.priorityAreas.slice(0, 3),
        summaryJson: this.buildSummary({ offerDiscovery, target, studyPlan }),
      });

      return {
        profileSaved: true,
        targetSaved: Boolean(targetResult),
        subjectPrioritiesSaved: true,
        userProfileId: profile.id,
        targetResultId: targetResult?.id || null,
      };
    });
  }

  buildSummary({ offerDiscovery, target, studyPlan }) {
    return {
      matchedOffer: {
        courseName: offerDiscovery.matchedOffer.courseName,
        institutionName: offerDiscovery.matchedOffer.institutionName,
        campusName: offerDiscovery.matchedOffer.campusName,
        processName: offerDiscovery.matchedOffer.processName,
      },
      target: {
        referenceCutoff: target.referenceCutoff,
        suggestedGoalScore: target.suggestedGoalScore,
        competitivenessLevel: target.competitivenessLevel,
        confidenceLevel: target.confidenceLevel,
        sourceType: target.sourceType,
      },
      studyPlan: {
        intensity: studyPlan.intensity,
        weeklyStudySessions: studyPlan.weeklyStudySessions,
        weeklyQuestionTarget: studyPlan.weeklyQuestionTarget,
        weeklyEssayTarget: studyPlan.weeklyEssayTarget,
      },
      headline: `Meta sugerida ${target.suggestedGoalScore} com foco principal em ${studyPlan.focusAreas
        .map((area) => area.label)
        .join(", ")}.`,
    };
  }
}
