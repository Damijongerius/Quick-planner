"use client";

import { useMemo } from "react";

interface GanttChartProps {
  nodes: any[];
  currentSprint: any;
}

export function GanttChart({ nodes, currentSprint }: GanttChartProps) {
  // Determine date range
  const startDate = currentSprint?.startDate ? new Date(currentSprint.startDate) : new Date();
  const endDate = currentSprint?.endDate ? new Date(currentSprint.endDate) : new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);

  // Generate days for the header
  const days = useMemo(() => {
    const list = [];
    const curr = new Date(startDate);
    curr.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (curr <= end) {
      list.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
    return list;
  }, [startDate, endDate]);

  const getPosition = (node: any) => {
    // Find first date field value
    const dateField = node.type.fields.find((f: any) => f.type === "DATE");
    const nodeDateValue = dateField ? node.content?.[dateField.name] : null;
    
    if (!nodeDateValue) return null;

    const nodeDate = new Date(nodeDateValue);
    const diffTime = nodeDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 || diffDays >= days.length) return null;
    return diffDays;
  };

  return (
    <div className="glass" style={{ height: '100%', overflow: 'auto', padding: '24px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
      <div style={{ minWidth: `${days.length * 100 + 300}px` }}>
        {/* Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px', marginBottom: '24px' }}>
          <div style={{ width: '300px', fontWeight: 600, color: '#6b7280', fontSize: '0.75rem', textTransform: 'uppercase' }}>Items</div>
          <div style={{ flex: 1, display: 'flex' }}>
            {days.map((day, i) => (
              <div key={i} style={{ width: '100px', textAlign: 'center', fontSize: '0.65rem', color: '#6b7280' }}>
                <div style={{ fontWeight: 700, color: '#d1d5db' }}>{day.getDate()}</div>
                <div>{day.toLocaleDateString('en-US', { month: 'short' })}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {nodes.map((node) => {
            const startCol = getPosition(node);
            
            return (
              <div key={node.id} style={{ display: 'flex', alignItems: 'center', height: '40px' }}>
                <div style={{ width: '300px', display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: node.type.color }} />
                  <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.title}</span>
                </div>
                
                <div style={{ flex: 1, position: 'relative', height: '100%', borderLeft: '1px solid rgba(255,255,255,0.02)', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '100px 100%' }}>
                  {startCol !== null && (
                    <div 
                      style={{ 
                        position: 'absolute', 
                        left: `${startCol * 100}px`, 
                        width: '200px', // Default duration
                        height: '24px', 
                        top: '8px',
                        backgroundColor: `${node.type.color}40`,
                        border: `1px solid ${node.type.color}`,
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        fontSize: '0.7rem',
                        color: node.type.color,
                        fontWeight: 600,
                        zIndex: 1
                      }}
                    >
                      {node.status}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
