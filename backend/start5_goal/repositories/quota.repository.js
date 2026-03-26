export class QuotaRepository {
  constructor({ db }) {
    this.db = db;
  }

  async listQuotaCategories({ processId, institutionId = null, year }) {
    const result = await this.db.query(
      `
        SELECT
          qc.id,
          qc.process_id AS "processId",
          qc.institution_id AS "institutionId",
          qc.code,
          qc.label,
          qc.description,
          qc.year
        FROM quota_categories qc
        WHERE qc.process_id = $1
          AND qc.year = $2
          AND (
            qc.institution_id IS NULL
            OR $3::bigint IS NULL
            OR qc.institution_id = $3
          )
        ORDER BY
          CASE WHEN qc.institution_id = $3 THEN 0 ELSE 1 END,
          qc.label ASC
      `,
      [processId, year, institutionId]
    );

    return result.rows;
  }

  async findOfferQuotaOptions({ courseOfferId }) {
    const result = await this.db.query(
      `
        SELECT
          qc.id,
          qc.process_id AS "processId",
          qc.institution_id AS "institutionId",
          qc.code,
          qc.label,
          qc.description,
          qc.year,
          oqc.seats
        FROM offer_quota_categories oqc
        JOIN quota_categories qc ON qc.id = oqc.quota_category_id
        WHERE oqc.course_offer_id = $1
        ORDER BY qc.label ASC
      `,
      [courseOfferId]
    );

    return result.rows;
  }
}
