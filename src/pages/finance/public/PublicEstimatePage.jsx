import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Link,
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
import { CA_PROVINCES, COUNTRIES, US_STATES } from "../../../constants/jobMetadata";
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

function optionLabel(options, value) {
  const normalized = String(value || "").trim().toUpperCase();
  return options.find((option) => option.code === normalized)?.label || String(value || "").trim();
}

function formatPublicPhone(value) {
  const raw = String(value || "").trim();
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 ${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return raw;
}

function websiteHref(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  return /^(?:https?:)?\/\//i.test(raw) ? raw : `https://${raw}`;
}

function buildCompanyDetails(estimate) {
  const countryCode = String(estimate?.company_country || "").trim().toUpperCase();
  const regionCode = String(estimate?.company_address_state || "").trim().toUpperCase();
  const country = optionLabel(COUNTRIES, countryCode);
  const regionOptions = countryCode === "CA" ? CA_PROVINCES : countryCode === "US" ? US_STATES : [];
  const region = optionLabel(regionOptions, regionCode);
  const street = String(estimate?.company_address_street || "").trim();
  const city = String(estimate?.company_address_city || "").trim();
  const postal = String(estimate?.company_address_zip || "").trim();
  const localityParts = [city, region].filter(Boolean);
  if ((street || city) && postal) localityParts.push(postal);
  const locality = localityParts.join(", ");
  const location = [locality, country].filter(Boolean).join(", ");
  const phone = formatPublicPhone(estimate?.company_phone);
  const website = String(estimate?.company_website || "").trim();

  return [
    street ? { key: "street", label: street } : null,
    location ? { key: "location", label: location } : null,
    phone ? { key: "phone", label: phone, href: `tel:${String(estimate.company_phone).replace(/[^+\d]/g, "")}` } : null,
    estimate?.company_email ? { key: "email", label: estimate.company_email, href: `mailto:${estimate.company_email}` } : null,
    website ? { key: "website", label: website.replace(/^https?:\/\//i, "").replace(/\/$/, ""), href: websiteHref(website) } : null,
  ].filter(Boolean);
}

function formatPublicDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  if (!match) return value || "-";
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatPublicDateTime(value, timezone) {
  if (!value) return "";
  const raw = String(value).trim();
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw) ? raw : `${raw}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return raw;
  try {
    const resolvedTimezone = timezone || "UTC";
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: resolvedTimezone,
    }).format(date);
    const timeLabel = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: resolvedTimezone,
    }).format(date);
    return `${dateLabel} at ${timeLabel}`;
  } catch {
    const dateLabel = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
    const timeLabel = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
    return `${dateLabel} at ${timeLabel}`;
  }
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
  const companyDetails = useMemo(() => buildCompanyDetails(estimate), [estimate]);
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
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        py: { xs: 3, md: 5 },
        "@media print": { bgcolor: "#fff", py: 0 },
      }}
    >
      <Container maxWidth="md" sx={{ "@media print": { maxWidth: "none", px: 0 } }}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2.5, md: 4 },
            borderRadius: 2,
            "@media print": { border: 0, p: 0 },
          }}
        >
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
                <Stack direction="row" spacing={1} sx={{ pt: 0.5, "@media print": { display: "none" } }}>
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

              <Paper
                component="section"
                aria-label="Prepared by"
                variant="outlined"
                sx={{
                  p: 2.25,
                  borderRadius: 2,
                  minWidth: { md: 280 },
                  maxWidth: { xs: "100%", md: 340 },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Stack spacing={0.75} alignItems={{ xs: "flex-start", md: "flex-end" }}>
                  <Typography variant="overline" color="text.secondary">
                    Prepared by
                  </Typography>
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
                  {companyDetails.map((row) => (
                    <Typography key={row.key} color="text.secondary" sx={{ textAlign: { xs: "left", md: "right" } }}>
                      {row.href ? (
                        <Link href={row.href} color="inherit" underline="hover">
                          {row.label}
                        </Link>
                      ) : row.label}
                    </Typography>
                  ))}
                  {estimate?.company_tax_id ? (
                    <Typography color="text.secondary" sx={{ textAlign: { xs: "left", md: "right" } }}>
                      Business / Tax ID: {estimate.company_tax_id}
                    </Typography>
                  ) : null}
                </Stack>
              </Paper>
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
                    <Typography color="text.secondary">
                      Response date: {formatPublicDateTime(receiptDate, estimate?.company_timezone)}
                    </Typography>
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
                  <Typography color="text.secondary">Issue date: {formatPublicDate(estimate?.issue_date)}</Typography>
                  <Typography color="text.secondary">Expiry date: {formatPublicDate(estimate?.expiry_date)}</Typography>
                  <Typography color="text.secondary">Currency: {estimate?.currency || "USD"}</Typography>
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
              <Box sx={{ "@media print": { display: "none" } }}>
                <Divider />

                <Stack spacing={1.5} sx={{ pt: 3 }}>
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
              </Box>
            ) : null}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
