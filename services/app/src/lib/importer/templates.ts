import type { Blueprint, BlueprintField, BlueprintType, ImportItem } from "./types";

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  /** What it contains, for the picker ("Epic → Story → Task"). */
  summary: string;
  builtIn: boolean;
}

export interface TemplateConfig { blueprint: Blueprint; items?: ImportItem[] }

const points: BlueprintField = { name: "Story points", type: "NUMBER" };
const priority: BlueprintField = { name: "Priority", type: "SELECT", options: ["Low", "Medium", "High", "Urgent"] };

const type = (name: string, color: string, icon: string, fields: BlueprintField[] = []): BlueprintType => ({ name, color, icon, isSprintEligible: true, fields });

export const BUILT_IN_TEMPLATES: (TemplateInfo & { config: TemplateConfig })[] = [
  {
    id: "builtin:software",
    name: "Software sprint",
    description: "Epics, stories, tasks and bugs with story points, ready for sprint planning.",
    summary: "Epic → Story → Task / Bug",
    builtIn: true,
    config: {
      blueprint: {
        nodeTypes: [type("Epic", "#7c3aed", "Rocket"), type("Story", "#2563eb", "BookOpen", [points, priority]), type("Task", "#059669", "CheckSquare", [points]), type("Bug", "#dc2626", "Bug", [points, priority])],
        relations: [{ parent: "Epic", child: "Story" }, { parent: "Story", child: "Task" }, { parent: "Story", child: "Bug" }],
      },
    },
  },
  {
    id: "builtin:bugs",
    name: "Bug tracker",
    description: "Report, triage and fix bugs with a severity and the steps to reproduce.",
    summary: "Bug → Task",
    builtIn: true,
    config: {
      blueprint: {
        nodeTypes: [
          type("Bug", "#dc2626", "Bug", [{ name: "Severity", type: "SELECT", options: ["Minor", "Major", "Critical"] }, { name: "Steps to reproduce", type: "TEXT" }, { name: "Story points", type: "NUMBER" }]),
          type("Task", "#059669", "CheckSquare", [points]),
        ],
        relations: [{ parent: "Bug", child: "Task" }],
      },
    },
  },
  {
    id: "builtin:marketing",
    name: "Marketing campaign",
    description: "Plan campaigns, break them into initiatives, and track the work and budget.",
    summary: "Campaign → Initiative → Task",
    builtIn: true,
    config: {
      blueprint: {
        nodeTypes: [
          type("Campaign", "#db2777", "Megaphone", [{ name: "Budget", type: "NUMBER" }]),
          type("Initiative", "#d97706", "Flag", [{ name: "Channel", type: "SELECT", options: ["Email", "Social", "Search", "Events", "Content", "Partners"] }]),
          type("Task", "#059669", "CheckSquare", [{ name: "Estimate (hours)", type: "NUMBER" }]),
        ],
        relations: [{ parent: "Campaign", child: "Initiative" }, { parent: "Initiative", child: "Task" }],
      },
    },
  },
  {
    id: "builtin:kanban",
    name: "Personal kanban",
    description: "One simple list of tasks to move across the board.",
    summary: "Task",
    builtIn: true,
    config: { blueprint: { nodeTypes: [type("Task", "#2563eb", "CheckSquare", [{ name: "Estimate (hours)", type: "NUMBER" }])], relations: [] } },
  },
  {
    id: "builtin:blank",
    name: "Blank",
    description: "Start empty and define your own item types.",
    summary: "Nothing yet",
    builtIn: true,
    config: { blueprint: { nodeTypes: [], relations: [] } },
  },
];

export function builtInTemplate(id: string) {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}

/** Why a blueprint can't be used, or null when it is fine. Keeps saved/imported blueprints from carrying junk into a project. */
export function blueprintProblem(blueprint: Blueprint | undefined): string | null {
  if (!blueprint) return null;
  if (!Array.isArray(blueprint.nodeTypes) || blueprint.nodeTypes.length > 50) return "A project can have up to 50 item types.";
  const names = new Set<string>();
  for (const t of blueprint.nodeTypes) {
    if (typeof t.name !== "string" || !t.name.trim() || t.name.length > 120) return "Every item type needs a name of up to 120 characters.";
    const key = t.name.trim().toLowerCase();
    if (names.has(key)) return `Two item types are both called “${t.name}”.`;
    names.add(key);
    if ((t.fields ?? []).length > 25) return `“${t.name}” has more than 25 fields.`;
    for (const f of t.fields ?? []) {
      if (typeof f.name !== "string" || !f.name.trim() || f.name.length > 120) return `A field of “${t.name}” has no valid name.`;
      if (!["TEXT", "NUMBER", "DATE", "CHECKBOX", "SELECT"].includes(f.type)) return `The field “${f.name}” has an unknown type.`;
    }
  }
  for (const r of blueprint.relations ?? []) {
    if (!names.has(String(r.parent).trim().toLowerCase()) || !names.has(String(r.child).trim().toLowerCase())) return "A parent/child rule points at an item type that doesn't exist.";
  }
  return null;
}
