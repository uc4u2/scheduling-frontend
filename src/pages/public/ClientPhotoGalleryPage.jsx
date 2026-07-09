import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { getPublicClientPhotoGallery } from "../finance/financeApi";

export default function ClientPhotoGalleryPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await getPublicClientPhotoGallery(token);
        if (!mounted) return;
        setGallery(res?.gallery || null);
        setItems(Array.isArray(res?.items) ? res.items : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load photo gallery.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#faf7f4", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          {loading ? (
            <Stack alignItems="center" sx={{ py: 8 }} spacing={1.5}>
              <CircularProgress size={26} />
              <Typography color="text.secondary">Loading gallery...</Typography>
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {gallery?.company_name || "Schedulaa"}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  Project photo gallery
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  {[gallery?.client_name, gallery?.work_order_number, gallery?.work_order_title].filter(Boolean).join(" • ")}
                </Typography>
              </Box>
              {items.length ? (
                <Grid container spacing={2}>
                  {items.map((row) => (
                    <Grid item xs={12} sm={6} md={4} key={`${row.source}-${row.id}`}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, height: "100%" }}>
                        <Stack spacing={1.25}>
                          <Box
                            component="img"
                            src={row.thumbnail_url || row.download_url}
                            alt={row.file_name || "Client photo"}
                            sx={{
                              width: "100%",
                              aspectRatio: "4 / 3",
                              objectFit: "cover",
                              borderRadius: 1.5,
                              bgcolor: "background.default",
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          />
                          <Stack spacing={0.5}>
                            <Typography fontWeight={700}>{row.file_name || "Photo"}</Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              <Chip size="small" label={row.source === "manager_client_photo" ? "Manager upload" : "Field photo"} variant="outlined" />
                              {row.security_status_label ? <Chip size="small" label={row.security_status_label} variant="outlined" color="success" /> : null}
                            </Stack>
                          </Stack>
                          {row.note ? (
                            <Typography variant="body2" color="text.secondary">
                              {row.note}
                            </Typography>
                          ) : null}
                          <Typography variant="caption" color="text.secondary">
                            {row.uploaded_by_name ? `Uploaded by ${row.uploaded_by_name}` : null}
                            {row.created_at ? `${row.uploaded_by_name ? " • " : ""}${new Date(row.created_at).toLocaleString()}` : ""}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              component={Link}
                              href={row.download_url || row.thumbnail_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open photo
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">No shareable photos are available for this gallery yet.</Alert>
              )}
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
