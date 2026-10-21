import React from "react";

interface PageHeaderProps {
  readonly title: string;
  readonly description?: string;
  readonly actions?: React.ReactNode;
  readonly children?: React.ReactNode;
}

/** Consistent page title row: title + optional description on the left, actions on the right. */
export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
