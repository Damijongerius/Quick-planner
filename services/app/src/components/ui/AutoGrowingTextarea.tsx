"use client";

import React, { useEffect, useRef } from "react";
import "./AutoGrowingTextarea.css";

interface AutoGrowingTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AutoGrowingTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  className = "",
}: Readonly<AutoGrowingTextareaProps>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (textarea) {
        // Reset height to compute actual scrollHeight cleanly
        textarea.style.height = "auto";
        const scrollHeight = textarea.scrollHeight;
        // Apply beautiful auto-sizing with a standard minimum height
        textarea.style.height = `${Math.max(48, scrollHeight)}px`;
      }
    };

    adjustHeight();

    // Gotcha Guard: If rendered inside an animated container (like a sliding sidepanel),
    // scrollHeight might initially calculate as 0. A micro-timeout guarantees correct layout sizing.
    const timeoutId = setTimeout(adjustHeight, 50);
    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className={`input-premium auto-growing-textarea ${className}`}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      rows={1}
      style={{ resize: "none", overflowY: "hidden" }}
    />
  );
}
