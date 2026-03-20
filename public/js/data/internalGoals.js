import { getAdmissionCategory } from "./admissionCategories.js";

function toRange(center, spread) {
  const safeCenter = Number(center || 650);
  return [Math.max(0, safeCenter - spread), safeCenter + spread];
}

export function buildInternalGoal(course, category, exam) {
  if (!course) {
    return null;
  }

  const safeCategory = getAdmissionCategory(category?.id || category);
  const targetKey = safeCategory.targetBucket || "ac";
  const targetValue = Number(course.targetScores?.[targetKey] || course.targetScores?.ac || 650);
  const spread = exam?.scoreScaleType === "percent_correct" ? 4 : 35;
  const range = toRange(targetValue, spread);
  const scaleType = exam?.scoreScaleType || "enem_points";
  const primarySubjects = Object.entries(course.subjectBoosts || {})
    .sort((left, right) => Number(right[1] || 0) - Number(left[1] || 0))
    .slice(0, 3)
    .map(([subjectId]) => subjectId);

  return {
    scaleType,
    range,
    rangeLabel: scaleType === "percent_correct" ? `${range[0]} - ${range[1]}/100` : `${range[0]} - ${range[1]}/1000`,
    shortTargetLabel: scaleType === "percent_correct" ? `${targetValue}/100` : `${targetValue}/1000`,
    note:
      "Estimativa interna usada para orientar a rotina. Nao substitui edital, corte oficial ou classificacao real.",
    primarySubjects,
    examAdjustmentCopy: exam
      ? `Refinada por ${exam.name || exam.label || "vestibular principal"}.`
      : "Sem refinamento por prova ainda.",
  };
}
