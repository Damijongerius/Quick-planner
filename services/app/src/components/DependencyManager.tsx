"use client";

import React from "react";
import { X, Link2 } from "lucide-react";
import { Select } from "./ui/Select";

import { Node } from "@/lib/types";

interface Dependency {
  id: string;
  blockingNode: {
    id: string;
    title: string;
    status?: string;
  };
}

interface DependencyManagerProps {
  dependencies: Dependency[];
  allNodes: Node[];
  currentNodeId: string;
  onAdd: (blockingId: string) => void;
  onRemove: (depId: string) => void;
  disabled?: boolean;
}

export function DependencyManager({ dependencies, allNodes, currentNodeId, onAdd, onRemove, disabled }: Readonly<DependencyManagerProps>) {
  const eligibleNodes = allNodes.filter((n: Node) => {
    const isSelf = n.id === currentNodeId;
    const isAlreadyDep = dependencies?.some((d: Dependency) => d.blockingNode?.id === n.id);
    return !isSelf && !isAlreadyDep && !n.isArchived;
  });

  const options = [
    { value: "none", label: "Add a blocking item…" },
    ...eligibleNodes.map((n: Node) => ({ value: n.id, label: n.title })),
  ];

  return (
    <div className="flex flex-col gap-2">
      <span className="form-field-label">Blocked by</span>

      {dependencies?.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {dependencies.map((dep) => (
            <li key={dep.id} className="group flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-1.5">
              <Link2 size={13} className="text-faint" />
              <span className="min-w-0 flex-1 truncate text-sm">{dep.blockingNode?.title}</span>
              {!disabled && (
                <button onClick={() => onRemove(dep.id)} className="flex h-5 w-5 items-center justify-center rounded text-faint opacity-0 transition-opacity hover:bg-hover hover:text-danger group-hover:opacity-100 focus-visible:opacity-100" aria-label={`Remove dependency on ${dep.blockingNode?.title}`}>
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-faint">Nothing is blocking this item.</p>
      )}

      {!disabled && <Select options={options} value="none" onChange={onAdd} />}
    </div>
  );
}
