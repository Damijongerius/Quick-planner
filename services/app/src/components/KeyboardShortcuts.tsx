"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./ui/Modal";
import { SEQUENCE_TIMEOUT_MS, SHORTCUT_HELP, goPathFor, isTypingElement } from "@/lib/shortcuts";

export const OPEN_HELP_EVENT = "qp:help";
export const SPRINT_NAV_EVENT = "qp:sprint-nav";

/** Global keyboard shortcuts for a project: g-then-letter navigation, "/" to search, "c" to create, "?" for help. */
export function KeyboardShortcuts({ projectId }: Readonly<{ projectId: string }>) {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingG = useRef(0);

  const focusFirst = useCallback((selector: string) => {
    const el = [...document.querySelectorAll<HTMLElement>(selector)].find((e) => e.offsetParent !== null);
    if (!el) return false;
    el.focus();
    if (el instanceof HTMLInputElement) el.select();
    return true;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingElement(e.target as HTMLElement | null)) return;
      const key = e.key;

      if (pendingG.current && Date.now() - pendingG.current < SEQUENCE_TIMEOUT_MS) {
        pendingG.current = 0;
        const path = goPathFor(key);
        if (path) { e.preventDefault(); router.push(`/project/${projectId}/${path}`); return; }
      }
      pendingG.current = 0;

      if (key === "g") { pendingG.current = Date.now(); return; }
      if (key === "?") { e.preventDefault(); setHelpOpen(true); return; }
      if (key === "/") { if (focusFirst("[data-shortcut-search]")) e.preventDefault(); return; }
      if (key === "c") {
        const button = [...document.querySelectorAll<HTMLElement>("[data-shortcut-create]")].find((b) => b.offsetParent !== null);
        if (button) { e.preventDefault(); button.click(); }
        return;
      }
      if (key === "[" || key === "]") window.dispatchEvent(new CustomEvent(SPRINT_NAV_EVENT, { detail: key === "]" ? 1 : -1 }));
    };
    const onHelp = () => setHelpOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_HELP_EVENT, onHelp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_HELP_EVENT, onHelp);
    };
  }, [router, projectId, focusFirst]);

  return (
    <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title="Keyboard shortcuts" subtitle="Press ? any time to see this list." maxWidth="460px">
      <dl className="grid gap-y-1.5 pt-1">
        {SHORTCUT_HELP.map((h) => (
          <div key={h.label} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-muted">{h.label}</dt>
            <dd className="flex shrink-0 items-center gap-1">
              {h.keys.map((k, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs text-faint">then</span>}
                  <kbd className="min-w-[1.5rem] rounded-md border border-border-strong bg-hover px-1.5 py-0.5 text-center font-mono text-xs">{k}</kbd>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
