import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import parkingData from '../data/historique_parkings.json';

let DefaultIcon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 13); }, [center, map]);
  return null;
}

function ParkingMarker({ parking }: { parking: any }) {
  const [proba, setProba] = useState<number | null>(null);
  const nomParking = parking.properties.nom;

  useEffect(() => {
    fetch(`http://localhost:5001/predict?nom=${encodeURIComponent(nomParking)}`)
      .then(res => res.json())
      .then(data => {
        if (data.prediction_occupation) setProba(parseFloat(data.prediction_occupation));
      })
      .catch(err => console.error('Erreur IA', err));
  }, [nomParking]);

  const position: [number, number] = [parking.geometry.coordinates[1], parking.geometry.coordinates[0]];
  const color = proba !== null ? (proba > 70 ? '#e74c3c' : '#2ecc71') : '#95a5a6';

  return (
    <Circle center={position} radius={150} pathOptions={{ fillColor: color, color: color, fillOpacity: 0.6 }}>
      <Popup>
        <strong>{nomParking}</strong><br />Occupation prédite : <b style={{ color }}>{proba !== null ? `${proba}%` : 'Calcul...'}</b>
      </Popup>
    </Circle>
  );
}

export default function Map({ mapCenter, search }: { mapCenter: [number, number], search: string }) {
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 0 }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', paddingTop: '80px' /* Espace pour la Navbar */ }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap center={mapCenter} />
        <Marker position={mapCenter}>
          <Popup>Itinéraire vers : {search || '...'}</Popup>
        </Marker>
        {parkingData.donnees.map((p: any, idx: number) => (
          <ParkingMarker key={idx} parking={p} />
        ))}
      </MapContainer>
    </div>
  );
}