"use client";

import React, { useRef, useState } from "react";
import { compact, niceScale } from "@/lib/chartScale";
import type { BurndownPoint, VelocityPoint } from "@/lib/planning";

const W = 640;
const H = 280;
const PAD = { top: 16, right: 24, bottom: 32, left: 40 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const shortDay = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

function Legend({ items }: Readonly<{ items: { label: string; color: string; line?: boolean }[] }>) {
  return (
    <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className={i.line ? "h-0.5 w-4 rounded" : "h-2.5 w-2.5 rounded-sm"} style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function Axes({ ticks, max, unit }: Readonly<{ ticks: number[]; max: number; unit: string }>) {
  return (
    <g>
      {ticks.map((t) => {
        const y = PAD.top + PLOT_H - (t / max) * PLOT_H;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border)" strokeWidth={1} />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--faint)">{compact(t)}</text>
          </g>
        );
      })}
      <text x={PAD.left} y={10} fontSize={11} fill="var(--faint)">{unit}</text>
    </g>
  );
}

/** Remaining work per day: the plan (straight line) against what actually happened. */
export function BurndownChart({ points, unit }: Readonly<{ points: BurndownPoint[]; unit: string }>) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const total = points[0]?.ideal ?? 0;
  const { max, ticks } = niceScale(total);
  const n = points.length;
  const x = (i: number) => PAD.left + (n === 1 ? PLOT_W / 2 : (i / (n - 1)) * PLOT_W);
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;

  const known = points.map((p, i) => ({ p, i })).filter((d) => d.p.actual !== null);
  const actualPath = known.map((d, k) => `${k === 0 ? "M" : "L"}${x(d.i)},${y(d.p.actual as number)}`).join(" ");
  const areaPath = known.length > 0 ? `${actualPath} L${x(known[known.length - 1].i)},${y(0)} L${x(known[0].i)},${y(0)} Z` : "";
  const idealPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.ideal)}`).join(" ");
  const last = known[known.length - 1];
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.round(((px - PAD.left) / PLOT_W) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, idx)));
  };
  const active = hover !== null ? points[hover] : null;

  return (
    <figure className="m-0">
      <Legend items={[{ label: "Remaining", color: "var(--series-1)", line: true }, { label: "Ideal pace", color: "var(--faint)", line: true }]} />
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Burndown chart: remaining ${unit} per day against the ideal pace`} className="block h-auto w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <Axes ticks={ticks} max={max} unit={unit} />
          {points.map((p, i) => i % labelEvery === 0 && (
            <text key={p.day} x={x(i)} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--faint)">{shortDay(p.day)}</text>
          ))}
          {areaPath && <path d={areaPath} fill="var(--series-1)" opacity={0.1} />}
          <path d={idealPath} fill="none" stroke="var(--faint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {actualPath && <path d={actualPath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
          {last && <circle cx={x(last.i)} cy={y(last.p.actual as number)} r={4} fill="var(--series-1)" stroke="var(--panel)" strokeWidth={2} />}
          {hover !== null && active && (
            <g pointerEvents="none">
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + PLOT_H} stroke="var(--border-strong)" strokeWidth={1} />
              <circle cx={x(hover)} cy={y(active.ideal)} r={4} fill="var(--faint)" stroke="var(--panel)" strokeWidth={2} />
              {active.actual !== null && <circle cx={x(hover)} cy={y(active.actual)} r={4} fill="var(--series-1)" stroke="var(--panel)" strokeWidth={2} />}
            </g>
          )}
        </svg>
        {active && hover !== null && (
          <div role="status" className="pointer-events-none absolute top-2 rounded-md border border-border bg-panel px-2.5 py-1.5 text-xs shadow-md" style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > n / 2 ? "translateX(calc(-100% - 10px))" : "translateX(10px)" }}>
            <p className="font-medium">{shortDay(active.day)}</p>
            <p className="text-muted">Remaining: <span className="tabular-nums text-fg">{active.actual === null ? "—" : compact(active.actual)}</span></p>
            <p className="text-muted">Ideal: <span className="tabular-nums text-fg">{compact(Math.round(active.ideal * 10) / 10)}</span></p>
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">View as table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead><tr><th className="py-1 font-medium">Day</th><th className="font-medium">Remaining</th><th className="font-medium">Ideal</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.day} className="border-t border-border"><td className="py-1">{shortDay(p.day)}</td><td>{p.actual === null ? "—" : compact(p.actual)}</td><td>{compact(Math.round(p.ideal * 10) / 10)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

const BAR_MAX = 24;

/** Committed vs. completed work per sprint. */
export function VelocityChart({ points, unit }: Readonly<{ points: VelocityPoint[]; unit: string }>) {
  const [hover, setHover] = useState<number | null>(null);
  const { max, ticks } = niceScale(Math.max(1, ...points.flatMap((p) => [p.committed, p.completed])));
  const band = PLOT_W / Math.max(1, points.length);
  const y = (v: number) => PAD.top + PLOT_H - (v / max) * PLOT_H;
  const barW = Math.min(BAR_MAX, (band - 24) / 2 - 1);

  // Rounded at the top, square on the baseline.
  const bar = (cx: number, value: number) => {
    if (value <= 0) return "";
    const top = y(value);
    const r = Math.min(4, barW / 2, PAD.top + PLOT_H - top);
    const left = cx;
    const right = cx + barW;
    const base = PAD.top + PLOT_H;
    return `M${left},${base} V${top + r} Q${left},${top} ${left + r},${top} H${right - r} Q${right},${top} ${right},${top + r} V${base} Z`;
  };

  return (
    <figure className="m-0">
      <Legend items={[{ label: "Committed", color: "var(--series-2)" }, { label: "Completed", color: "var(--series-1)" }]} />
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Velocity chart: committed and completed ${unit} per sprint`} className="block h-auto w-full" onMouseLeave={() => setHover(null)}>
          <Axes ticks={ticks} max={max} unit={unit} />
          {points.map((p, i) => {
            const center = PAD.left + band * i + band / 2;
            return (
              <g key={p.sprintId} onMouseEnter={() => setHover(i)} data-testid="velocity-group">
                <rect x={center - band / 2} y={PAD.top} width={band} height={PLOT_H} fill="transparent" />
                <path d={bar(center - barW - 1, p.committed)} fill="var(--series-2)" />
                <path d={bar(center + 1, p.completed)} fill="var(--series-1)" />
                {p.completed > 0 && <text x={center + 1 + barW / 2} y={y(p.completed) - 5} textAnchor="middle" fontSize={11} fill="var(--fg)" className="tabular-nums">{compact(p.completed)}</text>}
                <text x={center} y={H - 10} textAnchor="middle" fontSize={11} fill="var(--faint)">{p.name.length > 16 ? `${p.name.slice(0, 15)}…` : p.name}</text>
              </g>
            );
          })}
        </svg>
        {hover !== null && points[hover] && (
          <div role="status" className="pointer-events-none absolute top-2 rounded-md border border-border bg-panel px-2.5 py-1.5 text-xs shadow-md" style={{ left: `${((PAD.left + band * hover + band / 2) / W) * 100}%`, transform: hover >= points.length / 2 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}>
            <p className="font-medium">{points[hover].name}</p>
            <p className="text-muted">Committed: <span className="tabular-nums text-fg">{compact(points[hover].committed)}</span></p>
            <p className="text-muted">Completed: <span className="tabular-nums text-fg">{compact(points[hover].completed)}</span></p>
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer">View as table</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead><tr><th className="py-1 font-medium">Sprint</th><th className="font-medium">Committed</th><th className="font-medium">Completed</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.sprintId} className="border-t border-border"><td className="py-1">{p.name}</td><td>{compact(p.committed)}</td><td>{compact(p.completed)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
