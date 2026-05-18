"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createNode, getRootNodes } from "@/lib/actions";
import { BacklogTree } from "./BacklogTree";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";

import { BacklogToolbar } from "./BacklogToolbar";
import { useProject } from "./ProjectContext";

import { Node, NodeType, Sprint } from "@/lib/types";

interface BacklogViewProps {
  readonly projectId: string;
  readonly rootNodes: Node[];
  readonly nodeTypes: NodeType[];
  readonly sprints: Sprint[];
  readonly allNodes: Node[];
}

export function BacklogView({ projectId, rootNodes: initialNodes, nodeTypes, sprints, allNodes }: BacklogViewProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(true);
  const searchParams = useSearchParams();
  const { isReadOnly } = useProject();

  // Premium Custom targeted Tree-Table view states (Initializes with max 4 columns)
  const [targetNodeTypeId, setTargetNodeTypeId] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['title', 'status', 'sprintId', 'startDate']);

  useEffect(() => {
    if (nodeTypes.length > 0 && !targetNodeTypeId) {
      setTargetNodeTypeId(nodeTypes[0].id);
      const firstType = nodeTypes[0];
      const customFields = firstType?.fields?.map(f => f.name) || [];
      const defaultCols = ['title', 'status', 'sprintId'];
      if (customFields.length > 0) {
        defaultCols.push(customFields[0]);
      } else {
        defaultCols.push('startDate');
      }
      setSelectedColumns(defaultCols);
    }
  }, [nodeTypes, targetNodeTypeId]);

  const childTypeIds = new Set(nodeTypes.flatMap((t) => t.allowedChildren?.map((ac) => ac.childNodeTypeId) || []));
  const availableRootTypes = nodeTypes.some((t) => !childTypeIds.has(t.id))
    ? nodeTypes.filter((t) => !childTypeIds.has(t.id))
    : nodeTypes;

  const urlNodeId = searchParams.get('nodeId');
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

  useEffect(() => {
    const refresh = async () => { const data = await getRootNodes(projectId, showArchived); setNodes(data); };
    refresh();
  }, [showArchived, projectId]);

  const handleCreateRoot = async (typeId: string, typeName: string) => {
    if (isReadOnly) return;
    await createNode(projectId, null, typeId, `New ${typeName}`);
    const data = await getRootNodes(projectId, showArchived);
    setNodes(data);
  };

  const handleColumnToggle = (colId: string) => {
    const isSelected = selectedColumns.includes(colId);
    if (isSelected) {
      if (colId === 'title') return; // Enforce Title is always visible
      setSelectedColumns(selectedColumns.filter(c => c !== colId));
    } else {
      // Enforce at most 4 columns total (including Title)
      if (selectedColumns.length >= 4) {
        const nonTitleCols = selectedColumns.filter(c => c !== 'title');
        // Gracefully shift the oldest non-title column out to make room
        setSelectedColumns(['title', ...nonTitleCols.slice(1), colId]);
      } else {
        setSelectedColumns([...selectedColumns, colId]);
      }
    }
  };

  // Target details and filters
  const selectedNodeType = nodeTypes.find(t => t.id === targetNodeTypeId);

  return (
    <div className="flex flex-col gap-xl">
      <BacklogToolbar
        availableRootTypes={availableRootTypes}
        onAddRoot={handleCreateRoot}
        hideCompleted={hideCompleted}
        onToggleHideCompleted={() => setHideCompleted(!hideCompleted)}
        showArchived={showArchived}
        onToggleShowArchived={() => setShowArchived(!showArchived)}
        isReadOnly={isReadOnly}
      />

      {/* Dynamic Column Configurator */}
      <div className="flex flex-col gap-md bg-surface-container-low p-lg rounded-2xl border border-outline-variant shadow-sm mb-xs">
        <div className="flex flex-wrap items-center justify-between gap-md">
          <div className="flex items-center gap-md">
            <span className="text-meta text-primary font-bold">Target Custom Columns:</span>
            <select
              className="input-premium py-xs px-md cursor-pointer"
              style={{ width: 'auto', minWidth: '160px' }}
              value={targetNodeTypeId || ""}
              onChange={(e) => {
                const newTypeId = e.target.value;
                setTargetNodeTypeId(newTypeId);
                // Update default visible columns, keeping it strictly to at most 4 columns total!
                const newType = nodeTypes.find(t => t.id === newTypeId);
                const newCustomFields = newType?.fields?.map(f => f.name) || [];
                const defaultCols = ['title', 'status', 'sprintId'];
                if (newCustomFields.length > 0) {
                  defaultCols.push(newCustomFields[0]);
                } else {
                  defaultCols.push('startDate');
                }
                setSelectedColumns(defaultCols);
              }}
            >
              {nodeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-sm">
            <span className="text-meta text-on-surface-variant font-semibold">
              Visible Columns <span className="opacity-50" style={{ fontSize: '10px' }}>(Max 4 total)</span>:
            </span>
            
            {[
              { id: 'status', label: 'Status' },
              { id: 'sprintId', label: 'Sprint' },
              { id: 'startDate', label: 'Start Date' },
              { id: 'endDate', label: 'End Date' }
            ].map((col) => {
              const isSelected = selectedColumns.includes(col.id);
              return (
                <button
                  key={col.id}
                  onClick={() => handleColumnToggle(col.id)}
                  className={`blueprint-chip ${isSelected ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '4px 12px', cursor: 'pointer' }}
                >
                  {col.label}
                </button>
              );
            })}

            {selectedNodeType?.fields?.map((field) => {
              const isSelected = selectedColumns.includes(field.name);
              return (
                <button
                  key={field.id}
                  onClick={() => handleColumnToggle(field.name)}
                  className={`blueprint-chip ${isSelected ? 'active' : ''}`}
                  style={{ fontSize: '10px', padding: '4px 12px', cursor: 'pointer', border: '1px dashed var(--primary)' }}
                >
                  {field.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="backlog-main-layout">
        <div className="flex-1 flex flex-col gap-xs min-w-0">
          {/* Table Header Row aligned perfectly with the BacklogNodeRow */}
          <div 
            className="backlog-table-header" 
            style={{ 
              gridTemplateColumns: getGridTemplate(selectedColumns.length),
              paddingLeft: '24px',
              paddingRight: '24px'
            }}
          >
            <div className="min-w-0 flex items-center gap-md">
              <span className="text-meta" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>TITLE / HIERARCHY</span>
            </div>
            {selectedColumns.filter(c => c !== 'title').map((colKey) => {
              const isCustom = selectedNodeType?.fields?.some(f => f.name === colKey);
              const label = isCustom 
                ? colKey.toUpperCase()
                : colKey === 'sprintId' ? 'SPRINT'
                : colKey === 'startDate' ? 'START DATE'
                : colKey === 'endDate' ? 'END DATE'
                : colKey.toUpperCase();
              return (
                <div key={colKey} className="min-w-0 text-left">
                  <span className="text-meta" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>{label}</span>
                </div>
              );
            })}
          </div>

          <div className="backlog-tree-container card-planner min-w-0">
            {nodes.map(node => (
              <BacklogTree 
                key={node.id} 
                projectId={projectId} 
                node={node} 
                nodeTypes={nodeTypes} 
                onSelect={(n) => { setSelectedNode(n); setIsPanelOpen(true); }} 
                selectedNodeId={selectedNode?.id || null} 
                hideCompleted={hideCompleted} 
                isReadOnly={isReadOnly}
                selectedColumns={selectedColumns}
                sprints={sprints}
                selectedNodeType={selectedNodeType}
              />
            ))}

            {nodes.length === 0 && (
              <div className="backlog-empty-state">
                <h3 className="text-xl mb-sm">{showArchived ? "No archived items found." : "Your backlog is empty."}</h3>
                <p className="text-secondary text-sm">Start by initializing something above.</p>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isPanelOpen && selectedNode && (
            <motion.div
              key={selectedNode.id}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '450px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="backlog-panel-wrapper animate-fade-in"
            >
              <NodeSidePanel projectId={projectId} node={selectedNode} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} sprints={sprints} allNodes={allNodes} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// PURE HELPER FUNCTIONS (Code as Prose)
// ==========================================

function getGridTemplate(numCols: number): string {
  if (numCols <= 1) return "1fr";
  if (numCols === 2) return "3fr 1.2fr";
  if (numCols === 3) return "3fr 1.2fr 1.2fr";
  return "3fr 1.2fr 1.2fr 1.2fr"; // Dynamic, left-connected grid sizing with strict boundaries
}
