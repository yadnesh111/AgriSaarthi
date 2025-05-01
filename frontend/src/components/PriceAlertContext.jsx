import React, { createContext, useState } from "react";

export const PriceAlertContext = createContext();

export const PriceAlertProvider = ({ children }) => {
  const [priceAlerts, setPriceAlerts] = useState([]);

  return (
    <PriceAlertContext.Provider value={{ priceAlerts, setPriceAlerts }}>
      {children}
    </PriceAlertContext.Provider>
  );
};
