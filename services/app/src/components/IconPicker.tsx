"use client";

import * as Icons from "lucide-react";
import { Search } from "lucide-react";
import { useState } from "react";

const ICON_LIST = [
  "Target", "Zap", "Star", "BookOpen", "Bookmark", "Briefcase", "CheckSquare", 
  "Circle", "Clipboard", "Code", "Flag", "Folder", "Inbox", "Layers", "Layout", 
  "List", "MessageSquare", "Milestone", "Package", "PieChart", "Search", "Settings", 
  "Shield", "Tag", "Trophy", "User", "GanttChartSquare", "KanbanSquare"
];

interface IconPickerProps {
  currentIcon: string;
  onSelect: (iconName: string) => void;
  color?: string;
}

export function IconPicker({ currentIcon, onSelect, color = "#3b82f6" }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = ICON_LIST.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass" style={{ padding: '16px', maxWidth: '320px' }}>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input 
          className="input-premium"
          style={{ paddingLeft: '32px', fontSize: '0.875rem' }}
          placeholder="Search icons..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: '8px', 
        maxHeight: '200px', 
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {filteredIcons.map(iconName => {
          const Icon = (Icons as any)[iconName] || Icons.HelpCircle;
          const isActive = currentIcon === iconName;

          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onSelect(iconName)}
              title={iconName}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isActive ? color : 'rgba(255,255,255,0.05)',
                backgroundColor: isActive ? `${color}20` : 'rgba(255,255,255,0.02)',
                color: isActive ? color : '#9ca3af',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper to render icon by name
export function IconRenderer({ name, size = 20, color }: { name: string; size?: number; color?: string }) {
  const Icon = (Icons as any)[name] || Icons.HelpCircle;
  return <Icon size={size} color={color} />;
}
