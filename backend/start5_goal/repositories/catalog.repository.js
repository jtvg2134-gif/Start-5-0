export class CatalogRepository {
  constructor({ db }) {
    this.db = db;
  }

  async listCourses() {
    const result = await this.db.query(
      `
        SELECT id, name, area_name AS "areaName", degree_type AS "degreeType"
        FROM courses
        ORDER BY name ASC
      `
    );

    return result.rows;
  }

  async listSelectionProcesses() {
    const result = await this.db.query(
      `
        SELECT id, code, name
        FROM selection_processes
        ORDER BY name ASC
      `
    );

    return result.rows;
  }

  async listStates() {
    const result = await this.db.query(
      `
        SELECT id, code, name
        FROM states
        ORDER BY name ASC
      `
    );

    return result.rows;
  }

  async listCities({ stateId = null }) {
    const result = await this.db.query(
      `
        SELECT c.id, c.name, c.state_id AS "stateId", s.code AS "stateCode"
        FROM cities c
        JOIN states s ON s.id = c.state_id
        WHERE ($1::smallint IS NULL OR c.state_id = $1)
        ORDER BY c.name ASC
      `,
      [stateId]
    );

    return result.rows;
  }

  async listInstitutions({ stateId = null, cityId = null }) {
    const result = await this.db.query(
      `
        SELECT
          i.id,
          i.name,
          i.short_name AS "shortName",
          i.institution_type AS "institutionType",
          i.state_id AS "stateId",
          s.code AS "stateCode",
          i.city_id AS "cityId",
          c.name AS "cityName"
        FROM institutions i
        LEFT JOIN states s ON s.id = i.state_id
        LEFT JOIN cities c ON c.id = i.city_id
        WHERE ($1::smallint IS NULL OR i.state_id = $1)
          AND ($2::bigint IS NULL OR i.city_id = $2)
        ORDER BY i.name ASC
      `,
      [stateId, cityId]
    );

    return result.rows;
  }

  async listCampuses({ institutionId = null, cityId = null }) {
    const result = await this.db.query(
      `
        SELECT
          cp.id,
          cp.institution_id AS "institutionId",
          cp.name,
          cp.city_id AS "cityId",
          c.name AS "cityName",
          cp.state_id AS "stateId",
          s.code AS "stateCode"
        FROM campuses cp
        LEFT JOIN cities c ON c.id = cp.city_id
        LEFT JOIN states s ON s.id = cp.state_id
        WHERE ($1::bigint IS NULL OR cp.institution_id = $1)
          AND ($2::bigint IS NULL OR cp.city_id = $2)
        ORDER BY cp.name ASC
      `,
      [institutionId, cityId]
    );

    return result.rows;
  }
}
