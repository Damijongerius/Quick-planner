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

  // Link the label to its control. Children can be a list with `false` holes (conditional fields),
  // so look at the elements that actually render, and only link when there is exactly one.
  const elements = React.Children.toArray(children).filter(React.isValidElement);
  const child = elements.length === 1 && React.Children.count(children) >= 1 ? elements[0] : null;
  const childId = (child?.props as Record<string, unknown> | undefined)?.id as string | undefined || generatedId;

  return (
    <div className={`form-field-container ${className}`}>
      <label htmlFor={childId} className="form-field-label text-meta">
        {label}
      </label>
      {child ? React.cloneElement(child as React.ReactElement, { id: childId } as Record<string, unknown>) : children}
      {description && <p className="form-field-description">{description}</p>}
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}
