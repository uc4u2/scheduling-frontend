import { useEffect } from "react";
import { useParams } from "react-router-dom";

const BACKEND_UNSUBSCRIBE_BASE = "https://scheduling-application.onrender.com/public/email-sdr/unsubscribe";

export default function EmailSdrUnsubscribeRedirectPage() {
  const { token } = useParams();

  useEffect(() => {
    const trimmed = String(token || "").trim();
    const destination = trimmed
      ? `${BACKEND_UNSUBSCRIBE_BASE}/${encodeURIComponent(trimmed)}`
      : BACKEND_UNSUBSCRIBE_BASE;
    window.location.replace(destination);
  }, [token]);

  return null;
}
