const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();

const app = express();

// IMPORT DES ROUTES
const routeRoutes = require("./routes/routeRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/routes_user");

// MIDDLEWARES

// JSON
app.use(express.json());

// CORS (frontend + credentials pour session)
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// SESSION (important pour auth)
app.use(session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true
    }
}));

// Route test
app.get("/", (req, res) => {
    res.json({ message: "IA Mobility backend running + Auth running" });
});

// Routes API
app.use("/api", routeRoutes);

// Auth
app.use("/auth", authRoutes);

// User
app.use("/user", userRoutes);

// ⚠️ PORT AVANT utilisation
const PORT = process.env.PORT || 3000;

// Lancer serveur
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});