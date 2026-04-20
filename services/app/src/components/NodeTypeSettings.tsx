"use client";

import { useState } from "react";
import { Plus, Braces, Trash2, LayoutGrid } from "lucide-react";
import { createNodeType, deleteNodeType } from "@/lib/actions";
import { IconPicker, IconRenderer } from "./IconPicker";
import { PremiumColorPicker } from "./PremiumColorPicker";
import { FieldEditor } from "./FieldEditor";
import { BoardConfigEditor } from "./BoardConfigEditor";

interface NodeTypeSettingsProps {
  initialNodeTypes: any[];
}

export function NodeTypeSettings({ initialNodeTypes }: NodeTypeSettingsProps) {
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
    await createNodeType(formData);
    setNewName("");
    setIsCreating(false);
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {initialNodeTypes.map((type) => (
          <div key={type.id} className="glass" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: type.color }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: `${type.color}15`, border: `1px solid ${type.color}30` }}>
                  <IconRenderer name={type.icon} color={type.color} size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{type.name}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>ID: {type.id.slice(-6)}</p>
                </div>
              </div>
              <button 
                onClick={() => deleteNodeType(type.id)}
                style={{ background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', opacity: 0.5 }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Fields</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {type.fields.map((field: any) => (
                  <span key={field.id} style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: '#9ca3af' }}>
                    {field.name}
                  </span>
                ))}
                {type.fields.length === 0 && <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>No fields defined</span>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => {
                  setActiveNodeType(type);
                  setIsBoardEditorOpen(true);
                }}
                className="button-premium" 
                style={{ flex: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
              >
                <LayoutGrid size={16} /> Board Config
              </button>
              <button 
                onClick={() => {
                  setActiveNodeType(type);
                  setIsFieldEditorOpen(true);
                }}
                className="button-premium" 
                style={{ flex: 1, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Braces size={16} /> Edit Fields
              </button>
            </div>
          </div>
        ))}

        {!isCreating ? (
          <div 
            onClick={() => setIsCreating(true)}
            className="glass" 
            style={{ 
              padding: '40px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '16px', 
              borderStyle: 'dashed',
              borderColor: 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              opacity: 0.7,
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.7';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <div style={{ padding: '12px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <Plus size={32} color="#9ca3af" />
            </div>
            <p style={{ fontWeight: 500, color: '#9ca3af' }}>Create New Node Type</p>
          </div>
        ) : (
          <div className="glass" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px' }}>New Node Type</h3>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: '#9ca3af' }}>Name</label>
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
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: '#9ca3af' }}>Icon</label>
                <IconPicker 
                  currentIcon={newIcon} 
                  onSelect={setNewIcon} 
                  color={newColor} 
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '12px', color: '#9ca3af' }}>Color Palette</label>
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
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#9ca3af', padding: '0 16px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <FieldEditor 
        nodeType={activeNodeType} 
        isOpen={isFieldEditorOpen} 
        onClose={() => {
          setIsFieldEditorOpen(false);
          setActiveNodeType(null);
        }} 
      />

      <BoardConfigEditor 
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
