import { escapeHtml, normalizeForSearch } from "../utils/textHelpers.js";

function defaultSearchText(option) {
  return [
    option.name,
    option.label,
    option.group,
    option.area,
    ...(option.aliases || []),
  ]
    .map((item) => normalizeForSearch(item))
    .join(" ");
}

export class SearchableSelect {
  constructor(config) {
    this.key = config.key;
    this.root = config.root;
    this.trigger = config.trigger;
    this.valueElement = config.valueElement;
    this.metaElement = config.metaElement;
    this.panel = config.panel;
    this.searchInput = config.searchInput || null;
    this.listElement = config.listElement;
    this.placeholder = config.placeholder || "Selecione";
    this.emptyState = config.emptyState || "Nenhuma opcao encontrada.";
    this.renderMeta = config.renderMeta || (() => "");
    this.renderTitle = config.renderTitle || ((option) => option.name || option.label || "");
    this.onChange = config.onChange || (() => {});
    this.searchText = config.searchText || defaultSearchText;
    this.groupBy = config.groupBy || ((option) => option.group || "");
    this.sortOptions = config.sortOptions || ((options) => [...options]);
    this.valueKey = config.valueKey || "id";
    this.options = [];
    this.filteredOptions = [];
    this.value = "";
    this.open = false;
    this.highlightedIndex = -1;
    this.boundDocumentClick = this.handleDocumentClick.bind(this);
    this.boundKeydown = this.handleKeydown.bind(this);
    this.bind();
  }

  bind() {
    this.trigger?.addEventListener("click", () => this.toggle());
    this.searchInput?.addEventListener("input", () => this.render());
    this.listElement?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-option-value]");

      if (!button) {
        return;
      }

      this.select(button.dataset.optionValue || "");
    });
  }

  setOptions(options = []) {
    this.options = this.sortOptions(options);
    this.render();
  }

  setValue(value) {
    this.value = String(value || "");
    this.renderTrigger();
    this.render();
  }

  getSelectedOption() {
    return this.options.find((option) => String(option[this.valueKey]) === this.value) || null;
  }

  openPanel() {
    this.open = true;
    this.trigger?.setAttribute("aria-expanded", "true");
    if (this.panel) {
      this.panel.hidden = false;
    }
    document.addEventListener("click", this.boundDocumentClick);
    window.addEventListener("keydown", this.boundKeydown);
    this.render();
    queueMicrotask(() => this.searchInput?.focus());
  }

  closePanel() {
    this.open = false;
    this.highlightedIndex = -1;
    this.trigger?.setAttribute("aria-expanded", "false");
    if (this.panel) {
      this.panel.hidden = true;
    }
    document.removeEventListener("click", this.boundDocumentClick);
    window.removeEventListener("keydown", this.boundKeydown);
  }

  toggle() {
    if (this.open) {
      this.closePanel();
      return;
    }

    this.openPanel();
  }

  handleDocumentClick(event) {
    if (!this.root?.contains(event.target)) {
      this.closePanel();
    }
  }

  handleKeydown(event) {
    if (!this.open) {
      return;
    }

    if (event.key === "Escape") {
      this.closePanel();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.highlightedIndex = Math.min(this.filteredOptions.length - 1, this.highlightedIndex + 1);
      this.syncHighlight();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.highlightedIndex = Math.max(0, this.highlightedIndex - 1);
      this.syncHighlight();
      return;
    }

    if (event.key === "Enter" && this.highlightedIndex >= 0) {
      event.preventDefault();
      const option = this.filteredOptions[this.highlightedIndex];

      if (option) {
        this.select(String(option[this.valueKey] || ""));
      }
    }
  }

  syncHighlight() {
    const buttons = [...this.listElement.querySelectorAll("[data-option-value]")];

    buttons.forEach((button, index) => {
      button.classList.toggle("is-highlighted", index === this.highlightedIndex);
      button.setAttribute("aria-selected", index === this.highlightedIndex ? "true" : "false");
    });
  }

  select(value) {
    this.value = String(value || "");
    this.renderTrigger();
    this.onChange(this.value, this.getSelectedOption());
    this.closePanel();
    this.render();
  }

  renderTrigger() {
    const selected = this.getSelectedOption();

    if (!selected) {
      if (this.valueElement) {
        this.valueElement.textContent = this.placeholder;
      }

      if (this.metaElement) {
        this.metaElement.textContent = "";
      }

      return;
    }

    if (this.valueElement) {
      this.valueElement.textContent = this.renderTitle(selected);
    }

    if (this.metaElement) {
      this.metaElement.textContent = this.renderMeta(selected);
    }
  }

  render() {
    const query = normalizeForSearch(this.searchInput?.value || "");
    this.filteredOptions = this.options.filter((option) => !query || this.searchText(option).includes(query));

    if (!this.listElement) {
      this.renderTrigger();
      return;
    }

    if (!this.filteredOptions.length) {
      this.listElement.innerHTML = `<div class="detail-empty">${escapeHtml(this.emptyState)}</div>`;
      this.renderTrigger();
      return;
    }

    const grouped = new Map();

    this.filteredOptions.forEach((option) => {
      const groupLabel = this.groupBy(option) || "Outros";

      if (!grouped.has(groupLabel)) {
        grouped.set(groupLabel, []);
      }

      grouped.get(groupLabel).push(option);
    });

    const markup = [...grouped.entries()]
      .map(([groupLabel, options]) => `
        <div class="routine-picker-group">
          <span class="routine-picker-group-label">${escapeHtml(groupLabel)}</span>
          ${options.map((option) => {
            const optionValue = String(option[this.valueKey] || "");
            const isSelected = optionValue === this.value;

            return `
              <button
                type="button"
                class="routine-picker-option ${isSelected ? "is-selected" : ""}"
                data-option-value="${escapeHtml(optionValue)}"
                aria-selected="${isSelected ? "true" : "false"}"
              >
                <span class="routine-picker-option-title">${escapeHtml(this.renderTitle(option))}</span>
                <span class="routine-picker-option-copy">${escapeHtml(this.renderMeta(option))}</span>
              </button>
            `;
          }).join("")}
        </div>
      `)
      .join("");

    this.listElement.innerHTML = markup;
    this.renderTrigger();
    this.syncHighlight();
  }
}
