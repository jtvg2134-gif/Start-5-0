import { escapeHtml } from "../utils/textHelpers.js";

export function renderSubjectPriorityCard({
  subject,
  manualOptions = [],
  difficultyOptions = [],
}) {
  const manualOptionsMarkup = manualOptions
    .map((option) => `
      <option value="${escapeHtml(option.value)}" ${Number(subject.manualDelta) === Number(option.value) ? "selected" : ""}>
        ${escapeHtml(option.label)}
      </option>
    `)
    .join("");

  const difficultyOptionsMarkup = difficultyOptions
    .map((option) => `
      <option value="${escapeHtml(option.key)}" ${String(subject.difficultyLevel) === option.key ? "selected" : ""}>
        ${escapeHtml(option.label)}
      </option>
    `)
    .join("");

  return `
    <article
      class="routine-subject-row"
      data-subject-key="${escapeHtml(subject.subjectKey)}"
      data-custom-subject-name="${escapeHtml(subject.customSubjectName || "")}"
      data-priority-level="${escapeHtml(subject.priorityLevel || "base")}"
    >
      <div class="routine-subject-main">
        <div class="routine-subject-copy">
          <div class="routine-subject-top">
            <strong class="routine-subject-label">${escapeHtml(subject.subjectLabel)}</strong>
            <span class="routine-subject-badge routine-subject-badge-${escapeHtml(subject.priorityLevel || "base")}">
              ${escapeHtml(subject.priorityCopy || "Base")}
            </span>
          </div>
          <span class="routine-subject-meta">
            Peso automatico ${escapeHtml(subject.weightLabel || "--")} · ${escapeHtml(subject.weightReason || "Distribuido pela combinacao atual.")}
          </span>
        </div>
        ${
          subject.isCustom
            ? `<button type="button" class="routine-remove-button" data-action="remove-custom-subject">Remover</button>`
            : `<span class="routine-subject-sidecopy">${escapeHtml(subject.helperCopy || "")}</span>`
        }
      </div>

      <div class="routine-subject-controls">
        <label class="routine-subject-control">
          <span>Ajuste manual</span>
          <select data-control="manual-delta" aria-label="Ajuste manual de ${escapeHtml(subject.subjectLabel)}">
            ${manualOptionsMarkup}
          </select>
        </label>
        <label class="routine-subject-control">
          <span>Dificuldade</span>
          <select data-control="difficulty-level" aria-label="Dificuldade de ${escapeHtml(subject.subjectLabel)}">
            ${difficultyOptionsMarkup}
          </select>
        </label>
      </div>
    </article>
  `;
}
