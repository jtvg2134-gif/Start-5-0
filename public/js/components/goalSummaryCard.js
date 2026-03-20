import { escapeHtml } from "../utils/textHelpers.js";

export function renderGoalSummaryCard({
  course = null,
  category = null,
  exam = null,
  goal = null,
  prioritySubjects = [],
}) {
  if (!course) {
    return {
      title: "Meta do curso",
      scaleLabel: "Aguardando curso",
      html: `
        <div class="detail-empty">
          Escolha um curso para ativar a leitura estrategica da semana.
        </div>
      `,
      note:
        "Estimativa interna usada para orientar sua rotina. Nao substitui edital, nota de corte, classificacao oficial ou dados reais de aprovacao.",
    };
  }

  if (!category) {
    return {
      title: course.name,
      scaleLabel: "Categoria pendente",
      html: `
        <div class="goal-state-copy">
          Agora selecione a categoria de ingresso para refinar a meta interna da sua rotina.
        </div>
      `,
      note:
        "Estimativa interna usada para orientar sua rotina. Nao substitui edital, nota de corte, classificacao oficial ou dados reais de aprovacao.",
    };
  }

  const highlightedSubjects = (prioritySubjects || []).slice(0, 4);

  return {
    title: course.name,
    scaleLabel: goal?.shortTargetLabel || "Meta interna",
    html: `
      <div class="goal-summary-headline">
        <div class="goal-summary-main">
          <strong>${escapeHtml(course.name)}</strong>
          <span>${escapeHtml(category.label)}${category.shortLabel ? ` (${escapeHtml(category.shortLabel)})` : ""}</span>
        </div>
        <div class="goal-summary-secondary">
          ${exam ? `Refinada por ${escapeHtml(exam.name)}` : "Sem vestibular principal definido"}
        </div>
      </div>
      <div class="routine-target-grid">
        <article class="routine-target-card is-active">
          <span class="routine-target-card-label">Faixa interna</span>
          <strong class="routine-target-card-value">${escapeHtml(goal?.rangeLabel || "--")}</strong>
          <p class="routine-target-card-copy">Estimativa de planejamento para sua semana.</p>
        </article>
        <article class="routine-target-card">
          <span class="routine-target-card-label">Eixo do curso</span>
          <strong class="routine-target-card-value">${escapeHtml(course.cluster || course.area || "Geral")}</strong>
          <p class="routine-target-card-copy">${escapeHtml(course.description || "")}</p>
        </article>
        <article class="routine-target-card">
          <span class="routine-target-card-label">Materias-base</span>
          <strong class="routine-target-card-value">${escapeHtml(highlightedSubjects.join(", ") || "Em definicao")}</strong>
          <p class="routine-target-card-copy">Mais pressionadas pela combinacao atual.</p>
        </article>
      </div>
    `,
    note:
      goal?.note ||
      "Estimativa interna usada para orientar sua rotina. Nao substitui edital, nota de corte, classificacao oficial ou dados reais de aprovacao.",
  };
}
