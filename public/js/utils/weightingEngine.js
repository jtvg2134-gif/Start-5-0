import { getSubjectLabel } from "../data/subjects.js";

const DIFFICULTY_ADJUSTMENTS = {
  facil: 0,
  normal: 0.5,
  dificil: 1,
  muito_dificil: 1.5,
  atencao: 1,
  reforco: 1.5,
};

export function normalizeWeights(entries = []) {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, Number(entry.rawWeight) || 0), 0) || 1;

  return entries.map((entry) => ({
    ...entry,
    normalizedWeight: Number(entry.rawWeight || 0) / total,
  }));
}

export function calculateSubjectWeights({
  subjects = [],
  course = null,
  primaryExam = null,
  secondaryExam = null,
  examProfile = null,
  subjectPreferences = [],
}) {
  const preferenceMap = new Map(
    (subjectPreferences || []).map((entry) => [
      `${entry.subjectKey}::${String(entry.customSubjectName || "").toLowerCase()}`,
      entry,
    ])
  );

  const baseEntries = subjects.map((subject) => {
    const preferenceKey = `${subject.id}::`;
    const preference = preferenceMap.get(preferenceKey) || {};
    const baseCourseWeight = Number(course?.subjectBoosts?.[subject.id] || 1);
    const primaryExamAdjustment = Number(primaryExam?.subjectAdjustments?.[subject.id] || 0) / 10;
    const secondaryExamAdjustment = Number(secondaryExam?.subjectAdjustments?.[subject.id] || 0) / 20;
    const profileAdjustment = Number(examProfile?.multiplierAdjustments?.[subject.id] || 0);
    const manualAdjustment = Number(preference.manualDelta || 0) * 0.18;
    const difficultyAdjustment = Number(DIFFICULTY_ADJUSTMENTS[preference.difficultyLevel] || 0) * 0.16;
    const rawWeight =
      baseCourseWeight +
      primaryExamAdjustment +
      secondaryExamAdjustment +
      profileAdjustment +
      manualAdjustment +
      difficultyAdjustment;

    return {
      subjectKey: subject.id,
      subjectLabel: subject.name,
      rawWeight: Math.max(0.4, Math.round(rawWeight * 100) / 100),
      manualDelta: Number(preference.manualDelta || 0),
      difficultyLevel: String(preference.difficultyLevel || "normal"),
      customSubjectName: "",
      isCustom: false,
    };
  });

  const customEntries = (subjectPreferences || [])
    .filter((entry) => entry.subjectKey === "outras" && String(entry.customSubjectName || "").trim())
    .map((entry) => {
      const manualAdjustment = Number(entry.manualDelta || 0) * 0.18;
      const difficultyAdjustment = Number(DIFFICULTY_ADJUSTMENTS[entry.difficultyLevel] || 0) * 0.16;
      const rawWeight = 0.65 + manualAdjustment + difficultyAdjustment;

      return {
        subjectKey: "outras",
        subjectLabel: String(entry.customSubjectName || "").trim(),
        rawWeight: Math.max(0.3, Math.round(rawWeight * 100) / 100),
        manualDelta: Number(entry.manualDelta || 0),
        difficultyLevel: String(entry.difficultyLevel || "normal"),
        customSubjectName: String(entry.customSubjectName || "").trim(),
        isCustom: true,
      };
    });

  return normalizeWeights([...baseEntries, ...customEntries])
    .map((entry) => ({
      ...entry,
      priorityLevel:
        entry.normalizedWeight >= 0.14
          ? "alta"
          : entry.normalizedWeight >= 0.09
            ? "media"
            : "base",
      priorityCopy:
        entry.normalizedWeight >= 0.14
          ? "Topo da semana"
          : entry.normalizedWeight >= 0.09
            ? "Presenca forte"
            : "Manutencao",
      debugBreakdown: {
        course: Number(course?.subjectBoosts?.[entry.subjectKey] || (entry.isCustom ? 0.65 : 1)),
        primaryExam: Number(primaryExam?.subjectAdjustments?.[entry.subjectKey] || 0),
        secondaryExam: Number(secondaryExam?.subjectAdjustments?.[entry.subjectKey] || 0),
        profile: Number(examProfile?.multiplierAdjustments?.[entry.subjectKey] || 0),
      },
    }))
    .sort((left, right) => right.normalizedWeight - left.normalizedWeight || left.subjectLabel.localeCompare(right.subjectLabel, "pt-BR"));
}

export function mapTemplateSubjects(subjectTemplates = []) {
  return subjectTemplates.map((subject) => ({
    id: subject.key,
    name: getSubjectLabel(subject.key, subject.label),
  }));
}
