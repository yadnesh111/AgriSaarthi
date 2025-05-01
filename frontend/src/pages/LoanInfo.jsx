// ✅ src/pages/LoanInfo.jsx
import React, { useState } from "react";
import { useLanguage } from "../components/LanguageContext";
import { Modal, Button } from "react-bootstrap";

const LoanInfo = () => {
  const { t, language } = useLanguage();
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const uiTranslations = {
    title: {
      en: "💸 Loan Information",
      hi: "💸 ऋण जानकारी",
      mr: "💸 कर्ज माहिती",
    },
    readMore: {
      en: "📖 Read More",
      hi: "📖 और पढ़ें",
      mr: "📖 अधिक वाचा",
    },
    description: {
      en: "📝 Description",
      hi: "📝 विवरण",
      mr: "📝 वर्णन",
    },
    eligibility: {
      en: "✅ Eligibility",
      hi: "✅ पात्रता",
      mr: "✅ पात्रता",
    },
    benefits: {
      en: "🎯 Benefits",
      hi: "🎯 लाभ",
      mr: "🎯 फायदे",
    },
    close: {
      en: "Close",
      hi: "बंद करें",
      mr: "बंद करा",
    },
    apply: {
      en: "Apply Info",
      hi: "आवेदन जानकारी",
      mr: "अर्ज माहिती",
    },
  };

  const schemes = [
    {
      id: 1,
      title: {
        en: "Kisan Credit Card (KCC)",
        hi: "किसान क्रेडिट कार्ड (केसीसी)",
        mr: "किसान क्रेडिट कार्ड (केसीसी)",
      },
      description: {
        en: "Provides farmers with timely access to credit for farming needs at low-interest rates.",
        hi: "किसानों को कृषि आवश्यकताओं के लिए समय पर कम ब्याज दर पर ऋण प्रदान करता है।",
        mr: "शेतकऱ्यांना शेतीच्या गरजांसाठी कमी व्याजदरात कर्ज सुविधा पुरवते.",
      },
      eligibility: {
        en: "All farmers involved in crop production activities.",
        hi: "फसल उत्पादन गतिविधियों में शामिल सभी किसान।",
        mr: "पीक उत्पादन क्रियाकलापात सहभागी सर्व शेतकरी.",
      },
      benefits: {
        en: "Easy loans with simple documentation and flexible repayment.",
        hi: "सरल दस्तावेज़ीकरण और लचीले पुनर्भुगतान के साथ आसान ऋण।",
        mr: "सोप्या कागदपत्रांसह लवचिक परतफेडीची सुविधा.",
      },
    },
    {
      id: 2,
      title: {
        en: "PM Kisan Samman Nidhi",
        hi: "प्रधानमंत्री किसान सम्मान निधि",
        mr: "पंतप्रधान किसान सन्मान निधी",
      },
      description: {
        en: "₹6000/year financial support to small and marginal farmers.",
        hi: "छोटे और सीमांत किसानों को ₹6000 प्रति वर्ष आर्थिक सहायता।",
        mr: "लहान व अल्पभूधारक शेतकऱ्यांना दरवर्षी ₹6000 आर्थिक मदत.",
      },
      eligibility: {
        en: "Small and marginal farmers owning up to 2 hectares of land.",
        hi: "2 हेक्टेयर तक भूमि वाले छोटे और सीमांत किसान।",
        mr: "२ हेक्टरपर्यंत जमीन असलेले लहान व अल्पभूधारक शेतकरी.",
      },
      benefits: {
        en: "Direct cash transfer to farmer accounts.",
        hi: "किसानों के खातों में प्रत्यक्ष नकद स्थानांतरण।",
        mr: "शेतकऱ्यांच्या खात्यात थेट पैसे जमा.",
      },
    },
    {
      id: 3,
      title: {
        en: "PM Fasal Bima Yojana",
        hi: "प्रधानमंत्री फसल बीमा योजना",
        mr: "पंतप्रधान पीक विमा योजना",
      },
      description: {
        en: "Crop insurance scheme to protect farmers against crop loss.",
        hi: "फसल हानि से किसानों की रक्षा के लिए बीमा योजना।",
        mr: "पिकांच्या नुकसानीपासून शेतकऱ्यांना संरक्षण देणारी योजना.",
      },
      eligibility: {
        en: "Farmers growing notified crops.",
        hi: "सूचित फसल उगाने वाले किसान।",
        mr: "सूचित पिके घेणारे शेतकरी.",
      },
      benefits: {
        en: "Low premium insurance coverage.",
        hi: "कम प्रीमियम पर बीमा कवर।",
        mr: "कमी प्रीमियमवर विमा संरक्षण.",
      },
    },
    {
      id: 4,
      title: {
        en: "Mudra Loan Yojana",
        hi: "मुद्रा ऋण योजना",
        mr: "मुद्रा कर्ज योजना",
      },
      description: {
        en: "Provides loans up to ₹10 lakh for micro and small businesses.",
        hi: "सूक्ष्म और लघु व्यवसायों के लिए ₹10 लाख तक का ऋण।",
        mr: "सूक्ष्म व लघु उद्योगांसाठी ₹१० लाखांपर्यंत कर्ज.",
      },
      eligibility: {
        en: "Small businesses and entrepreneurs.",
        hi: "लघु व्यवसाय और उद्यमी।",
        mr: "लघु उद्योग व उद्योजक.",
      },
      benefits: {
        en: "Collateral-free loans under Shishu, Kishor, and Tarun categories.",
        hi: "शिशु, किशोर और तरुण श्रेणियों के तहत बिना गारंटी ऋण।",
        mr: "शिशु, किशोर व तरुण वर्गांतर्गत गहाण-मुक्त कर्ज सुविधा.",
      },
    },
    {
      id: 5,
      title: {
        en: "Agriculture Infrastructure Fund",
        hi: "कृषि अवसंरचना निधि",
        mr: "कृषी पायाभूत सुविधा निधी",
      },
      description: {
        en: "Provides long-term financing for post-harvest infrastructure.",
        hi: "कटाई के बाद के बुनियादी ढांचे के लिए दीर्घकालिक वित्तपोषण।",
        mr: "पीक काढणीनंतरच्या पायाभूत सुविधांसाठी दीर्घकालीन अर्थसहाय्य.",
      },
      eligibility: {
        en: "Farmer groups, cooperatives, agri startups.",
        hi: "किसान समूह, सहकारी समितियाँ, कृषि स्टार्टअप।",
        mr: "शेतकरी गट, सहकारी संस्था, कृषी स्टार्टअप्स.",
      },
      benefits: {
        en: "Loans for warehouses, cold storage, processing units.",
        hi: "गोदामों, कोल्ड स्टोरेज और प्रसंस्करण इकाइयों के लिए ऋण।",
        mr: "गोदाम, कोल्ड स्टोरेज व प्रक्रिया युनिट्ससाठी कर्ज सुविधा.",
      },
    },
  ];

  const handleReadMore = (scheme) => {
    setSelectedScheme(scheme);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  return (
    <div className="container py-4">
      <h2 className="text-center mb-4 text-success fw-bold">
        {uiTranslations.title[language]}
      </h2>

      <div className="row row-cols-1 row-cols-md-3 g-4">
        {schemes.map((scheme) => (
          <div className="col" key={scheme.id}>
            <div className="card shadow h-100">
              <div className="card-body d-flex flex-column justify-content-between">
                <h5 className="card-title text-success">
                  {scheme.title[language]}
                </h5>
                <button
                  className="btn btn-primary mt-3"
                  onClick={() => handleReadMore(scheme)}
                >
                  {uiTranslations.readMore[language]}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={handleClose}>
        {selectedScheme && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>{selectedScheme.title[language]}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>
                <strong>{uiTranslations.description[language]}:</strong>
                <br />
                {selectedScheme.description[language]}
              </p>
              <p>
                <strong>{uiTranslations.eligibility[language]}:</strong>
                <br />
                {selectedScheme.eligibility[language]}
              </p>
              <p>
                <strong>{uiTranslations.benefits[language]}:</strong>
                <br />
                {selectedScheme.benefits[language]}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                {uiTranslations.close[language]}
              </Button>
              <Button variant="success" onClick={handleClose}>
                {uiTranslations.apply[language]}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </div>
  );
};

export default LoanInfo;
