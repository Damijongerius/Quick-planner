"use client";

import { updateNodeStatus } from "@/lib/actions";
import { Node, NodeType } from "@/lib/types";

interface SwimlaneBoardProps {
  projectId: string;
  nodes: Node[];
  nodeTypes: NodeType[];
  onRefresh: () => void;
}

function SwimlaneCard({ node, currentStatus, statuses, onStatusChange }: Readonly<{ node: Node; currentStatus: string; statuses: string[]; onStatusChange: (id: string, status: string) => void }>) {
  const handleNextStatus = () => {
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
    onStatusChange(node.id, nextStatus);
  };

  return (
    <button
      className="swimlane-card text-left"
      onClick={handleNextStatus}
      aria-label={`Move ${node.title} to next status`}
    >
      {node.title}
    </button>
  );
}

export function SwimlaneBoard({ projectId, nodes, nodeTypes, onRefresh }: Readonly<SwimlaneBoardProps>) {
  const statuses = ["TODO", "IN_PROGRESS", "DONE"];

  const handleStatusChange = async (nodeId: string, newStatus: string) => {
    await updateNodeStatus(projectId, nodeId, newStatus);
    onRefresh();
  };

  return (
    <div className="flex flex-col gap-xl">
      {nodeTypes.map(type => {
        const typeNodes = nodes.filter((n) => n.nodeTypeId === type.id);
        
        return typeNodes.length > 0 ? (
          <div key={type.id} className="swimlane-section">
            <h3 className="swimlane-title" style={{ color: type.color || 'var(--primary)' }}>{type.name}s</h3>
            <div className="grid grid-cols-3 gap-lg">
              {statuses.map(status => (
                <div key={status} className="swimlane-column">
                  <h4 className="swimlane-column-label">{status}</h4>
                  <div className="flex flex-col gap-sm">
                    {typeNodes.filter((n) => n.status === status).map((node) => (
                      <SwimlaneCard 
                        key={node.id} 
                        node={node} 
                        currentStatus={status} 
                        statuses={statuses} 
                        onStatusChange={handleStatusChange} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })}
    </div>
  );
}
