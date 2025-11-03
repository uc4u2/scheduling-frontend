// src/components/website/ContactFormSection.js
import React, { useMemo, useState, useMemo as useMemo2 } from "react";
import { useParams } from "react-router-dom";
import {
  Box, Button, Container, Grid, Stack, TextField, Alert, CircularProgress, Typography
} from "@mui/material";

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
      { name: "name",    label: "Full name", required: true },
      { name: "email",   label: "Email",     required: true },
      { name: "phone",   label: "Phone" },
      { name: "subject", label: "Subject" },
      { name: "message", label: "Message",   required: true }
    ],
    maxWidth = "lg",
    titleAlign = "left",
    gutterX
  } = props;

  const { slug, pageSlug } = useParams();

  const [values, setValues]   = useState({});
  const [sending, setSending] = useState(false);
  const [ok, setOk]           = useState(false);
  const [err, setErr]         = useState("");

  const endpoint = useMemo(
    () => (slug ? `/api/public/${slug}/form/${encodeURIComponent(formKey)}` : null),
    [slug, formKey]
  );

  // --- helpers ---
  const capFirst = (s) => (typeof s === "string" && s.length ? s.charAt(0).toUpperCase() + s.slice(1) : "");
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
        type: f.type || (f.name === "email" ? "email" : f.name === "phone" ? "tel" : f.name === "message" ? "textarea" : "text"),
      }));
  }, [fields]);

  const onChange = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSending(true); setErr(""); setOk(false);
    try {
      if (!endpoint) throw new Error("Missing company slug in route.");
      const payload = {
        ...values,
        page_slug: pageSlug || null
      };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to submit form");
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
          {!!intro && (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: titleAlign === "center" ? "center" : "left" }}>
              {intro}
            </Typography>
          )}

          {ok  && <Alert severity="success">{successMessage}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}

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
                <Button type="submit" variant="contained" size="large" disabled={sending || !endpoint}>
                  {sending ? (<><CircularProgress size={20} sx={{ mr: 1 }} /> Sending…</>) : "Send message"}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
