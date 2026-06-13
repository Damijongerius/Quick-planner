"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getSprints, getNodeTypes, getAllNodes } from "@/lib/actions";
import { BoardView } from "@/components/BoardView";

export default function BoardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{
    sprints: any[];
    nodeTypes: any[];
    allNodes: any[];
    activeSprintId: string | undefined;
  } | null>(null);

  const fetchData = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      getSprints(projectId),
      getNodeTypes(projectId),
      getAllNodes(projectId)
    ])
      .then(([sprints, nodeTypes, allNodes]) => {
        const activeSprint = sprints.find((s: any) => s.status === 'ACTIVE') || sprints[0];
        setState({
          sprints,
          nodeTypes,
          allNodes,
          activeSprintId: activeSprint?.id
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load board data");
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleMutation = () => {
      fetchData();
    };
    window.addEventListener("project-mutated", handleMutation);
    return () => {
      window.removeEventListener("project-mutated", handleMutation);
    };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl opacity-50">Loading board...</div>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-error">
        <div>{error || "Failed to load data."}</div>
      </div>
    );
  }

  return (
    <div className="canvas-content">
      <BoardView 
        projectId={projectId}
        initialSprints={state.sprints} 
        initialNodeTypes={state.nodeTypes} 
        initialNodes={state.allNodes}
        initialActiveSprintId={state.activeSprintId}
      />
    </div>
  );
}
