const express = require("express");
const { requireAuth } = require("../middleware");
const db = require("../config/db");

const router = express.Router();

// =========================
// PROFIL UTILISATEUR
// =========================

// Infos utilisateur connecté
router.get("/me", requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, email, firstname, lastname, created_at FROM users WHERE id = $1",
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
        const { start, end, save } = req.body;

        if (!start || !end) {
            return res.status(400).json({ error: "Départ et arrivée requis" });
        }

        // mock temporaire en attendant l'IA
        const trip = {
            start,
            end,
            duration: Math.floor(Math.random() * 60) + 10
        };

        // Sauvegarde optionnelle
        if (save) {
            await db.query(
                "INSERT INTO trips (user_id, start_location, end_location, duration) VALUES ($1, $2, $3, $4)",
                [req.session.userId, start, end, trip.duration]
            );
        }

        res.json({
            message: save ? "Trajet sauvegardé" : "Trajet calculé sans sauvegarde",
            trip
        });
    } catch (err) {
        console.error("CREATE TRIP ERROR:", err);
        res.status(500).json({ error: "Erreur création trajet" });
    }
});

// Mettre à jour le statut d'un trajet (choisir, en cours, terminé)
router.put("/trips/:id/status", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, chosen_route_id } = req.body;

        if (!status) {
            return res.status(400).json({ error: "Statut requis" });
        }

        const validStatuses = ['searched', 'en_cours', 'termine', 'annule'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Statut invalide" });
        }

        const query = `
            UPDATE trips 
            SET status = $1, 
                chosen_route_id = COALESCE($2, chosen_route_id) 
            WHERE id = $3 AND user_id = $4 
            RETURNING id, status, chosen_route_id
        `;
        
        const result = await db.query(query, [status, chosen_route_id || null, id, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trajet introuvable" });
        }

        res.json({ message: "Statut mis à jour", trip: result.rows[0] });
    } catch (err) {
        console.error("UPDATE STATUS ERROR:", err);
        res.status(500).json({ error: "Erreur mise à jour statut" });
    }
});

// Voir tous ses trajets
router.get("/trips", requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                t.id, 
                t.departure_time AS created_at,
                t.status,
                t.chosen_route_id,
                l1.address AS start_location,
                l2.address AS end_location,
                o.duration,
                o.distance,
                o.score
            FROM trips t
            JOIN locations l1 ON t.start_location_id = l1.id
            JOIN locations l2 ON t.end_location_id = l2.id
            LEFT JOIN optimized_routes o ON o.id = t.chosen_route_id
            WHERE t.user_id = $1 AND t.status IN ('en_cours', 'termine')
            ORDER BY t.departure_time DESC`,
            [req.session.userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error("GET TRIPS ERROR:", err);
        res.status(500).json({ error: "Erreur récupération trajets" });
    }
});

// Effacer tout l'historique (RGPD - droit à l'oubli partiel)
// DOIT être avant /trips/:id sinon Express traite "all" comme un id
router.delete("/trips/all", requireAuth, async (req, res) => {
    try {
        await db.query(
            "DELETE FROM trips WHERE user_id = $1",
            [req.session.userId]
        );
        res.json({ message: "Historique effacé" });
    } catch (err) {
        console.error("CLEAR HISTORY ERROR:", err);
        res.status(500).json({ error: "Erreur suppression historique" });
    }
});

// Supprimer un trajet individuel
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