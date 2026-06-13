"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getNodeTypes, getRelations } from "@/lib/actions";
import { NodeEcosystemEditor } from "@/components/NodeEcosystemEditor";

export default function NodeArchitecturePage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{
    nodeTypes: any[];
    relations: any[];
  } | null>(null);

  const fetchData = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      getNodeTypes(projectId),
      getRelations(projectId)
    ])
      .then(([nodeTypes, relations]) => {
        setState({ nodeTypes, relations });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load ecosystem data");
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
        <div className="text-xl opacity-50">Loading architecture ecosystem...</div>
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
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Node Blueprints</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Design your nodes. Click types to configure, drag connections to define rules.
        </p>
      </div>

      <NodeEcosystemEditor
        projectId={projectId}
        nodeTypes={state.nodeTypes}
        initialRelations={state.relations}
      />
    </div>
  );
}
