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
        <section className="flex flex-col gap-lg">
            <span className="text-meta text-10px opacity-60 uppercase">Visual Identity</span>
            <div className="bg-surface-container-low p-lg rounded-[24px] border border-outline-variant">
                <p className="text-10px font-bold mb-md opacity-40 uppercase">Icon Representation</p>
                <IconPicker currentIcon={activeNodeType.icon || ""} onSelect={isReadOnly ? () => {} : onUpdateIcon} color={activeNodeType.color || undefined} />
                
                <div className="mt-lg">
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Color Signature</p>
                    <PlannerColorPicker currentColor={activeNodeType.color || ""} onSelect={isReadOnly ? () => {} : onUpdateColor} />
                </div>
            </div>
        </section>
    );
}
