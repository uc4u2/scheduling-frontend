
// src/pages/sections/management/components/SeoSettingsCard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
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

const MAX_TITLE = 60;
const MAX_DESCRIPTION = 155;

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

  const [metaTitle, setMetaTitle] = useState(seo.metaTitle || "");
  const [metaDescription, setMetaDescription] = useState(seo.metaDescription || "");
  const [ogImage, setOgImage] = useState(seo.ogImage || "");
  const [canonicalMode, setCanonicalMode] = useState(
    seo.canonicalMode || (domainStatus === "verified" ? "custom" : "slug")
  );
  const [structuredDataEnabled, setStructuredDataEnabled] = useState(
    Boolean(seo.structuredDataEnabled)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const nextSeo = settings?.seo || {};
    setMetaTitle(nextSeo.metaTitle || "");
    setMetaDescription(nextSeo.metaDescription || "");
    setOgImage(nextSeo.ogImage || "");
    setCanonicalMode(nextSeo.canonicalMode || (domainStatus === "verified" ? "custom" : "slug"));
    setStructuredDataEnabled(Boolean(nextSeo.structuredDataEnabled));
  }, [settings, domainStatus]);

  const canonicalUrl = useMemo(() => {
    const preferCustom = canonicalMode === "custom" && domainStatus === "verified";
    const domainOverride = preferCustom ? customDomain : null;
    return tenantBaseUrl({ customDomain: domainOverride, slug: companySlug, primaryHost });
  }, [canonicalMode, domainStatus, customDomain, companySlug, primaryHost]);

  const titleRemaining = MAX_TITLE - metaTitle.length;
  const descRemaining = MAX_DESCRIPTION - metaDescription.length;
  const canonicalLocked = domainStatus !== "verified";

  const handleCanonicalChange = (_, next) => {
    if (!next) return;
    if (next === "custom" && canonicalLocked) {
      enqueueSnackbar(t("management.domainSettings.seo.notifications.verifyDomain"), {
        variant: "info",
      });
      return;
    }
    setCanonicalMode(next);
  };

  const validate = () => {
    if (ogImage && !/^https?:\/\//i.test(ogImage)) {
      setError(t("management.domainSettings.seo.errors.invalidOgImage"));
      return false;
    }
    if (canonicalMode === "custom" && canonicalLocked) {
      setError(t("management.domainSettings.seo.errors.lockedCanonical"));
      return false;
    }
    if (customDomain && canonicalMode === "custom") {
      const normalized = normalizeDomain(customDomain);
      if (!isValidHostname(normalized)) {
        setError(t("management.domainSettings.seo.errors.invalidCustomDomain"));
        return false;
      }
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
      await onSave?.({
        metaTitle,
        metaDescription,
        ogImage,
        canonicalMode: canonicalMode === "custom" && !canonicalLocked ? "custom" : "slug",
        structuredDataEnabled,
        canonicalUrl,
      });
      enqueueSnackbar(t("management.domainSettings.seo.notifications.saveSuccess"), {
        variant: "success",
      });
    } catch (err) {
      enqueueSnackbar(
        err?.displayMessage || err?.message || t("management.domainSettings.seo.notifications.saveFailed"),
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
          {t("management.domainSettings.seo.title")}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<SaveIcon />}
          onClick={handleSubmit}
          disabled={saving || !companyId}
        >
          {t("management.domainSettings.seo.buttons.save")}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label={t("management.domainSettings.seo.fields.metaTitle")}
          value={metaTitle}
          onChange={(event) => setMetaTitle(event.target.value.slice(0, 120))}
          helperText={t("management.domainSettings.seo.helpers.title", {
            max: MAX_TITLE,
            remaining: Math.max(titleRemaining, 0),
          })}
          inputProps={{ maxLength: 120 }}
        />
        <TextField
          label={t("management.domainSettings.seo.fields.metaDescription")}
          value={metaDescription}
          onChange={(event) => setMetaDescription(event.target.value.slice(0, 320))}
          helperText={t("management.domainSettings.seo.helpers.description", {
            max: MAX_DESCRIPTION,
            remaining: Math.max(descRemaining, 0),
          })}
          inputProps={{ maxLength: 320 }}
          multiline
          minRows={3}
        />
        <TextField
          label={t("management.domainSettings.seo.fields.ogImage")}
          value={ogImage}
          onChange={(event) => setOgImage(event.target.value)}
          placeholder={t("management.domainSettings.seo.placeholders.ogImage")}
        />

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t("management.domainSettings.seo.fields.canonicalHost")}
          </Typography>
          <ToggleButtonGroup
            value={canonicalLocked ? "slug" : canonicalMode}
            exclusive
            size="small"
            onChange={handleCanonicalChange}
          >
            <ToggleButton value="slug">
              {t("management.domainSettings.seo.canonical.slug")}
            </ToggleButton>
            <ToggleButton value="custom" disabled={canonicalLocked}>
              {t("management.domainSettings.seo.canonical.custom")}
            </ToggleButton>
          </ToggleButtonGroup>
          {canonicalLocked && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {t("management.domainSettings.seo.canonical.lockedMessage")}
            </Typography>
          )}
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={structuredDataEnabled}
              onChange={(_, checked) => setStructuredDataEnabled(checked)}
            />
          }
          label={t("management.domainSettings.seo.fields.structuredData")}
        />

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {t("management.domainSettings.seo.fields.previewTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {canonicalMode === "custom" && !canonicalLocked
              ? t("management.domainSettings.seo.preview.custom")
              : t("management.domainSettings.seo.preview.slug")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
            <TextField size="small" fullWidth InputProps={{ readOnly: true }} value={canonicalUrl} />
            <Button
              variant="outlined"
              endIcon={<LaunchIcon />}
              href={canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              disabled={!canonicalUrl}
            >
              {t("management.domainSettings.seo.buttons.open")}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

export default SeoSettingsCard;
