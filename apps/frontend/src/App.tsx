import { useState, useEffect } from 'react';
import Navbar from './components/navBar';
import Map from './components/Map';
import Auth from './components/Auth';

export default function App() {
  const [origin, setOrigin] = useState('Bordeaux');
  const [search, setSearch] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([44.8378, -0.5792]);
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3000/user/me', { credentials: 'include' })
      .then(res => { if (res.ok) return res.json(); throw new Error(); })
      .then(data => setUser(data))
      .catch(() => console.log('Aucune session active'));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    try {
      const response = await fetch('http://localhost:3000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ origin, destination: search, maxRoutes: 3 })
      });
      const data = await response.json();
      if (response.ok) setMapCenter([data.destinationCoords[1], data.destinationCoords[0]]);
      else alert('Erreur backend: ' + data.error);
    } catch (err) {
      console.error('Erreur backend :', err);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* 1. LA BARRE DE NAVIGATION EN HAUT */}
      <Navbar 
        user={user} setUser={setUser} setShowAuth={setShowAuth}
        origin={origin} setOrigin={setOrigin} search={search} setSearch={setSearch}
        handleSearch={handleSearch}
      />

      {/* 2. LA CARTE EN DESSOUS */}
      <Map mapCenter={mapCenter} search={search} />

      {/* 3. LA MODALE D'AUTHENTIFICATION */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: -10, right: -10, borderRadius: '50%', width: 30, height: 30 }}>✕</button>
            <Auth onLoginSuccess={userData => { setUser(userData); setShowAuth(false); }} />
          </div>
        </div>
      )}

    </div>
  );
}