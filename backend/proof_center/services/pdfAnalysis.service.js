import pdf from "pdf-parse";

function toTrimmedString(value) {
  return String(value || "").trim();
}

function normalizeText(value) {
  return toTrimmedString(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function compactText(value) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function buildProofCode(parts = []) {
  return parts
    .map((part) =>
      normalizeText(part)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toUpperCase()
    )
    .filter(Boolean)
    .join("-");
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => toTrimmedString(value)).filter(Boolean))];
}

function detectQuestionCount(text) {
  const matches = [...compactText(text).matchAll(/(?:^|\n|\s)(\d{1,3})\s*[\)\.\-]/g)];
  const numbers = matches.map((match) => Number(match[1])).filter((value) => Number.isInteger(value) && value > 0);

  if (!numbers.length) {
    return null;
  }

  return Math.max(...numbers);
}

function detectBookletColor(text) {
  const normalized = compactText(text);
  const colors = ["azul", "amarelo", "branco", "rosa", "verde", "cinza"];
  return colors.find((color) => normalized.includes(`caderno ${color}`) || normalized.includes(`cor ${color}`)) || null;
}

function detectExamDay(text) {
  const normalized = compactText(text);

  if (/\b1[ºo]?\s*dia\b/.test(normalized) || /\bdia\s*1\b/.test(normalized)) {
    return "D1";
  }

  if (/\b2[ºo]?\s*dia\b/.test(normalized) || /\bdia\s*2\b/.test(normalized)) {
    return "D2";
  }

  return null;
}

function detectYear(text) {
  const match = compactText(text).match(/\b(20\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function detectArea(text) {
  const normalized = compactText(text);
  const areas = [
    ["linguagens", "linguagens"],
    ["matematica", "exatas"],
    ["natureza", "natureza"],
    ["humanas", "humanas"],
    ["exatas", "exatas"],
  ];

  return areas.find(([needle]) => normalized.includes(needle))?.[1] || null;
}

function scoreIncludes(text, value, weight) {
  const normalizedValue = compactText(value);

  if (!normalizedValue) {
    return 0;
  }

  return compactText(text).includes(normalizedValue) ? weight : 0;
}

function buildMatchingDecision(score, lead = 0) {
  if (score >= 78 && lead >= 12) {
    return "automatic";
  }

  if (score >= 52) {
    return "suggested";
  }

  return "manual";
}

function parseAlternatives(block) {
  const alternatives = [];
  const regex = /(?:^|\n)\s*([A-E])\s*[\)\.\-:]\s*(.+?)(?=(?:\n\s*[A-E]\s*[\)\.\-:])|$)/gis;

  for (const match of block.matchAll(regex)) {
    alternatives.push({
      letra: match[1].toUpperCase(),
      texto: toTrimmedString(match[2]),
    });
  }

  return alternatives;
}

function splitQuestionBlocks(text) {
  const source = String(text || "").replace(/\r/g, "");
  const regex = /(?:^|\n)\s*(\d{1,3})\s*[\)\.\-]\s*/g;
  const matches = [...source.matchAll(regex)];

  if (!matches.length) {
    return [];
  }

  return matches.map((match, index) => {
    const start = match.index || 0;
    const end = index + 1 < matches.length ? matches[index + 1].index || source.length : source.length;
    const rawBlock = source.slice(start, end).trim();
    const withoutMarker = rawBlock.replace(/^\s*\d{1,3}\s*[\)\.\-]\s*/, "");
    const alternatives = parseAlternatives(withoutMarker);
    const stem = alternatives.length
      ? withoutMarker.split(/(?:\n)\s*[A-E]\s*[\)\.\-:]/, 1)[0]
      : withoutMarker;

    return {
      questionNumber: Number(match[1]),
      rawBlock,
      stem: toTrimmedString(stem),
      alternatives,
      parsingConfidence: Math.min(
        98,
        42 +
          (alternatives.length >= 4 ? 28 : alternatives.length * 5) +
          (toTrimmedString(stem).length > 120 ? 18 : 8)
      ),
      metadata: {
        alternativesDetected: alternatives.length,
      },
    };
  });
}

export class ProofCenterPdfAnalysisService {
  async extractPdfMetadata(buffer) {
    const parsed = await pdf(buffer);
    const text = String(parsed.text || "").replace(/\u0000/g, " ").trim();
    const normalized = compactText(text);
    const pageCount = Number(parsed.numpages || 0);
    const extractedCharacterCount = text.length;
    const ocrRequired = extractedCharacterCount < 140 || normalized.split(" ").filter(Boolean).length < 40;

    return {
      text,
      pageCount,
      extractedCharacterCount,
      ocrRequired,
      detected: {
        examYear: detectYear(text),
        examDay: detectExamDay(text),
        examArea: detectArea(text),
        bookletColor: detectBookletColor(text),
        expectedQuestionCount: detectQuestionCount(text),
      },
    };
  }

  buildProofCodeFromIdentity(proof = {}) {
    const provider = proof.examProvider || proof.exam_provider || proof.disciplina || proof.area || "";
    const name = proof.examName || proof.exam_name || proof.titulo || "";
    const year = proof.examYear || proof.exam_year || proof.ano || "";
    const day = proof.examDay || proof.exam_day || "";
    const area = proof.subjectGroup || proof.subject_group || proof.examArea || proof.area || "";
    const booklet = proof.bookletColor || proof.booklet_color || "";
    const version = proof.examVersion || proof.exam_version || "";

    return buildProofCode([provider || name, year, day, area, booklet, version]) || null;
  }

  buildMatchCandidates(text, proofs = []) {
    const normalizedText = compactText(text);

    const scored = proofs.map((proof) => {
      let score = 0;
      const aliases = uniqueStrings([...(proof.aliasKeywords || []), proof.proofCode, proof.titulo, proof.examName, proof.examProvider]);

      score += scoreIncludes(normalizedText, proof.examProvider, 22);
      score += scoreIncludes(normalizedText, proof.examName, 24);
      score += scoreIncludes(normalizedText, proof.titulo, 10);
      score += scoreIncludes(normalizedText, proof.bookletColor, 14);
      score += scoreIncludes(normalizedText, proof.subjectGroup, 12);
      score += scoreIncludes(normalizedText, proof.examArea, 14);
      score += scoreIncludes(normalizedText, proof.examDay, 10);
      score += scoreIncludes(normalizedText, proof.examVersion, 8);
      score += scoreIncludes(normalizedText, proof.examLanguage, 5);

      if (proof.examYear && normalizedText.includes(String(proof.examYear))) {
        score += 20;
      }

      const aliasHits = aliases.filter((alias) => alias && normalizedText.includes(compactText(alias))).length;
      score += Math.min(18, aliasHits * 6);

      const detectedCount = detectQuestionCount(text);
      if (proof.expectedQuestionCount && detectedCount && Number(proof.expectedQuestionCount) === Number(detectedCount)) {
        score += 9;
      }

      return {
        proofId: proof.id,
        answerKeyId: proof.activeAnswerKeyId || null,
        proofCode: proof.proofCode || this.buildProofCodeFromIdentity(proof),
        score: Math.min(100, score),
        matchedFields: {
          provider: Boolean(scoreIncludes(normalizedText, proof.examProvider, 1)),
          name: Boolean(scoreIncludes(normalizedText, proof.examName, 1)),
          year: Boolean(proof.examYear && normalizedText.includes(String(proof.examYear))),
          day: Boolean(scoreIncludes(normalizedText, proof.examDay, 1)),
          area: Boolean(scoreIncludes(normalizedText, proof.examArea, 1) || scoreIncludes(normalizedText, proof.subjectGroup, 1)),
          booklet: Boolean(scoreIncludes(normalizedText, proof.bookletColor, 1)),
          version: Boolean(scoreIncludes(normalizedText, proof.examVersion, 1)),
          expectedQuestionCount:
            Boolean(proof.expectedQuestionCount) &&
            Boolean(detectedCount) &&
            Number(proof.expectedQuestionCount) === Number(detectedCount),
        },
      };
    });

    scored.sort((left, right) => right.score - left.score);

    const lead = scored.length > 1 ? scored[0].score - scored[1].score : scored[0]?.score || 0;
    const level = scored.length ? buildMatchingDecision(scored[0].score, lead) : "manual";

    return {
      level,
      topMatch: scored[0] || null,
      candidates: scored.slice(0, 5),
    };
  }

  parseQuestions(text, expectedQuestionCount = null) {
    const questions = splitQuestionBlocks(text);
    const detectedCount = questions.length ? Math.max(...questions.map((item) => item.questionNumber)) : 0;
    const inconsistencies = [];

    if (expectedQuestionCount && detectedCount && Number(expectedQuestionCount) !== Number(detectedCount)) {
      inconsistencies.push(
        `Quantidade detectada (${detectedCount}) diferente da esperada (${expectedQuestionCount}).`
      );
    }

    if (!questions.length) {
      inconsistencies.push("Nao foi possivel segmentar questoes automaticamente a partir do PDF.");
    }

    return {
      questions,
      parsedQuestionCount: questions.length,
      detectedQuestionCount: detectedCount || null,
      inconsistencies,
    };
  }
}
