"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2, Calendar, Hash, Type, CheckCircle2, Info, Clock, Check, Layers, Zap, Link, Trash, MoreHorizontal, ArrowRight, User, FileText, Archive, Plus, Edit2, ArchiveRestore } from "lucide-react";
import { updateNode, deleteNode, assignNodeToSprint, updateNodeStatus, addDependency, removeDependency, getHistoryForNode, archiveNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";

interface NodeSidePanelProps {
  projectId: string;
  node: any;
  isOpen: boolean;
  onClose: () => void;
  sprints: any[];
  allNodes: any[];
}

export function NodeSidePanel({ projectId, node, isOpen, onClose, sprints, allNodes }: NodeSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [content, setContent] = useState<any>({});
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [status, setStatus] = useState("TODO");
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  
  const AutoGrowingTextarea = ({ value, onChange, placeholder, style }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '0px';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = scrollHeight + 'px';
      }
    }, [value]);

    return (
      <textarea
        ref={textareaRef}
        className="input-premium"
        style={{ 
          ...style, 
          padding: '12px 20px', 
          borderRadius: '16px', 
          minHeight: '44px',
          resize: 'none',
          overflow: 'hidden',
          lineHeight: '1.5'
        }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };
  
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with node prop
  useEffect(() => {
    if (node) {
      setTitle(node.title || "");
      setDescription(node.description || "");
      setStartDate(node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : "");
      setEndDate(node.endDate ? new Date(node.endDate).toISOString().split('T')[0] : "");
      setContent(node.content || {});
      setSprintId(node.sprintId || null);
      setStatus(node.status || "TODO");
      setSavingStatus('idle');
      isInitialMount.current = true;
      setActiveTab('details');
      
      if (activeTab === 'history') {
          loadHistory();
      }
    }
  }, [node?.id, node?.updatedAt]);

  useEffect(() => {
      if (activeTab === 'history' && node?.id) {
          loadHistory();
      }
  }, [activeTab]);

  const loadHistory = async () => {
      const data = await getHistoryForNode(projectId, node.id);
      setHistory(data);
  };

  // Auto-save logic
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSavingStatus('saving');
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNode(projectId, node.id, { 
            title, 
            description, 
            content,
            startDate: startDate || null,
            endDate: endDate || null
        });
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (error) {
        console.error("Auto-save failed", error);
        setSavingStatus('idle');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, description, content, startDate, endDate, projectId, node?.id]);

  if (!node) return null;

  const handleFieldChange = (fieldName: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [fieldName]: value }));
  };

  const handleSprintChange = async (newSprintId: string | null) => {
    setSprintId(newSprintId);
    await assignNodeToSprint(projectId, node.id, newSprintId || null);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await updateNodeStatus(projectId, node.id, newStatus);
  };

  const handleAddDependency = async (blockingId: string) => {
     if (blockingId && blockingId !== 'none') {
        await addDependency(projectId, node.id, blockingId);
     }
  };

  const handleRemoveDependency = async (depId: string) => {
      await removeDependency(projectId, depId);
  };

  const handleArchive = async () => {
      await archiveNode(projectId, node.id, !node.isArchived);
      onClose();
  };

  const isGanttEnabled = node.type?.boardConfig?.preferredView !== 'KANBAN';
  const isSprintEligible = node.type?.isSprintEligible !== false;

  return (
    <div className="card-sanctuary" style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRadius: '32px 0 0 32px',
      padding: 0,
      backgroundColor: 'var(--surface-container-lowest)',
      boxShadow: '-20px 0 40px rgba(44, 52, 55, 0.06)',
      overflow: 'hidden',
      border: 'none'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '32px 40px 16px 40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              backgroundColor: `${node.type?.color}15`, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: node.type?.color 
          }}>
            <IconRenderer name={node.type?.icon} size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-meta">{node.type?.name}</span>
                {node.isArchived && (
                    <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 900, 
                        color: 'var(--primary)', 
                        backgroundColor: 'rgba(70, 86, 184, 0.1)', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                    }}>ARCHIVED</span>
                )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {savingStatus === 'saving' && <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 700 }}>AUTOSAVING...</span>}
                {savingStatus === 'saved' && <span style={{ fontSize: '10px', color: 'var(--tertiary)', fontWeight: 700 }}>CHANGES SAVED</span>}
                {savingStatus === 'idle' && <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)', fontWeight: 700 }}>SYNCHRONIZED</span>}
            </div>
          </div>
        </div>
        <button 
            onClick={onClose}
            className="button-secondary"
            style={{ padding: '8px', border: 'none' }}
        >
            <X size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '24px', padding: '0 40px', borderBottom: '1px solid var(--outline-variant)' }}>
          <button 
            onClick={() => setActiveTab('details')}
            style={{ 
                padding: '12px 0', 
                background: 'none', 
                border: 'none', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: activeTab === 'details' ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer'
            }}
          >
              DETAILS
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
                padding: '12px 0', 
                background: 'none', 
                border: 'none', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: activeTab === 'history' ? 'var(--primary)' : 'var(--on-surface-variant)',
                borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
            }}
          >
              HISTORY <Clock size={14} />
          </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
        {activeTab === 'details' ? (
          <>
            <div style={{ marginBottom: '40px' }}>
                <input 
                  className="input-seamless"
                  style={{ 
                    fontSize: '32px', 
                    fontWeight: 800, 
                    width: '100%',
                    marginBottom: '8px',
                    color: 'var(--on-surface)'
                  }}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title..."
                />
                
                <div style={{ display: 'flex', gap: '16px', color: 'var(--on-surface-variant)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Plus size={12} /> 
                        <span>Created {new Date(node.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Edit2 size={12} /> 
                        <span>Updated {new Date(node.updatedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isSprintEligible ? '1fr 1fr' : '1fr', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="text-meta" style={{ opacity: 0.5 }}>Current Status</label>
                  <select 
                    className="button-secondary" 
                    value={status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{ width: '100%', justifyContent: 'space-between', padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>
                {isSprintEligible && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label className="text-meta" style={{ opacity: 0.5 }}>Strategic Sprint</label>
                      <select 
                        className="button-secondary" 
                        value={sprintId || "none"}
                        onChange={(e) => handleSprintChange(e.target.value === 'none' ? null : e.target.value)}
                        style={{ width: '100%', justifyContent: 'space-between', padding: '12px 20px', fontSize: '14px', fontWeight: 600 }}
                      >
                        <option value="none">Backlog</option>
                        {sprints.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                )}
              </div>

              {/* Dynamic Timeline Fields */}
              {isGanttEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'rgba(70, 86, 184, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(70, 86, 184, 0.1)' }}>
                    <div style={{ gridColumn: 'span 2', marginBottom: '-8px' }}>
                        <label className="text-meta" style={{ color: 'var(--primary)' }}>Strategic Timeline</label>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>START DATE</label>
                        <input 
                            type="date" 
                            className="input-premium" 
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>END DATE</label>
                        <input 
                            type="date" 
                            className="input-premium" 
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
              )}

              <div>
                <label className="text-meta" style={{ display: 'block', marginBottom: '12px' }}>Description</label>
                <textarea 
                    className="card-sanctuary"
                    placeholder="Provide strategic context or mission details..."
                    style={{ 
                        width: '100%', 
                        minHeight: '120px', 
                        fontSize: '14px', 
                        lineHeight: 1.6, 
                        border: '1px solid var(--outline-variant)',
                        backgroundColor: 'var(--surface-container-low)',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                    }}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '24px', borderRadius: '24px' }}>
                <label className="text-meta" style={{ display: 'block', marginBottom: '16px' }}>Dependencies</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  {node.blockedBy?.map((dep: any) => (
                    <div key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--surface-container-lowest)', borderRadius: '12px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)' }}>{dep.blockingNode?.title}</span>
                      <button 
                        onClick={() => handleRemoveDependency(dep.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  ))}
                  {(!node.blockedBy || node.blockedBy.length === 0) && (
                    <p style={{ fontSize: '13px', color: 'var(--on-surface-variant)', fontStyle: 'italic', padding: '0 8px' }}>No active dependencies.</p>
                  )}
                </div>

                <select 
                  className="button-secondary"
                  value="none"
                  onChange={(e) => handleAddDependency(e.target.value)}
                  style={{ width: '100%', fontSize: '12px', fontWeight: 700, backgroundColor: 'var(--surface-container-lowest)', border: 'none' }}
                >
                  <option value="none">+ ADD BLOCKING NODE</option>
                  {allNodes
                    .filter(n => n.id !== node.id && !node.blockedBy?.some((d: any) => d.blockingNodeId === n.id))
                    .map(n => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="text-meta" style={{ display: 'block', marginBottom: '24px' }}>Custom Attributes</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {node.type?.fields?.map((field: any) => (
                    <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {field.type === 'TEXT' && <Type size={14} />}
                        {field.type === 'NUMBER' && <Hash size={14} />}
                        {field.type === 'DATE' && <Calendar size={14} />}
                        {field.type === 'CHECKBOX' && <CheckCircle2 size={14} />}
                        {field.name.toUpperCase()}
                      </label>
                      
                      {field.type === 'TEXT' && (
                        <AutoGrowingTextarea 
                          value={content[field.name] || ""}
                          onChange={(e: any) => handleFieldChange(field.name, e.target.value)}
                          placeholder={`Enter ${field.name.toLowerCase()}...`}
                        />
                      )}
                      
                      {field.type === 'NUMBER' && (
                        <input 
                          type="number"
                          className="input-premium"
                          style={{ paddingLeft: '20px' }}
                          value={content[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        />
                      )}
                      
                      {field.type === 'DATE' && (
                        <input 
                          type="date"
                          className="input-premium"
                          style={{ paddingLeft: '20px' }}
                          value={content[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        />
                      )}
                      
                      {field.type === 'CHECKBOX' && (
                        <div 
                          onClick={() => handleFieldChange(field.name, !content[field.name])}
                          style={{ 
                            width: '40px', 
                            height: '20px', 
                            borderRadius: '10px', 
                            backgroundColor: content[field.name] ? 'var(--tertiary)' : 'var(--surface-container-high)',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <motion.div 
                            animate={{ x: content[field.name] ? 20 : 0 }}
                            style={{ 
                              width: '16px', 
                              height: '16px', 
                              borderRadius: '50%', 
                              backgroundColor: 'white', 
                              position: 'absolute', 
                              top: '2px', 
                              left: '2px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Audit Trail</h3>
              {history.map((event) => (
                  <div key={event.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                      <div style={{ 
                          width: '12px', 
                          height: '12px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--outline-variant)', 
                          marginTop: '4px',
                          zIndex: 1
                      }} />
                      <div style={{ flex: 1, paddingBottom: '24px', borderLeft: '1px solid var(--outline-variant)', marginLeft: '-22.5px', paddingLeft: '32px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>{event.action}</span>
                              <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{new Date(event.createdAt).toLocaleString()}</span>
                          </div>
                          <p style={{ fontSize: '13px', fontWeight: 600 }}>{event.action === 'UPDATE' ? 'Title/Desc/Timeline updated' : (event.action === 'MOVE' ? 'Sprint changed' : event.action)}</p>
                          {event.oldValue && event.newValue && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                                  <span style={{ opacity: 0.6 }}>{event.oldValue}</span>
                                  <ArrowRight size={10} />
                                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{event.newValue}</span>
                              </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--surface-container-high)' }}>
                                  <User size={12} style={{ margin: '2px' }} />
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700 }}>{event.user.name}</span>
                          </div>
                      </div>
                  </div>
              ))}
              {history.length === 0 && (
                  <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '40px' }}>No events recorded.</p>
              )}
          </div>
        )}
      </div>

      <footer style={{ padding: '40px', borderTop: '1px solid var(--outline-variant)' }}>
        <button 
          type="button"
          onClick={handleArchive}
          style={{ 
            background: 'none', 
            color: 'var(--on-surface-variant)', 
            width: '100%',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: '1px solid var(--outline-variant)',
            borderRadius: '9999px'
          }}
        >
          {node.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {node.isArchived ? "Restore Node" : "Archive Node"}
        </button>
      </footer>
    </div>
  );
}
