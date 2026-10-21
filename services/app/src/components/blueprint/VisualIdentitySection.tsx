"use client";

import React from 'react';
import { IconPicker } from '../IconPicker';
import { PlannerColorPicker } from '../PlannerColorPicker';
import { NodeType } from '@/lib/types';

interface VisualIdentitySectionProps {
    activeNodeType: NodeType;
    onUpdateIcon: (icon: string) => Promise<void>;
    onUpdateColor: (color: string) => Promise<void>;
    isReadOnly?: boolean;
}

export function VisualIdentitySection({ activeNodeType, onUpdateIcon, onUpdateColor, isReadOnly }: Readonly<VisualIdentitySectionProps>) {
    return (
        <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Appearance</h3>
            <div className={`flex flex-col gap-4 rounded-lg border border-border bg-bg p-3 ${isReadOnly ? "pointer-events-none opacity-60" : ""}`}>
                <div>
                    <p className="mb-2 text-xs font-medium text-muted">Icon</p>
                    <IconPicker currentIcon={activeNodeType.icon || ""} onSelect={onUpdateIcon} color={activeNodeType.color || undefined} />
                </div>
                <div>
                    <p className="mb-2 text-xs font-medium text-muted">Colour</p>
                    <PlannerColorPicker currentColor={activeNodeType.color || ""} onSelect={onUpdateColor} />
                </div>
            </div>
        </section>
    );
}
