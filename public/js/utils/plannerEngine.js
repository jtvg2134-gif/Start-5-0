import { clamp } from "./textHelpers.js";

const MIN_BLOCK_MINUTES = 20;
const IDEAL_BLOCK_MINUTES = 45;

function sortDaysByCapacity(weekdayMinutes = {}, studyDays = []) {
  return [...studyDays].sort((left, right) => {
    const leftMinutes = Number(weekdayMinutes[String(left)] || 0);
    const rightMinutes = Number(weekdayMinutes[String(right)] || 0);

    return rightMinutes - leftMinutes || left - right;
  });
}

function priorityFromMinutes(minutes) {
  if (minutes >= 110) return "alta";
  if (minutes >= 60) return "media";
  return "base";
}

export function buildWeeklyPlanPreview({
  weightedSubjects = [],
  weekdayMinutes = {},
  studyDays = [],
  weekdayLabels = [],
}) {
  const orderedDays = sortDaysByCapacity(weekdayMinutes, studyDays);
  const weeklyCapacity = orderedDays.reduce(
    (sum, dayIndex) => sum + Number(weekdayMinutes[String(dayIndex)] || 0),
    0
  );

  if (!weeklyCapacity || !weightedSubjects.length) {
    return {
      weeklyCapacity: 0,
      activeDays: studyDays.length,
      averageActiveDayMinutes: 0,
      subjectPlan: [],
      dailyPlan: {},
    };
  }

  const subjectPlan = weightedSubjects
    .map((entry) => {
      const rawMinutes = Math.round(entry.normalizedWeight * weeklyCapacity);
      const minutes = clamp(rawMinutes, MIN_BLOCK_MINUTES, weeklyCapacity);

      return {
        subjectKey: entry.subjectKey,
        subjectLabel: entry.subjectLabel,
        customSubjectName: entry.customSubjectName || "",
        minutes,
        priority: priorityFromMinutes(minutes),
        normalizedWeight: entry.normalizedWeight,
      };
    })
    .sort((left, right) => right.minutes - left.minutes);

  const dailyPlan = Object.fromEntries(
    weekdayLabels.map((label, index) => [
      label.toLowerCase(),
      {
        dayIndex: index,
        label,
        capacityMinutes: Number(weekdayMinutes[String(index)] || 0),
        blocks: [],
      },
    ])
  );

  const mutableDayQueue = orderedDays.map((dayIndex) => ({
    dayIndex,
    remainingMinutes: Number(weekdayMinutes[String(dayIndex)] || 0),
  }));

  subjectPlan.forEach((subject) => {
    let remainingMinutes = subject.minutes;

    mutableDayQueue.sort((left, right) => right.remainingMinutes - left.remainingMinutes);

    for (const day of mutableDayQueue) {
      if (remainingMinutes <= 0) {
        break;
      }

      if (day.remainingMinutes < MIN_BLOCK_MINUTES) {
        continue;
      }

      const suggestedBlock = Math.min(
        remainingMinutes,
        Math.max(MIN_BLOCK_MINUTES, Math.min(IDEAL_BLOCK_MINUTES, day.remainingMinutes))
      );
      const label = weekdayLabels[day.dayIndex]?.toLowerCase();

      dailyPlan[label]?.blocks.push({
        subjectKey: subject.subjectKey,
        subjectLabel: subject.subjectLabel,
        minutes: suggestedBlock,
      });

      remainingMinutes -= suggestedBlock;
      day.remainingMinutes -= suggestedBlock;
    }
  });

  return {
    weeklyCapacity,
    activeDays: studyDays.length,
    averageActiveDayMinutes: Math.round(weeklyCapacity / Math.max(1, studyDays.length)),
    subjectPlan,
    dailyPlan,
  };
}
