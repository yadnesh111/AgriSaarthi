// ✅ src/pages/MandiRates.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { ToastContainer, toast } from "react-toastify"; // 🆕 Toastify import
import "react-toastify/dist/ReactToastify.css";
import "chart.js/auto";
import { PriceAlertContext } from "../components/PriceAlertContext";

const MandiRates = () => {
  const { priceAlerts, setPriceAlerts } = useContext(PriceAlertContext);
  const [mandiData, setMandiData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [commodityList, setCommodityList] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState("");

  const [loading, setLoading] = useState(false);
  const [bestMandi, setBestMandi] = useState(null);
  const [userDistrict, setUserDistrict] = useState("");
  const [userState, setUserState] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [trendData, setTrendData] = useState({ history: [], prediction: [] });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(fetchUserLocation, handleError);
    } else {
      console.error("Geolocation not supported.");
    }
  }, []);

  const fetchUserLocation = async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: { lat: latitude, lon: longitude, format: "json" },
          headers: { "Accept-Language": "en" },
        }
      );
      const addr = res.data.address;
      const district = addr?.state_district || addr?.county || "";
      const state = addr?.state || "";

      setUserDistrict(district.replace(" District", "").trim());
      setUserState(state.trim());

      fetchAndFilterMandiData(
        district.replace(" District", "").trim(),
        state.trim()
      );
    } catch (err) {
      console.error("Location detection failed:", err);
    }
  };

  const handleError = (error) => {
    console.error("Location error:", error);
  };

  const fetchAndFilterMandiData = async (district, state) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `https://agrisaarthibackend.onrender.com/mandi-rates`,
        {
          params: { state: state, district: district },
        }
      );
      const records = res.data.records || [];

      setOriginalData(records);
      setMandiData(records);

      const uniqueCommodities = [
        ...new Set(records.map((item) => item.commodity)),
      ];
      setCommodityList(uniqueCommodities);
    } catch (err) {
      console.error("Error fetching mandi data:", err);
      setMandiData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommodityChange = (e) => {
    const commodity = e.target.value;
    setSelectedCommodity(commodity);

    if (!commodity) {
      setMandiData(originalData);
      setBestMandi(null);
      return;
    }

    const filtered = originalData.filter(
      (item) => item.commodity.toLowerCase() === commodity.toLowerCase()
    );
    setMandiData(filtered);

    if (filtered.length > 0) {
      const best = filtered.reduce((a, b) =>
        (parseFloat(a.modal_price) || 0) > (parseFloat(b.modal_price) || 0)
          ? a
          : b
      );
      setBestMandi(best);
    } else {
      setBestMandi(null);
    }
  };

  const handleTrendClick = async (state, market, commodity) => {
    try {
      const res = await axios.get(
        `https://agrisaarthibackend.onrender.com/predict-price-trend`,
        {
          params: { state, market, commodity },
        }
      );
      setTrendData(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Trend fetch failed:", err);
      alert("Unable to fetch trend data.");
    }
  };

  const handleShareWhatsApp = (item) => {
    const message = `🌾 Mandi Rate Update:\n\nCommodity: ${item.commodity}\nMarket: ${item.market}\nDistrict: ${item.district}\nState: ${item.state}\nModal Price: ₹${item.modal_price}\nArrival Date: ${item.arrival_date}`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMsg}`, "_blank");
  };

  const handleBestDayPrediction = (item) => {
    if (trendData.prediction && trendData.prediction.length > 0) {
      const highest = trendData.prediction.reduce((a, b) =>
        a.modal_price > b.modal_price ? a : b
      );
      alert(
        `📈 Best day to sell ${item.commodity} might be ${highest.arrival_date} with expected price ₹${highest.modal_price}`
      );
    } else {
      alert(
        "⚡ First view the 📈 trend chart for this commodity to predict best day."
      );
    }
  };

  const handleSetPriceAlert = (item) => {
    const targetPrice = prompt(
      `🔔 Set target price for ${item.commodity} (₹):`
    );
    if (targetPrice) {
      const newAlert = {
        commodity: item.commodity,
        target: parseFloat(targetPrice),
      };
      const existingAlerts =
        JSON.parse(localStorage.getItem("priceAlerts")) || [];
      const updatedAlerts = [...existingAlerts, newAlert];
      localStorage.setItem("priceAlerts", JSON.stringify(updatedAlerts));

      // 🆕 Also update React State immediately
      setPriceAlerts(updatedAlerts);

      toast.success(
        `✅ Alert set! You'll be notified when price crosses ₹${targetPrice}`
      );
    }
  };

  // 🆕 Real Time Price Alert Checker
  useEffect(() => {
    const interval = setInterval(() => {
      priceAlerts.forEach((alert) => {
        const match = mandiData.find(
          (item) =>
            item.commodity.toLowerCase() === alert.commodity.toLowerCase() &&
            parseFloat(item.modal_price) >= alert.target
        );
        if (match) {
          toast.info(
            `🔔 Price Alert: ${match.commodity} at ${match.market} reached ₹${match.modal_price}!`
          );
          setPriceAlerts((prev) =>
            prev.filter((a) => a.commodity !== alert.commodity)
          );
        }
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [priceAlerts, mandiData]);

  return (
    <div className="container py-4">
      <ToastContainer position="top-center" /> {/* 🆕 Toastify setup */}
      <h2 className="text-center mb-4 text-success fw-bold">🌾 Mandi Rates</h2>
      {/* Commodity Dropdown */}
      <div className="row g-3 mb-4 justify-content-center">
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedCommodity}
            onChange={handleCommodityChange}
          >
            <option value="">🌾 Select Commodity</option>
            {commodityList.map((commodity, idx) => (
              <option key={idx} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Best Mandi Suggestion */}
      {bestMandi && (
        <div className="alert alert-success text-center fw-bold">
          🏆 Best Place to Sell {bestMandi.commodity}:<br />
          {bestMandi.market} ({bestMandi.district}, {bestMandi.state})<br />
          Modal Price: ₹{bestMandi.modal_price}
        </div>
      )}
      {/* Mandi Table */}
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : mandiData.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-success">
              <tr>
                <th>Market</th>
                <th>Commodity</th>
                <th>Variety</th>
                <th>Min Price</th>
                <th>Max Price</th>
                <th>Modal Price</th>
                <th>Arrival Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandiData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.market}</td>
                  <td>{item.commodity}</td>
                  <td>{item.variety}</td>
                  <td>₹{item.min_price}</td>
                  <td>₹{item.max_price}</td>
                  <td>₹{item.modal_price}</td>
                  <td>{item.arrival_date}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2 justify-content-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          handleTrendClick(
                            item.state,
                            item.market,
                            item.commodity
                          )
                        }
                      >
                        📈 Trend
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleShareWhatsApp(item)}
                      >
                        📲 Share
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleBestDayPrediction(item)}
                      >
                        📅 Best Day
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleSetPriceAlert(item)}
                      >
                        🔔 Alert
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-muted">No data available.</div>
      )}
      {/* Trend Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📈 Price Trend</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {trendData.history.length > 0 && (
            <Line
              data={{
                labels: [
                  ...trendData.history.map((h) => h.arrival_date),
                  ...trendData.prediction.map((p) => p.arrival_date),
                ],
                datasets: [
                  {
                    label: "Actual Prices",
                    data: trendData.history.map((h) => h.modal_price),
                    borderColor: "blue",
                    fill: false,
                  },
                  {
                    label: "Predicted Prices",
                    data: trendData.prediction.map((p) => p.modal_price),
                    borderColor: "green",
                    borderDash: [5, 5],
                    fill: false,
                  },
                ],
              }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MandiRates;
