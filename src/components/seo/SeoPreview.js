import { Box, Stack, Typography } from "@mui/material";

export const SearchSnippetPreview = ({ title, url, description }) => (
  <Box
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      p: 2,
      bgcolor: "background.paper",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {url || "https://example.com"}
    </Typography>
    <Typography
      variant="subtitle2"
      sx={{ color: "primary.main", fontWeight: 600, mt: 0.5 }}
    >
      {title || "Your page title"}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description || "A short description will appear here in search results."}
    </Typography>
  </Box>
);

export const SocialCardPreview = ({ title, description, image }) => (
  <Stack
    direction={{ xs: "column", sm: "row" }}
    spacing={2}
    sx={{
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      p: 2,
      alignItems: "center",
    }}
  >
    <Box
      sx={{
        width: 120,
        height: 120,
        borderRadius: 1,
        bgcolor: image ? "transparent" : "action.hover",
        backgroundImage: image ? `url(${image})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: image ? "1px solid rgba(0,0,0,0.08)" : "1px dashed",
        flexShrink: 0,
      }}
    />
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {title || "Social title"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description || "Your summary will appear in chat previews."}
      </Typography>
    </Box>
  </Stack>
);
