const axios = require("axios");

exports.getWeather = async (lat, lng) => {
    const apiKey = process.env.WEATHER_API_KEY;

    if (!apiKey) {
        throw new Error("WEATHER_API_KEY manquante");
    }

    const response = await axios.get(
        "https://api.openweathermap.org/data/2.5/weather",
        {
            params: {
                lat: lat,
                lon: lng,
                appid: apiKey,
                units: "metric"
            }
        }
    );

    return {
        temperature: response.data.main.temp,
        description: response.data.weather[0].description,
        city: response.data.name
    };
};