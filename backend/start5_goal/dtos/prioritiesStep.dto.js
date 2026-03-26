import { FOCUS_MODE_LABELS } from "../shared/systemRules.js";
import { ensureObject, parseArray, parseEnum } from "./valueParsers.js";

const SUBJECT_AREA_VALUES = ["linguagens", "humanas", "natureza", "matematica", "redacao"];
const PRIORITY_LEVEL_VALUES = ["baixa", "media", "alta"];

export function parsePrioritiesStep(input = {}) {
  const data = ensureObject(input, "priorities");
  const focusModes = Object.keys(FOCUS_MODE_LABELS);
  const subjectPriorities = parseArray(data.subjectPriorities, "priorities.subjectPriorities");
  const uniquePriorities = new Map();

  for (const item of subjectPriorities) {
    const priority = ensureObject(item, "priorities.subjectPriorities[]");
    const subjectArea = parseEnum(priority.subjectArea, "priorities.subjectPriorities[].subjectArea", SUBJECT_AREA_VALUES, {
      required: true,
    });
    const priorityLevel = parseEnum(
      priority.priorityLevel,
      "priorities.subjectPriorities[].priorityLevel",
      PRIORITY_LEVEL_VALUES,
      { required: true }
    );

    uniquePriorities.set(subjectArea, { subjectArea, priorityLevel });
  }

  return {
    focusMode: parseEnum(data.focusMode, "priorities.focusMode", focusModes),
    subjectPriorities: Array.from(uniquePriorities.values()),
  };
}
