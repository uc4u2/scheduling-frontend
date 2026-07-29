import { useEffect, useMemo } from "react";

import { extractCompanyCurrencyContext, setActiveCurrency } from "../utils/currency";

export default function useCompanyCurrencyContext(companyLike) {
  const context = useMemo(() => extractCompanyCurrencyContext(companyLike), [companyLike]);

  useEffect(() => {
    if (context?.businessSellingCurrency) {
      setActiveCurrency(context.businessSellingCurrency);
    }
  }, [context]);

  return context;
}

