"use client";

import React from 'react';

export function GanttGridHeader({ 
  days, 
  weeks, 
  viewScale,
  onHover,
  onMouseMove
}: Readonly<{ 
  days: Date[]; 
  weeks: Date[]; 
  viewScale: "days" | "weeks";
  onHover: (e: React.MouseEvent | null, content: { title: string; subtitle?: string; badge?: string } | null) => void;
  onMouseMove: (e: React.MouseEvent) => void;
}>) {
  const items = viewScale === "days" ? days : weeks;
  return (
    <div className="gantt-grid-header">
      <div className="flex flex-1">
        {items.map((item, index) => {
          if (viewScale === "days") {
            const isFirstCol = index === 0;
            const isFirstOfMonth = item.getDate() === 1;
            const showMonthLabel = isFirstCol || isFirstOfMonth;
            const isWeekend = item.getDay() === 0 || item.getDay() === 6;
            return (
              <div 
                key={item.toISOString()} 
                className={`gantt-day-col cursor-help ${isWeekend ? 'weekend' : ''}`} 
                style={{ width: '40px' }}
                onMouseEnter={(e) => onHover(e, {
                  title: item.toLocaleDateString(undefined, { dateStyle: 'full' }),
                  badge: "Day View"
                })}
                onMouseMove={onMouseMove}
                onMouseLeave={() => onHover(null, null)}
              >
                {showMonthLabel && (
                  <div className="gantt-month-label">
                    {item.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                )}
                {item.getDate()}
              </div>
            );
          } else {
            const isFirstCol = index === 0;
            const isFirstOfMonth = item.getDate() <= 7;
            const showMonthLabel = isFirstCol || isFirstOfMonth;
            const weekEnd = new Date(item);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const rangeStr = `${item.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            return (
              <div 
                key={item.toISOString()} 
                className="gantt-week-col cursor-help" 
                style={{ width: '140px' }}
                onMouseEnter={(e) => onHover(e, {
                  title: `Week of ${item.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                  subtitle: rangeStr,
                  badge: `Week ${index + 1}`
                })}
                onMouseMove={onMouseMove}
                onMouseLeave={() => onHover(null, null)}
              >
                {showMonthLabel && (
                  <div className="gantt-month-label">
                    {item.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                )}
                {item.getDate()}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
