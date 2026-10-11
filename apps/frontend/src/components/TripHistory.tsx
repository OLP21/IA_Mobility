import { useEffect, useState } from 'react';
import { History, X, Route, Award, CalendarDays, Clock } from 'lucide-react';
import './TripHistory.css';

interface TripHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TripHistory({ isOpen, onClose }: TripHistoryProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('http://localhost:3000/user/trips', { credentials: 'include' })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Map the backend data
            const formatted = data.map((t: any) => ({
              id: t.id,
              start: t.start_location || 'Point A',
              end: t.end_location || 'Point B',
              date: t.created_at ? new Date(t.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : 'Aujourd\'hui',
              duration: t.duration ? `${Math.round(t.duration / 60)} min` : 'Inconnu',
              distance: t.distance ? `${(t.distance / 1000).toFixed(1)} km` : '— km',
              score: t.score ? Math.round((t.score / 10) * 100) : 85
            }));
            setTrips(formatted);
          } else {
            setTrips([]);
          }
        })
        .catch(err => {
          console.error("Failed to load trips", err);
          setTrips([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 70) return 'score-average';
    return 'score-bad';
  };

  return (
    <div className={`trip-history-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="trip-history-panel" onClick={e => e.stopPropagation()}>
        <div className="trip-history-header">
          <h2><History size={24} /> Trip History</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="trip-history-content">
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : trips.length === 0 ? (
            <div className="empty-state">
              <History size={48} opacity={0.5} />
              <p>No trips recorded yet.</p>
            </div>
          ) : (
            trips.map((trip) => (
              <div key={trip.id} className="trip-card">
                <div className="trip-card-top">
                  <div className="trip-route">
                    <Route className="route-icon" size={20} />
                    <div className="route-text">
                      {trip.start} → {trip.end}
                    </div>
                  </div>
                  <div className={`score-badge ${getScoreClass(trip.score)}`}>
                    <Award size={16} /> {trip.score}
                  </div>
                </div>
                
                <div className="trip-card-bottom">
                  <div className="trip-meta-item">
                    <CalendarDays size={16} /> {trip.date}
                  </div>
                  <div className="trip-meta-item">
                    <Clock size={16} /> {trip.duration}
                  </div>
                </div>
                
                <div className="trip-distance">
                  Distance: {trip.distance}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
