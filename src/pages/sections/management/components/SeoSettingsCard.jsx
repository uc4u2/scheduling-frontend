
// src/pages/sections/management/components/SeoSettingsCard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LaunchIcon from "@mui/icons-material/Launch";
import SaveIcon from "@mui/icons-material/Save";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

import { tenantBaseUrl, normalizeDomain, isValidHostname } from "../../../../utils/tenant";
import { SearchSnippetPreview, SocialCardPreview } from "../../../../components/seo/SeoPreview";
import { API_BASE_URL, wb } from "../../../../utils/api";
import SeoHelpDrawer from "./SeoHelpDrawer";

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 155;
const MAX_KEYWORDS = 400;

const formatStructuredInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
};

const parseStructuredInput = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const ensureUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const buildStructuredSchema = (fields) => {
  const sameAs = (fields.sameAs || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const addressFields = {
    "@type": "PostalAddress",
    streetAddress: fields.streetAddress,
    addressLocality: fields.city,
    addressRegion: fields.region,
    postalCode: fields.postalCode,
    addressCountry: fields.country,
  };
  const address = Object.entries(addressFields).reduce((acc, [key, value]) => {
    if (!value || (key === "@type" && !fields.hasAddress)) return acc;
    acc[key] = value;
    return acc;
  }, {});

  const schema = {
    "@context": "https://schema.org",
    "@type": fields.type || "LocalBusiness",
    name: fields.name,
    url: ensureUrl(fields.url),
    telephone: fields.phone,
    email: fields.email,
    priceRange: fields.priceRange,
  };

  if (fields.logo) schema.logo = ensureUrl(fields.logo);
  if (sameAs.length) schema.sameAs = sameAs.map(ensureUrl);
  if (fields.hasAddress && Object.keys(address).length > 1) {
    schema.address = address;
  }

  return Object.entries(schema).reduce((acc, [key, value]) => {
    if (!value || (Array.isArray(value) && !value.length)) return acc;
    acc[key] = value;
    return acc;
  }, {});
};

const isHttpsUrl = (value) => /^https:\/\//i.test(value || "");

const normalizeUploadUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return "";
};

const resolveLogoUrl = (logoAsset, fallback) => {
  const candidate =
    logoAsset?.url ||
    logoAsset?.url_public ||
    logoAsset?.href ||
    logoAsset?.src ||
    fallback;
  return typeof candidate === "string" ? candidate : "";
};

const defaultStructuredFields = {
  name: "",
  url: "",
  logo: "",
  phone: "",
  email: "",
  priceRange: "",
  type: "LocalBusiness",
  hasAddress: false,
  streetAddress: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  sameAs: "",
};

const labelWithTip = (label, tip) => (
  <Stack direction="row" alignItems="center" spacing={0.5} sx={{ lineHeight: 1 }}>
    <Typography component="span" variant="inherit">
      {label}
    </Typography>
    {tip ? (
      <Tooltip title={tip} arrow placement="top">
        <IconButton size="small" sx={{ p: 0.25 }}>
          <InfoOutlinedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    ) : null}
  </Stack>
);

const SeoSettingsCard = ({
  companyId,
  companySlug,
  domainStatus,
  customDomain,
  primaryHost,
  settings,
  companyLogoUrl,
  hasDraftChanges,
  onSave,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const seo = settings?.seo || {};
  const tt = (key, defaultValue, options = {}) => t(key, { defaultValue, ...options });

  const [metaTitle, setMetaTitle] = useState(seo.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(seo.metaDescription || "");
  const [metaKeywords, setMetaKeywords] = useState(seo.metaKeywords || "");
  const [ogTitle, setOgTitle] = useState(seo.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(seo.ogDescription || "");
  const [ogImage, setOgImage] = useState(seo.ogImage || "");
  const [faviconUrl, setFaviconUrl] = useState(settings?.favicon_url || "");
  const [useLogoFavicon, setUseLogoFavicon] = useState(!settings?.favicon_url);
  const [canonicalMode, setCanonicalMode] = useState(
    seo.canonicalMode || (["verified", "verified_dns", "ssl_active", "provisioning_ssl"].includes(domainStatus) ? "custom" : "slug")
  );
  const [canonicalHost, setCanonicalHost] = useState(seo.canonicalHost || customDomain || "");
  const [structuredDataEnabled, setStructuredDataEnabled] = useState(
    Boolean(seo.structuredDataEnabled)
  );
  const [structuredAdvanced, setStructuredAdvanced] = useState(false);
  const [structuredData, setStructuredData] = useState(formatStructuredInput(seo.structuredData));
  const [structuredFields, setStructuredFields] = useState(defaultStructuredFields);
  const [structuredError, setStructuredError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingSchemaLogo, setUploadingSchemaLogo] = useState(false);
  const [ogImageWarning, setOgImageWarning] = useState("");
  const [faviconWarning, setFaviconWarning] = useState("");
  const [draftNotice, setDraftNotice] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [error, setError] = useState(null);

  const domainVerified = useMemo(
    () => ["verified", "verified_dns", "ssl_active", "provisioning_ssl"].includes(domainStatus),
    [domainStatus]
  );

  useEffect(() => {
    const nextSeo = settings?.seo || {};
    setMetaTitle(nextSeo.metaTitle || "");
    setMetaDescription(nextSeo.metaDescription || "");
    setMetaKeywords(nextSeo.metaKeywords || "");
    setOgTitle(nextSeo.ogTitle || "");
    setOgDescription(nextSeo.ogDescription || "");
    setOgImage(nextSeo.ogImage || "");
    const nextFavicon =
      settings?.favicon_url ||
        settings?.settings?.favicon_url ||
        settings?.website?.favicon_url ||
        "";
    setFaviconUrl(nextFavicon);
    setUseLogoFavicon(!nextFavicon);
    setCanonicalMode(nextSeo.canonicalMode || (domainVerified ? "custom" : "slug"));
    setCanonicalHost(nextSeo.canonicalHost || customDomain || "");
    setStructuredDataEnabled(Boolean(nextSeo.structuredDataEnabled));
    const parsedStructured = parseStructuredInput(nextSeo.structuredData);
    if (parsedStructured && typeof parsedStructured === "object") {
      setStructuredAdvanced(false);
      setStructuredFields((prev) => ({
        ...prev,
        name: parsedStructured.name || "",
        url: parsedStructured.url || "",
        logo: parsedStructured.logo || "",
        phone: parsedStructured.telephone || "",
        email: parsedStructured.email || "",
        priceRange: parsedStructured.priceRange || "",
        type: parsedStructured["@type"] || "LocalBusiness",
        hasAddress: Boolean(parsedStructured.address),
        streetAddress: parsedStructured.address?.streetAddress || "",
        city: parsedStructured.address?.addressLocality || "",
        region: parsedStructured.address?.addressRegion || "",
        postalCode: parsedStructured.address?.postalCode || "",
        country: parsedStructured.address?.addressCountry || "",
        sameAs: Array.isArray(parsedStructured.sameAs)
          ? parsedStructured.sameAs.join(", ")
          : (typeof parsedStructured.sameAs === "string" ? parsedStructured.sameAs : ""),
      }));
      setStructuredData(formatStructuredInput(parsedStructured));
    } else if (nextSeo.structuredData) {
      setStructuredAdvanced(true);
      setStructuredData(formatStructuredInput(nextSeo.structuredData));
    } else {
      setStructuredAdvanced(false);
      setStructuredData("");
      setStructuredFields((prev) => ({
        ...prev,
        name: settings?.site_title || companySlug || "",
        url: "",
        logo: "",
      }));
    }
  }, [settings, domainVerified, customDomain]);

  const slugBaseUrl = useMemo(() => {
    return seo.slugBaseUrl || tenantBaseUrl({ slug: companySlug, primaryHost });
  }, [seo.slugBaseUrl, companySlug, primaryHost]);

  const canonicalHostUrl = useMemo(() => {
    if (canonicalMode !== "custom" || domainStatus !== "verified") {
      return slugBaseUrl;
    }
    return ensureUrl(canonicalHost || customDomain || "");
  }, [canonicalMode, domainStatus, canonicalHost, customDomain, slugBaseUrl]);

  useEffect(() => {
    setStructuredFields((prev) => ({
      ...prev,
      url: prev.url || canonicalHostUrl || slugBaseUrl,
      logo: prev.logo || companyLogoUrl || "",
      name: prev.name || settings?.site_title || companySlug || "",
    }));
  }, [canonicalHostUrl, slugBaseUrl, companyLogoUrl, settings, companySlug]);

  useEffect(() => {
    if (!structuredDataEnabled || !structuredAdvanced) return;
    if (structuredData.trim()) return;
    const generated = buildStructuredSchema({
      ...structuredFields,
      url: structuredFields.url || canonicalHostUrl || slugBaseUrl,
    });
    setStructuredData(JSON.stringify(generated, null, 2));
  }, [
    structuredDataEnabled,
    structuredAdvanced,
    structuredData,
    structuredFields,
    canonicalHostUrl,
    slugBaseUrl,
  ]);

  const sitemapUrl = useMemo(() => {
    const base = canonicalHostUrl || slugBaseUrl;
    if (!base) return "";
    try {
      return new URL("/sitemap.xml", base).toString();
    } catch {
      return "";
    }
  }, [canonicalHostUrl, slugBaseUrl]);

  const robotsUrl = useMemo(() => {
    const base = canonicalHostUrl || slugBaseUrl;
    if (!base) return "";
    try {
      return new URL("/robots.txt", base).toString();
    } catch {
      return "";
    }
  }, [canonicalHostUrl, slugBaseUrl]);
  const titleRemaining = MAX_TITLE - metaTitle.length;
  const descRemaining = MAX_DESCRIPTION - metaDescription.length;
  const canonicalLocked = !domainVerified;

  const previewTitle = ogTitle || metaTitle || settings?.site_title || companySlug || "Your business";
  const previewDescription = ogDescription || metaDescription || "Your summary will appear in chat previews.";
  const previewImage = ogImage || "";
  const faviconFallback = useMemo(() => {
    const header = settings?.header || {};
    const footer = settings?.footer || {};
    const headerLogo =
      header.logo_url ||
      header.logo_asset_url ||
      header.logo ||
      "";
    const footerLogo =
      footer.logo_url ||
      footer.logo_asset_url ||
      footer.logo ||
      "";
    return (
      resolveLogoUrl(header.logo_asset, headerLogo) ||
      resolveLogoUrl(footer.logo_asset, footerLogo) ||
      companyLogoUrl ||
      ""
    );
  }, [settings, companyLogoUrl]);
  const previewHost = useMemo(() => {
    const url = canonicalHostUrl || slugBaseUrl;
    try {
      return new URL(url).host;
    } catch {
      return url || "";
    }
  }, [canonicalHostUrl, slugBaseUrl]);

  const effectiveFaviconUrl = useMemo(
    () => (useLogoFavicon ? "" : faviconUrl),
    [useLogoFavicon, faviconUrl]
  );

  const faviconPreviewUrl = useMemo(
    () => (useLogoFavicon ? faviconFallback : faviconUrl),
    [useLogoFavicon, faviconFallback, faviconUrl]
  );

  const ogTestCurrentUrl = useMemo(() => {
    if (!domainVerified) return "";
    const hostUrl = ensureUrl(customDomain || canonicalHost || "");
    if (!hostUrl) return "";
    try {
      return `${new URL(hostUrl).origin}/__og`;
    } catch {
      return "";
    }
  }, [domainStatus, customDomain, canonicalHost]);

  const ogTestSlugUrl = useMemo(() => {
    if (!companySlug) return "";
    const base = String(API_BASE_URL || "").trim().replace(/\/$/, "");
    if (/^https?:\/\//i.test(base)) {
      return `${base}/__og?slug=${encodeURIComponent(companySlug)}`;
    }
    const host = normalizeDomain(primaryHost) || "schedulaa.com";
    return `https://${host}/__og?slug=${encodeURIComponent(companySlug)}`;
  }, [companySlug, primaryHost]);

  const uploadOgImage = async (file) => {
    if (!file || !companyId) return;
    setUploadingOg(true);
    try {
      const res = await wb.mediaUpload(companyId, file);
      const url = normalizeUploadUrl(res?.data?.items?.[0]?.url);
      if (!url) {
        throw new Error("Upload returned no URL");
      }
      setOgImage(url);
      enqueueSnackbar(tt("management.domainSettings.seo.notifications.uploadOgSuccess", "Open Graph image uploaded"), {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage || err?.message || tt("management.domainSettings.seo.notifications.uploadOgFailed", "Failed to upload OG image."),
        { variant: "error" }
      );
    } finally {
      setUploadingOg(false);
    }
  };

  const uploadFavicon = async (file) => {
    if (!file || !companyId) return;
    if (useLogoFavicon) return;
    setUploadingFavicon(true);
    try {
      const res = await wb.mediaUpload(companyId, file);
      const url = normalizeUploadUrl(res?.data?.items?.[0]?.url);
      if (!url) {
        throw new Error("Upload returned no URL");
      }
      setFaviconUrl(url);
      enqueueSnackbar(tt("management.domainSettings.seo.notifications.uploadFaviconSuccess", "Favicon uploaded"), {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage || err?.message || tt("management.domainSettings.seo.notifications.uploadFaviconFailed", "Failed to upload favicon."),
        { variant: "error" }
      );
    } finally {
      setUploadingFavicon(false);
    }
  };

  const uploadSchemaLogo = async (file) => {
    if (!file || !companyId) return;
    setUploadingSchemaLogo(true);
    try {
      const res = await wb.mediaUpload(companyId, file);
      const url = normalizeUploadUrl(res?.data?.items?.[0]?.url);
      if (!url) {
        throw new Error("Upload returned no URL");
      }
      setStructuredFields((prev) => ({ ...prev, logo: url }));
      enqueueSnackbar("Logo uploaded", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage || err?.message || "Failed to upload logo.",
        { variant: "error" }
      );
    } finally {
      setUploadingSchemaLogo(false);
    }
  };

  const handleCanonicalChange = (_, next) => {
    if (!next) return;
    if (next === "custom" && canonicalLocked) {
      enqueueSnackbar(tt("management.domainSettings.seo.notifications.verifyDomain", "Verify domain before switching to custom canonical"), {
        variant: "info",
      });
      return;
    }
    setCanonicalMode(next);
  };

  useEffect(() => {
    let alive = true;
    if (!ogImage || !isHttpsUrl(ogImage)) {
      setOgImageWarning("");
      return undefined;
    }
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (!w || !h) {
        setOgImageWarning("");
        return;
      }
      const ratio = w / h;
      const ratioDiff = Math.abs(ratio - 1.91);
      if (w < 1000 || h < 500 || ratioDiff > 0.2) {
        setOgImageWarning("Recommended size is 1200×630 (1.91:1). Current image may crop poorly.");
      } else {
        setOgImageWarning("");
      }
    };
    img.onerror = () => {
      if (!alive) return;
      setOgImageWarning("Could not load the Open Graph image to verify dimensions.");
    };
    img.src = ogImage;
    return () => {
      alive = false;
    };
  }, [ogImage]);

  useEffect(() => {
    let alive = true;
    const target = useLogoFavicon ? faviconFallback : faviconUrl;
    if (!target || !isHttpsUrl(target)) {
      setFaviconWarning("");
      return undefined;
    }
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (!w || !h) {
        setFaviconWarning("");
        return;
      }
      if (Math.max(w, h) > 64) {
        setFaviconWarning("Recommended favicon size is 32×32 or 48×48 (max 64×64).");
      } else {
        setFaviconWarning("");
      }
    };
    img.onerror = () => {
      if (!alive) return;
      setFaviconWarning("Could not load the favicon to verify dimensions.");
    };
    img.src = target;
    return () => {
      alive = false;
    };
  }, [useLogoFavicon, faviconFallback, faviconUrl]);

  const validate = () => {
    if (ogImage && !isHttpsUrl(ogImage)) {
      setError(tt("management.domainSettings.seo.errors.invalidOgImage", "Open Graph image must be a valid https:// URL."));
      return false;
    }
    if (!useLogoFavicon && faviconUrl && !isHttpsUrl(faviconUrl)) {
      setError(tt("management.domainSettings.seo.errors.invalidFavicon", "Favicon must be a valid https:// URL."));
      return false;
    }
    if (canonicalMode === "custom" && canonicalLocked) {
      setError(tt("management.domainSettings.seo.errors.lockedCanonical", "Verify your custom domain to unlock canonical."));
      return false;
    }
    if (canonicalMode === "custom") {
      const normalized = normalizeDomain(canonicalHost || customDomain);
      if (!normalized || !isValidHostname(normalized)) {
        setError(tt("management.domainSettings.seo.errors.invalidCustomDomain", "Custom domain looks invalid. Use studio.example.com."));
        return false;
      }
    }
    if (structuredDataEnabled && structuredAdvanced && structuredData.trim()) {
      try {
        JSON.parse(structuredData);
        setStructuredError(null);
      } catch {
        setStructuredError(tt("management.domainSettings.seo.errors.invalidStructuredData", "Structured data must be valid JSON."));
        return false;
      }
    } else {
      setStructuredError(null);
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!companyId || saving) return;
    if (!validate()) return;

    setSaving(true);
    setError(null);
    try {
      let structuredPayload = null;
      if (structuredDataEnabled) {
        if (structuredAdvanced && structuredData.trim()) {
          structuredPayload = JSON.parse(structuredData);
        } else if (!structuredAdvanced) {
          structuredPayload = buildStructuredSchema({
            ...structuredFields,
            url: structuredFields.url || canonicalHostUrl || slugBaseUrl,
          });
        }
      }
      await onSave?.({
        seo: {
          metaTitle,
          metaDescription,
          metaKeywords,
          ogTitle,
          ogDescription,
          ogImage,
          canonicalMode: canonicalMode === "custom" && !canonicalLocked ? "custom" : "slug",
          canonicalHost: canonicalMode === "custom" ? normalizeDomain(canonicalHost || customDomain) : null,
          structuredDataEnabled,
          structuredData: structuredPayload,
        },
        favicon_url: useLogoFavicon ? null : (faviconUrl || null),
      });
      setDraftNotice(true);
      enqueueSnackbar(tt("management.domainSettings.seo.notifications.saveSuccess", "SEO settings saved"), {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage || err?.message || tt("management.domainSettings.seo.notifications.saveFailed", "Failed to save SEO settings."),
        { variant: "error" }
      );
    } finally {
      setSaving(false);
    }
  };

  const showPublishNotice = draftNotice || hasDraftChanges;
  const handleGoToPublish = () => {
    navigate("/manager/website/editor");
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {tt("management.domainSettings.seo.title", "SEO & Metadata")}
        </Typography>
        <Button
          variant="text"
          size="small"
          startIcon={<HelpOutlineIcon fontSize="small" />}
          onClick={() => setHelpOpen(true)}
        >
          Help
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={saving || !companyId}
        >
          {tt("management.domainSettings.seo.buttons.save", "Save")}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {showPublishNotice && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          onClose={!hasDraftChanges ? () => setDraftNotice(false) : undefined}
        >
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <Box sx={{ flex: 1 }}>
              SEO settings saved as draft. Click Publish in Website & Pages to make changes live.
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={handleGoToPublish}
            >
              Go to Publish
            </Button>
          </Stack>
        </Alert>
      )}

      <Stack spacing={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {tt("management.domainSettings.seo.sections.search", "Search result listing")}
            </Typography>
            <Tooltip
              title="These fields control how your site appears in Google search results."
              arrow
              placement="top"
            >
              <InfoOutlinedIcon fontSize="inherit" />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tt("management.domainSettings.seo.sections.searchHint", "Set the title and description Google shows most often.")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Example: “Award-winning tattoo artists in Toronto | Book in minutes.”
          </Typography>
          <SearchSnippetPreview
            title={metaTitle || settings?.site_title}
            url={canonicalHostUrl || slugBaseUrl}
            description={
              metaDescription ||
              tt(
                "management.domainSettings.seo.helpers.description",
                "Recommended under {{max}} characters ({{remaining}} remaining)",
                { max: MAX_DESCRIPTION, remaining: Math.max(descRemaining, 0) }
              )
            }
          />
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={labelWithTip(
                tt("management.domainSettings.seo.fields.metaTitle", "Meta Title"),
                "Appears as the main title in search results."
              )}
              value={metaTitle}
              onChange={(event) => setMetaTitle(event.target.value.slice(0, 120))}
              helperText={tt(
                "management.domainSettings.seo.helpers.title",
                "Recommended under {{max}} characters ({{remaining}} remaining)",
                { max: MAX_TITLE, remaining: Math.max(titleRemaining, 0) }
              )}
              inputProps={{ maxLength: 120 }}
            />
            <TextField
              label={labelWithTip(
                tt("management.domainSettings.seo.fields.metaDescription", "Meta Description"),
                "Short summary shown under the title in search results."
              )}
              value={metaDescription}
              onChange={(event) => setMetaDescription(event.target.value.slice(0, 320))}
              helperText={tt(
                "management.domainSettings.seo.helpers.description",
                "Recommended under {{max}} characters ({{remaining}} remaining)",
                { max: MAX_DESCRIPTION, remaining: Math.max(descRemaining, 0) }
              )}
              inputProps={{ maxLength: 320 }}
              multiline
              minRows={3}
            />
            <TextField
              label={labelWithTip(
                tt("management.domainSettings.seo.fields.metaKeywords", "Meta Keywords"),
                "Optional keywords that describe your services."
              )}
              value={metaKeywords}
              onChange={(event) => setMetaKeywords(event.target.value.slice(0, MAX_KEYWORDS))}
              helperText={tt("management.domainSettings.seo.helpers.keywords", "Comma separated (e.g., tattoo, piercing, studio)")}
            />
            <Typography variant="caption" color="text.secondary">
              Tip: Stick to 4–6 phrases such as “fine line tattoo, cosmetic tattoo, Toronto studio”.
            </Typography>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {tt("management.domainSettings.seo.sections.social", "Social sharing")}
            </Typography>
            <Tooltip
              title="Controls how links look when shared in WhatsApp, Facebook, Slack, and SMS."
              arrow
              placement="top"
            >
              <InfoOutlinedIcon fontSize="inherit" />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tt("management.domainSettings.seo.sections.socialHint", "Customize the preview cards shown in chat, SMS, and social media.")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Use a 1200×630 hero image and a title like “Schedulaa — Enterprise Tattoo Studio”.
          </Typography>
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              bgcolor: "background.paper",
            }}
          >
            <SocialCardPreview
              title={previewTitle}
              description={previewDescription}
              image={previewImage}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Preview domain: {previewHost || "your-domain.com"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Canonical: {canonicalMode === "custom" && !canonicalLocked ? "custom domain" : "schedulaa.com slug"}
            </Typography>
            {!ogImage && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Fallback: homepage hero image will be used for social previews.
              </Typography>
            )}
          </Box>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={labelWithTip(
                tt("management.domainSettings.seo.fields.ogTitle", "Open Graph Title"),
                "Headline shown in social previews."
              )}
              value={ogTitle}
              onChange={(event) => setOgTitle(event.target.value)}
            />
            <TextField
              label={labelWithTip(
                tt("management.domainSettings.seo.fields.ogDescription", "Open Graph Description"),
                "Short summary shown in social previews."
              )}
              value={ogDescription}
              onChange={(event) => setOgDescription(event.target.value)}
            />
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
              <TextField
                label={labelWithTip(
                  tt("management.domainSettings.seo.fields.ogImage", "Open Graph Image URL"),
                  "Main image for social previews (1200×630 recommended)."
                )}
                value={ogImage}
                onChange={(event) => setOgImage(event.target.value)}
                placeholder={tt("management.domainSettings.seo.placeholders.ogImage", "https://example.com/social-preview.jpg")}
                error={Boolean(ogImage && !isHttpsUrl(ogImage))}
                helperText={
                  ogImage
                    ? tt("management.domainSettings.seo.helpers.ogImage", "Use a 1200×630 HTTPS image.")
                    : tt("management.domainSettings.seo.helpers.ogImageFallback", "Fallback: homepage hero image will be used for social previews.")
                }
                fullWidth
              />
              <Box
                sx={{
                  width: 96,
                  height: 64,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: ogImage ? "transparent" : "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {ogImage ? (
                  <img
                    alt="OG preview"
                    src={ogImage}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary" align="center">
                    Using hero fallback
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={uploadingOg || !companyId}
                sx={{ minWidth: 180 }}
              >
                {uploadingOg ? tt("management.domainSettings.seo.buttons.uploading", "Uploading...") : tt("management.domainSettings.seo.buttons.uploadOg", "Upload OG image")}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    uploadOgImage(file);
                  }}
                />
              </Button>
            </Stack>
            {ogImageWarning && (
              <Alert severity="warning">{ogImageWarning}</Alert>
            )}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useLogoFavicon}
                    onChange={(event) => setUseLogoFavicon(event.target.checked)}
                  />
                }
                label={labelWithTip(
                  tt("management.domainSettings.seo.fields.useLogoFavicon", "Use header/logo as favicon (recommended)"),
                  "If enabled, we use your header logo as the browser tab icon."
                )}
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
              <TextField
                label={labelWithTip(
                  tt("management.domainSettings.seo.fields.favicon", "Favicon URL"),
                  "Small icon shown in browser tabs (32×32 or 48×48)."
                )}
                value={effectiveFaviconUrl}
                onChange={(event) => setFaviconUrl(event.target.value)}
                placeholder={tt("management.domainSettings.seo.placeholders.favicon", "https://example.com/favicon.png")}
                error={Boolean(effectiveFaviconUrl && !isHttpsUrl(effectiveFaviconUrl))}
                helperText={
                  useLogoFavicon
                    ? tt("management.domainSettings.seo.helpers.faviconFallback", "Fallback: your header logo will be used until you upload a favicon.")
                    : effectiveFaviconUrl
                    ? tt("management.domainSettings.seo.helpers.favicon", "Recommended PNG 32×32 or 48×48 (or .ico), must be https://")
                    : faviconFallback
                    ? tt("management.domainSettings.seo.helpers.faviconFallback", "Fallback: your header logo will be used until you upload a favicon.")
                    : tt("management.domainSettings.seo.helpers.favicon", "Recommended PNG 32×32 or 48×48 (or .ico), must be https://")
                }
                disabled={useLogoFavicon}
                fullWidth
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: faviconPreviewUrl ? "transparent" : "action.hover",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {faviconPreviewUrl ? (
                  <img
                    alt="Favicon preview"
                    src={faviconPreviewUrl}
                    style={{ width: 32, height: 32, objectFit: "contain" }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    —
                  </Typography>
                )}
              </Box>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUploadIcon />}
                disabled={uploadingFavicon || !companyId || useLogoFavicon}
                sx={{ minWidth: 180 }}
              >
                {uploadingFavicon ? tt("management.domainSettings.seo.buttons.uploading", "Uploading...") : tt("management.domainSettings.seo.buttons.uploadFavicon", "Upload favicon")}
                <input
                  type="file"
                  accept="image/png,image/x-icon,.ico"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    uploadFavicon(file);
                  }}
                />
              </Button>
            </Stack>
            {useLogoFavicon && faviconFallback && (
              <Typography variant="caption" color="text.secondary">
                Using logo fallback
              </Typography>
            )}
            {faviconWarning && (
              <Alert severity="warning">{faviconWarning}</Alert>
            )}
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
              <Button
                variant="outlined"
                endIcon={<LaunchIcon />}
                href={ogTestCurrentUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!ogTestCurrentUrl}
              >
                {tt("management.domainSettings.seo.buttons.testOgCurrent", "Test current host preview")}
              </Button>
              <Button
                variant="outlined"
                endIcon={<LaunchIcon />}
                href={ogTestSlugUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!ogTestSlugUrl}
              >
                {tt("management.domainSettings.seo.buttons.testOgSlug", "Test slug preview")}
              </Button>
            </Stack>
            <Accordion sx={{ borderRadius: 2 }} variant="outlined">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">
                  {tt("management.domainSettings.seo.sections.help", "How social previews work")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="ul" sx={{ pl: 3, mb: 0, mt: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                    WhatsApp and similar crawlers don’t execute JavaScript, so Schedulaa serves server-side OG tags for bots.
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                    Use the Open Graph fields to control how your links appear in chat and social feeds.
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                    If Open Graph image is empty, the homepage hero image is used automatically.
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                    Canonical links switch to your custom domain only after it’s verified.
                  </Typography>
                  <Typography component="li" variant="body2">
                    Your root domain should redirect to the www host for consistent previews.
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {tt("management.domainSettings.seo.sections.advanced", "Advanced settings")}
            </Typography>
            <Tooltip
              title="Control canonical URLs and structured data for search engines."
              arrow
              placement="top"
            >
              <InfoOutlinedIcon fontSize="inherit" />
            </Tooltip>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tt("management.domainSettings.seo.sections.advancedHint", "Control canonical hosts and structured data for better indexing.")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Point crawlers at your custom domain and optionally embed JSON-LD Organization data.
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  {tt("management.domainSettings.seo.fields.canonicalHost", "Canonical host")}
                </Typography>
                <Tooltip
                  title="Canonical tells search engines the preferred version of your pages."
                  arrow
                  placement="top"
                >
                  <InfoOutlinedIcon fontSize="inherit" />
                </Tooltip>
              </Stack>
              <ToggleButtonGroup
                value={canonicalLocked ? "slug" : canonicalMode}
                exclusive
                size="small"
                onChange={handleCanonicalChange}
                sx={{ mt: 1 }}
              >
                <ToggleButton value="slug">
                  <Tooltip title="Use your schedulaa.com/slug URL as canonical." arrow placement="top">
                    <Box component="span">
                      {tt("management.domainSettings.seo.canonical.slug", "schedulaa.com slug")}
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="custom" disabled={canonicalLocked}>
                  <Tooltip title="Use your verified custom domain as canonical." arrow placement="top">
                    <Box component="span">
                      {tt("management.domainSettings.seo.canonical.custom", "Custom domain")}
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              {canonicalMode === "custom" && !canonicalLocked && (
                <TextField
                  sx={{ mt: 2 }}
                  label={labelWithTip(
                    tt("management.domainSettings.seo.fields.customHost", "Custom canonical host"),
                    "Use your verified domain as the preferred URL."
                  )}
                  value={canonicalHost}
                  onChange={(e) => setCanonicalHost(e.target.value)}
                  helperText={tt("management.domainSettings.seo.helpers.customHost", "Enter your verified domain, e.g., studio.example.com")}
                />
              )}
              {canonicalLocked && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {tt("management.domainSettings.seo.canonical.lockedMessage", "Verify your custom domain to unlock canonical hosting.")}
                </Typography>
              )}
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <TextField
                size="small"
                fullWidth
                InputProps={{ readOnly: true }}
                value={canonicalHostUrl}
                label={labelWithTip(
                  tt("management.domainSettings.seo.fields.previewTitle", "Preview URL"),
                  "This is the URL search engines will treat as canonical."
                )}
              />
              <Button
                variant="outlined"
                endIcon={<LaunchIcon />}
                href={canonicalHostUrl}
                target="_blank"
                rel="noopener noreferrer"
                disabled={!canonicalHostUrl}
              >
                {tt("management.domainSettings.seo.buttons.open", "Open")}
              </Button>
            </Stack>

            <Box>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Sitemap & robots
                </Typography>
                <Tooltip
                  title="These files help search engines discover your published pages."
                  arrow
                  placement="top"
                >
                  <InfoOutlinedIcon fontSize="inherit" />
                </Tooltip>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<LaunchIcon />}
                  href={sitemapUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={!sitemapUrl}
                >
                  Sitemap.xml
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<LaunchIcon />}
                  href={robotsUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  disabled={!robotsUrl}
                >
                  Robots.txt
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Search engines use these files to discover your published pages.
              </Typography>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={structuredDataEnabled}
                  onChange={(_, checked) => setStructuredDataEnabled(checked)}
                />
              }
              label={labelWithTip(
                tt("management.domainSettings.seo.fields.structuredData", "Include structured data (schema.org)"),
                "Adds business info for richer Google results."
              )}
            />
            {structuredDataEnabled && (
              <FormControlLabel
                sx={{ mt: -1 }}
                control={
                  <Checkbox
                    checked={structuredAdvanced}
                    onChange={(_, checked) => setStructuredAdvanced(checked)}
                    size="small"
                  />
                }
                label={labelWithTip(
                  "Advanced (edit raw JSON)",
                  "Use this only if you already have a JSON-LD snippet."
                )}
              />
            )}
            {structuredDataEnabled && !structuredAdvanced && (
              <Stack spacing={2}>
                <TextField
                  label={labelWithTip("Business name", "Your public-facing business name.")}
                  value={structuredFields.name}
                  onChange={(event) => setStructuredFields((prev) => ({ ...prev, name: event.target.value }))}
                />
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField
                    label={labelWithTip("Website URL", "Your main website address.")}
                    value={structuredFields.url}
                    onChange={(event) => setStructuredFields((prev) => ({ ...prev, url: event.target.value }))}
                    helperText="Use your public homepage URL."
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }}>
                  <TextField
                    label={labelWithTip("Logo URL", "Square logo works best for search cards.")}
                    value={structuredFields.logo}
                    onChange={(event) => setStructuredFields((prev) => ({ ...prev, logo: event.target.value }))}
                    helperText="Optional. Use a square logo if possible."
                    fullWidth
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    disabled={uploadingSchemaLogo || !companyId}
                    sx={{ minWidth: 160 }}
                  >
                    {uploadingSchemaLogo ? "Uploading..." : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        uploadSchemaLogo(file);
                      }}
                    />
                  </Button>
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField
                    label={labelWithTip("Phone", "Customer-facing phone number.")}
                    value={structuredFields.phone}
                    onChange={(event) => setStructuredFields((prev) => ({ ...prev, phone: event.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={labelWithTip("Email", "Public contact email.")}
                    value={structuredFields.email}
                    onChange={(event) => setStructuredFields((prev) => ({ ...prev, email: event.target.value }))}
                    fullWidth
                  />
                </Stack>
                <TextField
                  label={labelWithTip("Business type", "Use a schema.org type (LocalBusiness, BeautySalon, Spa).")}
                  value={structuredFields.type}
                  onChange={(event) => setStructuredFields((prev) => ({ ...prev, type: event.target.value }))}
                  helperText="Example: LocalBusiness, BeautySalon, Spa, MedicalBusiness."
                />
                <TextField
                  label={labelWithTip("Price range", "Optional range like $$ or $$$.")}
                  value={structuredFields.priceRange}
                  onChange={(event) => setStructuredFields((prev) => ({ ...prev, priceRange: event.target.value }))}
                  helperText="Example: $$ or $$$."
                />
                <TextField
                  label={labelWithTip("Social links", "Comma-separated public profiles.")}
                  value={structuredFields.sameAs}
                  onChange={(event) => setStructuredFields((prev) => ({ ...prev, sameAs: event.target.value }))}
                  helperText="Comma-separated links (Instagram, Facebook, LinkedIn)."
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={structuredFields.hasAddress}
                      onChange={(_, checked) => setStructuredFields((prev) => ({ ...prev, hasAddress: checked }))}
                    />
                  }
                  label={labelWithTip("Include business address", "Adds your physical address to search results.")}
                />
                {structuredFields.hasAddress && (
                  <Stack spacing={1.5}>
                    <TextField
                      label={labelWithTip("Street address", "Street and number.")}
                      value={structuredFields.streetAddress}
                      onChange={(event) => setStructuredFields((prev) => ({ ...prev, streetAddress: event.target.value }))}
                    />
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                      <TextField
                        label={labelWithTip("City", "City or locality.")}
                        value={structuredFields.city}
                        onChange={(event) => setStructuredFields((prev) => ({ ...prev, city: event.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label={labelWithTip("State/Province", "State, province, or region.")}
                        value={structuredFields.region}
                        onChange={(event) => setStructuredFields((prev) => ({ ...prev, region: event.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                      <TextField
                        label={labelWithTip("Postal code", "ZIP or postal code.")}
                        value={structuredFields.postalCode}
                        onChange={(event) => setStructuredFields((prev) => ({ ...prev, postalCode: event.target.value }))}
                        fullWidth
                      />
                      <TextField
                        label={labelWithTip("Country", "Country name (e.g., Canada).")}
                        value={structuredFields.country}
                        onChange={(event) => setStructuredFields((prev) => ({ ...prev, country: event.target.value }))}
                        fullWidth
                      />
                    </Stack>
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary">
                  We generate the JSON-LD schema for you using these fields.
                </Typography>
              </Stack>
            )}
            {structuredDataEnabled && structuredAdvanced && (
              <TextField
                multiline
                minRows={6}
                value={structuredData}
                onChange={(e) => setStructuredData(e.target.value)}
                label={labelWithTip(
                  "Structured data (JSON-LD)",
                  "Paste a full JSON-LD snippet if you need advanced control."
                )}
                placeholder={`{
  "@context": "https://schema.org"
}`}
                error={Boolean(structuredError)}
                helperText={structuredError || "Paste valid JSON-LD if you need full control."}
              />
            )}
          </Stack>
        </Box>
      </Stack>

      <SeoHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Paper>
  );
};

export default SeoSettingsCard;
