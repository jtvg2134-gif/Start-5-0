export const EXAM_PROFILES = [
  {
    id: "geral",
    label: "Geral",
    description: "Perfil amplo para distribuicao equilibrada das materias.",
    multiplierAdjustments: {},
  },
  {
    id: "exatas",
    label: "Mais exata",
    description: "Puxa raciocinio quantitativo e materias de resolucao analitica.",
    multiplierAdjustments: {
      matematica: 0.25,
      fisica: 0.18,
      quimica: 0.12,
      redacao: -0.05,
    },
  },
  {
    id: "humanas",
    label: "Mais humana",
    description: "Fortalece leitura, escrita e repertorio historico-social.",
    multiplierAdjustments: {
      redacao: 0.16,
      portugues: 0.14,
      historia: 0.14,
      geografia: 0.12,
      sociologia: 0.1,
      filosofia: 0.1,
    },
  },
  {
    id: "saude",
    label: "Saude",
    description: "Aumenta o peso de biologia, quimica e leitura precisa de prova.",
    multiplierAdjustments: {
      biologia: 0.22,
      quimica: 0.18,
      matematica: 0.08,
      redacao: 0.08,
    },
  },
  {
    id: "linguagens",
    label: "Redacao decisiva",
    description: "Da mais presenca para redacao, portugues e repertorio de linguagem.",
    multiplierAdjustments: {
      redacao: 0.26,
      portugues: 0.16,
      ingles: 0.1,
      historia: 0.04,
    },
  },
  {
    id: "personalizado",
    label: "Personalizado",
    description: "Mantem a base aberta para ajustes manuais.",
    multiplierAdjustments: {},
  },
];

export const EXAM_PROFILE_MAP = Object.fromEntries(EXAM_PROFILES.map((profile) => [profile.id, profile]));

export function buildExamProfiles(trackTemplates = []) {
  return trackTemplates.map((track) => ({
    ...EXAM_PROFILE_MAP[track.key],
    id: track.key,
    label: track.label,
    description: track.description || EXAM_PROFILE_MAP[track.key]?.description || "",
  }));
}
