import { useState, useMemo, useEffect } from "react";
import { NodeType } from "@/lib/types";
import { sortColumns } from "./BacklogLayoutUtils";

export function useBacklogColumns(nodeTypes: NodeType[]) {
  const [targetNodeTypeId, setTargetNodeTypeId] = useState<string | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(['title', 'status', 'sprintId', 'startDate']);

  const customFieldNames = useMemo(() => {
    return Array.from(new Set(nodeTypes.flatMap(nt => nt.fields?.map(f => f.name) || [])));
  }, [nodeTypes]);

  useEffect(() => {
    if (nodeTypes.length > 0 && !targetNodeTypeId) {
      setTargetNodeTypeId(nodeTypes[0].id);
      const firstType = nodeTypes[0];
      const customFields = firstType?.fields?.map(f => f.name) || [];
      const defaultCols = ['title', 'status', 'sprintId'];
      if (customFields.length > 0) defaultCols.push(customFields[0]);
      else defaultCols.push('startDate');
      setSelectedColumns(sortColumns(defaultCols, customFieldNames));
    }
  }, [nodeTypes, targetNodeTypeId, customFieldNames]);

  const handleColumnToggle = (colId: string) => {
    const isSelected = selectedColumns.includes(colId);
    let nextCols: string[];
    if (isSelected) {
      if (colId === 'title') return;
      nextCols = selectedColumns.filter(c => c !== colId);
    } else {
      if (selectedColumns.length >= 4) {
        const nonTitleCols = selectedColumns.filter(c => c !== 'title');
        nextCols = ['title', ...nonTitleCols.slice(1), colId];
      } else {
        nextCols = [...selectedColumns, colId];
      }
    }
    setSelectedColumns(sortColumns(nextCols, customFieldNames));
  };

  return { targetNodeTypeId, setTargetNodeTypeId, selectedColumns, setSelectedColumns, customFieldNames, handleColumnToggle };
}
