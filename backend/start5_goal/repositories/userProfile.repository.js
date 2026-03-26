export class UserProfileRepository {
  constructor({ db }) {
    this.db = db;
  }

  async upsertProfile(client, payload) {
    const result = await client.query(
      `
        INSERT INTO user_profiles (
          user_id,
          target_course_id,
          target_process_id,
          target_institution_id,
          target_campus_id,
          target_state_id,
          target_city_id,
          target_shift,
          target_quota_category_id,
          target_year,
          weekly_goal_hours,
          current_enem_score,
          current_essay_score,
          already_took_enem,
          best_area,
          worst_area,
          study_days_per_week,
          study_time_per_day_minutes,
          works,
          school_stage,
          base_level,
          focus_mode,
          onboarding_completed
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        )
        ON CONFLICT (user_id) DO UPDATE SET
          target_course_id = EXCLUDED.target_course_id,
          target_process_id = EXCLUDED.target_process_id,
          target_institution_id = EXCLUDED.target_institution_id,
          target_campus_id = EXCLUDED.target_campus_id,
          target_state_id = EXCLUDED.target_state_id,
          target_city_id = EXCLUDED.target_city_id,
          target_shift = EXCLUDED.target_shift,
          target_quota_category_id = EXCLUDED.target_quota_category_id,
          target_year = EXCLUDED.target_year,
          weekly_goal_hours = EXCLUDED.weekly_goal_hours,
          current_enem_score = EXCLUDED.current_enem_score,
          current_essay_score = EXCLUDED.current_essay_score,
          already_took_enem = EXCLUDED.already_took_enem,
          best_area = EXCLUDED.best_area,
          worst_area = EXCLUDED.worst_area,
          study_days_per_week = EXCLUDED.study_days_per_week,
          study_time_per_day_minutes = EXCLUDED.study_time_per_day_minutes,
          works = EXCLUDED.works,
          school_stage = EXCLUDED.school_stage,
          base_level = EXCLUDED.base_level,
          focus_mode = EXCLUDED.focus_mode,
          onboarding_completed = EXCLUDED.onboarding_completed
        RETURNING id, user_id AS "userId"
      `,
      [
        payload.userId,
        payload.targetCourseId,
        payload.targetProcessId,
        payload.targetInstitutionId,
        payload.targetCampusId,
        payload.targetStateId,
        payload.targetCityId,
        payload.targetShift,
        payload.targetQuotaCategoryId,
        payload.targetYear,
        payload.weeklyGoalHours,
        payload.currentEnemScore,
        payload.currentEssayScore,
        payload.alreadyTookEnem,
        payload.bestArea,
        payload.worstArea,
        payload.studyDaysPerWeek,
        payload.studyTimePerDayMinutes,
        payload.works,
        payload.schoolStage,
        payload.baseLevel,
        payload.focusMode,
        payload.onboardingCompleted,
      ]
    );

    return result.rows[0];
  }

  async replaceSubjectPriorities(client, { userProfileId, subjectPriorities }) {
    await client.query("DELETE FROM user_subject_priorities WHERE user_profile_id = $1", [userProfileId]);

    for (const priority of subjectPriorities) {
      await client.query(
        `
          INSERT INTO user_subject_priorities (
            user_profile_id,
            subject_area,
            priority_level
          )
          VALUES ($1, $2, $3)
        `,
        [userProfileId, priority.subjectArea, priority.priorityLevel]
      );
    }
  }
}
