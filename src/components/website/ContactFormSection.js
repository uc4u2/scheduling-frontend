// src/components/website/ContactFormSection.js
import React, { useMemo, useState, useMemo as useMemo2 } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  TextField,
  Alert,
  CircularProgress,
  Typography,
  Paper,
} from "@mui/material";
import { publicSite } from "../../utils/api";
import { safeHtml } from "../../utils/safeHtml";
import { normalizeBlockHtml, isEmptyHtml } from "../../utils/html";

/**
 * ContactFormSection
 * Props:
 * - title, intro
 * - formKey: string (defaults to "contact")
 * - successMessage: string
 * - fields: array<string | { name, label?, required?, type?, placeholder? }>
 * - maxWidth, titleAlign, gutterX
 */
export default function ContactFormSection(props) {
  const {
    title = "Contact Us",
    intro = "",
    formKey = "contact",
    successMessage = "Thanks! We’ll get back to you shortly.",
    fields = [
      { name: "name", label: "Full name", required: true },
      { name: "email", label: "Email", required: true },
      { name: "phone", label: "Phone" },
      { name: "subject", label: "Subject" },
      { name: "message", label: "Message", required: true },
    ],
    maxWidth = "lg",
    titleAlign = "left",
    gutterX,
  } = props;

  const { slug, pageSlug } = useParams();
  const location = useLocation();

  const [values, setValues] = useState({});
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  // Resolve slug from route, query, or stored site (custom domains)
  const resolvedSlug = useMemo(() => {
    const qs = new URLSearchParams(location.search || "");
    const slugFromQuery = qs.get("slug");
    let stored = "";
    try {
      stored = localStorage.getItem("site") || "";
    } catch {}
    return (slug || slugFromQuery || stored || "").trim() || null;
  }, [slug, location.search]);

  // --- helpers ---
  const capFirst = (s) =>
    typeof s === "string" && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  const niceLabel = (name) => capFirst(String(name || "").replace(/[_-]+/g, " "));

  // Normalize fields: allow strings or objects; filter out falsy/invalid
  const normFields = useMemo2(() => {
    const arr = Array.isArray(fields) ? fields : [];
    return arr
      .filter(Boolean)
      .map((f) => (typeof f === "string" ? { name: f } : f))
      .filter((f) => f && typeof f.name === "string" && f.name.trim().length > 0)
      .map((f) => ({
        ...f,
        name: f.name.trim(),
        label: f.label || niceLabel(f.name),
        // infer missing types
        type:
          f.type ||
          (f.name === "email"
            ? "email"
            : f.name === "phone"
            ? "tel"
            : f.name === "message"
            ? "textarea"
            : "text"),
      }));
  }, [fields]);

  const onChange = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const introHtml = useMemo2(() => normalizeBlockHtml(String(intro || "")), [intro]);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setErr("");
    setOk(false);

    try {
      if (!resolvedSlug) {
        throw new Error("Missing company slug in route.");
      }

      const payload = {
        ...values,
        page_slug: pageSlug || null,
      };

      // Use shared helper so production calls the Render backend, not the static host
      const json = await publicSite.sendContact(resolvedSlug, payload, formKey);

      if (!json || json.ok !== true) {
        throw new Error(json?.error || "Failed to submit form");
      }

      setOk(true);
      setValues({});
    } catch (e2) {
      setErr(e2.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  const gridCols = (f) => (f.type === "textarea" || f.name === "message" ? 12 : 6);

  return (
    <Box component="section">
      <Container
        maxWidth={maxWidth === "full" ? false : maxWidth}
        sx={{ px: typeof gutterX === "number" ? `${gutterX}px` : undefined }}
      >
        <Stack spacing={2}>
          {!!title && (
            <Typography variant="h4" sx={{ fontWeight: 800, textAlign: titleAlign }}>
              {title}
            </Typography>
          )}
          {!!intro && !isEmptyHtml(introHtml) && (
            <Box
              sx={{
                textAlign: titleAlign === "center" ? "center" : "left",
                color: "text.secondary",
                "& p": { margin: 0, marginBottom: "0.5rem" },
                "& p:last-of-type": { marginBottom: 0 },
              }}
              dangerouslySetInnerHTML={{ __html: safeHtml(introHtml) }}
            />
          )}

          {ok && <Alert severity="success">{successMessage}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: "var(--page-card-radius, 12px)",
              backgroundColor: "var(--page-card-bg, rgba(255,255,255,0.92))",
              boxShadow: "var(--page-card-shadow, 0 8px 30px rgba(0,0,0,0.08))",
              border: "1px solid rgba(148,163,184,0.18)",
            }}
          >
            <Box component="form" onSubmit={submit} noValidate>
              <Grid container spacing={2}>
                {normFields.map((f) => (
                  <Grid key={f.name} item xs={12} sm={gridCols(f)}>
                    {f.type === "textarea" ? (
                      <TextField
                        label={f.label}
                        value={values[f.name] || ""}
                        onChange={onChange(f.name)}
                        required={!!f.required}
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder={f.placeholder || ""}
                      />
                    ) : (
                      <TextField
                        label={f.label}
                        type={f.type || "text"}
                        value={values[f.name] || ""}
                        onChange={onChange(f.name)}
                        required={!!f.required}
                        fullWidth
                        placeholder={f.placeholder || ""}
                      />
                    )}
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" size="large" disabled={sending || !resolvedSlug}>
                    {sending ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} /> Sending…
                      </>
                    ) : (
                      "Send message"
                    )}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
