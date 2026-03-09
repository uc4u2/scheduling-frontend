import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArchiveIcon from "@mui/icons-material/Archive";
import RefreshIcon from "@mui/icons-material/Refresh";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import api from "../../../utils/api";

const DELIVERY_MODE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "r2_hosted", label: "Hosted file" },
  { value: "external_link", label: "External link" },
  { value: "license_only", label: "License only" },
  { value: "r2_hosted_with_license", label: "Hosted file + license" },
  { value: "external_link_with_license", label: "External link + license" },
];

const ACCESS_CODE_VISIBILITY_OPTIONS = [
  { value: "none", label: "Hide code" },
  { value: "hint", label: "Show hint only" },
  { value: "full", label: "Show full code" },
];

const emptyAssetForm = {
  title: "",
  storage_mode: "external_link",
  external_url: "",
  access_code: "",
  access_code_hint: "",
  access_instructions: "",
};

const DigitalProductsWorkspace = ({ token }) => {
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [products, setProducts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [mapping, setMapping] = useState({
    digital_delivery_mode: "none",
    digital_requires_payment: true,
    digital_access_expires_enabled: false,
    digital_access_days: "",
    digital_max_downloads: "",
    access_code_visibility: "none",
    instructions: "",
    links: [],
  });

  const [assetForm, setAssetForm] = useState(emptyAssetForm);
  const [licenseRows, setLicenseRows] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [licenseStatus, setLicenseStatus] = useState("idle");
  const [auditStatus, setAuditStatus] = useState("idle");
  const [licenseError, setLicenseError] = useState("");
  const [auditError, setAuditError] = useState("");
  const [licensePagination, setLicensePagination] = useState({ page: 1, page_size: 10, total: 0 });
  const [auditPagination, setAuditPagination] = useState({ page: 1, page_size: 10, total: 0 });
  const [licenseFilters, setLicenseFilters] = useState({
    product_id: "",
    entitlement_id: "",
    order_id: "",
    status: "",
    page: 1,
    page_size: 10,
  });
  const [auditFilters, setAuditFilters] = useState({
    product_id: "",
    entitlement_id: "",
    order_id: "",
    status: "",
    event_type: "",
    page: 1,
    page_size: 10,
  });
  const [helpOpen, setHelpOpen] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((row) => String(row.id) === String(selectedProductId)) || null,
    [products, selectedProductId]
  );

  const activeEntitlements = 0;
  const overview = useMemo(
    () => ({
      total_digital_products: products.filter((p) => Boolean(p?.is_digital)).length,
      active_assets: assets.filter((a) => Boolean(a?.is_active)).length,
      active_entitlements: activeEntitlements,
      issued_licenses: licenseRows.length,
      access_events: auditRows.length,
    }),
    [products, assets, licenseRows.length, auditRows.length]
  );

  const notify = useCallback((type, text) => setMessage({ type, text }), []);

  const loadAssets = useCallback(async () => {
    const { data } = await api.get("/inventory/digital-assets?include_inactive=1", auth);
    setAssets(Array.isArray(data) ? data : []);
  }, [auth]);

  const loadProducts = useCallback(async () => {
    const { data } = await api.get("/inventory/products", auth);
    const rows = Array.isArray(data) ? data : [];
    setProducts(rows);
    if (!selectedProductId && rows.length > 0) {
      setSelectedProductId(String(rows[0].id));
    }
  }, [auth, selectedProductId]);

  const loadProductDelivery = useCallback(
    async (productId) => {
      if (!productId) {
        return;
      }
      const { data } = await api.get(`/inventory/products/${productId}/digital-delivery`, auth);
      const policy = data?.digital_access_policy || {};
      const links = Array.isArray(data?.links)
        ? data.links.map((row, index) => ({
            digital_asset_id: Number(row.id || row.digital_asset_id),
            sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
            is_primary: Boolean(row.is_primary),
          }))
        : [];
      setMapping({
        digital_delivery_mode: String(data?.digital_delivery_mode || "none"),
        digital_requires_payment: data?.digital_requires_payment !== false,
        digital_access_expires_enabled: Boolean(data?.digital_access_expires_enabled),
        digital_access_days:
          data?.digital_access_days == null ? "" : String(data.digital_access_days),
        digital_max_downloads:
          data?.digital_max_downloads == null ? "" : String(data.digital_max_downloads),
        access_code_visibility: String(policy?.access_code_visibility || "none"),
        instructions: String(policy?.instructions || ""),
        links,
      });
    },
    [auth]
  );

  const loadLicenseRows = useCallback(async () => {
    setLicenseStatus("loading");
    setLicenseError("");
    try {
      const params = {
        page: licenseFilters.page || 1,
        page_size: licenseFilters.page_size || 10,
      };
      if (licenseFilters.product_id) params.product_id = licenseFilters.product_id;
      if (licenseFilters.entitlement_id) params.entitlement_id = licenseFilters.entitlement_id;
      if (licenseFilters.order_id) params.order_id = licenseFilters.order_id;
      if (licenseFilters.status) params.status = licenseFilters.status;
      const { data } = await api.get("/inventory/digital-license-keys", { ...auth, params });
      const items = Array.isArray(data?.items) ? data.items : [];
      setLicenseRows(items);
      const pg = data?.pagination || {};
      setLicensePagination({
        page: Number(pg.page || params.page || 1),
        page_size: Number(pg.page_size || params.page_size || 10),
        total: Number(pg.total || 0),
      });
      setLicenseStatus("loaded");
    } catch (error) {
      setLicenseRows([]);
      setLicenseStatus("error");
      setLicenseError(
        error?.response?.data?.error || error?.message || "Failed to load license rows."
      );
    }
  }, [auth, licenseFilters]);

  const loadAuditRows = useCallback(async () => {
    setAuditStatus("loading");
    setAuditError("");
    try {
      const params = {
        page: auditFilters.page || 1,
        page_size: auditFilters.page_size || 10,
      };
      if (auditFilters.product_id) params.product_id = auditFilters.product_id;
      if (auditFilters.entitlement_id) params.entitlement_id = auditFilters.entitlement_id;
      if (auditFilters.order_id) params.order_id = auditFilters.order_id;
      if (auditFilters.status) params.status = auditFilters.status;
      if (auditFilters.event_type) params.event_type = auditFilters.event_type;
      const { data } = await api.get("/inventory/digital-access-audit", { ...auth, params });
      const items = Array.isArray(data?.items) ? data.items : [];
      setAuditRows(items);
      const pg = data?.pagination || {};
      setAuditPagination({
        page: Number(pg.page || params.page || 1),
        page_size: Number(pg.page_size || params.page_size || 10),
        total: Number(pg.total || 0),
      });
      setAuditStatus("loaded");
    } catch (error) {
      setAuditRows([]);
      setAuditStatus("error");
      setAuditError(
        error?.response?.data?.error || error?.message || "Failed to load access audit rows."
      );
    }
  }, [auth, auditFilters]);

  const loadAll = useCallback(async () => {
    setBusy(true);
    setMessage({ type: "", text: "" });
    try {
      await Promise.all([loadAssets(), loadProducts()]);
    } catch (error) {
      const text =
        error?.response?.data?.error || error?.message || "Failed to load digital workspace.";
      notify("error", text);
    } finally {
      setBusy(false);
    }
  }, [loadAssets, loadProducts, notify]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedProductId) return;
    loadProductDelivery(selectedProductId).catch((error) => {
      const text =
        error?.response?.data?.error || error?.message || "Failed to load product delivery mapping.";
      notify("error", text);
    });
  }, [selectedProductId, loadProductDelivery, notify]);

  useEffect(() => {
    loadLicenseRows();
  }, [loadLicenseRows]);

  useEffect(() => {
    loadAuditRows();
  }, [loadAuditRows]);

  const handleCreateAsset = useCallback(async () => {
    if (!assetForm.title.trim()) {
      notify("error", "Asset title is required.");
      return;
    }
    const payload = {
      title: assetForm.title.trim(),
      storage_mode: assetForm.storage_mode,
      external_url: assetForm.storage_mode === "external_link" ? assetForm.external_url.trim() : undefined,
      access_code: assetForm.access_code.trim() || undefined,
      access_code_hint: assetForm.access_code_hint.trim() || undefined,
      access_instructions: assetForm.access_instructions.trim() || undefined,
    };
    try {
      await api.post("/inventory/digital-assets", payload, auth);
      setAssetForm(emptyAssetForm);
      await loadAssets();
      notify("success", "Digital asset created.");
    } catch (error) {
      const text =
        error?.response?.data?.error || error?.message || "Failed to create digital asset.";
      notify("error", text);
    }
  }, [assetForm, auth, loadAssets, notify]);

  const handleArchiveAsset = useCallback(
    async (assetId) => {
      try {
        await api.post(`/inventory/digital-assets/${assetId}/archive`, {}, auth);
        await loadAssets();
        notify("success", "Asset archived.");
      } catch (error) {
        const text =
          error?.response?.data?.error || error?.message || "Failed to archive asset.";
        notify("error", text);
      }
    },
    [auth, loadAssets, notify]
  );

  const handleUploadFile = useCallback(
    async (assetId, file, replace = false) => {
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const path = replace
        ? `/inventory/digital-assets/${assetId}/replace-file`
        : `/inventory/digital-assets/${assetId}/upload`;
      try {
        await api.post(path, formData, {
          ...auth,
          headers: {
            ...auth.headers,
            "Content-Type": "multipart/form-data",
          },
        });
        await loadAssets();
        notify("success", replace ? "Asset file replaced." : "Asset file uploaded.");
      } catch (error) {
        const text = error?.response?.data?.error || error?.message || "Upload failed.";
        notify("error", text);
      }
    },
    [auth, loadAssets, notify]
  );

  const toggleAssetLink = useCallback((assetId) => {
    setMapping((prev) => {
      const exists = prev.links.some((row) => Number(row.digital_asset_id) === Number(assetId));
      if (exists) {
        const nextLinks = prev.links.filter((row) => Number(row.digital_asset_id) !== Number(assetId));
        if (nextLinks.length > 0 && !nextLinks.some((row) => row.is_primary)) {
          nextLinks[0].is_primary = true;
        }
        return { ...prev, links: nextLinks };
      }
      const nextLinks = [
        ...prev.links,
        {
          digital_asset_id: Number(assetId),
          sort_order: prev.links.length,
          is_primary: prev.links.length === 0,
        },
      ];
      return { ...prev, links: nextLinks };
    });
  }, []);

  const setPrimaryAsset = useCallback((assetId) => {
    setMapping((prev) => ({
      ...prev,
      links: prev.links.map((row) => ({
        ...row,
        is_primary: Number(row.digital_asset_id) === Number(assetId),
      })),
    }));
  }, []);

  const saveProductMapping = useCallback(async () => {
    if (!selectedProductId) {
      notify("error", "Select a product first.");
      return;
    }

    const payload = {
      digital_delivery_mode: mapping.digital_delivery_mode,
      digital_requires_payment: Boolean(mapping.digital_requires_payment),
      digital_access_expires_enabled: Boolean(mapping.digital_access_expires_enabled),
      digital_access_days:
        mapping.digital_access_days === "" ? null : Number(mapping.digital_access_days),
      digital_max_downloads:
        mapping.digital_max_downloads === "" ? null : Number(mapping.digital_max_downloads),
      digital_access_policy: {
        access_code_visibility: mapping.access_code_visibility,
        instructions: mapping.instructions || null,
      },
      links: mapping.links.map((row, index) => ({
        digital_asset_id: Number(row.digital_asset_id),
        sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : index,
        is_primary: Boolean(row.is_primary),
      })),
      digital_asset_v2_id:
        mapping.links.find((row) => row.is_primary)?.digital_asset_id || null,
    };

    try {
      await api.patch(`/inventory/products/${selectedProductId}/digital-delivery`, payload, auth);
      await loadProductDelivery(selectedProductId);
      notify("success", "Digital delivery mapping saved.");
    } catch (error) {
      const text = error?.response?.data?.error || error?.message || "Failed to save mapping.";
      notify("error", text);
    }
  }, [selectedProductId, mapping, auth, loadProductDelivery, notify]);

  return (
    <Box p={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Digital Products</Typography>
          <Typography variant="body2" color="text.secondary">
            Source of truth for digital asset library, product mapping, access policy, licensing, and audit visibility.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Open full manager guide for Digital Products." arrow>
            <Button
              startIcon={<HelpOutlineIcon />}
              variant="outlined"
              color="inherit"
              onClick={() => setHelpOpen(true)}
            >
              Help
            </Button>
          </Tooltip>
          <Button startIcon={<RefreshIcon />} onClick={loadAll} disabled={busy}>Refresh</Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 2 }}>
        Product modal only marks items as digital. Full digital setup is managed here in Digital Products.
      </Alert>

      {message.text ? (
        <Alert severity={message.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ mb: 2 }}>
        <Chip label={`Digital products: ${overview.total_digital_products}`} />
        <Chip label={`Active assets: ${overview.active_assets}`} color="primary" />
        <Chip label={`Active entitlements: ${overview.active_entitlements}`} color="default" />
        <Chip label={`Issued licenses: ${overview.issued_licenses}`} color="secondary" />
        <Chip label={`Access events: ${overview.access_events}`} color="info" />
      </Stack>

      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700}>Asset Library</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Create hosted or external-link assets, then upload/replace/archive files.
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                label="Title"
                value={assetForm.title}
                onChange={(e) => setAssetForm((prev) => ({ ...prev, title: e.target.value }))}
                fullWidth
              />
              <TextField
                select
                label="Storage mode"
                value={assetForm.storage_mode}
                onChange={(e) =>
                  setAssetForm((prev) => ({ ...prev, storage_mode: e.target.value }))
                }
                sx={{ minWidth: 220 }}
              >
                <MenuItem value="external_link">External link</MenuItem>
                <MenuItem value="r2_hosted">Hosted file</MenuItem>
                <MenuItem value="license_only">License only</MenuItem>
              </TextField>
            </Stack>

            {assetForm.storage_mode === "external_link" ? (
              <TextField
                label="External URL"
                value={assetForm.external_url}
                onChange={(e) =>
                  setAssetForm((prev) => ({ ...prev, external_url: e.target.value }))
                }
                fullWidth
                sx={{ mb: 1.5 }}
              />
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                label="Access code (optional)"
                value={assetForm.access_code}
                onChange={(e) =>
                  setAssetForm((prev) => ({ ...prev, access_code: e.target.value }))
                }
                fullWidth
              />
              <TextField
                label="Access code hint (optional)"
                value={assetForm.access_code_hint}
                onChange={(e) =>
                  setAssetForm((prev) => ({ ...prev, access_code_hint: e.target.value }))
                }
                fullWidth
              />
            </Stack>

            <TextField
              label="Instructions (optional)"
              value={assetForm.access_instructions}
              onChange={(e) =>
                setAssetForm((prev) => ({ ...prev, access_instructions: e.target.value }))
              }
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 1.5 }}
            />

            <Button variant="contained" onClick={handleCreateAsset} disabled={busy}>Create asset</Button>

            <Divider sx={{ my: 2 }} />

            <Stack spacing={1}>
              {assets.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No digital assets yet.</Typography>
              ) : (
                assets.map((asset) => (
                  <Card key={asset.id} variant="outlined" sx={{ p: 1.25 }}>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {asset.title} {asset.is_active ? "" : "(Archived)"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Mode: {asset.storage_mode} | Hosted file: {asset.has_hosted_file ? "yes" : "no"}
                        </Typography>
                        {asset.external_url ? (
                          <Typography variant="caption" color="text.secondary" display="block" noWrap>
                            {asset.external_url}
                          </Typography>
                        ) : null}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Button component="label" size="small" startIcon={<UploadFileIcon />}>
                          Upload
                          <input
                            hidden
                            type="file"
                            onChange={(e) => handleUploadFile(asset.id, e.target.files?.[0], false)}
                          />
                        </Button>
                        <Button component="label" size="small" startIcon={<CloudUploadIcon />}>
                          Replace
                          <input
                            hidden
                            type="file"
                            onChange={(e) => handleUploadFile(asset.id, e.target.files?.[0], true)}
                          />
                        </Button>
                        <Button
                          size="small"
                          color="warning"
                          startIcon={<ArchiveIcon />}
                          onClick={() => handleArchiveAsset(asset.id)}
                          disabled={!asset.is_active}
                        >
                          Archive
                        </Button>
                      </Stack>
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700}>Product Delivery Mapping</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Select a product, set delivery mode, and attach primary/secondary digital assets.
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name} ({p.sku || "no-sku"})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label="Digital delivery mode"
                value={mapping.digital_delivery_mode}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, digital_delivery_mode: e.target.value }))
                }
              >
                {DELIVERY_MODE_OPTIONS.map((row) => (
                  <MenuItem key={row.value} value={row.value}>{row.label}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Linked assets
            </Typography>
            {assets.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Create assets first.</Typography>
            ) : (
              <Stack spacing={0.5} sx={{ mb: 2 }}>
                {assets.map((asset) => {
                  const linked = mapping.links.some(
                    (row) => Number(row.digital_asset_id) === Number(asset.id)
                  );
                  const primary = mapping.links.some(
                    (row) => Number(row.digital_asset_id) === Number(asset.id) && row.is_primary
                  );
                  return (
                    <Stack key={asset.id} direction="row" alignItems="center" spacing={1.5}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={linked}
                            onChange={() => toggleAssetLink(asset.id)}
                            disabled={!asset.is_active}
                          />
                        }
                        label={`${asset.title} (${asset.storage_mode})`}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={primary}
                            onChange={() => setPrimaryAsset(asset.id)}
                            disabled={!linked}
                          />
                        }
                        label="Primary"
                      />
                    </Stack>
                  );
                })}
              </Stack>
            )}

            <Typography variant="h6" fontWeight={700}>Access Policy</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(mapping.digital_requires_payment)}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, digital_requires_payment: e.target.checked }))
                    }
                  />
                }
                label="Payment required"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(mapping.digital_access_expires_enabled)}
                    onChange={(e) =>
                      setMapping((prev) => ({ ...prev, digital_access_expires_enabled: e.target.checked }))
                    }
                  />
                }
                label="Expiration enabled"
              />
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 1 }}>
              <TextField
                label="Access days"
                type="number"
                value={mapping.digital_access_days}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, digital_access_days: e.target.value }))
                }
                fullWidth
                disabled={!mapping.digital_access_expires_enabled}
              />
              <TextField
                label="Max downloads"
                type="number"
                value={mapping.digital_max_downloads}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, digital_max_downloads: e.target.value }))
                }
                fullWidth
              />
              <TextField
                select
                label="Code visibility"
                value={mapping.access_code_visibility}
                onChange={(e) =>
                  setMapping((prev) => ({ ...prev, access_code_visibility: e.target.value }))
                }
                fullWidth
              >
                {ACCESS_CODE_VISIBILITY_OPTIONS.map((row) => (
                  <MenuItem key={row.value} value={row.value}>{row.label}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label="Instructions"
              value={mapping.instructions}
              onChange={(e) => setMapping((prev) => ({ ...prev, instructions: e.target.value }))}
              fullWidth
              multiline
              minRows={2}
              sx={{ mt: 1.5 }}
            />

            <Button variant="contained" sx={{ mt: 1.5 }} onClick={saveProductMapping}>
              Save mapping and policy
            </Button>

            {selectedProduct ? (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Editing: {selectedProduct.name} ({selectedProduct.sku || "no-sku"})
              </Typography>
            ) : null}
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700}>Licensing</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Licensing required: {String(mapping.digital_delivery_mode || "").includes("license") ? "Yes" : "No"}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
              <TextField
                select
                size="small"
                label="Product"
                value={licenseFilters.product_id}
                onChange={(e) =>
                  setLicenseFilters((prev) => ({ ...prev, product_id: e.target.value, page: 1 }))
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All</MenuItem>
                {products.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Status"
                value={licenseFilters.status}
                onChange={(e) =>
                  setLicenseFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                }
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="available">available</MenuItem>
                <MenuItem value="issued">issued</MenuItem>
                <MenuItem value="activated">activated</MenuItem>
                <MenuItem value="revoked">revoked</MenuItem>
                <MenuItem value="expired">expired</MenuItem>
              </TextField>
              <TextField
                size="small"
                label="Order ID"
                value={licenseFilters.order_id}
                onChange={(e) =>
                  setLicenseFilters((prev) => ({ ...prev, order_id: e.target.value, page: 1 }))
                }
              />
              <TextField
                size="small"
                label="Entitlement ID"
                value={licenseFilters.entitlement_id}
                onChange={(e) =>
                  setLicenseFilters((prev) => ({ ...prev, entitlement_id: e.target.value, page: 1 }))
                }
              />
            </Stack>
            {licenseStatus === "loading" ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Loading license rows...</Typography>
            ) : null}
            {licenseStatus === "error" ? (
              <Alert severity="warning" sx={{ mt: 1.5 }}>{licenseError}</Alert>
            ) : null}
            {licenseStatus === "loaded" && licenseRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No issued license rows for current filters.
              </Typography>
            ) : null}
            {licenseStatus === "loaded" && licenseRows.length > 0 ? (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {licenseRows.map((row) => (
                  <Card key={row.id} variant="outlined" sx={{ p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.product_name || `Product #${row.product_id || "-"}`}
                      </Typography>
                      <Chip label={row.status || "unknown"} size="small" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      License: {row.license_code || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Order #{row.order_id || "-"} | Entitlement #{row.entitlement_id || "-"} | Activations {Number(row.activation_count || 0)}/{row.max_activations ?? "unlimited"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Issued to: {row.issued_to_email || "-"}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            ) : null}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {licensePagination.total} records
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  disabled={licenseFilters.page <= 1}
                  onClick={() =>
                    setLicenseFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={(licenseFilters.page * licenseFilters.page_size) >= licensePagination.total}
                  onClick={() => setLicenseFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" fontWeight={700}>Access Audit</Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
              <TextField
                select
                size="small"
                label="Product"
                value={auditFilters.product_id}
                onChange={(e) =>
                  setAuditFilters((prev) => ({ ...prev, product_id: e.target.value, page: 1 }))
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All</MenuItem>
                {products.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.name}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Event"
                value={auditFilters.event_type}
                onChange={(e) =>
                  setAuditFilters((prev) => ({ ...prev, event_type: e.target.value, page: 1 }))
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open_link">open_link</MenuItem>
                <MenuItem value="download">download</MenuItem>
                <MenuItem value="refresh_token">refresh_token</MenuItem>
                <MenuItem value="redirect_external">redirect_external</MenuItem>
                <MenuItem value="license_viewed">license_viewed</MenuItem>
                <MenuItem value="access_denied">access_denied</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="Entitlement status"
                value={auditFilters.status}
                onChange={(e) =>
                  setAuditFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                }
                sx={{ minWidth: 170 }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending_payment">pending_payment</MenuItem>
                <MenuItem value="active">active</MenuItem>
                <MenuItem value="revoked">revoked</MenuItem>
                <MenuItem value="expired">expired</MenuItem>
              </TextField>
              <TextField
                size="small"
                label="Order ID"
                value={auditFilters.order_id}
                onChange={(e) =>
                  setAuditFilters((prev) => ({ ...prev, order_id: e.target.value, page: 1 }))
                }
              />
              <TextField
                size="small"
                label="Entitlement ID"
                value={auditFilters.entitlement_id}
                onChange={(e) =>
                  setAuditFilters((prev) => ({ ...prev, entitlement_id: e.target.value, page: 1 }))
                }
              />
            </Stack>
            {auditStatus === "loading" ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Loading audit events...</Typography>
            ) : null}
            {auditStatus === "error" ? (
              <Alert severity="warning" sx={{ mt: 1.5 }}>{auditError}</Alert>
            ) : null}
            {auditStatus === "loaded" && auditRows.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No access audit events for current filters.
              </Typography>
            ) : null}
            {auditStatus === "loaded" && auditRows.length > 0 ? (
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {auditRows.map((row) => (
                  <Card key={row.id} variant="outlined" sx={{ p: 1.25 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.product_name || `Product #${row.product_id || "-"}`}
                      </Typography>
                      <Chip label={row.event_type || "event"} size="small" />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Order #{row.order_id || "-"} | Entitlement #{row.entitlement_id || "-"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Client: {row.client_email || "-"} | IP: {row.ip_address_masked || "-"}
                    </Typography>
                    {row.user_agent ? (
                      <Typography variant="caption" color="text.secondary" display="block" noWrap>
                        Agent: {row.user_agent}
                      </Typography>
                    ) : null}
                  </Card>
                ))}
              </Stack>
            ) : null}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {auditPagination.total} records
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  disabled={auditFilters.page <= 1}
                  onClick={() =>
                    setAuditFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={(auditFilters.page * auditFilters.page_size) >= auditPagination.total}
                  onClick={() => setAuditFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Drawer
        anchor="right"
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2000,
          "& .MuiDrawer-paper": { zIndex: "inherit" },
        }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 2.5 } }}
      >
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Digital Products Help
            </Typography>
            <Button size="small" onClick={() => setHelpOpen(false)}>Close</Button>
          </Stack>

          <Typography variant="body2" color="text.secondary">
            This workspace is the manager source of truth for digital product delivery setup. It controls what is released after payment, while checkout and My Bookings consume the resolved configuration.
          </Typography>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>What this page does</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Create and manage digital assets (hosted files and external links).</Typography>
            <Typography variant="body2">Map assets to products and choose the delivery mode.</Typography>
            <Typography variant="body2">Set access policy (payment required, expiration, max downloads, code visibility, instructions).</Typography>
            <Typography variant="body2">Review licensing and access audit visibility when backend endpoints are available.</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>How the digital delivery flow works</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">1. Manager marks product as digital in Product Management.</Typography>
            <Typography variant="body2">2. Manager configures asset + mapping + policy in this Digital Products workspace.</Typography>
            <Typography variant="body2">3. Customer purchases product through normal checkout/order flow.</Typography>
            <Typography variant="body2">4. Access is released only after backend payment confirmation (paid/captured), never from frontend-only state.</Typography>
            <Typography variant="body2">5. Customer accesses digital items from My Bookings. Any short-lived access link is refreshed from My Bookings when needed.</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Section guide</Typography>
          <Stack spacing={1}>
            <Typography variant="body2"><strong>Overview:</strong> Quick counts for digital products, assets, licenses, and audit visibility.</Typography>
            <Typography variant="body2"><strong>Asset Library:</strong> Create hosted/external assets, upload or replace files, archive old assets.</Typography>
            <Typography variant="body2"><strong>Product Delivery Mapping:</strong> Select product, set delivery mode, link assets, choose primary asset.</Typography>
            <Typography variant="body2"><strong>Access Policy:</strong> Payment requirement, expiration, max downloads, code visibility, instructions.</Typography>
            <Typography variant="body2"><strong>Licensing:</strong> License status and issued keys visibility (depends on manager endpoint availability).</Typography>
            <Typography variant="body2"><strong>Access Audit:</strong> Read-only events for access/denial visibility (depends on manager endpoint availability).</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Field guide</Typography>
          <Stack spacing={1}>
            <Typography variant="body2"><strong>Title:</strong> Internal name managers use to identify the asset.</Typography>
            <Typography variant="body2"><strong>Storage mode:</strong> Chooses hosted file, external link, or license-only behavior.</Typography>
            <Typography variant="body2"><strong>Hosted file:</strong> File is stored in Schedulaa storage and delivered via a short-lived access link.</Typography>
            <Typography variant="body2"><strong>External link:</strong> Fallback mode that sends the customer to your external URL after entitlement checks.</Typography>
            <Typography variant="body2"><strong>License only:</strong> Delivery centered on license key issuance without hosted file download.</Typography>
            <Typography variant="body2"><strong>Access code:</strong> Optional private code associated with the asset (stored securely).</Typography>
            <Typography variant="body2"><strong>Access code hint:</strong> Non-sensitive hint shown when full code should not be exposed.</Typography>
            <Typography variant="body2"><strong>Instructions:</strong> Customer-facing usage steps shown in My Bookings and access context.</Typography>
            <Typography variant="body2"><strong>Digital delivery mode:</strong> Product-level rule for hosted/external/license combinations.</Typography>
            <Typography variant="body2"><strong>Primary asset:</strong> Main asset used as default release target for the product.</Typography>
            <Typography variant="body2"><strong>Payment required:</strong> Access unlocks only after payment confirmation.</Typography>
            <Typography variant="body2"><strong>Unlimited access / expiration days:</strong> Controls whether entitlement expires and after how many days.</Typography>
            <Typography variant="body2"><strong>Max downloads:</strong> Optional cap on successful downloads per entitlement.</Typography>
            <Typography variant="body2"><strong>Licensing enabled:</strong> Triggered by delivery mode including license behavior.</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Example setups</Typography>
          <Stack spacing={1}>
            <Typography variant="body2"><strong>PDF ebook after payment:</strong> Create hosted asset, map as primary, set payment required, no expiration.</Typography>
            <Typography variant="body2"><strong>ZIP/template pack with code:</strong> Hosted asset + access code, show hint in customer view, set max downloads (for example 5).</Typography>
            <Typography variant="body2"><strong>External course link:</strong> External-link asset, add instructions for login steps, keep My Bookings as customer access hub.</Typography>
            <Typography variant="body2"><strong>License-only software key:</strong> License-only mode, no hosted file, use licensing section to track issued keys.</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Manager tips / best practices</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Keep Product modal simple: only mark digital there, do all digital setup here.</Typography>
            <Typography variant="body2">Use clear asset titles (for example: “Course Pack v2 PDF”).</Typography>
            <Typography variant="body2">Archive outdated assets instead of deleting references blindly.</Typography>
            <Typography variant="body2">Use code visibility “hint” when you need support-friendly verification without exposing full code.</Typography>
            <Typography variant="body2">Set expiration and max downloads only when business policy requires it.</Typography>
          </Stack>

          <Divider />

          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Important notes / guardrails</Typography>
          <Stack spacing={1}>
            <Typography variant="body2">Checkout and customer pages consume resolved configuration from this workspace; they are not setup surfaces.</Typography>
            <Typography variant="body2">Customer long-term access lives in My Bookings; each short-lived access link is temporary by design.</Typography>
            <Typography variant="body2">Hosted files use Schedulaa storage. External links are fallback mode when you host elsewhere.</Typography>
            <Typography variant="body2">Licensing and Access Audit sections may show placeholder or limited data until dedicated manager list endpoints are available.</Typography>
            <Typography variant="body2">Customer-facing digital access still works independently of those manager reporting panels.</Typography>
          </Stack>
        </Stack>
      </Drawer>
    </Box>
  );
};

export default DigitalProductsWorkspace;
