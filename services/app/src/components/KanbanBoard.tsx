"use client";

import { useState } from "react";
import { DragDropContext, DropResult, DraggableLocation } from "@hello-pangea/dnd";
import { updateNodeStatus, createNode, reorderNodes } from "@/lib/actions";
import { byRank, placeInList, assignPositions } from "@/lib/order";
import { statusMeta } from "@/lib/statusMeta";
import { useProject } from "./ProjectContext";
import { useToast } from "./ui/Toast";
import { Node, Sprint, NodeType } from "@/lib/types";
import { IconRenderer } from "./IconPicker";
import { StatusBadge } from "./ui/StatusBadge";
import { STATUS_META, STATUS_ORDER } from "@/lib/statusMeta";

import { KanbanColumn } from "./kanban/KanbanColumn";

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
  const { toast } = useToast();
  const isLayered = boardLevelView !== "flat";
  const rowTypeIdsSet = new Set(rowTypeIds);
  const cardTypeIdsSet = new Set(cardTypeIds);

  // Filter cards: active, sprint-matching, and matching card types
  const cards = isLayered 
    ? initialNodes.filter(n => cardTypeIdsSet.has(n.nodeTypeId))
    : initialNodes;

  // Filter rows: active, parent of active cards OR directly in sprint, and matching row types
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

  // Cards in one column (optionally within one parent's swimlane), in manual order.
  const columnCards = (statusId: string, lane: "all" | "unparented" | string) =>
    nodes
      .filter((t) => t.status === statusId && laneMatches(t, lane, rows))
      .sort(byRank);

  // Which item types can be created straight into a column.
  const quickTypes = (lane: "all" | "unparented" | string) => {
    if (!isLayered || lane === "all") {
      const pool = isLayered ? nodeTypes.filter((t) => cardTypeIdsSet.has(t.id)) : nodeTypes.filter((t) => t.isSprintEligible !== false);
      return pool.map((t) => ({ id: t.id, name: t.name }));
    }
    if (lane === "unparented") return nodeTypes.filter((t) => cardTypeIdsSet.has(t.id)).map((t) => ({ id: t.id, name: t.name }));
    const parent = rows.find((r) => r.id === lane);
    const allowed = new Set((nodeTypes.find((t) => t.id === parent?.nodeTypeId)?.allowedChildren ?? []).map((c) => c.childNodeTypeId));
    return nodeTypes.filter((t) => allowed.has(t.id) && cardTypeIdsSet.has(t.id)).map((t) => ({ id: t.id, name: t.name }));
  };

  const quickAddFor = (statusId: string, lane: "all" | "unparented" | string) => {
    if (isReadOnly) return undefined;
    const types = quickTypes(lane);
    if (types.length === 0) return undefined;
    return {
      types,
      onAdd: async (title: string, typeId: string) => {
        await createNode(projectId, lane === "all" || lane === "unparented" ? null : lane, typeId, title, {}, initialSprint.id, statusId);
        onRefresh();
      },
    };
  };

  const columns = getKanbanColumns();

  return (
    <DragDropContext onDragEnd={(result) => !isReadOnly && handleDragEnd(result, { 
      projectId, 
      rows,
      nodes, 
      setNodes, 
      initialNodes: cards, 
      allNodes,
      isLayered,
      onRefresh,
      toast 
    })}>
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[880px]">
          {isLayered ? (
            <div className="flex flex-col gap-5">
              {/* Column headers */}
              <div className="kanban-grid sticky top-0 z-10 bg-bg py-1">
                {columns.map((col) => (
                  <div key={col.id} className="flex items-center gap-2 px-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: col.color }} aria-hidden />
                    <h3 className="text-sm font-medium">{col.title}</h3>
                    <span className="text-xs text-faint">{nodes.filter((t) => t.status === col.id).length}</span>
                  </div>
                ))}
              </div>

              {rows.map((rowNode) => (
                <section key={rowNode.id} aria-label={rowNode.title}>
                  <button
                    onClick={() => onNodeClick(rowNode.id)}
                    className="mb-2 flex w-full items-center gap-2 rounded-md px-1 py-1 text-left transition-colors hover:bg-hover"
                  >
                    <span style={{ color: rowNode.type.color || "var(--accent)" }} className="flex">
                      <IconRenderer name={rowNode.type.icon || "Target"} size={15} />
                    </span>
                    <span className="text-xs text-muted">{rowNode.type.name}</span>
                    <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{rowNode.title}</h3>
                    <StatusBadge status={rowNode.status} />
                  </button>

                  <div className="kanban-grid">
                    {columns.map((col) => (
                      <KanbanColumn
                        key={`${col.id}:${rowNode.id}`}
                        id={`${col.id}:${rowNode.id}`}
                        title={col.title}
                        color={col.color}
                        onNodeClick={onNodeClick}
                        tasks={columnCards(col.id, rowNode.id)}
                        quickAdd={quickAddFor(col.id, rowNode.id)}
                        isReadOnly={isReadOnly}
                        hideHeader
                      />
                    ))}
                  </div>
                </section>
              ))}

              <section aria-label="Unparented items">
                <div className="mb-2 flex items-center gap-2 px-1 py-1 text-sm text-muted">
                  <IconRenderer name="HelpCircle" size={15} />
                  <h3 className="text-sm font-medium text-muted">No parent</h3>
                </div>
                <div className="kanban-grid">
                  {columns.map((col) => (
                    <KanbanColumn
                      key={`${col.id}:unparented`}
                      id={`${col.id}:unparented`}
                      title={col.title}
                      color={col.color}
                      onNodeClick={onNodeClick}
                      tasks={columnCards(col.id, "unparented")}
                      quickAdd={quickAddFor(col.id, "unparented")}
                      isReadOnly={isReadOnly}
                      hideHeader
                    />
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="kanban-grid">
              {columns.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  title={col.title}
                  color={col.color}
                  onNodeClick={onNodeClick}
                  tasks={columnCards(col.id, "all")}
                  quickAdd={quickAddFor(col.id, "all")}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}

// --- Implementation Details (The Prose) ---

/** Does this card belong to the given swimlane? ("all" = flat board, "unparented" = lane for cards without a visible parent). */
function laneMatches(task: Node, lane: string, rows: Node[]): boolean {
  if (lane === "all") return true;
  const parentId = task.parentLinks?.[0]?.parentNode?.id;
  if (lane === "unparented") return !parentId || !rows.some((r) => r.id === parentId);
  return parentId === lane;
}

interface DragEndParams {
  rows: Node[];
  projectId: string;
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
  initialNodes: Node[];
  allNodes: Node[];
  isLayered: boolean;
  onRefresh: () => void;
  toast: (input: { message: string; action?: { label: string; onClick: () => void | Promise<void> } }) => void;
}

async function handleDragEnd(result: DropResult, params: DragEndParams) {
  const { projectId, rows, nodes, setNodes, initialNodes, allNodes, isLayered, onRefresh, toast } = params;
  const { destination, source, draggableId } = result;

  if (isInvalidDrop(destination, source)) return;

  let destStatus = destination!.droppableId;
  let destParentId: string | null = null;
  let sourceStatus = source.droppableId;
  let sourceParentId: string | null = null;

  if (isLayered) {
    const [dStatus, dParent] = destination!.droppableId.split(':');
    destStatus = dStatus;
    destParentId = dParent === 'unparented' ? null : dParent;

    const [sStatus, sParent] = source.droppableId.split(':');
    sourceStatus = sStatus;
    sourceParentId = sParent === 'unparented' ? null : sParent;
  }

  // The destination column's new order (the dropped card at the dropped index).
  const destLane = isLayered ? (destParentId ?? "unparented") : "all";
  const destCurrent = nodes.filter((t) => t.status === destStatus && laneMatches(t, destLane, rows)).sort(byRank).map((t) => t.id);
  const newOrder = placeInList(destCurrent, draggableId, destination!.index);
  const positions = assignPositions(newOrder, Math.min(0, ...nodes.filter((t) => newOrder.includes(t.id)).map((t) => t.position ?? 0)));

  // Optimistic local state update
  const updatedNodes = [...nodes];
  const nodeIndex = updatedNodes.findIndex((n) => n.id === draggableId);
  if (nodeIndex !== -1) {
    const oldNode = updatedNodes[nodeIndex];
    let newParentLinks = oldNode.parentLinks || [];
    if (isLayered && destParentId !== sourceParentId) {
      if (destParentId) {
        const parentNode = allNodes.find(n => n.id === destParentId);
        if (parentNode) {
          newParentLinks = [{
            id: 'temp-link-id',
            parentNode
          }];
        }
      } else {
        newParentLinks = [];
      }
    }
    updatedNodes[nodeIndex] = { 
      ...oldNode, 
      status: destStatus,
      parentLinks: newParentLinks
    };
    // Show the new order straight away.
    setNodes(updatedNodes.map((n) => (positions.has(n.id) ? { ...n, position: positions.get(n.id) } : n)));
  }

  // Persistence updates. Sequential on purpose: both actions touch the same node and
  // re-derive parent statuses, so running them concurrently could interleave.
  try {
    if (destStatus !== sourceStatus) {
      await updateNodeStatus(projectId, draggableId, destStatus);
    }
    if (isLayered && destParentId !== sourceParentId) {
      const { updateNodeParent } = await import("@/lib/actions");
      const result = await updateNodeParent(projectId, draggableId, destParentId);
      if (result?.error) {
        alert(result.error);
        setNodes(initialNodes);
      }
    }
    const reordered = await reorderNodes(projectId, newOrder);
    if (reordered?.error) console.error("Reorder failed", reordered.error);

    // Offer to undo a status/parent change (a pure reorder within a column isn't worth a toast).
    const statusChanged = destStatus !== sourceStatus;
    const parentChanged = isLayered && destParentId !== sourceParentId;
    if (statusChanged || parentChanged) {
      const title = nodes.find((n) => n.id === draggableId)?.title ?? "Item";
      toast({
        message: statusChanged ? `“${title}” → ${statusMeta(destStatus).label}` : `Moved “${title}”`,
        action: {
          label: "Undo",
          onClick: async () => {
            if (statusChanged) await updateNodeStatus(projectId, draggableId, sourceStatus);
            if (parentChanged) {
              const { updateNodeParent } = await import("@/lib/actions");
              await updateNodeParent(projectId, draggableId, sourceParentId);
            }
            onRefresh();
          },
        },
      });
    }
    onRefresh();
  } catch (error) {
    console.error("Drag persistence failed", error);
    setNodes(initialNodes);
  }
}

function NoActiveSprintState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
      <p className="text-sm font-medium">No sprint to show</p>
      <p className="max-w-sm text-sm text-muted">Create a sprint on the Sprints page, then assign items to it to see them here.</p>
    </div>
  );
}

function getKanbanColumns() {
  return STATUS_ORDER.map((id) => ({ id: id as string, title: STATUS_META[id].label, color: STATUS_META[id].color }));
}

function isInvalidDrop(destination: DraggableLocation | null | undefined, source: DraggableLocation) {
  if (!destination) return true;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return true;
  return false;
}
