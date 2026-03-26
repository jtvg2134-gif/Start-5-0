import { createHttpError } from "../../shared/errors.js";

export class CatalogService {
  constructor({ catalogRepository, quotaRepository }) {
    this.catalogRepository = catalogRepository;
    this.quotaRepository = quotaRepository;
  }

  async listCourses() {
    return this.catalogRepository.listCourses();
  }

  async listSelectionProcesses() {
    return this.catalogRepository.listSelectionProcesses();
  }

  async listStates() {
    return this.catalogRepository.listStates();
  }

  async listCities({ stateId = null }) {
    return this.catalogRepository.listCities({ stateId });
  }

  async listInstitutions({ stateId = null, cityId = null }) {
    return this.catalogRepository.listInstitutions({ stateId, cityId });
  }

  async listCampuses({ institutionId = null, cityId = null }) {
    return this.catalogRepository.listCampuses({ institutionId, cityId });
  }

  async listQuotaCategories({ processId, institutionId = null, year }) {
    if (!processId || !year) {
      throw createHttpError(400, "processId e year sao obrigatorios para listar modalidades.");
    }

    return this.quotaRepository.listQuotaCategories({ processId, institutionId, year });
  }
}
