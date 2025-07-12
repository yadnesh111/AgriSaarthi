import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useLanguage } from "../components/LanguageContext";
import html2pdf from "html2pdf.js";
import "../styles/calendarColors.css";

// Initialize localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const KrishiCalendar = () => {
  const { language } = useLanguage();
  const calendarRef = useRef(null);

  // State for form inputs
  const [formData, setFormData] = useState({
    crop: "",
    sowingDate: "",
    soilType: "",
    farmSize: "",
    location: "",
  });

  // State for calendar events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarText, setCalendarText] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [imageFile, setImageFile] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Assign class names based on event type
  const getEventClass = (title) => {
    const task = title.toLowerCase();
    if (task.includes("rain")) return "event-rain";
    if (task.includes("harvest") || task.includes("harvesting"))
      return "event-harvest";
    if (
      task.includes("fertilizer") ||
      task.includes("pesticide") ||
      task.includes("water")
    )
      return "event-green";
    return "event-default";
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setEvents([]);
    setCalendarText("");
    try {
      const res = await axios.post(
        "https://agrisaarthibackend.onrender.com/generate-calendar",
        {
          ...formData,
          language,
        }
      );
      const text = res.data.calendar;
      setCalendarText(text);

      // Parse the calendar text into events
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      const newEvents = [];

      for (const line of lines) {
        const match = line.match(/(\w+\s\d{1,2},\s\d{4}):\s*(.*)/);
        if (match) {
          const date = moment(match[1], "MMMM D, YYYY").toDate();
          const task = match[2];

          // Generate recommendations, milestones, and weather forecast
          const fertilizer = getFertilizerRecommendation(task);
          const pesticide = getPesticideRecommendation(task);
          const milestones = getMilestones(task);
          const weatherForecast = await getWeatherForecast(
            formData.location,
            date
          );

          newEvents.push({
            title: task,
            start: date,
            end: date,
            allDay: true,
            className: getEventClass(task),
            fertilizer,
            pesticide,
            weatherForecast,
            milestones,
          });
        }
      }
      setEvents(newEvents);
    } catch (error) {
      console.error("Error generating calendar:", error);
      alert("Failed to generate calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Example fertilizer recommendation based on task
  const getFertilizerRecommendation = (task) => {
    if (task.toLowerCase().includes("fertilizer"))
      return "Urea - 50kg per hectare";
    if (task.toLowerCase().includes("growth stage"))
      return "No fertilizer needed";
    return "Standard fertilizer schedule";
  };

  // Example pesticide recommendation
  const getPesticideRecommendation = (task) => {
    if (task.toLowerCase().includes("pesticide"))
      return "Malathion - 200ml per hectare";
    return "No pesticide needed";
  };

  // Example milestones based on task
  const getMilestones = (task) => {
    if (task.toLowerCase().includes("flowering"))
      return ["Flowering stage expected", "Signs: Buds forming"];
    if (task.toLowerCase().includes("harvest"))
      return ["Harvest window opens", "Signs: Ripening grains"];
    return [];
  };

  // Fetch weather forecast using OpenWeatherMap API
  const getWeatherForecast = async (location, date) => {
    const apiKey = "f75565b9988a8326c5f73ec0301f364d"; // Replace with your API key
    const today = new Date();
    const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || diffDays > 7) {
      return "Weather forecast available for next 7 days only.";
    }

    try {
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
          location
        )}&units=metric&appid=${apiKey}`
      );
      // Get forecast for the specific date/time (approximate)
      const forecast = res.data.list.find((item) =>
        moment(item.dt_txt).isSame(date, "day")
      );
      if (forecast) {
        return `${forecast.weather[0].description}, ${forecast.main.temp}°C`;
      }
      return "Weather data not available.";
    } catch (err) {
      console.error("Weather API error:", err);
      return "Weather data not available.";
    }
  };

  // Handle image upload for growth stage detection
  const handleImageUpload = async () => {
    if (!imageFile) {
      alert("Please select an image first!");
      return;
    }
    const formDataObj = new FormData();
    formDataObj.append("image", imageFile);
    try {
      const res = await axios.post(
        "https://agrisaarthibackend.onrender.com/upload-crop-photo",
        formDataObj,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setGrowthStage(res.data.growth_stage);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to analyze crop image.");
    }
  };

  // Download calendar as PDF
  const handleDownloadPDF = () => {
    const element = calendarRef.current;
    html2pdf().from(element).save("Krishi_Calendar.pdf");
  };

  return (
    <div className="container py-5">
      <h2 className="text-center fw-bold mb-4">
        📅{" "}
        {language === "hi"
          ? "कृषि कैलेंडर"
          : language === "mr"
          ? "कृषी कॅलेंडर"
          : "Krishi Calendar"}
      </h2>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="row g-3 mb-5">
        {/* Crop Name */}
        <div className="col-md-6">
          <label className="form-label fw-bold">🌾 Crop Name</label>
          <input
            type="text"
            className="form-control"
            name="crop"
            value={formData.crop}
            onChange={handleChange}
            required
          />
        </div>
        {/* Sowing Date */}
        <div className="col-md-6">
          <label className="form-label fw-bold">📅 Sowing Date</label>
          <input
            type="date"
            className="form-control"
            name="sowingDate"
            value={formData.sowingDate}
            onChange={handleChange}
            required
          />
        </div>
        {/* Soil Type */}
        <div className="col-md-6">
          <label className="form-label fw-bold">🧪 Soil Type</label>
          <select
            className="form-select"
            name="soilType"
            value={formData.soilType}
            onChange={handleChange}
            required
          >
            <option value="">-- Select --</option>
            <option value="Sandy">Sandy</option>
            <option value="Loamy">Loamy</option>
            <option value="Clayey">Clayey</option>
            <option value="Silty">Silty</option>
            <option value="Peaty">Peaty</option>
          </select>
        </div>
        {/* Farm Size */}
        <div className="col-md-6">
          <label className="form-label fw-bold">📏 Farm Size (Acre)</label>
          <input
            type="number"
            className="form-control"
            name="farmSize"
            value={formData.farmSize}
            onChange={handleChange}
            required
          />
        </div>
        {/* Location */}
        <div className="col-12">
          <label className="form-label fw-bold">
            📍 Location (District/State)
          </label>
          <input
            type="text"
            className="form-control"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>
        {/* Submit Button */}
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-success" disabled={loading}>
            {loading ? "Generating..." : "Generate Calendar"}
          </button>
        </div>
      </form>

      {/* Calendar Display */}
      {events.length > 0 && (
        <div ref={calendarRef} className="mb-5">
          <h5 className="text-center fw-bold mb-3">
            🌾 Your Farming Activities
          </h5>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            eventPropGetter={(event) => ({ className: event.className })}
            style={{ height: 600 }}
            components={{
              event: ({ event }) => (
                <div style={{ padding: "4px" }}>
                  <strong>{event.title}</strong>
                  {/* Show additional info on click or hover */}
                  <div>
                    <em>Fertilizer:</em> {event.fertilizer}
                  </div>
                  <div>
                    <em>Pesticide:</em> {event.pesticide}
                  </div>
                  <div>
                    <em>Weather:</em> {event.weatherForecast}
                  </div>
                  {event.milestones.length > 0 && (
                    <div>
                      <em>Milestones:</em> {event.milestones.join(", ")}
                    </div>
                  )}
                </div>
              ),
            }}
          />
          <div className="text-center mt-3">
            <button className="btn btn-primary" onClick={handleDownloadPDF}>
              📥 Download Calendar as PDF
            </button>
          </div>
          {/* Legend */}
          <div className="mt-2 text-center">
            <small>
              🟥 = Harsh Day | 🟦 = Rainy Day | 🟩 = Watering/Fertilizer | ⚠️ =
              Milestone
            </small>
          </div>
        </div>
      )}

      {/* Crop Image Upload for Growth Stage */}
      <div className="mt-5 text-center">
        <h5 className="fw-bold mb-3">
          📸 Upload Crop Image for Growth Stage Detection
        </h5>
        <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />
        <button className="btn btn-primary mt-2" onClick={handleImageUpload}>
          Analyze Crop
        </button>
        {growthStage && (
          <div className="alert alert-info mt-3">
            🌱 <strong>Detected Stage:</strong> {growthStage}
          </div>
        )}
      </div>
    </div>
  );
};

export default KrishiCalendar;
