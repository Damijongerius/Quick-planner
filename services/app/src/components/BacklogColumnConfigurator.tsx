import React from "react";
import { NodeType } from "@/lib/types";
import { Select } from "./ui/Select";
import { sortColumns } from "./BacklogLayoutUtils";

interface Props {
  nodeTypes: NodeType[];
  targetNodeTypeId: string | null;
  setTargetNodeTypeId: (id: string) => void;
  selectedColumns: string[];
  setSelectedColumns: (cols: string[]) => void;
  customFieldNames: string[];
  handleColumnToggle: (colId: string) => void;
}

export function BacklogColumnConfigurator({
  nodeTypes,
  targetNodeTypeId,
  setTargetNodeTypeId,
  selectedColumns,
  setSelectedColumns,
  customFieldNames,
  handleColumnToggle
}: Props) {
  const selectedNodeType = nodeTypes.find(t => t.id === targetNodeTypeId);

  return (
    <div className="flex flex-col gap-md bg-surface-container-low p-lg rounded-2xl border border-outline-variant shadow-sm mb-xs">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-md">
          <span className="text-meta text-primary font-bold">Target Custom Columns:</span>
          <div style={{ width: 'auto', minWidth: '160px' }}>
            <Select
              options={nodeTypes.map((type) => ({ value: type.id, label: type.name }))}
              value={targetNodeTypeId || ""}
              onChange={(val) => {
                setTargetNodeTypeId(val);
                const newType = nodeTypes.find(t => t.id === val);
                const newCustomFields = newType?.fields?.map(f => f.name) || [];
                const defaultCols = ['title', 'status', 'sprintId'];
                if (newCustomFields.length > 0) defaultCols.push(newCustomFields[0]);
                else defaultCols.push('startDate');
                setSelectedColumns(sortColumns(defaultCols, customFieldNames));
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-sm">
          <span className="text-meta text-on-surface-variant font-semibold">
            Visible Columns <span className="opacity-50" style={{ fontSize: '10px' }}>(Max 4 total)</span>:
          </span>
          {[
            { id: 'status', label: 'Status' },
            { id: 'sprintId', label: 'Sprint' },
            { id: 'startDate', label: 'Start Date' },
            { id: 'endDate', label: 'End Date' }
          ].map((col) => {
            const isSelected = selectedColumns.includes(col.id);
            return (
              <button
                key={col.id}
                onClick={() => handleColumnToggle(col.id)}
                className={`blueprint-chip ${isSelected ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '4px 12px', cursor: 'pointer' }}
              >
                {col.label}
              </button>
            );
          })}
          {selectedNodeType?.fields?.map((field) => {
            const isSelected = selectedColumns.includes(field.name);
            return (
              <button
                key={field.id}
                onClick={() => handleColumnToggle(field.name)}
                className={`blueprint-chip ${isSelected ? 'active' : ''}`}
                style={{ fontSize: '10px', padding: '4px 12px', cursor: 'pointer', border: '1px dashed var(--primary)' }}
              >
                {field.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
