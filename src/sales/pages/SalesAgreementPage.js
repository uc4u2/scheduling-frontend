import React, { useEffect, useState } from "react";
import { Box, Button, Checkbox, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import salesRepApi from "../../api/salesRepApi";

export default function SalesAgreementPage() {
  const [agreement, setAgreement] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await salesRepApi.get("/agreement");
        setAgreement(data);
      } catch {
        setStatus("Unable to load agreement.");
      }
    };
    load();
  }, []);

  const acceptAgreement = async () => {
    setStatus("");
    if (!agreement?.version) return;
    try {
      await salesRepApi.post("/agreement/accept", { version: agreement.version });
      navigate("/sales/summary");
    } catch (err) {
      if (err?.response?.data?.error === "invalid_version") {
        setStatus("Agreement version mismatch. Please refresh and try again.");
      } else {
        setStatus("Failed to accept agreement.");
      }
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", mt: 6, mb: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5">{agreement?.title || "Sales Rep Agreement"}</Typography>
          <Typography variant="body2" color="text.secondary">
            Please review and accept before accessing the Sales Rep portal.
          </Typography>
          <Box
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              maxHeight: 420,
              overflow: "auto",
              whiteSpace: "pre-line",
            }}
          >
            <Typography variant="body2">
              {agreement?.content_markdown || "Loading agreement..."}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Checkbox checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <Typography variant="body2">I have read and agree</Typography>
          </Stack>
          {status && (
            <Typography variant="body2" color="error">
              {status}
            </Typography>
          )}
          <Button variant="contained" disabled={!accepted} onClick={acceptAgreement}>
            Accept and Continue
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
