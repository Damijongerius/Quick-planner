"use client";

import React, { CSSProperties } from 'react';
import { Handle, Position } from 'reactflow';
import { IconRenderer } from './IconPicker';
import { FieldDefinition } from '@/lib/types';

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
  const color = data.color || 'var(--accent)';
  const shown = data.fields.slice(0, 3);
  const extra = data.fields.length - shown.length;

  return (
    <div className="blueprint-flow-node" style={{ '--node-color': color } as CSSProperties}>
      <Handle type="target" position={Position.Top} className="flow-handle flow-handle-target" />

      <button className="flex w-full items-center gap-3 text-left" onClick={data.onClick} aria-label={`Edit ${data.label}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
          <IconRenderer name={data.icon} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-fg">{data.label}</span>
          <span className="block text-xs text-muted">{data.fields.length === 0 ? 'No fields' : `${data.fields.length} ${data.fields.length === 1 ? 'field' : 'fields'}`}</span>
        </span>
      </button>

      {shown.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {shown.map((f) => (
            <span key={f.id} className="rounded bg-hover px-1.5 py-0.5 text-xs text-muted">{f.name}</span>
          ))}
          {extra > 0 && <span className="rounded px-1.5 py-0.5 text-xs text-faint">+{extra}</span>}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="flow-handle flow-handle-source" />
    </div>
  );
};
