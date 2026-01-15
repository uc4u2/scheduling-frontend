// src/pages/sections/management/components/SeoHelpDrawer.jsx
import { useMemo } from "react";
import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const getDrawerAnchor = (provided, isSmall) => {
  if (provided) return provided;
  return isSmall ? "bottom" : "right";
};

export default function SeoHelpDrawer({ open, onClose, anchor, width }) {
  const isSmall = useMediaQuery("(max-width:900px)");
  const drawerAnchor = getDrawerAnchor(anchor, isSmall);
  const drawerWidth = width ?? (isSmall ? "100%" : 460);

  const sections = useMemo(
    () => [
      {
        title: "Drafts and publishing",
        body: [
          "Saving SEO creates a draft. Your public site will not change until you click Publish in Website & Pages.",
          "If you are testing and still see old text, publish first and then refresh your preview.",
        ],
      },
      {
        title: "Search result listing",
        body: [
          "Meta title and description are what Google shows most often.",
          "Keep the title under about 60 characters and the description under about 155 characters.",
          "Use plain language that matches what people search for.",
        ],
      },
      {
        title: "Meta keywords",
        body: [
          "Keywords are optional. Use 4 to 6 short phrases that describe your services.",
          "Separate phrases with commas.",
        ],
      },
      {
        title: "Social sharing (Open Graph)",
        body: [
          "Open Graph controls how links look in WhatsApp, Facebook, Slack, and SMS previews.",
          "Set a clear title and a short description. These can be different from your meta title.",
          "Use a 1200x630 image (PNG or JPG). If empty, your homepage hero image is used.",
        ],
      },
      {
        title: "Preview domain and canonical",
        body: [
          "Previews use your custom domain only after it is verified.",
          "Until then, previews use your schedulaa.com slug URL.",
        ],
      },
      {
        title: "Favicon",
        body: [
          "Your favicon is the small icon shown in the browser tab.",
          "If you do not upload one, we use your header logo as a fallback.",
          "Best size is 32x32 or 48x48 PNG (max 64x64).",
        ],
      },
      {
        title: "Test preview buttons",
        body: [
          "Use the Test buttons to open the live Open Graph preview HTML.",
          "If bots are still showing old data, publish and try again later. Some platforms cache previews.",
        ],
      },
      {
        title: "Sitemap and robots",
        body: [
          "Your sitemap lives at /sitemap.xml and robots rules at /robots.txt.",
          "After your custom domain is verified, those files use your custom domain instead of schedulaa.com.",
          "You can open the links from the SEO & Metadata card to verify what search engines will see.",
        ],
      },
      {
        title: "Google Search Console",
        body: [
          "Paste the verification token from Google to prove you own the domain.",
          "Use the meta tag method unless you manage DNS records yourself.",
          "After verification, submit your sitemap to speed up indexing.",
        ],
      },
    ],
    []
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      anchor={drawerAnchor}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2000,
        "& .MuiDrawer-paper": { zIndex: "inherit" },
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          p: 3,
          maxWidth: "100vw",
          zIndex: "inherit",
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HelpOutlineIcon color="action" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            SEO & Metadata help
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Simple explanations for each field and how previews work.
        </Typography>

        <Divider />

        <Stack spacing={2.5}>
          {sections.map((section) => (
            <Box key={section.title}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
                {section.title}
              </Typography>
              <Stack spacing={0.75}>
                {section.body.map((line) => (
                  <Typography key={line} variant="body2" color="text.secondary">
                    {line}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>

        <Box sx={{ pt: 1 }}>
          <Button variant="contained" onClick={onClose} fullWidth>
            Close
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
