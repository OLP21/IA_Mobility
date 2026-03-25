const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const routeRoutes = require("./routes/routeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Route test
app.get("/", (req, res) => {
    res.json({ message: "IA Mobility backend running" });
});

// Routes API
app.use("/api", routeRoutes);

// ⚠️ PORT AVANT utilisation
const PORT = process.env.PORT || 3000;

// Lancer serveur
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});