"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, Connection, Edge, addEdge, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { createRelation, deleteRelation } from '@/lib/actions';
import { Button } from './ui/Button';
import { Plus, FileJson } from 'lucide-react';
import { BoardConfigEditor } from './BoardConfigEditor';
import { AIImportModal } from './ai/AIImportModal';
import { NodeTypeNode } from './NodeTypeNode';
import { EcosystemSidePanel } from './EcosystemSidePanel';
import { EcosystemCreationOverlay } from './EcosystemCreationOverlay';
import { calculateHierarchicalLayout } from '@/lib/flowLayout';
import { NodeType, AllowedRelation } from '@/lib/types';
import "./Flow.css";
import "./Blueprint.css";

const nodeTypes_flow = { nodeType: NodeTypeNode };

interface NodeEcosystemEditorProps {
  projectId: string;
  nodeTypes: NodeType[];
  initialRelations: AllowedRelation[];
}

export function NodeEcosystemEditor({ projectId, nodeTypes, initialRelations }: NodeEcosystemEditorProps) {
  const [activeNodeType, setActiveNodeType] = useState<NodeType | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const initialNodes = useMemo(() => transformToFlowNodes(nodeTypes, initialRelations, setActiveNodeType), [nodeTypes, initialRelations]);
  const initialEdges: Edge[] = useMemo(() => transformToFlowEdges(initialRelations), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);

  useEffect(() => {
    if (activeNodeType) {
      const updated = nodeTypes.find(t => t.id === activeNodeType.id);
      if (updated) setActiveNodeType(updated);
    }
  }, [nodeTypes, activeNodeType?.id]);

  return (
    <div className="flow-canvas-container" style={{ height: '70vh' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes_flow} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onEdgesDelete={onEdgesDelete} onNodeClick={(_, n) => setActiveNodeType(nodeTypes.find((t) => t.id === n.id) || null)} fitView>
        <Background color="var(--outline-variant)" gap={32} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>


      <div className="absolute top-md right-md z-10 flex gap-md">
        <Button onClick={() => setIsCreating(true)} size="sm" icon={<Plus size={18} />}>CREATE TYPE</Button>
        <Button onClick={() => setIsAIModalOpen(true)} size="sm" variant="secondary" icon={<FileJson size={18} />}>AI ARCHITECT</Button>
      </div>

      {isCreating && <EcosystemCreationOverlay projectId={projectId} onClose={() => setIsCreating(false)} />}
      {activeNodeType && <EcosystemSidePanel projectId={projectId} activeNodeType={activeNodeType} onClose={() => setActiveNodeType(null)} />}
      <AIImportModal projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} mode="NODE_TYPES" context={{ nodeTypes: nodeTypes.map((t) => ({ name: t.name, color: t.color, icon: t.icon })), relations: initialRelations.map((r) => ({ parent: r.parentNodeType.name, child: r.childNodeTypeType.name })) }} />
    </div>
  );

  async function onConnect(params: Connection) {
    if (params.source && params.target && params.source !== params.target) {
      setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 }, style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 } }, eds));
      await createRelation(projectId, params.source, params.target);
    }
  }

  async function onEdgesDelete(edgesToDelete: Edge[]) {
    for (const edge of edgesToDelete) await deleteRelation(projectId, edge.id);
  }
}

function transformToFlowNodes(nodeTypes: NodeType[], relations: AllowedRelation[], setActiveNodeType: (type: NodeType | null) => void) {
  return calculateHierarchicalLayout(nodeTypes, relations).map((n) => {
    const type = nodeTypes.find((t) => t.id === n.id);
    return {
      ...n, 
      data: { 
        ...n.data, 
        fields: type?.fields || [],
        onClick: () => setActiveNodeType(type || null) 
      }
    };
  });
}

function transformToFlowEdges(relations: AllowedRelation[]): Edge[] {
  return relations.map((rel) => ({
    id: rel.id, source: rel.parentNodeTypeId, target: rel.childNodeTypeId, animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 },
    style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 }
  }));
}
