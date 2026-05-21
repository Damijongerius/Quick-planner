"use client";

import React from "react";
import "./Input.css";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  className?: string;
  variant?: "premium" | "planner" | "seamless";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", variant = "premium", ...props }, ref) => {
    const classMap = {
      premium: "input-premium",
      planner: "input-planner",
      seamless: "input-seamless"
    };

    return (
      <input
        ref={ref}
        type={type}
        className={`${classMap[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
