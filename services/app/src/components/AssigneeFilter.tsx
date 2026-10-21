"use client";

import { Select } from "./ui/Select";
import { useProject } from "./ProjectContext";
import type { AssigneeFilter as Filter } from "@/lib/assignee";

/** Compact "who" filter. Renders nothing for single-person projects, where it would be noise. */
export function AssigneeFilter({ value, onChange }: Readonly<{ value: Filter; onChange: (value: Filter) => void }>) {
  const { members } = useProject();
  if (members.length < 2) return null;

  const options = [
    { value: "all", label: "Everyone" },
    { value: "me", label: "Assigned to me" },
    { value: "none", label: "Unassigned" },
    ...members.filter((m) => !m.isYou).map((m) => ({ value: m.id, label: m.name || m.email || "Member" })),
  ];

  return (
    <div style={{ width: 170 }} title="Filter by assignee">
      <Select options={options} value={value} onChange={onChange} />
    </div>
  );
}
