import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  icon, 
  loading, 
  className = "", 
  ...props 
}: ButtonProps) {
  const baseClass = "button-base";
  const variantClass = `button-${variant}`;
  const sizeClass = `button-${size}`;
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="spinner-sm" />
      ) : (
        <>
          {icon && <span className="button-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
