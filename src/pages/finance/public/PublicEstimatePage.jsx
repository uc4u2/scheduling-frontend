import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useParams, useSearchParams } from "react-router-dom";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import { formatCurrency } from "../../../utils/formatters";
import { getPublicEstimate, respondPublicEstimate } from "../financeApi";

function EstimateTotals({ estimate }) {
  return (
    <Stack spacing={1} sx={{ minWidth: 220 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography color="text.secondary">Subtotal</Typography>
        <Typography>{formatCurrency(estimate?.subtotal || 0, estimate?.currency)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography color="text.secondary">Tax</Typography>
        <Typography>{formatCurrency(estimate?.tax_total || 0, estimate?.currency)}</Typography>
      </Stack>
      <Stack direction="row" justifyContent="space-between">
        <Typography color="text.secondary">Discount</Typography>
        <Typography>{formatCurrency(estimate?.discount_total || 0, estimate?.currency)}</Typography>
      </Stack>
      <Divider />
      <Stack direction="row" justifyContent="space-between">
        <Typography fontWeight={700}>Total</Typography>
        <Typography fontWeight={700}>{formatCurrency(estimate?.total || 0, estimate?.currency)}</Typography>
      </Stack>
    </Stack>
  );
}

function buildCompanyLines(estimate) {
  const cityState = [estimate?.company_address_city, estimate?.company_address_state].filter(Boolean).join(", ");
  const locality = [cityState, estimate?.company_address_zip].filter(Boolean).join(" ").trim();
  return [
    estimate?.company_address_street,
    locality || null,
    estimate?.company_country,
    estimate?.company_phone,
    estimate?.company_email,
    estimate?.company_website,
  ].filter(Boolean);
}

function estimateStatusLabel(status) {
  return String(status || "draft")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function PublicEstimatePage() {
  const theme = useTheme();
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", email: "", note: "" });

  const alreadyResponded = useMemo(
    () => Boolean(estimate?.client_accepted_at || estimate?.client_rejected_at),
    [estimate]
  );
  const companyLines = useMemo(() => buildCompanyLines(estimate), [estimate]);
  const receiptLabel = estimate?.client_accepted_at
    ? "Approved"
    : estimate?.client_rejected_at
      ? "Declined"
      : null;
  const receiptDate = estimate?.client_accepted_at || estimate?.client_rejected_at || null;
  const printMode = searchParams.get("print") === "1";

  const loadEstimate = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getPublicEstimate(token);
      const nextEstimate = payload?.estimate || null;
      setEstimate(nextEstimate);
      setForm((prev) => ({
        ...prev,
        name: prev.name || nextEstimate?.client_name || "",
        email: prev.email || nextEstimate?.client_email || "",
      }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Unable to load estimate.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimate();
  }, [token]);

  useEffect(() => {
    if (!printMode || !estimate || typeof window === "undefined") return;
    const timer = window.setTimeout(() => window.print(), 350);
    return () => window.clearTimeout(timer);
  }, [printMode, estimate]);

  const handleRespond = async (decision) => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      const payload = await respondPublicEstimate(token, {
        decision,
        name: form.name,
        email: form.email,
        note: form.note,
      });
      setEstimate(payload?.estimate || estimate);
      setSuccess(decision === "accept" ? "Estimate accepted." : "Estimate rejected.");
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "Unable to submit your response.";
      setError(message === "estimate_already_responded" ? "This estimate already has a client response." : message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading estimate...</Typography>
      </Container>
    );
  }

  if (error && !estimate) {
    return (
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.palette.background.default, py: { xs: 3, md: 5 } }}>
      <Container maxWidth="md">
        <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2 }}>
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "flex-start" }}
            >
              <Stack spacing={1}>
                <Typography variant="overline" color="text.secondary">
                  Estimate
                </Typography>
                <Typography variant="h4" fontWeight={800}>
                  {estimate?.title || "Estimate"}
                </Typography>
                <Typography color="text.secondary">
                  {estimate?.estimate_number || ""}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: "wrap" }}>
                  <Chip size="small" label={estimateStatusLabel(estimate?.status)} variant="outlined" />
                </Stack>
                <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LocalPrintshopOutlinedIcon />}
                    onClick={() => window.print()}
                  >
                    Print / Save PDF
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={1} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ width: { xs: "100%", md: "auto" } }}>
                {estimate?.company_logo_url ? (
                  <Box
                    component="img"
                    src={estimate.company_logo_url}
                    alt={estimate?.company_name || "Business logo"}
                    sx={{ maxHeight: 76, maxWidth: 220, objectFit: "contain" }}
                  />
                ) : null}
                <Typography variant="h6" fontWeight={700}>
                  {estimate?.company_name || "Business"}
                </Typography>
                {companyLines.map((row) => (
                  <Typography key={row} color="text.secondary" sx={{ textAlign: { xs: "left", md: "right" } }}>
                    {row}
                  </Typography>
                ))}
                {estimate?.company_tax_id ? (
                  <Typography color="text.secondary" sx={{ textAlign: { xs: "left", md: "right" } }}>
                    Business / Tax ID: {estimate.company_tax_id}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {success ? <Alert severity="success">{success}</Alert> : null}
            {receiptLabel ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover,
                }}
              >
                <Stack spacing={0.75}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
                    <Typography fontWeight={700}>{receiptLabel} receipt</Typography>
                    <Chip
                      size="small"
                      label={receiptLabel}
                      color={estimate?.client_accepted_at ? "success" : "default"}
                      variant={estimate?.client_accepted_at ? "filled" : "outlined"}
                      sx={
                        estimate?.client_accepted_at
                          ? {
                              bgcolor: "#1f7a3d",
                              color: "#ffffff",
                              fontWeight: 700,
                              "& .MuiChip-label": {
                                color: "#ffffff",
                              },
                            }
                          : undefined
                      }
                    />
                  </Stack>
                  {estimate?.client_response_name ? (
                    <Typography color="text.secondary">
                      {estimate.client_response_name}
                      {estimate?.client_response_email ? ` • ${estimate.client_response_email}` : ""}
                    </Typography>
                  ) : null}
                  {receiptDate ? (
                    <Typography color="text.secondary">Response date: {receiptDate}</Typography>
                  ) : null}
                  <Typography color="text.secondary">This is a typed approval record.</Typography>
                  {estimate?.client_response_note ? (
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                      {estimate.client_response_note}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
            ) : null}

            {alreadyResponded ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: theme.palette.action.hover,
                }}
              >
                <Stack spacing={0.75}>
                  <Typography fontWeight={700}>
                    {estimate?.client_accepted_at
                      ? "This estimate has already been accepted."
                      : "This estimate has already been rejected."}
                  </Typography>
                  <Typography color="text.secondary">
                    {estimate?.client_accepted_at
                      ? "Thank you - the business will follow up with the next step."
                      : "Thank you - the business has received your response."}
                  </Typography>
                </Stack>
              </Paper>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={3} justifyContent="space-between">
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
                <Stack spacing={1.25}>
                  <Typography variant="overline" color="text.secondary">
                    Bill To
                  </Typography>
                  <Typography>{estimate?.client_name || "-"}</Typography>
                  {estimate?.client_email ? <Typography color="text.secondary">{estimate.client_email}</Typography> : null}
                  {estimate?.client_phone ? <Typography color="text.secondary">{estimate.client_phone}</Typography> : null}
                </Stack>
              </Paper>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
                <Stack spacing={1.25}>
                  <Typography variant="overline" color="text.secondary">
                    Estimate Details
                  </Typography>
                  <Typography color="text.secondary">Issue date: {estimate?.issue_date || "-"}</Typography>
                  <Typography color="text.secondary">Expiry date: {estimate?.expiry_date || "-"}</Typography>
                  <Typography color="text.secondary">Currency: {estimate?.currency || "USD"}</Typography>
                  {estimate?.public_viewed_at ? (
                    <Typography color="text.secondary">Viewed: {estimate.public_viewed_at}</Typography>
                  ) : null}
                </Stack>
              </Paper>
              <EstimateTotals estimate={estimate} />
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Unit price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(estimate?.line_items || []).map((line) => (
                    <TableRow key={line.id || `${line.description}-${line.sort_order || 0}`}>
                      <TableCell>{line.description || "Line item"}</TableCell>
                      <TableCell align="right">{Number(line.quantity || 0)}</TableCell>
                      <TableCell align="right">{formatCurrency(line.unit_price || 0, estimate?.currency)}</TableCell>
                      <TableCell align="right">{formatCurrency(line.amount || 0, estimate?.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            {estimate?.notes ? (
              <Stack spacing={0.75}>
                <Typography fontWeight={700}>Notes</Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{estimate.notes}</Typography>
              </Stack>
            ) : null}

            {estimate?.terms ? (
              <Stack spacing={0.75}>
                <Typography fontWeight={700}>Terms</Typography>
                <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{estimate.terms}</Typography>
              </Stack>
            ) : null}

            {!printMode && !alreadyResponded ? (
              <>
                <Divider />

                <Stack spacing={1.5}>
                  <Typography fontWeight={700}>Respond to this estimate</Typography>
                  <TextField
                    label="Your name"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                  <TextField
                    label="Your email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                  <TextField
                    label="Note (optional)"
                    multiline
                    minRows={3}
                    value={form.note}
                    onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={() => handleRespond("accept")}
                      disabled={submitting || alreadyResponded}
                    >
                      Accept Estimate
                    </Button>
                    <Button
                      variant="outlined"
                      color="warning"
                      onClick={() => handleRespond("reject")}
                      disabled={submitting || alreadyResponded}
                    >
                      Reject Estimate
                    </Button>
                  </Stack>
                </Stack>
              </>
            ) : null}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
