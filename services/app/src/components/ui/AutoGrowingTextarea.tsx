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

  const lastWidthRef = useRef<number>(0);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.max(36, scrollHeight)}px`;
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width !== lastWidthRef.current && width > 0) {
          lastWidthRef.current = width;
          adjustHeight();
        }
      }
    });

    resizeObserver.observe(textarea);
    adjustHeight();

    return () => {
      resizeObserver.disconnect();
    };
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
