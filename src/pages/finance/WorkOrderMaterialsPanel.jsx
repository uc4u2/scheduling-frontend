import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useSnackbar } from "notistack";
import {
  createWorkOrderMaterial,
  deleteWorkOrderMaterial,
  updateWorkOrderMaterial,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";

const buildBlankForm = () => ({
  title: "",
  description: "",
  qty_planned: 1,
  unit_cost: 0,
  taxable: false,
  tax_rate: "",
  sort_order: 0,
});

export default function WorkOrderMaterialsPanel({ workOrder, onChanged }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const tMaterials = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.workOrders.materials.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(buildBlankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const items = useMemo(() => Array.isArray(workOrder?.material_plans) ? workOrder.material_plans : [], [workOrder]);

  const openAdd = () => {
    setEditingId(null);
    setForm(buildBlankForm());
    setFormOpen(true);
    setError("");
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      title: row.title || "",
      description: row.description || "",
      qty_planned: row.qty_planned ?? 1,
      unit_cost: row.unit_cost ?? 0,
      taxable: !!row.taxable,
      tax_rate: row.tax_rate ?? "",
      sort_order: row.sort_order ?? 0,
    });
    setFormOpen(true);
    setError("");
  };

  const handleSave = async () => {
    if (!(form.title || "").trim()) {
      setError(tMaterials("errors.titleRequired", "Title is required."));
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      title: form.title,
      description: form.description || null,
      qty_planned: form.qty_planned || 0,
      unit_cost: form.unit_cost || 0,
      taxable: !!form.taxable,
      tax_rate: form.taxable && form.tax_rate !== "" ? form.tax_rate : null,
      sort_order: form.sort_order || 0,
    };
    try {
      if (editingId) {
        await updateWorkOrderMaterial(editingId, payload);
        enqueueSnackbar(tMaterials("snackbar.updated", "Planned material updated."), { variant: "success" });
      } else {
        await createWorkOrderMaterial(workOrder.id, payload);
        enqueueSnackbar(tMaterials("snackbar.added", "Planned material added."), { variant: "success" });
      }
      setFormOpen(false);
      onChanged?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tMaterials("errors.saveFailed", "Unable to save planned material."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    try {
      await deleteWorkOrderMaterial(row.id);
      enqueueSnackbar(tMaterials("snackbar.removed", "Planned material removed."), { variant: "success" });
      onChanged?.();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tMaterials("errors.removeFailed", "Unable to remove planned material."), { variant: "error" });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography variant="h6" fontWeight={800}>{tMaterials("title", "Planned Materials")}</Typography>
          <Typography variant="body2" color="text.secondary">{tMaterials("description", "These are planned materials only. Inventory changes happen later through manager review approval.")}</Typography>
        </Box>
        <Button variant="outlined" onClick={openAdd}>{tMaterials("addPlannedMaterial", "Add Planned Material")}</Button>
      </Stack>

      <Collapse in={formOpen}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 1,
            borderColor: alpha(theme.palette.secondary.main, 0.22),
            backgroundColor: alpha(theme.palette.secondary.main, 0.03),
          }}
        >
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label={tMaterials("fields.title", "Title")} value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} fullWidth />
              <TextField label={tMaterials("fields.sortOrder", "Sort order")} type="number" value={form.sort_order} onChange={(e) => setForm((current) => ({ ...current, sort_order: e.target.value }))} sx={{ minWidth: 160 }} />
            </Stack>
            <TextField label={tMaterials("fields.description", "Description")} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} fullWidth multiline minRows={2} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label={tMaterials("fields.plannedQuantity", "Planned quantity")} type="number" inputProps={{ min: 0, step: 0.25 }} value={form.qty_planned} onChange={(e) => setForm((current) => ({ ...current, qty_planned: e.target.value }))} fullWidth />
              <TextField label={tMaterials("fields.unitCost", "Unit cost")} type="number" inputProps={{ min: 0, step: 0.01 }} value={form.unit_cost} onChange={(e) => setForm((current) => ({ ...current, unit_cost: e.target.value }))} fullWidth />
              <TextField label={tMaterials("fields.taxRate", "Tax rate")} type="number" inputProps={{ min: 0, step: 0.01 }} value={form.tax_rate} onChange={(e) => setForm((current) => ({ ...current, tax_rate: e.target.value }))} fullWidth disabled={!form.taxable} />
            </Stack>
            <FormControlLabel control={<Checkbox checked={!!form.taxable} onChange={(e) => setForm((current) => ({ ...current, taxable: e.target.checked }))} />} label={tMaterials("fields.taxable", "Taxable")} />
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setFormOpen(false)} disabled={saving}>{tMaterials("common.cancel", "Cancel")}</Button>
              <Button variant="contained" onClick={handleSave} disabled={saving}>{editingId ? tMaterials("common.saveMaterial", "Save Material") : tMaterials("common.addMaterial", "Add Material")}</Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {items.length === 0 ? (
        <FinanceEmptyState
          title={tMaterials("empty.title", "No planned materials yet")}
          description={tMaterials("empty.description", "Copy them from an estimate or add them here to keep the job scope clear for the team.")}
          actionLabel={tMaterials("empty.action", "Add planned material")}
          onAction={openAdd}
        />
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{tMaterials("table.headers.title", "Title")}</TableCell>
                <TableCell>{tMaterials("table.headers.quantity", "Quantity")}</TableCell>
                <TableCell>{tMaterials("table.headers.unitCost", "Unit cost")}</TableCell>
                <TableCell>{tMaterials("table.headers.plannedTotal", "Planned total")}</TableCell>
                <TableCell>{tMaterials("table.headers.taxable", "Taxable")}</TableCell>
                <TableCell>{tMaterials("table.headers.sort", "Sort")}</TableCell>
                <TableCell align="right">{tMaterials("table.headers.actions", "Actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2">{row.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.description || ""}</Typography>
                  </TableCell>
                  <TableCell>{row.qty_planned ?? 0}</TableCell>
                  <TableCell>{row.unit_cost ?? 0}</TableCell>
                  <TableCell>{row.planned_total ?? 0}</TableCell>
                  <TableCell>{row.taxable ? tMaterials("yes", "Yes") : tMaterials("no", "No")}</TableCell>
                  <TableCell>{row.sort_order ?? 0}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title={tMaterials("table.edit", "Edit planned material")}><IconButton onClick={() => openEdit(row)}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title={tMaterials("table.delete", "Delete planned material")}><IconButton color="error" onClick={() => handleDelete(row)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
