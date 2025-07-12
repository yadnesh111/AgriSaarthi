import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MandiRates from "./pages/MandiRates";
import CreditScore from "./pages/CreditScore";
import LoanInfo from "./pages/LoanInfo";
import CropDiagnosis from "./components/CropDiagnosis";
import KrishiGPT from "./components/KrishiGPT";
import Navbar from "./components/Navbar";
import FertilizerAdvice from "./pages/FertilizerAdvice";
import KrishiCalendar from "./pages/KrishiCalendar"; // ✅ Added new import
import { ToastContainer } from "react-toastify"; // ✅ Toastify import
import "react-toastify/dist/ReactToastify.css";
import PriceAlertChecker from "./components/PriceAlertChecker"; // ✅ Import new
import AgricultureNews from "./components/AgricultureNews";
import Reels from "./components/Reels";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      {/* ✅ ToastContainer must be placed once here to work globally */}
      <ToastContainer position="top-center" autoClose={5000} />
      <PriceAlertChecker />

      <main className="pt-20 pb-32 px-4 sm:px-8 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/diagnosis" element={<CropDiagnosis />} />
          <Route path="/mandi-rates" element={<MandiRates />} />
          <Route path="/credit-score" element={<CreditScore />} />
          <Route path="/loan-info" element={<LoanInfo />} />
          <Route path="/fertilizer-advice" element={<FertilizerAdvice />} />
          <Route path="/krishi-calendar" element={<KrishiCalendar />} />

          <Route path="/news" element={<AgricultureNews />} />
          <Route path="/reels" element={<Reels />} />
        </Routes>
      </main>

      <div className="fixed bottom-4 right-4 z-50">
        <KrishiGPT />
      </div>
    </div>
  );
}

export default App;
