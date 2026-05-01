import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  IconButton,
  MenuItem,
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
  listInventoryItems,
  updateWorkOrderMaterial,
} from "./financeApi";
import FinanceEmptyState from "./components/FinanceEmptyState";

const buildBlankForm = () => ({
  inventory_item_id: "",
  title: "",
  description: "",
  qty_planned: 1,
  unit_cost: 0,
  taxable: false,
  tax_rate: "",
  sort_order: 0,
});

const stockChipColor = (state) => {
  switch (state) {
    case "out_of_stock":
      return "error";
    case "low_available":
      return "warning";
    case "partially_available":
      return "info";
    default:
      return "success";
  }
};

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
  const [inventoryItems, setInventoryItems] = useState([]);

  const items = useMemo(() => Array.isArray(workOrder?.material_plans) ? workOrder.material_plans : [], [workOrder]);
  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((item) => String(item.id) === String(form.inventory_item_id)),
    [inventoryItems, form.inventory_item_id]
  );

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await listInventoryItems({ active: true, page: 1, per_page: 200 });
        if (!active) return;
        setInventoryItems(Array.isArray(res?.items) ? res.items : []);
      } catch (_err) {
        if (!active) return;
        setInventoryItems([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(buildBlankForm());
    setFormOpen(true);
    setError("");
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setForm({
      inventory_item_id: row.inventory_item_id || "",
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
      inventory_item_id: form.inventory_item_id || null,
      title: form.title,
      description: form.description || null,
      qty_planned: form.qty_planned || 0,
      unit_cost: form.unit_cost || 0,
      taxable: !!form.taxable,
      tax_rate: form.taxable && form.tax_rate !== "" ? form.tax_rate : null,
      sort_order: form.sort_order || 0,
    };
    try {
      let res;
      if (editingId) {
        res = await updateWorkOrderMaterial(editingId, payload);
        enqueueSnackbar(tMaterials("snackbar.updated", "Planned material updated."), { variant: "success" });
      } else {
        res = await createWorkOrderMaterial(workOrder.id, payload);
        enqueueSnackbar(tMaterials("snackbar.added", "Planned material added."), { variant: "success" });
      }
      if (Array.isArray(res?.warnings) && res.warnings.some((row) => row.code === "insufficient_available_stock")) {
        enqueueSnackbar(
          tMaterials(
            "snackbar.overAllocated",
            "This job reserves more than currently available. You can still save, but stock may need replenishment before the job."
          ),
          { variant: "warning" }
        );
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

  const handleInventoryItemChange = (value) => {
    const picked = inventoryItems.find((item) => String(item.id) === String(value));
    setForm((current) => ({
      ...current,
      inventory_item_id: value,
      title: picked && !(current.title || "").trim() ? picked.name : current.title,
      unit_cost: picked && (!current.unit_cost || Number(current.unit_cost) === 0) ? picked.cost_per_unit || 0 : current.unit_cost,
    }));
  };

  const selectedItemWarning = selectedInventoryItem && Number(form.qty_planned || 0) > Number(selectedInventoryItem.available_quantity || 0)
    ? tMaterials(
        "warnings.overAllocate",
        "This job reserves more than currently available. You can still save, but stock may need replenishment before the job."
      )
    : "";

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
            {selectedItemWarning ? <Alert severity="warning">{selectedItemWarning}</Alert> : null}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField
                select
                label={tMaterials("fields.inventoryItem", "Inventory item")}
                value={form.inventory_item_id}
                onChange={(e) => handleInventoryItemChange(e.target.value)}
                fullWidth
              >
                <MenuItem value="">{tMaterials("fields.noInventoryItem", "No inventory item linked")}</MenuItem>
                {inventoryItems.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({tMaterials("fields.availableShort", "Available")}: {item.available_quantity ?? item.current_quantity ?? 0})
                  </MenuItem>
                ))}
              </TextField>
              <TextField label={tMaterials("fields.title", "Title")} value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} fullWidth />
              <TextField label={tMaterials("fields.sortOrder", "Sort order")} type="number" value={form.sort_order} onChange={(e) => setForm((current) => ({ ...current, sort_order: e.target.value }))} sx={{ minWidth: 160 }} />
            </Stack>
            {selectedInventoryItem ? (
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                <Chip size="small" variant="outlined" label={tMaterials("availability.onHand", "On hand: {{count}}", { count: selectedInventoryItem.on_hand_quantity ?? selectedInventoryItem.current_quantity ?? 0 })} />
                <Chip size="small" variant="outlined" label={tMaterials("availability.reserved", "Reserved: {{count}}", { count: selectedInventoryItem.reserved_quantity ?? 0 })} />
                <Chip size="small" variant="outlined" label={tMaterials("availability.available", "Available: {{count}}", { count: selectedInventoryItem.available_quantity ?? selectedInventoryItem.current_quantity ?? 0 })} />
                <Chip size="small" color={stockChipColor(selectedInventoryItem.stock_conflict_state)} variant="outlined" label={selectedInventoryItem.stock_conflict_state ? selectedInventoryItem.stock_conflict_state.replaceAll("_", " ") : tMaterials("availability.fullyAvailable", "fully available")} />
              </Stack>
            ) : null}
            <TextField label={tMaterials("fields.description", "Description")} value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} fullWidth multiline minRows={2} />
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <TextField label={tMaterials("fields.plannedQuantity", "Planned quantity")} type="number" inputProps={{ min: 0, step: 0.25 }} value={form.qty_planned} onChange={(e) => setForm((current) => ({ ...current, qty_planned: e.target.value }))} fullWidth />
              <TextField label={tMaterials("fields.unitCost", "Unit cost")} type="number" inputProps={{ min: 0, step: 0.01 }} value={form.unit_cost} onChange={(e) => setForm((current) => ({ ...current, unit_cost: e.target.value }))} fullWidth />
              <TextField label={tMaterials("fields.taxRate", "Tax rate")} type="number" inputProps={{ min: 0, step: 0.01 }} value={form.tax_rate} onChange={(e) => setForm((current) => ({ ...current, tax_rate: e.target.value }))} fullWidth disabled={!form.taxable} />
            </Stack>
            {selectedInventoryItem ? (
              <Typography variant="body2" color={selectedItemWarning ? "warning.main" : "text.secondary"}>
                {tMaterials("availability.afterThisJob", "Available after this job: {{count}}", {
                  count: Number(selectedInventoryItem.available_quantity ?? 0) - Number(form.qty_planned || 0),
                })}
              </Typography>
            ) : null}
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
                <TableCell>{tMaterials("table.headers.inventory", "Inventory")}</TableCell>
                <TableCell>{tMaterials("table.headers.quantity", "Quantity")}</TableCell>
                <TableCell>{tMaterials("table.headers.onHand", "On hand")}</TableCell>
                <TableCell>{tMaterials("table.headers.reserved", "Reserved")}</TableCell>
                <TableCell>{tMaterials("table.headers.availableAfter", "Available after this job")}</TableCell>
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
                    {row.over_allocated ? (
                      <Typography variant="body2" color="warning.main">
                        {tMaterials("table.overAllocated", "Planned quantity exceeds current availability.")}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.inventory_item_name || tMaterials("table.notLinked", "Not linked")}</TableCell>
                  <TableCell>{row.qty_planned ?? 0}</TableCell>
                  <TableCell>{row.on_hand_quantity ?? "-"}</TableCell>
                  <TableCell>{row.currently_reserved_quantity ?? "-"}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.available_after_this_work_order ?? "-"}</Typography>
                    {row.stock_conflict_state ? (
                      <Chip
                        size="small"
                        color={stockChipColor(row.stock_conflict_state)}
                        variant="outlined"
                        label={row.stock_conflict_state.replaceAll("_", " ")}
                        sx={{ mt: 0.5 }}
                      />
                    ) : null}
                  </TableCell>
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
