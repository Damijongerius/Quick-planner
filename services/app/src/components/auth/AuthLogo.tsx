import { Layout } from "lucide-react";

export function AuthLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px', justifyContent: 'center' }}>
      <div style={{ 
        width: '48px', 
        height: '48px', 
        backgroundColor: 'var(--primary)', 
        borderRadius: '14px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'white',
        boxShadow: 'var(--primary-shadow)'
      }}>
        <Layout size={28} />
      </div>
      <div>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 800, 
          fontFamily: 'var(--font-display)',
          color: 'var(--on-surface)',
          letterSpacing: '-0.03em'
        }}>
          Sanctuary
        </h1>
        <p className="text-meta" style={{ fontSize: '9px' }}>Planning Intelligence</p>
      </div>
    </div>
  );
}
