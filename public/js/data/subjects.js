export const SUBJECTS = [
  {
    id: "matematica",
    name: "Matematica",
    shortName: "Mat.",
    area: "Exatas",
    aliases: ["matematica", "mat", "matematica basica"],
  },
  {
    id: "portugues",
    name: "Portugues",
    shortName: "Port.",
    area: "Linguagens",
    aliases: ["portugues", "lingua portuguesa", "gramatica"],
  },
  {
    id: "redacao",
    name: "Redacao",
    shortName: "Red.",
    area: "Linguagens",
    aliases: ["redacao", "texto", "dissertacao"],
  },
  {
    id: "ingles",
    name: "Ingles",
    shortName: "Ing.",
    area: "Linguagens",
    aliases: ["ingles", "english", "idioma"],
  },
  {
    id: "biologia",
    name: "Biologia",
    shortName: "Bio.",
    area: "Saude",
    aliases: ["biologia", "bio", "ciencias biologicas"],
  },
  {
    id: "quimica",
    name: "Quimica",
    shortName: "Qui.",
    area: "Saude",
    aliases: ["quimica", "qui", "quimica geral"],
  },
  {
    id: "fisica",
    name: "Fisica",
    shortName: "Fis.",
    area: "Exatas",
    aliases: ["fisica", "fis", "mecanica"],
  },
  {
    id: "historia",
    name: "Historia",
    shortName: "Hist.",
    area: "Humanas",
    aliases: ["historia", "hist", "historia geral"],
  },
  {
    id: "geografia",
    name: "Geografia",
    shortName: "Geo.",
    area: "Humanas",
    aliases: ["geografia", "geo"],
  },
  {
    id: "filosofia",
    name: "Filosofia",
    shortName: "Fil.",
    area: "Humanas",
    aliases: ["filosofia", "fil"],
  },
  {
    id: "sociologia",
    name: "Sociologia",
    shortName: "Soc.",
    area: "Humanas",
    aliases: ["sociologia", "soc"],
  },
];

export const SUBJECT_LABELS = Object.fromEntries(SUBJECTS.map((subject) => [subject.id, subject.name]));

export function getSubjectLabel(subjectId, fallback = "") {
  return SUBJECT_LABELS[subjectId] || fallback || subjectId;
}
