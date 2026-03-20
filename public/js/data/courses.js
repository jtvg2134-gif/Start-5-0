import { SUBJECTS, getSubjectLabel } from "./subjects.js";

const COURSE_ENRICHMENTS = {
  medicina: {
    area: "Saude",
    cluster: "Medicina e cuidados",
    competitiveness: "muito alta",
    aliases: ["med", "medicina", "curso de medicina"],
    description: "Curso com pressao alta em biologia, quimica, leitura precisa e constancia em redacao.",
  },
  direito: {
    area: "Humanas",
    cluster: "Direito e politica",
    competitiveness: "alta",
    aliases: ["direito", "advocacia", "juridico"],
    description: "Curso com peso forte em redacao, portugues, leitura argumentativa e repertorio de humanas.",
  },
  psicologia: {
    area: "Saude",
    cluster: "Saude e comportamento",
    competitiveness: "alta",
    aliases: ["psicologia", "psi"],
    description: "Mistura leitura, redacao, humanas e uma base biologica importante.",
  },
  fisioterapia: {
    area: "Saude",
    cluster: "Reabilitacao e saude",
    competitiveness: "media-alta",
    aliases: ["fisioterapia", "fisio"],
    description: "Pede constancia em biologia, quimica e escrita clara.",
  },
  ciencia_computacao: {
    area: "Tecnologia",
    cluster: "Computacao e software",
    competitiveness: "alta",
    aliases: ["computacao", "cc", "ciencia da computacao"],
    description: "Curso puxado por matematica, ingles tecnico e raciocinio analitico.",
  },
  engenharia: {
    area: "Engenharias",
    cluster: "Engenharias",
    competitiveness: "alta",
    aliases: ["engenharia", "engenheiro"],
    description: "Base ampla de engenharias, com matematica e fisica no centro da semana.",
  },
};

function derivePrioritySubjects(subjectBoosts = {}) {
  return Object.entries(subjectBoosts)
    .sort((left, right) => Number(right[1] || 0) - Number(left[1] || 0))
    .slice(0, 4)
    .map(([subjectId]) => getSubjectLabel(subjectId))
    .filter(Boolean);
}

function buildBaseWeights(subjectBoosts = {}) {
  const weights = {};

  SUBJECTS.forEach((subject) => {
    weights[subject.name] = Math.round(((Number(subjectBoosts[subject.id]) || 1) * 4) * 10) / 10;
  });

  return weights;
}

function fallbackArea(group = "") {
  if (/saude/i.test(group)) return "Saude";
  if (/linguagens/i.test(group)) return "Linguagens";
  if (/humanas/i.test(group)) return "Humanas";
  if (/negocios/i.test(group)) return "Negocios";
  if (/tecnologia/i.test(group) || /exatas/i.test(group)) return "Exatas";
  return "Geral";
}

export function buildCourses(courseTemplates = []) {
  return courseTemplates.map((course) => {
    const enrichment = COURSE_ENRICHMENTS[course.key] || {};

    return {
      id: course.key,
      name: course.label,
      area: enrichment.area || fallbackArea(course.group),
      cluster: enrichment.cluster || course.group || "Geral",
      prioritySubjects: derivePrioritySubjects(course.subjectBoosts),
      baseWeights: buildBaseWeights(course.subjectBoosts),
      competitiveness: enrichment.competitiveness || (course.featured ? "alta" : "media"),
      aliases: Array.from(new Set([...(course.searchTerms || []), ...(enrichment.aliases || [])])),
      description: enrichment.description || `Curso com foco automatico em ${derivePrioritySubjects(course.subjectBoosts).join(", ") || "disciplinas centrais do vestibular"}.`,
      featured: course.featured === true,
      recommendedTrackKey: course.recommendedTrackKey || "geral",
      subjectBoosts: { ...(course.subjectBoosts || {}) },
      targetScores: { ...(course.targetScores || {}) },
      rawGroup: course.group || "",
    };
  });
}
