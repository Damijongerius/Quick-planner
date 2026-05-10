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
    <div className="flex flex-col gap-xl">
      {nodeTypes.map(type => {
        const typeNodes = nodes.filter((n: any) => n.nodeTypeId === type.id);
        if (typeNodes.length === 0) return null;

        return (
          <div key={type.id} className="swimlane-section">
            <h3 className="swimlane-title" style={{ color: type.color }}>{type.name}s</h3>
            <div className="grid grid-cols-3 gap-lg">
              {statuses.map(status => (
                <div key={status} className="swimlane-column">
                  <h4 className="swimlane-column-label">{status}</h4>
                  <div className="flex flex-col gap-sm">
                    {typeNodes.filter((n: any) => n.status === status).map((node: any) => (
                      <div
                        key={node.id}
                        className="swimlane-card"
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
