"use client";

import { useState, useMemo } from "react";
import { BoardToolbar } from "./BoardToolbar";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChart } from "./GanttChart";
import type { MilestoneInfo } from "@/lib/actions/milestones";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";
import { getAllNodes } from "@/lib/actions";
import { useProject } from "./ProjectContext";
import { matchesAssignee, type AssigneeFilter } from "@/lib/assignee";
import { useUrlState } from "./ui/useUrlState";
import { listCodec, stringCodec, stringWithDefault } from "@/lib/urlState";
import { getActiveSprint, getFilteredNodes, getSortedNodes, findNodeById } from "@/lib/boardUtils";

import { Node, NodeType, Sprint } from "@/lib/types";

const ASSIGNEE_CODEC = stringWithDefault("all");

interface BoardViewProps {
  /** Which view this page is: the Kanban board or the Gantt timeline. */
  readonly mode: "KANBAN" | "GANTT";
  readonly projectId: string;
  readonly initialSprints: Sprint[];
  readonly initialNodeTypes: NodeType[];
  readonly initialNodes: Node[];
  readonly milestones?: MilestoneInfo[];
  readonly initialActiveSprintId?: string | null;
}

export function BoardView({ mode, projectId, initialSprints, initialNodeTypes, initialNodes, initialActiveSprintId, milestones }: BoardViewProps) {
  const viewMode = mode;
  const [search, setSearch] = useUrlState("q", stringCodec);
  const [now] = useState(() => Date.now());
  const [sprintParam, setSprintParam] = useUrlState("sprint", stringCodec);
  const selectedSprintId = sprintParam && initialSprints.some((s) => s.id === sprintParam) ? sprintParam : (initialActiveSprintId || null);
  const setSelectedSprintId = (id: string) => setSprintParam(id);
  const [selectedNodeTypeIds, setSelectedNodeTypeIds] = useUrlState("types", listCodec);
  const [assigneeRaw, setAssigneeFilter] = useUrlState("assignee", ASSIGNEE_CODEC);
  const assigneeFilter = assigneeRaw as AssigneeFilter;
  const { currentUserId } = useProject();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const filteredNodeTypes = useMemo(() => {
    return initialNodeTypes.filter(t => {
      const show = t.boardConfig ? (viewMode === 'KANBAN' ? t.boardConfig.showOnKanban : t.boardConfig.showOnGantt) : true;
      return show !== false;
    });
  }, [initialNodeTypes, viewMode]);

  const viableSprints = useMemo(() => {
    return initialSprints.filter(s => s.status !== 'COMPLETED' || s.id === selectedSprintId);
  }, [initialSprints, selectedSprintId]);

  const availableLevels = useMemo(() => {
    // 1. Calculate depths using topological sort
    const depths: Record<string, number> = {};
    filteredNodeTypes.forEach((t) => depths[t.id] = 0);
    
    const relations = filteredNodeTypes.flatMap(type => 
      (type.allowedChildren || []).map(ac => ({
        parentNodeTypeId: type.id,
        childNodeTypeId: ac.childNodeTypeId
      }))
    );

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
      changed = false;
      iterations++;
      relations.forEach((rel) => {
        const parentDepth = depths[rel.parentNodeTypeId];
        if (depths[rel.childNodeTypeId] <= parentDepth) {
          depths[rel.childNodeTypeId] = parentDepth + 1;
          changed = true;
        }
      });
    }

    // 2. Group node types by depth
    const typesByDepth: Record<number, NodeType[]> = {};
    filteredNodeTypes.forEach((type) => {
      const depth = depths[type.id];
      if (!typesByDepth[depth]) typesByDepth[depth] = [];
      typesByDepth[depth].push(type);
    });

    const levels = [{ value: "flat", label: "All items", rowTypeIds: [] as string[], cardTypeIds: [] as string[] }];

    // 3. For each depth d -> d+1:
    // If there is any relation between node types at depth d and node types at depth d+1,
    // we create a BoardLevel option.
    const maxDepth = Object.values(depths).length > 0 ? Math.max(...Object.values(depths), 0) : 0;
    for (let d = 0; d < maxDepth; d++) {
      const rowTypes = typesByDepth[d] || [];
      const cardTypes = typesByDepth[d + 1] || [];
      if (rowTypes.length === 0 || cardTypes.length === 0) continue;

      // Check if there is any relation between these two levels
      const hasRelation = relations.some(rel => 
        rowTypes.some(rt => rt.id === rel.parentNodeTypeId) &&
        cardTypes.some(ct => ct.id === rel.childNodeTypeId)
      );

      if (hasRelation) {
        const pluralize = (name: string) => {
          if (name.toLowerCase().endsWith('y')) {
            return name.slice(0, -1) + 'ies';
          }
          return name + 's';
        };
        const rowLabel = rowTypes.map(t => pluralize(t.name)).join(" / ");
        const cardLabel = cardTypes.map(t => pluralize(t.name)).join(" / ");
        
        levels.push({
          value: `depth-${d}`,
          label: `${rowLabel} → ${cardLabel}`,
          rowTypeIds: rowTypes.map(t => t.id),
          cardTypeIds: cardTypes.map(t => t.id)
        });
      }
    }

    return levels;
  }, [filteredNodeTypes]);

  // The deepest grouping is the default; an explicit choice (including "flat") lives in the URL.
  const defaultLevel = availableLevels.length > 1 ? availableLevels[availableLevels.length - 1].value : "flat";
  const [groupParam, setBoardLevelView] = useUrlState("group", stringCodec);
  const boardLevelView = groupParam || defaultLevel;

  const activeLevelConfig = useMemo(() => {
    return availableLevels.find(l => l.value === boardLevelView) || availableLevels[0];
  }, [availableLevels, boardLevelView]);

  const activeLevel = activeLevelConfig.value;

  const activeSprint = getActiveSprint(initialSprints, selectedSprintId);
  const filteredNodes = getFilteredNodes(nodes, viewMode, selectedSprintId, selectedNodeTypeIds)
    .filter((n) => matchesAssignee(n.assigneeId, assigneeFilter, currentUserId));
  const query = search.trim().toLowerCase();
  const titleFiltered = query ? filteredNodes.filter((n) => n.title.toLowerCase().includes(query)) : filteredNodes;
  const sortedNodes = getSortedNodes(titleFiltered, initialNodeTypes);

  const hasFilters = !!query || assigneeFilter !== "all" || selectedNodeTypeIds.length > 0;
  const clearFilters = () => { setSearch(""); setAssigneeFilter("all"); setSelectedNodeTypeIds([]); };

  // Sprint progress for the summary strip: everything planned in the selected sprint, regardless of filters.
  const sprintStats = useMemo(() => {
    if (!activeSprint) return null;
    const inSprint = nodes.filter((n) => n.sprintId === activeSprint.id && !n.isArchived && n.type?.boardConfig?.showOnKanban !== false);
    return { total: inSprint.length, done: inSprint.filter((n) => n.status === "DONE").length };
  }, [nodes, activeSprint]);

  const refresh = async () => setNodes(await getAllNodes(projectId));

  return (
    <div className="flex w-full flex-col">
      <BoardToolbar
        mode={mode}
        now={now}
        sprints={viableSprints}
        selectedSprintId={selectedSprintId}
        onSprintChange={setSelectedSprintId}
        sprintStats={sprintStats}
        nodeTypes={filteredNodeTypes}
        selectedNodeTypeIds={selectedNodeTypeIds}
        onNodeTypeToggle={(id: string) => id === 'all' ? setSelectedNodeTypeIds([]) : setSelectedNodeTypeIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])}
        levels={availableLevels}
        level={activeLevel}
        onLevelChange={setBoardLevelView}
        assigneeFilter={assigneeFilter}
        onAssigneeFilterChange={setAssigneeFilter}
        search={search}
        onSearchChange={setSearch}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      <div>
        {viewMode === 'KANBAN' ? (
          <KanbanBoard 
            projectId={projectId} 
            initialSprint={activeSprint} 
            initialNodes={sortedNodes} 
            allNodes={nodes}
            nodeTypes={filteredNodeTypes} 
            boardLevelView={activeLevel}
            rowTypeIds={activeLevelConfig.rowTypeIds}
            cardTypeIds={activeLevelConfig.cardTypeIds}
            onRefresh={refresh} 
            onNodeClick={(id) => { const n = findNodeById(nodes, id); if (n) { setSelectedNode(n); setIsPanelOpen(true); } }} 
          />
        ) : (
          <GanttChart 
            projectId={projectId}
            nodes={sortedNodes} 
            sprints={viableSprints} 
            currentSprintId={selectedSprintId} 
            boardLevelView={activeLevel}
            rowTypeIds={activeLevelConfig.rowTypeIds}
            cardTypeIds={activeLevelConfig.cardTypeIds}
            onNodeClick={(id) => { const n = findNodeById(nodes, id); if (n) { setSelectedNode(n); setIsPanelOpen(true); } }}
            milestones={milestones}
          />
        )}
      </div>

      <AnimatePresence>
        {isPanelOpen && selectedNode && (
          <>
            <motion.button
              key="scrim"
              aria-label="Close panel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] cursor-default bg-black/25"
              onClick={() => { setIsPanelOpen(false); refresh(); }}
            />
            <motion.div 
              key={selectedNode.id} 
              initial={{ x: 40, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: 40, opacity: 0 }} 
              transition={{ duration: 0.16 }} 
              className="fixed bottom-0 right-0 top-0 z-[200] w-full max-w-[460px] p-3"
            >
              <NodeSidePanel 
                projectId={projectId} 
                node={selectedNode} 
                isOpen={isPanelOpen} 
                onClose={() => { setIsPanelOpen(false); refresh(); }} 
                sprints={initialSprints} 
                allNodes={nodes} 
                nodeTypes={initialNodeTypes}
                onNodeUpdated={refresh}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
