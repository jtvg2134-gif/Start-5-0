export class TargetResultRepository {
  constructor({ db }) {
    this.db = db;
  }

  async create(client, payload) {
    const result = await client.query(
      `
        INSERT INTO user_target_results (
          user_id,
          course_offer_id,
          quota_category_id,
          reference_cutoff,
          reference_confidence,
          reference_source_type,
          safe_target_score,
          competitiveness_level,
          distance_from_current_score,
          effort_level,
          recommended_weekly_hours,
          weekly_goal_status,
          primary_focus_areas,
          summary_json
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::jsonb
        )
        RETURNING id
      `,
      [
        payload.userId,
        payload.courseOfferId,
        payload.quotaCategoryId,
        payload.referenceCutoff,
        payload.referenceConfidence,
        payload.referenceSourceType,
        payload.safeTargetScore,
        payload.competitivenessLevel,
        payload.distanceFromCurrentScore,
        payload.effortLevel,
        payload.recommendedWeeklyHours,
        payload.weeklyGoalStatus,
        JSON.stringify(payload.primaryFocusAreas || []),
        JSON.stringify(payload.summaryJson || {}),
      ]
    );

    return result.rows[0] || null;
  }
}
