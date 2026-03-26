export default function Navbar({ 
  user, setUser, setShowAuth, origin, setOrigin, search, setSearch, handleSearch 
}: any) {
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
      top: 0, left: 0, right: 0,
      height: '80px',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      boxSizing: 'border-box' /* La magie est ici : ça empêche de dépasser l'écran */
    }}>
      
      {/* GAUCHE : FORMULAIRE */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
        <input
          value={origin} onChange={e => setOrigin(e.target.value)}
          placeholder="Départ"
          style={{ padding: '10px', width: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Destination"
          style={{ padding: '10px', width: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
        />
        <button type="submit" style={{ padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Rechercher
        </button>
      </form>

      {/* DROITE : AUTHENTIFICATION */}
      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>👤 {user.name || user.email}</span>
            <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Déconnexion
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} style={{ padding: '10px 20px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Se connecter
          </button>
        )}
      </div>
    </div>
  );
}