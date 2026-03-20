const routeService = require("../services/routeService");
const geocodeService = require("../services/geocodeService");
const pool = require("../config/db");
const weatherService = require("../services/weatherService");
// ==========================
// POST /api/route
// ==========================
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

        // Géocodage si texte
        if (typeof origin === "string") {
            originCoords = await geocodeService.getCoordinates(origin);
        }

        if (typeof destination === "string") {
            destinationCoords = await geocodeService.getCoordinates(destination);
        }

        // Calcul itinéraire
        const routeData = await routeService.calculateRoute(
            originCoords,
            destinationCoords
        );

        const weather = await weatherService.getWeather(
            originCoords[1],
            originCoords[0]
        );

        // ==========================
        // INSERT route_requests
        // ==========================
        const requestQuery = `
            INSERT INTO route_requests
            (origin_lat, origin_lng, destination_lat, destination_lng, route_summary)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;

        const requestValues = [
            originCoords[1], // lat
            originCoords[0], // lng
            destinationCoords[1],
            destinationCoords[0],
            `Route from ${origin} to ${destination}`
        ];

        const requestResult = await pool.query(requestQuery, requestValues);
        const requestId = requestResult.rows[0].id;

        // ==========================
        // INSERT route_results
        // ==========================
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
            JSON.stringify(weather)
        ];

        const routeResult = await pool.query(resultQuery, resultValues);

        // ==========================
        // RESPONSE
        // ==========================
        return res.status(201).json({
            message: "Route calculée et enregistrée",
            origin,
            destination,
            originCoords,
            destinationCoords,
            route: {
                distance_meters: routeData.distance_meters,
                duration_seconds: routeData.duration_seconds
            },
            weather: weather,
            request_id: requestId
        });

    } catch (error) {
        console.error("ERREUR CONTROLLER :", error.message);

        if (error.response) {
            console.error("DETAILS API :", error.response.data);
        }

        return res.status(500).json({
            error: "Erreur serveur",
            details: error.response ? error.response.data : error.message
        });
    }
};

// ==========================
// GET /api/routes
// ==========================
exports.getRoutesHistory = async (req, res) => {
    try {
        const query = `
            SELECT
                rr.id,
                rr.origin_lat,
                rr.origin_lng,
                rr.destination_lat,
                rr.destination_lng,
                rr.route_summary,
                rr.created_at,
                rres.distance_meters,
                rres.duration_seconds,
                rres.weather_info
            FROM route_requests rr
            LEFT JOIN route_results rres
                ON rr.id = rres.request_id
            ORDER BY rr.created_at DESC
            LIMIT 10;
        `;

        const result = await pool.query(query);

        return res.status(200).json({
            message: "Historique récupéré avec succès",
            count: result.rows.length,
            data: result.rows
        });

    } catch (error) {
        console.error("ERREUR HISTORIQUE :", error.message);

        return res.status(500).json({
            error: "Erreur serveur",
            details: error.message
        });
    }
};