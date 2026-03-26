const express = require("express");
const { requireAuth } = require("../middleware");
const db = require("../config/db");
const tripAnalysisService = require("../services/tripAnalysisService");

const router = express.Router();

// =========================
// PROFIL UTILISATEUR
// =========================

// Infos utilisateur connecté
router.get("/me", requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, email, name, created_at FROM users WHERE id = $1",
            [req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Utilisateur introuvable" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("ME ERROR:", err);
        res.status(500).json({ error: "Erreur récupération profil" });
    }
});

// =========================
// TRAJETS
// =========================

// Créer un trajet (avec option sauvegarde)
router.post("/trips", requireAuth, async (req, res) => {
    try {
        const { start, end, save, maxRoutes } = req.body;

        if (!start || !end) {
            return res.status(400).json({ error: "Départ et arrivée requis" });
        }

        const tripData = await tripAnalysisService.analyzeTrip(
            start,
            end,
            maxRoutes
        );

        if (!tripData.routes || tripData.routes.length === 0) {
            return res.status(404).json({ error: "Aucun trajet trouvé" });
        }

        const bestRoute = tripData.routes[0];

        const trip = {
            start,
            end,
            originCoords: tripData.originCoords,
            destinationCoords: tripData.destinationCoords,
            weather: tripData.weather,
            distance: Math.round(bestRoute.distance_meters),
            duration: Math.round(bestRoute.duration_seconds),
            score: bestRoute.analysis.score,
            risk_level: bestRoute.analysis.risk_level,
            routes_count: tripData.routes_count,
            routes: tripData.routes
        };

        if (save) {
            await db.query(
                `INSERT INTO trips (
                    user_id,
                    start_location,
                    end_location,
                    duration,
                    distance,
                    score,
                    risk_level,
                    weather_info,
                    origin_lat,
                    origin_lng,
                    destination_lat,
                    destination_lng
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    req.session.userId,
                    start,
                    end,
                    trip.duration,
                    trip.distance,
                    trip.score,
                    trip.risk_level,
                    JSON.stringify(trip.weather),
                    trip.originCoords[1],
                    trip.originCoords[0],
                    trip.destinationCoords[1],
                    trip.destinationCoords[0]
                ]
            );
        }

        res.json({
            message: save ? "Trajet IA sauvegardé" : "Trajet IA calculé",
            trip
        });
    } catch (err) {
        console.error("CREATE TRIP ERROR:", err.message);
        res.status(500).json({
            error: "Erreur création trajet",
            details: err.message
        });
    }
});

// Voir tous ses trajets
router.get("/trips", requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT
                id,
                start_location,
                end_location,
                duration,
                distance,
                score,
                risk_level,
                weather_info,
                origin_lat,
                origin_lng,
                destination_lat,
                destination_lng,
                created_at
             FROM trips
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [req.session.userId]
        );

        const trips = result.rows.map((trip) => ({
            id: trip.id,
            start: trip.start_location,
            end: trip.end_location,
            duration: trip.duration,
            distance: trip.distance,
            score: trip.score,
            risk_level: trip.risk_level,
            weather: trip.weather_info,
            originCoords: [trip.origin_lng, trip.origin_lat],
            destinationCoords: [trip.destination_lng, trip.destination_lat],
            created_at: trip.created_at
        }));

        res.json({
            count: trips.length,
            trips
        });
    } catch (err) {
        console.error("GET TRIPS ERROR:", err);
        res.status(500).json({ error: "Erreur récupération trajets" });
    }
});

// Supprimer un trajet
router.delete("/trips/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            "DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING id",
            [id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trajet introuvable" });
        }

        res.json({ message: "Trajet supprimé" });
    } catch (err) {
        console.error("DELETE TRIP ERROR:", err);
        res.status(500).json({ error: "Erreur suppression trajet" });
    }
});

// =========================
// RGPD / COMPTE
// =========================

// Supprimer son compte
router.delete("/delete", requireAuth, async (req, res) => {
    try {
        await db.query(
            "DELETE FROM users WHERE id = $1",
            [req.session.userId]
        );

        req.session.destroy((err) => {
            if (err) {
                console.error("SESSION DESTROY ERROR:", err);
                return res.status(500).json({ error: "Erreur suppression session" });
            }

            res.json({ message: "Compte supprimé définitivement" });
        });
    } catch (err) {
        console.error("DELETE ACCOUNT ERROR:", err);
        res.status(500).json({ error: "Erreur suppression compte" });
    }
});

// =========================
// TEST AUTH
// =========================

router.get("/profile", requireAuth, (req, res) => {
    res.json({
        message: "Accès autorisé",
        userId: req.session.userId
    });
});

module.exports = router;