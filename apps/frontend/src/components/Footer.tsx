import { MapPin, Shield, Info, Lock } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      height: '44px',
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(16px) saturate(140%)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      fontSize: '12px',
      color: '#666',
      boxSizing: 'border-box',
    }}>
      {/* LEFT: Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#2c3e50' }}>
        <MapPin size={13} />
        <span>IA Mobility</span>
        <span style={{ fontWeight: 400, color: '#aaa', marginLeft: '4px' }}>© {year}</span>
      </div>

      {/* CENTER: Nav links */}
      <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <FooterLink icon={<Info size={11} />} label="À propos" />
        <FooterLink icon={<Shield size={11} />} label="Confidentialité" />
        <FooterLink icon={<Lock size={11} />} label="Mentions légales" />
      </nav>

      {/* RIGHT: RGPD mention */}
      <div style={{ fontSize: '11px', color: '#bbb', letterSpacing: '0.02em' }}>
        Vos données restent en Gironde 🔒
      </div>
    </footer>
  );
}

function FooterLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        cursor: 'pointer', color: '#888',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = '#2c3e50')}
      onMouseLeave={e => (e.currentTarget.style.color = '#888')}
    >
      {icon}
      {label}
    </span>
  );
}
