import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Activity,
  ShoppingCart,
  Landmark,
  Bell,
} from "lucide-react";
import { LanguageContext } from "./LanguageContext";
import { PriceAlertContext } from "./PriceAlertContext";
import logo from "../assets/logo.png";
import { toast } from "react-toastify";

const Navbar = () => {
  const { t } = useContext(LanguageContext);
  const { priceAlerts } = useContext(PriceAlertContext);
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: t.home, path: "/", icon: <Home size={18} /> },
    { label: t.diagnosisNav, path: "/diagnosis", icon: <Activity size={18} /> },
    { label: t.mandi, path: "/mandi-rates", icon: <ShoppingCart size={18} /> },
    { label: t.loan, path: "/loan-info", icon: <Landmark size={18} /> },
    {
      label: t.credit,
      path: "/fertilizer-advice",
      icon: (
        <i
          className="bi bi-capsule text-white"
          style={{ fontSize: "18px" }}
        ></i>
      ),
    },
  ];

  const handleBellClick = () => {
    if (priceAlerts.length > 0) {
      toast.info(`🔔 You have ${priceAlerts.length} active price alerts!`);
    } else {
      toast.info("🔔 No active alerts yet!");
    }
  };

  useEffect(() => {
    document.body.classList.toggle("sidebar-open", isOpen);
    return () => document.body.classList.remove("sidebar-open");
  }, [isOpen]);

  return (
    <>
      <nav className="navbar navbar-dark bg-success shadow px-3 py-2 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <button
            className="btn btn-light me-2"
            onClick={() => setIsOpen(true)}
            style={{ borderRadius: "0.25rem" }}
          >
            <Menu size={20} />
          </button>
          <Link to="/" className="navbar-brand d-flex align-items-center m-0">
            <img src={logo} alt="Logo" height="40" className="me-2" />
            <strong>AgriSaarthi</strong>
          </Link>
        </div>
        <button
          className="btn btn-light position-relative"
          onClick={handleBellClick}
          style={{ borderRadius: "50%" }}
        >
          <Bell size={20} />
          {priceAlerts.length > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {priceAlerts.length}
            </span>
          )}
        </button>
      </nav>

      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.5)", zIndex: 1040 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div
        className="position-fixed top-0 start-0 bg-success text-white p-4 d-flex flex-column justify-content-between"
        style={{
          width: "250px",
          height: "100%",
          zIndex: 1050,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="m-0">Menu</h5>
            <button
              className="btn btn-light btn-sm"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <ul className="navbar-nav flex-column gap-2">
            {menuItems.map((item, index) => (
              <li className="nav-item" key={index}>
                <Link
                  to={item.path}
                  className="nav-link text-white d-flex align-items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center mt-4 small">
          © {new Date().getFullYear()} AgriSaarthi
        </div>
      </div>
    </>
  );
};

export default Navbar;
