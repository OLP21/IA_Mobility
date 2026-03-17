const routeService = require("../services/routeService");
const geocodeService = require("../services/geocodeService");

exports.getRoute = async (req, res) => {
    try {
        const { origin, destination } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                error: "origin et destination sont obligatoires"
            });
        }

        let originCoords = origin;
        let destinationCoords = destination;

        if (typeof origin === "string") {
            originCoords = await geocodeService.getCoordinates(origin);
        }

        if (typeof destination === "string") {
            destinationCoords = await geocodeService.getCoordinates(destination);
        }

        const result = await routeService.calculateRoute(originCoords, destinationCoords);

        return res.json({
            origin,
            destination,
            originCoords,
            destinationCoords,
            route: result
        });
    } catch (error) {
        console.error("ERREUR CONTROLLER :", error.message);

        if (error.response) {
            console.error("DETAILS API :", error.response.data);
        }

        return res.status(500).json({
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
};