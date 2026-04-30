import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
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
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { useTheme } from "@mui/material/styles";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import LinkIcon from "@mui/icons-material/Link";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { formatDateTimeInTz } from "../../utils/datetime";
import { getUserTimezone } from "../../utils/timezone";
import {
  createEstimateFromQuote,
  createQuoteRequest,
  linkQuoteClient,
  listManagerClients,
  listQuoteRequests,
  updateQuoteRequest,
} from "./financeApi";
import FinanceStatusChip from "./components/FinanceStatusChip";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinancePagination from "./components/FinancePagination";

const blankForm = {
  title: "",
  request_type: "",
  description: "",
  preferred_timeline: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  service_address: "",
  visible_notes: "",
  internal_notes: "",
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const formatSourceLabel = (requestType, sourceType, tQuote) => {
  const raw = normalizeText(requestType || sourceType);
  if (!raw) return tQuote("sources.manual", "Manual entry");
  if (raw === "whatsapp") return tQuote("sources.whatsapp", "WhatsApp note");
  if (raw === "phone") return tQuote("sources.phone", "Phone call");
  if (raw === "instagram") return tQuote("sources.instagram", "Instagram/DM");
  if (raw === "manual") return tQuote("sources.manual", "Manual entry");
  if (raw === "website" || raw === "website form" || raw === "website_form") {
    return tQuote("sources.website", "Website form");
  }
  return String(requestType || sourceType || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const hasEmailMismatch = (item) =>
  normalizeText(item?.contact_email) &&
  normalizeText(item?.client_email) &&
  normalizeText(item.contact_email) !== normalizeText(item.client_email);

const hasNameMismatch = (item) => {
  const contact = normalizeText(item?.contact_name);
  const client = normalizeText(item?.client_name);
  if (!contact || !client) return false;
  if (contact === client) return false;
  return !contact.includes(client) && !client.includes(contact);
};

const compactChipSx = {
  height: 24,
  borderRadius: 1.5,
  "& .MuiChip-label": {
    px: 1,
    fontWeight: 600,
  },
};

function QuoteActionMenu({ item, actions, moreActionsLabel, unavailableNote }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const run = (fn) => () => {
    handleClose();
    fn?.();
  };

  return (
    <>
      <Tooltip title={moreActionsLabel}>
        <IconButton size="small" onClick={handleOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ sx: { minWidth: 260, borderRadius: 2 } }}
      >
        {actions.map((action, index) => {
          if (action.type === "divider") {
            return <Divider key={`divider-${item.id}-${index}`} />;
          }
          return (
            <MenuItem
              key={`${item.id}-${action.label}`}
              onClick={run(action.onClick)}
              disabled={action.disabled}
              sx={{ py: 1 }}
            >
              {action.icon ? <Box sx={{ mr: 1.5, display: "inline-flex", color: "text.secondary" }}>{action.icon}</Box> : null}
              <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {action.label}
                </Typography>
                {action.help ? (
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "normal", lineHeight: 1.35 }}>
                    {action.help}
                  </Typography>
                ) : null}
              </Stack>
            </MenuItem>
          );
        })}
        {unavailableNote ? (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                {unavailableNote}
              </Typography>
            </Box>
          </>
        ) : null}
      </Menu>
    </>
  );
}

export default function QuoteRequestsPage({ createNonce, onNavigate }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const timezone = useMemo(() => getUserTimezone(), []);
  const tQuote = useCallback(
    (key, fallback, options = {}) => t(`manager.finance.quotes.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [linkTarget, setLinkTarget] = useState(null);
  const [linkClientId, setLinkClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", email: "", phone: "" });
  const [confirmEstimateTarget, setConfirmEstimateTarget] = useState(null);
  const [expandedOpen, setExpandedOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [quotes, managerClients] = await Promise.all([
        listQuoteRequests({
          status: status || undefined,
          q: search || undefined,
          page,
          per_page: perPage,
        }),
        listManagerClients(),
      ]);
      setItems(Array.isArray(quotes?.items) ? quotes.items : Array.isArray(quotes) ? quotes : []);
      setPagination(quotes?.pagination || null);
      setClients(managerClients);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || tQuote("errors.loadFailed", "Unable to load quote requests."));
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, status, tQuote]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (createNonce) {
      setEditing(null);
      setForm(blankForm);
      setDialogOpen(true);
    }
  }, [createNonce]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      request_type: item.request_type || "",
      description: item.description || "",
      preferred_timeline: item.preferred_timeline || "",
      contact_name: item.contact_name || "",
      contact_email: item.contact_email || "",
      contact_phone: item.contact_phone || "",
      service_address: item.service_address || "",
      visible_notes: item.visible_notes || "",
      internal_notes: item.internal_notes || "",
    });
    setDialogOpen(true);
  };

  const prefillClientFromContact = (item) => ({
    name: item?.contact_name || "",
    email: item?.contact_email || "",
    phone: item?.contact_phone || "",
  });

  const openLinkClientDialog = (item, preferCreate = false) => {
    setLinkTarget(item);
    setLinkClientId(preferCreate ? "" : item?.client_id ? String(item.client_id) : "");
    setNewClient(prefillClientFromContact(item));
  };

  const saveQuote = async () => {
    if (!form.title) {
      enqueueSnackbar(tQuote("errors.titleRequired", "Title is required."), { variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing) {
        await updateQuoteRequest(editing.id, payload);
        enqueueSnackbar(tQuote("snackbar.updated", "Quote request updated."), { variant: "success" });
      } else {
        await createQuoteRequest(payload);
        enqueueSnackbar(tQuote("snackbar.created", "Quote request created."), { variant: "success" });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tQuote("errors.saveFailed", "Unable to save quote request."), { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const patchStatus = async (item, nextStatus) => {
    try {
      await updateQuoteRequest(item.id, { status: nextStatus });
      enqueueSnackbar(tQuote("snackbar.updated", "Quote request updated."), { variant: "success" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tQuote("errors.updateFailed", "Unable to update quote request."), { variant: "error" });
    }
  };

  const createEstimateForQuote = async (item) => {
    try {
      const res = await createEstimateFromQuote(item.id);
      const estimate = res?.estimate || {};
      const clientName = item?.client_name || estimate?.client_name || tQuote("fallbacks.linkedClient", "the linked client");
      enqueueSnackbar(tQuote("snackbar.estimateCreated", "Estimate created for {{clientName}}.", { clientName }), { variant: "success" });
      await load();
      onNavigate?.("finance-estimates");
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tQuote("errors.createEstimateFailed", "Unable to create estimate."), { variant: "error" });
    }
  };

  const handleCreateEstimate = async (item) => {
    if (!item?.client_id) {
      enqueueSnackbar(tQuote("errors.clientRequiredForEstimate", "Link or create a client before creating an estimate."), { variant: "warning" });
      openLinkClientDialog(item, true);
      return;
    }
    if (hasEmailMismatch(item) || hasNameMismatch(item)) {
      setConfirmEstimateTarget(item);
      return;
    }
    await createEstimateForQuote(item);
  };

  const submitLinkClient = async () => {
    if (!linkTarget) return;
    const payload = linkClientId
      ? { client_id: Number(linkClientId) }
      : { create_client: { name: newClient.name, email: newClient.email, phone: newClient.phone } };
    try {
      await linkQuoteClient(linkTarget.id, payload);
      enqueueSnackbar(tQuote("snackbar.clientLinked", "Client linked to quote request."), { variant: "success" });
      setLinkTarget(null);
      setLinkClientId("");
      setNewClient({ name: "", email: "", phone: "" });
      await load();
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.error || err?.message || tQuote("errors.linkClientFailed", "Unable to link client."), { variant: "error" });
    }
  };

  const quoteCountLabel = pagination?.total || items.length;

  const renderQuoteTable = (expanded = false) => (
    <Paper variant="outlined" sx={{ overflow: "hidden", borderRadius: expanded ? 0 : 3, borderColor: expanded ? "transparent" : "divider" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: expanded ? 1380 : 980 }}>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: "background.default",
                "& .MuiTableCell-root": {
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: 0.2,
                  textTransform: "uppercase",
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell sx={{ minWidth: expanded ? 260 : 280 }}>{expanded ? tQuote("table.headers.title", "Title") : tQuote("table.headers.titleSource", "Title / Source")}</TableCell>
              <TableCell sx={{ minWidth: 170 }}>{tQuote("table.headers.status", "Status")}</TableCell>
              {expanded ? (
                <TableCell sx={{ minWidth: 220 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="inherit">{tQuote("table.headers.source", "Source")}</Typography>
                    <Tooltip title={tQuote("table.sourceTooltip", "This is a source label unless automation is connected.")}>
                      <InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </Tooltip>
                  </Stack>
                </TableCell>
              ) : null}
              <TableCell sx={{ minWidth: 220 }}>{tQuote("table.headers.requestContact", "Request Contact")}</TableCell>
              <TableCell sx={{ minWidth: expanded ? 260 : 240 }}>{tQuote("table.headers.linkedClient", "Linked Client")}</TableCell>
              <TableCell sx={{ minWidth: 150 }}>{expanded ? tQuote("table.headers.timeline", "Timeline") : tQuote("table.headers.timelineCreated", "Timeline / Created")}</TableCell>
              {expanded ? <TableCell sx={{ minWidth: 176 }}>{tQuote("table.headers.created", "Created")}</TableCell> : null}
              <TableCell sx={{ minWidth: expanded ? 280 : 220 }}>{tQuote("table.headers.description", "Description")}</TableCell>
              <TableCell
                align="right"
                sx={{
                  minWidth: expanded ? 300 : 280,
                  position: "sticky",
                  right: 0,
                  zIndex: 3,
                  bgcolor: "background.paper",
                  borderLeft: (themeArg) => `1px solid ${themeArg.palette.divider}`,
                }}
              >
                {tQuote("table.headers.actions", "Actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const hasLinkedClient = Boolean(item.client_id);
              const hasEstimate = item.status === "estimate_created";
              const primaryActions = hasEstimate
                ? [{ key: "open-estimates", label: tQuote("actions.openEstimates", "Open Estimates"), icon: <DescriptionOutlinedIcon fontSize="small" />, onClick: () => onNavigate?.("finance-estimates"), variant: "contained" }]
                : hasLinkedClient
                  ? [{ key: "create-estimate", label: tQuote("actions.createEstimate", "Create Estimate"), icon: <AddTaskOutlinedIcon fontSize="small" />, onClick: () => handleCreateEstimate(item), variant: "contained" }]
                  : [{ key: "link-client", label: tQuote("actions.linkCreateClient", "Link / Create Client"), icon: <LinkIcon fontSize="small" />, onClick: () => openLinkClientDialog(item, true), variant: "contained" }];
              const visibleKeys = new Set(primaryActions.map((action) => action.key));
              const allMenuActions = [
                {
                  key: "edit",
                  label: tQuote("actions.edit", "Edit"),
                  help: tQuote("actionHelp.edit", "Open the quote request editor to update intake details, contact info, notes, or service address."),
                  icon: <EditOutlinedIcon fontSize="small" />,
                  onClick: () => openEdit(item),
                },
                {
                  key: "mark-reviewed",
                  label: tQuote("actions.markReviewed", "Mark Reviewed"),
                  help: tQuote("actionHelp.markReviewed", "Use when the quote request has been triaged and is ready for the next manager step."),
                  icon: <TaskAltOutlinedIcon fontSize="small" />,
                  onClick: () => patchStatus(item, "reviewed"),
                },
                {
                  key: "link-client",
                  label: tQuote("actions.linkOrCreateClient", "Link or Create Client"),
                  help: tQuote("actionHelp.linkClient", "Connect the request to the official client record used for estimates, invoices, and work orders."),
                  icon: <LinkIcon fontSize="small" />,
                  onClick: () => openLinkClientDialog(item, !item.client_id),
                },
                {
                  key: "create-estimate",
                  label: tQuote("actions.createEstimate", "Create Estimate"),
                  help: tQuote("actionHelp.createEstimate", "Create the estimate after the right client is linked and the request details are confirmed."),
                  icon: <AddTaskOutlinedIcon fontSize="small" />,
                  onClick: () => handleCreateEstimate(item),
                  disabled: !item.client_id,
                },
                {
                  key: "open-estimates",
                  label: tQuote("actions.openEstimates", "Open Estimates"),
                  help: tQuote("actionHelp.openEstimates", "Jump to the estimates workspace after an estimate has already been created from this quote."),
                  icon: <DescriptionOutlinedIcon fontSize="small" />,
                  onClick: () => onNavigate?.("finance-estimates"),
                  disabled: !hasEstimate,
                },
                { type: "divider", key: "divider-1" },
                {
                  key: "close",
                  label: tQuote("actions.close", "Close"),
                  help: tQuote("actionHelp.close", "Use when the request is finished and does not need more follow-up."),
                  icon: <TaskAltOutlinedIcon fontSize="small" />,
                  onClick: () => patchStatus(item, "closed"),
                },
                {
                  key: "reject",
                  label: tQuote("actions.reject", "Reject"),
                  help: tQuote("actionHelp.reject", "Use when the request should be explicitly marked as not moving forward."),
                  icon: <BlockOutlinedIcon fontSize="small" />,
                  onClick: () => patchStatus(item, "rejected"),
                },
              ];
              const filteredActions = allMenuActions.filter((action) => action.type === "divider" || !visibleKeys.has(action.key));
              const menuActions = filteredActions.filter((action, index, arr) => {
                if (action.type !== "divider") return true;
                const prev = arr[index - 1];
                const next = arr[index + 1];
                return prev && prev.type !== "divider" && next && next.type !== "divider";
              });

              return (
                <TableRow
                  key={item.id}
                  hover
                  sx={{
                    "& .MuiTableCell-root": {
                      py: 1.5,
                      borderBottomColor: "divider",
                      verticalAlign: "top",
                    },
                  }}
                >
                  <TableCell>
                    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.35 }}>
                        {item.title || tQuote("fallbacks.untitled", "Untitled quote request")}
                      </Typography>
                      {!expanded ? (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {formatSourceLabel(item.request_type, item.source_type, tQuote)}{item.source_ref ? ` • ${item.source_ref}` : ""}
                        </Typography>
                      ) : item.request_type ? (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.request_type}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <FinanceStatusChip status={item.status} />
                  </TableCell>
                  {expanded ? (
                    <TableCell>
                      <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {formatSourceLabel(item.request_type, item.source_type, tQuote)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.source_ref || tQuote("fallbacks.noExternalReference", "No external reference")}
                        </Typography>
                      </Stack>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} noWrap>
                        {item.contact_name || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {item.contact_email || item.contact_phone || "-"}
                      </Typography>
                      {expanded && item.contact_email && item.contact_phone ? (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {item.contact_phone}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                      <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {item.client_name || tQuote("fallbacks.notLinked", "Not linked")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {item.client_email || tQuote("fallbacks.noClientEmail", "No client email")}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Chip size="small" variant="outlined" color={item.client_id ? "success" : "default"} label={item.client_id ? tQuote("chips.linked", "Linked") : tQuote("chips.notLinked", "Not linked")} sx={compactChipSx} />
                        {hasEmailMismatch(item) ? <Chip size="small" variant="outlined" color="warning" label={tQuote("chips.contactDiffers", "Contact differs from client")} sx={compactChipSx} /> : null}
                        {hasNameMismatch(item) ? <Chip size="small" variant="outlined" color="warning" label={tQuote("chips.checkClientMatch", "Check client match")} sx={compactChipSx} /> : null}
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                        {item.preferred_timeline || "-"}
                      </Typography>
                      {!expanded ? (
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                          {item.created_at ? formatDateTimeInTz(item.created_at, timezone) : "-"}
                        </Typography>
                      ) : null}
                    </Stack>
                  </TableCell>
                  {expanded ? (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {item.created_at ? formatDateTimeInTz(item.created_at, timezone) : "-"}
                      </Typography>
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: expanded ? 2 : 1,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        lineHeight: 1.45,
                        maxWidth: expanded ? 320 : 240,
                      }}
                    >
                      {item.description || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      position: "sticky",
                      right: 0,
                      zIndex: 2,
                      bgcolor: "background.paper",
                      borderLeft: (themeArg) => `1px solid ${themeArg.palette.divider}`,
                    }}
                  >
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" flexWrap="wrap" useFlexGap>
                      {primaryActions.map((action) => (
                        <Button
                          key={action.key}
                          size="small"
                          variant={action.variant}
                          startIcon={action.icon}
                          onClick={action.onClick}
                          disabled={action.disabled}
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          {action.label}
                        </Button>
                      ))}
                      <QuoteActionMenu
                        item={item}
                        actions={menuActions}
                        moreActionsLabel={tQuote("actions.moreActions", "More actions")}
                        unavailableNote={null}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          borderColor: "divider",
          background: (themeArg) => themeArg.palette.background.paper,
        }}
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ lg: "flex-start" }}>
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800}>
                {tQuote("page.title", "Quote Requests")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
                {tQuote(
                  "page.description",
                  "Capture custom job intake cleanly, verify the right client, and move the request into estimate workflow without losing source, contact, or timeline context."
                )}
              </Typography>
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" startIcon={<OpenInFullIcon />} onClick={() => setExpandedOpen(true)} disabled={loading || items.length === 0}>
                {tQuote("toolbar.expandView", "Expand View")}
              </Button>
              <Button variant="contained" startIcon={<AddTaskOutlinedIcon />} onClick={openCreate}>
                {tQuote("toolbar.newQuote", "New Quote")}
              </Button>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} alignItems={{ xl: "center" }} justifyContent="space-between">
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} sx={{ flex: 1 }}>
              <TextField
                size="small"
                label={tQuote("toolbar.searchLabel", "Search quotes")}
                placeholder={tQuote("toolbar.searchPlaceholder", "Title, contact, client, or source")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load();
                }}
                sx={{ minWidth: { xs: "100%", md: 320 } }}
              />
              <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 180 } }}>
                <InputLabel>{tQuote("toolbar.statusLabel", "Status")}</InputLabel>
                <Select label={tQuote("toolbar.statusLabel", "Status")} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                  <MenuItem value="">{tQuote("toolbar.allStatuses", "All statuses")}</MenuItem>
                  <MenuItem value="new">{t(`manager.finance.shared.statuses.new`, { defaultValue: "New" })}</MenuItem>
                  <MenuItem value="reviewed">{t(`manager.finance.shared.statuses.reviewed`, { defaultValue: "Reviewed" })}</MenuItem>
                  <MenuItem value="estimate_created">{t(`manager.finance.shared.statuses.estimate_created`, { defaultValue: "Estimate Created" })}</MenuItem>
                  <MenuItem value="closed">{t(`manager.finance.shared.statuses.closed`, { defaultValue: "Closed" })}</MenuItem>
                  <MenuItem value="rejected">{t(`manager.finance.shared.statuses.rejected`, { defaultValue: "Rejected" })}</MenuItem>
                </Select>
              </FormControl>
              <Button variant="outlined" onClick={load} sx={{ minWidth: 110 }}>
                {tQuote("toolbar.refresh", "Refresh")}
              </Button>
            </Stack>
            <Chip
              label={tQuote(
                Number(quoteCountLabel) === 1 ? "toolbar.countLabel_one" : "toolbar.countLabel_other",
                Number(quoteCountLabel) === 1 ? "{{count}} quote" : "{{count}} quotes",
                { count: quoteCountLabel }
              )}
              variant="outlined"
              sx={{ alignSelf: { xs: "flex-start", xl: "center" }, fontWeight: 700 }}
            />
          </Stack>
        </Stack>
      </Paper>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : items.length === 0 ? (
        <FinanceEmptyState
          title={tQuote("empty.title", "No quote requests yet")}
          description={tQuote("empty.description", "Create a quote request here or normalize public quote forms later.")}
          actionLabel={tQuote("empty.action", "Create quote")}
          onAction={openCreate}
        />
      ) : (
        renderQuoteTable(false)
      )}

      <FinancePagination
        pagination={pagination}
        page={page}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(next) => {
          setPerPage(next);
          setPage(1);
        }}
      />

      <Dialog fullScreen open={expandedOpen} onClose={() => setExpandedOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1.5 }}>
          <Stack spacing={0.25}>
            <Typography variant="h6" fontWeight={800}>{tQuote("expanded.title", "Quote Requests")}</Typography>
            <Typography variant="body2" color="text.secondary">{tQuote("expanded.description", "Expanded working view with sticky actions and full request columns.")}</Typography>
          </Stack>
          <IconButton onClick={() => setExpandedOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, bgcolor: "background.default" }}>
          {renderQuoteTable(true)}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? tQuote("dialog.editTitle", "Edit quote request") : tQuote("dialog.newTitle", "New quote request")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{tQuote("dialog.sections.requestDetails", "Request details")}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField fullWidth label={tQuote("dialog.fields.title", "Title")} value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label={tQuote("dialog.fields.source", "Source")} value={form.request_type} onChange={(e) => setForm((prev) => ({ ...prev, request_type: e.target.value }))} helperText={tQuote("dialog.fields.sourceHelp", "Examples: Phone call, WhatsApp note, Website form.")} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label={tQuote("dialog.fields.preferredTimeline", "Preferred timeline")} value={form.preferred_timeline} onChange={(e) => setForm((prev) => ({ ...prev, preferred_timeline: e.target.value }))} /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth label={tQuote("dialog.fields.serviceAddress", "Service address")} value={form.service_address} onChange={(e) => setForm((prev) => ({ ...prev, service_address: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label={tQuote("dialog.fields.description", "Description")} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} multiline minRows={3} /></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{tQuote("dialog.sections.requestContact", "Request contact")}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField fullWidth label={tQuote("dialog.fields.contactName", "Contact name")} value={form.contact_name} onChange={(e) => setForm((prev) => ({ ...prev, contact_name: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label={tQuote("dialog.fields.contactEmail", "Contact email")} value={form.contact_email} onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth label={tQuote("dialog.fields.contactPhone", "Contact phone")} value={form.contact_phone} onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: e.target.value }))} /></Grid>
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{tQuote("dialog.sections.linkedClient", "Linked client")}</Typography>
              <Typography variant="caption" color="text.secondary">
                {tQuote("dialog.linkedClientHelp", "Contact is who requested the quote. Client is the official customer record used for estimates, invoices, and work orders.")}
              </Typography>
              <Paper variant="outlined" sx={{ mt: 1.25, p: 1.5, borderColor: theme.palette.divider }}>
                {editing?.client_id ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" fontWeight={700}>{editing.client_name || tQuote("dialog.fields.linkedClientFallback", "Linked client")}</Typography>
                    <Typography variant="body2" color="text.secondary">{editing.client_email || "-"}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip size="small" variant="outlined" color="success" label={tQuote("chips.linked", "Linked")} />
                      {hasEmailMismatch(editing) ? <Chip size="small" variant="outlined" color="warning" label={tQuote("chips.contactDiffers", "Contact differs from client")} /> : null}
                      {hasNameMismatch(editing) ? <Chip size="small" variant="outlined" color="warning" label={tQuote("chips.checkClientMatch", "Check client match")} /> : null}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {editing
                      ? tQuote("dialog.noClientLinked", "No client linked yet.")
                      : tQuote("dialog.saveBeforeLinking", "Save the quote first, then link or create the client.")}
                  </Typography>
                )}
              </Paper>
              {editing ? (
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.25 }}>
                  <Button variant="outlined" onClick={() => openLinkClientDialog(editing, false)}>{tQuote("dialog.actions.linkExistingClient", "Link existing client")}</Button>
                  <Button variant="outlined" onClick={() => openLinkClientDialog(editing, true)}>{tQuote("dialog.actions.createClientFromContact", "Create client from contact")}</Button>
                </Stack>
              ) : null}
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>{tQuote("dialog.sections.notes", "Notes")}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label={tQuote("dialog.fields.visibleNotes", "Visible notes")} value={form.visible_notes} onChange={(e) => setForm((prev) => ({ ...prev, visible_notes: e.target.value }))} multiline minRows={2} /></Grid>
                <Grid item xs={12}><TextField fullWidth label={tQuote("dialog.fields.internalNotes", "Internal notes")} value={form.internal_notes} onChange={(e) => setForm((prev) => ({ ...prev, internal_notes: e.target.value }))} multiline minRows={2} /></Grid>
              </Grid>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>{tQuote("common.cancel", "Cancel")}</Button>
          <Button variant="contained" onClick={saveQuote} disabled={saving}>{saving ? tQuote("common.saving", "Saving...") : editing ? tQuote("dialog.actions.saveChanges", "Save changes") : tQuote("dialog.actions.createQuote", "Create quote")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(linkTarget)} onClose={() => setLinkTarget(null)} fullWidth maxWidth="sm">
        <DialogTitle>{tQuote("linkDialog.title", "Link or Create Client")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Alert severity="info">{tQuote("linkDialog.info", "Link an existing client or create a client from the request contact.")}</Alert>
            <FormControl fullWidth>
              <InputLabel>{tQuote("linkDialog.existingClient", "Existing client")}</InputLabel>
              <Select label={tQuote("linkDialog.existingClient", "Existing client")} value={linkClientId} onChange={(e) => setLinkClientId(e.target.value)}>
                <MenuItem value="">{tQuote("linkDialog.createNewInstead", "Create new client instead")}</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.first_name || client.last_name
                      ? `${client.first_name || ""} ${client.last_name || ""}`.trim()
                      : client.email || tQuote("linkDialog.clientFallback", "Client #{{id}}", { id: client.id })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {!linkClientId ? (
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth label={tQuote("linkDialog.clientName", "Client name")} value={newClient.name} onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label={tQuote("linkDialog.clientEmail", "Client email")} value={newClient.email} onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))} /></Grid>
                <Grid item xs={12}><TextField fullWidth label={tQuote("linkDialog.clientPhone", "Client phone")} value={newClient.phone} onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))} /></Grid>
              </Grid>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkTarget(null)}>{tQuote("common.cancel", "Cancel")}</Button>
          <Button variant="contained" onClick={submitLinkClient}>{tQuote("linkDialog.linkClient", "Link client")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(confirmEstimateTarget)} onClose={() => setConfirmEstimateTarget(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{tQuote("confirmEstimate.title", "Confirm client for estimate")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {tQuote("confirmEstimate.description", "The request contact is different from the linked client. Continue using this client for the estimate?")}
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{tQuote("confirmEstimate.requestContact", "Request contact")}</Typography>
              <Typography variant="body2">{confirmEstimateTarget?.contact_name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">{confirmEstimateTarget?.contact_email || confirmEstimateTarget?.contact_phone || "-"}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{tQuote("confirmEstimate.linkedClient", "Linked client")}</Typography>
              <Typography variant="body2">{confirmEstimateTarget?.client_name || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">{confirmEstimateTarget?.client_email || "-"}</Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEstimateTarget(null)}>{tQuote("common.cancel", "Cancel")}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              const target = confirmEstimateTarget;
              setConfirmEstimateTarget(null);
              if (target) await createEstimateForQuote(target);
            }}
          >
            {tQuote("confirmEstimate.continue", "Continue")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
