"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Connection, 
  Edge, 
  addEdge, 
  useNodesState, 
  useEdgesState,
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { createRelation, deleteRelation } from '@/lib/actions';
import { IconRenderer } from './IconPicker';

// Custom Node component to show icons in Sanctuary style
// Custom Node component to show icons in Sanctuary style
const NodeTypeNode = ({ data }: any) => {
  return (
    <div 
      className="flow-node-card" 
      style={{ '--node-color': data.color || 'var(--primary)' } as any}
    >
      <Handle type="target" position={Position.Top} className="flow-handle-target" />
      <div className="flow-node-icon text-node-color">
        <IconRenderer name={data.icon} size={20} />
      </div>
      <div className="text-meta text-xs font-bold">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="flow-handle-source" />
    </div>
  );
};

const nodeTypes_flow = {
  nodeType: NodeTypeNode,
};

interface RelationEditorProps {
  projectId: string;
  nodeTypes: any[];
  initialRelations: any[];
}

export function RelationEditor({ projectId, nodeTypes, initialRelations }: RelationEditorProps) {
  // Simple layout logic
  const initialNodes = useMemo(() => nodeTypes.map((type, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    
    return {
      id: type.id,
      type: 'nodeType',
      data: { 
        label: type.name.toUpperCase(), 
        color: type.color, 
        icon: type.icon || 'Target' 
      },
      position: { x: col * 280, y: row * 120 },
    };
  }), [nodeTypes]);

  const initialEdges: Edge[] = useMemo(() => initialRelations.map(rel => ({
    id: rel.id,
    source: rel.parentNodeTypeId,
    target: rel.childNodeTypeId,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'var(--primary)',
      width: 20,
      height: 20
    },
    style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 }
  })), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(async (params: Connection) => {
    if (params.source && params.target) {
      if (params.source === params.target) return; // Prevent self-link
      
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 },
        style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 }
      }, eds));
      
      await createRelation(projectId, params.source, params.target);
    }
  }, [setEdges, projectId]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      await deleteRelation(projectId, edge.id);
    }
  }, [projectId]);

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
        fitView
      >
        <Background color="var(--outline-variant)" gap={24} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
      
      {/* Toolbar Area */}
      <div className="flow-toolbar-top">
        <div className="glass flex p-xs rounded-full shadow-ambient">
            <button className="button-premium px-xl text-xs">Select</button>
            <button className="button-secondary border-none px-xl text-xs text-on-surface-variant">Connect</button>
            <button className="button-secondary border-none px-xl text-xs text-on-surface-variant">Inspect</button>
        </div>
      </div>

      <div className="flow-instructions">
        Connect BOTTOM to TOP to define parent-child flow
      </div>
    </div>
  );
}
