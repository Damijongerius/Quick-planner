"use client";

import { createContext, useContext } from "react";

/** A sibling list that can be reordered by dragging. Each list (the root, or one parent's children) registers itself. */
export interface ReorderList {
  /** The ids exactly as shown right now. */
  ids: () => string[];
  /** Show a new order immediately (the server write follows). */
  apply: (orderedIds: string[]) => void;
}

export interface ReorderRegistry {
  register: (listId: string, list: ReorderList) => () => void;
}

export const ReorderContext = createContext<ReorderRegistry | null>(null);
export const useReorderRegistry = () => useContext(ReorderContext);
