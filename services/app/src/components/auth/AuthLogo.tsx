import { Layout } from "lucide-react";

export function AuthLogo() {
  return (
    <div className="flex items-center justify-center gap-lg mb-2xl">
      <div style={{ 
        width: '56px', 
        height: '56px', 
        backgroundColor: 'var(--primary)', 
        borderRadius: '18px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'white',
        boxShadow: 'var(--primary-shadow)',
        flexShrink: 0
      }}>
        <Layout size={32} />
      </div>
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight" style={{ lineHeight: 1 }}>
          Sanctuary
        </h1>
        <p className="text-meta opacity-50" style={{ fontSize: '10px', marginTop: '2px' }}>
          Planning Intelligence
        </p>
      </div>
    </div>
  );
}
