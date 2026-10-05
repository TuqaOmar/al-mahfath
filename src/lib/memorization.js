// Self declarations are planning/progress input, never teacher certification.
export function declaredPages(user) {
  const pages = user?.preferences?.studentDeclaredPages;
  return Array.isArray(pages) ? [...new Set(pages.filter(page =>
    Number.isInteger(page) && page >= 1 && page <= 604))].sort((a, b) => a - b) : [];
}

export function nextDeclaredPage(user) {
  const pages = new Set(declaredPages(user));
  for (let page = 1; page <= 604; page++) if (!pages.has(page)) return page;
  return 604;
}
