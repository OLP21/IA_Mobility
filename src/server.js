const dotenv = require("dotenv");
dotenv.config();
console.log(`Server running on port ${PORT}`);

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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});