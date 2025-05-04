// ✅ src/pages/MandiRates.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { ToastContainer, toast } from "react-toastify";
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

      const cleanDistrict = district.replace(" District", "").trim();
      const cleanState = state.trim();

      setUserDistrict(cleanDistrict);
      setUserState(cleanState);
      fetchWithFallback(cleanDistrict, cleanState);
    } catch (err) {
      console.error("Location fetch error:", err);
    }
  };

  const handleError = (error) => {
    console.error("Location permission denied or failed:", error);
  };

  const fetchWithFallback = async (district, state) => {
    setLoading(true);
    try {
      const districtRes = await axios.get(
        `https://agrisaarthibackend.onrender.com/mandi-rates`,
        {
          params: { state, district },
        }
      );
      if (districtRes.data.records?.length > 0) {
        updateMandiData(districtRes.data.records);
      } else {
        console.warn("District data not found. Trying state level...");
        const stateRes = await axios.get(
          `https://agrisaarthibackend.onrender.com/mandi-rates`,
          {
            params: { state },
          }
        );
        if (stateRes.data.records?.length > 0) {
          updateMandiData(stateRes.data.records);
        } else {
          console.warn("State data not found. Trying national level...");
          const indiaRes = await axios.get(
            `https://agrisaarthibackend.onrender.com/mandi-rates`
          );
          updateMandiData(indiaRes.data.records || []);
        }
      }
    } catch (err) {
      console.error("Fallback fetch failed:", err);
      setMandiData([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMandiData = (records) => {
    setOriginalData(records);
    setMandiData(records);
    const uniqueCommodities = [
      ...new Set(records.map((item) => item.commodity)),
    ];
    setCommodityList(uniqueCommodities);
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
        parseFloat(a.modal_price) > parseFloat(b.modal_price) ? a : b
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
    }
  };

  const handleShareWhatsApp = (item) => {
    const msg = `🌾 Mandi Rate:\nCommodity: ${item.commodity}\nMarket: ${item.market}\nState: ${item.state}\nDistrict: ${item.district}\nPrice: ₹${item.modal_price}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleBestDayPrediction = (item) => {
    if (trendData.prediction?.length > 0) {
      const highest = trendData.prediction.reduce((a, b) =>
        a.modal_price > b.modal_price ? a : b
      );
      alert(
        `📅 Best day to sell: ${highest.arrival_date} @ ₹${highest.modal_price}`
      );
    } else {
      alert("📈 Please open the price trend chart first.");
    }
  };

  const handleSetPriceAlert = (item) => {
    const targetPrice = prompt(`Set alert for ${item.commodity} (₹):`);
    if (!targetPrice) return;

    const newAlert = {
      commodity: item.commodity,
      target: parseFloat(targetPrice),
    };
    const existing = JSON.parse(localStorage.getItem("priceAlerts")) || [];
    const updated = [...existing, newAlert];
    localStorage.setItem("priceAlerts", JSON.stringify(updated));
    setPriceAlerts(updated);
    toast.success(`🔔 Alert set for ₹${targetPrice}`);
  };

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
            `🔔 ${match.commodity} in ${match.market} reached ₹${match.modal_price}`
          );
          setPriceAlerts((prev) =>
            prev.filter((a) => a.commodity !== alert.commodity)
          );
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [priceAlerts, mandiData]);

  return (
    <div className="container py-4">
      <ToastContainer position="top-center" />
      <h2 className="text-center mb-4 text-success fw-bold">🌾 Mandi Rates</h2>

      <div className="row g-3 mb-4 justify-content-center">
        <div className="col-md-6">
          <select
            className="form-select"
            value={selectedCommodity}
            onChange={handleCommodityChange}
          >
            <option value="">🌽 Select Commodity</option>
            {commodityList.map((commodity, idx) => (
              <option key={idx} value={commodity}>
                {commodity}
              </option>
            ))}
          </select>
        </div>
      </div>

      {bestMandi && (
        <div className="alert alert-success text-center fw-bold">
          🏆 Best Place to Sell {bestMandi.commodity}:<br />
          {bestMandi.market} ({bestMandi.district}, {bestMandi.state})<br />
          Modal Price: ₹{bestMandi.modal_price}
        </div>
      )}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : mandiData.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-bordered table-striped">
            <thead className="table-success">
              <tr>
                <th>State</th>
                <th>District</th>
                <th>Market</th>
                <th>Commodity</th>
                <th>Variety</th>
                <th>Min</th>
                <th>Max</th>
                <th>Modal</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mandiData.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.state}</td>
                  <td>{item.district}</td>
                  <td>{item.market}</td>
                  <td>{item.commodity}</td>
                  <td>{item.variety}</td>
                  <td>₹{item.min_price}</td>
                  <td>₹{item.max_price}</td>
                  <td>₹{item.modal_price}</td>
                  <td>{item.arrival_date}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1 justify-content-center">
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
                        📈
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={() => handleShareWhatsApp(item)}
                      >
                        📲
                      </button>
                      <button
                        className="btn btn-sm btn-outline-warning"
                        onClick={() => handleBestDayPrediction(item)}
                      >
                        📅
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleSetPriceAlert(item)}
                      >
                        🔔
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center text-muted">
          Market data unavailable. APMC markets may not have updated today's
          rates. Try again after 11:00 AM.
        </div>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📈 Price Trend</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Line
            data={{
              labels: [
                ...trendData.history.map((h) => h.arrival_date),
                ...trendData.prediction.map((p) => p.arrival_date),
              ],
              datasets: [
                {
                  label: "Actual",
                  data: trendData.history.map((h) => h.modal_price),
                  borderColor: "blue",
                },
                {
                  label: "Predicted",
                  data: trendData.prediction.map((p) => p.modal_price),
                  borderColor: "green",
                  borderDash: [4, 4],
                },
              ],
            }}
          />
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
