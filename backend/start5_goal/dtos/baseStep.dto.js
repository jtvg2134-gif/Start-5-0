import { ensureObject, parseBoolean, parseEnum, parseInteger, parseNumber } from "./valueParsers.js";

const AREA_VALUES = ["linguagens", "humanas", "natureza", "matematica", "redacao", "ainda_nao_sei"];
const SCHOOL_STAGE_VALUES = ["1ano", "2ano", "3ano", "conclui", "cursinho", "faculdade_outro"];
const BASE_LEVEL_VALUES = ["zero", "fraca", "media", "boa"];

export function parseBaseStep(input) {
  const data = ensureObject(input, "base");

  return {
    currentEnemScore: parseNumber(data.currentEnemScore, "base.currentEnemScore", {
      required: true,
      min: 0,
      max: 1000,
    }),
    currentEssayScore: parseNumber(data.currentEssayScore, "base.currentEssayScore", { min: 0, max: 1000 }),
    alreadyTookEnem: parseBoolean(data.alreadyTookEnem, "base.alreadyTookEnem"),
    bestArea: parseEnum(data.bestArea, "base.bestArea", AREA_VALUES),
    worstArea: parseEnum(data.worstArea, "base.worstArea", AREA_VALUES),
    studyDaysPerWeek: parseInteger(data.studyDaysPerWeek, "base.studyDaysPerWeek", { min: 1, max: 7 }),
    studyTimePerDayMinutes: parseInteger(data.studyTimePerDayMinutes, "base.studyTimePerDayMinutes", { min: 0 }),
    works: parseBoolean(data.works, "base.works"),
    schoolStage: parseEnum(data.schoolStage, "base.schoolStage", SCHOOL_STAGE_VALUES),
    baseLevel: parseEnum(data.baseLevel, "base.baseLevel", BASE_LEVEL_VALUES),
  };
}
