import { getProjectHistory } from "@/lib/actions";
import { Clock, User, ArrowRight, Tag, Database, Layers } from "lucide-react";

export default async function HistoryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const history = await getProjectHistory(projectId);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'var(--tertiary)';
      case 'DELETE': return 'var(--error)';
      case 'UPDATE': return 'var(--primary)';
      case 'STATUS_CHANGE': return '#3d5762';
      case 'MOVE': return '#8696fd';
      default: return 'var(--on-surface-variant)';
    }
  };

  return (
    <div className="canvas-content" style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Audit Log</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Chronological record of all strategic shifts and operational changes.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {history.map((event: any) => (
          <div key={event.id} className="card-sanctuary" style={{ 
            padding: '20px 32px', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            boxShadow: 'none',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: '1px solid var(--outline-variant)'
          }}>
            <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--surface-container-high)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getActionColor(event.action),
                flexShrink: 0
            }}>
                <Clock size={20} />
            </div>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 800, 
                        color: getActionColor(event.action),
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        {event.action.replace('_', ' ')}
                    </span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--outline-variant)' }}></span>
                    <span style={{ fontSize: '12px', color: 'var(--on-surface-variant)', fontWeight: 500 }}>
                        {new Date(event.createdAt).toLocaleString()}
                    </span>
                </div>
                
                <p style={{ fontSize: '15px', color: 'var(--on-surface)', fontWeight: 600 }}>
                    {event.entityType}: <span style={{ color: 'var(--primary)' }}>{event.entityName}</span>
                </p>

                {event.oldValue && event.newValue && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '12px' }}>
                        <span style={{ padding: '2px 8px', backgroundColor: 'var(--surface-container)', borderRadius: '4px', opacity: 0.7 }}>{event.oldValue}</span>
                        <ArrowRight size={12} style={{ opacity: 0.3 }} />
                        <span style={{ padding: '2px 8px', backgroundColor: 'rgba(70, 86, 184, 0.1)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>{event.newValue}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', backgroundColor: 'var(--surface-container-low)', borderRadius: '9999px' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden' }}>
                    {event.user.image ? (
                        <img src={event.user.image} style={{ width: '100%', height: '100%' }} />
                    ) : (
                        <User size={14} style={{ margin: '3px' }} />
                    )}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--on-surface-variant)' }}>{event.user.name}</span>
            </div>
          </div>
        ))}

        {history.length === 0 && (
            <div style={{ padding: '80px', textAlign: 'center', opacity: 0.5 }}>
                <Database size={48} style={{ margin: '0 auto 24px' }} />
                <p>No history recorded for this project yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
