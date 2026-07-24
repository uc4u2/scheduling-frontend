export const getInvoicePaymentLinkDisabledReason = ({
  status,
  remainingBalance,
  recipientEmail,
  invoiceId,
  t,
  requireSavedInvoice = false,
}) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const safeRemainingBalance = Number(remainingBalance || 0);
  if (requireSavedInvoice && !invoiceId) {
    return t("tooltips.sendPaymentLinkMissingInvoice", "Save this invoice before sending a payment link.");
  }
  if (normalizedStatus === "void") {
    return t("tooltips.sendPaymentLinkVoid", "This invoice is void. Payment link sending is unavailable.");
  }
  if (["refunded", "partial_refund", "partially_refunded"].includes(normalizedStatus)) {
    return t("tooltips.sendPaymentLinkRefunded", "This invoice has been refunded. Do not send a payment link.");
  }
  if (!(safeRemainingBalance > 0)) {
    return t("tooltips.sendPaymentLinkPaid", "This invoice is already paid. A payment link is no longer needed.");
  }
  if (!recipientEmail) {
    return t("tooltips.sendPaymentLinkUnavailable", "Payment link unavailable until a valid recipient email is provided.");
  }
  return "";
};

export const isInvoicePaymentLinkActionable = ({ status, remainingBalance }) => {
  const normalizedStatus = String(status || "").trim().toLowerCase();
  if (["paid", "void", "refunded", "partial_refund", "partially_refunded"].includes(normalizedStatus)) return false;
  return Number(remainingBalance || 0) > 0;
};

export const getDefaultInvoiceDeliveryOptions = ({
  status,
  remainingBalance,
  recipientEmail,
  invoiceId,
  t,
  requireSavedInvoice = false,
}) => {
  const includePaymentLink = isInvoicePaymentLinkActionable({ status, remainingBalance });
  const paymentLinkDisabledReason = getInvoicePaymentLinkDisabledReason({
    status,
    remainingBalance,
    recipientEmail,
    invoiceId,
    t,
    requireSavedInvoice,
  });
  return {
    attachInvoicePdf: true,
    includePaymentLink,
    paymentLinkDisabledReason,
  };
};

export const getInvoiceReviewCtaHelperText = (capability) => {
  if (!capability) {
    return "Checking invoice review request availability...";
  }
  if (capability.eligible) {
    return (
      capability.help_text ||
      "Adds a secondary Google review button to this invoice email. It does not send a separate review email."
    );
  }
  return capability.help_text || "Invoice review request is unavailable for this send.";
};
