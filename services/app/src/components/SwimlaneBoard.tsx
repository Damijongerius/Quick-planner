"use client";

import { useMemo } from "react";
import { updateNodeStatus } from "@/lib/actions";
import { ShieldAlert } from "lucide-react";

interface SwimlaneBoardProps {
  nodes: any[];
  nodeTypes: any[];
  selectedNodeTypeId: string;
  columns: any[];
  onRefresh: () => void;
  onNodeClick: (id: string) => void;
}

export function SwimlaneBoard({ nodes, nodeTypes, selectedNodeTypeId, columns, onRefresh, onNodeClick }: SwimlaneBoardProps) {
  // Group nodes by parent
  const groups = useMemo(() => {
    const map: Record<string, { parent: any, nodes: any[] }> = {};
    
    nodes.forEach(node => {
      const parent = node.parentLinks?.[0]?.parentNode;
      const parentId = parent?.id || "unparented";
      
      if (!map[parentId]) {
        map[parentId] = { 
          parent: parent || { title: "No Parent / Uncategorized" }, 
          nodes: [] 
        };
      }
      map[parentId].nodes.push(node);
    });
    
    return Object.values(map);
  }, [nodes]);

  const handleStatusChange = async (nodeId: string, newStatus: string) => {
    await updateNodeStatus(nodeId, newStatus);
    onRefresh();
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '32px', padding: '0 8px' }}>
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} style={{ minWidth: '1200px' }}>
          {/* Group Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            marginBottom: '16px', 
            padding: '8px 16px', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: group.parent.type?.color || '#3b82f6' }} />
            <span style={{ fontWeight: 600, color: '#9ca3af', fontSize: '0.9rem' }}>{group.parent.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: '16px' }}>
            {columns.map((col) => (
              <div 
                key={col.id} 
                className="glass"
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.01)', 
                  minHeight: '120px', 
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderTop: `2px solid ${col.color}`
                }}
              >
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: col.color, textTransform: 'uppercase', marginBottom: '8px', opacity: 0.5 }}>
                  {col.title}
                </div>
                {group.nodes.filter(n => n.status === col.id).map(node => {
                  const displayFields = (node.type?.boardConfig as any)?.cardFields || [];
                  const fieldsToShow = node.type.fields.filter((f: any) => displayFields.includes(f.id));

                  return (
                    <div 
                      key={node.id} 
                      className="glass"
                      onClick={() => onNodeClick(node.id)}
                      style={{ 
                        padding: '16px', 
                        backgroundColor: 'rgba(255,255,255,0.03)', 
                        cursor: 'pointer',
                        position: 'relative',
                        borderLeft: `4px solid ${node.type.color}`
                      }}
                    >
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: fieldsToShow.length > 0 ? '8px' : '12px' }}>{node.title}</div>
                      
                      {/* Placeholders */}
                      {fieldsToShow.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                          {fieldsToShow.map((field: any) => (
                            <div key={field.id} style={{ fontSize: '0.6rem', color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.03)', padding: '2px 4px', borderRadius: '4px' }}>
                              {node.content?.[field.id] || '---'}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Blocking Alert */}
                      {node.blockedBy?.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontSize: '0.7rem', marginTop: '8px', marginBottom: '8px' }}>
                          <ShieldAlert size={12} /> BLOCKED
                        </div>
                      )}

                      <div 
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {columns.map(status => (
                          <button
                            key={status.id}
                            onClick={() => handleStatusChange(node.id, status.id)}
                            disabled={status.id === node.status}
                            style={{ 
                              fontSize: '0.55rem', 
                              padding: '2px 4px', 
                              borderRadius: '4px',
                              backgroundColor: status.id === node.status ? `${node.type.color}40` : 'rgba(255,255,255,0.05)',
                              color: status.id === node.status ? node.type.color : '#6b7280',
                              border: 'none',
                              cursor: status.id === node.status ? 'default' : 'pointer'
                            }}
                          >
                            {status.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
