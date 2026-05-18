"use client";

import React from 'react';

export function GanttGridHeader({ days }: Readonly<{ days: Date[] }>) {
  return (
    <div className="gantt-grid-header">
      <div className="gantt-label-col text-meta">Strategic Phases</div>
      <div className="flex flex-1">
        {days.map((day) => {
          const isFirstOfMonth = day.getDate() === 1;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div key={day.toISOString()} className={`gantt-day-col ${isWeekend ? 'weekend' : ''}`}>
              {isFirstOfMonth && (
                <div className="gantt-month-label">
                  {day.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                </div>
              )}
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
