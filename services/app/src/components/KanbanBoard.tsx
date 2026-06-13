"use client";

import { useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useProject } from "./ProjectContext";
import { Node, Sprint, NodeType } from "@/lib/types";
import { IconRenderer } from "./IconPicker";
import { KanbanColumn } from "./kanban/KanbanColumn";

import { handleDragEnd } from "./useKanbanDragDrop";
import { NoActiveSprintState, getKanbanColumns } from "./KanbanUtils";

export function KanbanBoard({ 
    projectId, 
    initialSprint, 
    initialNodes, 
    allNodes,
    nodeTypes,
    boardLevelView = "flat",
    rowTypeIds = [],
    cardTypeIds = [],
    onRefresh, 
    onNodeClick 
}: Readonly<{ 
    projectId: string, 
    initialSprint: Sprint | null, 
    initialNodes: Node[], 
    allNodes: Node[],
    nodeTypes: NodeType[],
    boardLevelView?: string,
    rowTypeIds?: string[],
    cardTypeIds?: string[],
    onRefresh: () => void, 
    onNodeClick: (id: string) => void 
}>) {
  const isLayered = boardLevelView !== "flat";
  const rowTypeIdsSet = new Set(rowTypeIds);
  const cardTypeIdsSet = new Set(cardTypeIds);

  const cards = isLayered ? initialNodes.filter(n => cardTypeIdsSet.has(n.nodeTypeId)) : initialNodes;

  const parentNodeIds = new Set(cards.map(node => node.parentLinks?.[0]?.parentNode?.id).filter(Boolean));
  const rows = isLayered
    ? allNodes.filter(node => 
        !node.isArchived &&
        rowTypeIdsSet.has(node.nodeTypeId) &&
        (node.sprintId === initialSprint?.id || parentNodeIds.has(node.id))
      )
    : [];

  const [nodes, setNodes] = useState<Node[]>(cards);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);
  const { isReadOnly } = useProject();

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(cards);
  }

  if (!initialSprint) {
    return <NoActiveSprintState />;
  }

  return (
    <DragDropContext onDragEnd={(result) => !isReadOnly && handleDragEnd(result, { 
      projectId, nodes, setNodes, initialNodes: cards, allNodes, isLayered, onRefresh 
    })}>
        {isLayered ? (
          <div className="flex flex-col gap-lg w-full">
            <div className="kanban-grid mb-xs">
              {getKanbanColumns().map((col) => {
                const totalCount = nodes.filter((t) => t.status === col.id).length;
                return (
                  <div key={col.id} className="flex items-center gap-md px-md py-sm">
                    <div className="status-dot" style={{ '--dot-color': col.color } as React.CSSProperties}></div>
                    <h3 className="kanban-column-title">{col.title}</h3>
                    <span className="kanban-column-count">{totalCount}</span>
                  </div>
                );
              })}
            </div>

            {rows.map((rowNode) => (
              <div key={rowNode.id} className="w-full">
                <div 
                  onClick={() => onNodeClick(rowNode.id)}
                  className="flex items-center justify-between p-md bg-container-low rounded-xl border border-outline-variant hover:border-primary cursor-pointer transition-all mt-md mb-md"
                >
                  <div className="flex items-center gap-md">
                    <div className="text-node-color animate-pulse-subtle" style={{ '--node-color': rowNode.type.color || 'var(--primary)' } as React.CSSProperties}>
                      <IconRenderer name={rowNode.type.icon || 'Target'} size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: rowNode.type.color || undefined }}>
                      {rowNode.type.name}
                    </span>
                    <span className="board-header-divider"></span>
                    <h3 className="text-sm font-bold text-on-surface">{rowNode.title}</h3>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-sm py-xs rounded-full">
                      {rowNode.status}
                    </span>
                  </div>
                </div>

                <div className="kanban-grid">
                  {getKanbanColumns().map((col) => (
                    <KanbanColumn 
                      key={`${col.id}:${rowNode.id}`} 
                      id={`${col.id}:${rowNode.id}`} 
                      title={col.title} 
                      color={col.color} 
                      onNodeClick={onNodeClick}
                      tasks={nodes.filter((t) => t.status === col.id && t.parentLinks?.[0]?.parentNode?.id === rowNode.id)} 
                      isReadOnly={isReadOnly}
                      hideHeader
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="w-full">
              <div className="flex items-center justify-between p-md bg-container-low rounded-xl border border-dashed border-outline-variant mt-xl mb-md">
                <div className="flex items-center gap-md">
                  <div className="text-on-surface-variant opacity-60">
                    <IconRenderer name="HelpCircle" size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-on-surface opacity-60">Unparented Items</h3>
                </div>
              </div>

              <div className="kanban-grid">
                {getKanbanColumns().map((col) => (
                  <KanbanColumn 
                    key={`${col.id}:unparented`} 
                    id={`${col.id}:unparented`} 
                    title={col.title} 
                    color={col.color} 
                    onNodeClick={onNodeClick}
                    tasks={nodes.filter((t) => t.status === col.id && (!t.parentLinks || t.parentLinks.length === 0 || !rows.some(r => r.id === t.parentLinks?.[0]?.parentNode?.id)))} 
                    isReadOnly={isReadOnly}
                    hideHeader
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="kanban-grid">
            {getKanbanColumns().map((col) => (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                color={col.color} 
                onNodeClick={onNodeClick}
                tasks={nodes.filter((t) => t.status === col.id)} 
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        )}
    </DragDropContext>
  );
}
