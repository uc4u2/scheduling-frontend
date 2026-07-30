import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import api from "../../utils/api";
import { useLocation, useParams } from "react-router-dom";
import { persistTenantSlug, resolveTenantSlug } from "../../utils/clientTenant";

export default function ClientPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [cardSummary, setCardSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
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

  async function startSaveCard() {
    if (launching) return;

    try {
      setLaunching(true);
      const site = tenantSlug || localStorage.getItem("site");
      if (!site) {
        alert("Open your provider's public site first so we know where to save the card.");
        return;
      }

      const payload = {
        policy: { mode: "capture" },
        items: [],
        card_on_file_consent: { accepted: true },
      };

      const { data } = await api.post(`/public/${site}/checkout/session`, payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        throw new Error("Stripe did not return a redirect URL.");
      }
    } catch (err) {
      console.error("Failed to start card save flow:", err);
      const message = err?.response?.data?.error || err?.message || "Could not start card save flow.";
      alert(message);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Payment Methods
      </Typography>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={startSaveCard}
        disabled={launching}
      >
        {launching ? "Starting secure card save..." : "Add Card (Secure via Stripe)"}
      </Button>
      <Paper sx={{ mt: 2 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2, pt: 2 }}>
              A verified saved card can still be declined by the card issuer during a future charge.
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
