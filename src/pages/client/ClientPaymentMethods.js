import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import api from "../../utils/api";
import { useLocation, useParams } from "react-router-dom";
import { persistTenantSlug, resolveTenantSlug } from "../../utils/clientTenant";

export default function ClientPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [cardSummary, setCardSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { slug: routeSlug } = useParams();
  const tenantSlug = resolveTenantSlug({ routeSlug, search: location.search });

  useEffect(() => {
    if (tenantSlug) persistTenantSlug(tenantSlug);
  }, [tenantSlug]);

  const fetchMethods = useCallback(() => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const request = tenantSlug
      ? api.get(`/public/${tenantSlug}/me/payment-methods`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        })
      : api.get("/payments");
    request
      .then((res) => {
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.payment_methods)
          ? res.data.payment_methods
          : [];
        setMethods(rows);
        setCardSummary(res.data?.card_on_file || null);
      })
      .catch((err) => {
        console.error("Failed to load payment methods:", err);
        setMethods([]);
        setCardSummary(null);
      })
      .finally(() => setLoading(false));
  }, [tenantSlug]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  useEffect(() => {
    const handler = () => fetchMethods();
    window.addEventListener("focus", handler);
    window.addEventListener("booking:changed", handler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("booking:changed", handler);
    };
  }, [fetchMethods]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      fetchMethods();
    } catch (err) {
      console.error("Failed to delete payment method:", err);
      alert("Could not remove card. Please try again.");
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Payment Methods
      </Typography>
      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 2 }}>
              A verified saved card can still be declined by the card issuer during a future charge.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 1 }}>
              If your saved card needs to be updated, ask the business to send you a secure update link.
            </Typography>
            <List>
              {methods.map((pm) => (
                <ListItem
                  key={pm.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleDelete(pm.id)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={`${(pm.brand || "Card").toUpperCase()} •••• ${pm.last4} — ${pm.status_label || "Saved"}`}
                    secondary={
                      pm.expired
                        ? "This card is expired."
                        : pm.card_status === "expiring_soon"
                        ? `${pm.brand || "Card"} •••• ${pm.last4} expires soon.`
                        : pm.card_status === "update_required"
                        ? "This saved card can no longer be used."
                        : `Exp: ${pm.exp_month}/${pm.exp_year}`
                    }
                  />
                </ListItem>
              ))}
              {methods.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      cardSummary?.card_status === "provider_unavailable"
                        ? "Card details are temporarily unavailable. Try again later."
                        : "No card is currently saved."
                    }
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
