const axios = require("axios");

exports.getCoordinates = async (placeName) => {
    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
        throw new Error("ORS_API_KEY manquante dans le fichier .env");
    }

    const response = await axios.get(
        "https://api.openrouteservice.org/geocode/search",
        {
            params: {
                api_key: apiKey,
                text: placeName,
                size: 1
            }
        }
    );

    const feature = response.data.features && response.data.features[0];

    if (!feature) {
        throw new Error(`Lieu introuvable : ${placeName}`);
    }

    return feature.geometry.coordinates;
};