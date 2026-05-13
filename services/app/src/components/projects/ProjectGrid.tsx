"use client";

import { ReactNode } from "react";

interface ProjectGridProps {
  children: ReactNode;
  className?: string;
}

export function ProjectGrid({ children, className }: ProjectGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl ${className || ""}`}>
      {children}
    </div>
  );
}
