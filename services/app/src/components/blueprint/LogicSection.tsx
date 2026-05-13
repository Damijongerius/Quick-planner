"use client";

import React from 'react';
import { Milestone, LayoutGrid } from 'lucide-react';

interface LogicSectionProps {
    isSprintEligible: boolean;
    showOnKanban: boolean;
    showOnGantt: boolean;
    onToggleSprint: () => Promise<void>;
    onToggleVisibility: (key: 'showOnKanban' | 'showOnGantt') => Promise<void>;
}

export function LogicSection({ 
    isSprintEligible, 
    showOnKanban, 
    showOnGantt, 
    onToggleSprint, 
    onToggleVisibility 
}: LogicSectionProps) {
    return (
        <section className="flex flex-col gap-md">
            <label className="text-meta text-10px opacity-60 uppercase">Logic</label>
            <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between p-lg bg-surface-container-low border border-outline-variant rounded-2xl">
                    <div className="flex items-center gap-md">
                        <Milestone size={18} className="text-primary" />
                        <div>
                            <p className="text-xs font-bold">Sprint Eligibility</p>
                            <p className="text-10px opacity-50">Can be assigned to cycles.</p>
                        </div>
                    </div>
                    <div 
                        onClick={onToggleSprint}
                        className={`toggle-track ${isSprintEligible ? 'active' : ''}`}
                    >
                        <div className={`toggle-thumb ${isSprintEligible ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200`} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-md">
                    <div className="flex items-center justify-between p-md bg-surface-container-low border border-outline-variant rounded-xl">
                        <div className="flex items-center gap-sm">
                            <LayoutGrid size={16} className="opacity-60" />
                            <span className="text-xs font-bold">Kanban</span>
                        </div>
                        <div 
                            onClick={() => onToggleVisibility('showOnKanban')}
                            className={`toggle-track scale-75 ${showOnKanban ? 'active' : ''}`}
                        >
                            <div className={`toggle-thumb ${showOnKanban ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200`} />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-md bg-surface-container-low border border-outline-variant rounded-xl">
                        <div className="flex items-center gap-sm">
                            <LayoutGrid size={16} className="opacity-60 rotate-90" />
                            <span className="text-xs font-bold">Gantt</span>
                        </div>
                        <div 
                            onClick={() => onToggleVisibility('showOnGantt')}
                            className={`toggle-track scale-75 ${showOnGantt ? 'active' : ''}`}
                        >
                            <div className={`toggle-thumb ${showOnGantt ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200`} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
