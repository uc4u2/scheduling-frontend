import { useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Drawer,
  Link,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LaunchIcon from "@mui/icons-material/Launch";
import { useTranslation } from "react-i18next";

const getDrawerAnchor = (provided, isSmall) => {
  if (provided) return provided;
  return isSmall ? "bottom" : "right";
};

export default function SeoHelpDrawer({ open, onClose, anchor, width }) {
  const { t } = useTranslation();
  const isSmall = useMediaQuery("(max-width:900px)");
  const drawerAnchor = getDrawerAnchor(anchor, isSmall);
  const drawerWidth = width ?? (isSmall ? "100%" : 500);
  const tt = (key, defaultValue) => t(key, { defaultValue });

  const sections = useMemo(
    () => [
      {
        title: "Drafts and publishing",
        body: [
          "Saving SEO creates a draft. Your public site does not change until you publish the website settings.",
          "Publishing promotes the complete pending website-settings draft, not only one SEO field. Review the warning before you confirm.",
        ],
      },
      {
        title: "Search result listing",
        body: [
          "Meta title and description are what Google shows most often.",
          "Keep the title under about 60 characters and the description under about 155 characters.",
          "Search Console verification does not guarantee indexing or ranking.",
        ],
      },
      {
        title: "Social sharing and favicon",
        body: [
          "Open Graph controls how links look in WhatsApp, Facebook, Slack, and other previews.",
          "Use a 1200×630 image. If empty, your homepage hero image is used when available.",
          "A square favicon of at least 48×48 pixels is recommended.",
        ],
      },
      {
        title: "Canonical URL, sitemap, and robots",
        body: [
          "Schedulaa uses a verified custom domain as the canonical public address. Otherwise it uses the published schedulaa.com tenant URL.",
          "The sitemap is at /sitemap.xml and robots rules are at /robots.txt on that public address.",
        ],
      },
    ],
    []
  );

  const urlPrefixSteps = [
    "Open Google Search Console.",
    "Choose URL prefix, not Domain.",
    "Copy the exact published website URL shown in the Schedulaa Google Search Console card.",
    "In Google, choose HTML tag verification.",
    "Paste the complete meta tag or its token into Schedulaa.",
    "Save the token, then publish it. Confirm the warning because other pending website settings can also be published.",
    "Confirm that Schedulaa shows Verification tag published. This describes Schedulaa publication only.",
    "Return to Google and click Verify.",
    "Open Sitemaps and submit sitemap.xml.",
    "Use URL Inspection for important published pages and request indexing when appropriate.",
  ];

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
        "aria-labelledby": "seo-help-title",
        sx: {
          width: drawerWidth,
          p: { xs: 2, sm: 3 },
          maxWidth: "100vw",
          zIndex: "inherit",
        },
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HelpOutlineIcon color="action" />
          <Typography id="seo-help-title" variant="h6" sx={{ fontWeight: 700 }}>
            {tt("management.domainSettings.seo.help.title", "SEO & Google Search Console help")}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {tt("management.domainSettings.seo.help.intro", "A safe step-by-step guide for publishing SEO settings and proving website ownership to Google.")}
        </Typography>

        <Divider />

        <Stack spacing={2.5}>
          {sections.map((section) => (
            <Box key={section.title}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
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

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Google URL-prefix workflow
            </Typography>
            <Box component="ol" sx={{ pl: 3, my: 0 }}>
              {urlPrefixSteps.map((step) => (
                <Typography component="li" variant="body2" color="text.secondary" key={step} sx={{ mb: 0.75 }}>
                  {step}
                </Typography>
              ))}
            </Box>
            <Button
              sx={{ mt: 1 }}
              variant="outlined"
              endIcon={<LaunchIcon />}
              href="https://search.google.com/search-console/welcome"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Google Search Console
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
              Advanced Domain-property workflow
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A Domain property covers all protocols and subdomains and requires a DNS TXT record. Copy the value Google provides, add it at the authoritative DNS provider, wait for DNS visibility, and then verify in Google. Saving a DNS value in Schedulaa is reference-only: it does not change Cloudflare or registrar DNS, and clicking Publish does not add a TXT record.
            </Typography>
          </Box>

          <Alert severity="info">
            Search Console ownership is separate from Google Business Profile and Google Maps. Neither one proves the other, and Schedulaa's published-token badge does not prove Google verification.
          </Alert>

          <Typography variant="caption" color="text.secondary">
            Google's interface can change. For current verification details, see{" "}
            <Link href="https://support.google.com/webmasters/answer/9008080" target="_blank" rel="noopener noreferrer">
              Google's ownership verification help
            </Link>.
          </Typography>
        </Stack>

        <Box sx={{ pt: 1 }}>
          <Button variant="contained" onClick={onClose} fullWidth autoFocus>
            Close
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
