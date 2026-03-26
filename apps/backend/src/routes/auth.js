const express = require("express");
const argon2 = require("argon2");
const db = require("../config/db"); 


const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Champs manquants" });
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: "Mot de passe trop court (8 caractères min)"
        });
    }

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await db.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: "Email déjà utilisé" });
        }

        const hash = await argon2.hash(password);

        await db.query(
            "INSERT INTO users (email, password, name) VALUES ($1, $2, $3)",
            [email, hash, name || null]
        );

        res.status(201).json({ message: "User created" });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ error: "Error register" });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Champs manquants" });
    }

    try {
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];
        const valid = await argon2.verify(user.password, password);

        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.userId = user.id;

        res.json({
            message: "Logged in",
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Login error" });
    }
});

// LOGOUT
router.post("/logout", (req, res) => {
    if (!req.session) {
        return res.status(200).json({ message: "Logged out" });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.status(500).json({ error: "Logout error" });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out" });
    });
});

module.exports = router;