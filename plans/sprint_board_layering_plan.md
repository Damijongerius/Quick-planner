# Proposed Plan: Sprint Board Layering

This plan details the design and implementation for reworking the Sprint Kanban Board to display and organize tasks in hierarchical **Layers** (e.g., Portfolio, Row Headers, Grid Cards), rather than a mixed flat view.

---

## User Review Required

> [!IMPORTANT]
> - **Configuration Approach**: We will add a `sprintBoardLayer` property inside the existing `boardConfig` JSON field on the `NodeType` model. This avoids schema migrations and ensures full flexibility.
> - **Visual Relationships**: Instead of showing connecting lines on the sprint board, nodes are visually grouped into horizontal swimlanes. The swimlanes represent parent nodes (e.g., Stories), and columns represent their states, housing the child nodes (e.g., Tasks).
> - **Drag-and-Drop Parenting**: Dragging a card to a different swimlane's column will automatically update its parent association to that swimlane's row node. Dragging it to the "Unparented" swimlane will remove its parent.

---

## Proposed System Architecture

### 1. Layers Model Definition

We will classify node types into three sprint board layers in their settings:
- **Layer 0 (Portfolio Level)**: e.g., Epics, Features
- **Layer 1 (Row/Swimlane Headers)**: e.g., User Stories, Research Stories, Enabler Stories, Bugs
- **Layer 2 (Grid Cards)**: e.g., Tasks, Learning Tasks, Bugs, Subtasks
- **None**: Excluded from the Kanban view

### 2. Kanban Board Swimlanes

```
+---------------------------------------------------------------------------------------+
|  Board Level Selector: [ Stories & Tasks v ]                                          |
+---------------------------------------------------------------------------------------+
|  STORY 1: User Login Flow (Progress: 50%)                                             |
|  +--------------------+--------------------+--------------------+-------------------+ |
|  | TO DO (1)          | IN PROGRESS (1)    | REVIEW (0)         | DONE (1)          | |
|  | +----------------+ | +----------------+ |                    | +---------------+ | |
|  | | Task: Design   | | | Task: Code     | |                    | | Task: Spec    | | |
|  | +----------------+ | +----------------+ |                    | +---------------+ | |
|  +--------------------+--------------------+--------------------+-------------------+ |
+---------------------------------------------------------------------------------------+
|  UNPARENTED ITEMS                                                                     |
|  +--------------------+--------------------+--------------------+-------------------+ |
|  | TO DO (0)          | IN PROGRESS (0)    | REVIEW (0)         | DONE (1)          | |
|  |                    |                    |                    | +---------------+ | |
|  |                    |                    |                    | | Task: Misc    | | |
|  |                    |                    |                    | +---------------+ | |
|  +--------------------+--------------------+--------------------+-------------------+ |
+---------------------------------------------------------------------------------------+
```

---

## Proposed Changes

### Database & Types Layer

#### [MODIFY] [types.ts](file:///Users/djongerius/developer/quick-planner/Quick-planner/services/app/src/lib/types.ts)
- Extend the `BoardConfig` interface:
  ```typescript
  export interface BoardConfig {
    showOnKanban?: boolean;
    showOnGantt?: boolean;
    isSprintEligible?: boolean;
    preferredView?: string;
    sprintBoardLayer?: number | null; // 0 = Epic, 1 = Story, 2 = Task, null = None
  }
  ```

---

### Server Actions Layer

#### [MODIFY] [nodes.ts](file:///Users/djongerius/developer/quick-planner/Quick-planner/services/app/src/lib/actions/nodes.ts)
- Implement `updateNodeParent` to reassociate nodes during drag-and-drop:
  ```typescript
  export async function updateNodeParent(projectId: string, nodeId: string, newParentNodeId: string | null) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    await ensureProjectNotArchived(projectId);
    
    // Delete existing links for this child
    await prisma.nodeLink.deleteMany({
      where: { childNodeId: nodeId, parentNode: { projectId } }
    });
    
    // Create new link if parent is specified
    if (newParentNodeId) {
      await prisma.nodeLink.create({
        data: { parentNodeId: newParentNodeId, childNodeId: nodeId }
      });
      await logHistoryEvent({ 
        projectId, 
        nodeId, 
        action: 'UPDATE', 
        entityType: 'NODE', 
        entityName: `Re-parented to ${newParentNodeId}` 
      });
    }
    
    revalidatePath(`/project/${projectId}/board`);
  }
  ```

---

### Configuration Interface Layer

#### [MODIFY] [BoardConfigEditor.tsx](file:///Users/djongerius/developer/quick-planner/Quick-planner/services/app/src/components/BoardConfigEditor.tsx)
- Add a new input field **Sprint Board Layer Role** inside the Governance Logic modal.
- Let users specify if a blueprint type should act as a:
  - `None` (Standard flat view)
  - `Layer 0: Portfolio (Epic/Feature)`
  - `Layer 1: Swimlane Row (Story/Bug)`
  - `Layer 2: Draggable Card (Task/Subtask)`

---

### Kanban Board View Layer

#### [MODIFY] [BoardView.tsx](file:///Users/djongerius/developer/quick-planner/Quick-planner/services/app/src/components/BoardView.tsx)
- Add state for the currently active `boardLevelView` (`"flat" | "stories-tasks" | "epics-stories"`).
- Render a drop-down selector next to view toggles to change the active board level.
- Filter and divide the flat `nodes` array into matching Row Nodes and Card Nodes based on the active level selection.

#### [MODIFY] [KanbanBoard.tsx](file:///Users/djongerius/developer/quick-planner/Quick-planner/services/app/src/components/KanbanBoard.tsx)
- Restructure the UI to render horizontal swimlane rows if a layered view is selected.
- Generate unique `droppableId` for columns using format: `${status}:${parentId}`.
- Update `handleDragEnd` to extract both `status` and `parentId`, calling `updateNodeParent` if the swimlane changes, and `updateNodeStatus` if the column status changes.

---

## Verification Plan

### Automated Tests
- Build and verify typescript check with `npm run build`.

### Manual Verification
1. Open the project settings and configure blueprints:
   - Mark **Story** and **Bug** as `Layer 1: Swimlane Row`.
   - Mark **Task** as `Layer 2: Draggable Card`.
2. Go to the Sprint Board. Select "Stories & Tasks" level.
3. Verify that Stories show up as row headers, and Tasks show up inside columns under their respective Stories.
4. Drag a Task from "Story A / To Do" to "Story B / In Progress". Verify that the Task changes its parent link and status correctly.
5. Verify that "Unparented Tasks" are collected into a separate section.
