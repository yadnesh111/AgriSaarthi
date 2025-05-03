// ✅ src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import { useLanguage } from "../components/LanguageContext";
import { Link } from "react-router-dom";
import axios from "axios";
import styles from "./Home.module.css";

const Home = () => {
  const { t, language, setLanguage } = useLanguage();
  const [weather, setWeather] = useState(null);
  const [showForecast, setShowForecast] = useState(false);

  const API_KEY = "f75565b9988a8326c5f73ec0301f364d"; // your API key

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(fetchWeather, handleError);
    } else {
      console.error("Geolocation is not supported.");
    }
  }, [language]);

  const fetchWeather = async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast`,
        {
          params: {
            lat: latitude,
            lon: longitude,
            units: "metric",
            lang: language,
            appid: API_KEY,
          },
        }
      );
      setWeather(res.data);
    } catch (err) {
      console.error("Error fetching weather:", err);
    }
  };

  const handleError = (error) => {
    console.error("Location error:", error);
  };

  const translateWeather = (text) => {
    if (!text) return "";
    if (language === "hi") {
      return text
        .replace("Clear", "साफ़")
        .replace("Clouds", "बादल")
        .replace("Rain", "बारिश");
    } else if (language === "mr") {
      return text
        .replace("Clear", "स्वच्छ")
        .replace("Clouds", "ढग")
        .replace("Rain", "पाऊस");
    } else {
      return text;
    }
  };

  const getDailyForecast = () => {
    if (!weather) return [];
    const daily = {};
    weather.list.forEach((item) => {
      const date = item.dt_txt.split(" ")[0];
      if (!daily[date] && item.dt_txt.includes("12:00:00")) {
        daily[date] = item;
      }
    });
    return Object.values(daily).slice(0, 5);
  };

  return (
    <div className="position-relative">
      <div className={styles.backgroundImage}></div>

      <div className="container py-5 mt-3">
        {/* Language Selector */}
        <div className="d-flex justify-content-end mb-4">
          <div>
            <label htmlFor="lang" className="form-label fw-medium">
              🌐 {t.selectLanguage}
            </label>
            <select
              id="lang"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="form-select w-auto"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>
        </div>

        {/* Main Layout (Weather + Home Buttons) */}
        <div className="row">
          {/* Weather Left Box */}
          <div className="col-md-4 mb-4">
            {weather && (
              <div className="text-center text-black fw-bold">
                <h3>{Math.round(weather.list[0].main.temp)}°C</h3>
                <p className="mb-1">
                  {weather.city.name}, {weather.city.country}
                </p>
                <p className="small">
                  {translateWeather(weather.list[0].weather[0].main)}
                </p>
                <button
                  onClick={() => setShowForecast(!showForecast)}
                  className="btn btn-outline-dark btn-sm mt-2"
                >
                  📅 Forecast
                </button>

                {/* Forecast Popup */}
                {showForecast && (
                  <div
                    className="card mt-3 p-2"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
                  >
                    <h6 className="text-dark fw-bold mb-2">
                      {language === "hi"
                        ? "5 दिन का पूर्वानुमान"
                        : language === "mr"
                        ? "५ दिवसाचा अंदाज"
                        : "5 Day Forecast"}
                    </h6>
                    {getDailyForecast().map((day, idx) => (
                      <div
                        key={idx}
                        className="d-flex justify-content-between small my-1 text-dark"
                      >
                        <span>{new Date(day.dt_txt).toLocaleDateString()}</span>
                        <span>
                          {Math.round(day.main.temp)}°C /{" "}
                          {translateWeather(day.weather[0].main)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Home Main Section */}
          <div className="col-md-8">
            <div className="text-center mb-4">
              <h2 className="display-5 fw-bold mb-3">🌿 {t.welcome}</h2>
              <p className="lead text-muted">{t.tagline}</p>
            </div>

            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link to="/diagnosis" className="btn btn-success shadow">
                🩺 {t.diagnosis}
              </Link>
              <Link to="/mandi-rates" className="btn btn-primary shadow">
                🛒 {t.mandi}
              </Link>
              <Link to="/loan-info" className="btn btn-secondary shadow">
                💸 {t.loan}
              </Link>
              <Link
                to="/fertilizer-advice"
                className="btn btn-warning text-white shadow"
              >
                💊 {t.fertilizer}
              </Link>
              {/* ✅ NEW KRISHI CALENDAR BUTTON */}
              <Link to="/krishi-calendar" className="btn btn-info shadow">
                📅 {t.calendar ? t.calendar : "Krishi Calendar"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
