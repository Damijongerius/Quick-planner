"use client";

import { useState, useMemo } from 'react';
import { FileJson, Upload, Check, AlertCircle, Info, Copy, X, Plus, ArrowRight, Trash2, Edit3, Calendar, BookOpen, Fingerprint } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { importProjectData } from '@/lib/actions';
import { Button } from '../ui/Button';

export type ImportMode = 'FULL_PROJECT' | 'SUBTREE' | 'NODE_TYPES' | 'SPRINT';

interface AIImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: ImportMode;
  context?: any;
}

export function AIImportModal({ projectId, isOpen, onClose, mode = 'FULL_PROJECT', context }: AIImportModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'review'>('idle');
  const [message, setMessage] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);

  // 1. Generate "Dummy" simplified context + Schema Manifest + Precise IDs
  const sanitizedContext = useMemo(() => {
    if (!context) return null;

    const simplify = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(simplify);
      if (obj !== null && typeof obj === 'object') {
        if (obj.title && (obj.nodeType || obj.type)) {
            return {
                id: obj.id,
                title: obj.title,
                type: obj.nodeType?.name || obj.type?.name || obj.type,
                status: obj.status,
                sprint: obj.sprint?.name || obj.sprint,
                startDate: obj.startDate,
                endDate: obj.endDate,
                children: obj.childLinks?.map((l: any) => l.childNode?.id || l.childNode?.title) || 
                          obj.children?.map((c: any) => typeof c === 'string' ? c : (c.id || c.title)) || [],
                content: obj.content
            };
        }
        if (obj.name && obj.fields) {
            return {
                id: obj.id,
                name: obj.name,
                color: obj.color,
                isSprintEligible: obj.isSprintEligible,
                fields: obj.fields.map((f: any) => ({
                    name: typeof f === 'string' ? f : f.name,
                    type: typeof f === 'string' ? 'TEXT' : f.type
                }))
            };
        }
        if (obj.name && (obj.startDate !== undefined || obj.endDate !== undefined)) {
            return {
                id: obj.id,
                name: obj.name,
                startDate: obj.startDate,
                endDate: obj.endDate,
                status: obj.status
            };
        }
        const newObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (['createdAt', 'updatedAt', 'userId', 'projectId', 'nodeTypeId', 'sprintId', 'nodeId'].includes(key)) continue;
          if (key === 'childLinks' || key === 'parentLinks') continue;
          newObj[key] = simplify(value);
        }
        return newObj;
      }
      return obj;
    };

    return simplify(context);
  }, [context]);

  const getFullContextText = () => {
    if (!context) return "No context available.";

    let text = "# PROMPT INSTRUCTIONS\n";
    text += "Use existing 'id' fields to reference or update items. Do NOT generate new IDs for new items.\n";
    text += "When creating new items, simply omit the 'id' field.\n";
    text += "You can link nodes by their existing ID or their Title.\n\n";

    text += "## 🏗️ AVAILABLE NODE TYPES\n";
    if (context.allNodeTypes) {
        context.allNodeTypes.forEach((t: any) => {
            text += `- ${t.name}: [Fields: ${t.fields.map((f: any) => `${f.name} (${f.type})`).join(", ")}]\n`;
        });
    } else {
        text += "No node types defined.\n";
    }
    text += "\n";

    text += "## 🔄 VALID RELATIONS\n";
    if (context.allRelations) {
        context.allRelations.forEach((r: any) => {
            text += `- ${r.parent} -> ${r.child}\n`;
        });
    } else {
        text += "No relations defined.\n";
    }
    text += "\n";

    text += "## 📂 JSON STRUCTURE EXAMPLES\n";
    text += "### New Nodes Example:\n";
    text += "{\n  \"nodes\": [\n    { \"title\": \"Task A\", \"type\": \"Task\", \"children\": [\"Child Task\"] },\n    { \"title\": \"Child Task\", \"type\": \"Subtask\" }\n  ]\n}\n\n";
    text += "### Update Existing Node Example:\n";
    text += "{\n  \"nodes\": [\n    { \"id\": \"existing-id\", \"status\": \"DONE\" }\n  ]\n}\n\n";
    text += "### New Sprint Example:\n";
    text += "{\n  \"sprints\": [\n    { \"name\": \"Phase 2\", \"startDate\": \"2024-02-01\", \"endDate\": \"2024-02-14\" }\n  ]\n}\n\n";

    text += "## 📊 CURRENT PROJECT DATA\n";
    text += JSON.stringify(sanitizedContext, null, 2);

    return text;
  };

  const copyContext = () => {
    navigator.clipboard.writeText(getFullContextText());
  };

  const handleReview = () => {
    try {
      const data = JSON.parse(jsonInput);
      setParsedData(data);
      setStatus('review');
    } catch (error: any) {
      setStatus('error');
      setMessage('Invalid JSON: ' + error.message);
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setStatus('loading');
    try {
      let dataToImport = { ...parsedData };
      if (mode === 'SUBTREE' && context?.nodeId) {
          dataToImport.nodes = dataToImport.nodes.map((n: any) => {
              if (!n.parentId && !dataToImport.nodes.some((other: any) => other.children?.includes(n.id) || other.children?.includes(n.title))) {
                  return { ...n, parentId: context.nodeId };
              }
              return n;
          });
      }
      const result = await importProjectData(projectId, dataToImport);
      if (result.success) {
        setStatus('success');
        setMessage(`Successfully implemented ${result.count} items.`);
        setJsonInput('');
        setTimeout(() => {
          onClose();
          setStatus('idle');
          setMessage('');
          setParsedData(null);
        }, 2000);
      }
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setMessage(error.message || 'Import failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: status === 'review' ? '1000px' : '1000px',
          padding: '32px',
          borderRadius: '32px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--outline-variant)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-container-premium" style={{ width: '48px', height: '48px' }}>
              <FileJson size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900 }}>
                {status === 'review' ? 'Implementation Review' : 'AI Architect Bridge'}
              </h2>
              <p className="text-meta" style={{ fontSize: '12px' }}>
                {status === 'review' ? 'Verify your generated structure' : 'Full project context & architectural specifications'}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} style={{ padding: '8px' }}>
            <X size={20} />
          </Button>
        </div>

        {status !== 'review' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '14px', fontWeight: 700 }}>AI Context & Specification</label>
                        </div>
                        <Button 
                            variant="secondary"
                            size="sm"
                            onClick={copyContext}
                            icon={<Copy size={12} />}
                        >
                            Copy Full Prompt
                        </Button>
                    </div>
                    <div style={{ 
                        flex: 1,
                        backgroundColor: 'var(--surface-container-low)', 
                        padding: '16px', 
                        borderRadius: '24px', 
                        fontSize: '11px', 
                        fontFamily: 'monospace',
                        overflow: 'auto',
                        border: '1px solid var(--outline-variant)',
                        minHeight: '400px',
                        maxHeight: '500px',
                        whiteSpace: 'pre-wrap',
                        color: 'var(--on-surface-variant)',
                    }}>
                        {getFullContextText()}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700 }}>Paste Implementation JSON</label>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='{ "nodes": [ { "title": "...", "type": "...", "children": ["Name of Child"] } ] }'
                        className="input-premium"
                        style={{
                            flex: 1,
                            width: '100%',
                            minHeight: '400px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            padding: '16px',
                            resize: 'none',
                            backgroundColor: 'var(--surface-container-low)',
                            borderRadius: '24px',
                            border: '1px solid var(--outline-variant)'
                        }}
                    />
                </div>
            </div>
        ) : (
            <div style={{ marginBottom: '32px' }}>
                {/* Review section stays the same */}
                <div className="card-sanctuary" style={{ padding: '24px', backgroundColor: 'var(--surface-container-lowest)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowRight size={20} color="var(--primary)" />
                        Ready to Implement
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {parsedData.sprints?.length > 0 && (
                            <div>
                                <h4 className="text-meta" style={{ marginBottom: '8px' }}>Sprints To Initialize</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {parsedData.sprints.map((s: any, i: number) => (
                                        <div key={i} style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: 'var(--tertiary-container)', border: '1px solid var(--tertiary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} color="var(--tertiary)" />
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--tertiary)' }}>{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {parsedData.nodeTypes?.length > 0 && (
                            <div>
                                <h4 className="text-meta" style={{ marginBottom: '8px' }}>New Definitions</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {parsedData.nodeTypes.map((t: any, i: number) => (
                                        <div key={i} style={{ padding: '8px 12px', borderRadius: '12px', backgroundColor: `${t.color || '#3b82f6'}15`, border: `1px solid ${t.color || '#3b82f6'}30`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Plus size={14} color={t.color || '#3b82f6'} />
                                            <span style={{ fontWeight: 700, fontSize: '13px', color: t.color || '#3b82f6' }}>{t.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {parsedData.nodes?.length > 0 && (
                            <div>
                                <h4 className="text-meta" style={{ marginBottom: '8px' }}>New Items ({parsedData.nodes.length})</h4>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--outline-variant)', borderRadius: '16px' }}>
                                    {parsedData.nodes.map((n: any, i: number) => (
                                        <div key={i} style={{ padding: '12px 16px', borderBottom: i === parsedData.nodes.length - 1 ? 'none' : '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{n.title}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.6 }}>{n.type} {n.children?.length > 0 ? `• ${n.children.length} Children` : ''}</div>
                                                </div>
                                            </div>
                                            <Plus size={16} style={{ opacity: 0.3 }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button 
            variant="secondary"
            onClick={() => status === 'review' ? setStatus('idle') : onClose()}
          >
            {status === 'review' ? 'Edit JSON' : 'Cancel'}
          </Button>
          <Button 
            variant="primary"
            onClick={status === 'review' ? handleImport : handleReview} 
            disabled={!jsonInput.trim()}
            loading={status === 'loading'}
            style={{ minWidth: '180px' }}
            icon={status === 'success' ? <Check size={18} /> : (status === 'review' ? <Check size={18} /> : <ArrowRight size={18} />)}
          >
            {status === 'success' ? 'Done!' : (status === 'review' ? 'Implement Plan' : 'Review Changes')}
          </Button>
        </div>

        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                        marginTop: '24px',
                        padding: '16px',
                        borderRadius: '16px',
                        backgroundColor: status === 'success' ? 'rgba(0, 107, 96, 0.1)' : 'rgba(168, 54, 75, 0.1)',
                        color: status === 'success' ? 'var(--tertiary)' : 'var(--error)',
                        fontSize: '14px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}
                >
                    {status === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {message}
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
