"use client";

import React from 'react';
import { Handle, Position } from 'reactflow';
import { IconRenderer } from './IconPicker';

export const NodeTypeNode = ({ data }: any) => {
  return (
    <div 
      className={`flow-node-card ${data.isSelected ? 'selected' : ''}`} 
      style={{ '--node-color': data.color || 'var(--primary)' } as any}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="flow-handle-target" />
      <div className="flow-node-icon text-node-color">
        <IconRenderer name={data.icon} size={24} />
      </div>
      <div className="text-editorial text-sm font-bold mt-sm">{data.label}</div>
      <Handle type="source" position={Position.Bottom} className="flow-handle-source" />
    </div>
  );
};
