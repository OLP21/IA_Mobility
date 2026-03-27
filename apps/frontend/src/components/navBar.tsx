import { useState } from 'react';
import { Search, LogOut, History, User, MapPin, ArrowRightLeft } from 'lucide-react';

export default function Navbar({ 
  user, setUser, setShowAuth, setShowHistory, origin, setOrigin, search, setSearch, handleSearch, setUserCoords
}: any) {
  const [showDropdown, setShowDropdown] = useState(false);

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

  return (
    <div style={{
      position: 'absolute',
      top: '20px', 
      left: '50%', 
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '900px',
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
      
      {/* GAUCHE : ESPACE VIDE POUR CENTRER */}
      <div style={{ flex: 1 }}></div>

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

      {/* DROITE : AUTHENTIFICATION */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {user ? (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', background: 'transparent', border: '1px solid #ddd', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}
            >
              <User size={18} />
              {user.firstname || user.email}
            </button>

            {showDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '10px', width: '200px',
                background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '5px 0'
              }}>
                <button 
                  onClick={() => { setShowHistory && setShowHistory(true); setShowDropdown(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#333' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <History size={18} /> Trip History
                </button>
                <div style={{ height: '1px', background: '#eee', margin: '0 10px' }} />
                <button 
                  onClick={() => { handleLogout(); setShowDropdown(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#e74c3c' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fcf0f0'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={18} /> Déconnexion
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