"use client";

import React, { useMemo, useState, useRef, useCallback } from 'react';
import ReactFlow, { Background, Controls, Connection, Edge, addEdge, useNodesState, useEdgesState, MarkerType, updateEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import { createRelation, deleteRelation } from '@/lib/actions';
import { Button } from './ui/Button';
import { Plus } from 'lucide-react';
import { NodeTypeNode } from './NodeTypeNode';
import { LayerBoxNode } from './LayerBoxNode';
import { EcosystemSidePanel } from './EcosystemSidePanel';
import { EcosystemCreationOverlay } from './EcosystemCreationOverlay';
import { transformToFlowNodes, transformToFlowEdges } from './EcosystemFlowUtils';
import { NodeType, AllowedRelation } from '@/lib/types';
import { useProject } from './ProjectContext';
import "./Flow.css";
import "./Blueprint.css";

const nodeTypes_flow = { nodeType: NodeTypeNode, layerBox: LayerBoxNode };

interface NodeEcosystemEditorProps {
  readonly projectId: string;
  readonly nodeTypes: NodeType[];
  readonly initialRelations: AllowedRelation[];
}

export function NodeEcosystemEditor({ projectId, nodeTypes, initialRelations }: NodeEcosystemEditorProps) {
  const [activeNodeType, setActiveNodeType] = useState<NodeType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isReadOnly } = useProject();
  const edgeUpdateSuccessful = useRef(true);

  const initialNodes = useMemo(() => transformToFlowNodes(nodeTypes, initialRelations, setActiveNodeType, projectId, isReadOnly), [nodeTypes, initialRelations, projectId, isReadOnly]);
  const initialEdges: Edge[] = useMemo(() => transformToFlowEdges(initialRelations), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback(async (oldEdge: Edge, newConnection: Connection) => {
    if (isReadOnly) return;
    edgeUpdateSuccessful.current = true;
    if (oldEdge.source === newConnection.source && oldEdge.target === newConnection.target) {
      return;
    }
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
    try {
      await deleteRelation(projectId, oldEdge.id);
    } catch (err) {
      console.warn("Failed to delete relation during update:", err);
    }
    try {
      if (newConnection.source && newConnection.target) {
        await createRelation(projectId, newConnection.source, newConnection.target);
      }
    } catch (err) {
      console.warn("Failed to create relation during update:", err);
    }
    window.dispatchEvent(new CustomEvent("project-mutated"));
  }, [projectId, isReadOnly, setEdges]);

  const onEdgeUpdateEnd = useCallback(async (_: any, edge: Edge) => {
    if (!edgeUpdateSuccessful.current && !isReadOnly) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      try {
        await deleteRelation(projectId, edge.id);
      } catch (err) {
        console.warn("Failed to delete relation during update end:", err);
      }
      window.dispatchEvent(new CustomEvent("project-mutated"));
    }
  }, [projectId, isReadOnly, setEdges]);

  React.useEffect(() => {
    if (activeNodeType) {
      const updated = nodeTypes.find(t => t.id === activeNodeType.id);
      if (updated && updated !== activeNodeType) {
        setActiveNodeType(updated);
      }
    }
  }, [nodeTypes, activeNodeType]);

  async function onConnect(params: Connection) {
    if (isReadOnly) return;
    if (params.source && params.target && params.source !== params.target) {
      setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 }, style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 } }, eds));
      try {
        await createRelation(projectId, params.source, params.target);
      } catch (err) {
        console.warn("Failed to create relation:", err);
      }
      window.dispatchEvent(new CustomEvent("project-mutated"));
    }
  }

  async function onEdgesDelete(edgesToDelete: Edge[]) {
    if (isReadOnly) return;
    for (const edge of edgesToDelete) {
      try {
        await deleteRelation(projectId, edge.id);
      } catch (err) {
        console.warn("Failed to delete relation:", err);
      }
    }
    window.dispatchEvent(new CustomEvent("project-mutated"));
  }

  return (
    <div className="flow-canvas-container" style={{ height: '70vh' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes_flow} 
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange} 
        onConnect={onConnect} 
        onEdgesDelete={onEdgesDelete} 
        onEdgeUpdate={onEdgeUpdate}
        onEdgeUpdateStart={onEdgeUpdateStart}
        onEdgeUpdateEnd={onEdgeUpdateEnd}
        onEdgeDoubleClick={(event, edge) => {
          if (isReadOnly) return;
          if (window.confirm("Are you sure you want to disconnect this relation?")) {
            onEdgesDelete([edge]);
          }
        }}
        onNodeClick={(_, n) => setActiveNodeType(nodeTypes.find((t) => t.id === n.id) || null)} 
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={true}
        fitView
      >
        <Background color="var(--outline-variant)" gap={32} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

       {!isReadOnly && (
         <div className="absolute top-md right-md z-10 flex gap-md">
           <Button onClick={() => setIsCreating(true)} size="sm" icon={<Plus size={18} />}>CREATE TYPE</Button>
         </div>
       )}

       {isCreating && <EcosystemCreationOverlay projectId={projectId} onClose={() => setIsCreating(false)} />}
       {activeNodeType && <EcosystemSidePanel projectId={projectId} activeNodeType={activeNodeType} onClose={() => setActiveNodeType(null)} isReadOnly={isReadOnly} />}
    </div>
  );
}
