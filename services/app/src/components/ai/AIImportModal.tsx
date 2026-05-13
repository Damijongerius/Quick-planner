"use client";

import { useState, useMemo } from 'react';
import { FileJson, Check, AlertCircle, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { importProjectData } from '@/lib/actions';
import { Button } from '../ui/Button';
import { sanitizeAIContext, generatePromptText } from './aiUtils';
import { AIImportReview } from './AIImportReview';

interface AIImportModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'FULL_PROJECT' | 'NODE_TYPES' | 'SUBTREE' | 'SPRINT';
  context?: any;
}

export function AIImportModal({ projectId, isOpen, onClose, mode = 'FULL_PROJECT', context }: AIImportModalProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'review'>('idle');
  const [message, setMessage] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);

  const sanitizedContext = useMemo(() => sanitizeAIContext(context), [context]);
  const promptText = useMemo(() => generatePromptText(context, sanitizedContext), [context, sanitizedContext]);

  const handleReview = () => {
    try { setParsedData(JSON.parse(jsonInput)); setStatus('review'); }
    catch (e: any) { setStatus('error'); setMessage('Invalid JSON: ' + e.message); }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setStatus('loading');
    try {
      const data = { ...parsedData };
      if (mode === 'SUBTREE' && context?.nodeId) {
          data.nodes = data.nodes.map((n: any) => (!n.parentId && !data.nodes.some((o: any) => o.children?.includes(n.id) || o.children?.includes(n.title))) ? { ...n, parentId: context.nodeId } : n);
      }
      const res = await importProjectData(projectId, data);
      if (res.success) {
        setStatus('success'); setMessage(`Implemented ${res.count} items.`);
        setTimeout(() => { onClose(); setStatus('idle'); setParsedData(null); }, 2000);
      }
    } catch (e: any) { setStatus('error'); setMessage(e.message || 'Import failed.'); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="glass-planner p-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-surface/95 border border-outline-variant shadow-planner">
        <div className="flex justify-between items-center mb-xl">
          <div className="flex items-center gap-md">
            <div className="icon-container-premium w-12 h-12"><FileJson size={24} /></div>
            <div><h2 className="text-editorial text-2xl font-black">{status === 'review' ? 'Implementation Review' : 'AI Architect Bridge'}</h2><p className="text-meta text-10px">{status === 'review' ? 'Verify your generated structure' : 'Full project context & architectural specifications'}</p></div>
          </div>
          <Button variant="ghost" onClick={onClose}><X size={20} /></Button>
        </div>

        {status !== 'review' ? (
            <div className="grid grid-cols-2 gap-xl mb-xl">
                <div className="flex flex-col gap-md">
                    <div className="flex justify-between items-center"><label className="text-xs font-bold">AI Context & Specification</label><Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(promptText)} icon={<Copy size={12} />}>Copy Prompt</Button></div>
                    <div className="flex-1 bg-surface-container-low p-md rounded-3xl text-[11px] font-mono overflow-auto border border-outline-variant min-h-[400px] max-h-[500px] whitespace-pre-wrap">{promptText}</div>
                </div>
                <div className="flex flex-col gap-md">
                    <label className="text-xs font-bold">Paste Implementation JSON</label>
                    <textarea value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} placeholder='{ "nodes": [ { "title": "...", "type": "..." } ] }' className="input-planner flex-1 w-full min-h-[400px] font-mono text-xs p-md resize-none rounded-3xl" />
                </div>
            </div>
        ) : (
            <div className="mb-xl"><AIImportReview parsedData={parsedData} /></div>
        )}

        <div className="flex gap-md justify-end">
          <Button variant="secondary" onClick={() => status === 'review' ? setStatus('idle') : onClose()}>{status === 'review' ? 'Edit JSON' : 'Cancel'}</Button>
          <Button variant="primary" onClick={status === 'review' ? handleImport : handleReview} disabled={!jsonInput.trim()} loading={status === 'loading'} className="min-w-[180px]" icon={<Check size={18} />}>{status === 'success' ? 'Done!' : (status === 'review' ? 'Implement Plan' : 'Review Changes')}</Button>
        </div>

        <AnimatePresence>{message && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-xl p-md rounded-2xl flex items-center gap-md text-sm font-bold ${status === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}><AlertCircle size={20} />{message}</motion.div>}</AnimatePresence>
      </motion.div>
    </div>
  );
}
