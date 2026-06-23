const axios = require("axios");

const calculateRoutes = async (originCoords, destinationCoords, maxRoutes = 3) =>  {
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
        throw new Error("ORS_API_KEY manquante dans le fichier .env");
    }

    const baseUrl = "https://api.openrouteservice.org/v2/directions/driving-car/geojson";
    const headers = {
        Authorization: apiKey,
        "Content-Type": "application/json"
    };

    try {
        const response = await axios.post(
            baseUrl,
            {
                coordinates: [originCoords, destinationCoords],
                alternative_routes: {
                    target_count: maxRoutes,
                    weight_factor: 1.6,
                    share_factor: 0.6
                }
            },
            { headers }
        );

        const features = response.data.features;

        if (!features || !features.length) {
            throw new Error("Aucun itinéraire trouvé");
        }

        return features.map((feature, index) => ({
            route_index: index + 1,
            distance_meters: feature.properties.summary.distance,
            duration_seconds: feature.properties.summary.duration,
            geometry: feature.geometry
        }));
    } catch (error) {
        const orsError = error.response?.data?.error;
        const message = orsError?.message || "";

        const isAlternativeLimitError =
            error.response?.status === 400 &&
            message.includes("approximated route distance must not be greater than");

        if (!isAlternativeLimitError) {
            throw error;
        }

        // Fallback : une seule route si le trajet est trop long pour les alternatives
        const response = await axios.post(
            baseUrl,
            {
                coordinates: [originCoords, destinationCoords]
            },
            { headers }
        );

        const features = response.data.features;

        if (!features || !features.length) {
            throw new Error("Aucun itinéraire trouvé");
        }

        return features.map((feature, index) => ({
            route_index: index + 1,
            distance_meters: feature.properties.summary.distance,
            duration_seconds: feature.properties.summary.duration,
            geometry: feature.geometry
        }));
    }
};

module.exports = { calculateRoutes };