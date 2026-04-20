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

// Custom Node component to show icons
const NodeTypeNode = ({ data }: any) => {
  return (
    <div style={{ 
      padding: '12px', 
      borderRadius: '12px', 
      background: 'rgba(15, 15, 20, 0.9)', 
      border: `2px solid ${data.color || '#3b82f6'}`,
      color: '#fff',
      minWidth: '150px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      boxShadow: `0 0 20px ${data.color}20`
    }}>
      <Handle type="target" position={Position.Top} style={{ background: data.color }} />
      <div style={{ 
        padding: '8px', 
        borderRadius: '8px', 
        backgroundColor: `${data.color}20`,
        color: data.color
      }}>
        <IconRenderer name={data.icon} size={20} />
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: data.color }} />
    </div>
  );
};

const nodeTypes_flow = {
  nodeType: NodeTypeNode,
};

interface RelationEditorProps {
  nodeTypes: any[];
  initialRelations: any[];
}

export function RelationEditor({ nodeTypes, initialRelations }: RelationEditorProps) {
  // Simple vertical layout logic
  const initialNodes = useMemo(() => nodeTypes.map((type, index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    
    return {
      id: type.id,
      type: 'nodeType',
      data: { 
        label: type.name, 
        color: type.color, 
        icon: type.icon || 'Target' 
      },
      position: { x: col * 250, y: row * 150 },
    };
  }), [nodeTypes]);

  const initialEdges: Edge[] = useMemo(() => initialRelations.map(rel => ({
    id: rel.id,
    source: rel.parentNodeTypeId,
    target: rel.childNodeTypeId,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#6366f1',
    },
    style: { stroke: '#6366f1', strokeWidth: 2 }
  })), [initialRelations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(async (params: Connection) => {
    if (params.source && params.target) {
      if (params.source === params.target) return; // Prevent self-link
      
      setEdges((eds) => addEdge({
        ...params,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
        style: { stroke: '#6366f1', strokeWidth: 2 }
      }, eds));
      
      await createRelation(params.source, params.target);
    }
  }, [setEdges]);

  const onEdgesDelete = useCallback(async (edgesToDelete: Edge[]) => {
    for (const edge of edgesToDelete) {
      await deleteRelation(edge.id);
    }
  }, []);

  return (
    <div className="glass" style={{ width: '100%', height: '600px', padding: '10px', overflow: 'hidden', position: 'relative' }}>
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
        <Background color="#111" gap={20} size={1} />
        <Controls />
      </ReactFlow>
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        fontSize: '0.75rem', 
        color: '#6b7280', 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        padding: '8px 12px', 
        borderRadius: '8px',
        pointerEvents: 'none'
      }}>
        Drag from BOTTOM handle to TOP handle to define "Parent {"->"} Child" flow.
      </div>
    </div>
  );
}
