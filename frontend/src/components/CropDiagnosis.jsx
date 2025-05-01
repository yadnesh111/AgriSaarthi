import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useLanguage } from "./LanguageContext";
import ReactMarkdown from "react-markdown"; // ✅ new
import remarkGfm from "remark-gfm";

const CropDiagnosis = () => {
  const [image, setImage] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState("tomato"); // new
  const { t, language } = useLanguage();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);
    formData.append("symptoms", symptoms);
    formData.append("language", language);
    formData.append("crop", selectedCrop); // new

    try {
      const response = await axios.post(
        "https://agrisaarthibackend.onrender.com/diagnose",
        formData
      );
      setDiagnosis(response.data);
    } catch (error) {
      console.error("Error during diagnosis:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light py-4">
      <div className="card shadow-lg w-100" style={{ maxWidth: "600px" }}>
        <div className="card-body">
          <h1 className="card-title text-center text-success mb-4">
            {t.title}
          </h1>

          {/* ✅ Crop Dropdown */}
          <label className="form-label fw-semibold">
            {t.selectCrop || "Select Crop"}
          </label>
          <select
            className="form-select mb-3"
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
          >
            <option value="tomato">Tomato</option>
            <option value="potato">Potato</option>
            <option value="onion">Onion</option>
          </select>

          <label className="form-label fw-semibold">{t.uploadImage}</label>
          <input
            type="file"
            accept="image/*"
            className="form-control mb-3"
            onChange={handleImageChange}
          />

          {image && (
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="img-fluid mb-3 rounded shadow-sm"
            />
          )}

          <textarea
            placeholder={t.describeSymptoms}
            className="form-control mb-3"
            rows={2}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          ></textarea>

          <button onClick={handleSubmit} className="btn btn-primary w-100">
            {loading ? `${t.diagnose}...` : t.diagnose}
          </button>

          {diagnosis && (
            <motion.div
              className="alert alert-success mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* ✅ Multiline full diagnosis */}
              <p className="mb-2">
                <strong>{t.diagnosis}:</strong>{" "}
                {diagnosis.diagnosis
                  .split("\n")[0]
                  .replace("Diagnosis:", "")
                  .trim()}
              </p>

              {/* ✅ Markdown rendered remedy */}
              <p className="mb-2">
                <strong>{t.remedy}:</strong>{" "}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {diagnosis.diagnosis}
                </ReactMarkdown>
              </p>

              <p className="mb-0 text-muted">
                <strong>{t.confidence}:</strong>{" "}
                {diagnosis.confidence
                  ? `${(diagnosis.confidence * 100).toFixed(2)}%`
                  : "Unknown"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CropDiagnosis;
