exports.analyzeRoute = (routeData, weather) => {
    let score = 10;

    if (routeData.distance_meters > 300000) {
        score -= 2;
    }

    if (routeData.duration_seconds > 10000) {
        score -= 2;
    }

    const description = (weather.description || "").toLowerCase();

    if (
        description.includes("rain") ||
        description.includes("storm") ||
        description.includes("snow")
    ) {
        score -= 3;
    }

    let risk_level = "low";
    let recommendation = "Trajet optimal";

    if (score < 5) {
        risk_level = "high";
        recommendation = "Trajet risqué, envisagez une alternative";
    } else if (score < 8) {
        risk_level = "medium";
        recommendation = "Trajet correct, restez vigilant";
    }

    return {
        score,
        risk_level,
        recommendation
    };
};