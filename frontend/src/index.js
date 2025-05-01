import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./components/LanguageContext"; // ✅ FIXED PATH
import { PriceAlertProvider } from "./components/PriceAlertContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <PriceAlertProvider>
    <React.StrictMode>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </React.StrictMode>
  </PriceAlertProvider>
);
