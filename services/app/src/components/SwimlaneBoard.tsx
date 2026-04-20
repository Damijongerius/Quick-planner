"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { updateNodeStatus } from "@/lib/actions";

interface SwimlaneBoardProps {
  projectId: string;
  nodes: any[];
  nodeTypes: any[];
  onRefresh: () => void;
}

export function SwimlaneBoard({ projectId, nodes, nodeTypes, onRefresh }: SwimlaneBoardProps) {
  const statuses = ["TODO", "IN_PROGRESS", "DONE"];

  const handleStatusChange = async (nodeId: string, newStatus: string) => {
    await updateNodeStatus(projectId, nodeId, newStatus);
    onRefresh();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {nodeTypes.map(type => {
        const typeNodes = nodes.filter(n => n.nodeTypeId === type.id);
        if (typeNodes.length === 0) return null;

        return (
          <div key={type.id}>
            <h3 style={{ color: type.color, marginBottom: '1rem' }}>{type.name}s</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {statuses.map(status => (
                <div key={status} style={{ backgroundColor: '#1f2937', padding: '1rem', borderRadius: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '1rem' }}>{status}</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {typeNodes.filter(n => n.status === status).map(node => (
                      <div 
                        key={node.id} 
                        style={{ backgroundColor: '#374151', padding: '0.75rem', borderRadius: '0.25rem', cursor: 'pointer' }}
                        onClick={() => {
                          const nextStatus = statuses[(statuses.indexOf(status) + 1) % statuses.length];
                          handleStatusChange(node.id, nextStatus);
                        }}
                      >
                        {node.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
