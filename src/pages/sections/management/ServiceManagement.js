// src/pages/sections/management/ServiceManagement.js

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  Stack,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormControlLabel,
  FormLabel,
  Tooltip,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Add,
  Edit,
  Delete,
  PhotoCamera,
  CloudUpload,
  DeleteOutline,
  InfoOutlined,
  ExpandMore,
} from "@mui/icons-material";
import api from "../../../utils/api";

const emptyForm = {
  name: "",
  category: "",
  duration: 60,
  base_price: 0,
  description: "",
  booking_mode: "one_to_one",
  default_capacity: 1,
  allow_packages: false,
};

const emptyPackageForm = {
  template_id: null,
  name: "",
  session_qty: 5,
  price: 0,
  expires_in: "",
};

const ServiceManagement = ({ token }) => {
  const { t, i18n } = useTranslation();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [packageLoading, setPackageLoading] = useState(false);
  const [snk, setSnk] = useState({ open: false, key: "" });
  const [imageModal, setImageModal] = useState(false);
  const [imageTarget, setImageTarget] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const columns = useMemo(
    () => [
      { field: "name", headerName: t("manager.service.columns.name"), flex: 1 },
      { field: "category", headerName: t("manager.service.columns.category"), flex: 1 },
      { field: "duration", headerName: t("manager.service.columns.duration"), width: 100 },
      {
        field: "booking_mode",
        headerName: t("manager.service.columns.bookingMode", "Booking type"),
        width: 140,
        valueFormatter: (params) =>
          params.value === "group"
            ? t("manager.service.booking.group", "Group")
            : t("manager.service.booking.oneToOne", "1:1"),
      },
      {
        field: "default_capacity",
        headerName: t("manager.service.columns.capacity", "Capacity"),
        width: 110,
        valueFormatter: (params) =>
          params.row?.booking_mode === "group"
            ? Number(params.value || 1)
            : "-",
      },
      {
        field: "base_price",
        headerName: t("manager.service.columns.price"),
        width: 140,
        valueFormatter: (params) => `$${Number(params.value).toFixed(2)}`,
      },
      {
        field: "actions",
        headerName: t("manager.service.columns.actions"),
        width: 160,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <>
            <IconButton
              color="primary"
              onClick={() => openImages(params.row)}
            >
              <PhotoCamera />
            </IconButton>
            <IconButton onClick={() => show(params.row)}>
              <Edit />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(params.row.id)}>
              <Delete />
            </IconButton>
          </>
        ),
      },
    ],
    [i18n.language, t]
  );

  const localeText = useMemo(
    () => ({
      noRowsLabel: t("manager.service.table.noRows"),
      footerRowPerPage: t("common.rowsPerPage"),
    }),
    [i18n.language, t]
  );

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/booking/services?active=true`, auth);
      setServices(data);
    } catch (err) {
      console.error("ServiceManagement load error", err);
      setSnk({ open: true, key: "manager.service.messages.loadError" });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show = (row = null) => {
    setEditing(row);
    if (row) {
      setForm({
        ...emptyForm,
        ...row,
        booking_mode: row.booking_mode || "one_to_one",
        default_capacity: Number(row.default_capacity || 1),
        allow_packages: Boolean(row.allow_packages),
      });
      setPackageForm(emptyPackageForm);
      if (row.allow_packages) {
        loadPackageTemplate(row.id, row.name);
      }
    } else {
      setForm(emptyForm);
      setPackageForm(emptyPackageForm);
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setPackageForm(emptyPackageForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("manager.service.confirmDelete"))) return;
    try {
      await api.delete(`/booking/services/${id}`, auth);
      await load();
      setSnk({ open: true, key: "manager.service.messages.deleted" });
    } catch (err) {
      console.error("ServiceManagement delete error", err);
      setSnk({ open: true, key: "manager.service.messages.deleteFailed" });
    }
  };

  const save = async () => {
    try {
      if (form.allow_packages) {
        if (packageLoading) {
          setSnk({ open: true, key: "Package settings are still loading." });
          return;
        }
        const sessionQty = Math.max(1, Number(packageForm.session_qty) || 1);
        const price = Number(packageForm.price) || 0;
        const expiresIn =
          packageForm.expires_in === "" ? null : Number(packageForm.expires_in);
        if (sessionQty < 1 || price < 0) {
          setSnk({ open: true, key: "Package settings need valid values." });
          return;
        }
        if (Number.isFinite(expiresIn) && expiresIn < 1) {
          setSnk({ open: true, key: "Expiry must be 1 day or more." });
          return;
        }
      }
      if (editing) {
        await api.put(`/booking/services/${editing.id}`, form, auth);
        if (form.allow_packages) {
          await upsertPackageTemplate(editing.id, form.name);
        }
        setSnk({ open: true, key: "manager.service.messages.updated" });
      } else {
        const { data } = await api.post(`/booking/services`, form, auth);
        if (form.allow_packages && data?.id) {
          await upsertPackageTemplate(data.id, form.name);
        }
        setSnk({ open: true, key: "manager.service.messages.added" });
      }
      handleCloseDialog();
      load();
    } catch (err) {
      console.error("ServiceManagement save error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    }
  };

  const loadPackageTemplate = async (serviceId, serviceName) => {
    if (!serviceId) return;
    setPackageLoading(true);
    try {
      const { data } = await api.get(`/booking/packages?service_id=${serviceId}`, auth);
      const tmpl = Array.isArray(data) ? data[0] : null;
      if (tmpl) {
        setPackageForm({
          template_id: tmpl.id,
          name: tmpl.name || "",
          session_qty: Number(tmpl.session_qty || 1),
          price: Number(tmpl.price || 0),
          expires_in: tmpl.expires_in ?? "",
        });
      } else {
        setPackageForm({
          ...emptyPackageForm,
          name: serviceName ? `${serviceName} package` : "",
        });
      }
    } catch (err) {
      console.error("ServiceManagement loadPackageTemplate error", err);
    } finally {
      setPackageLoading(false);
    }
  };

  const upsertPackageTemplate = async (serviceId, serviceName) => {
    const sessionQty = Math.max(1, Number(packageForm.session_qty) || 1);
    const price = Number(packageForm.price) || 0;
    const expiresIn = packageForm.expires_in === "" ? null : Number(packageForm.expires_in);
    const payload = {
      name: packageForm.name || (serviceName ? `${serviceName} package` : "Package"),
      service_id: serviceId,
      session_qty: sessionQty,
      price,
      expires_in: Number.isFinite(expiresIn) ? expiresIn : null,
    };
    if (packageForm.template_id) {
      await api.patch(`/booking/packages/${packageForm.template_id}`, payload, auth);
      return;
    }
    const { data } = await api.post(`/booking/packages`, payload, auth);
    if (data?.id) {
      setPackageForm((prev) => ({ ...prev, template_id: data.id }));
    }
  };

  const openImages = async (row) => {
    setImageModal(true);
    setImageTarget(null);
    try {
      const { data } = await api.get(`/booking/services/${row.id}`, auth);
      setImageTarget(data);
    } catch (err) {
      console.error("ServiceManagement openImages error", err);
      setSnk({ open: true, key: "manager.service.messages.loadError" });
    }
  };

  const closeImages = () => {
    setImageModal(false);
    setImageTarget(null);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !imageTarget) return;

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    try {
      await api.post(
        `/booking/services/${imageTarget.id}/images`,
        formData,
        {
          ...auth,
          headers: {
            ...auth.headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const { data } = await api.get(`/booking/services/${imageTarget.id}`, auth);
      setImageTarget(data);
      setSnk({ open: true, key: "manager.service.messages.updated" });
    } catch (err) {
      console.error("ServiceManagement upload image error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    } finally {
      setImageUploading(false);
      if (event?.target) {
        event.target.value = "";
      }
    }
  };

  const removeImage = async (imageId) => {
    if (!imageTarget) return;
    try {
      await api.delete(`/booking/service-images/${imageId}`, auth);
      const { data } = await api.get(`/booking/services/${imageTarget.id}`, auth);
      setImageTarget(data);
      setSnk({ open: true, key: "manager.service.messages.updated" });
    } catch (err) {
      console.error("ServiceManagement remove image error", err);
      setSnk({ open: true, key: "manager.service.messages.deleteFailed" });
    }
  };

  return (
    <Box p={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h4">{t("manager.service.title")}</Typography>
        <Button
          variant="outlined"
          startIcon={<InfoOutlined />}
          onClick={() => setHelpOpen(true)}
        >
          {t("manager.service.help", "Help")}
        </Button>
      </Stack>

      <Button startIcon={<Add />} variant="contained" sx={{ mb: 2 }} onClick={() => show()}>
        {t("manager.service.buttonAdd")}
      </Button>

      <Paper>
        <DataGrid
          rows={services}
          loading={loading}
          autoHeight
          disableSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          paginationModel={{ pageSize: 10, page: 0 }}
          columns={columns}
          localeText={localeText}
          getRowId={(row) => row.id}
        />
      </Paper>

      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t("manager.service.dialog.editTitle") : t("manager.service.dialog.addTitle")}
        </DialogTitle>
        <DialogContent>
          <TextField
            label={t("manager.service.dialog.name")}
            fullWidth
            margin="dense"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <TextField
            label={t("manager.service.dialog.category")}
            fullWidth
            margin="dense"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          />
          <TextField
            label={t("manager.service.dialog.duration")}
            type="number"
            fullWidth
            margin="dense"
            value={form.duration}
            onChange={(event) =>
              setForm({ ...form, duration: Number(event.target.value) || 0 })
            }
          />
          <TextField
            label={t("manager.service.dialog.basePrice")}
            type="number"
            fullWidth
            margin="dense"
            value={form.base_price}
            onChange={(event) =>
              setForm({ ...form, base_price: Number(event.target.value) || 0 })
            }
          />
          <TextField
            label={t("manager.service.dialog.description")}
            multiline
            rows={3}
            fullWidth
            margin="dense"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />

          <Divider sx={{ my: 2 }} />

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="subtitle1" fontWeight={600}>
              {t("manager.service.dialog.bookingSettings", "Booking settings")}
            </Typography>
            <Tooltip
              title="Choose how this service is booked and whether packages can be used."
            >
              <IconButton size="small" aria-label="Booking settings info">
                <InfoOutlined fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Stack>

          <FormControl component="fieldset" sx={{ mt: 1 }}>
            <FormLabel component="legend">
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{t("manager.service.dialog.bookingType", "Booking type")}</span>
                <Tooltip
                  title="One-to-one is a single client per time slot. Group/Class allows multiple clients up to the slot capacity."
                >
                  <IconButton size="small" aria-label="Booking type info">
                    <InfoOutlined fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </FormLabel>
            <RadioGroup
              row
              value={form.booking_mode}
              onChange={(event) =>
                setForm({
                  ...form,
                  booking_mode: event.target.value,
                  default_capacity:
                    event.target.value === "group"
                      ? Math.max(1, Number(form.default_capacity || 1))
                      : 1,
                })
              }
            >
              <FormControlLabel
                value="one_to_one"
                control={<Radio />}
                label={t("manager.service.booking.oneToOne", "One-to-one")}
              />
              <FormControlLabel
                value="group"
                control={<Radio />}
                label={t("manager.service.booking.group", "Group / Class")}
              />
            </RadioGroup>
          </FormControl>

          {form.booking_mode === "group" && (
            <TextField
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{t("manager.service.dialog.defaultCapacity", "Default capacity")}</span>
                  <Tooltip title="Maximum seats available per slot for this group service.">
                    <IconButton size="small" aria-label="Default capacity info">
                      <InfoOutlined fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
              type="number"
              fullWidth
              margin="dense"
              inputProps={{ min: 1 }}
              value={form.default_capacity}
              onChange={(event) =>
                setForm({
                  ...form,
                  default_capacity: Math.max(1, Number(event.target.value) || 1),
                })
              }
            />
          )}

          <FormControlLabel
            sx={{ mt: 1 }}
            control={
              <Checkbox
                checked={Boolean(form.allow_packages)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setForm({ ...form, allow_packages: checked });
                  if (checked && !packageForm.name) {
                    setPackageForm((prev) => ({
                      ...prev,
                      name: form.name ? `${form.name} package` : prev.name,
                    }));
                  }
                }}
              />
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>
                  {t("manager.service.dialog.allowPackages", "Allow package redemption")}
                </span>
                <Tooltip title="Lets clients book this service using a prepaid package balance.">
                  <IconButton size="small" aria-label="Package redemption info">
                    <InfoOutlined fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>
            }
          />

          {form.allow_packages && (
            <Box mt={2}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {t("manager.service.dialog.packageSettings", "Package settings")}
                </Typography>
                <Tooltip title="Define how many sessions and the price for a prepaid package tied to this service.">
                  <IconButton size="small" aria-label="Package settings info">
                    <InfoOutlined fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Stack>

              {packageLoading ? (
                <Stack direction="row" alignItems="center" spacing={1} py={1}>
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    {t("manager.service.dialog.packageLoading", "Loading package settings...")}
                  </Typography>
                </Stack>
              ) : (
                <Stack spacing={1}>
                  <TextField
                    label={t("manager.service.dialog.packageName", "Package name")}
                    fullWidth
                    margin="dense"
                    value={packageForm.name}
                    onChange={(event) =>
                      setPackageForm({ ...packageForm, name: event.target.value })
                    }
                    placeholder={
                      form.name ? `${form.name} package` : "5 sessions for $400"
                    }
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <TextField
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <span>
                            {t(
                              "manager.service.dialog.packageSessions",
                              "Sessions in package"
                            )}
                          </span>
                          <Tooltip title="Number of credits in the package. Each booking uses 1 credit.">
                            <IconButton size="small" aria-label="Package sessions info">
                              <InfoOutlined fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                      type="number"
                      fullWidth
                      margin="dense"
                      inputProps={{ min: 1 }}
                      value={packageForm.session_qty}
                      onChange={(event) =>
                        setPackageForm({
                          ...packageForm,
                          session_qty: Math.max(1, Number(event.target.value) || 1),
                        })
                      }
                    />
                    <TextField
                      label={
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <span>
                            {t("manager.service.dialog.packagePrice", "Package price")}
                          </span>
                          <Tooltip title="Total amount the client pays for the full package.">
                            <IconButton size="small" aria-label="Package price info">
                              <InfoOutlined fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                      type="number"
                      fullWidth
                      margin="dense"
                      value={packageForm.price}
                      onChange={(event) =>
                        setPackageForm({
                          ...packageForm,
                          price: Number(event.target.value) || 0,
                        })
                      }
                    />
                  </Stack>
                  <TextField
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>
                          {t(
                            "manager.service.dialog.packageExpiry",
                            "Expires in (days)"
                          )}
                        </span>
                        <Tooltip title="Credits expire this many days after purchase. Leave blank for no expiry.">
                          <IconButton size="small" aria-label="Package expiry info">
                            <InfoOutlined fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                    type="number"
                    fullWidth
                    margin="dense"
                    inputProps={{ min: 0 }}
                    value={packageForm.expires_in}
                    onChange={(event) =>
                      setPackageForm({
                        ...packageForm,
                        expires_in: event.target.value,
                      })
                    }
                    helperText={t(
                      "manager.service.dialog.packageExpiryHelp",
                      "Leave blank for no expiration."
                    )}
                  />
                </Stack>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t("manager.service.dialog.cancel")}</Button>
          <Button
            onClick={save}
            variant="contained"
            disabled={Boolean(form.allow_packages && packageLoading)}
          >
            {editing ? t("manager.service.dialog.update") : t("manager.service.dialog.create")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("manager.service.help.title", "Service setup help")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              {t(
                "manager.service.help.subtitle",
                "Use services for appointments, classes, and workshops. Keep each service clear and easy to book."
              )}
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  {t("manager.service.help.quickStart", "Quick start")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.quickStart.step1",
                      "1) Add a service name and category your clients understand."
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.quickStart.step2",
                      "2) Set the duration and base price shown in booking."
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.quickStart.step3",
                      "3) Choose booking type and save."
                    )}
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  {t("manager.service.help.bookingType", "Booking type")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.bookingType.oneToOne",
                      "One-to-one: one client per time slot."
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.bookingType.group",
                      "Group/Class: multiple clients can book the same slot up to capacity."
                    )}
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  {t("manager.service.help.capacity", "Default capacity")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {t(
                    "manager.service.help.capacity.text",
                    "For group services, set how many seats are available per time slot."
                  )}
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  {t("manager.service.help.packages", "Allow package redemption")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.packages.desc",
                      "Lets clients book using a prepaid package balance instead of paying each time."
                    )}
                  </Typography>
                  <Typography variant="body2">
                    {t(
                      "manager.service.help.packages.example",
                      "Example: A “5 facials for $400” package gives 5 credits. Each booking uses 1 credit."
                    )}
                  </Typography>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle1">
                  {t("manager.service.help.images", "Images & description")}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {t(
                    "manager.service.help.images.text",
                    "Add 1–3 images and a short description so clients know what to expect."
                  )}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpOpen(false)}>
            {t("manager.service.help.close", "Close")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={imageModal} onClose={closeImages} maxWidth="md" fullWidth>
        <DialogTitle>{t("manager.service.images.title", "Service images")}</DialogTitle>
        <DialogContent dividers>
          {!imageTarget ? (
            <Box py={4} textAlign="center">
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                {imageTarget.name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  disabled={imageUploading}
                >
                  {t("manager.service.images.upload", "Upload image")}
                  <input hidden type="file" accept="image/*" onChange={handleFileUpload} />
                </Button>
                {imageUploading && (
                  <Typography variant="body2">
                    {t("manager.service.images.uploading", "Uploading…")}
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                {(imageTarget.images || []).map((img) => (
                  <Paper key={img.id} sx={{ p: 1, width: 160 }} variant="outlined">
                    <Box
                      sx={{
                        position: "relative",
                        pb: "100%",
                        borderRadius: 2,
                        overflow: "hidden",
                        mb: 1,
                      }}
                    >
                      <Box
                        component="img"
                        src={img.url_public || img.url}
                        alt={img.filename}
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" noWrap flex={1}>
                        {img.filename}
                      </Typography>
                      <IconButton size="small" onClick={() => removeImage(img.id)}>
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
                {(imageTarget.images || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t("manager.service.images.empty", "No images yet")}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImages}>{t("manager.service.images.close", "Close")}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snk.open}
        autoHideDuration={3000}
        message={snk.key ? t(snk.key) : ""}
        onClose={() => setSnk((prev) => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default ServiceManagement;
