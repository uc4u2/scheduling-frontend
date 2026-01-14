// src/pages/client/PublicReview.js
import React, { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Alert,
  TextField,
  Stack,
  CircularProgress,
  Rating,
  Divider,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import HomeIcon from "@mui/icons-material/Home";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import RateReviewIcon from "@mui/icons-material/RateReview";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import PublicPageShell from "./PublicPageShell";
import { api } from "../../utils/api";

function hostLabel(url) {
  try {
    const u = new URL(url);
    const host = (u.hostname || "").replace(/^www\./i, "");
    if (host.includes("google")) return "Review on Google";
    if (host.includes("yelp")) return "Review on Yelp";
    if (host.includes("facebook")) return "Review on Facebook";
    return `Review on ${host}`;
  } catch {
    return "External Review";
  }
}

export default function PublicReview({ slugOverride }) {
  const { slug: routeSlug, appointmentId } = useParams();
  const slug = slugOverride || routeSlug;
  const [search] = useSearchParams();
  // accept either ?t= or ?token=
  const token = search.get("token") || search.get("t") || "";
  const navigate = useNavigate();
  const basePath = slugOverride ? "" : `/${slug}`;
  const rootPath = basePath || "/";

  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // external reviews (Google, Yelp, etc.)
  const [extUrl, setExtUrl] = useState("");

  // Verify token first, then resolve appointment + fetch external review URL
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        // 0) Verify link via new endpoint
        const verify = await api.get(`/api/public/postservice/verify`, {
          params: { t: token, action: "review", appointment_id: Number(appointmentId) },
          noCompanyHeader: true,
          noAuth: true,
        });
        if (cancelled) return;
        if (!verify?.data?.ok) {
          setError(verify?.data?.error || "Expired or invalid link.");
          setResolved(null);
          return;
        }

        // 1) Resolve appointment data
        const resv = await api.get(`/public/${slug}/feedback/resolve`, {
          params: { appointment_id: appointmentId, token },
          noCompanyHeader: true,
          noAuth: true,
        });
        if (cancelled) return;
        setResolved(resv.data);
        const fromResolve = resv?.data?.review_redirect_url || "";

        // 2) External review URL (prefer resolve payload; fallback to public settings)
        if (fromResolve) {
          setExtUrl(fromResolve);
        } else {
          try {
            const cfg = await api.get(`/public/${slug}/reviews-settings`, {
              noCompanyHeader: true,
              noAuth: true,
            });
            if (!cancelled) setExtUrl(cfg?.data?.review_redirect_url || "");
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || "Unable to load appointment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, appointmentId, token]);

  const submitReview = async () => {
    if (!rating || rating < 1 || rating > 5) {
      setError("Please choose a rating from 1 to 5.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await api.post(`/public/${slug}/feedback/review`, {
        appointment_id: Number(appointmentId),
        token,
        rating: Number(rating),
        comment: (comment || "").trim(),
      }, { noCompanyHeader: true, noAuth: true });
      setDone(true);
    } catch (e) {
      setError(e?.response?.data?.error || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- UI ----------------
  if (loading) {
    return (
      <PublicPageShell activeKey="__reviews" slugOverride={slug}>
        <Container maxWidth="sm" sx={{ mt: 2, textAlign: "center" }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading…</Typography>
        </Container>
      </PublicPageShell>
    );
  }

  if (error) {
    return (
      <PublicPageShell activeKey="__reviews" slugOverride={slug}>
        <Container maxWidth="sm" sx={{ mt: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </PublicPageShell>
    );
  }

  if (!resolved) {
    return (
      <PublicPageShell activeKey="__reviews" slugOverride={slug}>
        <Container maxWidth="sm" sx={{ mt: 2 }}>
          <Alert severity="error">Appointment not found.</Alert>
        </Container>
      </PublicPageShell>
    );
  }

  const page = (
    <Container maxWidth="sm" sx={{ mt: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Header */}
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Leave a review
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {resolved.provider} • {resolved.service}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {/* Success state */}
        {done ? (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              Thanks! Your review was submitted.
            </Alert>

            {/* CTA row — responsive & tidy */}
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                flexWrap: "wrap",
                "& > *": { minWidth: { xs: "100%", sm: "auto" } },
              }}
            >
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => navigate(rootPath)}
              >
                Back to {slug}
              </Button>

              <Button
                variant="outlined"
                startIcon={<VolunteerActivismIcon />}
                onClick={() =>
                  navigate(
                    `${basePath || ""}/tip/${appointmentId}?token=${encodeURIComponent(token)}`
                  )
                }
              >
                Leave a Tip
              </Button>

              {!!extUrl && (
                <Button
                  variant="text"
                  startIcon={<LaunchIcon />}
                  component="a"
                  href={extUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {hostLabel(extUrl)}
                </Button>
              )}
            </Stack>
          </>
        ) : (
          /* Form */
          <>
            <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
              Rating
            </Typography>
            <Rating
              value={rating}
              onChange={(_, v) => setRating(v || 5)}
              sx={{ mb: 1 }}
            />

            <TextField
              label="Comment (optional)"
              multiline
              minRows={3}
              fullWidth
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              startIcon={<RateReviewIcon />}
              sx={{ mt: 2 }}
              onClick={submitReview}
              disabled={submitting}
            >
              {submitting ? "Submitting…" : "Submit review"}
            </Button>
          </>
        )}
      </Paper>

      <Box sx={{ mt: 2 }} />
    </Container>
  );

  return (
    <PublicPageShell activeKey="__reviews" slugOverride={slug}>
      {page}
    </PublicPageShell>
  );
}
