import { useEffect, useState } from "react";
import api from "../../utils/api"; // ✅ correct path

export default function usePayments(appointmentId) {
  const [payments, setPayments] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching payments for appointment: ${appointmentId}`);
      const { data } = await api.get(`/api/payments/list/${appointmentId}`);
      console.log("✅ Payments API response:", data);

      setPayments(data?.transactions || []);
      setPaymentStatus(data?.payment_status || "");
      setError("");
    } catch (err) {
      console.error("❌ Failed to load payment history:", err);
      setError("Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentId) {
      fetchPayments();
    }
  }, [appointmentId]);

  return { payments, paymentStatus, loading, error, refresh: fetchPayments };
}
