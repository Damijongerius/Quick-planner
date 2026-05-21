const semanticColors: Record<string, string> = {
  critical: "#ef4444", // Red
  high: "#f97316",     // Orange
  medium: "#eab308",   // Yellow
  low: "#3b82f6",      // Blue
  none: "#94a3b8",     // Slate

  done: "#10b981",       // Emerald
  completed: "#10b981",  // Emerald
  in_progress: "#f97316", // Orange
  todo: "#3b82f6",       // Blue
  "to do": "#3b82f6",    // Blue

  // Time estimation options
  minutes: "#10b981",    // Green (Emerald)
  minute: "#10b981",     // Green
  hours: "#eab308",      // Yellow
  hour: "#eab308",       // Yellow
  days: "#f97316",       // Orange
  day: "#f97316",        // Orange
  weeks: "#ef4444",      // Red
  week: "#ef4444",       // Red
};

const palette = [
  "#ec4899", // Pink
  "#d946ef", // Fuchsia
  "#a855f7", // Purple
  "#6366f1", // Indigo
  "#0ea5e9", // Sky
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#84cc16", // Lime
];

export function getOptionColor(value: string): string {
  if (!value) return "#94a3b8";
  const norm = value.trim().toLowerCase();
  if (semanticColors[norm]) return semanticColors[norm];

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}
