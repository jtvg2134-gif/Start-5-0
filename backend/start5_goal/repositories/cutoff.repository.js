export class CutoffRepository {
  constructor({ db }) {
    this.db = db;
  }

  async findExactOfferQuota({ courseOfferId, quotaCategoryId }) {
    const result = await this.db.query(
      `
        SELECT
          hc.id,
          hc.cutoff_score AS "cutoffScore",
          hc.year,
          hc.edition,
          hc.source,
          hc.source_url AS "sourceUrl",
          hc.quota_category_id AS "quotaCategoryId"
        FROM historical_cutoffs hc
        WHERE hc.course_offer_id = $1
          AND hc.quota_category_id = $2
        ORDER BY hc.year DESC, hc.created_at DESC
        LIMIT 1
      `,
      [courseOfferId, quotaCategoryId]
    );

    return result.rows[0] || null;
  }

  async findExactOfferAnyQuota({ courseOfferId }) {
    const result = await this.db.query(
      `
        SELECT
          hc.id,
          hc.cutoff_score AS "cutoffScore",
          hc.year,
          hc.edition,
          hc.source,
          hc.source_url AS "sourceUrl",
          hc.quota_category_id AS "quotaCategoryId"
        FROM historical_cutoffs hc
        WHERE hc.course_offer_id = $1
        ORDER BY hc.year DESC, hc.created_at DESC
        LIMIT 1
      `,
      [courseOfferId]
    );

    return result.rows[0] || null;
  }

  async findByCourseInstitution({ courseId, institutionId, processId = null }) {
    const result = await this.db.query(
      `
        SELECT
          hc.id,
          hc.cutoff_score AS "cutoffScore",
          hc.year,
          hc.edition,
          hc.source,
          hc.source_url AS "sourceUrl",
          co.id AS "courseOfferId",
          co.process_id AS "processId"
        FROM historical_cutoffs hc
        JOIN course_offers co ON co.id = hc.course_offer_id
        WHERE co.course_id = $1
          AND co.institution_id = $2
        ORDER BY
          CASE WHEN co.process_id = $3 THEN 0 ELSE 1 END,
          hc.year DESC,
          hc.created_at DESC
        LIMIT 1
      `,
      [courseId, institutionId, processId]
    );

    return result.rows[0] || null;
  }

  async findByCourseCity({ courseId, cityId, processId = null }) {
    const result = await this.db.query(
      `
        SELECT
          hc.id,
          hc.cutoff_score AS "cutoffScore",
          hc.year,
          hc.edition,
          hc.source,
          hc.source_url AS "sourceUrl",
          co.id AS "courseOfferId",
          co.process_id AS "processId"
        FROM historical_cutoffs hc
        JOIN course_offers co ON co.id = hc.course_offer_id
        WHERE co.course_id = $1
          AND co.city_id = $2
        ORDER BY
          CASE WHEN co.process_id = $3 THEN 0 ELSE 1 END,
          hc.year DESC,
          hc.created_at DESC
        LIMIT 1
      `,
      [courseId, cityId, processId]
    );

    return result.rows[0] || null;
  }

  async findByCourseState({ courseId, stateId, processId = null }) {
    const result = await this.db.query(
      `
        SELECT
          hc.id,
          hc.cutoff_score AS "cutoffScore",
          hc.year,
          hc.edition,
          hc.source,
          hc.source_url AS "sourceUrl",
          co.id AS "courseOfferId",
          co.process_id AS "processId"
        FROM historical_cutoffs hc
        JOIN course_offers co ON co.id = hc.course_offer_id
        WHERE co.course_id = $1
          AND co.state_id = $2
        ORDER BY
          CASE WHEN co.process_id = $3 THEN 0 ELSE 1 END,
          hc.year DESC,
          hc.created_at DESC
        LIMIT 1
      `,
      [courseId, stateId, processId]
    );

    return result.rows[0] || null;
  }

  async findCourseReference({ courseId, processId, stateId = null }) {
    const result = await this.db.query(
      `
        SELECT
          id,
          average_score AS "averageScore",
          year,
          sample_size AS "sampleSize",
          source,
          state_id AS "stateId"
        FROM course_reference_scores
        WHERE course_id = $1
          AND process_id = $2
          AND ($3::smallint IS NULL OR state_id = $3)
        ORDER BY
          CASE WHEN state_id = $3 THEN 0 ELSE 1 END,
          year DESC
        LIMIT 1
      `,
      [courseId, processId, stateId]
    );

    return result.rows[0] || null;
  }
}
