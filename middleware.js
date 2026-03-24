export function requireAuth(req, res, next) {

  // 1. Vérifier si session existe
  if (!req.session) {
    return res.status(500).json({ error: "Session non configurée" })
  }

  // 2. Vérifier si utilisateur connecté
  if (!req.session.userId) {
    return res.status(401).json({ error: "Non autorisé" })
  }

  // 4. Continuer
  next()
}