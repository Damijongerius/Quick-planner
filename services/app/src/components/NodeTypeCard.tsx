"use client";

import React from 'react';
import { Trash2, LayoutGrid, Braces } from 'lucide-react';
import { Button } from './ui/Button';
import { IconRenderer } from './IconPicker';
import { deleteNodeType } from '@/lib/actions';

import { NodeType, FieldDefinition } from '@/lib/types';

interface NodeTypeCardProps {
  projectId: string;
  type: NodeType;
  onOpenBoardConfig: (type: NodeType) => void;
  onOpenFieldEditor: (type: NodeType) => void;
}

export function NodeTypeCard({ projectId, type, onOpenBoardConfig, onOpenFieldEditor }: Readonly<NodeTypeCardProps>) {
  const accentColor = type.color || 'var(--primary)';
  const iconName = type.icon || 'Target';

  return (
    <div className="card-planner p-xl relative overflow-hidden">
      <div className="node-accent-strip" style={{ backgroundColor: type.color || undefined }} />
      
      <div className="flex justify-between items-start mb-lg">
        <div className="flex items-center gap-md">
          <div className="node-icon-box" style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }}>
            <IconRenderer name={iconName} color={type.color || undefined} size={24} />
          </div>
          <div>
            <h3 className="text-editorial text-lg font-bold">{type.name}</h3>
            <p className="text-meta text-xs">ID: {type.id.slice(-6)}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => deleteNodeType(projectId, type.id)} icon={<Trash2 size={18} />} className="p-xs" />
      </div>
      
      <div className="mb-xl">
        <p className="node-section-label">Fields</p>
        <div className="flex flex-wrap gap-sm">
          {type.fields?.map((field: FieldDefinition) => (
            <span key={field.id} className="node-field-pill">{field.name}</span>
          ))}
          {(!type.fields || type.fields.length === 0) && <span className="text-xs text-on-surface-variant">No fields defined</span>}
        </div>
      </div>

      <div className="flex gap-sm">
        <Button onClick={() => onOpenBoardConfig(type)} variant="secondary" size="sm" icon={<LayoutGrid size={16} />} className="flex-1">
          Board Config
        </Button>
        <Button onClick={() => onOpenFieldEditor(type)} variant="secondary" size="sm" icon={<Braces size={16} />} className="flex-1">
          Edit Fields
        </Button>
      </div>
    </div>
  );
}
