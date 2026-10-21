export interface Project {
  id: string;
  name: string;
  userId: string;
  isArchived: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: { nodes: number; sprints: number; members?: number };
  /** "OWNER" | "EDITOR" | "VIEWER" inside a project; "OWNER" | "MEMBER" in the projects list. */
  role?: string;
  currentUserId?: string;
  /** Set on the projects list for projects shared with you. */
  ownerName?: string | null;
}

export interface Person {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export type DateValue = string | Date | null;

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface Sprint {
  id: string;
  name: string;
  startDate?: DateValue;
  endDate?: DateValue;
  status: SprintStatus;
  /** How many points (or items) the team can take on; optional. */
  capacity?: number | null;
  userId: string;
  projectId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BoardConfig {
  showOnKanban?: boolean;
  showOnGantt?: boolean;
  isSprintEligible?: boolean;
  preferredView?: string;
  sprintBoardLayer?: number | null;
}

export interface FieldDefinition {
  id: string;
  nodeTypeId: string;
  name: string;
  type: string;
  required?: boolean;
  options?: string[] | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface NodeType {
  id: string;
  name: string;
  userId: string;
  projectId: string;
  color?: string | null;
  icon?: string | null;
  isSprintEligible: boolean;
  fields?: FieldDefinition[];
  boardConfig?: BoardConfig | null;
  allowedChildren?: { childNodeTypeType: NodeType; childNodeTypeId: string }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Node {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  content: Record<string, unknown> | null;
  nodeTypeId: string;
  type: NodeType;
  sprintId?: string | null;
  assigneeId?: string | null;
  assignee?: Person | null;
  position?: number;
  completedAt?: string | Date | null;
  _count?: { comments: number };
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  isArchived?: boolean;
  childLinks?: { id: string; childNode: Node }[];
  blockedBy?: { id: string; blockingNode: Node }[];
  parentLinks?: { id: string; parentNode: Node }[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface AllowedRelation {
  id: string;
  parentNodeTypeId: string;
  childNodeTypeId: string;
  parentNodeType: NodeType;
  childNodeTypeType: NodeType;
}

export interface AuditLogEvent {
  id: string;
  action: string;
  entityType: string;
  nodeId?: string | null;
  entityName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  userId: string;
  projectId: string;
  createdAt: string | Date;
  user: {
    name?: string | null;
    image?: string | null;
  };
}
