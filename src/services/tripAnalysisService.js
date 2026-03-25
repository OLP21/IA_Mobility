const routeService = require("./routeService");
const geocodeService = require("./geocodeService");
const weatherService = require("./weatherService");
const aiService = require("./aiService");

function roundCoord(value, decimals = 4) {
    return Number(value.toFixed(decimals));
}

function simplifyAndRound(coords, step = 10) {
    return coords
        .filter((_, index) => index % step === 0)
        .map(coord => [
            roundCoord(coord[0]),
            roundCoord(coord[1])
        ]);
}
async function analyzeTrip(origin, destination, maxRoutes = 3) {
    const requestedMaxRoutes = Math.min(Math.max(parseInt(maxRoutes) || 3, 1), 5);

    if (!origin || !destination) {
        throw new Error("origin et destination sont obligatoires");
    }

    let originCoords = origin;
    let destinationCoords = destination;

    if (typeof origin === "string") {
        originCoords = await geocodeService.getCoordinates(origin);
    }

    if (typeof destination === "string") {
        destinationCoords = await geocodeService.getCoordinates(destination);
    }

    const weather = await weatherService.getWeather(
        originCoords[1],
        originCoords[0]
    );

    const routesData = await routeService.calculateRoutes(
        originCoords,
        destinationCoords,
        requestedMaxRoutes
    );

    const analyzedRoutes = routesData.map((routeData) => {
        const analysis = aiService.analyzeRoute(routeData, weather);

        return {
            route_index: routeData.route_index,
            distance_meters: routeData.distance_meters,
            duration_seconds: routeData.duration_seconds,
            geometry: {
                coordinates: simplifyAndRound(routeData.geometry.coordinates, 10)
            },
            analysis
        };
    });

    analyzedRoutes.sort((a, b) => b.analysis.score - a.analysis.score);

    return {
        origin,
        destination,
        originCoords,
        destinationCoords,
        weather,
        routes_count: analyzedRoutes.length,
        requested_max_routes: requestedMaxRoutes,
        routes: analyzedRoutes
    };
}

module.exports = { analyzeTrip };