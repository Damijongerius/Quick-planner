import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { User, Mail, Shield } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>User Profile</h2>
        <p style={{ color: '#9ca3af' }}>Manage your account settings and preferences.</p>
      </header>

      <div className="glass" style={{ padding: '32px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        <div style={{ 
          width: '120px', 
          height: '120px', 
          borderRadius: '50%', 
          backgroundColor: 'rgba(255,255,255,0.05)', 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255,255,255,0.1)'
        }}>
          {session.user.image ? (
            <img src={session.user.image} alt={session.user.name || "User"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={64} color="#4b5563" />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Display Name</label>
            <div className="glass" style={{ padding: '12px 16px', fontWeight: 600 }}>
              {session.user.name || "Not set"}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Mail size={16} color="#4b5563" />
              <span>{session.user.email}</span>
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Account Role</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#3b82f6', fontSize: '0.875rem' }}>
              <Shield size={16} />
              <span style={{ fontWeight: 500 }}>Premium Member</span>
            </div>
          </div>

          <button className="button-premium" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Edit Profile (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}
