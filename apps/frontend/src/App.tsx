import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import des styles et des données locales
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import parkingData from './data/historique_parkings.json';

// --- 1. CONFIGURATION DES ICONES (Correctif pour Vite/React) ---
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- 2. ASSISTANT DE RECENTRAGE DE LA CARTE ---
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

// --- 3. COMPOSANT MARQUEUR DE PARKING (LIEN AVEC L'IA DE MAMOR) ---
function ParkingMarker({ parking }: { parking: any }) {
  const [proba, setProba] = useState<number | null>(null);
  const nomParking = parking.properties.nom;

  useEffect(() => {
    // Appel à l'API Flask de Mamor (assure-toi que son serveur tourne sur le port 5000)
    fetch(`http://localhost:5001/predict?nom=${encodeURIComponent(nomParking)}`)
      .then(res => res.json())
      .then(data => {
        if (data.prediction_occupation) {
          // On extrait le nombre de la chaîne "XX.XX%" renvoyée par le Python
          const value = parseFloat(data.prediction_occupation);
          setProba(value);
        }
      })
      .catch(err => console.error("Erreur de connexion à l'IA pour " + nomParking, err));
  }, [nomParking]);

  // Inversion des coordonnées : GeoJSON [Lng, Lat] -> Leaflet [Lat, Lng]
  const position: [number, number] = [
    parking.geometry.coordinates[1],
    parking.geometry.coordinates[0]
  ];

  // Logique visuelle : Rouge si occupation > 70%, sinon Vert
  const color = proba !== null ? (proba > 70 ? '#e74c3c' : '#2ecc71') : '#95a5a6';

  return (
    <Circle 
      center={position} 
      radius={150} 
      pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6 }}
    >
      <Popup>
        <div style={{ fontFamily: 'Arial' }}>
          <strong>{nomParking}</strong> <br />
          <p>Occupation prédite : <b style={{ color }}>{proba !== null ? `${proba}%` : "Calcul..."}</b></p>
          <small>Total places : {parking.properties.np_total}</small>
        </div>
      </Popup>
    </Circle>
  );
}

// --- 4. COMPOSANT PRINCIPAL APP ---
export default function App() {
  const [search, setSearch] = useState("");
  // Bordeaux par défaut pour correspondre aux données de l'historique
  const [mapCenter, setMapCenter] = useState<[number, number]>([44.8378, -0.5792]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;

    try {
      // 1. Appel au backend de Boubacar (le port 3000 de ton Docker)
      const response = await fetch('http://localhost:3000/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: "Bordeaux", // On peut mettre Bordeaux par défaut pour l'instant
          destination: search,
          maxRoutes: 3
        })
      });

      const data = await response.json();

      if (response.ok) {
        // 2. On récupère les coordonnées renvoyées par le backend (via geocodeService)
        // Note: data.destinationCoords contient [lng, lat]
        const newCoords: [number, number] = [data.destinationCoords[1], data.destinationCoords[0]];
        
        // 3. On déplace la carte
        setMapCenter(newCoords);
        
        console.log("Trajet enregistré en base de données avec l'ID:", data.trip_id);
      } else {
        alert("Erreur backend: " + data.error);
      }
    } catch (err) {
      console.error("Impossible de joindre le backend :", err);
      alert("Le backend ne répond pas. Est-ce que Docker est lancé ?");
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* Interface de recherche Smart Search */}
      <form 
        onSubmit={handleSearch} 
        style={{ 
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', 
          zIndex: 1000, display: 'flex', gap: '10px', background: 'white', 
          padding: '12px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' 
        }}
      >
         <input 
           value={search} 
           onChange={(e) => setSearch(e.target.value)} 
           placeholder="Où voulez-vous aller ?"
           style={{ padding: '10px', width: '300px', borderRadius: '6px', border: '1px solid #ddd' }}
         />
         <button 
           type="submit"
           style={{ 
             padding: '10px 20px', background: '#2c3e50', color: 'white', 
             border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
           }}
         >
           Rechercher
         </button>
      </form>

      {/* Carte Leaflet principale */}
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Recentrage automatique */}
        <RecenterMap center={mapCenter} />
        
        {/* Marqueur de destination */}
        <Marker position={mapCenter}>
          <Popup>Votre destination : {search || "Bordeaux"}</Popup>
        </Marker>

        {/* Affichage dynamique des parkings via l'IA de Mamor */}
        {parkingData.donnees.map((p: any, idx: number) => (
          <ParkingMarker key={idx} parking={p} />
        ))}
      </MapContainer>
    </div>
  );
}