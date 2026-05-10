"use client";

import React from "react";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  style?: React.CSSProperties;
}

export function FormField({ label, children, description, error, className = "" }: FormFieldProps & { className?: string }) {
  return (
    <div className={`form-field-container ${className}`}>
      <label className="form-field-label text-meta">{label.toUpperCase()}</label>
      {children}
      {description && <p className="form-field-description">{description}</p>}
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
}
