"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getRootNodes, getNodeTypes, getSprints, getAllNodes } from "@/lib/actions";
import { BacklogView } from "@/components/BacklogView";

export default function BacklogPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{
    rootNodes: any[];
    nodeTypes: any[];
    sprints: any[];
    allNodes: any[];
  } | null>(null);

  const fetchData = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      getRootNodes(projectId),
      getNodeTypes(projectId),
      getSprints(projectId),
      getAllNodes(projectId)
    ])
      .then(([rootNodes, nodeTypes, sprints, allNodes]) => {
        setState({ rootNodes, nodeTypes, sprints, allNodes });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load backlog data");
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
        <div className="text-xl opacity-50">Loading backlog...</div>
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
      <div className="board-header">
        <div className="flex flex-col gap-sm">
          <h2 className="board-title">Backlog</h2>
        </div>
      </div>

      <BacklogView
        projectId={projectId}
        rootNodes={state.rootNodes}
        nodeTypes={state.nodeTypes}
        sprints={state.sprints}
        allNodes={state.allNodes}
      />
    </div>
  );
}
