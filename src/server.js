const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();

const app = express();

// =========================
// IMPORT DES ROUTES
// =========================
const routeRoutes = require("./routes/routeRoutes");
const authRoutes = require("./routes/auth");       // adapte si chemin différent
const userRoutes = require("./routes/routes_user"); // adapte si chemin différent

// =========================
// MIDDLEWARES
// =========================

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

// =========================
// ROUTE TEST
// =========================
app.get("/", (req, res) => {
    res.json({ message: "IA Mobility backend + Auth running" });
});

// =========================
// ROUTES API
// =========================

// IA Mobility
app.use("/api", routeRoutes);

// Auth
app.use("/auth", authRoutes);

// User
app.use("/user", userRoutes);

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});