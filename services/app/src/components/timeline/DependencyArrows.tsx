"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DependencyEdge } from "@/lib/timeline";

interface Path { key: string; d: string; conflict: boolean }

/**
 * Arrows from the end of a blocking item to the start of the item that waits for it. They are drawn from the bars
 * actually on screen (data-gantt-node), so they follow drags, resizing, scrolling and row changes without the
 * chart having to know about them. Red = the waiting item is scheduled too early.
 */
export function DependencyArrows({ edges, containerRef }: Readonly<{ edges: DependencyEdge[]; containerRef: React.RefObject<HTMLDivElement | null> }>) {
  const [paths, setPaths] = useState<Path[]>([]);
  const frame = useRef(0);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const box = container.getBoundingClientRect();
    const rectOf = (id: string) => {
      const el = container.querySelector<HTMLElement>(`[data-gantt-node="${CSS.escape(id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left - box.left, right: r.right - box.left, mid: r.top - box.top + r.height / 2 };
    };
    const next: Path[] = [];
    for (const edge of edges) {
      const a = rectOf(edge.from);
      const b = rectOf(edge.to);
      if (!a || !b) continue;
      const x1 = a.right, y1 = a.mid, x2 = b.left, y2 = b.mid;
      let d: string;
      if (x2 >= x1 + 24) {
        d = `M${x1},${y1} C${x1 + 28},${y1} ${x2 - 28},${y2} ${x2},${y2}`;
      } else {
        const ym = Math.abs(y2 - y1) < 6 ? y1 + 22 : (y1 + y2) / 2;
        d = `M${x1},${y1} H${x1 + 10} V${ym} H${x2 - 10} V${y2} H${x2}`;
      }
      next.push({ key: `${edge.from}>${edge.to}`, d, conflict: edge.conflict });
    }
    setPaths((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [edges, containerRef]);

  const schedule = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  }, [measure]);

  useLayoutEffect(() => { measure(); }, [measure]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resize = new ResizeObserver(schedule);
    resize.observe(container);
    const mutate = new MutationObserver(schedule);
    mutate.observe(container, { attributes: true, subtree: true, childList: true, attributeFilter: ["style", "class"] });
    container.addEventListener("transitionend", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame.current);
      resize.disconnect();
      mutate.disconnect();
      container.removeEventListener("transitionend", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [containerRef, schedule]);

  if (paths.length === 0) return null;
  return (
    <svg className="gantt-dependencies" aria-hidden="true" data-testid="dependency-arrows">
      <defs>
        <marker id="gantt-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--muted)" />
        </marker>
        <marker id="gantt-arrow-conflict" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L8,4 L0,8 z" fill="var(--danger)" />
        </marker>
      </defs>
      {paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          data-edge={p.key}
          data-conflict={p.conflict ? "true" : "false"}
          fill="none"
          stroke={p.conflict ? "var(--danger)" : "var(--muted)"}
          strokeWidth={p.conflict ? 2 : 1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd={`url(#${p.conflict ? "gantt-arrow-conflict" : "gantt-arrow"})`}
          opacity={p.conflict ? 0.95 : 0.7}
        />
      ))}
    </svg>
  );
}
