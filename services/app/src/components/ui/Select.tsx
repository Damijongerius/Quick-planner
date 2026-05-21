"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "./Select.css";

export interface SelectOption {
  value: string;
  label: string;
  color?: string; // Optional color dot
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  triggerClassName = ""
}: Readonly<SelectProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyles, setDropdownStyles] = useState<React.CSSProperties>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && !containerRef.current.contains(target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownStyles({
          position: 'fixed',
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          zIndex: 9999
        });
      };
      
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }

  function handleOptionClick(val: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(val);
    setIsOpen(false);
  }

  return (
    <div 
      ref={containerRef} 
      className={`select-custom-container ${className} ${disabled ? "disabled" : ""}`}
    >
      <button
        type="button"
        className={`select-custom-trigger ${triggerClassName} ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
        disabled={disabled}
      >
        <span className="flex items-center gap-md truncate">
          {selectedOption?.color && (
            <span 
              className="select-option-color-dot" 
              style={{ backgroundColor: selectedOption.color }} 
            />
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown 
          size={16} 
          className={`select-custom-arrow ${isOpen ? "rotated" : ""}`} 
        />
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="select-custom-dropdown glass"
              style={dropdownStyles}
            >
              <div className="select-custom-options-list">
                {options.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`select-custom-option ${isSelected ? "selected" : ""}`}
                      onClick={(e) => handleOptionClick(opt.value, e)}
                    >
                      {opt.color && (
                        <span 
                          className="select-option-color-dot" 
                          style={{ backgroundColor: opt.color }} 
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
