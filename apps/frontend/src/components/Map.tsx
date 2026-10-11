import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import parkingData from '../data/historique_parkings.json';

let DefaultIcon = L.icon({
  iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function FitBounds({ originCoords, destinationCoords, mapCenter }: { originCoords?: [number, number] | null, destinationCoords?: [number, number] | null, mapCenter: [number, number] }) {
  const map = useMap();
  useEffect(() => { 
    if (originCoords && destinationCoords) {
      // Create a bounding box that encapsulates both start and end locations
      const bounds = L.latLngBounds([originCoords, destinationCoords]);
      // Pad slightly so markers aren't placed exactly on the screen edges
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(mapCenter, 13); 
    }
  }, [originCoords, destinationCoords, mapCenter, map]);
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

export default function Map({ 
  mapCenter, search, routesData = [], selectedRouteIndex = 0, origin, originCoords, destinationCoords
}: { 
  mapCenter: [number, number], search: string, routesData?: any[], selectedRouteIndex?: number,
  origin?: string, originCoords?: [number, number] | null, destinationCoords?: [number, number] | null
}) {
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, zIndex: 0 }}>
      <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', paddingTop: '80px' /* Espace pour la Navbar */ }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds originCoords={originCoords} destinationCoords={destinationCoords} mapCenter={mapCenter} />
        
        {originCoords && (
          <Marker position={originCoords}>
            <Popup><strong>Départ :</strong> {origin}</Popup>
          </Marker>
        )}

        {destinationCoords ? (
          <Marker position={destinationCoords}>
            <Popup><strong>Destination :</strong> {search}</Popup>
          </Marker>
        ) : (
          <Marker position={mapCenter}>
            <Popup>Itinéraire vers : {search || '...'}</Popup>
          </Marker>
        )}

        {routesData.map((route, idx) => {
          if (!route.geometry) return null;
          const isSelected = idx === selectedRouteIndex;
          const color = isSelected ? '#00f2fe' : '#95a5a6';
          const weight = isSelected ? 6 : 4;
          const opacity = isSelected ? 0.9 : 0.4;
          
          return (
            <GeoJSON 
              key={`route-${route.result_id}-${isSelected}`}
              data={route.geometry} 
              style={{ color, weight, opacity, lineCap: 'round', lineJoin: 'round' }} 
            />
          );
        })}

        {parkingData.donnees.map((p: any, idx: number) => (
          <ParkingMarker key={`parking-marker-${idx}`} parking={p} />
        ))}
      </MapContainer>
    </div>
  );
}