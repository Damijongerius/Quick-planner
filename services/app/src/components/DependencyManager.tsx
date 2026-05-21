"use client";

import React from "react";
import { Trash } from "lucide-react";
import { Select } from "./ui/Select";

import { Node } from "@/lib/types";

interface Dependency {
  id: string;
  blockingNode: {
    id: string;
    title: string;
  };
}

interface DependencyManagerProps {
  dependencies: Dependency[];
  allNodes: Node[];
  currentNodeId: string;
  onAdd: (blockingId: string) => void;
  onRemove: (depId: string) => void;
}

export function DependencyManager({ dependencies, allNodes, currentNodeId, onAdd, onRemove }: Readonly<DependencyManagerProps>) {
  const eligibleNodes = allNodes.filter((n: Node) => {
    const isSelf = n.id === currentNodeId;
    const isAlreadyDep = dependencies?.some((d: Dependency) => d.blockingNode?.id === n.id);
    return !isSelf && !isAlreadyDep;
  });

  const options = [
    { value: "none", label: "+ ADD BLOCKING NODE" },
    ...eligibleNodes.map((n: Node) => ({ value: n.id, label: n.title }))
  ];

  return (
    <div className="timeline-container" style={{ gridTemplateColumns: '1fr' }}>
      <label htmlFor="dependency-select" className="text-meta block mb-xs">Dependencies</label>
      
      <div className="flex flex-col gap-sm">
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
          <p className="dependency-empty-text text-left w-full m-0 p-0 mb-sm">No active dependencies.</p>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: '240px' }}>
        <Select 
          options={options}
          value="none"
          onChange={onAdd}
          triggerClassName="w-full font-semibold"
        />
      </div>
    </div>
  );
}
