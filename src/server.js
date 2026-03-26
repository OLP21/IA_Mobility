const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET manquant dans le fichier .env");
}

const app = express();

// =========================
// IMPORT DES ROUTES
// =========================
const routeRoutes = require("./routes/routeRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/routes_user");

// =========================
// MIDDLEWARES
// =========================

// JSON
app.use(express.json());

// CORS
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// SESSION
app.use(session({
    secret: process.env.SESSION_SECRET,
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
app.use("/api", routeRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});