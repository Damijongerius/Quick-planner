"use client";

import React, { useState } from "react";
import { CalendarDays, Layers, Lock, MessageSquare } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { PeerBadges } from "../realtime/PeerBadges";
import { IconRenderer } from "../IconPicker";
import { getOptionColor } from "@/lib/utils/colorUtils";
import { formatShortDate } from "@/lib/statusMeta";

import { Node } from "@/lib/types";

interface KanbanCardProps {
  task: Node;
  onClick: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: Readonly<KanbanCardProps>) {
  const isDone = task.status === "DONE";
  const parentNode = task.parentLinks?.[0]?.parentNode;
  const color = task.type?.color || "var(--accent)";

  const openBlockers = (task.blockedBy ?? []).filter((d) => d.blockingNode?.status !== "DONE");
  const [now] = useState(() => Date.now());
  const isOverdue = !isDone && !!task.endDate && new Date(task.endDate).getTime() < now - 86_400_000;
  const pill = firstSelectPill(task);

  return (
    <div
      onClick={onClick}
      className={[
        "cursor-pointer rounded-md border bg-panel p-3 shadow-sm transition-[border-color,box-shadow]",
        isDragging ? "border-accent shadow-lg" : "border-border hover:border-border-strong hover:shadow-md",
        isDone ? "opacity-70" : "",
      ].join(" ")}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted">
        <span style={{ color }} className="flex"><IconRenderer name={task.type?.icon || "Target"} size={13} /></span>
        <span className="truncate">{task.type?.name}</span>
        {parentNode && (
          <>
            <Layers size={11} className="ml-1 shrink-0 text-faint" />
            <span className="truncate text-faint">{parentNode.title}</span>
          </>
        )}
        <span className="ml-auto shrink-0"><PeerBadges nodeId={task.id} /></span>
      </div>

      <p className={`text-sm font-medium leading-snug ${isDone ? "text-muted line-through decoration-faint" : "text-fg"}`}>{task.title}</p>

      {(task.endDate || pill || openBlockers.length > 0 || task.assignee || (task._count?.comments ?? 0) > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {task.endDate && (
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs ${isOverdue ? "bg-danger-soft text-danger" : "bg-hover text-muted"}`} suppressHydrationWarning>
              <CalendarDays size={11} /> {formatShortDate(task.endDate)}
            </span>
          )}
          {pill && (
            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium" style={{ color: pill.color, background: `color-mix(in srgb, ${pill.color} 14%, transparent)` }}>
              {pill.value}
            </span>
          )}
          {openBlockers.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-warning-soft px-1.5 py-0.5 text-xs text-warning" title={`Blocked by: ${openBlockers.map((b) => b.blockingNode.title).join(", ")}`}>
              <Lock size={11} /> Blocked
            </span>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-faint" title={`${task._count?.comments} comments`}>
              <MessageSquare size={11} /> {task._count?.comments}
            </span>
          )}
          {task.assignee && (
            <span className="ml-auto" title={`Assigned to ${task.assignee.name || task.assignee.email}`}>
              <Avatar src={task.assignee.image} name={task.assignee.name} size="xs" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** The first SELECT custom field that has a value (e.g. Priority), as a coloured pill. */
function firstSelectPill(task: Node): { value: string; color: string } | null {
  const fields = task.type?.fields ?? [];
  const content = (task.content ?? {}) as Record<string, unknown>;
  for (const field of fields) {
    if (field.type !== "SELECT") continue;
    const value = content[field.name];
    if (typeof value !== "string" || !value) continue;
    const opt = (field.options as unknown[] | null | undefined)?.find((o) => (typeof o === "string" ? o : (o as { value?: string })?.value) === value);
    const color = (opt && typeof opt !== "string" ? (opt as { color?: string }).color : undefined) || getOptionColor(value);
    return { value, color };
  }
  return null;
}
