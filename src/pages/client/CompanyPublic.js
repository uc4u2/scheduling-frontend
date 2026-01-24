// src/pages/client/CompanyPublic.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  Alert,
  CircularProgress,
  GlobalStyles,
  Snackbar,
  Drawer,
  Grid,
  Paper,
  TextField,
  Link,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import BrushIcon from "@mui/icons-material/Brush";
import PublishIcon from "@mui/icons-material/Publish";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MenuIcon from "@mui/icons-material/Menu";
import { useParams, useSearchParams, Link as RouterLink, useNavigate } from "react-router-dom";

import { api, wb, API_BASE_URL } from "../../utils/api";
import { RenderSections } from "../../components/website/RenderSections";
import VisualSiteBuilder from "../sections/management/VisualSiteBuilder";
import ThemeRuntimeProvider from "../../components/website/ThemeRuntimeProvider";
import PublicReviewList from "./PublicReviewList";
import { resolveSiteHref, transformLinksDeep } from "../../components/website/linking";
import { normalizeNavStyle, navStyleToCssVars, createNavButtonStyles } from "../../utils/navStyle";
import { getLuminance, pickTextColorForBg } from "../../utils/color";
import { navSettings } from "../../utils/api";
import NavStyleHydrator from "../../components/website/NavStyleHydrator";
import { ServiceListEmbedded } from "./ServiceList";
import { ProductListEmbedded } from "./ProductList";
import { MyBasketEmbedded } from "./MyBasket";
import { JobsListEmbedded } from "../public/PublicJobsListPage";
import { JobsDetailEmbedded } from "../public/PublicJobDetailPage";
import buildImgixUrl from "../../utils/imgix";
import { safeHtml } from "../../utils/safeHtml";
import {
  cloneFooterColumns,
  cloneLegalLinks,
  formatCopyrightText,
} from "../../utils/footerDefaults";
import { SOCIAL_ICON_MAP, DEFAULT_SOCIAL_ICON } from "../../utils/socialIcons";
import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";
import { getTenantHostMode } from "../../utils/tenant";
import TimezoneSelect from "../../components/TimezoneSelect";

const LEGAL_FALLBACK_CONTENT = {
  privacy: {
    title: "Privacy Policy",
    intro: "How we collect, protect, and use customer information across appointments, payments, and communications.",
    sections: [
      {
        heading: "Information we collect",
        paragraphs: [
          "We gather only the information required to deliver scheduling, payments, and support. This includes contact details provided during booking, appointment history, messages you send through embedded forms, and payment confirmations processed by our PCI-compliant partners.",
          "You may request a copy or deletion of your data at any time by contacting the studio or emailing privacy@schedulaa.com with your booking ID." ,
        ],
      },
      {
        heading: "How we use your data",
        paragraphs: [
          "Data stays inside our scheduling platform and is used for confirmations, reminders, receipts, and service follow-ups. We never sell lists or share personally identifiable information with outside vendors, with the exception of payment processors or insurers that you authorize.",
          "Access to internal dashboards is restricted to trained staff using MFA-protected logins. All activity is logged for auditing." ,
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can opt out of marketing emails at any time from the footer of any campaign. Transactional messages (receipts, reminders) are required to complete bookings but can be redirected to an alternate address upon request.",
          "Questions about privacy or data handling? Email privacy@schedulaa.com or contact the studio directly and we’ll respond within two business days." ,
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    intro: "The conditions for using our online booking, payments, and communication tools.",
    sections: [
      {
        heading: "Appointment commitments",
        paragraphs: [
          "Bookings are secured with the payment method you provide. Late cancellations and no-shows may be charged according to the studio’s policy, which is disclosed during checkout.",
          "By booking, you authorize us to send confirmations, reminders, and service updates via email or SMS." ,
        ],
      },
      {
        heading: "Acceptable use",
        paragraphs: [
          "You agree not to misuse the booking tools, attempt to access another customer’s information, or copy proprietary content from this site.",
          "Studios reserve the right to refuse service if policies are repeatedly violated or abusive language is used in messages." ,
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "Our platform provides scheduling and communication tools, but each studio remains responsible for the services delivered. If you have a dispute about a service, contact the studio directly so they can address or escalate it through the proper channels.",
          "Questions about these terms? Email legal@schedulaa.com and we’ll route the request to the correct team." ,
        ],
      },
    ],
  },
  policies: {
    title: "Studio Policies",
    intro: "General policies around cancellations, arrivals, communication, and on-site etiquette.",
    sections: [
      {
        heading: "Cancellations",
        paragraphs: [
          "Please provide at least 24 hours notice for cancellations so we can offer the slot to another client. Late cancellations may incur the fee disclosed during checkout.",
        ],
      },
      {
        heading: "Arrival",
        paragraphs: [
          "Arrive 5–10 minutes early to check in, review paperwork, and discuss any updates to your goals or health profile.",
        ],
      },
      {
        heading: "Payment",
        paragraphs: [
          "We accept debit, credit, and digital wallets through our PCI-compliant processor. Cash payments can be coordinated with the studio directly.",
        ],
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    intro: "We use strictly necessary cookies to keep your session secure and remember booking preferences.",
    sections: [
      {
        heading: "Required cookies",
        paragraphs: [
          "Session cookies keep you logged in between pages and expire immediately after checkout or logout.",
        ],
      },
      {
        heading: "Analytics",
        paragraphs: [
          "Anonymous visit data helps us understand which services customers browse most so we can improve the experience. You can block analytics cookies in your browser without disrupting booking.",
        ],
      },
    ],
  },
};

const buildCanonicalUrl = (page, base, fallback) => {
  const safeBase = (base || fallback || "").replace(/\/$/, "");
  if (!safeBase) return "";
  const override = (page?.canonical_path || "").trim();
  if (override.startsWith("http://") || override.startsWith("https://")) return override;
  if (override.startsWith("/") || override.startsWith("?")) return `${safeBase}${override}`;
  if (override) return `${safeBase}/${override.replace(/^\/+/, "")}`;
  const slug = (page?.slug || "").trim();
  if (page?.is_homepage || slug.toLowerCase() === "home") return safeBase;
  if (page?.path) {
    const path = page.path.startsWith("/") ? page.path : `/${page.path}`;
    return `${safeBase}${path}`;
  }
  if (!slug) return safeBase;
  const sep = safeBase.includes("?") ? "&" : "?";
  return `${safeBase}${sep}page=${encodeURIComponent(slug)}`;
};

const extractDescription = (sections = []) => {
  for (const section of sections) {
    const props = section?.props || {};
    const candidates = [props.subheading, props.description, props.body, props.copy];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
  }
  return "";
};

function buildLegalFallbackPage(slug, pageStyle) {
  const key = String(slug || "").toLowerCase();
  const config = LEGAL_FALLBACK_CONTENT[key];
  if (!config) return null;
  const sections = [];
  if (pageStyle && Object.keys(pageStyle).length) {
    sections.push({ type: "pageStyle", props: pageStyle, sx: { py: 0 } });
  }
  sections.push(
    {
      type: "heroSplit",
      props: {
        heading: config.title,
        subheading: config.intro,
        ctaText: "Contact support",
        ctaLink: "/contact",
        image: "https://images.unsplash.com/photo-1521540216272-a50305cd4421?auto=format&fit=crop&w=1400&q=80",
        titleAlign: "left",
        maxWidth: "lg",
      },
    }
  );
  sections.push(
    ...config.sections.map((sec) => ({
      type: "richText",
      props: {
        title: sec.heading,
        body: sec.paragraphs.map((p) => `<p>${p}</p>`).join(""),
        maxWidth: "md",
      },
    }))
  );
  return {
    slug: key,
    title: config.title,
    layout: "full",
    content: { sections },
  };
}

const pickDefaultPageStyle = (pages = []) => {
  if (!Array.isArray(pages)) return null;
  const home = pages.find((p) => p?.is_homepage) || pages[0];
  const fromHome = extractPageStyleProps(home);
  if (fromHome) return fromHome;
  for (const page of pages) {
    const style = extractPageStyleProps(page);
    if (style) return style;
  }
  return null;
};
const isPlainObject = (val) => !!val && typeof val === "object" && !Array.isArray(val);
const cloneStyle = (val) => {
  if (!isPlainObject(val)) return null;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return { ...val };
  }
};
const extractPageStyleProps = (page) => {
  if (!page) return null;
  const sections = Array.isArray(page?.content?.sections) ? page.content.sections : [];
  const section = sections.find((s) => s?.type === "pageStyle");
  if (section?.props && isPlainObject(section.props)) {
    const copy = cloneStyle(section.props);
    if (copy && Object.keys(copy).length) return copy;
  }
  const metaStyle = cloneStyle(page?.content?.meta?.pageStyle);
  if (metaStyle && Object.keys(metaStyle).length) return metaStyle;
  return null;
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const getBlogPostsFromSections = (sections = []) => {
  const list = Array.isArray(sections) ? sections : [];
  const blogSection = list.find((s) => s?.type === "blogList");
  const posts = blogSection?.props?.posts;
  return Array.isArray(posts) ? posts : [];
};

const resolvePostSlug = (post) => post?.slug || slugify(post?.title);
const clamp01 = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
};
const clampNumber = (value, min, max, fallback) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  let clamped = num;
  if (typeof min === "number") clamped = Math.max(min, clamped);
  if (typeof max === "number") clamped = Math.min(max, clamped);
  return clamped;
};
const alignToFlex = (val, fallback = "flex-start") => {
  switch ((val || "").toLowerCase()) {
    case "center":
      return "center";
    case "right":
    case "far-right":
      return "flex-end";
    case "space-between":
      return "space-between";
    case "space-around":
      return "space-around";
    default:
      return fallback;
  }
};

const inlinePlacementFromAlign = (val, forced) => {
  if (forced) return forced;
  const raw = (val || "").toLowerCase();
  if (raw === "far-left" || raw === "left") return "before";
  if (raw === "center") return "center";
  return "after";
};
const edgePlacement = (val) => {
  const raw = (val || "").toLowerCase();
  if (raw === "center") return { marginLeft: "auto", marginRight: "auto" };
  if (raw === "right" || raw === "far-right") return { marginLeft: "auto" };
  if (raw === "far-left") return { marginRight: "auto" };
  return {};
};
const toHexByte = (n) => Math.max(0, Math.min(255, Math.round(Number(n) || 0))).toString(16).padStart(2, '0');
const normalizeHexColor = (hex) => {
  if (typeof hex !== 'string') return '';
  let s = hex.trim();
  if (!s) return '';
  if (!s.startsWith('#')) return s;
  let h = s.slice(1);
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  } else if (h.length === 4) {
    h = h.slice(0, 3).split('').map((c) => c + c).join('');
  } else if (h.length === 8) {
    h = h.slice(0, 6);
  }
  if (h.length < 6) h = h.padEnd(6, '0');
  return `#${h.toLowerCase()}`;
};
const hexToRgba = (hex, opacity = 1) => {
  const norm = normalizeHexColor(hex);
  if (!norm || !norm.startsWith('#')) return norm || '';
  const h = norm.slice(1);
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
};
const parseCssColor = (css, fallbackOpacity = 1) => {
  const base = { hex: '#ffffff', opacity: clamp01(fallbackOpacity) };
  if (!css || typeof css !== 'string') return base;
  const str = css.trim();
  if (!str) return base;
  if (str.toLowerCase() === 'transparent') {
    return { hex: '#000000', opacity: 0 };
  }
  const rgba = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i.exec(str);
  if (rgba) {
    const r = Number(rgba[1]);
    const g = Number(rgba[2]);
    const b = Number(rgba[3]);
    const a = rgba[4] != null ? parseFloat(rgba[4]) : base.opacity;
    return {
      hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
      opacity: clamp01(a),
    };
  }
  if (str.startsWith('#')) {
    const raw = str.slice(1);
    let alpha = base.opacity;
    if (raw.length === 4) {
      alpha = parseInt(raw[3] + raw[3], 16) / 255;
    } else if (raw.length === 8) {
      alpha = parseInt(raw.slice(6, 8), 16) / 255;
    }
    return { hex: normalizeHexColor(str), opacity: clamp01(alpha) };
  }
  return base;
};
const cssColorWithOpacity = (color, overrideOpacity) => {
  const str = typeof color === 'string' ? color.trim() : '';
  if (!str) return null;
  const isSpecial = str.startsWith('#') || /^rgba?/i.test(str) || str.toLowerCase() === 'transparent';
  if (!isSpecial) {
    return str;
  }
  const parsed = parseCssColor(str, overrideOpacity ?? 1);
  const finalOpacity = overrideOpacity != null ? clamp01(overrideOpacity) : parsed.opacity;
  return hexToRgba(parsed.hex, finalOpacity);
};

const pageStyleToCssVars = (style) => {
  if (!style) return null;
  const vars = {};
  const assign = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      vars[key] = value;
    }
  };
  assign("--page-heading-color", style.headingColor);
  assign("--page-body-color", style.bodyColor);
  assign("--page-link-color", style.linkColor);
  assign("--page-heading-font", style.headingFont);
  assign("--page-body-font", style.bodyFont);
  assign("--page-hero-heading-shadow", style.heroHeadingShadow);
  assign("--page-card-bg", style.cardBg || style.cardColor);
  assign("--page-card-radius", style.cardRadius != null ? `${style.cardRadius}px` : undefined);
  assign("--page-card-shadow", style.cardShadow);
  assign("--page-card-blur", style.cardBlur != null ? `${style.cardBlur}px` : undefined);
  assign("--page-btn-bg", style.btnBg);
  assign("--page-btn-color", style.btnColor);
  assign("--page-btn-radius", style.btnRadius != null ? `${style.btnRadius}px` : undefined);
  return Object.keys(vars).length ? vars : null;
};

const pageStyleToBackgroundSx = (style) => {
  if (!style) return null;
  const sx = {};
  if (style.backgroundColor) sx.backgroundColor = style.backgroundColor;
  if (style.bodyColor) sx.color = style.bodyColor;
  const overlay = cssColorWithOpacity(
    style.overlayColor,
    Number.isFinite(style.overlayOpacity) ? style.overlayOpacity : undefined
  );
  if (style.backgroundImage) {
    const layers = [];
    if (overlay) layers.push(`linear-gradient(${overlay}, ${overlay})`);
    layers.push(`url(${style.backgroundImage})`);
    sx.backgroundImage = layers.join(", ");
  } else if (overlay) {
    sx.backgroundImage = `linear-gradient(${overlay}, ${overlay})`;
  }
  if (style.backgroundRepeat) sx.backgroundRepeat = style.backgroundRepeat;
  if (style.backgroundSize) sx.backgroundSize = style.backgroundSize;
  if (style.backgroundPosition) sx.backgroundPosition = style.backgroundPosition;
  if (style.backgroundAttachment) sx.backgroundAttachment = style.backgroundAttachment;
  return Object.keys(sx).length ? sx : null;
};

const PLACEHOLDER_SITE_TITLES = new Set([
  "FE Save Test",
  "FE Preview",
  "FE Test Site",
]);

function ClientLoginDialog({ open, onClose, onLoginSuccess, companySlug }) {
  const dialogPaperSx = {
    backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
    backgroundImage: "none",
    color: "var(--page-body-color, #111827)",
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post(`/login`, {
        email,
        password,
        role: "client",
        timezone,
        company_slug: companySlug || undefined,
      });
      if (res.data?.access_token) {
        onLoginSuccess(res.data.access_token);
        onClose();
      } else {
        setError("Login failed.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: dialogPaperSx }}
        sx={{
          "& .MuiDialog-paper": dialogPaperSx,
          "& .MuiDialogContent-root": {
            backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
          },
          "& .MuiDialogTitle-root": {
            backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
          },
        }}
      >
        <DialogTitle>Client Login</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} id="client-login-form">
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              margin="normal"
            />
            <TimezoneSelect label="Timezone" value={timezone} onChange={setTimezone} />
          </form>
          <Box sx={{ mt: 1 }}>
            <Link component="button" variant="body2" onClick={() => setForgotOpen(true)}>
              Forgot password?
            </Link>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="client-login-form" variant="contained" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </Button>
        </DialogActions>
      </Dialog>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

function ForgotPasswordDialog({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(
        "/forgot-password",
        { email },
        { noAuth: true, noCompanyHeader: true }
      );
      setMessage(res.data?.message || "Reset email sent.");
    } catch (err) {
      setError(err.response?.data?.error || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}
        <form onSubmit={handleSubmit} id="client-forgot-password-form">
          <TextField
            label="Email"
            type="email"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button type="submit" form="client-forgot-password-form" variant="contained" disabled={loading}>
          {loading ? "Sending..." : "Send reset email"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ClientRegisterDialog({ open, onClose, onRegisterSuccess, onOpenLogin, onOpenForgot, companySlug }) {
  const dialogPaperSx = {
    backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
    backgroundImage: "none",
    color: "var(--page-body-color, #111827)",
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [error, setError] = useState("");
  const [accountExists, setAccountExists] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (!agreedToTerms) {
      setError("You must accept the Schedulaa User Agreement to create an account.");
      setLoading(false);
      return;
    }
    try {
      await api.post(`/register`, {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: passwordConfirm,
        timezone,
        role: "client",
        company_slug: companySlug || undefined,
        agreed_to_terms: true,
      });
      const loginRes = await api.post(`/login`, {
        email,
        password,
        role: "client",
        timezone,
      });
      if (loginRes.data?.access_token) {
        onRegisterSuccess(loginRes.data.access_token);
        onClose();
      } else {
        setError("Registration succeeded but login failed.");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.error === "account_exists") {
        setAccountExists(true);
        setError(
          data?.message ||
            "You already have an account on the Schedulaa platform used by this business. Please log in to continue, or use Forgot password."
        );
      } else if (data?.field_errors) {
        const firstFieldError = Object.values(data.field_errors)[0];
        setError(firstFieldError || "Registration failed.");
      } else {
        setError(data?.error || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: dialogPaperSx }}
      sx={{
        "& .MuiDialog-paper": dialogPaperSx,
        "& .MuiDialogContent-root": {
          backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
        },
        "& .MuiDialogTitle-root": {
          backgroundColor: "var(--checkout-card-bg, var(--page-card-bg, var(--page-body-bg, #ffffff)))",
        },
      }}
    >
      <DialogTitle>Client Sign Up</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} id="client-register-form">
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
            }
            label={
              <span>
                I agree to the{" "}
                <Link href="https://www.schedulaa.com/terms" target="_blank" rel="noopener">
                  Schedulaa User Agreement
                </Link>
                .
              </span>
            }
            sx={{ mt: 1 }}
          />
          <TimezoneSelect label="Timezone" value={timezone} onChange={setTimezone} />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" form="client-register-form" variant="contained" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </DialogActions>
      <DialogContent sx={{ pt: 0 }}>
        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
          <Button size="small" onClick={onOpenLogin}>
            Already have an account? Log in
          </Button>
          <Button size="small" onClick={onOpenForgot}>
            Forgot password?
          </Button>
        </Stack>
        {accountExists && (
          <Alert severity="info" sx={{ mt: 1 }}>
            Please log in to continue. If you don’t remember your password, use “Forgot password”.
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function CompanyPublic({ slugOverride }) {
  const { slug: routeSlug } = useParams();
  const slug = slugOverride || routeSlug;
  const isCustomDomain = getTenantHostMode() === "custom";
  const slugForHref = isCustomDomain ? "" : slug;
  const basePath = slugForHref ? `/${slugForHref}` : "";
  const rootPath = basePath || "/";
  const navigate = useNavigate();
  // Persist slug for later redirects (login → dashboard)
  useEffect(() => {
    if (slug) {
      try { localStorage.setItem("site", slug); } catch {}
    }
  }, [slug]);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id") || searchParams.get("sid");
    try {
      sessionStorage.removeItem("checkout_stripe_session_id");
    } catch {}
    if (sessionId && slug) {
      navigate({
        pathname: `${basePath}/checkout/return`,
        search: `?session_id=${encodeURIComponent(sessionId)}`
      }, { replace: true });
    }
  }, [searchParams, slug, navigate, basePath]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [company, setCompany] = useState(null);
  const [sitePayload, setSitePayload] = useState(null);
  const [pages, setPages] = useState([]);

  const pageFromQuery = (searchParams.get("page") || "").trim();
  const jobFromQuery = (searchParams.get("job") || "").trim();
  const blogPostSlug = (searchParams.get("post") || "").trim();

  const currentPage = useMemo(() => {
    if (!pages.length) return null;
    if (pageFromQuery) {
      const qRaw = String(pageFromQuery).toLowerCase();
      const q = qRaw === "services" ? "services-classic" : qRaw;
      const defaultStyle = pickDefaultPageStyle(pages);

      const directMatch = pages.find(
        (p) =>
          String(p.slug || "").toLowerCase() === q ||
          String(p.menu_title || "").toLowerCase() === q ||
          String(p.title || "").toLowerCase() === q
      );
      if (directMatch) return directMatch;

      if (q === "reviews") return { slug: "reviews", title: "Reviews", content: { sections: [] } };
      if (q === "jobs" || q === "careers") {
        return { slug: "jobs", title: "Jobs", content: { sections: [] } };
      }
      if (q === "services-classic") {
        const existing = pages.find(
          (p) => String(p.slug || "").toLowerCase() === "services-classic"
        );
        if (existing) return existing;
        return { slug: "services-classic", title: "Services", content: { sections: [] } };
      }
      if (q === "my-bookings" || q === "mybookings")
        return { slug: "my-bookings", title: "My Bookings", content: { sections: [] } };

      const legalFallback = buildLegalFallbackPage(q, defaultStyle);
      if (legalFallback) return legalFallback;
    }
    return pages.find((p) => p.is_homepage) || pages[0];
  }, [pages, pageFromQuery]);

  const blogPost = useMemo(() => {
    if (!currentPage) return null;
    if (String(currentPage.slug || "").toLowerCase() !== "blog") return null;
    if (!blogPostSlug) return null;
    const posts = getBlogPostsFromSections(currentPage?.content?.sections || []);
    if (!posts.length) return null;
    const target = blogPostSlug.toLowerCase();
    return (
      posts.find((p) => String(resolvePostSlug(p)).toLowerCase() === target) ||
      null
    );
  }, [currentPage, blogPostSlug]);

  // ✅ Gate by existing auth info (no new concepts)
  const role = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "client";
  const authedCompanyId = typeof localStorage !== "undefined" ? localStorage.getItem("company_id") : null;
  const isManagerForCompany = useMemo(() => {
    if (role !== "manager") return false;                        // only managers
    if (!company?.id || !authedCompanyId) return true;          // if either side missing, allow managers
    return String(authedCompanyId) === String(company.id);       // if present, require match
  }, [role, authedCompanyId, company]);

  const [themeAnchor, setThemeAnchor] = useState(null);
  const [themes, setThemes] = useState([]);
  const [settings, setSettings] = useState(null);

  const headerConfig = useMemo(() => {
    if (settings?.header) return settings.header;
    if (sitePayload?.settings?.header) return sitePayload.settings.header;
    return sitePayload?.header || null;
  }, [settings, sitePayload]);

  const footerConfig = useMemo(() => {
    if (settings?.footer) return settings.footer;
    if (sitePayload?.settings?.footer) return sitePayload.settings.footer;
    return sitePayload?.footer || null;
  }, [settings, sitePayload]);

  const themeOverrides = useMemo(() => {
    return (
      settings?.theme_overrides ||
      settings?.settings?.theme_overrides ||
      sitePayload?.theme_overrides ||
      sitePayload?.settings?.theme_overrides ||
      {}
    );
  }, [settings, sitePayload]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toolbarMsg, setToolbarMsg] = useState("");
  const [publishSnack, setPublishSnack] = useState("");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const hasDraftChanges = Boolean(settings?.has_unpublished_changes);
  const lastPublishedLabel = useMemo(() => {
    const ts = settings?.branding_published_at;
    if (!ts) return null;
    try {
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return null;
      return `Published ${date.toLocaleString()}`;
    } catch {
      return null;
    }
  }, [settings?.branding_published_at]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr("");
        const { data } = await wb.publicBySlug(slug);
        if (!alive) return;
        setSitePayload(data || null);
        setCompany(data?.company || null);
        const normalized = Array.isArray(data?.pages)
          ? data.pages.map((p) => ({ ...p, content: Array.isArray(p?.content?.sections) ? p.content : { sections: [] } }))
          : [];
        const cleaned = normalized.filter(
          (p) => String(p.slug || "").toLowerCase() !== "services"
        );
        setPages(cleaned);
      } catch {
        setErr("Failed to load the public website for this company.");
        setCompany(null); setPages([]); setSitePayload(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (isManagerForCompany && searchParams.get("edit") === "1") setEditorOpen(true);
  }, [isManagerForCompany, searchParams]);

  // Only managers fetch manager-only settings
  useEffect(() => {
    if (!isManagerForCompany || !company?.id) return;
    let ok = true;
    (async () => {
      try {
        const [themesRes, settingsRes] = await Promise.all([
          wb.listThemes(company.id),              // pass company id
          wb.getSettings(company.id),
        ]);
        if (!ok) return;
        const baseSettings = settingsRes.data || {};
        try {
          const styleRes = await navSettings.getStyle(company.id);
          if (styleRes) {
            const normalizedStyle = normalizeNavStyle(styleRes);
            baseSettings.nav_style = normalizedStyle;
            baseSettings.settings = {
              ...(baseSettings.settings || {}),
              nav_style: normalizedStyle,
            };
          }
        } catch (styleErr) {
          console.warn("Failed to load navigation style", styleErr?.response?.data || styleErr);
        }
        setThemes(Array.isArray(themesRes.data) ? themesRes.data : []);
        setSettings(baseSettings);
      } catch {
        /* non-fatal */
      }
    })();
    return () => { ok = false; };
  }, [isManagerForCompany, company]);

  const chooseTheme = async (themeId) => {
    if (!isManagerForCompany || !company?.id) return;
    try {
      const payload = { theme_id: themeId, is_live: settings?.is_live ?? false };
      const { data } = await wb.saveSettings(company.id, payload);
      setSettings(data); setToolbarMsg("Theme saved");
    } catch {
      setToolbarMsg("Failed to save theme");
    } finally {
      setThemeAnchor(null);
      setTimeout(() => setToolbarMsg(""), 2000);
    }
  };

  const publish = async () => {
    if (!isManagerForCompany || !company?.id) return;
    setPublishing(true);
    try {
      const res = await wb.publish(company.id, true);
      const payload = res?.data || res || null;
      if (payload) setSettings(payload);
      setToolbarMsg("Published");
      setPublishSnack("Site published");
    } catch {
      setToolbarMsg("Publish failed");
      setPublishSnack("Publish failed");
    } finally {
      setPublishing(false);
      setTimeout(() => setToolbarMsg(""), 2000);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // MENU PAGES + NAV ITEMS (auth-aware + canonical links)
  const menuPages = useMemo(
    () =>
      pages
        .filter((p) => p.show_in_menu)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [pages]
  );
  const hasReviewsPage = useMemo(
    () => (menuPages || []).some((p) => String(p.slug || '').toLowerCase() === 'reviews'),
    [menuPages]
  );

  const reviewsHref = useCallback(() => {
    if (hasReviewsPage) {
      return `${rootPath}?page=reviews`;
    }
    return `${basePath}/reviews`;
  }, [hasReviewsPage, rootPath, basePath]);

  const runtimeOverrides = settings?.theme_overrides
    || sitePayload?.theme_overrides
    || company?.theme_overrides
    || {};

  const siteDefaultPageStyle = useMemo(() => {
    const fromSettings = cloneStyle(settings?.settings?.page_style_default);
    if (fromSettings && Object.keys(fromSettings).length) return fromSettings;
    const fromPayload = cloneStyle(sitePayload?.website_setting?.settings?.page_style_default);
    if (fromPayload && Object.keys(fromPayload).length) return fromPayload;
    return null;
  }, [settings, sitePayload]);

  // Prefer live manager settings when available to reflect changes immediately.
  const nav = (settings?.nav_overrides || sitePayload?.nav_overrides || {});
  const isOn = (v) => (v === false || v === 0) ? false : (typeof v === "string" ? !/^(0|false|no|off)$/i.test(v.trim()) : Boolean(v ?? true));
  // Auth state — client
  const token = (typeof localStorage !== "undefined" && localStorage.getItem("token")) || "";
  const roleStored  = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "";
  const clientLoggedIn = Boolean(token && roleStored === "client");
  const doLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      // localStorage.removeItem("company_id"); // optional
    } catch {}
    window.location.assign("/login");
  };

  const handleClientLoginSuccess = (tokenValue) => {
    try {
      localStorage.setItem("token", tokenValue);
      localStorage.setItem("role", "client");
    } catch {}
    window.location.assign(`${rootPath}?page=my-bookings`);
  };

  const handleClientRegisterSuccess = (tokenValue) => {
    try {
      localStorage.setItem("token", tokenValue);
      localStorage.setItem("role", "client");
    } catch {}
    window.location.assign(`${rootPath}?page=my-bookings`);
  };

  const servicesPageSlug = useMemo(() => {
    const overrideSlug = String(nav?.services_page_slug || "").trim();
    if (overrideSlug) {
      // Treat legacy "services" override as classic
      if (overrideSlug.toLowerCase() === "services") return "services-classic";
      return overrideSlug;
    }
    const classicPage =
      (pages || []).find(
        (p) => String(p.slug || "").toLowerCase() === "services-classic"
      ) || null;
    if (classicPage?.slug) return classicPage.slug;
    return "services-classic";
  }, [nav, pages]);

  const hasServicesClassicPage = useMemo(
    () =>
      (pages || []).some(
        (p) =>
          String(p.slug || "").toLowerCase() ===
          servicesPageSlug.toLowerCase()
      ),
    [pages, servicesPageSlug]
  );

  const servicesHref = useCallback(
    () => `${rootPath}?page=${encodeURIComponent(servicesPageSlug)}`,
    [rootPath, servicesPageSlug]
  );

  // ---- nav builder: respects manager settings or public payload ----
  function buildNavItems(sitePayloadArg, settingsArg) {
    const navOvr = (settingsArg && settingsArg.nav_overrides)
      || (sitePayloadArg && sitePayloadArg.nav_overrides)
      || {};

    const showReviews  = navOvr.show_reviews_tab  !== false; // default true

    const items = [
      { key: "home",     label: "Home",     href: rootPath },
      showReviews  && { key: "reviews",  label: "Reviews",  href: reviewsHref()  },
    ].filter(Boolean);

    return items;
  }

  const navItems = useMemo(() => {
    const core = buildNavItems(sitePayload, settings);
    // Keep other template pages in the nav as well, respecting auth rules and hiding duplicates
    const others = menuPages
      .filter((p) => !(p.slug === "login" && clientLoggedIn))
      .filter((p) => !(p.slug === "my-bookings" && !clientLoggedIn))
      .filter((p) => !["home", "reviews"].includes(p.slug))
      .map((p) => {
        let href = `${rootPath}?page=${encodeURIComponent(p.slug)}`;
        if (p.slug === "login") href = `/login?site=${encodeURIComponent(slug)}`;
        if (p.slug === "my-bookings") {
          href = isCustomDomain ? `${rootPath}?page=my-bookings` : `/dashboard?site=${encodeURIComponent(slug)}`;
        }
        return { key: p.slug, label: p.menu_title || p.title || p.slug, href };
      });

    // Optional Logout shortcut
    const shortcuts = [];
    if (clientLoggedIn && isOn(nav.show_logout_tab ?? true)) {
      shortcuts.push({ key: "__logout", label: nav.logout_tab_label || "Log out", onClick: doLogout });
    }

    return [...core, ...others, ...shortcuts];
  }, [sitePayload, settings, menuPages, nav, slug, reviewsHref, clientLoggedIn, rootPath, isCustomDomain]);
  // ─────────────────────────────────────────────────────────────────────────────

  const rawNavStyle =
    settings?.nav_style ||
    sitePayload?.nav_style ||
    sitePayload?.settings?.nav_style ||
    {};
  const navStyle = useMemo(
    () => normalizeNavStyle(rawNavStyle),
    [rawNavStyle]
  );
  const navCssVars = useMemo(
    () => navStyleToCssVars(navStyle),
    [navStyle]
  );

  const navItemsWithActive = useMemo(() => {
    const currentSlug = String(currentPage?.slug || "").toLowerCase();
    return navItems.map((item) => {
      const keyLower = String(item.key || "").toLowerCase();
      const active =
        keyLower === "home"
          ? !currentSlug || currentSlug === "home"
          : keyLower === currentSlug;
      return { ...item, active };
    });
  }, [navItems, currentPage]);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const handleMobileOpen = () => setMobileNavOpen(true);
  const handleMobileClose = () => setMobileNavOpen(false);

  const navButtonSx = useMemo(
    () => createNavButtonStyles(navStyle),
    [navStyle]
  );

  const { sections: patchedSections, styleProps: specialPageStyle, renderOverride } = useMemo(() => {
    if (!currentPage) {
      return { sections: [], styleProps: null, renderOverride: null };
    }

    const slugLower = String(currentPage?.slug || "").toLowerCase();
    const currentSections = Array.isArray(currentPage?.content?.sections) ? currentPage.content.sections : [];
    const existingPageStyleSection = currentSections.find((s) => s?.type === "pageStyle");
    const home = (pages || []).find((p) => p.is_homepage) || (pages || [])[0];
    const homeSections = Array.isArray(home?.content?.sections) ? home.content.sections : [];
    const homePageStyleSection = homeSections.find((s) => s?.type === "pageStyle");

    const pickStyle = (...candidates) => {
      for (const cand of candidates) {
        const next = cloneStyle(cand);
        if (next && Object.keys(next).length) return next;
      }
      return {};
    };

    const resolveStyleProps = () =>
      pickStyle(
        existingPageStyleSection?.props,
        currentPage?.content?.meta?.pageStyle,
        homePageStyleSection?.props,
        home?.content?.meta?.pageStyle,
        siteDefaultPageStyle
      );

    if (["services", "services-classic", "products", "basket", "jobs"].includes(slugLower)) {
      const styleProps = resolveStyleProps();
      const overrideType = slugLower === "services" ? "services-classic" : slugLower;
      return { sections: [], styleProps, renderOverride: { type: overrideType, styleProps } };
    }

    if (slugLower === "blog" && blogPostSlug) {
      const posts = getBlogPostsFromSections(currentSections);
      const target = blogPostSlug.toLowerCase();
      const post =
        posts.find((p) => String(resolvePostSlug(p)).toLowerCase() === target) ||
        null;
      if (post) {
        const styleProps = resolveStyleProps();
        return { sections: [], styleProps, renderOverride: { type: "blog-post", styleProps, post } };
      }
    }

    const shouldEmbedSpecial = ["my-bookings", "checkout"].includes(slugLower);

    if (slugLower === "my-bookings" && !clientLoggedIn) {
      const styleProps = resolveStyleProps();
      return {
        sections: [],
        styleProps,
        renderOverride: { type: "my-bookings-auth", styleProps },
      };
    }

    if (shouldEmbedSpecial) {
      const styleProps = resolveStyleProps();

      const primary = styleProps.linkColor || styleProps.primaryColor || styleProps.brandColor || "";
      const bg = styleProps.backgroundColor || "";
      const head = styleProps.headingColor || "";
      const body = styleProps.bodyColor || "";
      const toRGB = (hex) => {
        const s = String(hex || "").trim();
        if (!s.startsWith("#")) return null;
        const h = s.length === 4 ? `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s;
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        return [r, g, b];
      };
      const lum = (rgb) => !rgb ? 1 : (0.2126 * rgb[0] / 255 + 0.7152 * rgb[1] / 255 + 0.0722 * rgb[2] / 255);
      let tone = "dark";
      const Lbg = lum(toRGB(bg)), Lh = lum(toRGB(head)), Lb = lum(toRGB(body));
      if (Lbg < 0.4) tone = "light";
      if (Lh !== 1) tone = Lh < 0.5 ? "light" : "dark"; else if (Lb !== 1) tone = Lb < 0.5 ? "light" : "dark";

      const qp = new URLSearchParams();
      qp.set("embed", "1");
      qp.set("site", slug);
      if (primary) qp.set("primary", primary);
      if (tone) qp.set("text", tone);
      if (head) qp.set("h", head);
      if (body) qp.set("b", body);
      if (styleProps.linkColor) qp.set("link", styleProps.linkColor);
      if (styleProps.headingFont) qp.set("hfont", styleProps.headingFont);
      if (styleProps.bodyFont) qp.set("bfont", styleProps.bodyFont);
      const embedCardBg = cssColorWithOpacity(
        styleProps.cardBg || styleProps.cardColor,
        Number.isFinite(styleProps.cardOpacity) ? styleProps.cardOpacity : undefined
      );
      if (embedCardBg) qp.set("cardbg", embedCardBg);
      const isMyBookings = slugLower === "my-bookings";
      const targetPath = isMyBookings ? null : slugLower;
      const embedPath = isMyBookings ? "/dashboard" : (targetPath ? `${basePath}/${targetPath}` : rootPath);
      const src = `${embedPath}?${qp.toString()}`;

      const basePageStyleSection = existingPageStyleSection || homePageStyleSection || null;
      const pageStyleBlock = basePageStyleSection
        ? {
            id: basePageStyleSection.id || `page-style-${slugLower}`,
            type: "pageStyle",
            props: styleProps,
            ...(basePageStyleSection.sx ? { sx: basePageStyleSection.sx } : {}),
          }
        : null;

      const embedBlock = {
        id: `embed-${slugLower}`,
        type: "richText",
        props: {
          title: "",
          body: `<iframe src="${src}" style="width:100%;min-height:900px;border:none;display:block;"></iframe>`
        }
      };

      const sections = pageStyleBlock ? [pageStyleBlock, embedBlock] : [embedBlock];
      return {
        sections,
        styleProps,
        renderOverride: null,
      };
    }

    const sections = currentPage?.content?.sections || [];
    const servicesLink = servicesHref();
    const reviewsLink = `${rootPath}?page=reviews`;
    const jobsLink = `${basePath}/jobs`;
    const servicesAliases = [
      "services",
      "/services",
      "services-classic",
      "/services-classic",
      "?page=services",
      "/?page=services",
      "?page=services-classic",
      "/?page=services-classic",
      "book",
      "/book",
    ];
    const jobsAliases = ["jobs", "/jobs", "?page=jobs", "/?page=jobs", "careers", "/careers"];
    const resolver = (href) => {
      const base = resolveSiteHref(slugForHref, href, pages);
      const clean = String(href || "").trim().toLowerCase();
      if (servicesAliases.includes(clean)) return servicesLink;
      if (["reviews", "/reviews"].includes(clean)) return reviewsLink;
      if (jobsAliases.includes(clean)) return jobsLink;
      return base;
    };
    const fixIframeBody = (html) => {
      try {
        let out = String(html || "");
        const slugToken = slugForHref || "";
        const slugPath = slugForHref ? `/${slugForHref}/` : "/";
        out = out.replace(/\{\{\s*slug\s*\}\}/gi, slugToken);
        out = out.replace(/%7b%7b\s*slug\s*%7d%7d/gi, slugToken);
        out = out.replace(new RegExp(`/${'{'}{'}'}slug${'{'}{'}'}/`, 'gi'), slugPath);
        out = out.replace(/(<iframe[^>]*src=")(.*?)("[^>]*>)/gi, (m, p1, url, p3) => {
          try {
            const u = new URL(url, window.location.origin);
            if (u.pathname.startsWith('/dashboard')) {
              u.pathname = `${basePath}/my-bookings`;
              if (!u.searchParams.get('embed')) u.searchParams.set('embed', '1');
            }
            if (!u.searchParams.get('embed')) u.searchParams.set('embed', '1');
            if (!u.searchParams.get('site')) u.searchParams.set('site', slug);
            return `${p1}${u.pathname}${u.search}${p3}`;
          } catch {
            const join = url.includes('?') ? '&' : '?';
            let final = `${url}${join}embed=1&site=${encodeURIComponent(slug)}`;
            final = final.replace(/^\/?dashboard/i, `${basePath}/my-bookings`);
            return `${p1}${final}${p3}`;
          }
        });
        return out;
      } catch {
        return html;
      }
    };

    const mapped = sections.map((s) => {
      if (!s?.props) return s;
      const extraProps =
        s.type === "blogList" ? { siteSlug: slug } : {};
      const props = transformLinksDeep({ ...s.props, ...extraProps }, resolver);
      if (s.type === 'richText' && typeof props.body === 'string') {
        return { ...s, props: { ...props, body: fixIframeBody(props.body) } };
      }
      return { ...s, props };
    });

    return {
      sections: mapped,
      styleProps: extractPageStyleProps(currentPage),
      renderOverride: null,
    };
  }, [currentPage, slug, pages, nav, siteDefaultPageStyle, servicesHref, blogPostSlug, slugForHref, basePath, rootPath]);

  const pageLayout = useMemo(() => {
    if (
      renderOverride?.type === "services-classic" ||
      renderOverride?.type === "products" ||
      renderOverride?.type === "basket" ||
      renderOverride?.type === "jobs" ||
      renderOverride?.type === "blog-post"
    ) {
      return "full";
    }
    return currentPage?.layout ?? currentPage?.content?.meta?.layout ?? "boxed";
  }, [currentPage, renderOverride]);
  const isReviewsPage = currentPage && String(currentPage.slug || '').toLowerCase() === 'reviews';
  const shouldRenderPublicReviews = Boolean(isReviewsPage);

  const { bodySections, postReviewSections, footerSections } = useMemo(() => {
    if (!Array.isArray(patchedSections) || patchedSections.length === 0) {
      return { bodySections: [], postReviewSections: [], footerSections: [] };
    }
    const firstFooterIdx = patchedSections.findIndex(
      (sec) => typeof sec?.type === "string" && sec.type.toLowerCase() === "footer"
    );

    const splitIndex = firstFooterIdx === -1 ? patchedSections.length : firstFooterIdx;
    const head = patchedSections.slice(0, splitIndex);
    const tail = firstFooterIdx === -1 ? [] : patchedSections.slice(splitIndex);

    const isGuideSection = (sec) =>
      typeof sec?.type === "string" &&
      sec.type === "serviceGrid" &&
      typeof sec?.props?.title === "string" &&
      sec.props.title.trim().toLowerCase() === "guides to level up your team";

    const body = [];
    const post = [];
    head.forEach((sec) => {
      if (isGuideSection(sec)) {
        post.push(sec);
      } else {
        body.push(sec);
      }
    });

    return { bodySections: body, postReviewSections: post, footerSections: tail };
  }, [patchedSections]);

  const activePageStyle = useMemo(() => {
    return specialPageStyle || extractPageStyleProps(currentPage) || siteDefaultPageStyle || null;
  }, [specialPageStyle, currentPage, siteDefaultPageStyle]);

  const activePageCssVars = useMemo(
    () => pageStyleToCssVars(activePageStyle),
    [activePageStyle]
  );
  const activePageSurface = useMemo(
    () => pageStyleToBackgroundSx(activePageStyle),
    [activePageStyle]
  );

const rawSiteTitle =
    settings?.site_title ??
    sitePayload?.settings?.site_title ??
    sitePayload?.site_title ??
    company?.name ??
    company?.slug ??
    slug ??
    "";

const deslug = (value) =>
  (value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const siteTitle = useMemo(() => {
    const candidate = String(rawSiteTitle || "").trim();
    if (!candidate || PLACEHOLDER_SITE_TITLES.has(candidate)) {
      const fallback = company?.name || slug || "Our Business";
      return fallback.replace(/-/g, " ");
    }
    const clean = candidate === (company?.slug || slug)
      ? candidate.replace(/-/g, " ")
      : candidate;
    return clean;
  }, [rawSiteTitle, company?.name, company?.slug, slug]);

  const resolveMediaUrl = useCallback(
    (asset, fallback) => {
      if (asset && typeof asset === "object") {
        const candidate = asset.url || asset.url_public;
        if (typeof candidate === "string" && candidate.trim()) {
          if (/^https?:\/\//i.test(candidate)) return candidate;
          if (candidate.startsWith("/")) {
            return `${String(API_BASE_URL).replace(/\/$/, "")}${candidate}`;
          }
          return candidate;
        }
        const firstVariant =
          Array.isArray(asset.variants) && asset.variants.find((v) => v?.url || v?.href);
        if (firstVariant) {
          const variantUrl = firstVariant.url || firstVariant.href;
          if (typeof variantUrl === "string" && variantUrl.trim()) {
            if (/^https?:\/\//i.test(variantUrl)) return variantUrl;
            if (variantUrl.startsWith("/")) {
              return `${String(API_BASE_URL).replace(/\/$/, "")}${variantUrl}`;
            }
            return variantUrl;
          }
        }
        if (asset.stored_name && company?.id) {
          return `${String(API_BASE_URL).replace(/\/$/, "")}/api/website/media/file/${company.id}/${asset.stored_name}`;
        }
      }
      if (typeof fallback === "string" && fallback.trim()) {
        const trimmed = fallback.trim();
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        if (trimmed.startsWith("/")) {
          return `${String(API_BASE_URL).replace(/\/$/, "")}${trimmed}`;
        }
        return trimmed;
      }
      return null;
    },
    [company?.id]
  );

  const headerLogoUrl = useMemo(() => {
    return resolveMediaUrl(
      headerConfig?.logo_asset,
      headerConfig?.logo_url ||
        headerConfig?.logo_asset_url ||
        headerConfig?.logo ||
        company?.logo_url
    );
  }, [headerConfig, company, resolveMediaUrl]);

  useEffect(() => {
    const favicon =
      sitePayload?.favicon_url ||
      sitePayload?.website_setting?.favicon_url ||
      sitePayload?.settings?.favicon_url ||
      "";
    const fallbackLogo =
      headerLogoUrl ||
      sitePayload?.header?.logo_url ||
      sitePayload?.header?.logo_asset_url ||
      sitePayload?.company?.logo_url ||
      "";
    setTenantFavicon(favicon || fallbackLogo);
  }, [sitePayload, headerLogoUrl]);

  const headerBg = headerConfig?.bg || themeOverrides?.header?.background || "transparent";
  const headerTextColor = headerConfig?.text || themeOverrides?.header?.text || "inherit";
  const navButtonStyling = useMemo(() => {
    const useReadableText = ["ghost", "underline", "overline", "doubleline", "sideline", "sideline-all", "link", "text"].includes(navStyle?.variant);
    const fallbackText = pickTextColorForBg(headerBg);
    const preferred = navStyle?.text || headerTextColor;
    const bgLum = getLuminance(headerBg);
    const prefLum = getLuminance(preferred);
    const readableText =
      bgLum != null && prefLum != null && Math.abs(bgLum - prefLum) < 0.45
        ? fallbackText
        : preferred || fallbackText;
    return (active) => {
      const base = navButtonSx(active);
      if (useReadableText) {
        base.color = readableText;
        if (base["&:hover"]) {
          base["&:hover"] = { ...base["&:hover"], color: readableText };
        }
        if (navStyle?.variant === "ghost") {
          base.border = `1px solid ${readableText}`;
          if (base["&:hover"]) {
            base["&:hover"] = { ...base["&:hover"], border: `1px solid ${readableText}` };
          }
        }
        return base;
      }
      return { ...base, color: headerTextColor };
    };
  }, [navButtonSx, headerTextColor, headerBg, navStyle?.variant, navStyle?.text]);

  const showBrandText = headerConfig?.show_brand_text !== false;
  const navBrandName = useMemo(() => {
    if (!showBrandText) return "";
    const text = (headerConfig?.text || "").trim();
    if (text) return text;
    if (company?.name) return company.name;
    if (siteTitle) return siteTitle;
    return deslug(company?.slug) || deslug(slug) || "Brand";
  }, [headerConfig, siteTitle, company?.slug, company?.name, slug, showBrandText]);
  const headerSocialLinks = Array.isArray(headerConfig?.social_links) ? headerConfig.social_links : [];
  const footerSocialLinks = Array.isArray(footerConfig?.social_links) ? footerConfig.social_links : [];
  const footerColumns =
    (Array.isArray(footerConfig?.columns) && footerConfig.columns.length
      ? footerConfig.columns
      : cloneFooterColumns()) || [];
  const footerLegalLinks =
    (Array.isArray(footerConfig?.legal_links) && footerConfig.legal_links.length
      ? footerConfig.legal_links
      : cloneLegalLinks()) || [];
  const showCopyright = footerConfig?.show_copyright !== false;
  const copyrightText = formatCopyrightText(
    footerConfig?.copyright_text,
    { company: siteTitle, slug }
  );
  const footerSummary = (footerConfig?.text || "").trim();
  const footerBg = footerConfig?.bg || themeOverrides?.footer?.background || "var(--page-secondary-bg, #0f172a)";
  const footerTextColor =
    footerConfig?.text_color ||
    themeOverrides?.footer?.text ||
    "rgba(255,255,255,0.92)";
  const footerLinkColor = footerConfig?.link_color || footerTextColor;
  const footerLogoUrl = resolveMediaUrl(
    footerConfig?.logo_asset,
    footerConfig?.logo_url || footerConfig?.logo_asset_url || null
  );

  const globalSeo = useMemo(() => {
    if (settings?.seo) return settings.seo;
    if (sitePayload?.seo) return sitePayload.seo;
    if (sitePayload?.settings?.seo) return sitePayload.settings.seo;
    return {};
  }, [settings, sitePayload]);

  const canonicalBase = useMemo(() => {
    if (globalSeo.canonicalUrl) return globalSeo.canonicalUrl;
    if (globalSeo.slugBaseUrl) return globalSeo.slugBaseUrl;
    if (typeof window !== "undefined") {
      const origin = window.location.origin || "";
      if (isCustomDomain) return origin;
      return slug ? `${origin.replace(/\/$/, "")}/${slug}` : origin;
    }
    return "";
  }, [globalSeo, slug, isCustomDomain]);

  const slugBaseUrl = useMemo(() => globalSeo.slugBaseUrl || canonicalBase, [globalSeo, canonicalBase]);

  const pageCanonicalUrl = useMemo(() => {
    if (blogPost) {
      const override = (blogPost.canonical_path || blogPost.canonicalPath || "").trim();
      if (override) {
        if (override.startsWith("http://") || override.startsWith("https://")) return override;
        if (override.startsWith("/") || override.startsWith("?")) {
          return `${canonicalBase || slugBaseUrl || ""}${override}`;
        }
      }
      const base = (canonicalBase || slugBaseUrl || "").replace(/\/$/, "");
      const postSlug = resolvePostSlug(blogPost);
      const sep = base.includes("?") ? "&" : "?";
      return base ? `${base}${sep}page=blog&post=${encodeURIComponent(postSlug)}` : "";
    }
    return buildCanonicalUrl(currentPage || { slug }, canonicalBase, slugBaseUrl);
  }, [blogPost, currentPage, canonicalBase, slugBaseUrl, slug]);

  const descriptionFallback = useMemo(() => {
    if (bodySections.length) return extractDescription(bodySections);
    if (patchedSections?.length) return extractDescription(patchedSections);
    return extractDescription(currentPage?.content?.sections) || "";
  }, [bodySections, patchedSections, currentPage]);

  const metaDescription = useMemo(() => {
    return (
      blogPost?.seo_description ||
      blogPost?.seoDescription ||
      blogPost?.excerpt ||
      currentPage?.seo_description ||
      globalSeo.metaDescription ||
      descriptionFallback ||
      `Explore services from ${siteTitle}.`
    );
  }, [blogPost, currentPage, globalSeo, descriptionFallback, siteTitle]);

  const metaTitle = useMemo(() => {
    const base =
      blogPost?.seo_title ||
      blogPost?.seoTitle ||
      (blogPost?.title ? `${blogPost.title} — ${siteTitle}` : undefined) ||
      currentPage?.seo_title ||
      globalSeo.metaTitle ||
      (currentPage?.title ? `${currentPage.title} — ${siteTitle}` : siteTitle);
    return base?.replace(/\s+/g, " ").trim();
  }, [blogPost, currentPage, globalSeo, siteTitle]);

  const metaKeywords =
    blogPost?.seo_keywords ||
    blogPost?.seoKeywords ||
    currentPage?.seo_keywords ||
    globalSeo.metaKeywords ||
    "";
  const ogTitle =
    blogPost?.og_title ||
    blogPost?.ogTitle ||
    currentPage?.og_title ||
    globalSeo.ogTitle ||
    metaTitle;
  const ogDescription =
    blogPost?.og_description ||
    blogPost?.ogDescription ||
    currentPage?.og_description ||
    globalSeo.ogDescription ||
    metaDescription;
  const ogImage =
    blogPost?.og_image_url ||
    blogPost?.ogImageUrl ||
    blogPost?.coverImage ||
    blogPost?.image ||
    currentPage?.og_image_url ||
    globalSeo.ogImage ||
    headerLogoUrl ||
    null;
  const robots = currentPage?.noindex ? "noindex, nofollow" : undefined;

  const structuredDataPayload = useMemo(() => {
    if (!globalSeo.structuredDataEnabled) return null;
    const raw = globalSeo.structuredData;
    if (!raw) return null;
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }, [globalSeo]);

  const googleSiteVerification = (globalSeo.googleSiteVerification || "").trim();

  const isExternalHref = (href) => {
    const trimmed = (href || "").trim();
    return /^https?:/i.test(trimmed) || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:");
  };

  const normalizeHref = useCallback(
    (href) => {
      const trimmed = (href || "").trim();
      if (!trimmed) return rootPath;
      if (isCustomDomain) {
        const lowered = trimmed.toLowerCase();
        if (
          lowered === "home" ||
          lowered === "/home" ||
          lowered === "?page=home" ||
          lowered === "/?page=home"
        ) {
          return rootPath;
        }
      }
      if (isExternalHref(trimmed)) {
        return trimmed;
      }
      if (trimmed.startsWith("?") || trimmed.startsWith("/")) {
        return resolveSiteHref(slugForHref, trimmed, pages);
      }
      return resolveSiteHref(slugForHref, `?page=${trimmed}`, pages);
    },
    [rootPath, slugForHref, pages]
  );

  const headerNavItems = Array.isArray(headerConfig?.nav_items) ? headerConfig.nav_items : [];
  const currentSlugSafe = String(currentPage?.slug || "").toLowerCase();

  const headerNavItemsResolved = useMemo(() => {
    if (!headerNavItems.length) return [];
    const normalizedRoot = rootPath.replace(/\/$/, "") || "/";
    return headerNavItems.map((item, idx) => {
      const href = normalizeHref(item.href || "");
      const normalized = String(href || "").toLowerCase();
      let active = false;
      if (normalized === normalizedRoot || normalized === `${normalizedRoot}/` || normalized === "/") {
        active = !currentSlugSafe || currentSlugSafe === "home";
      } else if (normalized.includes("?page=")) {
        const params = new URLSearchParams(normalized.split("?")[1]);
        const pageSlug = params.get("page");
        if (pageSlug) active = pageSlug.toLowerCase() === currentSlugSafe;
      }
      return {
        key: item.key || `${idx}-${item.label || item.href || "nav"}`,
        label: item.label || item.href || `Link ${idx + 1}`,
        href,
        active,
      };
    });
  }, [headerNavItems, normalizeHref, rootPath, currentSlugSafe]);

  const navItemsToRender = headerNavItemsResolved.length ? headerNavItemsResolved : navItemsWithActive;
  const hasNavItems = navItemsToRender.length > 0;
  const headerPadding = clampNumber(headerConfig?.padding_y ?? 20, 4, 160, 20);
  const headerLogoWidth = clampNumber(headerConfig?.logo_width ?? 140, 40, 360, 140);
  const headerLogoHeight = headerConfig?.logo_height
    ? clampNumber(headerConfig.logo_height, 24, 200, null)
    : null;
  const headerLayoutKey = (headerConfig?.layout || "simple").toLowerCase();
  const headerIsCenterLayout = headerLayoutKey === "center";
  const headerIsSplitLayout = headerLayoutKey === "split";
  const headerIsInlineLayout = !headerIsCenterLayout && !headerIsSplitLayout;
  const headerNavAlignRaw = (headerConfig?.nav_alignment || "right").toLowerCase();
  const headerNavFullWidthCenter = headerIsInlineLayout && headerNavAlignRaw === "center";
  const headerLogoAlign = alignToFlex(headerConfig?.logo_alignment, "flex-start");
  const headerNavAlign = alignToFlex(
    headerNavAlignRaw,
    headerIsCenterLayout ? "center" : "flex-end"
  );
  const headerFullWidth = headerConfig?.full_width !== false;
  const headerGridColumns = headerIsCenterLayout
    ? "1fr"
    : headerIsSplitLayout
      ? { xs: "1fr", md: "auto 1fr" }
      : headerNavFullWidthCenter
        ? { xs: "1fr", md: "auto minmax(0, 1fr) auto" }
        : { xs: "1fr", md: "auto 1fr" };
  const logoEdgePlacement = edgePlacement(headerConfig?.logo_alignment);
  const navEdgePlacement = headerNavFullWidthCenter ? {} : edgePlacement(headerConfig?.nav_alignment);
  const alignToGridSelf = (value, fallback = "start") => {
    const raw = (value || "").toLowerCase();
    if (raw === "center") return "center";
    if (raw === "right" || raw === "far-right") return "end";
    if (raw === "far-left") return "start";
    return fallback;
  };
  const logoSelf = alignToGridSelf(headerConfig?.logo_alignment, "start");
  const navSelf = alignToGridSelf(
    headerConfig?.nav_alignment,
    headerIsCenterLayout ? "center" : "end"
  );
  const headerBrandGridColumn = headerIsCenterLayout
    ? "1 / -1"
    : headerNavFullWidthCenter
      ? { xs: "1 / -1", md: "1 / 2" }
      : {
          xs: "1 / -1",
          md: headerIsSplitLayout ? "auto" : "auto",
        };
  const headerNavGridColumn = headerIsCenterLayout
    ? "1 / -1"
    : headerNavFullWidthCenter
      ? { xs: "1 / -1", md: "2 / 3" }
      : {
          xs: "1 / -1",
          md: headerIsSplitLayout ? "auto" : "auto",
        };
  const headerSocialAlignRaw = (headerConfig?.social_alignment || "right").toLowerCase();
  const headerSocialAlign = alignToFlex(headerSocialAlignRaw, "flex-end");
  const headerSocialPosition = (headerConfig?.social_position || "inline").toLowerCase();
  const headerSocialInline = ["inline", "after"].includes(headerSocialPosition);
  const headerSocialInlinePlacement = headerSocialInline
    ? inlinePlacementFromAlign(
        headerSocialAlignRaw,
        headerSocialPosition === "after" ? "after" : null
      )
    : null;

  const renderHeaderBrandContent = useCallback(
    ({ disableLink = false } = {}) => (
      <>
        {headerLogoUrl && (
          <Box
            component={disableLink ? "span" : RouterLink}
            {...(!disableLink ? { to: rootPath } : {})}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              textDecoration: "none",
              color: headerTextColor,
              pointerEvents: disableLink ? "none" : undefined,
            }}
          >
            <Box
              component="img"
              src={headerLogoUrl}
              alt={navBrandName}
              sx={{
                width: `${headerLogoWidth}px`,
                height: headerLogoHeight ? `${headerLogoHeight}px` : "auto",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        )}
        {showBrandText && (
          <Typography
            variant="h6"
            sx={{
              color: headerTextColor,
              fontWeight: navStyle.font_weight ?? 600,
              textTransform: navStyle.text_transform ?? "none",
              fontFamily: "var(--nav-brand-font-family, inherit)",
              fontSize: `var(--nav-brand-font-size, ${navStyle.brand_font_size || 20}px)`
            }}
          >
            {navBrandName}
          </Typography>
        )}
      </>
    ),
    [
      headerLogoUrl,
      headerLogoWidth,
      headerLogoHeight,
      headerTextColor,
      showBrandText,
      navStyle,
      navBrandName,
      rootPath,
    ]
  );

  const renderHeaderSocialIcons = useCallback(
    ({ inline = false, placement = "after" } = {}) => {
      if (!headerSocialLinks.length) return null;
      const gap = Math.max(Number(navStyle?.item_spacing) || 12, 8);
      return (
        <Stack
          direction="row"
          spacing={0.75}
          flexWrap={inline ? "nowrap" : "wrap"}
          alignItems="center"
          justifyContent={inline ? "flex-start" : headerSocialAlign}
          sx={{
            width: inline ? "auto" : "100%",
            mt: inline ? 0 : 1,
            flexShrink: inline ? 0 : undefined,
            ml: inline && placement === "after" ? `${gap}px` : 0,
            mr: inline && placement === "before" ? `${gap}px` : 0,
            ...(inline && placement === "center"
              ? { marginLeft: "auto", marginRight: "auto" }
              : {}),
          }}
        >
          {headerSocialLinks.map((item, idx) => {
            const Icon = SOCIAL_ICON_MAP[item?.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
            const href = normalizeHref(item.href || item.url || "");
            const isExternal = isExternalHref(href);
            return (
              <IconButton
                key={`header-social-${idx}`}
                component={isExternal ? "a" : RouterLink}
                to={isExternal ? undefined : href}
                href={isExternal ? href : undefined}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer noopener" : undefined}
                size="small"
                sx={{
                  color: headerTextColor,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Icon fontSize="small" />
              </IconButton>
            );
          })}
        </Stack>
      );
    },
    [
      headerSocialLinks,
      headerSocialAlign,
      headerTextColor,
      normalizeHref,
      navStyle?.item_spacing,
    ]
  );

  const renderMobileNavButtons = () => (
    <Stack spacing={1} alignItems="stretch">
      {navItemsToRender.map((item) => {
        if (item.onClick) {
          return (
            <Button
              key={item.key}
              fullWidth
              size="small"
              variant="text"
              sx={{
                justifyContent: "flex-start",
                color: headerTextColor,
              }}
              onClick={() => {
                item.onClick();
                handleMobileClose();
              }}
            >
              {item.label}
            </Button>
          );
        }
        const external = isExternalHref(item.href);
        const commonProps = external
          ? { component: "a", href: item.href, target: "_blank", rel: "noreferrer" }
          : { component: RouterLink, to: item.href };
        return (
          <Button
            key={item.key}
            fullWidth
            size="small"
            variant="text"
            sx={{
              justifyContent: "flex-start",
              color: headerTextColor,
            }}
            {...commonProps}
            onClick={handleMobileClose}
          >
            {item.label}
          </Button>
        );
      })}
    </Stack>
  );

  const BlogPostEmbedded = ({ post }) => {
    if (!post) return null;
    const cover = post.coverImage || post.image || "";
    const coverUrl = cover ? buildImgixUrl(cover, { w: 1600, fit: "crop" }) : "";
    const backHref = `${rootPath}?page=blog`;
    const dateValue = post?.date ? new Date(post.date) : null;
    const dateLabel =
      dateValue && !Number.isNaN(dateValue.getTime())
        ? dateValue.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        : post?.date || "";
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Button
          component={RouterLink}
          to={backHref}
          variant="text"
          sx={{ mb: 2, color: "var(--page-link-color, inherit)" }}
        >
          ← Back to Blog
        </Button>
        {dateLabel && (
          <Typography variant="caption" sx={{ color: "var(--page-body-color, inherit)" }}>
            {dateLabel}
          </Typography>
        )}
        {post?.title && (
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            {post.title}
          </Typography>
        )}
        {coverUrl && (
          <Box
            component="img"
            src={coverUrl}
            alt={post.title || ""}
            sx={{ width: "100%", borderRadius: "var(--page-card-radius, 0px)", mb: 3 }}
          />
        )}
        {post?.body && (
          <Box
            sx={{
              color: "var(--page-body-color, inherit)",
              "& p": { textAlign: "justify" },
            }}
            dangerouslySetInnerHTML={{ __html: safeHtml(post.body) }}
          />
        )}
      </Container>
    );
  };

  const overrideContent = useMemo(() => {
    if (!renderOverride) return null;
    const styleProps = renderOverride.styleProps || null;
    const servicesMetaSource =
      pages?.find((p) => String(p?.slug || "").toLowerCase() === "services-classic") ||
      pages?.find((p) => String(p?.slug || "").toLowerCase() === "services") ||
      currentPage;
    const servicesHeadingRaw =
      servicesMetaSource?.content?.meta?.servicesHeading ||
      servicesMetaSource?.content?.meta?.services_heading ||
      servicesMetaSource?.content?.meta?.servicesTitle ||
      servicesMetaSource?.content?.meta?.services_title ||
      "";
    const servicesLabel =
      servicesMetaSource?.menu_title ||
      servicesMetaSource?.title ||
      "";
    const pluralize = (label) => {
      const trimmed = String(label || "").trim();
      if (!trimmed) return "";
      if (/available/i.test(trimmed)) return trimmed;
      if (/[sS]$/.test(trimmed)) return trimmed;
      return `${trimmed}s`;
    };
    const servicesHeading =
      String(servicesHeadingRaw || "").trim() ||
      (servicesLabel ? `Available ${pluralize(servicesLabel)}` : "");
    const productsMetaSource =
      pages?.find((p) => String(p?.slug || "").toLowerCase() === "products") ||
      pages?.find((p) => String(p?.slug || "").toLowerCase() === "products-classic") ||
      currentPage;
    const productsHeading =
      productsMetaSource?.content?.meta?.productsHeading ||
      productsMetaSource?.content?.meta?.products_heading ||
      productsMetaSource?.content?.meta?.productsTitle ||
      productsMetaSource?.content?.meta?.products_title ||
      productsMetaSource?.menu_title ||
      productsMetaSource?.title ||
      "";
    const productsSubheading =
      productsMetaSource?.content?.meta?.productsSubheading ||
      productsMetaSource?.content?.meta?.products_subheading ||
      productsMetaSource?.content?.meta?.productsSubtitle ||
      productsMetaSource?.content?.meta?.products_subtitle ||
      "";
    switch (renderOverride.type) {
      case "services-classic":
        return <ServiceListEmbedded slug={slug} pageStyle={styleProps} heading={servicesHeading} />;
      case "products":
        return (
          <ProductListEmbedded
            slug={slug}
            pageStyle={styleProps}
            heading={productsHeading}
            subheading={productsSubheading}
          />
        );
      case "basket":
        return <MyBasketEmbedded slug={slug} pageStyle={styleProps} />;
      case "my-bookings-auth":
        return (
          <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                textAlign: "center",
                borderRadius: 3,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                backgroundColor: "var(--page-card-bg, #fff)",
              }}
            >
              <Typography variant="h5" gutterBottom>
                My Bookings
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Please sign in to view your bookings and manage appointments.
              </Typography>
              <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
                <Button variant="contained" onClick={() => setLoginDialogOpen(true)}>
                  Login
                </Button>
                <Button variant="outlined" onClick={() => setRegisterDialogOpen(true)}>
                  Sign Up
                </Button>
              </Stack>
            </Paper>
          </Container>
        );
      case "jobs":
        if (jobFromQuery) {
          return <JobsDetailEmbedded slug={slug} jobSlug={jobFromQuery} pageStyle={styleProps} />;
        }
        return <JobsListEmbedded slug={slug} pageStyle={styleProps} />;
      case "blog-post":
        return <BlogPostEmbedded post={renderOverride.post} />;
      default:
        return null;
    }
  }, [renderOverride, slug, jobFromQuery, currentPage, pages]);

  if (loading) {
    return <Box sx={{ p: 6, textAlign: "center" }}><CircularProgress /></Box>;
  }
  if (err) {
    return <Container maxWidth="md" sx={{ py: 6 }}><Alert severity="error">{err}</Alert></Container>;
  }
  if (!pages || pages.length === 0) {
    const managerUrl = `https://${settings?.primary_host || "www.schedulaa.com"}/manager/website`;
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="info">
          <Stack spacing={2}>
            <Box>This site is not published yet.</Box>
            {isManagerForCompany && (
              <Button
                variant="outlined"
                href={managerUrl}
              >
                Open Website & Pages
              </Button>
            )}
          </Stack>
        </Alert>
      </Container>
    );
  }

  return (
    <ThemeRuntimeProvider overrides={runtimeOverrides}>
      <>
        <Meta
          title={metaTitle}
          description={metaDescription}
          canonical={pageCanonicalUrl}
          robots={robots}
          og={{ title: ogTitle, description: ogDescription, image: ogImage, url: pageCanonicalUrl }}
          twitter={{ title: ogTitle, description: ogDescription, image: ogImage }}
          meta={googleSiteVerification ? { "google-site-verification": googleSiteVerification } : {}}
        />
        {structuredDataPayload && <JsonLd data={structuredDataPayload} />}
        <GlobalStyles
          styles={(theme) => {
          const bodyStyles = {
            backgroundColor: activePageSurface?.backgroundColor || theme.palette.background.default,
            color:
              activePageCssVars?.["--page-body-color"] ||
              theme.palette.text.primary,
          };
          if (activePageSurface?.backgroundImage) {
            bodyStyles.backgroundImage = activePageSurface.backgroundImage;
          }
          if (activePageSurface?.backgroundRepeat) {
            bodyStyles.backgroundRepeat = activePageSurface.backgroundRepeat;
          }
          if (activePageSurface?.backgroundSize) {
            bodyStyles.backgroundSize = activePageSurface.backgroundSize;
          }
          if (activePageSurface?.backgroundPosition) {
            bodyStyles.backgroundPosition = activePageSurface.backgroundPosition;
          }
          if (activePageSurface?.backgroundAttachment) {
            bodyStyles.backgroundAttachment = activePageSurface.backgroundAttachment;
          }
          const rootVars = { ...(activePageCssVars || {}) };
          Object.entries(navCssVars).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
              rootVars[key] = value;
            }
          });
          return {
            body: bodyStyles,
            ":root": rootVars,
            a: {
              color:
                activePageCssVars?.["--page-link-color"] ||
                theme.palette.primary.main,
            },
          };
          }}
        />
      <NavStyleHydrator website={sitePayload || settings || {}} scopeSelector=".site-nav" />
      {/* Manager toolbar — only if role === 'manager' (and matches company if both ids exist) */}
      {isManagerForCompany && (
        <AppBar position="sticky" color="transparent" elevation={0} sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)", backdropFilter: "blur(6px)" }}>
          <Toolbar>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1, minWidth: 0, flexWrap: "wrap" }}>
              <Chip label={`Editing: ${company?.name ?? "Company"}`} size="small" />
              {toolbarMsg && <Chip label={toolbarMsg} color="success" size="small" />}
              {hasDraftChanges && (
                <Chip label="Draft changes pending" color="warning" size="small" />
              )}
              {lastPublishedLabel && (
                <Chip label={lastPublishedLabel} size="small" variant="outlined" />
              )}
              {toolbarMsg && (
                <Alert severity="success" variant="outlined" sx={{ px: 1, py: 0.5 }}>
                  {toolbarMsg}
                </Alert>
              )}
            </Stack>

            <Tooltip title="Pick theme">
              <IconButton onClick={(e) => setThemeAnchor(e.currentTarget)}><BrushIcon /></IconButton>
            </Tooltip>
            <Menu anchorEl={themeAnchor} open={Boolean(themeAnchor)} onClose={() => setThemeAnchor(null)}>
              {themes.map((t) => (
                <MenuItem key={t.id} selected={Number(settings?.theme?.id) === Number(t.id)} onClick={() => chooseTheme(t.id)}>
                  {t.name}
                </MenuItem>
              ))}
            </Menu>

            {hasServicesClassicPage && (
              <Button
                variant="outlined"
                startIcon={<StorefrontIcon />}
                component={RouterLink}
                to={servicesHref()}
                sx={{ ml: 1 }}
              >
                View Services
              </Button>
            )}

           

            <Button variant="contained" startIcon={<PublishIcon />} onClick={publish} disabled={publishing} sx={{ ml: 1 }}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>

            <Button color="primary" variant="contained" startIcon={<EditIcon />} sx={{ ml: 1 }} onClick={() => setEditorOpen(true)}>
              Edit Site
            </Button>
          </Toolbar>
        </AppBar>
      )}

      {/* PUBLIC NAV */}
      <Box className="site-nav" sx={{ py: `${headerPadding}px`, background: headerBg, color: headerTextColor }}>
        <Container
          maxWidth={headerFullWidth ? false : "lg"}
          disableGutters={headerFullWidth}
        >
          {headerSocialPosition === "above" && renderHeaderSocialIcons()}
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, md: 3 },
            gridTemplateColumns: headerGridColumns,
            alignItems: "center",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gridColumn: headerBrandGridColumn,
              ...logoEdgePlacement,
            }}
          >
            <IconButton onClick={handleMobileOpen} sx={{ color: headerTextColor }}>
              <MenuIcon />
            </IconButton>
            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              {renderHeaderBrandContent()}
            </Box>
            <Box sx={{ minWidth: 36, display: "flex", justifyContent: "flex-end" }}>
              {headerSocialInline && headerSocialLinks.length > 0
                ? renderHeaderSocialIcons({ inline: true, placement: "after" })
                : null}
            </Box>
          </Box>
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            justifyContent={{ xs: "space-between", md: headerLogoAlign }}
            sx={{
              display: { xs: "none", md: "flex" },
              width: "100%",
              maxWidth:
                headerConfig.layout === "split" && !headerFullWidth
                  ? { md: 420 }
                  : "100%",
              justifySelf: { xs: "stretch", md: logoSelf },
              gridColumn: headerBrandGridColumn,
              ...logoEdgePlacement,
            }}
          >
              <Stack direction="row" spacing={1.25} alignItems="center">
                {renderHeaderBrandContent()}
              </Stack>
              <IconButton
                onClick={handleMobileOpen}
                sx={{ display: { xs: "inline-flex", md: "none" }, color: headerTextColor }}
              >
                <MenuIcon />
              </IconButton>
            </Stack>
            <Box
              sx={{
                flex: 1,
                width: "100%",
                display: "flex",
                justifySelf: { xs: "stretch", md: navSelf },
                gridColumn: headerNavGridColumn,
                ...navEdgePlacement,
              }}
            >
              <Stack
                direction="row"
                spacing={0}
                flexWrap="wrap"
                sx={{
                  gap: `${navStyle.item_spacing}px`,
                  alignItems: "center",
                  justifyContent: headerNavAlign,
                  flex: 1,
                  display: { xs: "none", md: "flex" },
                }}
              >
                {headerSocialInline && headerSocialInlinePlacement === "before" &&
                  renderHeaderSocialIcons({ inline: true, placement: "before" })}
                {navItemsToRender.map((item) => {
                  if (item.onClick) {
                    return (
                      <Button
                        key={item.key}
                        size="small"
                        className="nav-btn"
                        variant="text"
                        disableElevation
                        onClick={item.onClick}
                        sx={navButtonStyling(item.active)}
                      >
                        {item.label}
                      </Button>
                    );
                  }
                  const external = isExternalHref(item.href);
                  const commonProps = external
                    ? { component: "a", href: item.href, target: "_blank", rel: "noreferrer" }
                    : { component: RouterLink, to: item.href };
                  return (
                    <Button
                      key={item.key}
                      size="small"
                      variant="text"
                      disableElevation
                      sx={navButtonStyling(item.active)}
                      {...commonProps}
                    >
                      {item.label}
                    </Button>
                  );
                })}
                {headerSocialInline && headerSocialInlinePlacement !== "before" &&
                  renderHeaderSocialIcons({
                    inline: true,
                    placement: headerSocialInlinePlacement || "after",
                  })}
              </Stack>
            </Box>
            {headerNavFullWidthCenter && (
              <Stack
                aria-hidden
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{
                  display: { xs: "none", md: "flex" },
                  visibility: "hidden",
                  pointerEvents: "none",
                  gridColumn: { md: "3 / 4" },
                }}
              >
                {renderHeaderBrandContent({ disableLink: true })}
              </Stack>
            )}
          </Box>
          {headerSocialPosition === "below" && renderHeaderSocialIcons()}
        </Container>
      </Box>
      <Drawer
        anchor="top"
        open={mobileNavOpen}
        onClose={handleMobileClose}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            pt: 2,
            pb: 3,
            px: 2.5,
            backgroundColor: headerBg || "#ffffff",
            color: headerTextColor,
          },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {navBrandName}
          </Typography>
          <IconButton onClick={handleMobileClose} sx={{ color: headerTextColor }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {renderMobileNavButtons()}
        {headerSocialPosition !== "above" && headerSocialPosition !== "below" && headerSocialLinks.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {renderHeaderSocialIcons({ inline: true, placement: "after" })}
          </Box>
        )}
      </Drawer>

      {/* PAGE CONTENT */}
      <Box
        sx={{
          pt: shouldRenderPublicReviews ? 0 : { xs: 1, md: 1.25 },
          pb: 0,
        }}
      >
        {overrideContent ? (
          overrideContent
        ) : (
          <Container
            maxWidth={pageLayout === "full" ? false : "lg"}
            sx={{ pt: 0, pb: 0 }}
          >
            {currentPage ? (
              <>
                {bodySections.length > 0 && (
                  <RenderSections sections={bodySections} layout={pageLayout} />
                )}
                {shouldRenderPublicReviews && (
                  <Box sx={{ mt: 0 }}>
                    <PublicReviewList slug={slug} disableShell compact />
                  </Box>
                )}
                {postReviewSections.length > 0 && (
                  <Box sx={{ mt: 0 }}>
                    <RenderSections sections={postReviewSections} layout={pageLayout} />
                  </Box>
                )}
                {footerSections.length > 0 && (
                  <RenderSections sections={footerSections} layout={pageLayout} />
                )}
              </>
            ) : (
              <Box sx={{ p: { xs: 3, md: 6 }, borderRadius: 2, bgcolor: "background.paper", border: "1px solid rgba(0,0,0,0.06)", textAlign: "center" }}>
                <Typography variant="h3" fontWeight={800} gutterBottom>Welcome to {company?.name ?? "our business"}</Typography>
                <Typography variant="body1" color="text.secondary">We’re getting our site ready. In the meantime, you can browse and book services.</Typography>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
                  <Button size="large" variant="contained" component={RouterLink} to={servicesHref()}>Book now</Button>
                </Stack>
              </Box>
            )}
          </Container>
        )}
      </Box>

      <ClientLoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        onLoginSuccess={handleClientLoginSuccess}
        companySlug={slug}
      />
      <ClientRegisterDialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        onRegisterSuccess={handleClientRegisterSuccess}
        onOpenLogin={() => {
          setRegisterDialogOpen(false);
          setLoginDialogOpen(true);
        }}
        onOpenForgot={() => {
          setRegisterDialogOpen(false);
          setForgotDialogOpen(true);
        }}
        companySlug={slug}
      />
      <ForgotPasswordDialog open={forgotDialogOpen} onClose={() => setForgotDialogOpen(false)} />

      {/* Full-screen editor (still rendered only for managers) */}
      {isManagerForCompany && (
        <Dialog fullScreen open={!!editorOpen} onClose={() => setEditorOpen(false)}>
          <Toolbar sx={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            <Typography sx={{ flexGrow: 1 }} variant="h6" fontWeight={700}>Visual Site Builder — {company?.name}</Typography>
            <IconButton onClick={() => setEditorOpen(false)}><CloseIcon /></IconButton>
          </Toolbar>
          <DialogContent sx={{ p: 0 }}>
            <VisualSiteBuilder />
          </DialogContent>
        </Dialog>
      )}

      {footerConfig && (
        <Box
          component="footer"
          sx={{
            backgroundColor: footerBg,
            color: footerTextColor,
            mt: 1,
            pt: 3,
            pb: 3,
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3} alignItems="flex-start">
                <Stack spacing={1} flex={1}>
                  {footerLogoUrl && (
                    <Box
                      component="img"
                      src={footerLogoUrl}
                      alt={siteTitle}
                      sx={{ height: 40, width: "auto", maxWidth: 160, objectFit: "contain" }}
                    />
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: footerLinkColor }}>
                    {siteTitle}
                  </Typography>
                  {footerSummary && (
                    <Typography
                      variant="body2"
                      sx={{ maxWidth: 560, color: footerLinkColor }}
                    >
                      {footerSummary}
                    </Typography>
                  )}
                </Stack>
                {footerSocialLinks.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    {footerSocialLinks.map((link, idx) => {
                      const Icon = SOCIAL_ICON_MAP[link.icon?.toLowerCase()] || DEFAULT_SOCIAL_ICON;
                      const href = normalizeHref(link.href || "");
                      return (
                        <IconButton
                          key={`footer-social-${idx}`}
                          component="a"
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          sx={{ color: footerTextColor, backgroundColor: "rgba(255,255,255,0.08)" }}
                        >
                          <Icon />
                        </IconButton>
                      );
                    })}
                  </Stack>
                )}
              </Stack>

              {footerColumns.length > 0 && (
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={4}
                  sx={{ mt: 2 }}
                  flexWrap="wrap"
                >
                  {footerColumns.map((col, idx) => (
                    <Box key={`footer-col-${idx}`} sx={{ flex: 1, minWidth: 160 }}>
                      {col.title && (
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 1, color: footerLinkColor }}
                        >
                          {col.title}
                        </Typography>
                      )}
                      <Stack spacing={0.5}>
                        {(col.links || []).map((link, linkIdx) => {
                          const href = normalizeHref(link.href || "");
                          const external = isExternalHref(href);
                          const commonProps = external
                            ? { component: "a", href, target: "_blank", rel: "noreferrer" }
                            : { component: RouterLink, to: href };
                          return (
                            <Button
                              key={`footer-link-${idx}-${linkIdx}`}
                              sx={{ justifyContent: "flex-start", color: footerLinkColor, textTransform: "none" }}
                              {...commonProps}
                            >
                              {link.label || link.href}
                            </Button>
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}

              {footerLegalLinks.length > 0 && (
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                      sx={{ borderTop: "1px solid rgba(255,255,255,0.12)", pt: 2, mt: 2, flexWrap: "wrap" }}
                    >
                      {footerLegalLinks.map((link, idx) => {
                        const href = normalizeHref(link.href || "");
                        const external = isExternalHref(href);
                        const commonProps = external
                      ? { component: "a", href, target: "_blank", rel: "noreferrer" }
                      : { component: RouterLink, to: href };
                    return (
                          <Button
                            key={`footer-legal-${idx}`}
                            sx={{ color: footerLinkColor, textTransform: "none", padding: 0, minWidth: "auto" }}
                            {...commonProps}
                          >
                            {link.label || link.href}
                          </Button>
                    );
                  })}
                </Stack>
              )}
              {showCopyright && (
                <Typography
                  variant="caption"
                  sx={{ mt: 2, opacity: 0.8, color: footerTextColor }}
                >
                  {copyrightText}
                </Typography>
              )}
            </Stack>
          </Container>
        </Box>
      )}
      <Snackbar
        open={Boolean(publishSnack)}
        autoHideDuration={4000}
        onClose={() => setPublishSnack("")}
        message={publishSnack}
      />
      </>
    </ThemeRuntimeProvider>
  );
}

function setTenantFavicon(href) {
  if (typeof document === "undefined") return;
  const next = (href || "").trim();
  const value = next || "/favicon.ico";
  const rels = ["icon", "shortcut icon"];
  rels.forEach((rel) => {
    let link = document.querySelector(`link[rel='${rel}']`);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = value;
  });
}
