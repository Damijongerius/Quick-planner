"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { getSprints, getNodeTypes, getBoardData } from "@/lib/actions";
import { KanbanBoard } from "@/components/KanbanBoard";
import { BoardHeader } from "@/components/BoardHeader";
import { GanttChart } from "@/components/GanttChart";
import { SwimlaneBoard } from "@/components/SwimlaneBoard";
import { NodeDetailPanel } from "@/components/NodeDetailPanel";
import { Search, Clock, Play, CheckCircle2 } from "lucide-react";

const DEFAULT_STATUSES = [
  { id: "TODO", label: "To Do", color: "#9ca3af", icon: Clock },
  { id: "IN_PROGRESS", label: "In Progress", color: "#3b82f6", icon: Play },
  { id: "DONE", label: "Completed", color: "#10b981", icon: CheckCircle2 }
];

export default function BoardPage() {
  const [sprints, setSprints] = useState<any[]>([]);
  const [nodeTypes, setNodeTypes] = useState<any[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [selectedNodeTypeId, setSelectedNodeTypeId] = useState<string>("all");
  const [viewMode, setViewMode] = useState<string>("KANBAN");
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const refreshNodes = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitial = async () => {
      const [sprintsData, typesData] = await Promise.all([
        getSprints(),
        getNodeTypes()
      ]);
      setSprints(sprintsData);
      setNodeTypes(typesData);
      
      const active = sprintsData.find((s: any) => s.status === 'ACTIVE') || sprintsData[0];
      if (active) setSelectedSprintId(active.id);
      setLoading(false);
    };
    loadInitial();
  }, []);

  // Fetch board data
  useEffect(() => {
    if (selectedSprintId) {
      const loadBoard = async () => {
        const data = await getBoardData(selectedSprintId, selectedNodeTypeId === "all" ? undefined : selectedNodeTypeId);
        setNodes(data);
        
        if (selectedNodeTypeId !== "all") {
          const type = nodeTypes.find(t => t.id === selectedNodeTypeId);
          const config = type?.boardConfig as any;
          if (config?.preferredView) {
            setViewMode(config.preferredView);
          }
        }
      };
      loadBoard();
    }
  }, [selectedSprintId, selectedNodeTypeId, refreshKey, nodeTypes]);

  // Compute Columns based on selection
  const columns = useMemo(() => {
    if (selectedNodeTypeId !== "all") {
      const type = nodeTypes.find(t => t.id === selectedNodeTypeId);
      const config = type?.boardConfig as any;
      if (config?.statuses && config.statuses.length > 0) {
        return config.statuses.map((s: any) => ({
          id: s.id,
          title: s.label,
          color: s.color,
          icon: s.id === 'DONE' ? CheckCircle2 : (s.id === 'IN_PROGRESS' ? Play : Clock)
        }));
      }
    }
    return DEFAULT_STATUSES;
  }, [selectedNodeTypeId, nodeTypes]);

  if (!isMounted) return null;
  if (loading) return <div style={{ padding: '40px', opacity: 0.5 }}>Loading boards...</div>;

  const currentSprint = sprints.find(s => s.id === selectedSprintId);

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <BoardHeader 
        sprints={sprints}
        nodeTypes={nodeTypes}
        selectedSprintId={selectedSprintId}
        selectedNodeTypeId={selectedNodeTypeId}
        viewMode={viewMode}
        onSprintChange={setSelectedSprintId}
        onNodeTypeChange={setSelectedNodeTypeId}
        onViewModeChange={setViewMode}
      />

      <div style={{ flex: 1, overflow: 'hidden', marginTop: '24px' }}>
        {nodes.length === 0 ? (
          <div style={{ padding: '80px', textAlign: 'center', opacity: 0.3 }}>
            <Search size={64} style={{ marginBottom: '24px' }} />
            <p style={{ fontSize: '1.25rem' }}>No items found for this sprint and filter.</p>
          </div>
        ) : (
          <div style={{ height: '100%', overflow: 'auto' }}>
            {viewMode === "KANBAN" && (
              <KanbanBoard 
                initialSprint={currentSprint} 
                initialNodes={nodes} 
                columns={columns} 
                onRefresh={refreshNodes}
                onNodeClick={(id) => setSelectedNodeId(id)}
              />
            )}
            {viewMode === "GANTT" && <GanttChart nodes={nodes} currentSprint={currentSprint} />}
            {viewMode === "SWIMLANE" && (
              <SwimlaneBoard 
                nodes={nodes} 
                nodeTypes={nodeTypes} 
                selectedNodeTypeId={selectedNodeTypeId} 
                columns={columns} 
                onRefresh={refreshNodes}
                onNodeClick={(id) => setSelectedNodeId(id)}
              />
            )}
          </div>
        )}
      </div>

      <NodeDetailPanel 
        nodeId={selectedNodeId} 
        onClose={() => setSelectedNodeId(null)}
        onUpdate={refreshNodes}
      />
    </div>
  );
}
