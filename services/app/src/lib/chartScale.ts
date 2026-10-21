/** A round upper bound and evenly spaced ticks for a value axis starting at 0. */
export function niceScale(maxValue: number, targetTicks = 4): { max: number; ticks: number[] } {
  const safe = maxValue > 0 && Number.isFinite(maxValue) ? maxValue : 1;
  const rough = safe / targetTicks;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const residual = rough / magnitude;
  const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
  const max = Math.ceil(safe / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { max, ticks };
}

/** 1200 -> "1.2K"; small numbers stay as they are. */
export function compact(value: number): string {
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}K`;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
