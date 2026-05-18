"use client";
import "./Blueprint.css";

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
    <div className="glass p-sm max-w-xs">
      <div className="relative mb-sm">
        <input 
          className="input-premium pl-xl text-sm"
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={16} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-on-surface-variant" />
      </div>

      <div className="icon-picker-grid">
        {filteredIcons.map(iconName => {
          const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[iconName] || Icons.HelpCircle;
          const isActive = currentIcon === iconName;

          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelect(iconName)}
              title={iconName}
              className={`icon-picker-button ${isActive ? 'active' : ''}`}
              style={{ '--node-color': color } as React.CSSProperties}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper to render icon by name
export function IconRenderer({ name, size = 20, color }: Readonly<{ name: string; size?: number; color?: string }>) {
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] || Icons.HelpCircle;
  return <Icon size={size} color={color} />;
}
