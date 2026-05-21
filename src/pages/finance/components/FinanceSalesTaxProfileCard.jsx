import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTranslation } from "react-i18next";
import { getFinanceSalesTaxProfile, updateFinanceSalesTaxProfile } from "../financeApi";

const emptyComponent = () => ({ code: "", rate: "" });

const normalizeComponents = (components = []) =>
  (Array.isArray(components) ? components : []).map((row) => ({
    code: String(row?.code || "").trim().toUpperCase(),
    rate: row?.rate ?? "",
  }));

const formatRate = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(3).replace(/\.?0+$/, "") : "";
};

export default function FinanceSalesTaxProfileCard({ onUpdatedTaxContext }) {
  const { t } = useTranslation();
  const tProfile = useCallback(
    (key, fallback, options = {}) =>
      t(`manager.finance.salesTaxProfile.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [profileState, setProfileState] = useState(null);
  const [form, setForm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await getFinanceSalesTaxProfile();
      setProfileState(payload || null);
      onUpdatedTaxContext?.(payload?.tax_context || null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          tProfile("errors.loadFailed", "Unable to load Business Finance sales tax profile.")
      );
    } finally {
      setLoading(false);
    }
  }, [onUpdatedTaxContext, tProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const companySource = useMemo(() => profileState?.company_source || {}, [profileState]);
  const taxContext = useMemo(() => profileState?.tax_context || {}, [profileState]);
  const existingProfile = profileState?.profile || null;
  const suggested = profileState?.catalog_suggestion || null;
  const warning = profileState?.warning || taxContext?.warning || "";
  const sourceLabel = useMemo(() => {
    switch (taxContext?.default_tax_rate_source) {
      case "company_sales_tax_profile":
        return tProfile("source.companyProfile", "Confirmed company profile");
      case "sales_tax_jurisdiction_catalog":
        return tProfile("source.catalog", "Catalog suggestion");
      default:
        return tProfile("source.manualRequired", "Manual confirmation required");
    }
  }, [tProfile, taxContext?.default_tax_rate_source]);

  const openEditor = useCallback(() => {
    const baseRate =
      existingProfile?.default_tax_rate ??
      suggested?.default_tax_rate ??
      taxContext?.default_tax_rate ??
      "";
    const baseLabel =
      existingProfile?.tax_label || suggested?.tax_label || taxContext?.tax_label || "";
    const baseComponents =
      existingProfile?.tax_components ||
      suggested?.tax_components ||
      taxContext?.tax_components ||
      [];
    setForm({
      country_code: companySource?.tax_country_code || "",
      region_code: companySource?.tax_region_code || "",
      prices_include_tax: Boolean(companySource?.prices_include_tax),
      default_tax_rate: baseRate === null || baseRate === undefined ? "" : String(baseRate),
      tax_label: baseLabel,
      tax_components: normalizeComponents(baseComponents).length
        ? normalizeComponents(baseComponents)
        : [emptyComponent()],
      confirmed_by_manager: Boolean(existingProfile?.confirmed_by_manager || suggested),
      warning_acknowledged: Boolean(
        existingProfile?.warning_acknowledged ||
          (companySource?.tax_country_code === "US" ? false : !warning)
      ),
      source_jurisdiction_id: suggested?.id || existingProfile?.source_jurisdiction_id || null,
      source_note:
        existingProfile?.source_note ||
        (suggested ? tProfile("sourceNote.catalog", "Confirmed from catalog suggestion") : ""),
    });
    setError("");
    setOpen(true);
  }, [companySource, existingProfile, suggested, taxContext, warning, tProfile]);

  const handleConfirmSuggestion = useCallback(async () => {
    if (!suggested) return;
    setSaving(true);
    setError("");
    try {
      const payload = await updateFinanceSalesTaxProfile({
        country_code: companySource?.tax_country_code,
        region_code: companySource?.tax_region_code,
        default_tax_rate: suggested.default_tax_rate,
        tax_label: suggested.tax_label,
        tax_components: suggested.tax_components || [],
        prices_include_tax: Boolean(companySource?.prices_include_tax),
        confirmed_by_manager: true,
        warning_acknowledged: companySource?.tax_country_code === "US" ? true : false,
        source_jurisdiction_id: suggested.id,
        source_note: tProfile("sourceNote.catalog", "Confirmed from catalog suggestion"),
      });
      setProfileState(payload || null);
      onUpdatedTaxContext?.(payload?.tax_context || null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          tProfile("errors.saveFailed", "Unable to save Business Finance sales tax profile.")
      );
    } finally {
      setSaving(false);
    }
  }, [companySource, onUpdatedTaxContext, suggested, tProfile]);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const setComponentField = (index, field, value) =>
    setForm((current) => ({
      ...current,
      tax_components: current.tax_components.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  const addComponent = () =>
    setForm((current) => ({
      ...current,
      tax_components: [...current.tax_components, emptyComponent()],
    }));
  const removeComponent = (index) =>
    setForm((current) => ({
      ...current,
      tax_components:
        current.tax_components.length > 1
          ? current.tax_components.filter((_, rowIndex) => rowIndex !== index)
          : current.tax_components,
    }));

  const handleSave = useCallback(async () => {
    if (!form) return;
    if (!String(form.tax_label || "").trim()) {
      setError(tProfile("errors.taxLabelRequired", "Tax label is required."));
      return;
    }
    if (form.default_tax_rate === "" || Number.isNaN(Number(form.default_tax_rate))) {
      setError(tProfile("errors.taxRateRequired", "Default tax rate is required."));
      return;
    }
    const taxComponents = (form.tax_components || [])
      .map((row) => ({
        code: String(row.code || "").trim().toUpperCase(),
        rate: row.rate === "" ? "" : Number(row.rate),
      }))
      .filter((row) => row.code);
    if (form.country_code === "US" && form.confirmed_by_manager && !form.warning_acknowledged) {
      setError(
        tProfile(
          "errors.warningAckRequired",
          "Acknowledge the US tax warning before confirming the Business Finance default."
        )
      );
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = await updateFinanceSalesTaxProfile({
        country_code: form.country_code,
        region_code: form.region_code,
        default_tax_rate: Number(form.default_tax_rate),
        tax_label: String(form.tax_label || "").trim(),
        tax_components: taxComponents,
        prices_include_tax: Boolean(form.prices_include_tax),
        confirmed_by_manager: Boolean(form.confirmed_by_manager),
        warning_acknowledged: Boolean(form.warning_acknowledged),
        source_jurisdiction_id: form.source_jurisdiction_id || null,
        source_note: String(form.source_note || "").trim(),
      });
      setProfileState(payload || null);
      onUpdatedTaxContext?.(payload?.tax_context || null);
      setOpen(false);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          tProfile("errors.saveFailed", "Unable to save Business Finance sales tax profile.")
      );
    } finally {
      setSaving(false);
    }
  }, [form, onUpdatedTaxContext, tProfile]);

  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Stack alignItems="center" sx={{ py: 2 }}>
          <CircularProgress size={28} />
        </Stack>
      </Paper>
    );
  }

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5 }}>
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
            <Box>
              <Typography variant="h6" fontWeight={900}>
                {tProfile("title", "Business Finance sales tax")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tProfile(
                  "subtitle",
                  "Used for estimates, invoices, purchases, expenses, and finance payment links. Booking checkout settings are not changed here."
                )}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              {profileState?.can_confirm_catalog_suggestion ? (
                <Button variant="outlined" onClick={handleConfirmSuggestion} disabled={saving}>
                  {tProfile("actions.confirmSuggestion", "Confirm suggested default")}
                </Button>
              ) : null}
              {warning && !taxContext?.warning_acknowledged ? (
                <Button variant="text" onClick={openEditor} disabled={saving}>
                  {tProfile("actions.acknowledgeWarning", "Acknowledge warning")}
                </Button>
              ) : null}
              <Button variant="contained" onClick={openEditor} disabled={saving}>
                {profileState?.has_company_override
                  ? tProfile("actions.editOverride", "Edit / override tax profile")
                  : tProfile("actions.editOverride", "Edit / override tax profile")}
              </Button>
            </Stack>
          </Stack>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {warning ? <Alert severity="warning">{warning}</Alert> : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {tProfile("sections.companySource", "Current company tax source")}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" variant="outlined" label={tProfile("fields.countryRegion", "Tax {{country}} / {{region}}", { country: companySource?.tax_country_code || "—", region: companySource?.tax_region_code || "—" })} />
                    <Chip size="small" variant="outlined" label={tProfile("fields.currency", "Currency {{currency}}", { currency: companySource?.display_currency || "USD" })} />
                    <Chip size="small" variant="outlined" label={tProfile("fields.pricesIncludeTax", "Prices include tax {{status}}", { status: companySource?.prices_include_tax ? "ON" : "OFF" })} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {tProfile(
                      "companySourceHelper",
                      "These source fields stay read-only here. They come from your existing company tax/localization setup."
                    )}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, height: "100%" }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={800}>
                    {tProfile("sections.resolvedResult", "Resolved Business Finance tax result")}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip size="small" variant="outlined" label={tProfile("fields.taxLabel", "Label {{label}}", { label: taxContext?.tax_label || "—" })} />
                    <Chip size="small" variant="outlined" label={tProfile("fields.defaultRate", "Default tax {{rate}}%", { rate: taxContext?.default_tax_rate != null ? Number(taxContext.default_tax_rate).toFixed(3).replace(/\.?0+$/, "") : "—" })} />
                    <Chip size="small" variant="outlined" label={tProfile("fields.source", "Source {{source}}", { source: sourceLabel })} />
                  </Stack>
                  {taxContext?.tax_components?.length ? (
                    <Typography variant="body2" color="text.secondary">
                      {tProfile("fields.components", "Components")}:{" "}
                      {taxContext.tax_components
                        .map((row) => `${row.code} ${formatRate(row.rate)}%`)
                        .join(" + ")}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    {tProfile(
                      "resolvedHelper",
                      "Business Finance calculates estimate and invoice totals in Schedulaa. Stripe only collects the final invoice total for finance payment links."
                    )}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      <Dialog open={open} onClose={saving ? undefined : () => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{tProfile("dialog.title", "Business Finance sales tax profile")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {warning ? <Alert severity="warning">{warning}</Alert> : null}
            <Typography variant="body2" color="text.secondary">
              {tProfile(
                "dialog.intro",
                "This affects new Business Finance estimates, invoices, purchases, expenses, and finance payment links. It does not change booking checkout settings, and old invoices do not change."
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField fullWidth disabled label={tProfile("dialog.country", "Tax country")} value={form?.country_code || ""} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField fullWidth disabled label={tProfile("dialog.region", "Tax region")} value={form?.region_code || ""} />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  disabled
                  label={tProfile("dialog.pricesIncludeTax", "Prices include tax")}
                  value={form?.prices_include_tax ? tProfile("common.on", "ON") : tProfile("common.off", "OFF")}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={tProfile("dialog.taxLabel", "Tax label")}
                  value={form?.tax_label || ""}
                  onChange={(e) => setField("tax_label", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={tProfile("dialog.defaultTaxRate", "Default tax rate")}
                  type="number"
                  inputProps={{ step: "0.001" }}
                  value={form?.default_tax_rate ?? ""}
                  onChange={(e) => setField("default_tax_rate", e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider />

            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={800}>
                  {tProfile("dialog.componentsTitle", "Tax components")}
                </Typography>
                <Button startIcon={<AddIcon />} onClick={addComponent}>
                  {tProfile("dialog.addComponent", "Add component")}
                </Button>
              </Stack>
              {(form?.tax_components || []).map((row, index) => (
                <Grid container spacing={1.5} key={`${row.code}-${index}`} alignItems="center">
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label={tProfile("dialog.componentCode", "Code")}
                      value={row.code}
                      onChange={(e) => setComponentField(index, "code", e.target.value.toUpperCase())}
                    />
                  </Grid>
                  <Grid item xs={10} md={5}>
                    <TextField
                      fullWidth
                      label={tProfile("dialog.componentRate", "Rate")}
                      type="number"
                      inputProps={{ step: "0.001" }}
                      value={row.rate}
                      onChange={(e) => setComponentField(index, "rate", e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={2} md={2}>
                    <IconButton onClick={() => removeComponent(index)} disabled={(form?.tax_components || []).length === 1}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
            </Stack>

            <TextField
              fullWidth
              label={tProfile("dialog.sourceNote", "Source note")}
              value={form?.source_note || ""}
              onChange={(e) => setField("source_note", e.target.value)}
              helperText={tProfile(
                "dialog.sourceNoteHelp",
                "Use this to explain whether the profile was confirmed from the catalog or manually overridden."
              )}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form?.confirmed_by_manager)}
                  onChange={(e) => setField("confirmed_by_manager", e.target.checked)}
                />
              }
              label={tProfile("dialog.confirmedByManager", "Confirmed by manager")}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form?.warning_acknowledged)}
                  onChange={(e) => setField("warning_acknowledged", e.target.checked)}
                />
              }
              label={tProfile("dialog.warningAcknowledged", "Warning acknowledged")}
            />
            {form?.country_code === "US" ? (
              <Typography variant="body2" color="warning.main">
                {tProfile(
                  "dialog.usWarning",
                  "US sales tax may vary by city, county, product/service, and customer location. Confirm the effective default rate your business uses most often."
                )}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={saving}>
            {tProfile("common.cancel", "Cancel")}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? tProfile("common.saving", "Saving...") : tProfile("common.save", "Save profile")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
