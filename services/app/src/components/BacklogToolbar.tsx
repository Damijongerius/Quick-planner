"use client";

import React, { useState } from "react";
import { Archive, ArchiveRestore, Check, Columns3, Plus, Search, X } from "lucide-react";
import { Button } from "./ui/Button";
import { IconRenderer } from "./IconPicker";
import { NodeType } from "@/lib/types";
import { AssigneeFilter } from "./AssigneeFilter";
import { useDismiss } from "./ui/useDismiss";
import { ViewsMenu } from "./ViewsMenu";
import type { AssigneeFilter as AssigneeFilterValue } from "@/lib/assignee";

export interface ColumnOption {
  id: string;
  label: string;
  group?: string;
}

interface BacklogToolbarProps {
  availableRootTypes: NodeType[];
  onAddRoot: (typeId: string, typeName: string) => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  hasArchivedNodes: boolean;
  isReadOnly?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  columnOptions: ColumnOption[];
  selectedColumns: string[];
  onToggleColumn: (id: string) => void;
  assigneeFilter: AssigneeFilterValue;
  onAssigneeFilterChange: (value: AssigneeFilterValue) => void;
}

export function BacklogToolbar(props: Readonly<BacklogToolbarProps>) {
  const { hideCompleted, onToggleHideCompleted, showArchived, onToggleShowArchived, hasArchivedNodes, search, onSearchChange } = props;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search items…"
          aria-label="Search items"
          data-shortcut-search
          className="input-planner !pl-8 !pr-8"
        />
        {search && (
          <button onClick={() => onSearchChange("")} aria-label="Clear search" className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-faint hover:bg-hover hover:text-fg">
            <X size={14} />
          </button>
        )}
      </div>

      <AssigneeFilter value={props.assigneeFilter} onChange={props.onAssigneeFilterChange} />

      <FilterChip active={!hideCompleted} onClick={onToggleHideCompleted}>
        Show completed
      </FilterChip>

      {(hasArchivedNodes || showArchived) && (
        <FilterChip active={showArchived} onClick={onToggleShowArchived} icon={showArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}>
          Archived
        </FilterChip>
      )}

      <div className="ml-auto flex items-center gap-2">
        <ViewsMenu page="backlog" />
        <ColumnsMenu options={props.columnOptions} selected={props.selectedColumns} onToggle={props.onToggleColumn} />
        {!props.isReadOnly && <NewItemMenu types={props.availableRootTypes} onAdd={props.onAddRoot} />}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, icon, children }: Readonly<{ active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors",
        active ? "border-accent/40 bg-accent-soft text-accent" : "border-border-strong bg-panel text-muted hover:bg-hover hover:text-fg",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function ColumnsMenu({ options, selected, onToggle }: Readonly<{ options: ColumnOption[]; selected: string[]; onToggle: (id: string) => void }>) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  const standard = options.filter((o) => !o.group);
  const custom = options.filter((o) => o.group);

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" onClick={() => setOpen(!open)} icon={<Columns3 size={14} />} aria-haspopup="menu" aria-expanded={open}>
        Columns
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 max-h-80 w-56 animate-pop-in overflow-y-auto rounded-lg border border-border bg-panel p-1 shadow-lg">
          {standard.map((o) => <ColumnRow key={o.id} option={o} checked={selected.includes(o.id)} onToggle={onToggle} />)}
          {custom.length > 0 && <p className="px-2.5 pb-1 pt-2 text-xs font-medium text-faint">Custom fields</p>}
          {custom.map((o) => <ColumnRow key={o.id} option={o} checked={selected.includes(o.id)} onToggle={onToggle} />)}
        </div>
      )}
    </div>
  );
}

function ColumnRow({ option, checked, onToggle }: Readonly<{ option: ColumnOption; checked: boolean; onToggle: (id: string) => void }>) {
  return (
    <button role="menuitemcheckbox" aria-checked={checked} onClick={() => onToggle(option.id)} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-hover">
      <span className="flex h-4 w-4 items-center justify-center text-accent">{checked && <Check size={14} />}</span>
      <span className="flex-1 truncate">{option.label}</span>
      {option.group && <span className="truncate text-xs text-faint">{option.group}</span>}
    </button>
  );
}

function NewItemMenu({ types, onAdd }: Readonly<{ types: NodeType[]; onAdd: (typeId: string, typeName: string) => void }>) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  if (types.length === 0) return null;

  const single = types.length === 1;
  return (
    <div ref={ref} className="relative">
      <Button data-shortcut-create onClick={() => (single ? onAdd(types[0].id, types[0].name) : setOpen(!open))} icon={<Plus size={14} />} aria-haspopup={single ? undefined : "menu"}>
        {single ? `New ${types[0].name}` : "New item"}
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-56 animate-pop-in rounded-lg border border-border bg-panel p-1 shadow-lg">
          {types.map((type) => (
            <button
              key={type.id}
              role="menuitem"
              onClick={() => { onAdd(type.id, type.name); setOpen(false); }}
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm hover:bg-hover"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md" style={{ color: type.color || "var(--accent)", background: `color-mix(in srgb, ${type.color || "var(--accent)"} 14%, transparent)` }}>
                <IconRenderer name={type.icon || "Folder"} size={14} />
              </span>
              {type.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
