"use client";

import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, Connection, Edge, addEdge, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { createRelation, deleteRelation } from '@/lib/actions';
import { NodeTypeNode } from './NodeTypeNode';
import { calculateHierarchicalLayout } from '@/lib/flowLayout';
import { useProject } from './ProjectContext';

import { NodeType, AllowedRelation } from '@/lib/types';

const nodeTypes_flow = { nodeType: NodeTypeNode };

export function RelationEditor({ projectId, nodeTypes, initialRelations }: Readonly<{ projectId: string; nodeTypes: NodeType[]; initialRelations: AllowedRelation[] }>) {
  const { isReadOnly } = useProject();
  const initialNodes = useMemo(() => calculateHierarchicalLayout(nodeTypes, initialRelations), [nodeTypes, initialRelations]);

  const initialEdges: Edge[] = useMemo(() => initialRelations.map((rel: AllowedRelation) => ({
    id: rel.id, source: rel.parentNodeTypeId, target: rel.childNodeTypeId, animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 },
    style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 }
  })), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);

  const onConnect = useCallback(async (params: Connection) => {
    if (isReadOnly) return;
    if (params.source && params.target && params.source !== params.target) {
      setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 }, style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 } }, eds));
      await createRelation(projectId, params.source, params.target);
    }
  }, [setEdges, projectId, isReadOnly]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    if (isReadOnly) return;
    for (const edge of edgesToDelete) await deleteRelation(projectId, edge.id);
  }, [projectId, isReadOnly]);

  return (
    <div className="flow-canvas-container">
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes_flow} 
        onNodesChange={onNodesChange} 
        onEdgesChange={onEdgesChange} 
        onConnect={onConnect} 
        onEdgesDelete={onEdgesDelete} 
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={true}
        fitView
      >
        <Background color="var(--outline-variant)" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
