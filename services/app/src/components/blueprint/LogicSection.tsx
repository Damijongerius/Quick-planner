"use client";

import React from 'react';
import { Milestone, LayoutGrid, Calendar, LucideIcon, Info } from 'lucide-react';

interface LogicSectionProps {
    isSprintEligible: boolean;
    showOnKanban: boolean;
    showOnGantt: boolean;
    onToggleSprint: () => Promise<void>;
    onToggleVisibility: (key: 'showOnKanban' | 'showOnGantt') => Promise<void>;
    isReadOnly?: boolean;
}

export function LogicSection({ 
    isSprintEligible, 
    showOnKanban, 
    showOnGantt, 
    onToggleSprint, 
    onToggleVisibility,
    isReadOnly
}: Readonly<LogicSectionProps>) {
    return (
        <section className="flex flex-col gap-md">
            <span className="text-meta text-10px opacity-60 uppercase">Logic</span>
            <div className="flex flex-col gap-sm">
                <LogicToggle 
                    label="Sprint Eligibility" 
                    description="Allows nodes of this type to be assigned to specific sprints."
                    icon={Milestone} 
                    active={isSprintEligible} 
                    onToggle={onToggleSprint} 
                    isReadOnly={isReadOnly} 
                />
                <LogicToggle 
                    label="Kanban Visibility" 
                    description="Shows nodes of this type as cards on the Kanban board."
                    icon={LayoutGrid} 
                    active={showOnKanban} 
                    onToggle={() => onToggleVisibility('showOnKanban')} 
                    isReadOnly={isReadOnly} 
                />
                <LogicToggle 
                    label="Gantt Visibility" 
                    description="Displays nodes of this type on the timeline Gantt chart."
                    icon={Calendar} 
                    active={showOnGantt} 
                    onToggle={() => onToggleVisibility('showOnGantt')} 
                    isReadOnly={isReadOnly} 
                />
            </div>
        </section>
    );
}

interface LogicToggleProps {
    label: string;
    description?: string;
    icon: LucideIcon;
    active: boolean;
    onToggle: () => void;
    isReadOnly?: boolean;
}


function LogicToggle({ label, description, icon: Icon, active, onToggle, isReadOnly }: Readonly<LogicToggleProps>) {
    return (
        <div className="flex items-center justify-between p-md bg-surface-container-low border border-outline-variant rounded-xl transition-colors hover:bg-surface-container-medium">
            <div className="flex items-center gap-md">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-primary/10 text-primary' : 'bg-surface-container-high opacity-60'}`}>
                    <Icon size={16} />
                </div>
                <div className="flex items-center gap-xs">
                    <span className="text-xs font-bold">{label}</span>
                    {description && (
                        <div title={description} className="cursor-help opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Info size={14} />
                        </div>
                    )}
                </div>
            </div>
            <label className={`flex items-center ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className="sr-only">Toggle {label}</span>
                <input 
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => !isReadOnly && onToggle()}
                    disabled={isReadOnly}
                />
                <div 
                    className={`toggle-track scale-75 ${active ? 'active' : ''} ${isReadOnly ? 'opacity-50' : ''}`}
                    aria-hidden="true"
                >
                    <div className={`toggle-thumb ${active ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200`} />
                </div>
            </label>
        </div>
    );
}
