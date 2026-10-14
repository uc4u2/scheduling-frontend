import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import SearchIcon from "@mui/icons-material/Search";
import SaveIcon from "@mui/icons-material/Save";
import { useTranslation } from "react-i18next";

import {
  deriveGoogleVerificationState,
  formatGoogleDnsRecord,
  getRootDomain,
  normalizeGoogleDnsVerification,
  normalizeGoogleSiteVerification,
  resolveSearchConsolePropertyUrl,
} from "./googleSearchConsole";

const SEARCH_CONSOLE_URL = "https://search.google.com/search-console/welcome";

const copyText = async (value) => {
  if (!value) return;
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
};

const statusCopy = {
  notConfigured: {
    label: "Not configured",
    color: "default",
    detail: "No Google HTML verification token is saved or published in Schedulaa.",
  },
  savedDraft: {
    label: "Saved as draft — publish required",
    color: "warning",
    detail: "The token is saved in Schedulaa, but it is not in the published website metadata yet.",
  },
  published: {
    label: "Verification tag published",
    color: "success",
    detail: "Schedulaa's published website metadata contains this tag. Return to Google Search Console to verify ownership.",
  },
  replacementPending: {
    label: "Replacement saved as draft",
    color: "warning",
    detail: "A different verification tag is still published. Publish the draft to replace it.",
  },
  removalPending: {
    label: "Removal saved as draft",
    color: "warning",
    detail: "The previous verification tag may remain public until this draft is published.",
  },
};

export default function GoogleSearchConsoleCard({
  settings,
  publicUrlContract,
  canPublish,
  onSave,
  onRefresh,
  onPublish,
  onReviewChanges,
}) {
  const { t } = useTranslation();
  const draftSeo = settings?.settings?.seo || settings?.seo || {};
  const publishedSeo = settings?.published_settings?.seo || {};
  const draftToken = draftSeo.googleSiteVerification || "";
  const publishedToken = publishedSeo.googleSiteVerification || "";
  const draftDnsToken = draftSeo.googleDnsVerification || "";
  const propertyUrl = useMemo(
    () => resolveSearchConsolePropertyUrl(publicUrlContract),
    [publicUrlContract]
  );
  const dnsDomain = useMemo(
    () => getRootDomain(
      publicUrlContract?.custom_domain_candidate_url
      || publicUrlContract?.custom_domain_url
      || ""
    ),
    [publicUrlContract]
  );
  const publicMetadataAvailable = Boolean(
    propertyUrl
    && settings?.is_live !== false
    && publicUrlContract?.publicly_available !== false
  );
  const verificationState = useMemo(
    () => deriveGoogleVerificationState({
      draftToken,
      publishedToken,
      isLive: publicMetadataAvailable,
    }),
    [draftToken, publishedToken, publicMetadataAvailable]
  );
  const copy = statusCopy[verificationState.key];

  const [siteInput, setSiteInput] = useState(draftToken);
  const [dnsInput, setDnsInput] = useState(draftDnsToken);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [savedDialogOpen, setSavedDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishSnapshot, setPublishSnapshot] = useState(null);

  useEffect(() => {
    setSiteInput(draftToken);
    setDnsInput(draftDnsToken);
  }, [draftToken, draftDnsToken]);

  const handleCopy = async (value, key) => {
    try {
      await copyText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Could not copy automatically. Select the value and copy it manually.");
    }
  };

  const handleSave = async () => {
    if (saving || publishing) return;
    setError("");
    let normalizedSite;
    let normalizedDns;
    try {
      normalizedSite = normalizeGoogleSiteVerification(siteInput);
      normalizedDns = normalizeGoogleDnsVerification(dnsInput);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setSaving(true);
    try {
      await onSave?.({
        googleSiteVerification: normalizedSite || null,
        googleDnsVerification: normalizedDns || null,
      });
      setSiteInput(normalizedSite);
      setDnsInput(normalizedDns);
      setSavedDialogOpen(true);
    } catch (saveError) {
      setError(
        saveError?.displayMessage
        || saveError?.response?.data?.message
        || saveError?.message
        || "The verification settings could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const preparePublish = async () => {
    if (publishing) return;
    setPublishing(true);
    setError("");
    try {
      const fresh = await onRefresh?.();
      const freshDraftSeo = fresh?.settings?.seo || fresh?.seo || {};
      const freshSiteToken = String(freshDraftSeo.googleSiteVerification || "").trim();
      const freshDnsToken = String(freshDraftSeo.googleDnsVerification || "").trim();
      if (fresh && (freshSiteToken !== siteInput.trim() || freshDnsToken !== dnsInput.trim())) {
        throw new Error(
          "The verification draft changed after you saved it. Review the latest server values before publishing."
        );
      }
      setPublishSnapshot(fresh || settings);
      setSavedDialogOpen(false);
      setPublishDialogOpen(true);
    } catch (refreshError) {
      setError(
        refreshError?.displayMessage
        || refreshError?.message
        || "The draft was saved, but Schedulaa could not refresh the publication status."
      );
      setSavedDialogOpen(false);
    } finally {
      setPublishing(false);
    }
  };

  const confirmPublish = async () => {
    if (publishing) return;
    setPublishing(true);
    setError("");
    try {
      await onPublish?.({
        expectedDraftUpdatedAt: publishSnapshot?.branding_draft_updated_at || null,
      });
      setPublishDialogOpen(false);
      setPublishSnapshot(null);
    } catch (publishError) {
      setError(
        publishError?.displayMessage
        || publishError?.response?.data?.message
        || publishError?.message
        || "Publishing failed. Your verification token remains safely saved as a draft."
      );
      setPublishDialogOpen(false);
    } finally {
      setPublishing(false);
    }
  };

  const dnsRecord = (() => {
    try {
      return formatGoogleDnsRecord(dnsInput);
    } catch {
      return "";
    }
  })();

  return (
    <Box
      component="section"
      aria-labelledby="google-search-console-title"
      sx={{
        border: "1px solid",
        borderColor: "primary.light",
        borderLeftWidth: 4,
        borderRadius: 2,
        bgcolor: (theme) => theme.palette.mode === "dark" ? "rgba(66, 133, 244, 0.08)" : "rgba(66, 133, 244, 0.035)",
        p: { xs: 1.75, sm: 2.25 },
      }}
    >
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <SearchIcon sx={{ color: "#4285F4", fontSize: 22 }} aria-hidden="true" />
            <Box>
              <Typography id="google-search-console-title" variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("management.domainSettings.seo.google.title", { defaultValue: "Google Search Console" })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("management.domainSettings.seo.google.subtitle", {
                  defaultValue: "Verify that you control this published website, then submit its sitemap to Google.",
                })}
              </Typography>
            </Box>
          </Stack>
          <Chip label={copy.label} color={copy.color} variant="outlined" size="small" />
        </Stack>

        <Alert severity={verificationState.key === "published" ? "success" : "info"} icon={false}>
          {copy.detail}
          {verificationState.siteUnpublished
            ? " The website itself is not live, so publishing may make the full site visible."
            : ""}
        </Alert>

        {!propertyUrl ? (
          <Alert severity="warning">
            Schedulaa could not resolve an authoritative published website URL. Verify the website domain or slug before creating a Search Console property.
          </Alert>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "flex-start" }}>
            <TextField
              label={t("management.domainSettings.seo.google.propertyLabel", {
                defaultValue: "Exact URL-prefix property",
              })}
              value={propertyUrl}
              InputProps={{ readOnly: true }}
              helperText="Use this exact URL when Google asks for a URL-prefix property."
              fullWidth
              size="small"
            />
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(propertyUrl, "property")}
              disabled={!propertyUrl}
              aria-label="Copy exact URL-prefix property"
              sx={{ minWidth: 112 }}
            >
              {copied === "property" ? "Copied" : "Copy"}
            </Button>
          </Stack>
        )}

        <TextField
          label={t("management.domainSettings.seo.google.tokenLabel", {
            defaultValue: "HTML verification tag or token",
          })}
          value={siteInput}
          onChange={(event) => setSiteInput(event.target.value)}
          placeholder='<meta name="google-site-verification" content="…">'
          helperText="Paste Google's complete HTML tag or only its token. Schedulaa stores only the normalized token. Clear this field and save to remove it through the normal publish flow."
          error={Boolean(error)}
          fullWidth
          multiline
          minRows={2}
          inputProps={{ "aria-describedby": "google-verification-error" }}
        />

        {error && (
          <Alert id="google-verification-error" severity="error" role="alert" aria-live="assertive">
            {error}
          </Alert>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving || publishing}
          >
            {saving ? "Saving…" : t("management.domainSettings.seo.google.save", {
              defaultValue: "Save verification settings",
            })}
          </Button>
          <Button
            variant="outlined"
            endIcon={<LaunchIcon />}
            href={SEARCH_CONSOLE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("management.domainSettings.seo.google.open", {
              defaultValue: "Open Google Search Console",
            })}
          </Button>
        </Stack>

        <Divider />

        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          URL-prefix verification steps
        </Typography>
        <Box component="ol" sx={{ my: 0, pl: 3, color: "text.secondary" }}>
          <li><Typography variant="body2">In Search Console, choose <strong>URL prefix</strong> and paste the exact URL above.</Typography></li>
          <li><Typography variant="body2">Choose <strong>HTML tag</strong>, then paste the tag here.</Typography></li>
          <li><Typography variant="body2">Save and publish in Schedulaa. Publishing can include other pending website changes.</Typography></li>
          <li><Typography variant="body2">Return to Google and click <strong>Verify</strong>.</Typography></li>
          <li><Typography variant="body2">Submit <strong>sitemap.xml</strong> and inspect important published URLs.</Typography></li>
        </Box>

        <Accordion variant="outlined" disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="google-dns-content" id="google-dns-header">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {t("management.domainSettings.seo.google.advancedDns", {
                defaultValue: "Advanced: Verify your entire domain with DNS",
              })}
            </Typography>
          </AccordionSummary>
          <AccordionDetails id="google-dns-content">
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Domain properties require DNS verification. Google issues a TXT value, and you must add it at the authoritative DNS provider for {dnsDomain || "a custom domain you control"}. Schedulaa does not automatically change Cloudflare or registrar DNS.
              </Typography>
              {!dnsDomain && (
                <Alert severity="info">
                  Connect a custom domain you control before using Domain-property verification. Do not try to change DNS for a Schedulaa platform URL.
                </Alert>
              )}
              <TextField
                label="DNS TXT token (reference only)"
                value={dnsInput}
                onChange={(event) => setDnsInput(event.target.value)}
                placeholder="google-site-verification=…"
                helperText="Saving this reference does not add a DNS record or verify the domain."
                fullWidth
                size="small"
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="TXT record value"
                  value={dnsRecord || "Paste Google's TXT value above"}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  size="small"
                />
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => handleCopy(dnsRecord, "dns")}
                  disabled={!dnsRecord}
                  aria-label="Copy Google DNS TXT record value"
                >
                  {copied === "dns" ? "Copied" : "Copy"}
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Google and your DNS provider determine the Host/Name field. @ is common for an apex/root record; always follow their exact instructions.
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <Dialog open={savedDialogOpen} onClose={() => !publishing && setSavedDialogOpen(false)} aria-labelledby="google-draft-saved-title">
        <DialogTitle id="google-draft-saved-title">Google verification settings saved as draft.</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25}>
            <Typography variant="body2" color="text.secondary">
              The public website has not changed yet. You can publish now or keep the token as a draft.
            </Typography>
            {!canPublish && (
              <Alert severity="warning">
                Publishing is unavailable until the Website Manager has a compatible configured theme and you have permission to publish.
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSavedDialogOpen(false)} disabled={publishing}>Keep as draft</Button>
          <Button variant="contained" onClick={preparePublish} disabled={publishing || !canPublish}>
            {publishing ? "Checking…" : "Publish now"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={publishDialogOpen} onClose={() => !publishing && setPublishDialogOpen(false)} aria-labelledby="google-publish-warning-title">
        <DialogTitle id="google-publish-warning-title">Publish pending website settings?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Alert severity="warning">
              Publishing now will publish your pending website settings, not only the Google verification tag. Other saved website changes may become visible to visitors.
            </Alert>
            {publishSnapshot?.is_live === false && (
              <Alert severity="warning">
                This website is currently unpublished. Confirming will make the website and its pending settings publicly visible.
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              Schedulaa does not have a reliable field-by-field publication summary yet, so review the Website Manager before confirming if other people edit this site.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexWrap: "wrap" }}>
          <Button onClick={() => { setPublishDialogOpen(false); onReviewChanges?.(); }} disabled={publishing}>
            Review changes
          </Button>
          <Button onClick={() => setPublishDialogOpen(false)} disabled={publishing}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={confirmPublish} disabled={publishing || !canPublish}>
            {publishing ? "Publishing…" : (publishSnapshot?.is_live === false ? "Publish website and settings" : "Confirm publish")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
