import React, { useEffect } from "react";
import { toast } from "react-toastify";

const PriceAlertChecker = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      const alerts = JSON.parse(localStorage.getItem("priceAlerts")) || [];
      const mandiData = JSON.parse(localStorage.getItem("mandiData")) || []; // 👈 You must save mandi data locally too when fetching.

      alerts.forEach((alert) => {
        const match = mandiData.find(
          (item) =>
            item.commodity.toLowerCase() === alert.commodity.toLowerCase() &&
            parseFloat(item.modal_price) >= alert.target
        );
        if (match) {
          toast.info(
            `🔔 Price Alert: ${match.commodity} at ${match.market} reached ₹${match.modal_price}!`
          );

          // Remove triggered alert from storage
          const updatedAlerts = alerts.filter(
            (a) => a.commodity !== alert.commodity
          );
          localStorage.setItem("priceAlerts", JSON.stringify(updatedAlerts));
        }
      });
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return null; // 👉 No UI, silent background checker
};

export default PriceAlertChecker;
