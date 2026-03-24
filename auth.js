import express from "express"
import argon2 from "argon2"
import { db } from "database" // à modifier

const router = express.Router()

// REGISTER
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Champs manquants" })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Mot de passe trop court (8 caractères min)" })
  }
  
  try {
    const hash = await argon2.hash(password)

    await db.execute(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hash, name]
    )
     res.json({ message: "User created" })

  } catch (err) {
    res.status(500).json({ error: "Error register" })
  }
})


// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: "Champs manquants" })
  }

  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }
    const user = rows[0]
    const valid = await argon2.verify(user.password, password)


    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }
    req.session.userId = user.id
    res.json({ message: "Logged in" })

  } catch (err) {
    res.status(500).json({ error: "Login error" })
  }
})

export default router
