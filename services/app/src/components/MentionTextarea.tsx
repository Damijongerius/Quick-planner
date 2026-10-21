"use client";

import React, { useRef, useState } from "react";
import { Avatar } from "./ui/Avatar";
import { activeMention } from "@/lib/mentions";
import type { MemberInfo } from "@/lib/actions/members";

interface Props {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly members: MemberInfo[];
  readonly onSubmit: () => void;
  readonly placeholder?: string;
  readonly maxLength?: number;
}

/** A textarea where typing "@" offers the project's members. Ctrl/Cmd+Enter submits. */
export function MentionTextarea({ id, value, onChange, members, onSubmit, placeholder, maxLength }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [caret, setCaret] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const mention = dismissed ? null : activeMention(value, caret);
  const matches = mention
    ? members.filter((m) => (m.name || m.email || "").toLowerCase().includes(mention.query.toLowerCase())).slice(0, 6)
    : [];
  const open = matches.length > 0;

  const choose = (m: MemberInfo) => {
    if (!mention) return;
    const label = m.name || m.email || "";
    const next = `${value.slice(0, mention.start)}@${label} ${value.slice(caret)}`;
    onChange(next);
    const pos = mention.start + label.length + 2;
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(pos, pos); setCaret(pos); });
  };

  return (
    <div className="relative">
      {open && (
        <ul role="listbox" aria-label="Mention someone" className="absolute bottom-full left-0 z-10 mb-1 w-64 animate-pop-in overflow-hidden rounded-lg border border-border bg-panel p-1 shadow-lg">
          {matches.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); choose(m); }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${i === highlight ? "bg-hover" : ""}`}
              >
                <Avatar src={m.image} name={m.name} size="xs" />
                <span className="truncate">{m.name || m.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <textarea
        id={id}
        ref={ref}
        className="input-planner !h-auto min-h-[72px] resize-y py-2"
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        onChange={(e) => { onChange(e.target.value); setCaret(e.target.selectionStart); setHighlight(0); setDismissed(false); }}
        onSelect={(e) => setCaret((e.target as HTMLTextAreaElement).selectionStart)}
        onKeyDown={(e) => {
          if (open) {
            if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => (h + 1) % matches.length); return; }
            if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => (h - 1 + matches.length) % matches.length); return; }
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); choose(matches[highlight]); return; }
            if (e.key === "Escape") { e.preventDefault(); setDismissed(true); return; }
          }
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit(); }
        }}
      />
    </div>
  );
}
