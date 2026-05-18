"use client";

import React from 'react';
import './PropertyPill.css';

interface PropertyPillProps {
    label: string;
}

export function PropertyPill({ label }: Readonly<PropertyPillProps>) {
    return (
        <div className="property-pill">
            <span className="property-pill-text">
                {label}
            </span>
        </div>
    );
}
