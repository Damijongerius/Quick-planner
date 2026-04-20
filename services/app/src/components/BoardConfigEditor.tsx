"use client";

import { useState, useEffect } from "react";
import { X, LayoutGrid, Calendar, ListTodo, Save, Plus, Trash2, ArrowUp, ArrowDown, Eye } from "lucide-react";
import { updateNodeTypeBoardConfig } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumColorPicker } from "./PremiumColorPicker";

interface BoardConfigEditorProps {
  nodeType: any;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_STATUSES = [
  { id: "TODO", label: "To Do", color: "#9ca3af" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
  { id: "DONE", label: "Completed", color: "#10b981" }
];

export function BoardConfigEditor({ nodeType, isOpen, onClose }: BoardConfigEditorProps) {
  const [preferredView, setPreferredView] = useState("KANBAN");
  const [statuses, setStatuses] = useState<any[]>(DEFAULT_STATUSES);
  const [cardFields, setCardFields] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (nodeType?.boardConfig) {
      const config = nodeType.boardConfig as any;
      setPreferredView(config.preferredView || "KANBAN");
      setStatuses(config.statuses || DEFAULT_STATUSES);
      setCardFields(config.cardFields || []);
    } else {
      setPreferredView("KANBAN");
      setStatuses(DEFAULT_STATUSES);
      setCardFields([]);
    }
  }, [nodeType]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateNodeTypeBoardConfig(nodeType.id, {
      preferredView,
      statuses,
      cardFields
    });
    setIsSaving(false);
    onClose();
  };

  const toggleField = (fieldId: string) => {
    setCardFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId) 
        : [...prev, fieldId]
    );
  };

  const addStatus = () => {
    const id = `STATUS_${Date.now()}`;
    setStatuses([...statuses, { id, label: "New Status", color: "#3b82f6" }]);
  };

  const removeStatus = (index: number) => {
    const newStatuses = [...statuses];
    newStatuses.splice(index, 1);
    setStatuses(newStatuses);
  };

  const updateStatus = (index: number, key: string, value: string) => {
    const newStatuses = [...statuses];
    newStatuses[index][key] = value;
    setStatuses(newStatuses);
  };

  const moveStatus = (index: number, direction: 'up' | 'down') => {
    const newStatuses = [...statuses];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStatuses.length) return;
    
    const temp = newStatuses[index];
    newStatuses[index] = newStatuses[targetIndex];
    newStatuses[targetIndex] = temp;
    setStatuses(newStatuses);
  };

  if (!nodeType) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="glass"
            style={{ position: 'relative', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', backgroundColor: 'rgba(20, 20, 25, 0.95)' }}
          >
            <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
              <X size={24} />
            </button>

            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: nodeType.color }} />
                Board Modeling: {nodeType.name}
              </h2>
              <p style={{ color: '#6b7280' }}>Configure visualization, workflow and card layout.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              <div>
                {/* View Selection */}
                <div style={{ marginBottom: '40px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
                    Default Visualization
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <button onClick={() => setPreferredView("KANBAN")} style={{ padding: '20px', borderRadius: '12px', border: '1px solid', borderColor: preferredView === 'KANBAN' ? nodeType.color : 'rgba(255,255,255,0.05)', backgroundColor: preferredView === 'KANBAN' ? `${nodeType.color}10` : 'transparent', color: preferredView === 'KANBAN' ? '#fff' : '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <LayoutGrid size={24} /><span style={{ fontSize: '0.75rem' }}>Kanban</span>
                    </button>
                    <button onClick={() => setPreferredView("SWIMLANE")} style={{ padding: '20px', borderRadius: '12px', border: '1px solid', borderColor: preferredView === 'SWIMLANE' ? nodeType.color : 'rgba(255,255,255,0.05)', backgroundColor: preferredView === 'SWIMLANE' ? `${nodeType.color}10` : 'transparent', color: preferredView === 'SWIMLANE' ? '#fff' : '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <ListTodo size={24} /><span style={{ fontSize: '0.75rem' }}>Swimlane</span>
                    </button>
                    <button onClick={() => setPreferredView("GANTT")} style={{ padding: '20px', borderRadius: '12px', border: '1px solid', borderColor: preferredView === 'GANTT' ? nodeType.color : 'rgba(255,255,255,0.05)', backgroundColor: preferredView === 'GANTT' ? `${nodeType.color}10` : 'transparent', color: preferredView === 'GANTT' ? '#fff' : '#4b5563', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <Calendar size={24} /><span style={{ fontSize: '0.75rem' }}>Gantt</span>
                    </button>
                  </div>
                </div>

                {/* Card Fields Selector */}
                <div style={{ marginBottom: '40px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
                    Card Display Fields (Placeholders)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {nodeType.fields.map((field: any) => (
                      <button
                        key={field.id}
                        onClick={() => toggleField(field.id)}
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '6px 12px', 
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: cardFields.includes(field.id) ? nodeType.color : 'rgba(255,255,255,0.1)',
                          backgroundColor: cardFields.includes(field.id) ? `${nodeType.color}20` : 'rgba(255,255,255,0.05)',
                          color: cardFields.includes(field.id) ? '#fff' : '#9ca3af',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Eye size={12} opacity={cardFields.includes(field.id) ? 1 : 0.3} />
                        {field.name}
                      </button>
                    ))}
                    {nodeType.fields.length === 0 && <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>No custom fields available.</p>}
                  </div>
                </div>
              </div>

              <div>
                {/* Workflow Manager */}
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Workflow Columns
                    </label>
                    <button onClick={addStatus} className="button-premium" style={{ fontSize: '0.65rem', padding: '4px 10px' }}>
                      <Plus size={12} /> Add
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {statuses.map((status, index) => (
                      <div key={status.id} className="glass" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <button onClick={() => moveStatus(index, 'up')} style={{ background: 'none', border: 'none', color: '#4b5563', padding: 0, cursor: 'pointer' }}><ArrowUp size={12} /></button>
                          <button onClick={() => moveStatus(index, 'down')} style={{ background: 'none', border: 'none', color: '#4b5563', padding: 0, cursor: 'pointer' }}><ArrowDown size={12} /></button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                          <input 
                            className="input-premium"
                            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                            value={status.label}
                            onChange={(e) => updateStatus(index, 'label', e.target.value)}
                          />
                          <PremiumColorPicker 
                            currentColor={status.color} 
                            onSelect={(color) => updateStatus(index, 'color', color)} 
                          />
                        </div>


                        <button onClick={() => removeStatus(index)} style={{ background: 'none', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="button-premium"
                style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
              >
                <Save size={18} /> {isSaving ? "Saving..." : "Save Configuration"}
              </button>
              <button 
                onClick={onClose}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#9ca3af', padding: '0 24px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
