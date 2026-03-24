import express from "express"
import { requireAuth } from "auth" // à modifier

const router = express.Router()
router.get("/profile", requireAuth, (req, res) => {

  res.json({
    message: "Accès autorisé",
    userId: req.session.userId
  })

})

export default router