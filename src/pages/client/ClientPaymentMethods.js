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

export default function ClientPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);

  const fetchMethods = useCallback(() => {
    setLoading(true);
    api
      .get("/payments")
      .then((res) => setMethods(res.data))
      .catch((err) => {
        console.error("Failed to load payment methods:", err);
        setMethods([]);
      })
      .finally(() => setLoading(false));
  }, []);

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
      const site = localStorage.getItem("site");
      if (!site) {
        alert("Open your provider's public site first so we know where to save the card.");
        return;
      }

      const payload = {
        policy: { mode: "capture" },
        client_email: localStorage.getItem("email") || "",
        items: [],
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
                  primary={`**** **** **** ${pm.last4} (${pm.brand})`}
                  secondary={`Exp: ${pm.exp_month}/${pm.exp_year}`}
                />
              </ListItem>
            ))}
            {methods.length === 0 && (
              <ListItem>
                <ListItemText primary="No cards found." />
              </ListItem>
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
}
