import React, { createContext, useContext, useMemo, useState } from "react";

const BillingBannerContext = createContext({
  visible: false,
  setVisible: () => {},
});

export const BillingBannerProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const value = useMemo(() => ({ visible, setVisible }), [visible]);
  return (
    <BillingBannerContext.Provider value={value}>
      {children}
    </BillingBannerContext.Provider>
  );
};

export const useBillingBanner = () => useContext(BillingBannerContext);
