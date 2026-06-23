const pool = require("../config/db");

exports.savePrediction = async (req, res) => {
    try {
        const { parking_name, prediction, confidence } = req.body;

        if (!parking_name || prediction === undefined) {
            return res.status(400).json({ erreur: "Requête invalide : champs manquants." });
        }

        // Récupérer l'ID officiel et la capacité du parking en base de données
        const parkingResult = await pool.query(
            "SELECT id, capacity FROM parkings WHERE name = $1 LIMIT 1",
            [parking_name]
        );

        if (parkingResult.rows.length === 0) {
            return res.status(404).json({ erreur: `Parking '${parking_name}' introuvable en base.` });
        }

        const { id: parking_id, capacity } = parkingResult.rows[0];
        const confidence_score = confidence || 85.0;

        // Calculer les places disponibles prédites à partir du % d'occupation :
        // prediction est le % d'occupation (0 à 100)
        // places_disponibles = capacity * (1 - prediction / 100)
        // Si capacity n'est pas défini, on arrondit prediction comme solution de repli.
        const predicted_available_spots = capacity !== null && capacity !== undefined
            ? Math.max(0, Math.round(capacity * (1 - prediction / 100)))
            : Math.round(prediction);

        // Effectuer l'insertion
        await pool.query(
            `INSERT INTO parking_predictions 
            (parking_id, predicted_available_spots, confidence, prediction_time)
            VALUES ($1, $2, $3, NOW())`,
            [parking_id, predicted_available_spots, confidence_score]
        );

        res.status(201).json({ message: "Prédiction de parking archivée avec succès.", parking_id });
    } catch (err) {
        console.error("Erreur serveur lors de la sauvegarde de prédiction:", err);
        res.status(500).json({ erreur: "Erreur serveur interne" });
    }
};
