export class OfferRepository {
  constructor({ db }) {
    this.db = db;
  }

  async findExactProcessCandidates({ courseId, processId, targetYear }) {
    const result = await this.db.query(
      `
        SELECT
          co.id,
          co.course_id AS "courseId",
          co.institution_id AS "institutionId",
          co.campus_id AS "campusId",
          co.process_id AS "processId",
          co.city_id AS "cityId",
          co.state_id AS "stateId",
          co.shift,
          co.year AS "targetYear",
          co.seats_total AS "seatsTotal",
          c.name AS "courseName",
          i.name AS "institutionName",
          cp.name AS "campusName",
          sp.name AS "processName",
          sp.code AS "processCode",
          ci.name AS "cityName",
          st.code AS "stateCode"
        FROM course_offers co
        JOIN courses c ON c.id = co.course_id
        JOIN institutions i ON i.id = co.institution_id
        LEFT JOIN campuses cp ON cp.id = co.campus_id
        JOIN selection_processes sp ON sp.id = co.process_id
        LEFT JOIN cities ci ON ci.id = co.city_id
        LEFT JOIN states st ON st.id = co.state_id
        WHERE co.active = TRUE
          AND co.course_id = $1
          AND co.process_id = $2
          AND co.year = $3
        ORDER BY i.name ASC, cp.name ASC NULLS LAST
      `,
      [courseId, processId, targetYear]
    );

    return result.rows;
  }

  async findCrossProcessCandidates({ courseId, targetYear, excludedProcessId = null }) {
    const result = await this.db.query(
      `
        SELECT
          co.id,
          co.course_id AS "courseId",
          co.institution_id AS "institutionId",
          co.campus_id AS "campusId",
          co.process_id AS "processId",
          co.city_id AS "cityId",
          co.state_id AS "stateId",
          co.shift,
          co.year AS "targetYear",
          co.seats_total AS "seatsTotal",
          c.name AS "courseName",
          i.name AS "institutionName",
          cp.name AS "campusName",
          sp.name AS "processName",
          sp.code AS "processCode",
          ci.name AS "cityName",
          st.code AS "stateCode"
        FROM course_offers co
        JOIN courses c ON c.id = co.course_id
        JOIN institutions i ON i.id = co.institution_id
        LEFT JOIN campuses cp ON cp.id = co.campus_id
        JOIN selection_processes sp ON sp.id = co.process_id
        LEFT JOIN cities ci ON ci.id = co.city_id
        LEFT JOIN states st ON st.id = co.state_id
        WHERE co.active = TRUE
          AND co.course_id = $1
          AND co.year = $2
          AND ($3::bigint IS NULL OR co.process_id <> $3)
        ORDER BY i.name ASC, cp.name ASC NULLS LAST
      `,
      [courseId, targetYear, excludedProcessId]
    );

    return result.rows;
  }

  async findCandidatesByCourseProcessYear(params) {
    return this.findExactProcessCandidates(params);
  }

  async findCandidatesByCourseYear(params) {
    return this.findCrossProcessCandidates(params);
  }
}
