"use client";

import React from "react";
import { Trash } from "lucide-react";

interface Dependency {
  id: string;
  blockingNode: {
    id: string;
    title: string;
  };
}

interface DependencyManagerProps {
  dependencies: Dependency[];
  allNodes: any[];
  currentNodeId: string;
  onAdd: (blockingId: string) => void;
  onRemove: (depId: string) => void;
}

export function DependencyManager({ dependencies, allNodes, currentNodeId, onAdd, onRemove }: DependencyManagerProps) {
  return (
    <div className="timeline-container">
      <label className="text-meta block mb-lg">Dependencies</label>
      
      <div className="flex flex-col gap-sm mb-lg">
        {dependencies?.map((dep) => (
          <div key={dep.id} className="dependency-item">
            <span className="dependency-title">{dep.blockingNode?.title}</span>
            <button 
              onClick={() => onRemove(dep.id)}
              className="dependency-remove-btn"
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        {(!dependencies || dependencies.length === 0) && (
          <p className="dependency-empty-text">No active dependencies.</p>
        )}
      </div>

      <select 
        className="dependency-selector button-secondary w-full text-meta"
        value="none"
        onChange={(e) => onAdd(e.target.value)}
      >
        <option value="none">+ ADD BLOCKING NODE</option>
        {allNodes
          .filter((n: any) => n.id !== currentNodeId && !dependencies?.some((d: any) => d.blockingNode?.id === n.id))
          .map((n: any) => (
            <option key={n.id} value={n.id}>{n.title}</option>
          ))
        }
      </select>
    </div>
  );
}
