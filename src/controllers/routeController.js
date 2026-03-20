const routeService = require("../services/routeService");
const geocodeService = require("../services/geocodeService");
const pool = require("../config/db");

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

        console.log("originCoords =", originCoords);
        console.log("destinationCoords =", destinationCoords);

        if (
            !Array.isArray(originCoords) ||
            originCoords.length < 2 ||
            !Array.isArray(destinationCoords) ||
            destinationCoords.length < 2
        ) {
            return res.status(400).json({
                error: "Format invalide pour originCoords ou destinationCoords",
                originCoords,
                destinationCoords
            });
        }

        const routeData = await routeService.calculateRoute(originCoords, destinationCoords);

        const originLng = originCoords[0];
        const originLat = originCoords[1];
        const destinationLng = destinationCoords[0];
        const destinationLat = destinationCoords[1];

        const requestQuery = `
            INSERT INTO route_requests
            (origin_lat, origin_lng, destination_lat, destination_lng, route_summary)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const requestValues = [
            originLat,
            originLng,
            destinationLat,
            destinationLng,
            `Route from ${origin} to ${destination}`
        ];

        const requestResult = await pool.query(requestQuery, requestValues);
        const requestId = requestResult.rows[0].id;

        const resultQuery = `
            INSERT INTO route_results
            (request_id, distance_meters, duration_seconds, geometry, weather_info)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const resultValues = [
            requestId,
            Math.round(routeData.distance_meters),
            Math.round(routeData.duration_seconds),
            routeData.geometry,
            JSON.stringify({})
        ];

        const routeResult = await pool.query(resultQuery, resultValues);

        return res.status(201).json({
            message: "Route calculée et enregistrée",
            origin,
            destination,
            originCoords,
            destinationCoords,
            route: routeData,
            db_request: requestResult.rows[0],
            db_result: routeResult.rows[0]
        });
    } catch (error) {
        console.error("ERREUR CONTROLLER :", error.message);

        if (error.response) {
            console.error("DETAILS API :", error.response.data);
        }

        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }
};
