"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { addComment, deleteComment, getComments, getHistoryForNode } from "@/lib/actions";
import { mergeActivity } from "@/lib/activity";
import { convertMentions, splitBody } from "@/lib/mentions";
import { useRealtime } from "./realtime/RealtimeProvider";
import { useProject } from "./ProjectContext";
import { MentionTextarea } from "./MentionTextarea";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import type { ActivityEntry } from "@/lib/activity";

const POLL_MS = 15_000;
type Filter = "all" | "comments" | "changes";

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CommentBody({ body }: Readonly<{ body: string }>) {
  return (
    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-fg">
      {splitBody(body).map((part, i) => part.type === "text"
        ? <React.Fragment key={i}>{part.text}</React.Fragment>
        : <span key={i} className="rounded bg-accent-soft px-1 font-medium text-accent">@{part.name}</span>)}
    </p>
  );
}

interface ActivityTabProps {
  readonly projectId: string;
  readonly nodeId: string;
  readonly canComment: boolean;
  readonly onCountChange?: (count: number) => void;
}

/** Everything that happened to an item, comments and changes together, with a box to add a comment. */
export function ActivityTab({ projectId, nodeId, canComment, onCountChange }: ActivityTabProps) {
  const { members } = useProject();
  const { subscribe } = useRealtime();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const load = useCallback(async () => {
    const [comments, history] = await Promise.all([getComments(projectId, nodeId), getHistoryForNode(projectId, nodeId)]);
    setEntries(mergeActivity(comments, history as unknown as Parameters<typeof mergeActivity>[1]));
    setLoaded(true);
    onCountChange?.(comments.length);
  }, [projectId, nodeId, onCountChange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Teammates' comments and changes show up immediately.
  useEffect(() => subscribe((event) => {
    if (event.nodeId === nodeId || event.resync) void load();
  }), [subscribe, nodeId, load]);

  const shown = useMemo(() => entries.filter((e) => filter === "all" || (filter === "comments" ? e.kind === "comment" : e.kind === "event")), [entries, filter]);

  useEffect(() => {
    if (shown.length > lastCount.current) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    lastCount.current = shown.length;
  }, [shown.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError("");
    const body = convertMentions(draft, members.map((m) => ({ id: m.id, name: m.name || m.email || "" })));
    const result = await addComment(projectId, nodeId, body);
    setSending(false);
    if (result.error) { setError(result.error); return; }
    setDraft("");
    await load();
  };

  const remove = async (entryId: string) => {
    if (!confirm("Delete this comment?")) return;
    const result = await deleteComment(projectId, entryId.replace(/^c-/, ""));
    if (result.error) setError(result.error);
    await load();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1" role="group" aria-label="Filter activity">
        {([["all", "All"], ["comments", "Comments"], ["changes", "Changes"]] as const).map(([value, label]) => (
          <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${filter === value ? "bg-accent-soft text-accent" : "text-muted hover:bg-hover hover:text-fg"}`}>
            {label}
          </button>
        ))}
      </div>

      {loaded && shown.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-faint"><MessageSquare size={18} /></div>
          <p className="text-sm text-muted">{filter === "changes" ? "No changes recorded yet." : "No comments yet. Start the conversation."}</p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {shown.map((e) => e.kind === "comment" ? (
          <li key={e.id} className="group flex gap-2.5">
            <Avatar src={e.user.image} name={e.user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 text-sm">
                <span className="font-medium">{e.user.name}</span>
                <time className="text-xs text-faint" suppressHydrationWarning title={new Date(e.at).toLocaleString()}>{timeAgo(e.at)}</time>
                {e.canDelete && (
                  <button onClick={() => remove(e.id)} className="ml-auto text-faint opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100" aria-label="Delete comment"><Trash2 size={13} /></button>
                )}
              </p>
              <CommentBody body={e.body} />
            </div>
          </li>
        ) : (
          <li key={e.id} className="flex items-center gap-2 pl-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-border-strong" aria-hidden />
            <span className="min-w-0"><span className="font-medium text-fg">{e.user.name ?? "Someone"}</span> {e.text} <time className="text-faint" suppressHydrationWarning title={new Date(e.at).toLocaleString()}>· {timeAgo(e.at)}</time></span>
          </li>
        ))}
      </ul>
      <div ref={endRef} />

      {canComment ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="new-comment" className="sr-only">Write a comment</label>
          <MentionTextarea id="new-comment" value={draft} onChange={setDraft} members={members} onSubmit={send} maxLength={4000} placeholder="Write a comment…  Use @ to mention someone, Ctrl+Enter to send" />
          {error && <p className="text-xs text-danger" role="alert">{error}</p>}
          <div className="flex justify-end">
            <Button size="sm" onClick={send} loading={sending} disabled={!draft.trim()} icon={<Send size={13} />}>Comment</Button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-faint">Comments are closed on archived projects.</p>
      )}
    </div>
  );
}
