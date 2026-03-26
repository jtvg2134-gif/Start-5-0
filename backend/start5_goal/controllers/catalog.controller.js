import { sendJson } from "../shared/http.js";

function parseOptionalInteger(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export class CatalogController {
  constructor({ catalogService }) {
    this.catalogService = catalogService;
  }

  async listCourses({ response }) {
    const items = await this.catalogService.listCourses();
    sendJson(response, 200, { items });
  }

  async listSelectionProcesses({ response }) {
    const items = await this.catalogService.listSelectionProcesses();
    sendJson(response, 200, { items });
  }

  async listStates({ response }) {
    const items = await this.catalogService.listStates();
    sendJson(response, 200, { items });
  }

  async listCities({ response, url }) {
    const items = await this.catalogService.listCities({
      stateId: parseOptionalInteger(url.searchParams.get("stateId")),
    });
    sendJson(response, 200, { items });
  }

  async listInstitutions({ response, url }) {
    const items = await this.catalogService.listInstitutions({
      stateId: parseOptionalInteger(url.searchParams.get("stateId")),
      cityId: parseOptionalInteger(url.searchParams.get("cityId")),
    });
    sendJson(response, 200, { items });
  }

  async listCampuses({ response, url }) {
    const items = await this.catalogService.listCampuses({
      institutionId: parseOptionalInteger(url.searchParams.get("institutionId")),
      cityId: parseOptionalInteger(url.searchParams.get("cityId")),
    });
    sendJson(response, 200, { items });
  }

  async listQuotaCategories({ response, url }) {
    const items = await this.catalogService.listQuotaCategories({
      processId: parseOptionalInteger(url.searchParams.get("processId")),
      institutionId: parseOptionalInteger(url.searchParams.get("institutionId")),
      year: parseOptionalInteger(url.searchParams.get("year")),
    });
    sendJson(response, 200, { items });
  }
}
