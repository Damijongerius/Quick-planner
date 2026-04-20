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
const NodeTypeNode = ({ data }: any) => {
  return (
    <div className="card-sanctuary" style={{ 
      padding: '16px', 
      borderRadius: '12px', 
      background: 'var(--surface-container-lowest)', 
      borderLeft: `4px solid ${data.color || 'var(--primary)'}`,
      color: 'var(--on-surface)',
      minWidth: '160px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: 'var(--outline-variant)', border: 'none', width: '8px', height: '8px' }} />
      <div style={{ 
        color: data.color || 'var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <IconRenderer name={data.icon} size={20} />
      </div>
      <div className="text-meta" style={{ fontSize: '10px', fontWeight: 800 }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: 'var(--primary)', border: 'none', width: '8px', height: '8px' }} />
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
    <div style={{ width: '100%', height: '500px', borderRadius: '32px', overflow: 'hidden', position: 'relative', border: '1px solid var(--outline-variant)' }}>
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
      <div style={{ 
        position: 'absolute', 
        top: '24px', 
        left: '24px', 
        display: 'flex', 
        gap: '12px',
        zIndex: 10
      }}>
        <div className="glass" style={{ padding: '4px', borderRadius: '9999px', display: 'flex', boxShadow: 'var(--ambient-shadow)' }}>
            <button className="button-premium" style={{ padding: '8px 24px', fontSize: '11px' }}>Select</button>
            <button className="button-secondary" style={{ border: 'none', padding: '8px 24px', fontSize: '11px', color: 'var(--on-surface-variant)' }}>Connect</button>
            <button className="button-secondary" style={{ border: 'none', padding: '8px 24px', fontSize: '11px', color: 'var(--on-surface-variant)' }}>Inspect</button>
        </div>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '24px', 
        left: '24px', 
        fontSize: '11px', 
        fontWeight: 700,
        color: 'var(--on-surface-variant)', 
        backgroundColor: 'rgba(255,255,255,0.8)', 
        backdropFilter: 'blur(8px)',
        padding: '8px 16px', 
        borderRadius: '9999px',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Connect BOTTOM to TOP to define parent-child flow
      </div>
    </div>
  );
}
