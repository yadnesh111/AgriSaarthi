// ✅ src/components/LanguageContext.js
import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    title: "AgriSaarthi - Crop & Soil Diagnosis",
    uploadImage: "Please upload image:",
    describeSymptoms: "Describe symptoms here (optional)",
    diagnose: "Diagnose",
    diagnosisResult: "Diagnosis Result:",
    diagnosis: "Diagnosis",
    remedy: "Remedy",
    confidence: "Confidence",
    home: "Home",
    diagnosisNav: "Crop Diagnosis",
    mandi: "Mandi Rates",
    credit: "Fertilizer Advice",
    loan: "Loan Info",
    welcome: "Welcome to AgriSaarthi",
    tagline: "Your smart farming assistant",
    selectLanguage: "Language",
    fertilizer: "Fertilizer Advice",
    selectCrop: "Select Crop",
    tomato: "Tomato",
    potato: "Potato",
    onion: "Onion",
  },
  hi: {
    title: "एग्रीसारथी - फसल और मिट्टी निदान",
    uploadImage: "कृपया छवि अपलोड करें:",
    describeSymptoms: "लक्षण यहाँ लिखें (वैकल्पिक)",
    diagnose: "निदान करें",
    diagnosisResult: "निदान परिणाम:",
    diagnosis: "निदान",
    remedy: "उपाय",
    confidence: "विश्वास स्तर",
    home: "होम",
    diagnosisNav: "फसल निदान",
    mandi: "मंडी दर",
    credit: "उर्वरक सलाह",
    loan: "ऋण जानकारी",
    welcome: "एग्रीसारथी में आपका स्वागत है",
    tagline: "आपका स्मार्ट खेती सहायक",
    selectLanguage: "भाषा चुनें",
    fertilizer: "उर्वरक सलाह",
    selectCrop: "फसल चुनें",
    tomato: "टमाटर",
    potato: "आलू",
    onion: "प्याज",
  },
  mr: {
    title: "अ‍ॅग्रीसारथी - पीक व माती निदान",
    uploadImage: "कृपया प्रतिमा अपलोड करा:",
    describeSymptoms: "लक्षण येथे लिहा (पर्यायी)",
    diagnose: "निदान करा",
    diagnosisResult: "निदान निकाल:",
    diagnosis: "निदान",
    remedy: "उपाय",
    confidence: "आत्मविश्वास",
    home: "मुख्यपृष्ठ",
    diagnosisNav: "पीक निदान",
    mandi: "बाजारभाव",
    credit: "खत सल्ला",
    loan: "कर्ज माहिती",
    welcome: "अ‍ॅग्रीसारथीमध्ये आपले स्वागत आहे",
    tagline: "आपला स्मार्ट शेती सहाय्यक",
    selectLanguage: "भाषा निवडा",
    fertilizer: "खत सल्ला",
    selectCrop: "पीक निवडा",
    tomato: "टोमॅटो",
    potato: "बटाटा",
    onion: "कांदा",
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

export { LanguageContext };
