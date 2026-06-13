import React from "react";
import { NodeType } from "@/lib/types";
import { getGridTemplate } from "./BacklogLayoutUtils";

interface Props {
  selectedColumns: string[];
  selectedNodeType: NodeType | undefined;
}

export function BacklogTableHeader({ selectedColumns, selectedNodeType }: Props) {
  return (
    <div 
      className="backlog-table-header" 
      style={{ 
        gridTemplateColumns: getGridTemplate(selectedColumns.length),
        paddingLeft: '24px',
        paddingRight: '24px'
      }}
    >
      <div className="min-w-0 flex items-center gap-md">
        <span className="text-meta" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>TITLE / HIERARCHY</span>
      </div>
      {selectedColumns.filter(c => c !== 'title').map((colKey) => {
        const isCustom = selectedNodeType?.fields?.some(f => f.name === colKey);
        const label = isCustom 
          ? colKey.toUpperCase()
          : colKey === 'sprintId' ? 'SPRINT'
          : colKey === 'startDate' ? 'START DATE'
          : colKey === 'endDate' ? 'END DATE'
          : colKey.toUpperCase();
        return (
          <div key={colKey} className="min-w-0 text-left">
            <span className="text-meta" style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
