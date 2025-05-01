// ✅ src/pages/CreditScore.jsx
import React, { useState } from "react";
import { useLanguage } from "../components/LanguageContext";

const CreditScore = () => {
  const { t, language } = useLanguage();

  const [answers, setAnswers] = useState({
    income: "",
    default: "",
    land: "",
    source: "",
    loans: "",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setAnswers({ ...answers, [e.target.name]: e.target.value });
  };

  const calculateScore = () => {
    let score = 600;

    // Income
    if (answers.income === "high") score += 100;
    else if (answers.income === "medium") score += 50;
    else if (answers.income === "low") score -= 50;

    // Loan Default
    if (answers.default === "no") score += 50;
    else if (answers.default === "yes") score -= 100;

    // Land Ownership
    if (answers.land === "yes") score += 50;
    else if (answers.land === "no") score -= 50;

    // Source of Income
    if (answers.source === "farming") score += 50;
    else if (answers.source === "labor") score -= 30;

    // Number of Active Loans
    if (answers.loans === "zero") score += 50;
    else if (answers.loans === "one") score += 20;
    else if (answers.loans === "multiple") score -= 50;

    // Limit score between 300-850
    score = Math.max(300, Math.min(850, score));

    let category = "";
    if (score >= 750) category = translateText("Excellent (750+)");
    else if (score >= 650) category = translateText("Good (650–749)");
    else if (score >= 550) category = translateText("Average (550–649)");
    else category = translateText("Poor (<550)");

    setResult({ score, category });
  };

  const translateText = (text) => {
    if (language === "hi") {
      if (text.includes("Excellent")) return "उत्कृष्ट (750+)";
      if (text.includes("Good")) return "अच्छा (650–749)";
      if (text.includes("Average")) return "औसत (550–649)";
      if (text.includes("Poor")) return "कमज़ोर (<550)";
    } else if (language === "mr") {
      if (text.includes("Excellent")) return "उत्कृष्ट (750+)";
      if (text.includes("Good")) return "चांगले (650–749)";
      if (text.includes("Average")) return "सरासरी (550–649)";
      if (text.includes("Poor")) return "खराब (<550)";
    }
    return text; // Default English
  };

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4 text-success fw-bold">📈 {t.credit}</h2>

      <div className="card shadow-sm p-4 mb-4">
        <h5 className="mb-3 text-primary fw-semibold">
          🌟{" "}
          {language === "hi"
            ? "अपनी जानकारी भरें"
            : language === "mr"
            ? "तुमची माहिती भरा"
            : "Fill Your Information"}
        </h5>

        {/* Questions */}
        <div className="mb-3">
          <label className="form-label fw-bold">
            💰{" "}
            {language === "hi"
              ? "आपकी मासिक आय?"
              : language === "mr"
              ? "तुमचे मासिक उत्पन्न?"
              : "Your Monthly Income?"}
          </label>
          <div>
            <input
              type="radio"
              name="income"
              value="high"
              onChange={handleChange}
            />{" "}
            ₹20,000+ &nbsp;
            <input
              type="radio"
              name="income"
              value="medium"
              onChange={handleChange}
            />{" "}
            ₹10,000–₹20,000 &nbsp;
            <input
              type="radio"
              name="income"
              value="low"
              onChange={handleChange}
            />{" "}
            {"<"} ₹10,000
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">
            🚫{" "}
            {language === "hi"
              ? "क्या आपने कभी डिफ़ॉल्ट किया है?"
              : language === "mr"
              ? "तुम्ही कधी कर्ज चुकवण्यात चूक केली आहे का?"
              : "Have you ever defaulted on a loan?"}
          </label>
          <div>
            <input
              type="radio"
              name="default"
              value="no"
              onChange={handleChange}
            />{" "}
            No &nbsp;
            <input
              type="radio"
              name="default"
              value="yes"
              onChange={handleChange}
            />{" "}
            Yes
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">
            🌾{" "}
            {language === "hi"
              ? "क्या आपके पास खुद की खेती की ज़मीन है?"
              : language === "mr"
              ? "तुमच्याकडे स्वतःची शेतीची जमीन आहे का?"
              : "Do you own agricultural land?"}
          </label>
          <div>
            <input
              type="radio"
              name="land"
              value="yes"
              onChange={handleChange}
            />{" "}
            Yes &nbsp;
            <input
              type="radio"
              name="land"
              value="no"
              onChange={handleChange}
            />{" "}
            No
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label fw-bold">
            👨‍🌾{" "}
            {language === "hi"
              ? "मुख्य आय का स्रोत?"
              : language === "mr"
              ? "मुख्य उत्पन्नाचा स्रोत?"
              : "Main Source of Income?"}
          </label>
          <div>
            <input
              type="radio"
              name="source"
              value="farming"
              onChange={handleChange}
            />{" "}
            Farming &nbsp;
            <input
              type="radio"
              name="source"
              value="business"
              onChange={handleChange}
            />{" "}
            Other Business &nbsp;
            <input
              type="radio"
              name="source"
              value="labor"
              onChange={handleChange}
            />{" "}
            Labor
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label fw-bold">
            📑{" "}
            {language === "hi"
              ? "कितने एक्टिव लोन हैं?"
              : language === "mr"
              ? "सध्या किती सक्रिय कर्जे आहेत?"
              : "Number of Active Loans?"}
          </label>
          <div>
            <input
              type="radio"
              name="loans"
              value="zero"
              onChange={handleChange}
            />{" "}
            0 &nbsp;
            <input
              type="radio"
              name="loans"
              value="one"
              onChange={handleChange}
            />{" "}
            1 &nbsp;
            <input
              type="radio"
              name="loans"
              value="multiple"
              onChange={handleChange}
            />{" "}
            2+
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            className="btn btn-success"
            onClick={calculateScore}
            disabled={Object.values(answers).includes("")}
          >
            {language === "hi"
              ? "स्कोर जांचें"
              : language === "mr"
              ? "स्कोर तपासा"
              : "Check Score"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="alert alert-info text-center">
          <h5 className="fw-bold">
            🎯{" "}
            {language === "hi"
              ? "आपका क्रेडिट स्कोर है:"
              : language === "mr"
              ? "तुमचा क्रेडिट स्कोर आहे:"
              : "Your Credit Score is:"}
          </h5>
          <h1 className="text-success">{result.score}</h1>
          <p className="fw-semibold">{result.category}</p>
        </div>
      )}
    </div>
  );
};

export default CreditScore;
