import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../../utils/api";
import { CircularProgress, Typography, Paper, Button } from "@mui/material";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SwapRespond = () => {
  const query = useQuery();
  const swap_id = query.get("swap_id");
  const action = query.get("action");
  const [status, setStatus] = useState("pending"); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!swap_id || !["accept", "decline"].includes(action)) {
      setStatus("error");
      setMessage("Invalid link.");
      setLoading(false);
      return;
    }

    api
      .post(`/shift-swap-requests/respond-via-link`, {
        swap_id,
        action,
      })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Your response has been recorded.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(
          err.response?.data?.error ||
            "Failed to process your response. Maybe this swap is no longer pending?"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [swap_id, action]);

  return (
    <Paper sx={{ p: 4, mt: 8, maxWidth: 500, mx: "auto", textAlign: "center" }}>
      {loading ? (
        <CircularProgress />
      ) : (
        <Typography
          variant="h5"
          color={status === "success" ? "success.main" : "error.main"}
          gutterBottom
        >
          {message}
        </Typography>
      )}
      <Button href="/" sx={{ mt: 2 }} disabled={loading}>
        Back to Dashboard
      </Button>
    </Paper>
  );
};

export default SwapRespond;
