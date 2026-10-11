exports.analyzeRoute = (routeData, weather, traffic) => {
    let score = 10;
    let risk_level = "low";
    let recommendation = "Trajet optimal";

    const distanceKm = routeData.distance_meters / 1000;
    const durationMinutes = routeData.duration_seconds / 60;

    // Impact météo
    const weatherDescription = weather?.description?.toLowerCase() || "";

    if (weatherDescription.includes("rain")) score -= 2;
    if (weatherDescription.includes("storm") || weatherDescription.includes("thunder")) score -= 4;
    if (weatherDescription.includes("snow")) score -= 3;
    if (weatherDescription.includes("fog") || weatherDescription.includes("mist")) score -= 2;

    // Impact trafic
    if (traffic?.congestion_level === "medium") score -= 2;
    if (traffic?.congestion_level === "high") score -= 4;

    if (traffic?.jam_factor !== null && traffic?.jam_factor !== undefined) {
        if (traffic.jam_factor >= 8) score -= 2;
        else if (traffic.jam_factor >= 5) score -= 1;
    }

    // Impact durée et distance
    if (durationMinutes > 180) score -= 2;
    else if (durationMinutes > 90) score -= 1;

    if (distanceKm > 500) score -= 2;
    else if (distanceKm > 200) score -= 1;

    score = Math.max(1, Math.min(score, 10));

    if (score <= 4) {
        risk_level = "high";
        recommendation = "Trajet déconseillé : trafic ou conditions défavorables";
    } else if (score <= 7) {
        risk_level = "medium";
        recommendation = "Trajet correct, restez vigilant";
    }

    return { score, risk_level, recommendation };
};