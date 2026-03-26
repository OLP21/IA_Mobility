const tripAnalysisService = require("../services/tripAnalysisService");
const pool = require("../config/db");

// POST /api/route
exports.getRoute = async (req, res) => {
    try {
        const { origin, destination, maxRoutes } = req.body;

        if (!origin || !destination) {
            return res.status(400).json({
                success: false,
                error: "Les champs origin et destination sont requis"
            });
        }

        if (
            maxRoutes !== undefined &&
            (!Number.isInteger(maxRoutes) || maxRoutes <= 0)
        ) {
            return res.status(400).json({
                success: false,
                error: "maxRoutes doit être un entier positif"
            });
        }

        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                error: "Non autorisé"
            });
        }

        const tripData = await tripAnalysisService.analyzeTrip(
            origin,
            destination,
            maxRoutes
        );

        const requestQuery = `
            INSERT INTO route_requests
            (user_id, origin_lat, origin_lng, destination_lat, destination_lng, route_summary)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const requestValues = [
            req.session.userId,
            tripData.originCoords[1],
            tripData.originCoords[0],
            tripData.destinationCoords[1],
            tripData.destinationCoords[0],
            `Routes from ${origin} to ${destination}`
        ];

        const requestResult = await pool.query(requestQuery, requestValues);
        const requestId = requestResult.rows[0].id;

        const savedRoutes = [];

        for (const routeData of tripData.routes) {
            const resultQuery = `
                INSERT INTO route_results
                (request_id, distance_meters, duration_seconds, geometry, weather_info, analysis, traffic_info)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;
            `;

            const resultValues = [
                requestId,
                Math.round(routeData.distance_meters),
                Math.round(routeData.duration_seconds),
                JSON.stringify(routeData.geometry),
                JSON.stringify(tripData.weather),
                JSON.stringify(routeData.analysis),
                JSON.stringify(routeData.traffic)
            ];

            const routeResult = await pool.query(resultQuery, resultValues);

            savedRoutes.push({
                result_id: routeResult.rows[0].id,
                route_index: routeData.route_index,
                distance_meters: Math.round(routeData.distance_meters),
                duration_seconds: Math.round(routeData.duration_seconds),
                analysis: routeData.analysis,
                traffic: routeData.traffic
            });
        }

        return res.status(201).json({
            success: true,
            message: "Trajets calculés et analysés avec succès",
            data: {
                user_id: req.session.userId,
                request_id: requestId,
                origin: tripData.origin,
                destination: tripData.destination,
                originCoords: tripData.originCoords,
                destinationCoords: tripData.destinationCoords,
                weather: tripData.weather,
                traffic: tripData.traffic,
                routes_count: savedRoutes.length,
                requested_max_routes: tripData.requested_max_routes,
                routes: savedRoutes
            }
        });
    } catch (error) {
        console.error("ERREUR CONTROLLER getRoute :", error.message);

        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors du calcul du trajet",
            details: error.message
        });
    }
};

// GET /api/routes
exports.getRoutesHistory = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                error: "Non autorisé"
            });
        }

        const query = `
            SELECT
                rr.id,
                rr.user_id,
                rr.origin_lat,
                rr.origin_lng,
                rr.destination_lat,
                rr.destination_lng,
                rr.route_summary,
                rr.created_at,
                rres.id AS result_id,
                rres.distance_meters,
                rres.duration_seconds,
                rres.weather_info,
                rres.analysis,
                rres.traffic_info
            FROM route_requests rr
            LEFT JOIN route_results rres
                ON rr.id = rres.request_id
            WHERE rr.user_id = $1
            ORDER BY rr.created_at DESC, rres.id ASC;
        `;

        const result = await pool.query(query, [req.session.userId]);
        const historyMap = new Map();

        for (const row of result.rows) {
            if (!historyMap.has(row.id)) {
                historyMap.set(row.id, {
                    id: row.id,
                    user_id: row.user_id,
                    route_summary: row.route_summary,
                    created_at: row.created_at,
                    originCoords: [row.origin_lng, row.origin_lat],
                    destinationCoords: [row.destination_lng, row.destination_lat],
                    weather: row.weather_info,
                    routes: []
                });
            }

            if (row.result_id) {
                historyMap.get(row.id).routes.push({
                    result_id: row.result_id,
                    distance_meters: row.distance_meters,
                    duration_seconds: row.duration_seconds,
                    analysis: row.analysis,
                    traffic: row.traffic_info
                });
            }
        }

        const formattedData = Array.from(historyMap.values()).map((item) => ({
            ...item,
            routes_count: item.routes.length,
            traffic: item.routes.length > 0 ? item.routes[0].traffic : null
        }));

        return res.status(200).json({
            success: true,
            message: "Historique récupéré avec succès",
            data: formattedData,
            count: formattedData.length
        });
    } catch (error) {
        console.error("ERREUR CONTROLLER getRoutesHistory :", error.message);

        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la récupération de l'historique",
            details: error.message
        });
    }
};

// GET /api/routes/:id
exports.getRouteById = async (req, res) => {
    try {
        const routeRequestId = parseInt(req.params.id, 10);

        if (isNaN(routeRequestId)) {
            return res.status(400).json({
                success: false,
                error: "ID de trajet invalide"
            });
        }

        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                error: "Non autorisé"
            });
        }

        const query = `
            SELECT
                rr.id,
                rr.user_id,
                rr.origin_lat,
                rr.origin_lng,
                rr.destination_lat,
                rr.destination_lng,
                rr.route_summary,
                rr.created_at,
                rres.id AS result_id,
                rres.distance_meters,
                rres.duration_seconds,
                rres.weather_info,
                rres.analysis,
                rres.traffic_info
            FROM route_requests rr
            LEFT JOIN route_results rres
                ON rr.id = rres.request_id
            WHERE rr.id = $1 AND rr.user_id = $2
            ORDER BY rres.id ASC;
        `;

        const result = await pool.query(query, [routeRequestId, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Trajet introuvable"
            });
        }

        const firstRow = result.rows[0];

        const routeDetails = {
            id: firstRow.id,
            user_id: firstRow.user_id,
            route_summary: firstRow.route_summary,
            created_at: firstRow.created_at,
            originCoords: [firstRow.origin_lng, firstRow.origin_lat],
            destinationCoords: [firstRow.destination_lng, firstRow.destination_lat],
            weather: firstRow.weather_info,
            traffic: firstRow.traffic_info,
            routes: []
        };

        for (const row of result.rows) {
            if (row.result_id) {
                routeDetails.routes.push({
                    result_id: row.result_id,
                    distance_meters: row.distance_meters,
                    duration_seconds: row.duration_seconds,
                    analysis: row.analysis,
                    traffic: row.traffic_info
                });
            }
        }

        routeDetails.routes_count = routeDetails.routes.length;

        return res.status(200).json({
            success: true,
            message: "Trajet récupéré avec succès",
            data: routeDetails
        });
    } catch (error) {
        console.error("ERREUR CONTROLLER getRouteById :", error.message);

        return res.status(500).json({
            success: false,
            error: "Erreur serveur lors de la récupération du trajet",
            details: error.message
        });
    }
};