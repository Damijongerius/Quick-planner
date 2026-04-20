"use client";

import { LayoutGrid, ListTodo, Calendar } from "lucide-react";

interface BoardHeaderProps {
  sprints: any[];
  nodeTypes: any[];
  selectedSprintId: string | null;
  selectedNodeTypeId: string;
  viewMode: string;
  onSprintChange: (id: string) => void;
  onNodeTypeChange: (id: string) => void;
  onViewModeChange: (mode: string) => void;
}

export function BoardHeader({
  sprints,
  nodeTypes,
  selectedSprintId,
  selectedNodeTypeId,
  viewMode,
  onSprintChange,
  onNodeTypeChange,
  onViewModeChange
}: BoardHeaderProps) {
  return (
    <header className="glass" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' }}>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        {/* Sprint Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Sprint</label>
          <select 
            className="input-premium"
            style={{ padding: '6px 12px', fontSize: '0.875rem', minWidth: '180px' }}
            value={selectedSprintId || ""}
            onChange={(e) => onSprintChange(e.target.value)}
          >
            {sprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <div style={{ width: '1px', height: '32px', backgroundColor: 'rgba(255,255,255,0.05)' }} />

        {/* Node Type Filter */}
        <div>
          <label style={{ display: 'block', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>Filter by Type</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onNodeTypeChange("all")}
              className="button-premium"
              style={{ 
                padding: '6px 16px', 
                fontSize: '0.75rem', 
                backgroundColor: selectedNodeTypeId === 'all' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderColor: selectedNodeTypeId === 'all' ? '#3b82f6' : 'rgba(255,255,255,0.05)'
              }}
            >
              All Types
            </button>
            {nodeTypes.map(type => (
              <button 
                key={type.id}
                onClick={() => onNodeTypeChange(type.id)}
                className="button-premium"
                style={{ 
                  padding: '6px 16px', 
                  fontSize: '0.75rem', 
                  backgroundColor: selectedNodeTypeId === type.id ? `${type.color}20` : 'transparent',
                  borderColor: selectedNodeTypeId === type.id ? type.color : 'rgba(255,255,255,0.05)',
                  color: selectedNodeTypeId === type.id ? type.color : '#d1d5db'
                }}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div style={{ display: 'flex', gap: '4px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px' }}>
        <button 
          onClick={() => onViewModeChange("KANBAN")}
          className="button-premium"
          title="Kanban Board"
          style={{ 
            padding: '8px', 
            backgroundColor: viewMode === 'KANBAN' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <LayoutGrid size={18} style={{ color: viewMode === 'KANBAN' ? '#3b82f6' : '#6b7280' }} />
        </button>
        <button 
          onClick={() => onViewModeChange("SWIMLANE")}
          className="button-premium"
          title="Swimlane Board"
          style={{ 
            padding: '8px', 
            backgroundColor: viewMode === 'SWIMLANE' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <ListTodo size={18} style={{ color: viewMode === 'SWIMLANE' ? '#3b82f6' : '#6b7280' }} />
        </button>
        <button 
          onClick={() => onViewModeChange("GANTT")}
          className="button-premium"
          title="Gantt Timeline"
          style={{ 
            padding: '8px', 
            backgroundColor: viewMode === 'GANTT' ? 'rgba(255,255,255,0.05)' : 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <Calendar size={18} style={{ color: viewMode === 'GANTT' ? '#3b82f6' : '#6b7280' }} />
        </button>
      </div>
    </header>
  );
}
