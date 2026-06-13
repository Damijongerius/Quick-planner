import React from "react";

export function NoActiveSprintState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h3 className="text-xl mb-sm">No Active Sprint</h3>
      <p className="text-sm">Select or create a strategic cycle in Workspace Settings.</p>
    </div>
  );
}

export function getKanbanColumns() {
  return [
    { id: 'TODO', title: 'To Do', color: 'var(--on-surface-variant)' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'var(--primary)' },
    { id: 'REVIEW', title: 'Review', color: 'var(--error)' },
    { id: 'DONE', title: 'Done', color: 'var(--tertiary)' }
  ];
}
