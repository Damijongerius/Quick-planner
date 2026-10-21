export type ItemStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type SprintStatusValue = "PLANNED" | "ACTIVE" | "COMPLETED";

/** One work item in the format every importer produces and the server consumes. */
export interface ImportItem {
  /** Unique within the file; other items point at it with parentRef / blockedBy. */
  ref: string;
  title: string;
  description?: string;
  /** Name of the item type ("Epic", "Bug", "Story"…). */
  type?: string;
  /** The source's own status text; mapped to a real status in the wizard. */
  rawStatus?: string;
  status?: ItemStatus;
  parentRef?: string;
  /** Email address or full name of the person. */
  assignee?: string;
  /** Sprint / cycle name. */
  sprint?: string;
  /** YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
  completedAt?: string;
  fields?: Record<string, string | number | boolean>;
  blockedBy?: string[];
  archived?: boolean;
}

export interface ImportSprint {
  name: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatusValue;
  capacity?: number;
}

export interface ImportMilestone { name: string; date: string; color?: string; description?: string }

export interface BlueprintField { name: string; type: "TEXT" | "NUMBER" | "DATE" | "CHECKBOX" | "SELECT"; required?: boolean; options?: string[] }
export interface BlueprintType {
  name: string;
  color?: string | null;
  icon?: string | null;
  isSprintEligible?: boolean;
  boardConfig?: Record<string, unknown> | null;
  fields?: BlueprintField[];
}
/** The shape of a project without its content: item types, their fields, and which may contain which. */
export interface Blueprint {
  nodeTypes: BlueprintType[];
  relations: { parent: string; child: string }[];
}

export type ImportSource = "quick-planner" | "trello" | "jira" | "linear" | "asana" | "csv";

export interface ParsedImport {
  source: ImportSource;
  projectName?: string;
  items: ImportItem[];
  sprints: ImportSprint[];
  milestones: ImportMilestone[];
  blueprint?: Blueprint;
  warnings: string[];
}

/** What the wizard sends to the server once the user has confirmed the preview. */
export interface ImportPlan {
  source: ImportSource;
  items: ImportItem[];
  sprints: ImportSprint[];
  milestones: ImportMilestone[];
  blueprint?: Blueprint;
  /** Used for items without a type. */
  defaultType?: string;
}

export const IMPORT_LIMITS = {
  items: 2000,
  sprints: 100,
  milestones: 100,
  title: 200,
  description: 20_000,
  fieldValue: 2000,
  fieldsPerType: 25,
  fileBytes: 5 * 1024 * 1024,
} as const;
