"use client";

const PLANNER_PALETTE = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981",
  "#06b6d4", "#6366f1", "#f43f5e", "#84cc16", "#a855f7", "#64748b",
];

interface PlannerColorPickerProps {
  currentColor: string;
  onSelect: (color: string) => void;
}

export function PlannerColorPicker({ currentColor, onSelect }: Readonly<PlannerColorPickerProps>) {
  const isCustomColor = !!currentColor && !PLANNER_PALETTE.includes(currentColor);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PLANNER_PALETTE.map((color) => {
        const isActive = currentColor === color;
        return (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(color)}
            aria-label={`Use colour ${color}`}
            aria-pressed={isActive}
            className={`h-6 w-6 rounded-full transition-transform hover:scale-110 ${isActive ? "ring-2 ring-offset-2 ring-offset-panel" : ""}`}
            style={{ background: color, ["--tw-ring-color" as string]: color }}
          />
        );
      })}

      <label
        className={`relative h-6 w-6 cursor-pointer overflow-hidden rounded-full transition-transform hover:scale-110 ${isCustomColor ? "ring-2 ring-offset-2 ring-offset-panel" : ""}`}
        style={{ background: isCustomColor ? currentColor : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)", ["--tw-ring-color" as string]: currentColor }}
        title="Custom colour"
      >
        <input type="color" value={currentColor || "#3b82f6"} onChange={(e) => onSelect(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Custom colour" />
      </label>
    </div>
  );
}
