export function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // Align to Monday (1). Sunday (0) goes back 6 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfWeek(date: Date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function generateDays(start: Date, end: Date) {
  const list = []; 
  const curr = new Date(start); 
  const stop = new Date(end);
  let count = 0; 
  while (curr <= stop && count < 180) { 
    list.push(new Date(curr)); 
    curr.setDate(curr.getDate() + 1); 
    count++; 
  }
  return list;
}

export function generateWeeks(start: Date, end: Date) {
  const list = [];
  const curr = new Date(start);
  const stop = new Date(end);
  let count = 0;
  while (curr <= stop && count < 52) {
    list.push(new Date(curr));
    curr.setDate(curr.getDate() + 7);
    count++;
  }
  return list;
}
