import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Add, DeleteOutline } from "@mui/icons-material";

import api from "../../utils/api";
import { formatCurrency } from "../../utils/formatters";

const MAX_OPTIONS = 2;
const MAX_VALUES_PER_OPTION = 20;

const emptyConfig = {
  configuration_version: null,
  variant_mode: "none",
  runtime_selling_enabled: false,
  options: [],
  variants: [],
  readiness: {
    complete: false,
    sellable: false,
    expected_combinations: 0,
    configured_variants: 0,
      blockers: [],
  },
  activation_readiness: {
    ready_for_activation: false,
    blockers: [],
    warnings: [],
  },
  variant_summary: {
    option_count: 0,
    variant_count: 0,
    active_variant_count: 0,
    configuration_complete: false,
    selling_enabled: false,
  },
};

const createClientKey = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
const isColourOption = (name) => ["colour", "color"].includes(String(name || "").trim().toLowerCase());
const normalizeSkuPart = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

const optionToken = (option) => (option?.id ? `id:${option.id}` : `client:${option.client_key}`);
const valueToken = (option, value) =>
  value?.id ? `id:${value.id}` : `client:${optionToken(option)}:${value.client_key}`;

const selectionSignature = (selection) =>
  selection
    .map((item) => `${item.option_token}:${item.value_token}`)
    .join("|");

const defaultVariantSku = (parentSku, labels) => {
  const suffix = labels.map(normalizeSkuPart).filter(Boolean).join("-");
  return [normalizeSkuPart(parentSku || "PRODUCT"), suffix].filter(Boolean).join("-").slice(0, 120);
};

const buildCombinationDrafts = ({ options, existingVariants, product }) => {
  if (!options.length || options.some((option) => !(option.values || []).length)) {
    return [];
  }
  const existingBySignature = new Map(
    (existingVariants || []).map((variant) => [
      selectionSignature(
        (variant.selection || []).map((selection) => ({
          option_token: selection.option_id ? `id:${selection.option_id}` : `client:${selection.option_client_key}`,
          value_token: selection.value_id
            ? `id:${selection.value_id}`
            : `client:${selection.option_id ? `id:${selection.option_id}` : `client:${selection.option_client_key}`}:${selection.value_client_key}`,
        }))
      ),
      variant,
    ])
  );

  const combine = (index, partial) => {
    if (index >= options.length) {
      return [partial];
    }
    const option = options[index];
    return (option.values || []).flatMap((value) =>
      combine(index + 1, [
        ...partial,
        {
          option_id: option.id || null,
          option_client_key: option.client_key,
          option_name: option.name,
          value_id: value.id || null,
          value_client_key: value.client_key,
          value: value.value,
          option_token: optionToken(option),
          value_token: valueToken(option, value),
        },
      ])
    );
  };

  return combine(0, []).map((selection) => {
    const signature = selectionSignature(selection);
    const existing = existingBySignature.get(signature);
    const labels = selection.map((item) => item.value);
    return {
      id: existing?.id || null,
      client_key: existing?.client_key || createClientKey("variant"),
      selection,
      signature,
      combination_label: labels.join(" / "),
      sku:
        existing?.id || existing?.sku_dirty
          ? existing?.sku || defaultVariantSku(product?.sku, labels)
          : defaultVariantSku(product?.sku, labels),
      sku_dirty: Boolean(existing?.id || existing?.sku_dirty),
      qty_on_hand: existing?.qty_on_hand ?? 0,
      price_override: existing?.price_override ?? "",
      is_active: existing?.is_active !== false,
      primary_image_id: existing?.primary_image_id ?? null,
    };
  });
};

const normalizeConfigForEditor = (payload) => {
  const options = (payload?.options || []).map((option) => ({
    id: option.id || null,
    client_key: option.client_key || createClientKey("option"),
    name: option.name || "",
    display_order: option.display_order || 0,
    values: (option.values || []).map((value) => ({
      id: value.id || null,
      client_key: value.client_key || createClientKey("value"),
      value: value.value || "",
      display_order: value.display_order || 0,
      swatch_color: value.swatch_color || "",
      image_id: value.image_id ?? null,
    })),
  }));
  const variants = (payload?.variants || []).map((variant) => ({
    id: variant.id || null,
    client_key: variant.client_key || createClientKey("variant"),
    selection: (variant.selection || []).map((selection) => ({
      option_id: selection.option_id || null,
      option_client_key: selection.option_client_key || null,
      option_name: selection.option_name || "",
      value_id: selection.value_id || null,
      value_client_key: selection.value_client_key || null,
      value: selection.value || "",
    })),
    sku: variant.sku || "",
    sku_dirty: true,
    qty_on_hand: variant.qty_on_hand ?? 0,
    price_override: variant.price_override ?? "",
    is_active: variant.is_active !== false,
    primary_image_id: variant.primary_image_id ?? null,
  }));
  return {
    ...emptyConfig,
    ...payload,
    options,
    variants,
  };
};

export default function ProductVariantConfigurationDialog({
  open,
  onClose,
  token,
  product,
  onSaved,
  notify,
  businessSellingCurrency = "USD",
}) {
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [config, setConfig] = useState(emptyConfig);
  const [draftOptions, setDraftOptions] = useState([]);
  const [draftVariants, setDraftVariants] = useState([]);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const initializedRef = useRef(false);

  const images = product?.images || [];
  const currency = product?.selling_currency || businessSellingCurrency || "USD";
  const draftOnlyWarning =
    "Draft only — customers still see the current Product. Variant selling will be enabled in the next checkout phase.";
  const activeWarning =
    "Variant selling active — customers must choose an available option combination before adding this Product to their basket.";

  useEffect(() => {
    if (!open || !product?.id) return undefined;
    let alive = true;
    initializedRef.current = false;
    setLoading(true);
    setError("");
    api
      .get(`/inventory/products/${product.id}/variant-configuration`, auth)
      .then(({ data }) => {
        if (!alive) return;
        const next = normalizeConfigForEditor(data || emptyConfig);
        setConfig(next);
        setDraftOptions(next.options);
        setDraftVariants(buildCombinationDrafts({ options: next.options, existingVariants: next.variants, product }));
        setDirty(false);
        initializedRef.current = true;
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load variant configuration.");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [auth, open, product]);

  useEffect(() => {
    if (!initializedRef.current) return;
    setDraftVariants((current) =>
      buildCombinationDrafts({
        options: draftOptions,
        existingVariants: current,
        product,
      })
    );
    setDirty(true);
  }, [draftOptions, product]);

  useEffect(() => {
    if (!open || !dirty) return undefined;
    const handler = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, open]);

  const handleRequestClose = () => {
    if (dirty && !window.confirm("Discard unsaved variant draft changes?")) {
      return;
    }
    setError("");
    onClose?.();
  };

  const updateOptions = (nextOptions) => {
    setDraftOptions(nextOptions);
  };

  const addOption = () => {
    if (draftOptions.length >= MAX_OPTIONS) return;
    updateOptions([
      ...draftOptions,
      {
        id: null,
        client_key: createClientKey("option"),
        name: draftOptions.length === 0 ? "Colour" : "Size",
        values: [],
      },
    ]);
  };

  const updateOptionField = (index, field, value) => {
    updateOptions(draftOptions.map((option, optionIndex) => (optionIndex === index ? { ...option, [field]: value } : option)));
  };

  const removeOption = (index) => {
    updateOptions(draftOptions.filter((_, optionIndex) => optionIndex !== index));
  };

  const addValue = (optionIndex) => {
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: [
                ...(option.values || []),
                {
                  id: null,
                  client_key: createClientKey("value"),
                  value: "",
                  swatch_color: "",
                  image_id: null,
                },
              ],
            }
          : option
      )
    );
  };

  const updateValueField = (optionIndex, valueIndex, field, value) => {
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: (option.values || []).map((row, rowIndex) =>
                rowIndex === valueIndex ? { ...row, [field]: value } : row
              ),
            }
          : option
      )
    );
  };

  const removeValue = (optionIndex, valueIndex) => {
    updateOptions(
      draftOptions.map((option, index) =>
        index === optionIndex
          ? {
              ...option,
              values: (option.values || []).filter((_, rowIndex) => rowIndex !== valueIndex),
            }
          : option
      )
    );
  };

  const updateVariantField = (signature, field, value) => {
    setDraftVariants((current) =>
      current.map((variant) =>
        variant.signature === signature
          ? {
              ...variant,
              [field]: value,
              ...(field === "sku" ? { sku_dirty: true } : null),
            }
          : variant
      )
    );
    setDirty(true);
  };

  const variantPayload = useMemo(
    () => ({
      configuration_version: config.configuration_version,
      variant_mode: draftOptions.length ? "draft" : "none",
      options: draftOptions.map((option) => ({
        id: option.id || undefined,
        client_key: option.id ? undefined : option.client_key,
        name: option.name,
        values: (option.values || []).map((value) => ({
          id: value.id || undefined,
          client_key: value.id ? undefined : value.client_key,
          value: value.value,
          swatch_color: value.swatch_color || null,
          image_id: value.image_id || null,
        })),
      })),
      variants: draftVariants.map((variant) => ({
        id: variant.id || undefined,
        client_key: variant.id ? undefined : variant.client_key,
        selection: (variant.selection || []).map((selection) => ({
          option_id: selection.option_id || undefined,
          option_client_key: selection.option_id ? undefined : selection.option_client_key,
          value_id: selection.value_id || undefined,
          value_client_key: selection.value_id ? undefined : selection.value_client_key,
        })),
        sku: variant.sku,
        qty_on_hand: Number(variant.qty_on_hand || 0),
        price_override: String(variant.price_override || "").trim() || null,
        is_active: Boolean(variant.is_active),
        primary_image_id: variant.primary_image_id || null,
      })),
    }),
    [config.configuration_version, draftOptions, draftVariants]
  );

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const { data } = await api.put(
        `/inventory/products/${product.id}/variant-configuration`,
        variantPayload,
        auth
      );
      const next = normalizeConfigForEditor(data || emptyConfig);
      setConfig(next);
      setDraftOptions(next.options);
      setDraftVariants(buildCombinationDrafts({ options: next.options, existingVariants: next.variants, product }));
      setDirty(false);
      onSaved?.(next);
      notify?.("Draft variants saved.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save variant draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("This removes the prepared option and variant draft. The Product itself, its current stock, price, orders, shipping, and content will not change.")) {
      return;
    }
    setRemoving(true);
    setError("");
    try {
      const { data } = await api.delete(`/inventory/products/${product.id}/variant-configuration`, {
        ...auth,
        data: { configuration_version: config.configuration_version },
      });
      const next = normalizeConfigForEditor(data || emptyConfig);
      setConfig(next);
      setDraftOptions(next.options);
      setDraftVariants([]);
      setDirty(false);
      onSaved?.(next);
      notify?.("Draft variant configuration removed.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to remove variant draft.");
    } finally {
      setRemoving(false);
    }
  };

  const isActiveMode = String(config?.variant_mode || "none").toLowerCase() === "active";
  const summaryModeLabel = isActiveMode
    ? "Active"
    : (String(config?.product_summary?.variant_mode || "none").toLowerCase() === "draft" || draftOptions.length)
    ? "Draft"
    : "None";
  const summaryLabel =
    summaryModeLabel === "None"
      ? "Variants: None"
      : `Variants: ${summaryModeLabel} · ${draftOptions.length} option${draftOptions.length === 1 ? "" : "s"} · ${draftVariants.length} combination${draftVariants.length === 1 ? "" : "s"}`;

  const readinessBlockers = config?.readiness?.blockers || [];
  const activationReadiness = config?.activation_readiness || emptyConfig.activation_readiness;
  const activationBlockers = activationReadiness?.blockers || [];
  const activationWarnings = activationReadiness?.warnings || [];
  const runtimeSellingEnabled = Boolean(config?.runtime_selling_enabled);

  const handleActivation = async (activate) => {
    const confirmation = activate
      ? "Customers will be required to choose an available option combination before adding this Product to their basket. Variant Price, SKU, and Stock will become authoritative."
      : "Customers will no longer be able to purchase this Product until variant selling is activated again.";
    if (!window.confirm(confirmation)) return;
    setActivating(true);
    setError("");
    try {
      const { data } = await api.post(
        `/inventory/products/${product.id}/variant-activation`,
        {
          activate,
          configuration_version: config.configuration_version,
        },
        auth
      );
      const next = normalizeConfigForEditor(data || emptyConfig);
      setConfig(next);
      setDraftOptions(next.options);
      setDraftVariants(buildCombinationDrafts({ options: next.options, existingVariants: next.variants, product }));
      setDirty(false);
      onSaved?.(next);
      notify?.(activate ? "Variant selling activated." : "Variant selling paused.");
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update variant selling.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleRequestClose} maxWidth="lg" fullWidth fullScreen={isMobile}>
      <DialogTitle>Configure Product options and variants</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity={isActiveMode ? "success" : "warning"}>
            {isActiveMode ? activeWarning : draftOnlyWarning}
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "flex-start", sm: "center" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {product?.name || "Product"}
            </Typography>
            <Chip
              label={summaryLabel}
              size="small"
              color={isActiveMode ? "success" : "warning"}
              variant="outlined"
            />
          </Stack>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {!runtimeSellingEnabled ? (
            <Alert severity="info">
              Variant selling is currently disabled by runtime configuration. Draft editing remains available, but activation is blocked.
            </Alert>
          ) : null}
          {readinessBlockers.length ? (
            <Alert severity="info">
              {readinessBlockers.map((blocker) => (
                <Box key={blocker}>{blocker}</Box>
              ))}
            </Alert>
          ) : null}
          {activationBlockers.length ? (
            <Alert severity="warning">
              {activationBlockers.map((blocker) => (
                <Box key={blocker}>{blocker}</Box>
              ))}
            </Alert>
          ) : null}
          {activationWarnings.length ? (
            <Alert severity="info">
              {activationWarnings.map((warning) => (
                <Box key={warning}>{warning}</Box>
              ))}
            </Alert>
          ) : null}
          {loading ? (
            <Typography>Loading draft configuration…</Typography>
          ) : (
            <>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Options
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={addOption}
                      disabled={draftOptions.length >= MAX_OPTIONS}
                    >
                      Add option
                    </Button>
                  </Stack>
                  {draftOptions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Add up to two option groups such as Colour and Size.
                    </Typography>
                  ) : null}
                  {draftOptions.map((option, optionIndex) => (
                    <Paper key={option.id || option.client_key} variant="outlined" sx={{ p: 1.5 }}>
                      <Stack spacing={1.25}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <TextField
                            fullWidth
                            label={`Option ${optionIndex + 1} name`}
                            value={option.name}
                            onChange={(event) => updateOptionField(optionIndex, "name", event.target.value)}
                          />
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button size="small" variant="outlined" onClick={() => updateOptionField(optionIndex, "name", "Colour")}>
                              Colour
                            </Button>
                            <Button size="small" variant="outlined" onClick={() => updateOptionField(optionIndex, "name", "Size")}>
                              Size
                            </Button>
                            <IconButton
                              aria-label={`Remove option ${optionIndex + 1}`}
                              onClick={() => removeOption(optionIndex)}
                            >
                              <DeleteOutline />
                            </IconButton>
                          </Stack>
                        </Stack>
                        <Stack spacing={1}>
                          {(option.values || []).map((value, valueIndex) => (
                            <Stack
                              key={value.id || value.client_key}
                              direction={{ xs: "column", md: "row" }}
                              spacing={1}
                              alignItems={{ md: "center" }}
                            >
                              <TextField
                                fullWidth
                                label="Value"
                                value={value.value}
                                onChange={(event) => updateValueField(optionIndex, valueIndex, "value", event.target.value)}
                              />
                              {isColourOption(option.name) ? (
                                <TextField
                                  label="Swatch"
                                  value={value.swatch_color || ""}
                                  placeholder="#000000"
                                  onChange={(event) => updateValueField(optionIndex, valueIndex, "swatch_color", event.target.value)}
                                  sx={{ minWidth: { md: 140 } }}
                                />
                              ) : null}
                              <TextField
                                select
                                label="Gallery image"
                                value={value.image_id || ""}
                                onChange={(event) => updateValueField(optionIndex, valueIndex, "image_id", event.target.value ? Number(event.target.value) : null)}
                                sx={{ minWidth: { md: 220 } }}
                              >
                                <MenuItem value="">None</MenuItem>
                                {images.map((image) => (
                                  <MenuItem key={image.id} value={image.id}>
                                    {image.filename || `Image ${image.id}`}
                                  </MenuItem>
                                ))}
                              </TextField>
                              <IconButton
                                aria-label={`Remove value ${valueIndex + 1}`}
                                onClick={() => removeValue(optionIndex, valueIndex)}
                              >
                                <DeleteOutline />
                              </IconButton>
                            </Stack>
                          ))}
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Add />}
                            onClick={() => addValue(optionIndex)}
                            disabled={(option.values || []).length >= MAX_VALUES_PER_OPTION}
                          >
                            Add value
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Variants
                    </Typography>
                    <Chip label={`${draftVariants.length} combinations`} size="small" />
                  </Stack>
                  {!draftVariants.length ? (
                    <Typography variant="body2" color="text.secondary">
                      Add option values to generate draft combinations.
                    </Typography>
                  ) : isMobile ? (
                    <Stack spacing={1.25} data-testid="variant-mobile-cards">
                      {draftVariants.map((variant) => (
                        <Paper key={variant.signature} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={1}>
                            <Typography sx={{ fontWeight: 700 }}>{variant.combination_label}</Typography>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={Boolean(variant.is_active)}
                                  onChange={(event) => updateVariantField(variant.signature, "is_active", event.target.checked)}
                                />
                              }
                              label={variant.is_active ? "Active" : "Inactive"}
                            />
                            <TextField
                              label="SKU"
                              value={variant.sku}
                              onChange={(event) => updateVariantField(variant.signature, "sku", event.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Stock"
                              type="number"
                              value={variant.qty_on_hand}
                              onChange={(event) => updateVariantField(variant.signature, "qty_on_hand", event.target.value)}
                              fullWidth
                            />
                            <TextField
                              label="Price override"
                              value={variant.price_override}
                              onChange={(event) => updateVariantField(variant.signature, "price_override", event.target.value)}
                              helperText={
                                String(variant.price_override || "").trim()
                                  ? undefined
                                  : `Uses Product price: ${formatCurrency(product?.price || 0, currency)}`
                              }
                              fullWidth
                            />
                            <TextField
                              select
                              label="Primary image"
                              value={variant.primary_image_id || ""}
                              onChange={(event) =>
                                updateVariantField(
                                  variant.signature,
                                  "primary_image_id",
                                  event.target.value ? Number(event.target.value) : null
                                )
                              }
                              fullWidth
                            >
                              <MenuItem value="">None</MenuItem>
                              {images.map((image) => (
                                <MenuItem key={image.id} value={image.id}>
                                  {image.filename || `Image ${image.id}`}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Combination</TableCell>
                          <TableCell>Active</TableCell>
                          <TableCell>SKU</TableCell>
                          <TableCell>Stock</TableCell>
                          <TableCell>Price override</TableCell>
                          <TableCell>Image</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {draftVariants.map((variant) => (
                          <TableRow key={variant.signature}>
                            <TableCell>{variant.combination_label}</TableCell>
                            <TableCell>
                              <Switch
                                checked={Boolean(variant.is_active)}
                                onChange={(event) => updateVariantField(variant.signature, "is_active", event.target.checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={variant.sku}
                                onChange={(event) => updateVariantField(variant.signature, "sku", event.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={variant.qty_on_hand}
                                onChange={(event) => updateVariantField(variant.signature, "qty_on_hand", event.target.value)}
                                sx={{ width: 110 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                value={variant.price_override}
                                onChange={(event) => updateVariantField(variant.signature, "price_override", event.target.value)}
                                helperText={
                                  String(variant.price_override || "").trim()
                                    ? undefined
                                    : `Uses Product price: ${formatCurrency(product?.price || 0, currency)}`
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                select
                                size="small"
                                value={variant.primary_image_id || ""}
                                onChange={(event) =>
                                  updateVariantField(
                                    variant.signature,
                                    "primary_image_id",
                                    event.target.value ? Number(event.target.value) : null
                                  )
                                }
                                sx={{ minWidth: 170 }}
                              >
                                <MenuItem value="">None</MenuItem>
                                {images.map((image) => (
                                  <MenuItem key={image.id} value={image.id}>
                                    {image.filename || `Image ${image.id}`}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </Stack>
              </Paper>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleRequestClose}>Close</Button>
        <Button color="error" onClick={handleRemove} disabled={removing || loading || !config.options.length}>
          Remove draft configuration
        </Button>
        {isActiveMode ? (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => handleActivation(false)}
            disabled={activating || saving || loading}
          >
            Pause variant selling
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={() => handleActivation(true)}
            disabled={activating || saving || loading || !runtimeSellingEnabled || !activationReadiness?.ready_for_activation}
          >
            Activate variant selling
          </Button>
        )}
        <Button variant="contained" onClick={handleSave} disabled={saving || activating || loading}>
          {isActiveMode ? "Save active variants" : "Save draft variants"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
