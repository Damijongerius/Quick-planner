export function getGridTemplate(numCols: number): string {
  if (numCols <= 1) return "1fr";
  if (numCols === 2) return "3fr 1.2fr";
  if (numCols === 3) return "3fr 1.2fr 1.2fr";
  return "3fr 1.2fr 1.2fr 1.2fr"; // Dynamic, left-connected grid sizing with strict boundaries
}

export function sortColumns(cols: string[], customFields: string[]): string[] {
  const standardOrder = ['title', 'status', 'sprintId', 'startDate', 'endDate'];
  return [...cols].sort((a, b) => {
    const idxA = standardOrder.indexOf(a);
    const idxB = standardOrder.indexOf(b);

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    const customIdxA = customFields.indexOf(a);
    const customIdxB = customFields.indexOf(b);
    if (customIdxA !== -1 && customIdxB !== -1) return customIdxA - customIdxB;
    if (customIdxA !== -1) return -1;
    if (customIdxB !== -1) return 1;

    return a.localeCompare(b);
  });
}
