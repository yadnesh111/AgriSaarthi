import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useLanguage } from "../components/LanguageContext";
import html2pdf from "html2pdf.js";

const localizer = momentLocalizer(moment);

const KrishiCalendar = () => {
  const { language } = useLanguage();
  const calendarRef = useRef(null);
  const [formData, setFormData] = useState({
    crop: "",
    sowingDate: "",
    soilType: "",
    farmSize: "",
    location: "",
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarText, setCalendarText] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

      const lines = text.split("\n").filter((line) => line.trim() !== "");
      const newEvents = [];

      lines.forEach((line) => {
        const match = line.match(/(\w+\s\d{1,2},\s\d{4}):\s*(.*)/);
        if (match) {
          const date = moment(match[1], "MMMM D, YYYY").toDate();
          const task = match[2];
          newEvents.push({
            title: task,
            start: date,
            end: date,
          });
        }
      });

      setEvents(newEvents);
    } catch (error) {
      console.error("Error generating calendar:", error);
      alert("Failed to generate calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) {
      alert("Please select an image first!");
      return;
    }
    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      const res = await axios.post(
        "https://agrisaarthibackend.onrender.com/upload-crop-photo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setGrowthStage(res.data.growth_stage);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to analyze crop image.");
    }
  };

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

      <form onSubmit={handleSubmit} className="row g-3 mb-5">
        {/* Form Inputs */}
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
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-success">
            {loading ? "Generating..." : "Generate Calendar"}
          </button>
        </div>
      </form>

      {/* 📅 Calendar Display */}
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
            style={{ height: 600 }}
          />
          <div className="text-center mt-3">
            <button className="btn btn-primary" onClick={handleDownloadPDF}>
              📥 Download Calendar as PDF
            </button>
          </div>
        </div>
      )}

      {/* 📸 Image Upload */}
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
