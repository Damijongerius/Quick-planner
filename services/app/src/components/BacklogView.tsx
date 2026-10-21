"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createNode, getRootNodes, reorderNodes } from "@/lib/actions";
import { BacklogTree } from "./BacklogTree";
import { BacklogNodeRow } from "./BacklogNodeRow";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";
import { SearchX, Inbox } from "lucide-react";

import { BacklogToolbar, ColumnOption } from "./BacklogToolbar";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ReorderContext, type ReorderList } from "./backlog/ReorderContext";
import { BulkBar } from "./backlog/BulkBar";
import { moveInList } from "@/lib/order";
import { PageHeader } from "./PageHeader";
import { useProject } from "./ProjectContext";
import { matchesAssignee, type AssigneeFilter } from "@/lib/assignee";
import { useUrlState } from "./ui/useUrlState";
import { flagCodec, listCodec, stringCodec, stringWithDefault } from "@/lib/urlState";

import { Node, NodeType, Sprint } from "@/lib/types";

interface BacklogViewProps {
  readonly projectId: string;
  readonly rootNodes: Node[];
  readonly nodeTypes: NodeType[];
  readonly sprints: Sprint[];
  readonly allNodes: Node[];
}

const STANDARD_COLUMNS: ColumnOption[] = [
  { id: "status", label: "Status" },
  { id: "assignee", label: "Assignee" },
  { id: "sprintId", label: "Sprint" },
  { id: "startDate", label: "Start date" },
  { id: "endDate", label: "End date" },
];
const ASSIGNEE_CODEC = stringWithDefault("all");
const STANDARD_ORDER = ["title", "status", "assignee", "sprintId", "startDate", "endDate"];
const COLUMN_WIDTH: Record<string, string> = { status: "142px", assignee: "136px", sprintId: "150px", startDate: "84px", endDate: "84px" };

export function BacklogView({ projectId, rootNodes: initialNodes, nodeTypes, sprints, allNodes }: BacklogViewProps) {
  const { isReadOnly, currentUserId, members } = useProject();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);
  const [showArchived, setShowArchived] = useUrlState("archived", flagCodec);

  // Server data only describes the non-archived backlog; don't let a router refresh
  // overwrite the archived list the user is currently looking at.
  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    if (!showArchived) setNodes(initialNodes);
  }

  const [syncStamp, setSyncStamp] = useState(0);
  // Expanded sub-trees fetch their own children, so they must be told when the server data changed under them
  // (a teammate added a task to a story that is open here).
  const [stampedFor, setStampedFor] = useState(initialNodes);
  if (stampedFor !== initialNodes) {
    setStampedFor(initialNodes);
    setSyncStamp((n) => n + 1);
  }
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useUrlState("done", flagCodec);
  const hideCompleted = !showCompleted;
  const [search, setSearch] = useUrlState("q", stringCodec);
  // "none" marks "every optional column turned off" (an empty list means "use the defaults").
  const [colList, setColList] = useUrlState("cols", listCodec);
  const defaultColumns = members.length > 1 ? ["status", "assignee", "sprintId"] : ["status", "sprintId", "startDate"];
  const selectedColumns = ["title", ...(colList.length ? colList.filter((c) => c !== "none") : defaultColumns)];
  const searchParams = useSearchParams();
  const router = useRouter();
  const [assigneeRaw, setAssigneeFilter] = useUrlState("assignee", ASSIGNEE_CODEC);
  const assigneeFilter = assigneeRaw as AssigneeFilter;

  const columnOptions = useMemo<ColumnOption[]>(() => {
    const custom: ColumnOption[] = [];
    const seen = new Set<string>();
    for (const type of nodeTypes) {
      for (const field of type.fields ?? []) {
        if (seen.has(field.name)) continue;
        seen.add(field.name);
        custom.push({ id: field.name, label: field.name, group: type.name });
      }
    }
    return [...STANDARD_COLUMNS, ...custom];
  }, [nodeTypes]);

  const childTypeIds = new Set(nodeTypes.flatMap((t) => t.allowedChildren?.map((ac) => ac.childNodeTypeId) || []));
  const availableRootTypes = nodeTypes.some((t) => !childTypeIds.has(t.id))
    ? nodeTypes.filter((t) => !childTypeIds.has(t.id))
    : nodeTypes;

  const urlNodeId = searchParams.get("nodeId");
  const [prevUrlNodeId, setPrevUrlNodeId] = useState<string | null>(null);

  if (urlNodeId !== prevUrlNodeId) {
    setPrevUrlNodeId(urlNodeId);
    if (urlNodeId && allNodes.length > 0) {
      const node = allNodes.find((n) => n.id === urlNodeId);
      if (node) {
        setSelectedNode(node);
        setIsPanelOpen(true);
      }
    }
  }

  const refreshNodes = async () => {
    const data = await getRootNodes(projectId, showArchived);
    setNodes(data);
    setSyncStamp(Date.now());
    router.refresh();
  };

  // The initial list comes from the server, so skip the very first run.
  // (unless the URL opened straight onto the archived list, which the server did not send)
  const hasLoadedOnce = useRef(showArchived);
  useEffect(() => {
    if (!hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      return;
    }
    getRootNodes(projectId, showArchived).then((data) => {
      setNodes(data);
      setSyncStamp(Date.now());
    });
  }, [showArchived, projectId]);

  const handleCreateRoot = async (typeId: string, typeName: string) => {
    if (isReadOnly) return;
    try {
      const newNode = await createNode(projectId, null, typeId, `New ${typeName}`);
      const data = await getRootNodes(projectId, showArchived);
      setNodes(data);
      setSyncStamp(Date.now());
      router.refresh();
      setSelectedNode(newNode as unknown as Node);
      setIsPanelOpen(true);
    } catch (error) {
      console.error("Failed to create item", error);
      alert("Could not create that item.");
    }
  };

  const handleColumnToggle = (colId: string) => {
    const current = selectedColumns.filter((c) => c !== "title");
    const next = current.includes(colId) ? current.filter((c) => c !== colId) : [...current, colId];
    const customOrder = columnOptions.filter((o) => o.group).map((o) => o.id);
    next.sort((a, b) => {
      const ia = STANDARD_ORDER.indexOf(a), ib = STANDARD_ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return customOrder.indexOf(a) - customOrder.indexOf(b);
    });
    setColList(next.length ? next : ["none"]);
  };

  const gridTemplate = ["minmax(0,1fr)", ...selectedColumns.filter((c) => c !== "title").map((c) => `minmax(90px, ${COLUMN_WIDTH[c] ?? "130px"})`)].join(" ");
  const typeById = useMemo(() => new Map(nodeTypes.map((t) => [t.id, t])), [nodeTypes]);

  const query = search.trim().toLowerCase();
  // Search and the assignee filter switch the hierarchy to a flat list of matches.
  const filtering = !!query || assigneeFilter !== "all";
  const searchResults = useMemo(() => {
    if (!filtering) return [];
    return allNodes.filter((n) =>
      !!n.isArchived === showArchived &&
      (!hideCompleted || n.status !== "DONE") &&
      matchesAssignee(n.assigneeId, assigneeFilter, currentUserId) &&
      (!query || n.title.toLowerCase().includes(query))
    );
  }, [allNodes, filtering, query, showArchived, hideCompleted, assigneeFilter, currentUserId]);

  const openNode = (n: Node) => { setSelectedNode(n); setIsPanelOpen(true); };

  // ---- Bulk selection
  const [selection, setSelection] = useState<ReadonlySet<string>>(new Set());
  const toggleSelect = (id: string) => setSelection((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const clearSelection = () => setSelection(new Set());

  // ---- Drag to reorder: every sibling list registers how to read and apply its order.
  const lists = useRef(new Map<string, ReorderList>());
  const registry = useMemo(() => ({
    register: (listId: string, list: ReorderList) => {
      lists.current.set(listId, list);
      return () => { if (lists.current.get(listId) === list) lists.current.delete(listId); };
    },
  }), []);
  const visibleRoots = useMemo(() => nodes.filter((n) => !(hideCompleted && n.status === "DONE")), [nodes, hideCompleted]);
  const rootsRef = useRef(visibleRoots);
  useEffect(() => { rootsRef.current = visibleRoots; });
  useEffect(() => registry.register("root", {
    ids: () => rootsRef.current.map((n) => n.id),
    apply: (ids) => setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      return [...ids.map((id) => byId.get(id)).filter((n): n is Node => !!n), ...prev.filter((n) => !ids.includes(n.id))];
    }),
  }), [registry]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || destination.droppableId !== source.droppableId || destination.index === source.index) return;
    const list = lists.current.get(source.droppableId);
    if (!list) return;
    const next = moveInList(list.ids(), source.index, destination.index);
    list.apply(next);
    const res = await reorderNodes(projectId, next);
    if (res?.error) { alert(res.error); await refreshNodes(); }
  };

  const columnLabel = (id: string) => columnOptions.find((o) => o.id === id)?.label ?? id;

  return (
    <div>
      <PageHeader title="Backlog" description="Everything planned in this project, grouped by hierarchy." />

      <div className="mb-3">
        <BacklogToolbar
          availableRootTypes={availableRootTypes}
          onAddRoot={handleCreateRoot}
          hideCompleted={hideCompleted}
          onToggleHideCompleted={() => setShowCompleted(!showCompleted)}
          showArchived={showArchived}
          onToggleShowArchived={() => setShowArchived(!showArchived)}
          hasArchivedNodes={allNodes.some((n) => n.isArchived)}
          isReadOnly={isReadOnly}
          search={search}
          onSearchChange={setSearch}
          columnOptions={columnOptions}
          selectedColumns={selectedColumns}
          onToggleColumn={handleColumnToggle}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
        />
      </div>

      <div className="flex items-start gap-4" style={{ "--backlog-cols": gridTemplate } as React.CSSProperties}>
        <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-panel shadow-sm">
          <div className="min-w-[640px]">
            <div className="backlog-grid-header grid items-center border-b border-border bg-sidebar pl-10 pr-3 py-2 text-xs font-medium text-muted">
              <div className="pl-8">Title</div>
              {selectedColumns.filter((c) => c !== "title").map((col) => <div key={col}>{columnLabel(col)}</div>)}
            </div>

            {filtering ? (
              searchResults.length > 0 ? (
                searchResults.map((n) => (
                  <BacklogNodeRow
                    key={n.id}
                    projectId={projectId}
                    node={n}
                    nodeType={typeById.get(n.nodeTypeId) ?? n.type}
                    depth={0}
                    isOpen={false}
                    isSelected={selectedNode?.id === n.id}
                    isLoadingChildren={false}
                    hasChildren={false}
                    isHovered={false}
                    onToggle={() => {}}
                    onSelect={() => openNode(n)}
                    progress={n.status === "DONE" ? 100 : 0}
                    selectedColumns={selectedColumns}
                    sprints={sprints}
                    isReadOnly={isReadOnly}
                    onNodeUpdated={refreshNodes}
                    checked={selection.has(n.id)}
                    anySelected={selection.size > 0}
                    onToggleChecked={isReadOnly ? undefined : () => toggleSelect(n.id)}
                  />
                ))
              ) : (
                <EmptyState icon={<SearchX size={22} />} title={query ? `No items match “${search.trim()}”` : "Nothing matches this filter"} hint="Try a different filter, or show completed items." />
              )
            ) : (
              <>
                <ReorderContext.Provider value={registry}>
                <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="root" type="list:root">
                  {(dropProvided) => (
                  <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                {visibleRoots.map((node, i) => (
                  <BacklogTree
                    key={node.id}
                    index={i}
                    selection={selection}
                    onToggleSelect={isReadOnly ? undefined : toggleSelect}
                    projectId={projectId}
                    node={node}
                    nodeTypes={nodeTypes}
                    onSelect={openNode}
                    selectedNodeId={selectedNode?.id || null}
                    hideCompleted={hideCompleted}
                    isReadOnly={isReadOnly}
                    selectedColumns={selectedColumns}
                    sprints={sprints}
                    showArchived={showArchived}
                    onNodeUpdated={refreshNodes}
                    syncStamp={syncStamp}
                  />
                ))}
                {dropProvided.placeholder}
                  </div>
                  )}
                </Droppable>
                </DragDropContext>
                </ReorderContext.Provider>
                {nodes.length === 0 && (
                  <EmptyState
                    icon={<Inbox size={22} />}
                    title={showArchived ? "Nothing archived" : "Your backlog is empty"}
                    hint={showArchived ? "Archived items show up here." : isReadOnly ? "" : "Create your first item with “New item” above."}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {selection.size > 0 && !isReadOnly && (
          <BulkBar projectId={projectId} ids={[...selection]} sprints={sprints} showingArchived={showArchived} onClear={clearSelection} onChanged={refreshNodes} />
        )}

        <AnimatePresence mode="wait">
          {isPanelOpen && selectedNode && (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[200] bg-bg p-2 md:sticky md:inset-auto md:top-4 md:z-auto md:max-h-[calc(100vh-2rem)] md:w-[380px] md:shrink-0 md:bg-transparent md:p-0"
            >
              <NodeSidePanel projectId={projectId} node={selectedNode} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} sprints={sprints} allNodes={allNodes} nodeTypes={nodeTypes} onNodeUpdated={refreshNodes} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, hint }: Readonly<{ icon: React.ReactNode; title: string; hint?: string }>) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-faint">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-sm text-muted">{hint}</p>}
    </div>
  );
}
