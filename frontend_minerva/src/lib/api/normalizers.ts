export function budgetLabel(value: any): string {
  return value.name || `${value.year} - ${value.category} - ${value.management_center?.name || ''}`.replace(/ - $/, '');
}
export function budgetLineLabel(value: any): string {
  return value.name || value.summary_description || value.object || `Linha #${value.id}`;
}
export function normalizeBudgetLine(value: any): any {
  const ref = (item: any, name?: string) => typeof item === 'number' ? { id: item, name: name || `#${item}` } : item;
  return { ...value,
    budget: typeof value.budget === 'number' ? { id: value.budget, ...value.budget_info, name: value.budget_info ? budgetLabel(value.budget_info) : `Orçamento #${value.budget}` } : value.budget,
    management_center: ref(value.management_center, value.management_center_name),
    requesting_center: ref(value.requesting_center, value.requesting_center_name),
    main_fiscal: typeof value.main_fiscal === 'number' ? { id: value.main_fiscal, full_name: value.main_fiscal_name } : value.main_fiscal,
    secondary_fiscal: typeof value.secondary_fiscal === 'number' ? { id: value.secondary_fiscal, full_name: value.secondary_fiscal_name } : value.secondary_fiscal,
  };
}
export function normalizeContract(value: any): any {
  return { ...value,
    main_inspector: typeof value.main_inspector === 'number' ? value.main_inspector_detail || { id: value.main_inspector } : value.main_inspector,
    substitute_inspector: typeof value.substitute_inspector === 'number' ? value.substitute_inspector_detail || { id: value.substitute_inspector } : value.substitute_inspector,
    budget_line: typeof value.budget_line === 'number' ? { id: value.budget_line, name: `Linha #${value.budget_line}` } : value.budget_line,
  };
}

export function normalizeAid(value: any): any {
  return { ...value, budget_line: value.budget_line ? {
    ...normalizeBudgetLine(value.budget_line), name: budgetLineLabel(value.budget_line),
  } : null };
}
