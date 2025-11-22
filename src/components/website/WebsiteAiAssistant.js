import React, { useState } from "react";
import {
  Alert,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Divider,
  Chip,
  IconButton,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { api } from "../../utils/api";

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
};

const SectionPreview = ({ title, body, onCopy }) => (
  <Paper
    variant="outlined"
    sx={{ p: 2, borderRadius: 2, mb: 1, backgroundColor: "background.paper" }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      </Box>
      <IconButton size="small" onClick={onCopy}>
        <ContentCopyIcon fontSize="inherit" />
      </IconButton>
    </Stack>
  </Paper>
);

export default function WebsiteAiAssistant({ locale = "en" }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post("/api/ai/website-copy", {
        prompt,
        locale,
      });
      setData(response.data || null);
    } catch (err) {
      const display =
        err?.response?.data?.error ||
        err?.displayMessage ||
        "Unable to generate copy right now.";
      setError(display);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <AutoAwesomeIcon color="primary" fontSize="small" />
        <Typography variant="subtitle1" fontWeight={600}>
          AI Website Assistant
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Describe your business and instantly draft hero copy, sections, FAQ, and SEO
        ideas. Paste the suggestions into the editor or tweak them manually.
      </Typography>

      <TextField
        multiline
        minRows={3}
        fullWidth
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., Brow & lash studio in Toronto with 5 chairs and online booking"
      />
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
        <Button
          variant="contained"
          size="small"
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? "Generating..." : "Generate copy"}
        </Button>
        {data && (
          <Chip
            size="small"
            color="success"
            label="Draft ready"
            icon={<AutoAwesomeIcon fontSize="small" />}
          />
        )}
      </Stack>

      {data && (
        <Box sx={{ mt: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              Hero
            </Typography>
            <Typography variant="h6">{data.hero?.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.hero?.subtitle}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
              {data.hero?.primary_cta && (
                <Chip
                  label={`Primary CTA: ${data.hero.primary_cta}`}
                  size="small"
                  variant="outlined"
                />
              )}
              {data.hero?.secondary_cta && (
                <Chip
                  label={`Secondary CTA: ${data.hero.secondary_cta}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Paper>

          {Array.isArray(data.sections) && data.sections.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Sections
              </Typography>
              {data.sections.map((section, idx) => (
                <SectionPreview
                  key={`${section.key}-${idx}`}
                  title={section.headline}
                  body={section.body}
                  onCopy={() => copyToClipboard(`${section.headline}\n\n${section.body}`)}
                />
              ))}
            </>
          )}

          {Array.isArray(data.faq) && data.faq.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                FAQ Ideas
              </Typography>
              {data.faq.map((item, idx) => (
                <Paper
                  key={`faq-${idx}`}
                  variant="outlined"
                  sx={{ p: 2, mb: 1, borderRadius: 2 }}
                >
                  <Typography variant="subtitle2">{item.q}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {item.a}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => copyToClipboard(`${item.q}\n${item.a}`)}
                    sx={{ mt: 1 }}
                  >
                    Copy
                  </Button>
                </Paper>
              ))}
            </>
          )}

          {data.seo && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                SEO Suggestions
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Title: {data.seo.title}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Meta: {data.seo.meta_description}
              </Typography>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
