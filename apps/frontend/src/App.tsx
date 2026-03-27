import { useState, useEffect } from 'react';
import Navbar from './components/navBar';
import Map from './components/Map';
import Auth from './components/Auth';
import RouteDetails from './components/RouteDetails';
import TripHistory from './components/TripHistory';
import Footer from './components/Footer';
import parkingData from './data/historique_parkings.json';

const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

export default function App() {
  const [origin, setOrigin] = useState(() => sessionStorage.getItem('appState_origin') || 'Bordeaux');
  const [search, setSearch] = useState(() => sessionStorage.getItem('appState_search') || '');
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    const saved = sessionStorage.getItem('appState_mapCenter');
    return saved ? JSON.parse(saved) : [44.8378, -0.5792];
  });
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(() => {
    const saved = sessionStorage.getItem('appState_originCoords');
    return saved ? JSON.parse(saved) : null;
  });
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(() => {
    const saved = sessionStorage.getItem('appState_destinationCoords');
    return saved ? JSON.parse(saved) : null;
  });
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [routesData, setRoutesData] = useState<any[]>(() => {
    const saved = sessionStorage.getItem('appState_routesData');
    return saved ? JSON.parse(saved) : [];
  });
  const [weatherData, setWeatherData] = useState<any>(() => {
    const saved = sessionStorage.getItem('appState_weatherData');
    return saved ? JSON.parse(saved) : null;
  });
  const [trafficData, setTrafficData] = useState<any>(() => {
    const saved = sessionStorage.getItem('appState_trafficData');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(() => {
    const saved = sessionStorage.getItem('appState_selectedRouteIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [currentTripId, setCurrentTripId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('appState_tripId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [tripStatus, setTripStatus] = useState<string>(() => sessionStorage.getItem('appState_tripStatus') || 'searched');
  const [chosenRouteId, setChosenRouteId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('appState_chosenRouteId');
    return saved ? parseInt(saved, 10) : null;
  });
  const [recommendedParking, setRecommendedParking] = useState<any>(() => {
    const saved = sessionStorage.getItem('appState_recommendedParking');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetch('http://localhost:3000/user/me', { credentials: 'include' })
      .then(res => { if (res.ok) return res.json(); throw new Error(); })
      .then(data => setUser(data))
      .catch(() => console.log('Aucune session active'));
  }, []);

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('appState_origin', origin);
    sessionStorage.setItem('appState_search', search);
    sessionStorage.setItem('appState_mapCenter', JSON.stringify(mapCenter));
    sessionStorage.setItem('appState_originCoords', JSON.stringify(originCoords));
    sessionStorage.setItem('appState_destinationCoords', JSON.stringify(destinationCoords));
    sessionStorage.setItem('appState_routesData', JSON.stringify(routesData));
    sessionStorage.setItem('appState_weatherData', JSON.stringify(weatherData));
    sessionStorage.setItem('appState_trafficData', JSON.stringify(trafficData));
    sessionStorage.setItem('appState_selectedRouteIndex', selectedRouteIndex.toString());
    sessionStorage.setItem('appState_tripStatus', tripStatus);
    if (currentTripId) sessionStorage.setItem('appState_tripId', currentTripId.toString());
    if (chosenRouteId) sessionStorage.setItem('appState_chosenRouteId', chosenRouteId.toString());
    if (recommendedParking) sessionStorage.setItem('appState_recommendedParking', JSON.stringify(recommendedParking));
  }, [origin, search, mapCenter, originCoords, destinationCoords, routesData, weatherData, trafficData, selectedRouteIndex, tripStatus, currentTripId, chosenRouteId, recommendedParking]);

  const updateTripStatus = async (status: string, route_id?: number) => {
     if (!currentTripId) return;
     try {
       await fetch(`http://localhost:3000/user/trips/${currentTripId}/status`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify({ status, chosen_route_id: route_id })
       });
       if (route_id) setChosenRouteId(route_id);
       setTripStatus(status);
     } catch (err) {
       console.error("Status error", err);
     }
  };

  const findAndSetBestParking = async (routeEndCoords: [number, number], finalDestCoords: [number, number]) => {
     const nearbyParkings = parkingData.donnees.filter((p: any) => {
        const dist = haversineDistance(routeEndCoords[0], routeEndCoords[1], p.geometry.coordinates[1], p.geometry.coordinates[0]);
        return dist <= 1.5;
     });
     if (nearbyParkings.length === 0) {
        setRecommendedParking(null); return;
     }

     let bestParking = null;
     let highestAvailability = -1;

     for (const p of nearbyParkings) {
        try {
           const res = await fetch(`http://localhost:5001/predict?nom=${encodeURIComponent(p.properties.nom)}`);
           const data = await res.json();
           if (data.prediction_occupation) {
               const occupation = parseFloat(data.prediction_occupation);
               const availability = 100 - occupation; 
               if (availability > highestAvailability) {
                   highestAvailability = availability;
                   const distToDest = haversineDistance(finalDestCoords[0], finalDestCoords[1], p.geometry.coordinates[1], p.geometry.coordinates[0]);
                   bestParking = { name: p.properties.nom, availability: Math.round(availability), walkDistance: Math.round(distToDest * 1000) };
               }
           }
        } catch (e) { console.error("Error fetching predict", e); }
     }
     setRecommendedParking(bestParking);
  };

  useEffect(() => {
    if (routesData.length > 0 && destinationCoords) {
      const selectedRoute = routesData[selectedRouteIndex];
      if (selectedRoute && selectedRoute.geometry && selectedRoute.geometry.coordinates) {
        const coords = selectedRoute.geometry.coordinates;
        const lastCoord = coords[coords.length - 1];
        setRecommendedParking({ isLoading: true });
        findAndSetBestParking([lastCoord[1], lastCoord[0]], destinationCoords);
      }
    }
  }, [selectedRouteIndex, routesData, destinationCoords]);

  const handleCloseTrip = () => {
    setRoutesData([]);
    setRecommendedParking(null);
    setCurrentTripId(null);
    setChosenRouteId(null);
    setTripStatus('searched');
    setWeatherData(null);
    setTrafficData(null);
    setDestinationCoords(null);
    setOriginCoords(null);
    setOrigin("");
    setSearch("");
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Supprimer définitivement votre compte ? Cette action est irréversible.')) return;
    try {
      const res = await fetch('http://localhost:3000/user/delete', { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setUser(null);
        handleCloseTrip();
        alert('Compte supprimé.');
      }
    } catch (err) {
      console.error('Delete account error', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !search) return;

    const tmpOrigin = origin;
    const tmpSearch = search;

    handleCloseTrip();
    
    setOrigin(tmpOrigin);
    setSearch(tmpSearch);

    try {
      const backendOrigin = origin === "Ma position" && userCoords ? [userCoords[1], userCoords[0]] : origin;
      const backendDestination = search === "Ma position" && userCoords ? [userCoords[1], userCoords[0]] : search;

      const response = await fetch('http://localhost:3000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ origin: backendOrigin, destination: backendDestination, maxRoutes: 3 })
      });
      const data = await response.json();
      if (response.ok) {
        // Expected from backend: originCoords [lon, lat], destinationCoords [lon, lat]
        const latLngDest: [number, number] = [data.destinationCoords[1], data.destinationCoords[0]];
        const latLngOrig: [number, number] = [data.originCoords[1], data.originCoords[0]];
        
        setDestinationCoords(latLngDest);
        setOriginCoords(latLngOrig);
        setMapCenter(latLngDest); 
        setRoutesData(data.routes || []);
        setWeatherData(data.weather || null);
        setTrafficData(data.traffic || null);
        setSelectedRouteIndex(0);
        setCurrentTripId(data.trip_id || null);
        setTripStatus('searched');
      }
      else alert('Erreur backend: ' + data.error);
    } catch (err) {
      console.error('Erreur backend :', err);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      
      {/* 1. LA BARRE DE NAVIGATION EN HAUT */}
      <Navbar 
        user={user} setUser={setUser} setShowAuth={setShowAuth} setShowHistory={setShowHistory}
        origin={origin} setOrigin={setOrigin} search={search} setSearch={setSearch}
        handleSearch={handleSearch} setUserCoords={setUserCoords}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* 2. LA CARTE EN DESSOUS */}
      <Map 
        mapCenter={mapCenter} origin={origin} search={search} 
        originCoords={originCoords} destinationCoords={destinationCoords}
        routesData={routesData} selectedRouteIndex={selectedRouteIndex} 
      />

      {/* 4. DETAILS D'ITINERAIRES (Glassmorphism) */}
      {routesData.length > 0 && (
        <RouteDetails 
          routes={routesData} 
          weather={weatherData}
          traffic={trafficData}
          selectedIndex={selectedRouteIndex}
          onSelectRoute={setSelectedRouteIndex}
          currentTripId={currentTripId}
          tripStatus={tripStatus}
          updateTripStatus={updateTripStatus}
          chosenRouteId={chosenRouteId}
          recommendedParking={recommendedParking}
          onClose={handleCloseTrip}
        />
      )}

      {/* 3. LA MODALE D'AUTHENTIFICATION */}
      {showAuth && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.6)' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowAuth(false)} style={{ position: 'absolute', top: 16, right: 16, borderRadius: '50%', width: 32, height: 32, background: '#f0f0f0', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, outline: 'none' }}>✕</button>
            <Auth onLoginSuccess={userData => { setUser(userData); setShowAuth(false); }} />
          </div>
        </div>
      )}

      {/* 5. HISTORIQUE DES TRAJETS */}
      <TripHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />

      {/* 6. FOOTER */}
      <Footer />

    </div>
  );
}