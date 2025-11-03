// src/pages/client/PaymentHistory.js
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from "@mui/material";
import usePayments from "./usePayments";
import api from "../../utils/api";

function statusColor(status) {
  switch (status) {
    case "paid": return "success";
    case "pending": return "warning";
    case "failed": return "error";
    default: return "default";
  }
}

export default function PaymentHistory({ appointmentId, canRefund = false }) {
  const { payments, loading, error, refresh } = usePayments(appointmentId);
  const [refundProcessing, setRefundProcessing] = useState(null);

  // ✅ Refund action (added back)
  const handleRefund = async (paymentId) => {
    if (!window.confirm("Are you sure you want to issue a refund?")) return;

    setRefundProcessing(paymentId);
    try {
      await api.post(`/payments/${paymentId}/refund`);
      alert("Refund processed successfully.");
      refresh(appointmentId); // ✅ refresh payments after refund
    } catch (err) {
      console.error("Refund failed:", err);
      alert("Refund failed. Please try again.");
    } finally {
      setRefundProcessing(null);
    }
  };

  // ✅ Fetch payments on mount
  useEffect(() => {
    if (appointmentId) refresh(appointmentId);
  }, [appointmentId, refresh]);

  if (loading) return <CircularProgress sx={{ mt: 2 }} />;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Payment History
      </Typography>

      <Paper>
        {error && (
          <Typography color="error" sx={{ p: 2 }}>
            ⚠️ Failed to load payment history.
          </Typography>
        )}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Method</TableCell>
              {canRefund && <TableCell>Action</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {payments && payments.length > 0 ? (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.date || "N/A"}</TableCell>
                  <TableCell>${p.amount || "0.00"}</TableCell>
                  <TableCell>
                    <Chip label={p.status || "unknown"} color={statusColor(p.status)} />
                  </TableCell>
                  <TableCell>{p.method || "N/A"}</TableCell>
                  {canRefund && (
                    <TableCell>
                      <button
                        disabled={refundProcessing === p.id}
                        onClick={() => handleRefund(p.id)}
                      >
                        {refundProcessing === p.id ? "Processing..." : "Refund"}
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canRefund ? 5 : 4} align="center">
                  🚫 No payment records available for this booking.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
