import { useState, useEffect, useRef } from "react";
import { getNodeChildren } from "@/lib/actions";
import { Node } from "@/lib/types";

export function useBacklogTreeNode(
  node: Node, 
  projectId: string, 
  showArchived: boolean, 
  depth: number, 
  syncStamp: number | undefined, 
  onNodeUpdated?: () => void
) {
  const initialChildren = (node.childLinks?.map((l) => l.childNode) || [])
    .filter((c) => c.isArchived === showArchived)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const [isOpen, setIsOpen] = useState(depth < 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [children, setChildren] = useState<Node[]>(initialChildren);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prevNodeId, setPrevNodeId] = useState(node.id);
  const [prevChildLinks, setPrevChildLinks] = useState(node.childLinks);

  if (node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setChildren(initialChildren);
  } else if (node.childLinks !== prevChildLinks) {
    setPrevChildLinks(node.childLinks);
    setChildren(initialChildren);
  }

  const prevSyncStamp = useRef(syncStamp);
  useEffect(() => {
    if (syncStamp !== prevSyncStamp.current) {
      prevSyncStamp.current = syncStamp;
      if (isOpen && depth > 0) {
        loadChildren();
      }
    }
  }, [syncStamp, isOpen, depth]);

  async function handleLocalNodeUpdate() {
    await loadChildren();
    if (onNodeUpdated) {
      onNodeUpdated();
    }
  }

  async function loadChildren() {
    setIsLoadingChildren(true);
    try {
      const rawChildren = await getNodeChildren(projectId, node.id);
      const filtered = rawChildren.filter(c => c.isArchived === showArchived);
      const sorted = [...filtered].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setChildren(sorted);
    }
    finally { setIsLoadingChildren(false); }
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      if (children.length === 0) {
        loadChildren();
      }
    }
  }

  const progress = calculateNodeProgress(node.status, children, initialChildren);

  return {
    isOpen,
    isTransitioning, setIsTransitioning,
    children,
    isLoadingChildren,
    isHovered, setIsHovered,
    progress,
    initialChildren,
    handleLocalNodeUpdate,
    loadChildren,
    handleToggle
  };
}

export function calculateNodeProgress(status: string, children: Node[], initialChildren: Node[]): number {
  const target = children.length > 0 ? children : initialChildren;
  if (target.length === 0) {
    return status === 'DONE' ? 100 : 0;
  }
  
  const totalProgress = target.reduce((acc: number, c: Node) => {
    let nodeProgress = 0;
    if (c.status === 'DONE') {
      nodeProgress = 100;
    } else if (c.status === 'IN_PROGRESS') {
      nodeProgress = 50;
    }
    return acc + nodeProgress;
  }, 0);

  return Math.round(totalProgress / target.length);
}
