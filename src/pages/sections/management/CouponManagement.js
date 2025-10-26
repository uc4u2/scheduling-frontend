import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  IconButton,
  Snackbar,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import axios from "axios";
import { useTranslation } from "react-i18next";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

/** ------------------------------------------------------------------
 * Normalizers & helpers
 * ------------------------------------------------------------------ */

// Normalize a coupon object from backend into a consistent shape
function normalizeCoupon(raw) {
  // Try to derive applicable service ids from multiple possible fields
  let applicableIds = [];

  // 1) ideal field coming from backend serializer
  if (Array.isArray(raw.applicable_service_ids)) {
    applicableIds = raw.applicable_service_ids;
  }

  // 2) sometimes server returns applies_to_services as array of ids or objects
  else if (Array.isArray(raw.applies_to_services)) {
    if (raw.applies_to_services.length > 0 && typeof raw.applies_to_services[0] === "object") {
      applicableIds = raw.applies_to_services.map((s) => s.id);
    } else {
      applicableIds = raw.applies_to_services;
    }
  }

  // 3) sometimes relation is exposed as "services"
  else if (Array.isArray(raw.services)) {
    applicableIds = raw.services.map((s) => s.id);
  }

  // 4) last-ditch: singular keys some APIs use
  else if (Array.isArray(raw.service_ids)) {
    applicableIds = raw.service_ids;
  }

  return {
    id: raw.id,
    code: raw.code || "",
    discount_percent: Number(raw.discount_percent || 0),
    discount_fixed: Number(raw.discount_fixed || 0),
    min_order_value: Number(raw.min_order_value || 0),
    max_uses: Number(raw.max_uses || 0),
    used_count: Number(raw.used_count || raw.usage_count || 0),
    valid_to: raw.valid_to || raw.expires || null,
    is_active: typeof raw.is_active === "boolean" ? raw.is_active : !!raw.active,
    description: raw.description || "",
    applicable_service_ids: applicableIds,
    __raw: raw, // keep original for debugging if needed
  };
}

// Make sure we always send proper payload keys to the backend
function buildSavePayload(form) {
  const discount_percent = form.discount_type === "percent" ? Number(form.discount) : 0;
  const discount_fixed = form.discount_type === "fixed" ? Number(form.discount) : 0;

  return {
    code: String(form.code || "").trim().toUpperCase(),
    discount_percent,
    discount_fixed,
    min_order_value: Number(form.min_order_value || 0),
    max_uses: Number(form.max_uses || 0), // 0 = unlimited
    is_active: !!form.active,
    valid_to: form.expires ? new Date(form.expires).toISOString() : null,
    applies_to_services:
      Array.isArray(form.applies_to_services) && form.applies_to_services.length > 0
        ? form.applies_to_services
        : [], // send [] (means all services) to be explicit
    description: form.description || "",
  };
}

// Format service names from ids with fallback
function formatServiceNames(ids = [], services = [], t) {
  if (!ids || ids.length === 0) return t ? t("common.allServices") : "All Services";
  const names = ids
    .map((id) => {
      const svc = services.find((s) => String(s.id) === String(id));
      return svc ? svc.name : `#${id}`;
    })
    .join(", ");
  return names || (t ? t("common.allServices") : "All Services");
}

/** ------------------------------------------------------------------ */

const emptyForm = {
  code: "",
  discount_type: "percent", // "percent" or "fixed"
  discount: 0,
  min_order_value: 0,
  max_uses: 0, // 0 = unlimited
  expires: "",
  active: true,
  applies_to_services: [], // array of service ids for multi-select
  description: "",
};

const CouponManagement = ({ token }) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [load, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snk, setSnk] = useState({ open: false, msg: "" });
  const [services, setServices] = useState([]);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  /** Fetch the list of coupons, then hydrate details if list lacks services */
  const fetchCoupons = async () => {
    setLoad(true);
    try {
      const { data } = await axios.get(`${API}/booking/coupons`, auth);
      const list = Array.isArray(data) ? data : [];
      let normalized = list.map(normalizeCoupon);

      // Some backends omit applicable_service_ids in the list view.
      // Hydrate per-coupon details if missing.
      const needHydrate = normalized.filter((c) => c.applicable_service_ids.length === 0);
      if (needHydrate.length > 0) {
        const detailed = await Promise.all(
          needHydrate.map(async (c) => {
            try {
              const { data: d } = await axios.get(`${API}/booking/coupons/${c.id}`, auth);
              return normalizeCoupon(d);
            } catch {
              return c;
            }
          })
        );

        // merge back
        const detailMap = new Map(detailed.map((c) => [c.id, c]));
        normalized = normalized.map((c) => detailMap.get(c.id) || c);
      }

      setRows(normalized);
    } catch {
      setSnk({ open: true, msg: t("messages.errorLoadingCoupons") });
    }
    setLoad(false);
  };

  const fetchServices = async () => {
    try {
      const { data } = await axios.get(`${API}/booking/services`, auth);
      setServices(data || []);
    } catch {
      // ignore or toast
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save or update coupon
  const save = async () => {
    // Basic validation
    if (!String(form.code || "").trim()) {
      setSnk({ open: true, msg: t("messages.couponCodeRequired") });
      return;
    }
    const disc = Number(form.discount);
    if (!disc || disc <= 0) {
      setSnk({ open: true, msg: t("messages.discountGreaterThanZero") });
      return;
    }

    try {
      const payload = buildSavePayload(form);

      if (edit) {
        await axios.put(`${API}/booking/coupons/${edit.id}`, payload, auth);
        setSnk({ open: true, msg: t("messages.couponUpdated") });
      } else {
        await axios.post(`${API}/booking/coupons`, payload, auth);
        setSnk({ open: true, msg: t("messages.couponCreated") });
      }

      setOpen(false);
      await fetchCoupons();
    } catch (e) {
      setSnk({ open: true, msg: e?.response?.data?.error || t("messages.saveFailed") });
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t("messages.confirmDeleteCoupon"))) return;
    try {
      await axios.delete(`${API}/booking/coupons/${id}`, auth);
      await fetchCoupons();
      setSnk({ open: true, msg: t("messages.couponDeleted") });
    } catch {
      setSnk({ open: true, msg: t("messages.deleteFailed") });
    }
  };

  const show = async (row = null) => {
    setEdit(row);
    if (row) {
      // If we were given a row from the grid, make sure we use a fully normalized version
      let r = row;
      // If the row lacks services info, hydrate with detail endpoint so the multi-select checks are correct
      if (!Array.isArray(row.applicable_service_ids)) {
        try {
          const { data } = await axios.get(`${API}/booking/coupons/${row.id}`, auth);
          r = normalizeCoupon(data);
        } catch {
          r = normalizeCoupon(row);
        }
      } else {
        r = normalizeCoupon(row);
      }

      setForm({
        code: r.code || "",
        discount_type: r.discount_percent > 0 ? "percent" : "fixed",
        discount: r.discount_percent > 0 ? r.discount_percent : r.discount_fixed || 0,
        min_order_value: r.min_order_value || 0,
        max_uses: r.max_uses || 0,
        expires: r.valid_to ? String(r.valid_to).slice(0, 10) : "",
        active: r.is_active !== false,
        applies_to_services: r.applicable_service_ids || [],
        description: r.description || "",
      });
    } else {
      setForm(emptyForm);
    }
    setOpen(true);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        {t("titles.promotionsCoupons")}
      </Typography>

      <Button
        variant="contained"
        startIcon={<Add />}
        sx={{ mb: 2 }}
        onClick={() => show()}
      >
        {t("buttons.addCoupon")}
      </Button>

      <Paper>
        <DataGrid
          rows={rows}
          loading={load}
          autoHeight
          pageSize={10}
          getRowId={(row) => row.id}
          columns={[
            { field: "code", headerName: "Code", flex: 1, minWidth: 120 },
            {
              field: "discount",
              headerName: "Discount",
              width: 140,
              valueGetter: (params) => {
                if (params.row.discount_percent)
                  return `${Number(params.row.discount_percent).toFixed(0)}%`;
                if (params.row.discount_fixed)
                  return `$${Number(params.row.discount_fixed).toFixed(2)}`;
                return "-";
              },
            },
            {
              field: "min_order_value",
              headerName: "Min Order ($)",
              width: 140,
              valueGetter: (p) => Number(p.row.min_order_value || 0),
              valueFormatter: (params) =>
                params.value ? `$${Number(params.value).toFixed(2)}` : "-",
            },
            {
              field: "max_uses",
              headerName: "Max Uses",
              width: 120,
              valueGetter: (p) => Number(p.row.max_uses || 0),
              valueFormatter: (params) => (Number(params.value) === 0 ? t("common.unlimited") : params.value),
            },
            {
              field: "used_count",
              headerName: "Used",
              width: 100,
              valueGetter: (p) => Number(p.row.used_count || 0),
            },
            {
              field: "valid_to",
              headerName: "Expires",
              width: 140,
              valueFormatter: (params) =>
                params.value ? new Date(params.value).toLocaleDateString() : t("common.never"),
            },
            {
              field: "is_active",
              headerName: "Active",
              width: 100,
              renderCell: (params) => (params.value ? t("common.yes") : t("common.no")),
            },
            {
              field: "applicable_service_ids",
              headerName: "Services",
              flex: 1.2,
              minWidth: 220,
              valueGetter: (params) => {
                const ids = params.row.applicable_service_ids || [];
                return formatServiceNames(ids, services, t);
              },
            },
            {
              field: "actions",
              headerName: "",
              width: 140,
              sortable: false,
              renderCell: (p) => (
                <>
                  <IconButton onClick={() => show(p.row)} aria-label="Edit coupon">
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => remove(p.row.id)}
                    aria-label="Delete coupon"
                  >
                    <Delete />
                  </IconButton>
                </>
              ),
            },
          ]}
        />
      </Paper>

      {/* Dialog for Add/Edit */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{edit ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Code"
                fullWidth
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Discount Type</InputLabel>
                <Select
                  value={form.discount_type}
                  label="Discount Type"
                  onChange={(e) =>
                    setForm({ ...form, discount_type: e.target.value, discount: 0 })
                  }
                >
                  <MenuItem value="percent">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label={form.discount_type === "percent" ? "Discount %" : "Discount Amount ($)"}
                type="number"
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Minimum Order Value ($)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: "0.01" }}
                value={form.min_order_value}
                onChange={(e) => setForm({ ...form, min_order_value: e.target.value })}
                helperText="Order must reach this value to apply coupon"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Maximum Uses (0 = unlimited)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: "1" }}
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                helperText="How many times the coupon can be used in total"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                label="Expires"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.expires}
                onChange={(e) => setForm({ ...form, expires: e.target.value })}
                helperText="Leave blank for no expiration"
              />
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Applies To Services</InputLabel>
                <Select
                  multiple
                  value={form.applies_to_services}
                  onChange={(e) => {
                    // Keep ids as numbers where possible
                    const next = e.target.value.map((v) =>
                      typeof v === "string" && /^\d+$/.test(v) ? Number(v) : v
                    );
                    setForm({ ...form, applies_to_services: next });
                  }}
                  input={<OutlinedInput label="Applies To Services" />}
                  renderValue={(selected) => formatServiceNames(selected, services)}
                >
                  {services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <Checkbox checked={form.applies_to_services.indexOf(s.id) > -1} />
                      <ListItemText primary={s.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Active</InputLabel>
                <Select
                  value={String(!!form.active)}
                  label="Active"
                  onChange={(e) => setForm({ ...form, active: e.target.value === "true" })}
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description (optional)"
                fullWidth
                multiline
                minRows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            {edit ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snk.open}
        autoHideDuration={3000}
        message={snk.msg}
        onClose={() => setSnk({ ...snk, open: false })}
      />
    </Box>
  );
};

export default CouponManagement;


