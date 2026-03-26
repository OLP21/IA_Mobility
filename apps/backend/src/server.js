const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session"); // Juste ça !
const pool = require("./config/db"); 

dotenv.config();

const app = express();

// IMPORT DES ROUTES
const routeRoutes = require("./routes/routeRoutes");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/routes_user");

// MIDDLEWARES

app.use(express.json());

// CORS
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// SESSION (En mémoire vive, simple et efficace)
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
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});