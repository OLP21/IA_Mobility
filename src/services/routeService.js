const axios = require("axios");

const calculateRoute = async (originCoords, destinationCoords) => {
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
        throw new Error("ORS_API_KEY manquante dans le fichier .env");
    }

    console.log("API KEY OK");
    console.log("Origin:", originCoords);
    console.log("Destination:", destinationCoords);

    const response = await axios.post(
        "https://api.openrouteservice.org/v2/directions/driving-car",
        {
            coordinates: [originCoords, destinationCoords]
        },
        {
            headers: {
                Authorization: apiKey,
                "Content-Type": "application/json"
            }
        }
    );

    const route = response.data.routes && response.data.routes[0];

    if (!route) {
        throw new Error("Aucun itinéraire trouvé");
    }

    return {
        distance_meters: route.summary.distance,
        duration_seconds: route.summary.duration,
        geometry: route.geometry
    };
};

module.exports = { calculateRoute };