const routeService = require("../services/routeService");
const geocodeService = require("../services/geocodeService");
const weatherService = require("../services/weatherService");
const aiService = require("../services/aiService");
const pool = require("../config/db");

// POST /api/route
exports.getRoute = async (req, res) => {
    try {
        const { origin, destination, maxRoutes } = req.body;
        const requestedMaxRoutes = Math.min(Math.max(parseInt(maxRoutes) || 3, 1), 5);

        if (!origin || !destination) {
            return res.status(400).json({ error: "origin et destination sont obligatoires" });
        }

        // 1. Géocodage
        const originCoords = typeof origin === "string" ? await geocodeService.getCoordinates(origin) : origin;
        const destinationCoords = typeof destination === "string" ? await geocodeService.getCoordinates(destination) : destination;

        // 2. Services externes (Météo et Itinéraires)
        const weather = await weatherService.getWeather(originCoords[1], originCoords[0]);
        const routesData = await routeService.calculateRoutes(originCoords, destinationCoords, requestedMaxRoutes);

        // --- DEBUT TRANSACTION SQL ---
        // 3. Insérer le point de DÉPART dans 'locations'
        const startLocRes = await pool.query(
            "INSERT INTO locations (address, latitude, longitude) VALUES ($1, $2, $3) RETURNING id",
            [typeof origin === "string" ? origin : "Point de départ", originCoords[1], originCoords[0]]
        );
        const startLocId = startLocRes.rows[0].id;

        // 4. Insérer le point d'ARRIVÉE dans 'locations'
        const endLocRes = await pool.query(
            "INSERT INTO locations (address, latitude, longitude) VALUES ($1, $2, $3) RETURNING id",
            [typeof destination === "string" ? destination : "Destination", destinationCoords[1], destinationCoords[0]]
        );
        const endLocId = endLocRes.rows[0].id;

        // 5. Créer le trajet dans 'trips' lié aux deux locations
        const tripRes = await pool.query(
            "INSERT INTO trips (start_location_id, end_location_id, departure_time) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING id",
            [startLocId, endLocId]
        );
        const tripId = tripRes.rows[0].id;

        const analyzedRoutes = [];

        // 6. Analyser et insérer chaque variante de route
        for (const routeData of routesData) {
            const analysis = aiService.analyzeRoute(routeData, weather);

            const routeQuery = `
                INSERT INTO optimized_routes (trip_id, duration, distance, traffic_level, weather_condition, score)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id;
            `;

            const routeValues = [
                tripId,
                Math.round(routeData.duration_seconds || routeData.duration),
                Math.round(routeData.distance_meters || routeData.distance),
                analysis.risk_level || 'medium',
                weather.description,
                analysis.score
            ];

            const routeResult = await pool.query(routeQuery, routeValues);

            analyzedRoutes.push({
                result_id: routeResult.rows[0].id,
                route_index: routeData.route_index,
                analysis
            });
        }

        // À la fin de ton bloc try dans routeController.js
        return res.status(201).json({
            message: "Trajet et lieux enregistrés avec succès",
            trip_id: tripId,
            originCoords: originCoords,       // <--- AJOUTE CETTE LIGNE
            destinationCoords: destinationCoords, // <--- AJOUTE CETTE LIGNE
            weather: weather,
            routes: analyzedRoutes
        });

    } catch (error) {
        console.error("ERREUR SQL :", error.message);
        return res.status(500).json({ error: "Erreur serveur", details: error.message });
    }
};

// GET /api/routes (Historique avec JOINTURES)
exports.getRoutesHistory = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.id as trip_id,
                loc_start.address as origin,
                loc_end.address as destination,
                t.departure_time,
                opt.distance,
                opt.duration,
                opt.score
            FROM trips t
            JOIN locations loc_start ON t.start_location_id = loc_start.id
            JOIN locations loc_end ON t.end_location_id = loc_end.id
            JOIN optimized_routes opt ON t.id = opt.trip_id
            ORDER BY t.departure_time DESC
            LIMIT 20;
        `;
        const result = await pool.query(query);
        return res.status(200).json({ count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error("ERREUR HISTORIQUE :", error.message);
        return res.status(500).json({ error: error.message });
    }
};