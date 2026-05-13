export interface Project {
  id: string;
  name: string;
  userId: string;
  isArchived: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Sprint {
  id: string;
  name: string;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | string;
  userId: string;
  projectId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface FieldDefinition {
  id: string;
  nodeTypeId: string;
  name: string;
  type: string;
  required?: boolean;
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
  boardConfig?: any;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AllowedRelation {
  id: string;
  parentNodeTypeId: string;
  childNodeTypeId: string;
  parentNodeType: NodeType;
  childNodeTypeType: NodeType;
}
