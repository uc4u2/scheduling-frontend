import React, { useState } from "react";
import {
  Menu,
  MenuItem,
  Box,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Button,
  TableContainer,
  TablePagination,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import MoreVertOutlinedIcon from "@mui/icons-material/MoreVertOutlined";

function formatDateTime(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString();
}

function FlagChips({ lead }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", rowGap: 0.5 }}>
      {lead.is_subscribed ? <Chip size="small" color="success" label="Subscribed" variant="outlined" /> : null}
      {lead.is_duplicate ? <Chip size="small" color="warning" label="Duplicate" variant="outlined" /> : null}
      {lead.is_do_not_call ? <Chip size="small" color="error" label="Do not call" variant="outlined" /> : null}
      {!lead.is_subscribed && !lead.is_duplicate && !lead.is_do_not_call ? <Typography variant="caption" color="text.secondary">—</Typography> : null}
    </Stack>
  );
}

export default function LeadListTable({
  leads,
  total,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenLead,
  onCreateLead,
  onRowAction,
  loading = false,
  page = 0,
  perPage = 25,
  onPageChange,
  onPerPageChange,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuLeadId, setMenuLeadId] = useState(null);
  const allSelected = leads.length > 0 && leads.every((lead) => selectedIds.includes(lead.id));

  if (loading) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Loading leads…</Typography>
        <Typography variant="body2" color="text.secondary">
          Fetching assignments, callbacks, and current lead states.
        </Typography>
      </Paper>
    );
  }

  if (!leads.length) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", border: "1px dashed", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ mb: 1 }}>No leads found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No leads match the current filters. Create a new lead or widen the filter scope.
        </Typography>
        <Button variant="contained" onClick={onCreateLead}>Create Lead</Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
      <TableContainer sx={{ maxHeight: 620 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ backgroundColor: "background.paper" }}>
                <Checkbox checked={allSelected} onChange={onToggleSelectAll} />
              </TableCell>
              {["Company", "Contact", "Source", "Status", "Assigned Rep", "Last Outcome", "Callback At", "Flags"].map((label) => (
                <TableCell key={label} sx={{ backgroundColor: "background.paper", fontWeight: 700 }}>
                  {label}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ backgroundColor: "background.paper", fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead, index) => (
              <TableRow
                key={lead.id}
                hover
                sx={{
                  cursor: "pointer",
                  backgroundColor: selectedIds.includes(lead.id)
                    ? "action.selected"
                    : index % 2 === 1
                      ? "rgba(15, 23, 42, 0.015)"
                      : "transparent",
                }}
                onClick={() => onOpenLead(lead.id)}
              >
                <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                  <Checkbox checked={selectedIds.includes(lead.id)} onChange={() => onToggleSelect(lead.id)} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{lead.company_name}</Typography>
                  <Typography variant="caption" color="text.secondary">#{lead.id}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{lead.contact_name || "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">{lead.email || lead.phone || "No direct contact"}</Typography>
                </TableCell>
                <TableCell>{lead.source || "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={lead.status || "—"}
                    variant="outlined"
                    color={
                      lead.status === "converted"
                        ? "success"
                        : lead.status === "suppressed"
                          ? "default"
                          : lead.status === "duplicate"
                            ? "warning"
                            : "primary"
                    }
                  />
                </TableCell>
                <TableCell>{lead.assigned_rep_id || "—"}</TableCell>
                <TableCell>{lead.last_outcome || "—"}</TableCell>
                <TableCell>{formatDateTime(lead.callback_at)}</TableCell>
                <TableCell><FlagChips lead={lead} /></TableCell>
                <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                  <Tooltip title="Open lead details">
                    <IconButton size="small" onClick={() => onOpenLead(lead.id)}>
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Lead actions">
                    <IconButton
                      size="small"
                      onClick={(event) => {
                        setMenuAnchor(event.currentTarget);
                        setMenuLeadId(lead.id);
                      }}
                    >
                      <MoreVertOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ p: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            Showing {leads.length} of {total} leads
          </Typography>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => onPageChange?.(nextPage)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(event) => onPerPageChange?.(Number(event.target.value))}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Stack>
      </Box>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuLeadId(null);
        }}
      >
        {[
          ["view", "View"],
          ["edit", "Edit"],
          ["assign", "Assign"],
          ["unassign", "Unassign"],
          ["suppress", "Suppress"],
          ["restore", "Restore"],
          ["duplicate", "Mark duplicate"],
          ["delete", "Delete"],
        ].map(([value, label]) => (
          <MenuItem
            key={value}
            onClick={() => {
              onRowAction?.(value, menuLeadId);
              setMenuAnchor(null);
              setMenuLeadId(null);
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
