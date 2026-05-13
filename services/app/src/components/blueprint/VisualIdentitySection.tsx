"use client";

import React from 'react';
import { IconPicker } from '../IconPicker';
import { PlannerColorPicker } from '../PlannerColorPicker';
import { NodeType } from '@/lib/types';

interface VisualIdentitySectionProps {
    activeNodeType: NodeType;
    onUpdateIcon: (icon: string) => Promise<void>;
    onUpdateColor: (color: string) => Promise<void>;
}

export function VisualIdentitySection({ activeNodeType, onUpdateIcon, onUpdateColor }: VisualIdentitySectionProps) {
    return (
        <section className="flex flex-col gap-lg">
            <label className="text-meta text-10px opacity-60 uppercase">Visual Identity</label>
            <div className="bg-surface-container-low p-lg rounded-[24px] border border-outline-variant">
                <p className="text-10px font-bold mb-md opacity-40 uppercase">Icon Representation</p>
                <IconPicker currentIcon={activeNodeType.icon || ""} onSelect={onUpdateIcon} color={activeNodeType.color || undefined} />
                
                <div className="mt-lg">
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Color Signature</p>
                    <PlannerColorPicker currentColor={activeNodeType.color || ""} onSelect={onUpdateColor} />
                </div>
            </div>
        </section>
    );
}
