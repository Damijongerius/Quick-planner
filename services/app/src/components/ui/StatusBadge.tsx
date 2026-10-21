import { statusMeta } from "@/lib/statusMeta";

interface StatusBadgeProps {
  readonly status: string;
  readonly className?: string;
}

/** Dot + label. The colour carries the state, the text keeps it accessible. */
export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const meta = statusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-fg ${className}`}>
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden />
      {meta.label}
    </span>
  );
}
