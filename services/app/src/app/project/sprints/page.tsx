"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getSprints, getNodeTypes } from "@/lib/actions";
import { SprintPage } from "@/components/SprintPage";

export default function Sprints() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{
    sprints: any[];
    nodeTypes: any[];
  } | null>(null);

  const fetchData = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      getSprints(projectId),
      getNodeTypes(projectId)
    ])
      .then(([sprints, nodeTypes]) => {
        setState({ sprints, nodeTypes });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load sprints data");
        setLoading(false);
      });
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    fetchData();
  }, [projectId, fetchData]);

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
        <div className="text-xl opacity-50">Loading sprints...</div>
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
      <SprintPage 
        projectId={projectId} 
        sprints={state.sprints} 
        nodeTypes={state.nodeTypes} 
        onRefresh={fetchData}
      />
    </div>
  );
}
