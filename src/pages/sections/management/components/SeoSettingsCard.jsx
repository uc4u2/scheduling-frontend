
// src/pages/sections/management/components/SeoSettingsCard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import SaveIcon from "@mui/icons-material/Save";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";

import { tenantBaseUrl, normalizeDomain, isValidHostname } from "../../../../utils/tenant";
import { SearchSnippetPreview, SocialCardPreview } from "../../../../components/seo/SeoPreview";

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

const ensureUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
};

const SeoSettingsCard = ({
  companyId,
  companySlug,
  domainStatus,
  customDomain,
  primaryHost,
  settings,
  onSave,
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const seo = settings?.seo || {};
  const tt = (key, defaultValue, options = {}) => t(key, { defaultValue, ...options });

  const [metaTitle, setMetaTitle] = useState(seo.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(seo.metaDescription || "");
  const [metaKeywords, setMetaKeywords] = useState(seo.metaKeywords || "");
  const [ogTitle, setOgTitle] = useState(seo.ogTitle || "");
  const [ogDescription, setOgDescription] = useState(seo.ogDescription || "");
  const [ogImage, setOgImage] = useState(seo.ogImage || "");
  const [canonicalMode, setCanonicalMode] = useState(
    seo.canonicalMode || (domainStatus === "verified" ? "custom" : "slug")
  );
  const [canonicalHost, setCanonicalHost] = useState(seo.canonicalHost || customDomain || "");
  const [structuredDataEnabled, setStructuredDataEnabled] = useState(
    Boolean(seo.structuredDataEnabled)
  );
  const [structuredData, setStructuredData] = useState(formatStructuredInput(seo.structuredData));
  const [structuredError, setStructuredError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const nextSeo = settings?.seo || {};
    setMetaTitle(nextSeo.metaTitle || "");
    setMetaDescription(nextSeo.metaDescription || "");
    setMetaKeywords(nextSeo.metaKeywords || "");
    setOgTitle(nextSeo.ogTitle || "");
    setOgDescription(nextSeo.ogDescription || "");
    setOgImage(nextSeo.ogImage || "");
    setCanonicalMode(nextSeo.canonicalMode || (domainStatus === "verified" ? "custom" : "slug"));
    setCanonicalHost(nextSeo.canonicalHost || customDomain || "");
    setStructuredDataEnabled(Boolean(nextSeo.structuredDataEnabled));
    setStructuredData(formatStructuredInput(nextSeo.structuredData));
  }, [settings, domainStatus, customDomain]);

  const slugBaseUrl = useMemo(() => {
    return seo.slugBaseUrl || tenantBaseUrl({ slug: companySlug, primaryHost });
  }, [seo.slugBaseUrl, companySlug, primaryHost]);

  const canonicalHostUrl = useMemo(() => {
    if (canonicalMode !== "custom" || domainStatus !== "verified") {
      return slugBaseUrl;
    }
    return ensureUrl(canonicalHost || customDomain || "");
  }, [canonicalMode, domainStatus, canonicalHost, customDomain, slugBaseUrl]);

  const titleRemaining = MAX_TITLE - metaTitle.length;
  const descRemaining = MAX_DESCRIPTION - metaDescription.length;
  const canonicalLocked = domainStatus !== "verified";

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

  const validate = () => {
    if (ogImage && !/^https?:\/\//i.test(ogImage)) {
      setError(tt("management.domainSettings.seo.errors.invalidOgImage", "Open Graph image must be a valid https:// URL."));
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
    if (structuredDataEnabled && structuredData.trim()) {
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
      const structuredPayload = structuredDataEnabled && structuredData.trim()
        ? JSON.parse(structuredData)
        : null;
      await onSave?.({
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
      });
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
  return (
    <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {tt("management.domainSettings.seo.title", "SEO & Metadata")}
        </Typography>
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

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {tt("management.domainSettings.seo.sections.search", "Search result listing")}
          </Typography>
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
              label={tt("management.domainSettings.seo.fields.metaTitle", "Meta Title")}
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
              label={tt("management.domainSettings.seo.fields.metaDescription", "Meta Description")}
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
              label={tt("management.domainSettings.seo.fields.metaKeywords", "Meta Keywords")}
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
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {tt("management.domainSettings.seo.sections.social", "Social sharing")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tt("management.domainSettings.seo.sections.socialHint", "Customize the preview cards shown in chat, SMS, and social media.")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Use a 1200×630 hero image and a title like “Schedulaa — Enterprise Tattoo Studio”.
          </Typography>
          <SocialCardPreview
            title={ogTitle || metaTitle}
            description={ogDescription || metaDescription}
            image={ogImage}
          />
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label={tt("management.domainSettings.seo.fields.ogTitle", "Open Graph Title")}
              value={ogTitle}
              onChange={(event) => setOgTitle(event.target.value)}
            />
            <TextField
              label={tt("management.domainSettings.seo.fields.ogDescription", "Open Graph Description")}
              value={ogDescription}
              onChange={(event) => setOgDescription(event.target.value)}
            />
            <TextField
              label={tt("management.domainSettings.seo.fields.ogImage", "Open Graph Image URL")}
              value={ogImage}
              onChange={(event) => setOgImage(event.target.value)}
              placeholder={tt("management.domainSettings.seo.placeholders.ogImage", "https://example.com/social-preview.jpg")}
            />
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {tt("management.domainSettings.seo.sections.advanced", "Advanced settings")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tt("management.domainSettings.seo.sections.advancedHint", "Control canonical hosts and structured data for better indexing.")}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Point crawlers at your custom domain and optionally embed JSON-LD Organization data.
          </Typography>
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {tt("management.domainSettings.seo.fields.canonicalHost", "Canonical host")}
              </Typography>
              <ToggleButtonGroup
                value={canonicalLocked ? "slug" : canonicalMode}
                exclusive
                size="small"
                onChange={handleCanonicalChange}
                sx={{ mt: 1 }}
              >
                <ToggleButton value="slug">
                  {tt("management.domainSettings.seo.canonical.slug", "schedulaa.com slug")}
                </ToggleButton>
                <ToggleButton value="custom" disabled={canonicalLocked}>
                  {tt("management.domainSettings.seo.canonical.custom", "Custom domain")}
                </ToggleButton>
              </ToggleButtonGroup>
              {canonicalMode === "custom" && !canonicalLocked && (
                <TextField
                  sx={{ mt: 2 }}
                  label={tt("management.domainSettings.seo.fields.customHost", "Custom canonical host")}
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
                label={tt("management.domainSettings.seo.fields.previewTitle", "Preview URL")}
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

            <FormControlLabel
              control={
                <Checkbox
                  checked={structuredDataEnabled}
                  onChange={(_, checked) => setStructuredDataEnabled(checked)}
                />
              }
              label={tt("management.domainSettings.seo.fields.structuredData", "Include structured data (schema.org)")}
            />
            {structuredDataEnabled && (
              <TextField
                multiline
                minRows={4}
                value={structuredData}
                onChange={(e) => setStructuredData(e.target.value)}
                placeholder={`{
  "@context": "https://schema.org"
}`}
                error={Boolean(structuredError)}
                helperText={structuredError || tt("management.domainSettings.seo.helpers.structuredData", "Paste valid JSON-LD to include business schema")}
              />
            )}
            {structuredDataEnabled && (
              <Typography variant="caption" color="text.secondary">
                Example: Organization schema with your studio name, logo URL, customer service phone, and social links.
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default SeoSettingsCard;
