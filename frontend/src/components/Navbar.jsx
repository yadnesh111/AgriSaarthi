import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Activity,
  ShoppingCart,
  Landmark,
  BarChart,
  Bot,
  Bell,
} from "lucide-react";
import { LanguageContext } from "./LanguageContext";
import { PriceAlertContext } from "./PriceAlertContext"; // 🆕 added
import logo from "../assets/logo.png";
import { toast } from "react-toastify"; // 🆕 Toast import

const Navbar = () => {
  const { t } = useContext(LanguageContext);
  const { priceAlerts } = useContext(PriceAlertContext); // 🆕 Read context
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: t.home, path: "/", icon: <Home size={18} /> },
    { label: t.diagnosisNav, path: "/diagnosis", icon: <Activity size={18} /> },
    { label: t.mandi, path: "/mandi-rates", icon: <ShoppingCart size={18} /> },
    { label: t.loan, path: "/loan-info", icon: <Landmark size={18} /> },
    { label: t.credit, path: "/fertilizer-advice", icon: "🌱" },
    { label: t.krishigpt, path: "/krishigpt", icon: <Bot size={18} /> },
  ];

  const handleBellClick = () => {
    if (priceAlerts.length > 0) {
      toast.info(`🔔 You have ${priceAlerts.length} active price alerts!`);
    } else {
      toast.info("🔔 No active alerts yet!");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success sticky-top shadow">
      <div className="container-fluid">
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img src={logo} alt="AgriSaarthi Logo" height="40" className="me-2" />
          <span className="fw-bold">AgriSaarthi</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="navbar-toggler-icon">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </span>
        </button>

        <div className={`collapse navbar-collapse ${isOpen ? "show" : ""}`}>
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
            {menuItems.map((item, index) => (
              <li className="nav-item" key={index}>
                <Link
                  to={item.path}
                  className="nav-link d-flex align-items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="nav-item ms-3 position-relative">
              <button
                className="btn btn-light position-relative"
                onClick={handleBellClick}
                style={{ borderRadius: "50%" }}
              >
                <Bell size={20} />
                {priceAlerts.length > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.6rem" }}
                  >
                    {priceAlerts.length}
                  </span>
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
