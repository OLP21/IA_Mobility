import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Obligatoire pour l'affichage des tuiles

// Correction pour les icônes par défaut de Leaflet dans React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function App() {
  const position: [number, number] = [48.8566, 2.3522]; // Coordonnées de Paris
  const [search, setSearch ] = useState("");

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Recherche lancée pour : " + search);
        }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}
      >
        <input
          type="text"
          placeholder="Entrez une destination..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '250px' }}
        />
      <button type="submit" style={{ marginLeft: '5px', padding: '8px 15px', cursor: 'pointer'}}>
        Rechercher
      </button>
      </form>

      <MapContainer 
        center={position} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            IA Mobility <br /> Bienvenue à Paris !
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default App;