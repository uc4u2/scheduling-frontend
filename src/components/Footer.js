import React, { useContext, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Link as MuiLink,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
} from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Link } from "react-router-dom";
import { ThemeModeContext } from "../App";

const sections = [
  {
    title: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Careers (coming soon)", to: "/about#careers" },
      { label: "Press", to: "mailto:admin@schedulaa.com", external: true },
    ],
  },
  {
    title: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
      { label: "Status", to: "/status", external: true },
      { label: "Roadmap", to: "mailto:admin@schedulaa.com", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", to: "/blog" },
      { label: "FAQ", to: "/faq" },
      { label: "Help Center", to: "/client/support" },
      { label: "Documentation", to: "/docs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", to: "/terms" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Cookie Policy", to: "/cookie" },
      { label: "Acceptable Use Policy", to: "/acceptable-use" },
      { label: "Data Processing Addendum", to: "/data-processing" },
      { label: "Security", to: "/security" },
    ],
  },
];

const themeNames = [
  "sunset",
  "emeraldNight",
  "dark",
  "cool",
  "navy",
  "aqua",
  "forest",
  "rose",
  "slate",
  "gold",
  "sky",
  "lavender",
  "mint",
  "coral",
  "crimson",
  "charcoal",
  "coffee",
  "sunflower",
  "eggplant",
];

const themeLabels = {
  emeraldNight: "Emerald Night",
  dark: "Dark",
  cool: "Cool Blue",
  navy: "Navy Night",
  sunset: "Sunset",
  aqua: "Aqua",
  forest: "Forest",
  rose: "Rose",
  slate: "Slate",
  gold: "Gold",
  sky: "Sky",
  lavender: "Lavender",
  mint: "Mint",
  coral: "Coral",
  crimson: "Crimson",
  charcoal: "Charcoal",
  coffee: "Coffee",
  sunflower: "Sunflower",
  eggplant: "Eggplant",
};

const Footer = () => {
  const { themeName, setThemeName } = useContext(ThemeModeContext);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenThemes = (event) => setAnchorEl(event.currentTarget);
  const handleCloseThemes = () => setAnchorEl(null);
  const handleThemeChange = (name) => {
    setThemeName(name);
    localStorage.setItem("theme", name);
    handleCloseThemes();
  };

  const renderLink = ({ label, to, external }) => {
    if (external) {
      return (
        <MuiLink
          key={label}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          variant="body2"
          sx={{ display: "block", color: "inherit", opacity: 0.8, mb: 1, textDecoration: "none" }}
        >
          {label}
        </MuiLink>
      );
    }
    return (
      <MuiLink
        key={label}
        component={Link}
        to={to}
        variant="body2"
        sx={{ display: "block", color: "inherit", opacity: 0.8, mb: 1, textDecoration: "none" }}
      >
        {label}
      </MuiLink>
    );
  };

  return (
    <Box component="footer" sx={{ background: (theme) => theme.palette.background.paper, borderTop: (theme) => `1px solid ${theme.palette.divider}`, mt: 10 }}>
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 3, md: 6 }, py: { xs: 6, md: 8 } }}>
        <Grid container spacing={4}>
          {sections.map((section) => (
            <Grid item xs={12} sm={6} md={3} key={section.title}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                {section.title}
              </Typography>
              {section.links.map(renderLink)}
            </Grid>
          ))}
        </Grid>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={3} mt={6}>
          <Stack spacing={1}>
            <Typography variant="subtitle1" fontWeight={700}>
              Schedulaa
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {"\u00A9"} {new Date().getFullYear()} Photo Artisto Corp. All rights reserved.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1080 Market Street, Suite 500, San Francisco, CA 94103 USA
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="LinkedIn">
              <IconButton href="https://www.linkedin.com/company/schedulaa/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Instagram">
              <IconButton href="https://www.instagram.com/schedulaa.app" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="YouTube">
              <IconButton href="https://www.youtube.com/@schedulaa" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <YouTubeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Change theme">
              <IconButton aria-label="Change theme" onClick={handleOpenThemes}>
                <PaletteIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseThemes}>
              {themeNames.map((name) => (
                <MenuItem key={name} selected={themeName === name} onClick={() => handleThemeChange(name)}>
                  {themeLabels[name]}
                </MenuItem>
              ))}
            </Menu>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;





