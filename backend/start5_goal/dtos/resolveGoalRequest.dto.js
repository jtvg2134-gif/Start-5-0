import { parseBaseStep } from "./baseStep.dto.js";
import { parseObjectiveStep } from "./objectiveStep.dto.js";
import { parsePrioritiesStep } from "./prioritiesStep.dto.js";
import { ensureObject, parseInteger } from "./valueParsers.js";

export function parseResolveGoalRequest(input) {
  const data = ensureObject(input, "payload");

  return {
    userId: parseInteger(data.userId, "userId", { min: 1 }),
    objective: parseObjectiveStep(data.objective),
    base: parseBaseStep(data.base),
    priorities: parsePrioritiesStep(data.priorities || {}),
  };
}
