export const ADMISSION_CATEGORIES = [
  {
    id: "ac",
    label: "Ampla Concorrencia",
    shortLabel: "AC",
    description: "Modalidade geral sem reserva especifica.",
    goalModifier: 1,
    targetBucket: "ac",
  },
  {
    id: "ep",
    label: "Escola Publica",
    shortLabel: "EP",
    description: "Referencia interna para ingresso por escola publica.",
    goalModifier: 0.94,
    targetBucket: "ep",
  },
  {
    id: "ppi",
    label: "Pretos, Pardos e Indigenas",
    shortLabel: "PPI",
    description: "Refinamento interno para modalidades com recorte racial.",
    goalModifier: 0.9,
    targetBucket: "ppe",
  },
  {
    id: "ep_baixa_renda",
    label: "Escola Publica + Baixa Renda",
    shortLabel: "EP + BR",
    description: "Estimativa interna para escola publica com recorte de renda.",
    goalModifier: 0.9,
    targetBucket: "ppe",
  },
  {
    id: "ep_ppi",
    label: "Escola Publica + PPI",
    shortLabel: "EP + PPI",
    description: "Estimativa interna para escola publica com recorte racial.",
    goalModifier: 0.88,
    targetBucket: "ppe",
  },
  {
    id: "pcd",
    label: "Pessoa com Deficiencia",
    shortLabel: "PcD",
    description: "Estimativa interna para modalidades com reserva PcD.",
    goalModifier: 0.92,
    targetBucket: "ep",
  },
];

export const ADMISSION_CATEGORY_MAP = Object.fromEntries(
  ADMISSION_CATEGORIES.map((category) => [category.id, category])
);

export function getAdmissionCategory(categoryId) {
  return ADMISSION_CATEGORY_MAP[categoryId] || ADMISSION_CATEGORY_MAP.ac;
}
