const pool = require("./config/db");

async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Connexion PostgreSQL réussie !");
    console.log("Heure serveur :", result.rows[0]);
  } catch (error) {
    console.error("Erreur de connexion à PostgreSQL :", error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseConnection();