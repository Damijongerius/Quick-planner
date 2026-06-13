"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getNodeTypes, getRelations } from "@/lib/actions";
import { RelationEditor } from "@/components/RelationEditor";
import { AllowedRelation } from "@/lib/types";

export default function RelationsPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{
    nodeTypes: any[];
    relations: AllowedRelation[];
  } | null>(null);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
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
        setError("Failed to load relations data");
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xl opacity-50">Loading relations editor...</div>
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
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Node Relations</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Define how your strategic nodes connect and flow. Drag from the bottom handle to the top handle.
        </p>
      </div>

      <RelationEditor projectId={projectId} nodeTypes={state.nodeTypes} initialRelations={state.relations} />
      
      <section style={{ marginTop: '64px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(89, 96, 100, 0.4)', marginBottom: '24px' }}>Active Governance Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {state.relations.map((rel: AllowedRelation) => (
            <div key={rel.id} className="card-planner" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: rel.parentNodeType.color || 'var(--primary)' }}>{rel.parentNodeType.name}</span>
                <span style={{ color: 'var(--outline-variant)', fontWeight: 300 }}>→</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: rel.childNodeTypeType.color || 'var(--primary)' }}>{rel.childNodeTypeType.name}</span>
              </div>
            </div>
          ))}
          {state.relations.length === 0 && (
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontStyle: 'italic' }}>No relations defined yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
