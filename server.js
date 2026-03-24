import express from "express"
import cors from "cors"
import session from "express-session"
import dotenv from "dotenv"

// IMPORT TES ROUTES
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/routes_user.js"

dotenv.config()

const app = express()

// =========================
// MIDDLEWARES
// =========================

// Lire le JSON
app.use(express.json())

// CORS (important pour le frontend)
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

// Sessions (OBLIGATOIRE pour ton auth)
app.use(session({
  secret: "supersecret", // à mettre dans .env plus tard
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true
  }
}))

// =========================
// ROUTES
// =========================

app.use("/auth", authRoutes)
app.use("/user", userRoutes)

// =========================
// SERVER
// =========================

const PORT = 3001

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})