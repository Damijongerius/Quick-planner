"use client";

import React from 'react';

interface PropertyPillProps {
    label: string;
}

export function PropertyPill({ label }: PropertyPillProps) {
    return (
        <div className="px-2 py-0.5 bg-[#f1f3f5] border border-[#dee2e6] rounded-full inline-flex items-center justify-center shadow-sm">
            <span className="text-[10px] font-bold text-[#495057] uppercase tracking-tight leading-none">
                {label}
            </span>
        </div>
    );
}
