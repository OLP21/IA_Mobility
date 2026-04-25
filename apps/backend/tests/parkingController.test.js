const parkingController = require('../src/controllers/parkingController');

// Mock global pour le pool de base de données si nécessaire
jest.mock('../src/config/db', () => ({
    query: jest.fn()
}));

describe("API REST des Parkings", () => {
    it("doit renvoyer une erreur 400 si les paramètres obligatoires sont absents", async () => {
        // Mock de la requête REST (nom_parking manquant)
        const req = { body: { prediction: 85 } }; // Pas de parking_name
        
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Act
        await parkingController.savePrediction(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ erreur: "Requête invalide : champs manquants." });
    });
});
