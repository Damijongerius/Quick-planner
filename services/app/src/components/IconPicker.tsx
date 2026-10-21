"use client";

import * as Icons from "lucide-react";
import { Search } from "lucide-react";
import { useState } from "react";

const ICON_LIST = [
  "Target", "Zap", "Star", "BookOpen", "Bookmark", "Briefcase", "CheckSquare", 
  "Circle", "Clipboard", "Code", "Flag", "Folder", "Inbox", "Layers", "Layout", 
  "List", "MessageSquare", "Milestone", "Package", "PieChart", "Search", "Settings", 
  "Shield", "Tag", "Trophy", "User", "GanttChartSquare", "KanbanSquare",
  "Bug", "AlertCircle", "AlertTriangle", "Clock", "Calendar", "Check", "Bell",
  "Rocket", "Lightbulb", "Flame", "Hammer", "Wrench", "Compass", "Key", 
  "ShieldAlert", "Cpu", "Network", "Globe", "MapPin", "Eye", "FileText", 
  "Files", "Database", "Cloud", "Sun", "Moon", "CloudLightning", "Coffee",
  "Github", "Play", "Repeat", "Volume2", "Mic", "Camera", "Headphones",
  "Mail", "Phone", "Smartphone", "Monitor", "Link", "Share", "RefreshCw",
  "ArrowUpRight", "TrendingUp", "TrendingDown", "Activity", "Heart", "Smile"
];

interface IconPickerProps {
  readonly currentIcon: string;
  readonly onSelect: (iconName: string) => void;
  readonly color?: string;
}

export function IconPicker({ currentIcon, onSelect, color = "#3b82f6" }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = ICON_LIST.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          className="input-planner !pl-8"
          placeholder="Search icons…"
          aria-label="Search icons"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto pr-1">
        {filteredIcons.map(iconName => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName] || Icons.HelpCircle;
          const isActive = currentIcon === iconName;

          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelect(iconName)}
              title={iconName}
              aria-label={iconName}
              aria-pressed={isActive}
              className={`flex aspect-square items-center justify-center rounded-md border transition-colors ${isActive ? "" : "border-transparent text-muted hover:bg-hover hover:text-fg"}`}
              style={isActive ? { color, borderColor: color, background: `color-mix(in srgb, ${color} 14%, transparent)` } : undefined}
            >
              <Icon size={16} />
            </button>
          );
        })}
        {filteredIcons.length === 0 && <p className="col-span-8 py-3 text-center text-xs text-faint">No icons match.</p>}
      </div>
    </div>
  );
}

// Helper to render icon by name
export function IconRenderer({ name, size = 20, color }: Readonly<{ name: string; size?: number; color?: string }>) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] || Icons.HelpCircle;
  return <Icon size={size} color={color} />;
}
