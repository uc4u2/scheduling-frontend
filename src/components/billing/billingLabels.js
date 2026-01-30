export const formatBillingNextDateLabel = ({ nextBillingDate, trialEnd, t }) => {
  const fmt = (iso) =>
    new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "2-digit" }).format(new Date(iso));

  const nextLabel = t ? t("billing.labels.nextBillingDate") : "Next billing date";
  const trialLabel = t ? t("billing.labels.trialEnds") : "Trial ends";
  if (nextBillingDate) return `${nextLabel}: ${fmt(nextBillingDate)}`;
  if (trialEnd) return `${trialLabel}: ${fmt(trialEnd)}`;
  return t ? t("billing.labels.nextBillingDateEmpty") : "Next billing date: —";
};
