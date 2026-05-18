"use client";
import "./Timeline.css";
import "./ui/Avatar.css";

import React from "react";
import { User, ArrowRight, Clock } from "lucide-react";

import { AuditLogEvent } from "@/lib/types";

interface AuditTrailProps {
  history: AuditLogEvent[];
}

export function AuditTrail({ history }: Readonly<AuditTrailProps>) {
  const getEventLabel = (event: AuditLogEvent) => {
    if (event.action === 'UPDATE') return 'Title/Desc/Timeline updated';
    if (event.action === 'MOVE') return 'Sprint changed';
    return event.action;
  };

  return (
    <div className="flex flex-col gap-lg">
      <h3 className="text-editorial" style={{ fontSize: '20px', fontWeight: 800 }}>Audit Trail</h3>
      {history.map((event) => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="flex items-center gap-sm" style={{ marginBottom: '4px' }}>
              <span className="timeline-event-action">{event.action}</span>
              <span className="timeline-event-date" suppressHydrationWarning>{new Date(event.createdAt).toLocaleString()}</span>
            </div>
            <p className="timeline-event-title">
              {getEventLabel(event)}
            </p>
            {event.oldValue && event.newValue && (
              <div className="timeline-event-diff">
                <span className="diff-old">{event.oldValue}</span>
                <ArrowRight size={10} />
                <span className="diff-new">{event.newValue}</span>
              </div>
            )}
            <div className="flex items-center gap-sm" style={{ marginTop: '8px' }}>
              <div className="timeline-avatar">
                <User size={12} />
              </div>
              <span className="timeline-user-name">{event.user.name}</span>
            </div>
          </div>
        </div>
      ))}
      {history.length === 0 && (
        <div className="timeline-empty">
          <Clock size={32} className="timeline-empty-icon" />
          <p className="timeline-empty-text">No events recorded for this node yet.</p>
        </div>
      )}
    </div>
  );
}
