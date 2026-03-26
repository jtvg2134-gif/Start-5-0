export class ScoreRuleRepository {
  constructor({ db }) {
    this.db = db;
  }

  async findByOfferId(courseOfferId) {
    const result = await this.db.query(
      `
        SELECT
          course_offer_id AS "courseOfferId",
          uses_enem AS "usesEnem",
          weight_languages AS "weightLanguages",
          weight_humanities AS "weightHumanities",
          weight_nature AS "weightNature",
          weight_math AS "weightMath",
          weight_essay AS "weightEssay",
          minimum_overall_score AS "minimumOverallScore",
          minimum_essay_score AS "minimumEssayScore",
          minimum_area_scores_json AS "minimumAreaScoresJson"
        FROM score_rules
        WHERE course_offer_id = $1
        LIMIT 1
      `,
      [courseOfferId]
    );

    return result.rows[0] || null;
  }
}
