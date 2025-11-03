// Determines whether vacation pay should be included in gross pay by default
export const vacationIncludedByDefault = (region: string, province = ""): boolean => {
  if (region === "us") return true; // Typically vacation is employer-defined and paid out
  if (region === "ca" && province !== "QC") return false; // Vacation is usually paid out separately
  if (region === "ca" && province === "QC") return false; // Quebec also separates vacation by default
  return false;
};

// Returns the default statutory vacation percent based on region/province
export const defaultVacationPercent = (region: string, province = ""): number => {
  if (region === "ca") {
    if (province === "QC") return 6; // Quebec: 6% after 5 years, but safer default is 6%
    return 4; // Rest of Canada
  }
  if (region === "us") return 0; // No statutory vacation pay in US
  return 0;
};
