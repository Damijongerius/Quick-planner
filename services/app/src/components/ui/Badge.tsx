import React from "react";
import "./Badge.css";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "outline";
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ 
  children, 
  variant = "secondary", 
  size = "sm", 
  className = "",
  style
}: BadgeProps) {
  return (
    <span 
      className={`badge-base badge-${variant} badge-${size} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
