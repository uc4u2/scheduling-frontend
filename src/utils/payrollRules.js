export const vacationIncludedByDefault = (region, province = "") =>
  (region === "ca" && province !== "QC") || region === "us";
