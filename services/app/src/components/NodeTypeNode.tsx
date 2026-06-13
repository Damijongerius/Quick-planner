"use client";

import React, { CSSProperties } from 'react';
import { Settings, Braces } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { IconRenderer } from './IconPicker';
import { PropertyPill } from './ui/PropertyPill';

import { FieldDefinition } from '@/lib/types';
import { Button } from './ui/Button';

interface NodeTypeNodeProps {
  data: {
    label: string;
    color: string;
    icon: string;
    fields: FieldDefinition[];
    onClick: () => void;
    isSelected?: boolean;
  };
}

export const NodeTypeNode = ({ data }: Readonly<NodeTypeNodeProps>) => {

  return (
    <div 
      className={`blueprint-flow-node ${data.isSelected ? 'selected' : ''}`} 
      style={{ '--node-color': data.color || 'var(--primary)' } as CSSProperties}
    >
      <button 
        className="blueprint-node-main-action"
        onClick={data.onClick}
        aria-label={`Blueprint: ${data.label}`}
      />
      
      <Handle type="target" position={Position.Top} className="flow-handle-target z-10" />
      
      <div className="blueprint-node-header relative z-[2] pointer-events-none">
        <div className="blueprint-node-icon" style={{ backgroundColor: `color-mix(in srgb, ${data.color}, transparent 80%)`, color: data.color }}>
          <IconRenderer name={data.icon} size={20} />
        </div>
        <div className="flex-1">
          <div className="text-10px font-bold opacity-40 uppercase tracking-widest">Blueprint</div>
          <div className="text-editorial text-sm font-black leading-tight">{data.label}</div>
        </div>
        <Button 
          variant="ghost"
          className="blueprint-node-settings hover:bg-white/10 pointer-events-auto" 
          onClick={(e) => { e.stopPropagation(); data.onClick(); }}
          aria-label="Open Settings"
        >
          <Settings size={14} className="opacity-40" />
        </Button>
      </div>

      {data.fields && data.fields.length > 0 && (
        <div className="blueprint-node-fields p-lg border-t border-outline-variant/20">
          <div className="flex items-center gap-xs opacity-40 mb-md">
            <Braces size={12} />
            <span className="text-10px font-bold uppercase tracking-widest">Properties</span>
          </div>
          <div className="flex flex-wrap gap-xs mt-sm">
            {data.fields.map((f) => (
              <PropertyPill key={f.id} label={f.name} />
            ))}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="flow-handle-source z-10" />
    </div>
  );
};
