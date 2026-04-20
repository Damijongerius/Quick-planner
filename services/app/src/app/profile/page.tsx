import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
  User, 
  MapPin, 
  Calendar, 
  Verified,
  Palette,
  Lock,
  Bell,
  Globe,
  ChevronRight,
  MessageSquare
} from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="canvas-content">
      {/* Profile Header Section */}
      <section style={{ marginBottom: '48px', display: 'flex', alignItems: 'flex-end', gap: '32px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ 
            width: '160px', 
            height: '160px', 
            borderRadius: '40px', 
            overflow: 'hidden', 
            backgroundColor: 'var(--surface-container)', 
            padding: '4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
          }}>
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name || "User"} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '36px' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--surface-container-high)', borderRadius: '36px' }}>
                <User size={64} color="var(--on-surface-variant)" />
              </div>
            )}
          </div>
          <div style={{ 
            position: 'absolute', 
            bottom: '-8px', 
            right: '-8px', 
            backgroundColor: 'var(--tertiary)', 
            color: 'white', 
            padding: '8px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '4px solid var(--surface)'
          }}>
            <Verified size={20} fill="white" />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--on-surface)' }}>
              {session.user.name || "Anonymous User"}
            </h1>
          </div>
          <p style={{ fontSize: '20px', fontWeight: 500, color: 'var(--on-surface-variant)' }}>
            Strategic Planner
          </p>
          <div style={{ display: 'flex', gap: '24px', paddingTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--on-surface-variant)', fontSize: '14px' }}>
              <Calendar size={16} />
              <span>Joined October 2023</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Manifesto */}
            <div className="card-sanctuary" style={{ padding: '40px', borderRadius: '40px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '24px' }}>Manifesto</h3>
                <p style={{ fontSize: '18px', color: 'var(--on-surface-variant)', fontStyle: 'italic', lineHeight: 1.6 }}>
                    "Architecting clarity from complexity. In the Sanctuary, we don't just manage time; we master attention."
                </p>
            </div>
        </div>

        {/* Sidebar Sections */}
        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card-sanctuary" style={{ backgroundColor: 'var(--surface-container-low)', borderRadius: '40px', padding: '32px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { label: 'Interface Theme', value: 'Default', icon: Palette },
                        { label: 'Privacy & Security', icon: Lock, arrow: true },
                        { label: 'Cloud Syncing', icon: Globe, toggle: true }
                    ].map((pref, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--surface-container-lowest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface-variant)' }}>
                                    <pref.icon size={20} />
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{pref.label}</span>
                            </div>
                            {pref.value && <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)' }}>{pref.value}</span>}
                            {pref.arrow && <ChevronRight size={16} color="var(--on-surface-variant)" />}
                            {pref.toggle && (
                                <div style={{ width: '32px', height: '16px', backgroundColor: 'var(--tertiary)', borderRadius: '9999px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', right: '2px', top: '2px', width: '12px', height: '12px', backgroundColor: 'white', borderRadius: '50%' }}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
