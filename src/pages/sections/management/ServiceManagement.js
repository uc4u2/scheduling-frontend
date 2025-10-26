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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Add, Edit, Delete } from "@mui/icons-material";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "";

const emptyForm = {
  name: "",
  category: "",
  duration: 60,
  base_price: 0,
  description: "",
};

const ServiceManagement = ({ token }) => {
  const { t, i18n } = useTranslation();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [snk, setSnk] = useState({ open: false, key: "" });

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const columns = useMemo(
    () => [
      { field: "name", headerName: t("manager.service.columns.name"), flex: 1 },
      { field: "category", headerName: t("manager.service.columns.category"), flex: 1 },
      { field: "duration", headerName: t("manager.service.columns.duration"), width: 100 },
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
      const { data } = await axios.get(`${API}/booking/services?active=true`, auth);
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
    setForm(row ? { ...row } : emptyForm);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("manager.service.confirmDelete"))) return;
    try {
      await axios.delete(`${API}/booking/services/${id}`, auth);
      await load();
      setSnk({ open: true, key: "manager.service.messages.deleted" });
    } catch (err) {
      console.error("ServiceManagement delete error", err);
      setSnk({ open: true, key: "manager.service.messages.deleteFailed" });
    }
  };

  const save = async () => {
    try {
      if (editing) {
        await axios.put(`${API}/booking/services/${editing.id}`, form, auth);
        setSnk({ open: true, key: "manager.service.messages.updated" });
      } else {
        await axios.post(`${API}/booking/services`, form, auth);
        setSnk({ open: true, key: "manager.service.messages.added" });
      }
      handleCloseDialog();
      load();
    } catch (err) {
      console.error("ServiceManagement save error", err);
      setSnk({ open: true, key: "manager.service.messages.saveFailed" });
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        {t("manager.service.title")}
      </Typography>

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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t("manager.service.dialog.cancel")}</Button>
          <Button onClick={save} variant="contained">
            {editing ? t("manager.service.dialog.update") : t("manager.service.dialog.create")}
          </Button>
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
