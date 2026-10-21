"use client";

import React from 'react';
import { Milestone, LayoutGrid, GanttChartSquare, LucideIcon } from 'lucide-react';
import { Switch } from '../ui/Switch';

interface LogicSectionProps {
    isSprintEligible: boolean;
    showOnKanban: boolean;
    showOnGantt: boolean;
    onToggleSprint: () => Promise<void>;
    onToggleVisibility: (key: 'showOnKanban' | 'showOnGantt') => Promise<void>;
    isReadOnly?: boolean;
}

export function LogicSection({ isSprintEligible, showOnKanban, showOnGantt, onToggleSprint, onToggleVisibility, isReadOnly }: Readonly<LogicSectionProps>) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Behaviour</h3>
            <div className="divide-y divide-border rounded-lg border border-border bg-bg">
                <Row icon={Milestone} label="Can be planned in sprints" description="Items of this type can be assigned to a sprint." checked={isSprintEligible} onChange={() => onToggleSprint()} disabled={isReadOnly} />
                <Row icon={LayoutGrid} label="Show on the board" description="Items appear as cards on the Kanban board." checked={showOnKanban} onChange={() => onToggleVisibility('showOnKanban')} disabled={isReadOnly} />
                <Row icon={GanttChartSquare} label="Show on the timeline" description="Items appear as bars on the timeline." checked={showOnGantt} onChange={() => onToggleVisibility('showOnGantt')} disabled={isReadOnly} />
            </div>
        </section>
    );
}

function Row({ icon: Icon, label, description, checked, onChange, disabled }: Readonly<{ icon: LucideIcon; label: string; description: string; checked: boolean; onChange: () => void; disabled?: boolean }>) {
    return (
        <div className="flex items-center gap-3 px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-hover text-muted"><Icon size={14} /></span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted">{description}</p>
            </div>
            <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
        </div>
    );
}
