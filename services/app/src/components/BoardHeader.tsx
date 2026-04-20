"use client";

import { LayoutGrid, Calendar, ChevronRight, ChevronLeft, Filter } from "lucide-react";
import { IconRenderer } from "./IconPicker";

interface BoardHeaderProps {
  sprints: any[];
  nodeTypes: any[];
  selectedSprintId: string | null;
  selectedNodeTypeIds: string[];
  viewMode: string;
  onSprintChange: (id: string) => void;
  onNodeTypeToggle: (id: string) => void;
  onViewModeChange: (mode: string) => void;
}

export function BoardHeader({
  sprints,
  nodeTypes,
  selectedSprintId,
  selectedNodeTypeIds,
  viewMode,
  onSprintChange,
  onNodeTypeToggle,
  onViewModeChange
}: BoardHeaderProps) {
  const currentIndex = sprints.findIndex(s => s.id === selectedSprintId);
  const selectedSprint = sprints[currentIndex];

  const handlePrev = () => {
    if (currentIndex > 0) {
        onSprintChange(sprints[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < sprints.length - 1) {
        onSprintChange(sprints[currentIndex + 1].id);
    }
  };

  return (
    <div style={{ marginBottom: '48px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          color: 'var(--primary)', 
          fontWeight: 700, 
          letterSpacing: '0.1em', 
          fontSize: '10px', 
          textTransform: 'uppercase' 
        }}>
          <span>Strategic Roadmap</span>
          <span style={{ width: '16px', height: '1px', backgroundColor: 'rgba(70, 86, 184, 0.3)' }}></span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <button 
                onClick={handlePrev}
                disabled={currentIndex <= 0 || sprints.length === 0}
                className="button-secondary"
                style={{ padding: '4px', border: 'none', background: 'transparent', opacity: (currentIndex <= 0) ? 0.3 : 1 }}
             >
                <ChevronLeft size={14} />
             </button>
             
             <span style={{ minWidth: '120px', textAlign: 'center', fontSize: '11px' }}>
                {selectedSprint?.name || 'No Cycles Defined'}
             </span>

             <button 
                onClick={handleNext}
                disabled={currentIndex >= sprints.length - 1 || sprints.length === 0}
                className="button-secondary"
                style={{ padding: '4px', border: 'none', background: 'transparent', opacity: (currentIndex >= sprints.length - 1) ? 0.3 : 1 }}
             >
                <ChevronRight size={14} />
             </button>
          </div>
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--on-surface)', margin: 0 }}>
          Sprint Board
        </h2>
      </div>

      {/* Multi-select Node Type Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: 'var(--surface-container)', borderRadius: '9999px', overflowX: 'auto', maxWidth: '100%' }}>
          <button 
            onClick={() => onNodeTypeToggle("all")}
            className="button-secondary"
            style={{ 
                border: 'none', 
                fontSize: '11px', 
                fontWeight: 700,
                padding: '8px 16px',
                backgroundColor: selectedNodeTypeIds.length === 0 ? 'var(--surface-container-lowest)' : 'transparent',
                color: selectedNodeTypeIds.length === 0 ? 'var(--primary)' : 'var(--on-surface-variant)',
                boxShadow: selectedNodeTypeIds.length === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
              ALL TYPES
          </button>
          {nodeTypes.map(type => {
              const isSelected = selectedNodeTypeIds.includes(type.id);
              return (
                  <button 
                    key={type.id}
                    onClick={() => onNodeTypeToggle(type.id)}
                    className="button-secondary"
                    style={{ 
                        border: 'none', 
                        fontSize: '11px', 
                        fontWeight: 700,
                        padding: '8px 16px',
                        backgroundColor: isSelected ? 'var(--surface-container-lowest)' : 'transparent',
                        color: isSelected ? type.color : 'var(--on-surface-variant)',
                        boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                  >
                      <IconRenderer name={type.icon} size={14} color={isSelected ? type.color : 'var(--on-surface-variant)'} />
                      {type.name.toUpperCase()}
                  </button>
              );
          })}
      </div>

      <div style={{ 
        backgroundColor: 'var(--surface-container)', 
        padding: '4px', 
        borderRadius: '9999px', 
        display: 'flex' 
      }}>
        <button 
          onClick={() => onViewModeChange("KANBAN")}
          className={`button-secondary ${viewMode === 'KANBAN' ? 'active' : ''}`}
          style={{ 
            border: 'none', 
            padding: '8px 24px', 
            backgroundColor: viewMode === 'KANBAN' ? 'var(--surface-container-lowest)' : 'transparent',
            color: viewMode === 'KANBAN' ? 'var(--primary)' : 'var(--on-surface-variant)',
            boxShadow: viewMode === 'KANBAN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            fontWeight: viewMode === 'KANBAN' ? 700 : 500,
            fontSize: '13px'
          }}
        >
          <LayoutGrid size={18} style={{ marginRight: '8px' }} />
          Board View
        </button>
        <button 
          onClick={() => onViewModeChange("GANTT")}
          className={`button-secondary ${viewMode === 'GANTT' ? 'active' : ''}`}
          style={{ 
            border: 'none', 
            padding: '8px 24px', 
            backgroundColor: viewMode === 'GANTT' ? 'var(--surface-container-lowest)' : 'transparent',
            color: viewMode === 'GANTT' ? 'var(--primary)' : 'var(--on-surface-variant)',
            boxShadow: viewMode === 'GANTT' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            fontWeight: viewMode === 'GANTT' ? 700 : 500,
            fontSize: '13px'
          }}
        >
          <Calendar size={18} style={{ marginRight: '8px' }} />
          Gantt View
        </button>
      </div>
    </div>
  );
}
