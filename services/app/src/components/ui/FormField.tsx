"use client";

import React from "react";
import "./Form.css";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
}

export function FormField({ label, children, description, error, className = "" }: Readonly<FormFieldProps & { className?: string }>) {
  const generatedId = React.useId();
  
  // Try to find an id in the child or use the generated one
  const child = React.isValidElement(children) ? children : null;
  const childId = (child?.props as Record<string, unknown>)?.id as string || generatedId;

  return (
    <div className={`form-field-container ${className}`}>
      <label htmlFor={childId} className="form-field-label text-meta">
        {label.toUpperCase()}
      </label>
      {child && React.cloneElement(child as React.ReactElement, { id: childId } as Record<string, unknown>)}
      {!child && children}
      {description && <p className="form-field-description">{description}</p>}
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}
