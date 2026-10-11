import { useState } from 'react';
import { Search, LogOut, History, User, MapPin, ArrowRightLeft, Trash2, Download, UserX } from 'lucide-react';

export default function Navbar({ 
  user, setUser, setShowAuth, setShowHistory, origin, setOrigin, search, setSearch, handleSearch, setUserCoords, onDeleteAccount
}: any) {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleHistoryClick = () => {
    if (user) {
      setShowHistory && setShowHistory(true);
    } else {
      setShowAuth && setShowAuth(true);
    }
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrigin("Ma position");
          if (setUserCoords) {
            setUserCoords([position.coords.latitude, position.coords.longitude]);
          }
        },
        (error) => {
          alert('Erreur de géolocalisation: ' + error.message);
        }
      );
    } else {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
    }
  };

  const handleSwap = () => {
    const tempOrigin = origin;
    setOrigin(search);
    setSearch(tempOrigin);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      setUser(null);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Effacer tout votre historique de trajets ? Cette action est irréversible.')) return;
    try {
      const res = await fetch('http://localhost:3000/user/trips/all', { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        alert('Historique effacé.');
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Clear history error', err);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch('http://localhost:3000/user/trips', { credentials: 'include' });
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ia-mobility-data-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setShowDropdown(false);
    } catch (err) {
      console.error('Export error', err);
    }
  };

  const close = () => setShowDropdown(false);
  const btnStyle = (color = '#333') => ({
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '11px 20px', background: 'transparent', border: 'none',
    width: '100%', textAlign: 'left' as const, cursor: 'pointer', color,
    fontSize: '13.5px', transition: 'background 0.15s'
  });

  return (
    <div style={{
      position: 'absolute',
      top: '20px', 
      left: '50%', 
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '1100px',
      height: '75px',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 30px',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px) saturate(150%)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
      border: '1px solid rgba(255, 255, 255, 0.5)',
      borderRadius: '50px',
      boxSizing: 'border-box'
    }}>
      
      {/* GAUCHE : HISTORIQUE — toujours visible */}
      <div style={{ flex: 1, paddingRight: '12px' }}>
        <button
          onClick={handleHistoryClick}
          title={user ? 'Mes trajets' : 'Connectez-vous pour voir vos trajets'}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', background: 'transparent',
            border: '1px solid #e0e0e0', borderRadius: '20px',
            cursor: 'pointer', color: user ? '#2c3e50' : '#aaa', fontSize: '13px', fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <History size={15} />
          Mes trajets
        </button>
      </div>

      {/* CENTRE : FORMULAIRE */}
      <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            value={origin} onChange={e => setOrigin(e.target.value)}
            placeholder="Départ"
            style={{ padding: '10px 35px 10px 10px', width: '200px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
          />
          <button 
            type="button" 
            title="Utiliser ma position" 
            onClick={handleGeolocation} 
            style={{ 
              position: 'absolute', right: '5px', background: 'transparent', 
              border: 'none', cursor: 'pointer', outline: 'none',
              color: origin === "Ma position" ? "#3498db" : "#2c3e50", 
              display: 'flex', alignItems: 'center' 
            }}
          >
            <MapPin size={18} />
          </button>
        </div>
        
        <button 
          type="button" 
          title="Inverser les lieux" 
          onClick={handleSwap} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2c3e50', padding: '5px', display: 'flex', alignItems: 'center' }}
        >
          <ArrowRightLeft size={18} />
        </button>

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Destination"
          style={{ padding: '10px', width: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <button 
          type="submit" 
          title="Rechercher" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '10px', background: 'transparent', color: '#2c3e50', 
            border: 'none', cursor: 'pointer', outline: 'none', width: '40px' 
          }}
        >
          <Search size={20} />
        </button>
      </form>

      {/* DROITE : COMPTE */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {user ? (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', background: 'transparent', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, color: '#2c3e50', fontSize: '13.5px' }}
            >
              <User size={17} />
              {user.firstname || user.email}
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '220px',
                background: 'white', borderRadius: '14px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '6px 0'
              }}>

                {/* Header */}
                <div style={{ padding: '10px 20px 8px', fontSize: '11px', color: '#aaa', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Mon compte
                </div>

                {/* History & Data */}
                <button style={btnStyle()} onClick={() => { setShowHistory(true); close(); }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <History size={16} /> Historique des trajets
                </button>
                <button style={btnStyle()} onClick={handleExportData}
                  onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Download size={16} /> Exporter mes données
                </button>
                <button style={btnStyle('#e67e22')} onClick={handleClearHistory}
                  onMouseEnter={e => e.currentTarget.style.background = '#fffaf5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Trash2 size={16} /> Effacer l'historique
                </button>

                <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 12px' }} />

                {/* Account */}
                <div style={{ padding: '8px 20px 4px', fontSize: '11px', color: '#aaa', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Compte & Confidentialité
                </div>
                <button style={btnStyle('#c0392b')} onClick={() => { onDeleteAccount && onDeleteAccount(); close(); }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fcf0f0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <UserX size={16} /> Supprimer le compte
                </button>

                <div style={{ height: '1px', background: '#f0f0f0', margin: '4px 12px' }} />

                <button style={btnStyle('#e74c3c')} onClick={() => { handleLogout(); close(); }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fcf0f0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <LogOut size={16} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        ) : (
          <button 
            onClick={() => setShowAuth(true)} 
            title="Se connecter"
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              padding: '10px', background: '#2c3e50', color: 'white', 
              border: 'none', borderRadius: '50%', cursor: 'pointer', 
              width: '42px', height: '42px', transition: 'all 0.3s'
            }}
          >
            <User size={20} />
          </button>
        )}
      </div>
    </div>
  );
}