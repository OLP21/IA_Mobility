import express from "express"
import { requireAuth } from "../middleware/auth.js"
import { db } from "../db.js"

const router = express.Router()

// =========================
// 👤 PROFIL UTILISATEUR
// =========================

// Infos utilisateur connecté
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT id, email, name, created_at FROM users WHERE id = ?",
      [req.session.userId]
    )

    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: "Erreur récupération profil" })
  }
})


// =========================
// 🚗 TRAJETS
// =========================

// Créer un trajet (avec option sauvegarde)
router.post("/trips", requireAuth, async (req, res) => {
  try {
    const { start, end, save } = req.body

    if (!start || !end) {
      return res.status(400).json({ error: "Départ et arrivée requis" })
    }

    // 👉 ici tu brancheras ton IA plus tard
    const trip = {
      start,
      end,
      duration: Math.floor(Math.random() * 60) + 10 // mock IA
    }

    // Sauvegarde optionnelle
    if (save) {
      await db.execute(
        "INSERT INTO trips (user_id, start_location, end_location, duration) VALUES (?, ?, ?, ?)",
        [req.session.userId, start, end, trip.duration]
      )
    }

    res.json({
      message: save ? "Trajet sauvegardé" : "Trajet calculé sans sauvegarde",
      trip
    })

  } catch (err) {
    res.status(500).json({ error: "Erreur création trajet" })
  }
})


// Voir tous ses trajets
router.get("/trips", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC",
      [req.session.userId]
    )

    res.json(rows)

  } catch (err) {
    res.status(500).json({ error: "Erreur récupération trajets" })
  }
})


// Supprimer un trajet
router.delete("/trips/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params

    await db.execute(
      "DELETE FROM trips WHERE id = ? AND user_id = ?",
      [id, req.session.userId]
    )

    res.json({ message: "Trajet supprimé" })

  } catch (err) {
    res.status(500).json({ error: "Erreur suppression trajet" })
  }
})


// =========================
// 🔐 RGPD / COMPTE
// =========================

// Supprimer son compte
router.delete("/delete", requireAuth, async (req, res) => {
  try {
    await db.execute(
      "DELETE FROM users WHERE id = ?",
      [req.session.userId]
    )

    req.session.destroy()

    res.json({ message: "Compte supprimé définitivement" })

  } catch (err) {
    res.status(500).json({ error: "Erreur suppression compte" })
  }
})


// =========================
// 🔎 TEST AUTH
// =========================

router.get("/profile", requireAuth, (req, res) => {
  res.json({
    message: "Accès autorisé",
    userId: req.session.userId
  })
})

export default router