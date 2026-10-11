const axios = require("axios");

async function getTraffic(lat, lon) {
    const apiKey = process.env.HERE_API_KEY;

    if (!apiKey) {
        return null;
    }

    try {
        const url = "https://data.traffic.hereapi.com/v7/flow";

        const response = await axios.get(url, {
            params: {
                apiKey,
                in: `circle:${lat},${lon};r=1000`,
                locationReferencing: "shape"
            }
        });

        const flows = response.data?.results;

        if (!flows || flows.length === 0) {
            return null;
        }

        const flow = flows[0];
        const currentFlow = flow.currentFlow || {};

        const jamFactor = currentFlow.jamFactor ?? null;
        const speed = currentFlow.speed ?? null;
        const freeFlowSpeed = currentFlow.freeFlow ?? null;

        let congestion_level = "unknown";

        if (jamFactor !== null) {
            if (jamFactor < 4) congestion_level = "low";
            else if (jamFactor < 8) congestion_level = "medium";
            else congestion_level = "high";
        }

        return {
            jam_factor: jamFactor,
            speed,
            free_flow_speed: freeFlowSpeed,
            congestion_level
        };
    } catch (error) {
        console.error("Erreur HERE traffic:", error.response?.data || error.message);
        return null;
    }
}

module.exports = { getTraffic };