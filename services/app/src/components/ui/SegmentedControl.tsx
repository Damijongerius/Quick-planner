"use client";
import "./SegmentedControl.css";

import React from "react";
import { motion } from "framer-motion";

interface Option {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className = "" }: Readonly<SegmentedControlProps>) {
  return (
    <div className={`segmented-control-container ${className}`}>
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`segmented-option ${isActive ? 'active' : ''}`}
          >
            {isActive && (
              <motion.div
                layoutId="segmented-active"
                className="segmented-active-bg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
