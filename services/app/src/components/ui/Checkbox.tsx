"use client";

import React from "react";
import "./Checkbox.css";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, ...props }, ref) => {
    return (
      <label className={`checkbox-custom-label ${props.disabled ? "disabled" : ""} ${className}`}>
        <span className="checkbox-custom-wrapper">
          <input
            ref={ref}
            type="checkbox"
            className="checkbox-premium"
            {...props}
          />
        </span>
        {label && <span className="checkbox-custom-text">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
