export const formatBillingNextDateLabel = ({ nextBillingDate, trialEnd }) => {
  const fmt = (iso) =>
    new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));

  if (nextBillingDate) return `Next billing date: ${fmt(nextBillingDate)}`;
  if (trialEnd) return `Trial ends: ${fmt(trialEnd)}`;
  return "Next billing date: —";
};
