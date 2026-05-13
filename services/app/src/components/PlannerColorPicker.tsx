"use client";

const PLANNER_PALETTE = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#64748b"  // Slate
];

interface PlannerColorPickerProps {
  currentColor: string;
  onSelect: (color: string) => void;
}

export function PlannerColorPicker({ currentColor, onSelect }: PlannerColorPickerProps) {
  const isCustomColor = !PLANNER_PALETTE.includes(currentColor);

  return (
    <div className="flex items-center gap-md flex-wrap">
      <div className="grid grid-cols-6 gap-sm">
        {PLANNER_PALETTE.map((color: any) => {
          const isActive = currentColor === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelect(color)}
              className={`color-swatch ${isActive ? 'active' : ''}`}
              style={{ backgroundColor: color, '--node-color': color } as any}
            />
          );
        })}
      </div>

      <div
        className={`custom-color-trigger ${isCustomColor ? 'active' : ''}`}
        style={{ '--node-color': currentColor } as any}
        title="Custom Color"
      >
        <div
          className="custom-color-preview"
          style={isCustomColor ? { backgroundColor: currentColor } : {}}
        />
        <input
          type="color"
          value={currentColor}
          onChange={(e) => onSelect(e.target.value)}
          className="custom-color-input"
        />
      </div>
    </div>
  );
}
