import { DropResult, DraggableLocation } from "@hello-pangea/dnd";
import { Node } from "@/lib/types";
import { updateNodeStatus } from "@/lib/actions";

export interface DragEndParams {
  projectId: string;
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
  initialNodes: Node[];
  allNodes: Node[];
  isLayered: boolean;
  onRefresh: () => void;
}

export function isInvalidDrop(destination: DraggableLocation | null | undefined, source: DraggableLocation) {
  if (!destination) return true;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return true;
  return false;
}

export async function handleDragEnd(result: DropResult, params: DragEndParams) {
  const { projectId, nodes, setNodes, initialNodes, allNodes, isLayered, onRefresh } = params;
  const { destination, source, draggableId } = result;

  if (isInvalidDrop(destination, source)) return;

  let destStatus = destination!.droppableId;
  let destParentId: string | null = null;
  let sourceStatus = source.droppableId;
  let sourceParentId: string | null = null;

  if (isLayered) {
    const [dStatus, dParent] = destination!.droppableId.split(':');
    destStatus = dStatus;
    destParentId = dParent === 'unparented' ? null : dParent;

    const [sStatus, sParent] = source.droppableId.split(':');
    sourceStatus = sStatus;
    sourceParentId = sParent === 'unparented' ? null : sParent;
  }

  // Optimistic local state update
  const updatedNodes = [...nodes];
  const nodeIndex = updatedNodes.findIndex((n) => n.id === draggableId);
  if (nodeIndex !== -1) {
    const oldNode = updatedNodes[nodeIndex];
    let newParentLinks = oldNode.parentLinks || [];
    if (isLayered && destParentId !== sourceParentId) {
      if (destParentId) {
        const parentNode = allNodes.find(n => n.id === destParentId);
        if (parentNode) {
          newParentLinks = [{
            id: 'temp-link-id',
            parentNode
          }];
        }
      } else {
        newParentLinks = [];
      }
    }
    updatedNodes[nodeIndex] = { 
      ...oldNode, 
      status: destStatus,
      parentLinks: newParentLinks
    };
    setNodes(updatedNodes);
  }

  // Persistence updates
  try {
    const promises = [];
    if (destStatus !== sourceStatus) {
      promises.push(updateNodeStatus(projectId, draggableId, destStatus));
    }
    if (isLayered && destParentId !== sourceParentId) {
      const { updateNodeParent } = await import("@/lib/actions");
      promises.push(updateNodeParent(projectId, draggableId, destParentId));
    }
    await Promise.all(promises);
    onRefresh();
  } catch (error) {
    console.error("Drag persistence failed", error);
    setNodes(initialNodes);
  }
}
