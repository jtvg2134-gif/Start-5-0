import { parseEnum, parseInteger, parseNumber, ensureObject } from "./valueParsers.js";

const SHIFT_VALUES = ["integral", "manha", "manhã", "tarde", "noite", "ead", "nao_sei", "não_sei", "outro"];

export function parseObjectiveStep(input) {
  const data = ensureObject(input, "objective");

  return {
    courseId: parseInteger(data.courseId, "objective.courseId", { required: true, min: 1 }),
    processId: parseInteger(data.processId, "objective.processId", { required: true, min: 1 }),
    stateId: parseInteger(data.stateId, "objective.stateId", { required: true, min: 1 }),
    cityId: parseInteger(data.cityId, "objective.cityId", { required: true, min: 1 }),
    institutionId: parseInteger(data.institutionId, "objective.institutionId", { min: 1 }),
    campusId: parseInteger(data.campusId, "objective.campusId", { min: 1 }),
    shift: parseEnum(data.shift, "objective.shift", SHIFT_VALUES),
    quotaCategoryId: parseInteger(data.quotaCategoryId, "objective.quotaCategoryId", {
      required: true,
      min: 1,
    }),
    targetYear: parseInteger(data.targetYear, "objective.targetYear", {
      required: true,
      min: 2000,
      max: 2100,
    }),
    weeklyGoalHours: parseNumber(data.weeklyGoalHours, "objective.weeklyGoalHours", {
      required: true,
      min: 0,
    }),
  };
}
