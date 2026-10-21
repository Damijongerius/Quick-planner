"use client";

import Link from "next/link";
import { Archive, Users } from "lucide-react";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  isArchived?: boolean;
}

/** Stable, pleasant colour per project so cards are recognisable at a glance. */
function projectHue(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  return hash;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function ProjectCard({ project, isArchived }: Readonly<ProjectCardProps>) {
  const hue = projectHue(project.id);
  const items = project._count?.nodes ?? 0;
  const sprints = project._count?.sprints ?? 0;
  const members = project._count?.members ?? 0;
  const shared = project.role === "MEMBER";

  return (
    <Link
      href={`/project/${project.id}/board`}
      className={`group flex flex-col gap-4 rounded-lg border border-border bg-panel p-4 shadow-sm transition-all hover:border-border-strong hover:shadow-md ${isArchived ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-semibold text-white"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 40) % 360} 70% 45%))` }}
          aria-hidden
        >
          {project.name.trim().charAt(0).toUpperCase() || "P"}
        </span>
        {isArchived && (
          <span className="inline-flex items-center gap-1 rounded-full bg-hover px-2 py-0.5 text-xs text-muted">
            <Archive size={11} /> Archived
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold group-hover:text-accent">{project.name}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {plural(items, "item")} · {plural(sprints, "sprint")}
        </p>
        {(shared || members > 0) && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-faint">
            <Users size={12} />
            {shared ? `Shared by ${project.ownerName ?? "a teammate"}` : `${plural(members + 1, "person")}`}
          </p>
        )}
      </div>

      <p className="text-xs text-faint" suppressHydrationWarning>
        Updated {new Date(project.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
      </p>
    </Link>
  );
}
