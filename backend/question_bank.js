export const QUESTION_DIFFICULTY_VALUES = ["facil", "media", "dificil"];
export const QUESTION_REVIEW_STATUS_VALUES = ["pending", "approved", "rejected"];
export const QUESTION_PROOF_STATUS_VALUES = ["draft", "review", "published"];
export const QUESTION_PROCESS_STATUS_VALUES = ["pending", "processed", "needs_review"];

export const DEFAULT_QUESTION_BANK_EXAMS = [
  { nome: "ENEM", sigla: "ENEM", descricao: "Exame Nacional do Ensino Medio", ativo: 1 },
  { nome: "Fuvest", sigla: "FUVEST", descricao: "Vestibular da Universidade de Sao Paulo", ativo: 1 },
  { nome: "Unesp", sigla: "UNESP", descricao: "Vestibular da Universidade Estadual Paulista", ativo: 1 },
  { nome: "Unicamp", sigla: "UNICAMP", descricao: "Vestibular da Universidade Estadual de Campinas", ativo: 1 },
  { nome: "UFRGS", sigla: "UFRGS", descricao: "Vestibular da Universidade Federal do Rio Grande do Sul", ativo: 1 },
];

const SUBJECT_KEYWORDS = [
  { materia: "matematica", keywords: ["funcao", "equacao", "geometria", "logaritmo", "trigonometria", "matriz", "porcentagem", "probabilidade", "estatistica", "aritmetica"] },
  { materia: "portugues", keywords: ["interpretacao", "gramatica", "linguagem", "texto", "concordancia", "crase", "sintaxe", "pontuacao", "semantica", "literatura"] },
  { materia: "fisica", keywords: ["velocidade", "movimento", "forca", "energia", "eletrica", "circuito", "optica", "onda", "aceleracao", "gravidade"] },
  { materia: "quimica", keywords: ["reacao", "mol", "estequiometria", "acido", "base", "ligacao", "organica", "solucao", "ph", "tabela periodica"] },
  { materia: "biologia", keywords: ["ecologia", "genetica", "celula", "evolucao", "fotossintese", "cadeia alimentar", "dna", "bioma", "enzima", "fisiologia"] },
  { materia: "historia", keywords: ["revolucao", "imperio", "colonial", "ditadura", "guerra", "republica", "escravidao", "renascimento", "feudalismo", "industrial"] },
  { materia: "geografia", keywords: ["territorio", "clima", "relevo", "urbanizacao", "globalizacao", "cartografia", "demografia", "migracao", "hidrografia", "agropecuaria"] },
  { materia: "filosofia", keywords: ["etica", "politica", "epistemologia", "aristoteles", "platao", "kant", "razao", "verdade", "existencia", "conhecimento"] },
  { materia: "sociologia", keywords: ["cultura", "sociedade", "capitalismo", "desigualdade", "trabalho", "classe social", "cidadania", "identidade", "instituicao", "violencia"] },
  { materia: "ingles", keywords: ["english", "text", "word", "sentence", "verb", "reading", "language", "translation", "vocabulary", "grammar"] },
];

const THEME_KEYWORDS = [
  { materia: "matematica", tema: "funcao", keywords: ["funcao", "grafico", "dominio", "imagem", "parabola"] },
  { materia: "matematica", tema: "geometria", keywords: ["triangulo", "circunferencia", "area", "volume", "angulo"] },
  { materia: "matematica", tema: "probabilidade", keywords: ["probabilidade", "combinatoria", "arranjo", "permutacao"] },
  { materia: "portugues", tema: "interpretacao de texto", keywords: ["texto", "interprete", "sentido", "trecho", "autor"] },
  { materia: "portugues", tema: "gramatica", keywords: ["concordancia", "crase", "pontuacao", "regencia", "sintaxe"] },
  { materia: "fisica", tema: "cinematica", keywords: ["movimento", "velocidade", "aceleracao", "tempo", "trajetoria"] },
  { materia: "fisica", tema: "eletricidade", keywords: ["corrente", "resistor", "potencia", "tensao", "circuito"] },
  { materia: "quimica", tema: "estequiometria", keywords: ["mol", "massa molar", "reagente", "produto", "balanceamento"] },
  { materia: "quimica", tema: "quimica organica", keywords: ["hidrocarboneto", "alcool", "cadeia", "funcao organica", "carbono"] },
  { materia: "biologia", tema: "ecologia", keywords: ["ecologia", "bioma", "cadeia alimentar", "populacao", "nicho"] },
  { materia: "biologia", tema: "genetica", keywords: ["gene", "alelo", "heranca", "dna", "cromossomo"] },
  { materia: "historia", tema: "revolucao industrial", keywords: ["industrial", "maquina", "fabrica", "burguesia", "trabalho assalariado"] },
  { materia: "historia", tema: "brasil colonia", keywords: ["colonia", "engenho", "metropole", "ouro", "capitania"] },
  { materia: "geografia", tema: "globalizacao", keywords: ["globalizacao", "fluxo", "rede", "mercado mundial", "bloco economico"] },
  { materia: "geografia", tema: "climatologia", keywords: ["clima", "chuva", "massa de ar", "temperatura", "umidade"] },
  { materia: "filosofia", tema: "etica", keywords: ["etica", "moral", "dever", "virtude", "justica"] },
  { materia: "sociologia", tema: "desigualdade social", keywords: ["desigualdade", "classe", "renda", "exclusao", "mobilidade social"] },
  { materia: "ingles", tema: "interpretacao de texto", keywords: ["according to the text", "main idea", "author", "excerpt", "statement"] },
  { materia: "ingles", tema: "gramatica", keywords: ["verb", "tense", "grammar", "modal", "pronoun"] },
];

function normalizeWhitespace(value = "") {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeSearchText(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ");
}

function splitQuestionBlocks(rawText = "") {
  const normalizedText = normalizeWhitespace(rawText);

  if (!normalizedText) {
    return [];
  }

  const blocks = normalizedText.split(/(?=^\s*(?:questao\s*)?\d{1,3}[)\].:-]\s+)/gim);

  if (blocks.length > 1) {
    return blocks.map((block) => block.trim()).filter(Boolean);
  }

  return normalizedText
    .split(/(?=\n\s*(?:questao\s*)?\d{1,3}[)\].:-]\s+)/gim)
    .map((block) => block.trim())
    .filter(Boolean);
}

function parseAlternatives(lines = []) {
  const alternatives = [];
  let currentAlternative = null;

  lines.forEach((line) => {
    const match = /^([A-E])[\)\].:-]\s*(.*)$/i.exec(line);

    if (match) {
      currentAlternative = {
        letra: match[1].toUpperCase(),
        texto: String(match[2] || "").trim(),
      };
      alternatives.push(currentAlternative);
      return;
    }

    if (currentAlternative) {
      currentAlternative.texto = `${currentAlternative.texto} ${String(line || "").trim()}`.trim();
    }
  });

  return alternatives.filter((item) => item.texto);
}

function suggestQuestionMatter(text = "", fallbackMatter = "") {
  const normalizedText = normalizeSearchText(text);

  if (fallbackMatter) {
    const normalizedFallback = normalizeSearchText(fallbackMatter);
    const matchedFallback = SUBJECT_KEYWORDS.find((item) => item.materia === normalizedFallback);

    if (matchedFallback) {
      return matchedFallback.materia;
    }
  }

  let bestMatch = { materia: "", score: 0 };

  SUBJECT_KEYWORDS.forEach((subject) => {
    const score = subject.keywords.reduce(
      (total, keyword) => total + (normalizedText.includes(normalizeSearchText(keyword)) ? 1 : 0),
      0
    );

    if (score > bestMatch.score) {
      bestMatch = { materia: subject.materia, score };
    }
  });

  return bestMatch.score > 0 ? bestMatch.materia : (fallbackMatter || "");
}

function suggestQuestionTheme(text = "", matter = "") {
  const normalizedText = normalizeSearchText(text);
  const normalizedMatter = normalizeSearchText(matter);
  let bestTheme = { tema: "", score: 0 };

  THEME_KEYWORDS.forEach((theme) => {
    if (normalizedMatter && theme.materia !== normalizedMatter) {
      return;
    }

    const score = theme.keywords.reduce(
      (total, keyword) => total + (normalizedText.includes(normalizeSearchText(keyword)) ? 1 : 0),
      0
    );

    if (score > bestTheme.score) {
      bestTheme = { tema: theme.tema, score };
    }
  });

  return bestTheme.score > 0 ? bestTheme.tema : "";
}

function suggestQuestionDifficulty({ prompt = "", alternatives = [] } = {}) {
  const fullText = `${prompt} ${alternatives.map((item) => item.texto).join(" ")}`.trim();
  const wordCount = fullText ? fullText.split(/\s+/g).length : 0;

  if (wordCount >= 170) {
    return "dificil";
  }

  if (wordCount <= 70) {
    return "facil";
  }

  return "media";
}

export function calculateUsageDifficulty(totalAnswers = 0, accuracyRate = 0) {
  if ((Number(totalAnswers) || 0) < 5) {
    return "";
  }

  const safeAccuracy = Number(accuracyRate) || 0;

  if (safeAccuracy >= 0.7) {
    return "facil";
  }

  if (safeAccuracy >= 0.4) {
    return "media";
  }

  return "dificil";
}

export function parseQuestionsFromExtractedText(rawText = "", options = {}) {
  const normalizedText = normalizeWhitespace(rawText);

  if (!normalizedText) {
    return [];
  }

  const fallbackMatter = String(options.fallbackMatter || "").trim().toLowerCase();
  const originLabel = String(options.originLabel || "").trim();

  return splitQuestionBlocks(normalizedText)
    .map((block) => {
      const blockLines = block.split("\n").map((line) => line.trim()).filter(Boolean);

      if (!blockLines.length) {
        return null;
      }

      const questionHeader = blockLines[0];
      const numberMatch = /(\d{1,3})/.exec(questionHeader);
      const number = Number(numberMatch?.[1] || 0) || 0;
      const contentLines = number ? [questionHeader.replace(/^\s*(?:questao\s*)?\d{1,3}[)\].:-]\s*/i, "").trim(), ...blockLines.slice(1)] : blockLines;
      const alternatives = parseAlternatives(contentLines);
      const firstAlternativeIndex = contentLines.findIndex((line) => /^([A-E])[\)\].:-]\s*/i.test(line));
      const promptLines = firstAlternativeIndex >= 0 ? contentLines.slice(0, firstAlternativeIndex) : contentLines;
      const enunciado = normalizeWhitespace(promptLines.join("\n"));
      const fullText = `${enunciado}\n${alternatives.map((item) => `${item.letra}) ${item.texto}`).join("\n")}`.trim();
      const suggestedMatter = suggestQuestionMatter(fullText, fallbackMatter);
      const suggestedTheme = suggestQuestionTheme(fullText, suggestedMatter);
      const suggestedDifficulty = suggestQuestionDifficulty({
        prompt: enunciado,
        alternatives,
      });

      if (!number && !enunciado) {
        return null;
      }

      return {
        numero: number,
        enunciado,
        alternativas: alternatives.length
          ? alternatives
          : [
              { letra: "A", texto: "" },
              { letra: "B", texto: "" },
              { letra: "C", texto: "" },
              { letra: "D", texto: "" },
              { letra: "E", texto: "" },
            ],
        materia: suggestedMatter,
        tema: suggestedTheme,
        dificuldade: suggestedDifficulty,
        sugestaoMateria: suggestedMatter,
        sugestaoTema: suggestedTheme,
        sugestaoDificuldade: suggestedDifficulty,
        respostaCorreta: "",
        statusRevisao: "pending",
        origemPdf: originLabel,
      };
    })
    .filter(Boolean);
}
