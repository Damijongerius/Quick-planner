"use client";

interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-accent" : "bg-border-strong"}`}
    >
      <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}
