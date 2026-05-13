import React from "react";
import "./Card.css";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "flat" | "outline";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
}

export function Card({ 
  children, 
  variant = "elevated", 
  padding = "md", 
  className = "" 
}: CardProps) {
  return (
    <div className={`card-planner card-${variant} card-p-${padding} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-header ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card-content ${className}`}>{children}</div>;
}
