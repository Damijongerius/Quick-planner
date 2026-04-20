"use client";

import { useState } from "react";
import { Plus, Braces, Trash2, LayoutGrid } from "lucide-react";
import { createNodeType, deleteNodeType } from "@/lib/actions";
import { IconPicker, IconRenderer } from "./IconPicker";
import { PremiumColorPicker } from "./PremiumColorPicker";
import { FieldEditor } from "./FieldEditor";
import { BoardConfigEditor } from "./BoardConfigEditor";

interface NodeTypeSettingsProps {
  projectId: string;
  initialNodeTypes: any[];
}

export function NodeTypeSettings({ projectId, initialNodeTypes }: NodeTypeSettingsProps) {
  const [activeNodeType, setActiveNodeType] = useState<any>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create New Type state
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newIcon, setNewIcon] = useState("Target");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("color", newColor);
    formData.append("icon", newIcon);
    await createNodeType(projectId, formData);
    setNewName("");
    setIsCreating(false);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {initialNodeTypes.map((type) => (
          <div key={type.id} className="card-sanctuary" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: type.color }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: `${type.color}15`, border: `1px solid ${type.color}30` }}>
                  <IconRenderer name={type.icon} color={type.color} size={24} />
                </div>
                <div>
                  <h3 className="text-editorial" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{type.name}</h3>
                  <p className="text-meta" style={{ fontSize: '0.75rem' }}>ID: {type.id.slice(-6)}</p>
                </div>
              </div>
              <button 
                onClick={() => deleteNodeType(projectId, type.id)}
                style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer', opacity: 0.5 }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Fields</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {type.fields.map((field: any) => (
                  <span key={field.id} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'var(--surface-container)', color: 'var(--on-surface-variant)' }}>
                    {field.name}
                  </span>
                ))}
                {type.fields.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>No fields defined</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  setActiveNodeType(type);
                  setIsBoardEditorOpen(true);
                }}
                className="button-premium" 
                style={{ flex: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--surface-container)', color: 'var(--primary)', boxShadow: 'none' }}
              >
                <LayoutGrid size={16} /> Board Config
              </button>
              <button 
                onClick={() => {
                  setActiveNodeType(type);
                  setIsFieldEditorOpen(true);
                }}
                className="button-premium" 
                style={{ flex: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--surface-container)', color: 'var(--on-surface)', boxShadow: 'none' }}
              >
                <Braces size={16} /> Edit Fields
              </button>
            </div>
          </div>
        ))}

        {!isCreating ? (
          <div 
            onClick={() => setIsCreating(true)}
            className="card-sanctuary" 
            style={{ 
              padding: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px', 
              border: '2px dashed var(--outline-variant)',
              background: 'transparent',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.boxShadow = 'var(--ambient-shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'var(--surface-container)' }}>
              <Plus size={32} color="var(--on-surface-variant)" />
            </div>
            <p className="text-editorial" style={{ fontWeight: 500, color: 'var(--on-surface-variant)' }}>Create New Node Type</p>
          </div>
        ) : (
          <div className="card-sanctuary" style={{ padding: '32px' }}>
            <h3 className="text-editorial" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>New Node Type</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label className="text-meta" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px' }}>Name</label>
                <input 
                  autoFocus
                  className="input-premium" 
                  placeholder="e.g. Legendary, Research..." 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required 
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="text-meta" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px' }}>Icon</label>
                <IconPicker 
                  currentIcon={newIcon} 
                  onSelect={setNewIcon} 
                  color={newColor} 
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label className="text-meta" style={{ display: 'block', fontSize: '0.875rem', marginBottom: '12px' }}>Color Palette</label>
                <PremiumColorPicker 
                  currentColor={newColor} 
                  onSelect={setNewColor} 
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="button-premium" style={{ flex: 1 }}>Create Type</button>
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', padding: '0 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <FieldEditor 
        projectId={projectId}
        nodeType={activeNodeType} 
        isOpen={isFieldEditorOpen} 
        onClose={() => {
          setIsFieldEditorOpen(false);
          setActiveNodeType(null);
        }} 
      />

      <BoardConfigEditor 
        projectId={projectId}
        nodeType={activeNodeType}
        isOpen={isBoardEditorOpen}
        onClose={() => {
          setIsBoardEditorOpen(false);
          setActiveNodeType(null);
        }}
      />
    </div>
  );
}
