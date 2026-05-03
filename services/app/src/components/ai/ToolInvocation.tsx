"use client";

import { Loader2, ChevronRight, Search, PlusCircle, Layout, ShieldCheck, Share2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ToolInvocationProps {
  toolInvocation: {
    toolName: string;
    state: 'call' | 'result';
    result?: any;
    args: any;
  };
}

export function ToolInvocation({ toolInvocation }: ToolInvocationProps) {
  const { toolName, state, result } = toolInvocation;
  const { projectId } = useParams();

  const getToolInfo = () => {
    switch (toolName) {
      case 'searchWeb':
        return { icon: <Search size={10} />, label: 'SEARCHING WEB...' };
      case 'getProjectData':
        return { icon: <Layout size={10} />, label: 'READING BACKLOG...' };
      case 'getProjectMetadata':
        return { icon: <ShieldCheck size={10} />, label: 'READING GOVERNANCE...' };
      case 'createNode':
        return { icon: <PlusCircle size={10} />, label: 'CREATING NODE...' };
      case 'updateNode':
        return { icon: <Layout size={10} />, label: 'UPDATING NODE...' };
      case 'manageRelations':
        return { icon: <Share2 size={10} />, label: 'MANAGING RELATIONS...' };
      default:
        return { icon: <ChevronRight size={10} />, label: `${toolName.toUpperCase()}...` };
    }
  };

  const { icon, label } = getToolInfo();
  const nodeId = result?.nodeId;

  return (
    <div style={{ 
      marginTop: '12px', 
      padding: '10px 14px', 
      backgroundColor: 'var(--surface-container-low)', 
      borderRadius: '12px',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      border: '1px solid var(--outline-variant)',
      color: 'var(--on-surface-variant)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {state === 'call' ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={12} />}
        <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
          {icon}
          {label}
          {state === 'result' && <span style={{ color: 'var(--primary)', opacity: 0.8 }}>COMPLETED</span>}
        </span>
      </div>

      {state === 'result' && nodeId && (
        <Link 
            href={`/project/${projectId}/backlog?nodeId=${nodeId}`}
            style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '4px 8px', 
                backgroundColor: 'var(--surface-container-high)',
                borderRadius: '6px',
                color: 'var(--primary)',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid var(--primary-container)'
            }}
        >
            VIEW <ExternalLink size={10} />
        </Link>
      )}
    </div>
  );
}
