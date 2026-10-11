import './RouteDetails.css';

interface RouteData {
  result_id: number;
  route_index: number;
  distance: number;
  duration: number;
  analysis: {
    score: number;
    risk_level: string;
    recommendation: string;
  };
}

interface WeatherData {
  temperature: number;
  description: string;
  city: string;
}

interface TrafficData {
  jam_factor: number | null;
  speed: number | null;
  free_flow_speed: number | null;
  congestion_level: string;
}

interface RouteDetailsProps {
  routes: RouteData[];
  weather: WeatherData | null;
  traffic?: TrafficData | null;
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
  currentTripId?: number | null;
  tripStatus?: string;
  updateTripStatus?: (status: string, route_id?: number) => void;
  chosenRouteId?: number | null;
  recommendedParking?: any;
  onClose?: () => void;
}

export default function RouteDetails({ routes, weather, traffic, selectedIndex, onSelectRoute, tripStatus, updateTripStatus, chosenRouteId, recommendedParking, onClose }: RouteDetailsProps) {
  if (!routes || routes.length === 0) return null;

  const formatDuration = (seconds: number) => {
    const min = Math.round(seconds / 60);
    if (min > 60) {
      const hrs = Math.floor(min / 60);
      const remainingMin = min % 60;
      return `${hrs}h ${remainingMin}m`;
    }
    return `${min} min`;
  };

  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(1) + ' km';
  };

  const getWeatherIcon = (desc: string) => {
    // Determine if it's night (between 19:00 and 06:00)
    const hour = new Date().getHours();
    const isNight = hour >= 19 || hour <= 6;

    // Simple icon mapping based on common openweathermap descriptions
    if (desc.includes('cloud')) return isNight ? '☁️' : '⛅';
    if (desc.includes('rain')) return '🌧️';
    if (desc.includes('clear')) return isNight ? '🌙' : '☀️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('storm') || desc.includes('thunder')) return '⛈️';
    return isNight ? '🌙' : '🌤️';
  };

  return (
    <div className="route-details-overlay">
      <div className="route-details-panel">
        <div className="route-header">
          <h2>Itinéraires Recommandés</h2>
          <div className="header-badges">
            {weather && (
              <div className="weather-badge">
                <i title={weather.description}>{getWeatherIcon(weather.description)}</i>
                {Math.round(weather.temperature)}°C • {weather.city}
              </div>
            )}
            {traffic && (
              <div className="traffic-badge" title={traffic.jam_factor !== null ? `Jam Factor: ${traffic.jam_factor}` : "Trafic"}>
                <i>{traffic.congestion_level === 'high' ? '🚨' : traffic.congestion_level === 'medium' ? '⚠️' : '🟢'}</i>
                {traffic.congestion_level === 'high' ? 'Bouchons' : traffic.congestion_level === 'medium' ? 'Trafic dense' : 'Fluide'}
              </div>
            )}
          </div>
        </div>

        <div className="routes-wrapper">
          <div className="routes-track" style={{ transform: `translateX(-${selectedIndex * 100}%)` }}>
            {routes.map((route, idx) => {
              const riskClass = `risk-${route.analysis.risk_level.toLowerCase()}`;
              const isChosen = chosenRouteId === route.result_id;
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={`route-card-${route.result_id || 'new'}-${idx}`}
                  className={`route-card ${isSelected ? 'selected' : ''}`}
                >
                  <div className="carousel-header">
                    <button 
                      className="carousel-nav-btn" 
                      onClick={(e) => { e.stopPropagation(); onSelectRoute(selectedIndex > 0 ? selectedIndex - 1 : routes.length - 1); }}
                    >
                      &#8592;
                    </button>
                    <div className="route-title">
                      Option {idx + 1} / {routes.length} 
                      {isChosen && <span className="chosen-tag" style={{ fontSize: '0.8em', color: '#aab', marginLeft: '6px' }}> (Sélectionnée)</span>}
                    </div>
                    <button 
                      className="carousel-nav-btn" 
                      onClick={(e) => { e.stopPropagation(); onSelectRoute(selectedIndex < routes.length - 1 ? selectedIndex + 1 : 0); }}
                    >
                      &#8594;
                    </button>
                  </div>

                  <div className="route-body">
                    <div className="route-info-left">
                      <div className="route-meta">
                        <span style={{ fontWeight: '600', color: '#fff', fontSize: '1.2rem' }}>{formatDuration(route.duration)}</span>
                        <br/>
                        <span>{formatDistance(route.distance)}</span>
                      </div>
                    </div>

                    <div className="route-info-right">
                      <div className="route-score">
                        {route.analysis.score}<span style={{fontSize:'0.9rem', color:'#aaa'}}>/10</span>
                      </div>
                      <div className={`route-risk ${riskClass}`}>
                        {route.analysis.recommendation}
                      </div>
                    </div>
                  </div>

                  {/* TRIP ACTION BUTTONS */}
                  {tripStatus && (
                    <div className="trip-actions">
                      {tripStatus === 'searched' && (
                        <button 
                          className="btn-demarrer" 
                          onClick={(e) => { e.stopPropagation(); updateTripStatus?.('en_cours', route.result_id); }}
                        >
                          🚀 Démarrer
                        </button>
                      )}
                      {tripStatus === 'en_cours' && isChosen && (
                        <>
                          <button 
                            className="btn-terminer" 
                            onClick={(e) => { e.stopPropagation(); updateTripStatus?.('termine', route.result_id); }}
                          >
                            ☑️ Terminer
                          </button>
                          <button 
                            className="btn-annuler" 
                            onClick={(e) => { e.stopPropagation(); updateTripStatus?.('annule', route.result_id); }}
                          >
                            ❌ Annuler
                          </button>
                        </>
                      )}
                      {tripStatus === 'termine' && isChosen && (
                        <div className="status-badge success" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          ✅ Trajet accompli
                          <button 
                            style={{ background: 'rgba(46, 204, 113, 0.3)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                          >
                            Fermer la navigation
                          </button>
                        </div>
                      )}
                      {tripStatus === 'annule' && isChosen && (
                        <div className="status-badge error" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          🛑 Trajet annulé
                          <button 
                            style={{ background: 'rgba(231, 76, 60, 0.3)', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            onClick={(e) => { e.stopPropagation(); onClose?.(); }}
                          >
                            Fermer la navigation
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="parking-insight">
          {recommendedParking?.isLoading ? (
             <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
               <span>{'>'}</span> Recherche du parking optimal...
             </div>
          ) : recommendedParking ? (
             <>
               <div style={{display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 'bold', color: '#fff'}}>
                 <span>{'>'}</span> Meilleur parking proche: {recommendedParking.name}
               </div>
               <div style={{ paddingLeft: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#bdc3c7' }}>
                 <span style={{ color: recommendedParking.availability > 30 ? '#2ecc71' : '#f1c40f', fontWeight: 'bold' }}>
                   {recommendedParking.availability}% de places libres
                 </span>
                 {recommendedParking.walkDistance !== undefined && (
                   <span style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '8px' }}>
                     à {recommendedParking.walkDistance}m de la destination
                   </span>
                 )}
               </div>
             </>
          ) : (
             <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
               <span>{'>'}</span> Analyse des parkings terminée.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}


