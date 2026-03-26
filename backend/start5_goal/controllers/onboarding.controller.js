import { parseResolveGoalRequest } from "../dtos/resolveGoalRequest.dto.js";
import { readJsonBody, sendJson } from "../shared/http.js";

export class OnboardingController {
  constructor({ onboardingResolutionService }) {
    this.onboardingResolutionService = onboardingResolutionService;
  }

  async resolveGoal({ request, response }) {
    const body = await readJsonBody(request);
    const requestDto = parseResolveGoalRequest(body);
    const result = await this.onboardingResolutionService.resolve(requestDto);
    sendJson(response, 200, result);
  }
}
