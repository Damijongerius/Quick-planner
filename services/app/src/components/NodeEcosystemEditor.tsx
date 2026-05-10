"use client";

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, { Background, Controls, Connection, Edge, addEdge, useNodesState, useEdgesState, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { createRelation, deleteRelation } from '@/lib/actions';
import { Button } from './ui/Button';
import { Plus, FileJson } from 'lucide-react';
import { FieldEditor } from './FieldEditor';
import { BoardConfigEditor } from './BoardConfigEditor';
import { AIImportModal } from './ai/AIImportModal';
import { NodeTypeNode } from './NodeTypeNode';
import { EcosystemSidePanel } from './EcosystemSidePanel';
import { EcosystemCreationOverlay } from './EcosystemCreationOverlay';
import { calculateHierarchicalLayout } from '@/lib/flowLayout';
import "./Flow.css";
import "./Blueprint.css";

const nodeTypes_flow = { nodeType: NodeTypeNode };

export function NodeEcosystemEditor({ projectId, nodeTypes, initialRelations }: any) {
  const [activeNodeType, setActiveNodeType] = useState<any>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const initialNodes = useMemo(() => calculateHierarchicalLayout(nodeTypes, initialRelations).map((n: any) => ({
    ...n, data: { ...n.data, onClick: () => setActiveNodeType(nodeTypes.find((t: any) => t.id === n.id)) }
  })), [nodeTypes, initialRelations]);

  const initialEdges: Edge[] = useMemo(() => initialRelations.map((rel: any) => ({
    id: rel.id, source: rel.parentNodeTypeId, target: rel.childNodeTypeId, animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 },
    style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 }
  })), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);

  const onConnect = useCallback(async (params: Connection) => {
    if (params.source && params.target && params.source !== params.target) {
      setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 }, style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 } }, eds));
      await createRelation(projectId, params.source, params.target);
    }
  }, [setEdges, projectId]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) await deleteRelation(projectId, edge.id);
  }, [projectId]);

  return (
    <div className="flow-canvas-container" style={{ height: '70vh' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes_flow} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onEdgesDelete={onEdgesDelete} onNodeClick={(_, n) => setActiveNodeType(nodeTypes.find((t: any) => t.id === n.id))} fitView>
        <Background color="var(--outline-variant)" gap={32} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      <div className="absolute top-md right-md z-50 flex gap-md">
        <Button onClick={() => setIsCreating(true)} size="sm" icon={<Plus size={18} />}>CREATE TYPE</Button>
        <Button onClick={() => setIsAIModalOpen(true)} size="sm" variant="secondary" icon={<FileJson size={18} />}>AI ARCHITECT</Button>
      </div>

      {isCreating && <EcosystemCreationOverlay projectId={projectId} onClose={() => setIsCreating(false)} />}
      {activeNodeType && <EcosystemSidePanel projectId={projectId} activeNodeType={activeNodeType} onClose={() => setActiveNodeType(null)} onOpenFieldEditor={() => setIsFieldEditorOpen(true)} onOpenBoardEditor={() => setIsBoardEditorOpen(true)} />}

      <FieldEditor projectId={projectId} nodeType={activeNodeType} isOpen={isFieldEditorOpen} onClose={() => setIsFieldEditorOpen(false)} />
      <BoardConfigEditor projectId={projectId} nodeType={activeNodeType} isOpen={isBoardEditorOpen} onClose={() => setIsBoardEditorOpen(false)} />
      <AIImportModal projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} mode="NODE_TYPES" context={{ nodeTypes: nodeTypes.map((t: any) => ({ name: t.name, color: t.color, icon: t.icon })), relations: initialRelations.map((r: any) => ({ parent: r.parentNodeType.name, child: r.childNodeTypeType.name })) }} />
    </div>
  );
}
