const dotenv = require("dotenv");
dotenv.config();
console.log("DB_HOST =", process.env.DB_HOST);
console.log("DB_PORT =", process.env.DB_PORT);
console.log("DB_NAME =", process.env.DB_NAME);
console.log("DB_USER =", process.env.DB_USER);
console.log("DB_PASSWORD =", process.env.DB_PASSWORD);

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const routeRoutes = require("./routes/routeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "IA Mobility backend running" });
});

app.use("/api", routeRoutes);

app.post("/routes", async (req, res) => {
  try {
    const {
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng,
      route_summary
    } = req.body;

    const query = `
      INSERT INTO route_requests
      (origin_lat, origin_lng, destination_lat, destination_lng, route_summary)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng,
      route_summary
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Requête d’itinéraire enregistrée avec succès",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Erreur insertion route_requests :", error);
    res.status(500).json({
      error: "Erreur serveur",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});