import React, { useState } from "react";
import axios from "axios";
import { useLanguage } from "../components/LanguageContext";
import jsPDF from "jspdf";
import "jspdf-autotable";

const FertilizerAdvice = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    crop: "",
    soil_ph: "",
    crop_age: "",
    weather: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "https://agrisaarthibackend.onrender.com/fertilizer-advice", //https://agrisaarthibackend.onrender.com/fertilizer-advice
        {
          ...formData,
          language,
        }
      );
      setResult(res.data);
    } catch (err) {
      console.error("Error:", err);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const renderAdvice = (advice) => {
    if (!advice) return null;
    const lines = advice.split("\n").filter((line) => line.trim() !== "");

    return lines.map((line, idx) => {
      if (
        line.includes("Recommended Fertilizer") ||
        line.includes("उर्वरक") ||
        line.includes("खते")
      ) {
        return (
          <h5 key={idx} className="text-primary mt-3">
            🧪 {line}
          </h5>
        );
      }
      if (
        line.includes("Quantity") ||
        line.includes("मात्रा") ||
        line.includes("प्रमाण")
      ) {
        return (
          <h5 key={idx} className="text-success mt-3">
            📦 {line}
          </h5>
        );
      }
      if (
        line.includes("Brands") ||
        line.includes("ब्रांड्स") ||
        line.includes("ब्रँड")
      ) {
        return (
          <h5 key={idx} className="text-warning mt-3">
            🏷️ {line}
          </h5>
        );
      }
      if (line.includes("Tip") || line.includes("टिप")) {
        return (
          <h5 key={idx} className="text-danger mt-3">
            🌟 {line}
          </h5>
        );
      }
      return (
        <p key={idx} className="mb-2">
          {line}
        </p>
      );
    });
  };

  const downloadPDF = () => {
    if (!result) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
    });

    doc.setFontSize(18);
    doc.text("🌾 Fertilizer Recommendation Report", 20, 20);

    doc.setFontSize(12);

    // 🚀 Force English fallback if language is Hindi or Marathi
    const textContent =
      language === "en" ? result.ai_advice : result.english_version; // <-- English backup version

    const lines = textContent.split("\n").filter((line) => line.trim() !== "");

    let y = 40;
    const maxWidth = 170;

    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      if (line.includes("Recommended Fertilizer") || line.includes("उर्वरक")) {
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(14);
      } else if (line.includes("Quantity") || line.includes("मात्रा")) {
        doc.setTextColor(0, 153, 0);
        doc.setFontSize(14);
      } else if (line.includes("Brands") || line.includes("ब्रांड्स")) {
        doc.setTextColor(255, 165, 0);
        doc.setFontSize(14);
      } else if (line.includes("Tip") || line.includes("टिप")) {
        doc.setTextColor(255, 0, 0);
        doc.setFontSize(14);
      } else {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
      }

      const splitLines = doc.splitTextToSize(line, maxWidth);
      splitLines.forEach((wrappedLine) => {
        doc.text(wrappedLine, 20, y);
        y += 8;
      });
    });

    doc.save("Fertilizer_Advice_Report.pdf");
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4 text-success fw-bold">
        🌾 Fertilizer Recommendation
      </h2>

      <form onSubmit={handleSubmit} className="card p-4 shadow-sm mb-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Crop Name</label>
            <input
              type="text"
              name="crop"
              value={formData.crop}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g., Tomato"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Soil pH</label>
            <input
              type="number"
              name="soil_ph"
              value={formData.soil_ph}
              onChange={handleChange}
              step="0.1"
              className="form-control"
              placeholder="e.g., 6.5"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Crop Age (in months)</label>
            <input
              type="number"
              name="crop_age"
              value={formData.crop_age}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g., 2"
              required
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Weather Condition</label>
            <select
              name="weather"
              value={formData.weather}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select</option>
              <option value="sunny">Sunny</option>
              <option value="cloudy">Cloudy</option>
              <option value="rainy">Rainy</option>
            </select>
          </div>
        </div>

        <div className="text-center mt-4">
          <button type="submit" className="btn btn-success">
            🧠 Get AI Fertilizer Advice
          </button>
        </div>
      </form>

      {loading && <div className="text-center">Loading...</div>}

      {result && (
        <div className="card p-4 shadow-sm">
          {renderAdvice(result.ai_advice)}

          <div className="text-center mt-4">
            <button onClick={downloadPDF} className="btn btn-primary">
              📄 Download PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FertilizerAdvice;
