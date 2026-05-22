# Plan: Interactive & Nested Gantt Chart

This plan details the design and implementation of an interactive Gantt chart. Users can drag to move items, drag edges to resize durations (with grid snapping), and switch between a "Rows" view and a "Nested Track" view (where child cards live directly inside the parent bar's row track).

## Proposed Changes

### UI & Layout Layer

#### 1. Gantt Layout Selector
- Add a segmented switcher inside `GanttChart` header: **Rows View** vs **Nested View**.
- Pass the layout mode down to `GanttNodeSection`.

#### 2. Nested Tracks Layout (`GanttNodeSection.tsx` & `Gantt.css`)
- Under **Nested View**:
  - Render only 1 row for each parent node.
  - Expand the row height to $76\text{px}$.
  - Place parent bar at the top half and render child bars absolutely positioned at the bottom half of the single row track.
  - This keeps the screen incredibly clean and visually groups child tasks inside their stories on the timeline.
- Under **Rows View**:
  - Each item (parent or child) gets its own $48\text{px}$ track.

#### 3. Interactive Dragging & Resizing (`GanttNodeSection.tsx` & `Gantt.css`)
- Implement `onMouseDown` handlers on each Gantt bar to track movements:
  - Hovering over left/right edges reveals grab handles (`cursor: w-resize` / `cursor: e-resize`).
  - Dragging the handles resizes the item duration.
  - Dragging the center moves/shifts the entire item chronologically.
  - Movement snaps dynamically to the $40\text{px}$ day grid.
- On mouse release (`mouseup`), invoke the server action `updateNode(projectId, nodeId, { startDate, endDate })` to persist the timeline changes instantly.
- Show instant optimistic UI visual feedback while dragging/resizing so the app feels lightning fast.
