"use client";
import "./Timeline.css";
import "./ui/Avatar.css";

import React from "react";
import { User, ArrowRight, Clock } from "lucide-react";

interface AuditEvent {
  id: string;
  action: string;
  createdAt: string | Date;
  oldValue: string | null;
  newValue: string | null;
  user: {
    name: string | null;
  };
}

interface AuditTrailProps {
  history: AuditEvent[];
}

export function AuditTrail({ history }: AuditTrailProps) {
  return (
    <div className="flex flex-col gap-lg">
      <h3 className="text-editorial" style={{ fontSize: '20px', fontWeight: 800 }}>Audit Trail</h3>
      {history.map((event) => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="flex items-center gap-sm" style={{ marginBottom: '4px' }}>
              <span className="timeline-event-action">{event.action}</span>
              <span className="timeline-event-date">{new Date(event.createdAt).toLocaleString()}</span>
            </div>
            <p className="timeline-event-title">
              {event.action === 'UPDATE' ? 'Title/Desc/Timeline updated' : (event.action === 'MOVE' ? 'Sprint changed' : event.action)}
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
