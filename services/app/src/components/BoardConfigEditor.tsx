"use client";

import { useState, useEffect } from "react";
import { X, LayoutGrid, Calendar, ListTodo, Save, CheckCircle2 } from "lucide-react";
import { updateNodeTypeBoardConfig } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

interface BoardConfigEditorProps {
  projectId: string;
  nodeType: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BoardConfigEditor({ projectId, nodeType, isOpen, onClose }: BoardConfigEditorProps) {
  const [preferredView, setPreferredView] = useState("KANBAN");
  const [isSprintEligible, setIsSprintEligible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (nodeType) {
      setPreferredView(nodeType.boardConfig?.preferredView || "KANBAN");
      setIsSprintEligible(nodeType.isSprintEligible);
    }
  }, [nodeType]);

  if (!isOpen || !nodeType) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateNodeTypeBoardConfig(projectId, nodeType.id, {
        preferredView,
        isSprintEligible
      });
      onClose();
    } catch (error) {
      console.error("Failed to save board config", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(44, 52, 55, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="card-sanctuary"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 0,
          backgroundColor: 'var(--surface-container-lowest)',
          overflow: 'hidden',
          borderRadius: '32px',
          boxShadow: 'var(--ambient-shadow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 40px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)' }}>Governance Logic</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 500 }}>Behavioral rules for {nodeType.name}</p>
          </div>
          <button onClick={onClose} className="button-secondary" style={{ padding: '8px', border: 'none' }}>
            <X size={20} />
          </button>
        </header>

        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Visibility Section */}
          <div>
            <label className="text-meta" style={{ display: 'block', marginBottom: '16px' }}>Board Integration</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button 
                    onClick={() => setPreferredView("KANBAN")}
                    className="button-secondary"
                    style={{ 
                        flexDirection: 'column', 
                        height: '100px', 
                        gap: '8px',
                        borderColor: preferredView === 'KANBAN' ? 'var(--primary)' : 'var(--outline-variant)',
                        backgroundColor: preferredView === 'KANBAN' ? 'var(--surface-container-low)' : 'transparent',
                        color: preferredView === 'KANBAN' ? 'var(--primary)' : 'var(--on-surface-variant)'
                    }}
                >
                    <LayoutGrid size={24} />
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontWeight: preferredView === 'KANBAN' ? 800 : 600 }}>Kanban Only</span>
                        <span style={{ fontSize: '10px', opacity: 0.6 }}>Hidden on Gantt</span>
                    </div>
                </button>
                <button 
                    onClick={() => setPreferredView("GANTT")}
                    className="button-secondary"
                    style={{ 
                        flexDirection: 'column', 
                        height: '100px', 
                        gap: '8px',
                        borderColor: preferredView === 'GANTT' ? 'var(--primary)' : 'var(--outline-variant)',
                        backgroundColor: preferredView === 'GANTT' ? 'var(--surface-container-low)' : 'transparent',
                        color: preferredView === 'GANTT' ? 'var(--primary)' : 'var(--on-surface-variant)'
                    }}
                >
                    <Calendar size={24} />
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontWeight: preferredView === 'GANTT' ? 800 : 600 }}>Gantt Only</span>
                        <span style={{ fontSize: '10px', opacity: 0.6 }}>Hidden on Kanban</span>
                    </div>
                </button>
            </div>
          </div>

          {/* Eligibility Section */}
          <div style={{ padding: '24px', backgroundColor: 'var(--surface-container-low)', borderRadius: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>Sprint Eligibility</h4>
                      <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>Can this node be assigned to a strategic cycle?</p>
                  </div>
                  <div 
                    onClick={() => setIsSprintEligible(!isSprintEligible)}
                    style={{ 
                        width: '48px', 
                        height: '24px', 
                        borderRadius: '12px', 
                        backgroundColor: isSprintEligible ? 'var(--tertiary)' : 'var(--surface-container-high)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                  >
                      <motion.div 
                        animate={{ x: isSprintEligible ? 24 : 0 }}
                        style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            backgroundColor: 'white', 
                            position: 'absolute', 
                            top: '2px', 
                            left: '2px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      />
                  </div>
              </div>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: 'rgba(70, 86, 184, 0.05)', borderRadius: '12px', border: '1px solid rgba(70, 86, 184, 0.1)' }}>
              <p style={{ fontSize: '12px', color: 'var(--primary)', lineHeight: 1.5 }}>
                  <strong>Note:</strong> Items that aren't eligible for sprints (like Legendaries) will show on the board/gantt based on project timelines rather than specific cycles.
              </p>
          </div>
        </div>

        <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--outline-variant)', display: 'flex', gap: '12px' }}>
            <button 
                onClick={handleSave}
                className="button-premium" 
                style={{ flex: 1 }}
                disabled={isSaving}
            >
                {isSaving ? "Saving..." : <><Save size={18} /> Apply Governance</>}
            </button>
            <button onClick={onClose} className="button-secondary" style={{ border: 'none' }}>
                Discard
            </button>
        </footer>
      </motion.div>
    </div>
  );
}
