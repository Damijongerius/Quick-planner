"use client";

import { LayoutGrid, Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { IconRenderer } from "./IconPicker";
import { SegmentedControl } from "./ui/SegmentedControl";
import { Button } from "./ui/Button";

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
  const currentIndex = getSprintIndex(sprints, selectedSprintId);
  const selectedSprint = sprints[currentIndex];

  return (
    <div className="board-header">
      <div className="flex flex-col gap-xs">
        <div className="board-header-meta">
          <span>Strategic Roadmap</span>
          <span className="board-header-divider"></span>
          
          <div className="flex items-center gap-xs">
             <Button variant="ghost" size="sm" onClick={() => handlePrev(currentIndex, sprints, onSprintChange)} disabled={isFirstSprint(currentIndex)} className="p-xs">
               <ChevronLeft size={14} />
             </Button>
             <span className="board-sprint-nav-title">{selectedSprint?.name || 'No Cycles Defined'}</span>
             <Button variant="ghost" size="sm" onClick={() => handleNext(currentIndex, sprints, onSprintChange)} disabled={isLastSprint(currentIndex, sprints.length)} className="p-xs">
               <ChevronRight size={14} />
             </Button>
          </div>
        </div>
        <h2 className="board-title">Sprint Board</h2>
      </div>

      <TypeFilterList 
        nodeTypes={nodeTypes} 
        selectedNodeTypeIds={selectedNodeTypeIds} 
        onToggle={onNodeTypeToggle} 
      />

      <SegmentedControl 
        options={[
            { id: 'KANBAN', label: 'Board View', icon: <LayoutGrid size={18} /> },
            { id: 'GANTT', label: 'Gantt View', icon: <Calendar size={18} /> }
        ]}
        value={viewMode}
        onChange={onViewModeChange}
      />
    </div>
  );
}

// --- Implementation Details (The Prose) ---

function handlePrev(currentIndex: number, sprints: any[], onSprintChange: Function) {
  if (currentIndex > 0) onSprintChange(sprints[currentIndex - 1].id);
}

function handleNext(currentIndex: number, sprints: any[], onSprintChange: Function) {
  if (currentIndex < sprints.length - 1) onSprintChange(sprints[currentIndex + 1].id);
}

function TypeFilterList({ nodeTypes, selectedNodeTypeIds, onToggle }: any) {
  return (
    <div className="chip-group">
      <Button 
        variant="ghost" size="sm" onClick={() => onToggle("all")}
        className={`chip-item ${selectedNodeTypeIds.length === 0 ? 'active' : ''}`}
      >
          ALL TYPES
      </Button>
      {nodeTypes.map((type: any) => (
        <TypeChip 
          key={type.id} 
          type={type} 
          isSelected={selectedNodeTypeIds.includes(type.id)} 
          onToggle={onToggle} 
        />
      ))}
    </div>
  );
}

function TypeChip({ type, isSelected, onToggle }: any) {
  return (
    <Button 
      variant="ghost" size="sm" onClick={() => onToggle(type.id)}
      icon={<IconRenderer name={type.icon} size={14} color={isSelected ? type.color : 'var(--on-surface-variant)'} />}
      className={`chip-item ${isSelected ? 'active' : ''}`}
      style={isSelected ? { color: type.color } : {}}
    >
        {type.name.toUpperCase()}
    </Button>
  );
}

function getSprintIndex(sprints: any[], selectedId: string | null) {
  return sprints.findIndex(s => s.id === selectedId);
}

function isFirstSprint(index: number) {
  return index <= 0;
}

function isLastSprint(index: number, total: number) {
  return total === 0 || index >= total - 1;
}
