import React, { Suspense } from "react";
import ProjectLayoutClient from "./ProjectLayoutClient";

export default function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl opacity-50">Loading operations console...</div>
      </div>
    }>
      <ProjectLayoutClient>
        {children}
      </ProjectLayoutClient>
    </Suspense>
  );
}
