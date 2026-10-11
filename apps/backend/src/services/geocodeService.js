const axios = require("axios");

exports.getCoordinates = async (placeName) => {
    if (placeName === "Ma position") {
        throw new Error("Géolocalisation introuvable. Veuillez autoriser l'accès à votre position ou taper une adresse précise.");
    }

    const apiKey = process.env.ORS_API_KEY;

    if (!apiKey) {
        throw new Error("ORS_API_KEY manquante dans le fichier .env");
    }

    const response = await axios.get(
        "https://api.openrouteservice.org/geocode/search",
        {
            params: {
                api_key: apiKey,
                text: placeName.toLowerCase().includes("gironde") ? placeName : `${placeName}, Gironde, France`,
                size: 1,
                "boundary.country": "FR",
                "boundary.circle.lat": 44.8378,
                "boundary.circle.lon": -0.5792,
                "boundary.circle.radius": 100
            }
        }
    );

    const feature = response.data.features && response.data.features[0];

    if (!feature) {
        throw new Error(`Lieu introuvable : ${placeName}`);
    }

    const props = feature.properties;
    
    // Un "fallback" peut être valide si la confiance est haute (ex: 80% pour un lieu-dit ou "venue").
    // On rejette si la confiance globale est trop basse, si le fallback a une confiance moyenne/basse, 
    // ou si on tombe sur une région générique.
    const isGenericRegion = ["region", "country", "macroregion", "county"].includes(props.layer);
    const isBadFallback = props.match_type === "fallback" && props.confidence < 0.8;

    if (isBadFallback || props.confidence < 0.6 || isGenericRegion) {
        throw new Error(`Adresse introuvable ou trop imprécise : ${placeName}. Veuillez préciser davantage.`);
    }

    return feature.geometry.coordinates;
};