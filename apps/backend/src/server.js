const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./config/db");

dotenv.config();

const app = express();

// IMPORT DES ROUTES
const routeRoutes = require("./routes/routeRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/routes_user");
const parkingRoutes = require("./routes/parkingRoutes");

// MIDDLEWARES

app.use(express.json());

// CORS
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// SESSION (stockée en PostgreSQL pour persister les refresh et redémarrages)
app.use(session({
    store: new pgSession({
        pool,               // réutilise le pool PG existant
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 jours
    }
}));

// Route test
app.get("/", (req, res) => {
    res.json({ message: "IA Mobility backend running + Auth running" });
});

// Routes API
app.use("/api", routeRoutes);
app.use("/api/parkings", parkingRoutes);
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});