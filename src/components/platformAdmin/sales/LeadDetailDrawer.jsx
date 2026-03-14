import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import LeadActivityTimeline from "./LeadActivityTimeline";

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function toLocalDateTimeValue(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function DetailRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

const emptyEditForm = {
  company_name: "",
  contact_name: "",
  phone: "",
  email: "",
  website: "",
  industry: "",
  city: "",
  country: "",
  source: "",
  priority: 0,
  callback_at: "",
};

export default function LeadDetailDrawer({
  open,
  onClose,
  lead,
  assignments = [],
  lockInfo,
  activity,
  reps = [],
  onAssign,
  onUnassign,
  onUnlock,
  onRestore,
  onDelete,
  onSuppress,
  onMarkDuplicate,
  onConvert,
  onSaveEdit,
  actionState,
  onActionStateChange,
  onRunAction,
  initialTab = "overview",
  initialEditMode = false,
}) {
  const topOffset = { xs: 56, sm: 64 };
  const [tab, setTab] = useState(initialTab);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [editForm, setEditForm] = useState(emptyEditForm);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab || "overview");
    setEditMode(Boolean(initialEditMode));
  }, [initialEditMode, initialTab, open]);

  useEffect(() => {
    if (!lead) {
      setEditForm(emptyEditForm);
      return;
    }
    setEditForm({
      company_name: lead.company_name || "",
      contact_name: lead.contact_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      website: lead.website || "",
      industry: lead.industry || "",
      city: lead.city || "",
      country: lead.country || "",
      source: lead.source || "",
      priority: lead.priority ?? 0,
      callback_at: toLocalDateTimeValue(lead.callback_at),
    });
  }, [lead]);

  const repLabelById = useMemo(() => {
    const map = {};
    reps.forEach((rep) => {
      map[String(rep.id)] = rep.full_name;
    });
    return map;
  }, [reps]);

  const statusChips = useMemo(
    () => (
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
        <Chip size="small" label={lead?.status || "—"} color={lead?.status === "converted" ? "success" : "primary"} variant="outlined" />
        {lead?.is_subscribed ? <Chip size="small" label="Subscribed" color="success" variant="outlined" /> : null}
        {lead?.is_duplicate ? <Chip size="small" label="Duplicate" color="warning" variant="outlined" /> : null}
        {lead?.is_do_not_call ? <Chip size="small" label="Do not call" color="error" variant="outlined" /> : null}
      </Stack>
    ),
    [lead]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDrawer-paper": {
          top: topOffset,
          height: {
            xs: "calc(100% - 56px)",
            sm: "calc(100% - 64px)",
          },
        },
      }}
    >
      <Box sx={{ width: { xs: 390, md: 720 }, p: 3, backgroundColor: "background.default", minHeight: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">{lead?.company_name || "Lead details"}</Typography>
            <Typography variant="body2" color="text.secondary">
              Lead #{lead?.id || "—"} · Admin lead management workspace
            </Typography>
          </Box>
          <Button onClick={onClose}>Close</Button>
        </Stack>

        {!lead ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>Loading lead details…</Typography>
            <Typography variant="body2" color="text.secondary">
              Pulling the latest lead profile, queue state, assignment history, and activity.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {statusChips}
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{ borderBottom: "1px solid", borderColor: "divider" }}
            >
              <Tab value="overview" label="Overview" />
              <Tab value="assignment" label="Assignment" />
              <Tab value="queue" label="Queue / Conversion" />
              <Tab value="activity" label="Activity" />
              <Tab value="danger" label="Danger Zone" />
            </Tabs>

            {tab === "overview" ? (
              <Paper variant="outlined" sx={{ p: 2.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Box>
                    <Typography variant="subtitle2">Lead overview</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Inspect and update the core lead record without leaving the CRM page.
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    {editMode ? (
                      <>
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setEditMode(false);
                            setEditForm({
                              company_name: lead.company_name || "",
                              contact_name: lead.contact_name || "",
                              phone: lead.phone || "",
                              email: lead.email || "",
                              website: lead.website || "",
                              industry: lead.industry || "",
                              city: lead.city || "",
                              country: lead.country || "",
                              source: lead.source || "",
                              priority: lead.priority ?? 0,
                              callback_at: toLocalDateTimeValue(lead.callback_at),
                            });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() =>
                            onSaveEdit?.({
                              ...editForm,
                              priority: Number(editForm.priority || 0),
                              callback_at: editForm.callback_at ? new Date(editForm.callback_at).toISOString() : null,
                            })
                          }
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="outlined" onClick={() => setEditMode(true)}>Edit</Button>
                    )}
                  </Stack>
                </Stack>

                {editMode ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth required label="Company name" value={editForm.company_name} onChange={(e) => setEditForm((prev) => ({ ...prev, company_name: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Contact name" value={editForm.contact_name} onChange={(e) => setEditForm((prev) => ({ ...prev, contact_name: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Phone" value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Website" value={editForm.website} onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Industry" value={editForm.industry} onChange={(e) => setEditForm((prev) => ({ ...prev, industry: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="City" value={editForm.city} onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Country" value={editForm.country} onChange={(e) => setEditForm((prev) => ({ ...prev, country: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth label="Source" value={editForm.source} onChange={(e) => setEditForm((prev) => ({ ...prev, source: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="number" label="Priority" value={editForm.priority} onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.target.value }))} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Callback at"
                        type="datetime-local"
                        value={editForm.callback_at}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, callback_at: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                ) : (
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}><DetailRow label="Contact" value={lead.contact_name} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Phone" value={lead.phone} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Email" value={lead.email} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Website" value={lead.website} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Industry" value={lead.industry} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="City / Country" value={[lead.city, lead.country].filter(Boolean).join(", ")} /></Grid>
                    <Grid item xs={12} md={4}><DetailRow label="Source" value={lead.source} /></Grid>
                    <Grid item xs={12} md={4}><DetailRow label="Priority" value={String(lead.priority ?? 0)} /></Grid>
                    <Grid item xs={12} md={4}><DetailRow label="Callback at" value={formatDateTime(lead.callback_at)} /></Grid>
                  </Grid>
                )}
              </Paper>
            ) : null}

            {tab === "assignment" ? (
              <Paper variant="outlined" sx={{ p: 2.25 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2">Assignment control</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Admin can reassign, take back, or unlock leads without exposing bulk browsing to reps.
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Assigned rep" value={lead.assigned_rep_id ? repLabelById[String(lead.assigned_rep_id)] || `Rep #${lead.assigned_rep_id}` : null} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Assigned at" value={formatDateTime(lead.assigned_at)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Current lock owner" value={lead.locked_by_rep_id ? repLabelById[String(lead.locked_by_rep_id)] || `Rep #${lead.locked_by_rep_id}` : null} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DetailRow label="Locked at" value={formatDateTime(lead.locked_at)} />
                    </Grid>
                  </Grid>

                  <Alert severity={lockInfo?.valid_for_assigned_rep ? "info" : "warning"}>
                    {lockInfo?.valid_for_assigned_rep
                      ? "The assigned rep currently holds a valid lock on this lead."
                      : "No valid rep lock is active on this lead."}
                  </Alert>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    <Button variant="contained" onClick={onAssign}>
                      {lead.assigned_rep_id ? "Reassign lead" : "Assign lead"}
                    </Button>
                    <Button variant="outlined" color="warning" onClick={onUnassign} disabled={!lead.assigned_rep_id}>
                      Unassign / take back
                    </Button>
                    <Button variant="outlined" onClick={onUnlock} disabled={!lead.locked_by_rep_id}>
                      Force unlock
                    </Button>
                  </Stack>

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Assignment history</Typography>
                    {!assignments.length ? (
                      <Typography variant="body2" color="text.secondary">No assignment history yet.</Typography>
                    ) : (
                      <Stack spacing={1.25}>
                        {assignments.map((row) => (
                          <Paper key={row.id} variant="outlined" sx={{ p: 1.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {repLabelById[String(row.sales_rep_id)] || `Rep #${row.sales_rep_id}`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Assigned {formatDateTime(row.assigned_at)} · Released {formatDateTime(row.unassigned_at)}
                            </Typography>
                            {row.reason ? (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>{row.reason}</Typography>
                            ) : null}
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Paper>
            ) : null}

            {tab === "queue" ? (
              <Paper variant="outlined" sx={{ p: 2.25 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2">Queue and conversion state</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage queue eligibility, duplicate state, callback timing, and conversion linkage.
                    </Typography>
                  </Box>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} md={6}><DetailRow label="Last outcome" value={lead.last_outcome} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Callback at" value={formatDateTime(lead.callback_at)} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Linked sales deal" value={lead.sales_deal_id ? `Deal #${lead.sales_deal_id}` : null} /></Grid>
                    <Grid item xs={12} md={6}><DetailRow label="Converted company" value={lead.converted_company_id ? `Company #${lead.converted_company_id}` : null} /></Grid>
                  </Grid>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    <Chip size="small" label={lead.is_subscribed ? "Subscribed" : "Not subscribed"} variant="outlined" color={lead.is_subscribed ? "success" : "default"} />
                    <Chip size="small" label={lead.is_duplicate ? "Duplicate" : "Unique"} variant="outlined" color={lead.is_duplicate ? "warning" : "default"} />
                    <Chip size="small" label={lead.is_do_not_call ? "Do not call" : "Callable"} variant="outlined" color={lead.is_do_not_call ? "error" : "default"} />
                  </Stack>

                  <Divider />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Suppress reason"
                        value={actionState.suppressReason}
                        onChange={(e) => onActionStateChange("suppressReason", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Duplicate of lead ID"
                        value={actionState.duplicateOfLeadId}
                        onChange={(e) => onActionStateChange("duplicateOfLeadId", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Convert using company ID"
                        value={actionState.convertCompanyId}
                        onChange={(e) => onActionStateChange("convertCompanyId", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Convert using sales deal ID"
                        value={actionState.convertSalesDealId}
                        onChange={(e) => onActionStateChange("convertSalesDealId", e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Conversion note"
                        value={actionState.convertNote}
                        onChange={(e) => onActionStateChange("convertNote", e.target.value)}
                      />
                    </Grid>
                  </Grid>

                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    <Button variant="outlined" color="warning" onClick={() => onRunAction("suppress")}>
                      Suppress
                    </Button>
                    <Button variant="outlined" onClick={() => onRunAction("restore")}>
                      Restore
                    </Button>
                    <Button variant="outlined" color="warning" onClick={() => onRunAction("duplicate")}>
                      Mark duplicate
                    </Button>
                    <Button variant="contained" color="success" onClick={() => onRunAction("convert")}>
                      Convert lead
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ) : null}

            {tab === "activity" ? (
              <Paper variant="outlined" sx={{ p: 2.25 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Activity timeline</Typography>
                <LeadActivityTimeline activity={activity} />
              </Paper>
            ) : null}

            {tab === "danger" ? (
              <Paper variant="outlined" sx={{ p: 2.25, borderColor: "error.light" }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Danger Zone</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Use destructive actions only when the lead should be permanently removed from active operational use.
                </Typography>
                <Stack spacing={1}>
                  <Alert severity="warning">
                    Delete is blocked for converted, subscribed, or lead-to-deal-linked records.
                  </Alert>
                  <Button variant="outlined" color="error" onClick={onDelete}>
                    Delete lead
                  </Button>
                </Stack>
              </Paper>
            ) : null}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
