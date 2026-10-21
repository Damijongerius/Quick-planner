"use client";

import React, { useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, Connection, Edge, Node, addEdge, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { createRelation, deleteRelation } from '@/lib/actions';
import { Button } from './ui/Button';
import { Plus } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { NodeTypeNode } from './NodeTypeNode';
import { LayerBoxNode } from './LayerBoxNode';
import { EcosystemSidePanel } from './EcosystemSidePanel';
import { EcosystemCreationOverlay } from './EcosystemCreationOverlay';
import { NodeType, AllowedRelation } from '@/lib/types';
import { useProject } from './ProjectContext';
import "./Flow.css";
import "./Blueprint.css";

const nodeTypes_flow = { nodeType: NodeTypeNode, layerBox: LayerBoxNode };

const NODE_WIDTH = 220;
const NODE_GAP = 280;
const ROW_HEIGHT = 200;
const LAYER_HEIGHT = 176;

interface NodeEcosystemEditorProps {
  readonly projectId: string;
  readonly nodeTypes: NodeType[];
  readonly initialRelations: AllowedRelation[];
}

export function NodeEcosystemEditor({ projectId, nodeTypes, initialRelations }: NodeEcosystemEditorProps) {
  const [activeNodeType, setActiveNodeType] = useState<NodeType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isReadOnly } = useProject();

  const initialNodes = useMemo(() => transformToFlowNodes(nodeTypes, initialRelations, setActiveNodeType, projectId, isReadOnly), [nodeTypes, initialRelations, projectId, isReadOnly]);
  const initialEdges: Edge[] = useMemo(() => transformToFlowEdges(initialRelations), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);


  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  React.useEffect(() => {
    if (activeNodeType) {
      const updated = nodeTypes.find(t => t.id === activeNodeType.id);
      if (updated && updated !== activeNodeType) {
        setActiveNodeType(updated);
      }
    }
  }, [nodeTypes, activeNodeType]);

  return (
    <div>
      <PageHeader
        title="Item types"
        description="Define the kinds of items in this project and how they nest. Drag from the dot below one type to another to allow it as a child."
        actions={!isReadOnly && <Button onClick={() => setIsCreating(true)} icon={<Plus size={14} />}>New item type</Button>}
      />

      <div className="flow-canvas-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes_flow}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeClick={(_, n) => { const t = nodeTypes.find((t) => t.id === n.id); if (t) setActiveNodeType(t); }}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={true}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
          minZoom={0.3}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={24} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {nodeTypes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted">
            No item types yet. Create one to get started.
          </div>
        )}
      </div>

      {isCreating && <EcosystemCreationOverlay projectId={projectId} onClose={() => setIsCreating(false)} />}
      {activeNodeType && <EcosystemSidePanel projectId={projectId} activeNodeType={activeNodeType} onClose={() => setActiveNodeType(null)} isReadOnly={isReadOnly} />}
    </div>
  );

   async function onConnect(params: Connection) {
     if (isReadOnly) return;
     if (params.source && params.target && params.source !== params.target) {
       setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)', width: 18, height: 18 }, style: { stroke: 'var(--accent)', strokeWidth: 1.75 } }, eds));
       await createRelation(projectId, params.source, params.target);
     }
   }

   async function onEdgesDelete(edgesToDelete: Edge[]) {
     if (isReadOnly) return;
     for (const edge of edgesToDelete) await deleteRelation(projectId, edge.id);
   }
}

function transformToFlowNodes(
  nodeTypes: NodeType[], 
  relations: AllowedRelation[], 
  setActiveNodeType: (type: NodeType | null) => void,
  projectId: string,
  isReadOnly: boolean
) {
  // 1. Calculate depths
  const depths: Record<string, number> = {};
  nodeTypes.forEach((t) => depths[t.id] = 0);
  
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

  // 2. Group nodes by depth
  const nodesByDepth: Record<number, string[]> = {};
  Object.entries(depths).forEach(([id, depth]) => {
    if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
    nodesByDepth[depth].push(id);
  });

  const flowNodes: Node[] = [];
  const uniqueDepths = Array.from(new Set(Object.values(depths))).sort((a, b) => a - b);

  // 3. Create Layer Box background nodes (render first so they are behind)
  const widestLayer = Math.max(1, ...uniqueDepths.map((d) => nodeTypes.filter((t) => depths[t.id] === d).length));
  const layerWidth = Math.max(640, widestLayer * NODE_GAP + 80);

  uniqueDepths.forEach((d) => {
    const nodeTypesAtDepth = nodeTypes.filter((t) => depths[t.id] === d);
    if (nodeTypesAtDepth.length === 0) return;

    // Determine visibility settings for this layer by checking the first node type in it
    const firstType = nodeTypesAtDepth[0];
    const isSprintEligible = firstType?.isSprintEligible ?? false;
    const boardConfig = firstType?.boardConfig || {};
    const showOnKanban = boardConfig.showOnKanban !== false;
    const showOnGantt = boardConfig.showOnGantt !== false;

    flowNodes.push({
      id: `layer-box-${d}`,
      type: 'layerBox',
      draggable: false,
      selectable: false,
      position: {
        x: -layerWidth / 2,
        y: d * ROW_HEIGHT - 36
      },
      data: {
        depth: d,
        width: layerWidth,
        label: `Level ${d + 1} · ${nodeTypesAtDepth.map((t) => t.name).join(' / ')}`,
        projectId,
        isReadOnly,
        isSprintEligible,
        showOnKanban,
        showOnGantt,
        nodeTypesData: nodeTypesAtDepth.map((t) => ({
          id: t.id,
          boardConfig: t.boardConfig || {}
        }))
      }
    });
  });

  // 4. Create actual node type cards (render on top of background boxes)
  nodeTypes.forEach((type) => {
    const depth = depths[type.id];
    const nodesAtThisDepth = nodesByDepth[depth];
    const horizontalIndex = nodesAtThisDepth.indexOf(type.id);
    const horizontalOffset = ((nodesAtThisDepth.length - 1) * NODE_GAP) / 2;

    flowNodes.push({
      id: type.id,
      type: 'nodeType',
      position: { 
        x: (horizontalIndex * NODE_GAP) - horizontalOffset - NODE_WIDTH / 2, 
        y: depth * ROW_HEIGHT + 16
      },
      data: { 
        label: type.name, 
        color: type.color, 
        icon: type.icon || 'Target',
        fields: type.fields || [],
        onClick: () => setActiveNodeType(type) 
      }
    });
  });

  return flowNodes;
}

function transformToFlowEdges(relations: AllowedRelation[]): Edge[] {
  return relations.map((rel) => ({
    id: rel.id, source: rel.parentNodeTypeId, target: rel.childNodeTypeId, animated: false,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)', width: 18, height: 18 },
    style: { stroke: 'var(--accent)', strokeWidth: 1.75 }
  }));
}
