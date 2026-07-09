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
    eyebrow = "",
    intro = "",
    formKey = "contact",
    successMessage = "Thanks! We’ll get back to you shortly.",
    submitLabel = "Send message",
    layoutVariant = "default",
    mediaImage = "",
    mediaAlt = "",
    mediaTitle = "",
    mediaBody = "",
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
  const mediaBodyHtml = useMemo2(() => normalizeBlockHtml(String(mediaBody || "")), [mediaBody]);

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
  const isEditorialSplit = layoutVariant === "editorialSplit";
  const resolvedMaxWidth = isEditorialSplit && maxWidth === "lg" ? "xl" : maxWidth;

  const formGrid = (
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
              submitLabel
            )}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box component="section">
      <Container
        maxWidth={resolvedMaxWidth === "full" ? false : resolvedMaxWidth}
        sx={{ px: typeof gutterX === "number" ? `${gutterX}px` : undefined }}
      >
        <Stack spacing={2.5}>
          {!!eyebrow && (
            <Box sx={{ textAlign: titleAlign }}>
              <Typography
                variant="overline"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.4,
                  py: 0.75,
                  borderRadius: 999,
                  letterSpacing: ".22em",
                  textTransform: "uppercase",
                  color: "var(--page-heading-color, #2b2119)",
                  background: "color-mix(in srgb, var(--page-btn-bg, #c49b63) 12%, rgba(255,255,255,0.9))",
                  border: "1px solid color-mix(in srgb, var(--page-btn-bg, #c49b63) 24%, rgba(255,255,255,0.24))",
                  fontWeight: 700,
                }}
              >
                {eyebrow}
              </Typography>
            </Box>
          )}
          {!!title && (
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: "clamp(2rem, 3.2vw, 3rem)",
                textAlign: titleAlign,
              }}
            >
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

          {isEditorialSplit ? (
            <Paper
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: "calc(var(--page-card-radius, 12px) * 1.35)",
                background:
                  "linear-gradient(135deg, rgba(10,10,10,0.94) 0%, rgba(25,22,18,0.98) 46%, rgba(14,14,14,0.98) 100%)",
                boxShadow: "0 24px 70px rgba(0,0,0,0.46)",
                border: "1px solid rgba(212,170,106,0.20)",
              }}
            >
              <Grid container>
                <Grid item xs={12} md={5}>
                  <Box
                    sx={{
                      minHeight: { xs: 300, md: 560 },
                      height: "100%",
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "flex-start",
                      p: { xs: 3, md: 4 },
                      color: "#f5f1e8",
                      backgroundColor: "#151515",
                      backgroundImage: mediaImage
                        ? `linear-gradient(180deg, rgba(10,10,10,0.12) 0%, rgba(10,10,10,0.72) 62%, rgba(10,10,10,0.92) 100%), url(${mediaImage})`
                        : "linear-gradient(135deg, rgba(196,155,99,0.26) 0%, rgba(17,17,17,0.98) 62%)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                    role={mediaImage ? "img" : undefined}
                    aria-label={mediaImage ? mediaAlt || mediaTitle || title : undefined}
                  >
                    <Stack
                      spacing={1.25}
                      sx={{
                        maxWidth: 340,
                        display: { xs: "none", md: "flex" },
                      }}
                    >
                      {!!mediaTitle && (
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 800,
                            lineHeight: 1.1,
                            color: "#f9f5ec",
                          }}
                        >
                          {mediaTitle}
                        </Typography>
                      )}
                      {!!mediaBody && !isEmptyHtml(mediaBodyHtml) && (
                        <Box
                          sx={{
                            color: "rgba(245,241,232,0.88)",
                            fontSize: "1rem",
                            lineHeight: 1.7,
                            "& p": { margin: 0, marginBottom: "0.55rem" },
                            "& p:last-of-type": { marginBottom: 0 },
                          }}
                          dangerouslySetInnerHTML={{ __html: safeHtml(mediaBodyHtml) }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Box
                    sx={{
                      p: { xs: 3, md: 4.5 },
                      minHeight: { md: 560 },
                      display: "flex",
                      alignItems: "center",
                      background:
                        "linear-gradient(180deg, rgba(28,28,28,0.98) 0%, rgba(13,13,13,0.98) 100%)",
                      "& .MuiTextField-root .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(255,255,255,0.04)",
                        color: "#f5f1e8",
                        borderRadius: 2,
                        "& fieldset": {
                          borderColor: "rgba(212,170,106,0.22)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(212,170,106,0.40)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "var(--page-btn-bg, #c49b63)",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(245,241,232,0.72)",
                      },
                      "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                        color: "#f5f1e8",
                      },
                      "& .MuiButton-contained": {
                        px: 3.5,
                        py: 1.4,
                        borderRadius: 2,
                        fontWeight: 800,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        background:
                          "linear-gradient(90deg, var(--page-btn-bg, #c49b63) 0%, #e9c88f 100%)",
                        color: "#14110d",
                        boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
                        "&:hover": {
                          background:
                            "linear-gradient(90deg, #d3a868 0%, #f2d39b 100%)",
                        },
                      },
                    }}
                  >
                    <Box sx={{ width: "100%" }}>{formGrid}</Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          ) : (
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
              {formGrid}
            </Paper>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
