/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/sections/management/ManagerBookings.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Alert,
  Chip,
  Toolbar,
  IconButton,
  Tooltip,
  Menu as MuiMenu,
  Backdrop,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate } from "react-router-dom";
import { api } from "../../../utils/api";
import { DateTime } from "luxon";
import { isoFromParts } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";
import LinearProgress from "@mui/material/LinearProgress";

/* ---------------------------------------------------------
   Timezone helpers (display local; backend expects local strings)
----------------------------------------------------------- */
const resolveTZ = () => getUserTimezone();

const fmtApptLocal = (
  dateStr,
  timeStr,
  sourceTz,
  pattern = "yyyy-LL-dd - HH:mm (ZZZZ)"
) => {
  if (!dateStr || !timeStr) return "-";
  const iso = isoFromParts(dateStr, timeStr, sourceTz || "UTC");
  return DateTime.fromISO(iso).setZone(resolveTZ()).toFormat(pattern);
};

const fmtISO = (isoLike, pattern = "yyyy-LL-dd HH:mm (ZZZZ)") => {
  if (!isoLike) return "";
  return DateTime.fromISO(isoLike).setZone(resolveTZ()).toFormat(pattern);
};

// Convert stored date/time strings -> local editable parts
const toLocalParts = (dateStr, timeStr, sourceTz) => {
  if (!dateStr || !timeStr) return { dateLocal: "", timeLocal: "" };
  const iso = isoFromParts(dateStr, timeStr, sourceTz || "UTC");
  const local = DateTime.fromISO(iso).setZone(resolveTZ());
  return {
    dateLocal: local.toFormat("yyyy-LL-dd"),
    timeLocal: local.toFormat("HH:mm"),
  };
};

const toLowerSafe = (value) => (value == null ? "" : String(value).toLowerCase());

const normalizeBookingPaymentStatus = (booking = {}) => {
  const statuses = [];
  const pushStatus = (val) => {
    const normalized = toLowerSafe(val);
    if (normalized) statuses.push(normalized);
  };

  pushStatus(booking.payment_status);
  pushStatus(booking.product_order?.payment_status);
  pushStatus(booking.product_order?.status);
  if (Array.isArray(booking.payments)) {
    booking.payments.forEach((txn) => pushStatus(txn?.status));
  }

  const hasCardOnFile = Boolean(booking.card_on_file || statuses.includes("card_on_file"));
  const paidish =
    Boolean(booking.paid) ||
    Boolean(booking.product_order?.paid) ||
    statuses.some((s) => ["paid", "succeeded", "captured", "complete"].includes(s));

  let status =
    statuses.find((s) =>
      ["partially_refunded", "refunded", "failed", "pending", "processing", "requires_payment_method"].includes(s)
    ) || statuses.find(Boolean) || "";

  if (paidish && !["partially_refunded", "refunded"].includes(status)) {
    status = "paid";
  }

  if (!status) {
    status = hasCardOnFile
      ? "card_on_file"
      : statuses.includes("pending")
      ? "pending"
      : "unpaid";
  }

  return {
    status,
    paidish,
    hasCardOnFile,
    original: statuses.find(Boolean) || "",
  };
};

const paymentStatusChipColor = (status) => {
  switch (status) {
    case "paid":
      return "success";
    case "card_on_file":
      return "primary";
    case "pending":
    case "processing":
      return "warning";
    case "partially_refunded":
    case "refunded":
      return "info";
    case "failed":
    case "requires_payment_method":
      return "error";
    default:
      return "default";
  }
};

const ManagerBookings = ({ slug, connect }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();


  const [bookings, setBookings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [reassignDialog, setReassignDialog] = useState(false);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [payments, setPayments] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Company no-show fee for quick-charge
  const [noShowFee, setNoShowFee] = useState(null);

  // Edit dialog - services for the current employee (fallback to all)
  const [editServices, setEditServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Reassign dialog - local filters
  const [reassignDept, setReassignDept] = useState("");
  const [reassignRecruiterId, setReassignRecruiterId] = useState("");

  // Edit dialog - local time fields
  const [editLocalDate, setEditLocalDate] = useState("");
  const [editLocalStart, setEditLocalStart] = useState("");
  const [editLocalEnd, setEditLocalEnd] = useState("");

  const companySlug = slug || "";

  const connectStatus = connect?.status || {};
  const connectLoading = Boolean(connect?.loading);
  const connectNeedsOnboarding = Boolean(connect?.needsOnboarding);
  const connectChargesEnabled = Boolean(connectStatus?.charges_enabled);
  const connectPayoutsEnabled = Boolean(connectStatus?.payouts_enabled);
  const connectStart = connect?.startOnboarding;
  const connectResume = connect?.refreshLink;
  const connectDashboard = connect?.openDashboard;
  const connectAction = connect?.action || null;
  const connectWarning = connectNeedsOnboarding || !connectChargesEnabled;
  const showConnectBanner = Boolean(connect);

  /* -- "Saving..." enterprise overlay ------------------------- */
  const [saving, setSaving] = useState(false);
  const [savingStep, setSavingStep] = useState(0);
  const savingMessages = useMemo(
    () => [
      t("manager.bookings.saving.updatingSchedule"),
      t("manager.bookings.saving.syncingCalendars"),
      t("manager.bookings.saving.propagatingChanges"),
      t("manager.bookings.saving.notifyingClient"),
      t("manager.bookings.saving.reconfirmingAvailability"),
      t("manager.bookings.saving.finalizingUpdate"),
    ],
    [t, i18n.language]
  );

  useEffect(() => {
    if (!saving) return undefined;
    const id = setInterval(
      () => setSavingStep((s) => (s + 1) % savingMessages.length),
      900
    );
    return () => clearInterval(id);
  }, [saving, savingMessages]);

  /* -- Fetch Departments & Recruiters --------------------- */
  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await api.get("/api/manager/departments");
      const list = Array.isArray(data?.departments)
        ? data.departments
        : Array.isArray(data)
        ? data
        : [];
      setDepartments(list);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setDepartments([]);
    }
  }, []);

  const fetchRecruiters = useCallback(async () => {
    try {
      const { data } = await api.get("/api/manager/recruiters");
      const list = Array.isArray(data?.recruiters)
        ? data.recruiters
        : Array.isArray(data)
        ? data
        : [];
      setRecruiters(list);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setRecruiters([]);
    }
  }, []);

  const filteredRecruiters = useMemo(() => {
    if (!selectedDepartment) return recruiters;
    return recruiters.filter((r) => String(r.department_id) === String(selectedDepartment));
  }, [recruiters, selectedDepartment]);

  // If department changes and current employee is not in that dept, clear it
  useEffect(() => {
    if (!selectedRecruiter) return;
    const stillValid = filteredRecruiters.some(
      (r) => String(r.id) === String(selectedRecruiter)
    );
    if (!stillValid) setSelectedRecruiter("");
  }, [selectedDepartment, filteredRecruiters, selectedRecruiter]);

  /* -- Fetch Bookings ------------------------------------- */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/manager/bookings");
      const list = Array.isArray(data) ? data : data?.bookings || [];
      const decorated = list.map((b) => {
        const paymentMeta = normalizeBookingPaymentStatus(b);
        const sourceTz = b?.timezone || b?.recruiter?.timezone || b?.recruiterTimezone || b?.companyTimezone || "UTC";
        const startIso = b?.date && b?.start_time ? isoFromParts(b.date, b.start_time, sourceTz) : "";
        const endIso = b?.date && b?.end_time ? isoFromParts(b.date, b.end_time, sourceTz) : "";
        const startMillis = startIso ? DateTime.fromISO(startIso).toMillis() : 0;
        return {
          ...b,
          payment_status: paymentMeta.status,
          card_on_file: paymentMeta.hasCardOnFile,
          paid: paymentMeta.paidish || Boolean(b.paid),
          _paymentStatusOriginal: paymentMeta.original,
          _hasCardOnFile: paymentMeta.hasCardOnFile,
          _paidish: paymentMeta.paidish,
          _tz: resolveTZ(),
          _srcTZ: sourceTz,
          _startIso: startIso,
          _endIso: endIso,
          _startMs: startMillis,
          _when: fmtApptLocal(b?.date, b?.start_time, sourceTz),
        };
      });
      setBookings(decorated);
    } catch (err) {
      console.error("load bookings failed:", err?.response?.status, err?.response?.data);
      const fallback = t("manager.bookings.snackbar.loadError");
      const msg =
        err?.response?.data?.error ||
        `${err?.response?.status || ""} ${err?.response?.statusText || ""}`.trim() ||
        fallback;
      setSnackbar({ open: true, message: msg, severity: "error" });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchRecruiters();
    fetchBookings();
  }, [fetchDepartments, fetchRecruiters, fetchBookings]);

  // Load company no-show fee once
  useEffect(() => {
    api
      .get("/admin/company-profile")
      .then(({ data }) => setNoShowFee(Number(data.cancellation_fee || 0)))
      .catch(() => setNoShowFee(null));
  }, []);

  /* -- Derived: apply Department/Employee filters --------- */
  const visibleRows = useMemo(() => {
    return bookings.filter((b) => {
      const deptId = String(b?.recruiter?.department_id ?? b?.department_id ?? "");
      if (selectedDepartment && deptId !== String(selectedDepartment)) return false;
      const recId = String(b?.recruiter?.id ?? b?.recruiter_id ?? "");
      if (selectedRecruiter && recId !== String(selectedRecruiter)) return false;
      return true;
    });
  }, [bookings, selectedDepartment, selectedRecruiter]);

  /* -- Pagination (persist page size; default 10) --------- */
  const PAGE_SIZES = [10, 20, 50, 100];
  const DEFAULT_SIZE = 10;
  const savedV2 = Number(localStorage.getItem("mb.pageSize.v2"));
  const savedV1 = Number(localStorage.getItem("mb.pageSize"));

  let initialSize = DEFAULT_SIZE;
  if (PAGE_SIZES.includes(savedV2)) {
    initialSize = savedV2;
  } else if (PAGE_SIZES.includes(savedV1) && savedV1 !== 100) {
    initialSize = savedV1;
  } else {
    initialSize = DEFAULT_SIZE;
  }

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: initialSize,
  });

  const handlePaginationChange = (model) => {
    setPaginationModel(model);
    if (model?.pageSize) {
      localStorage.setItem("mb.pageSize.v2", String(model.pageSize));
    }
  };

  /* -- Actions (server side) ----------------------------- */
  /* -- Actions (server side) ----------------------------- */
const handleAction = async (id, endpoint, msg) => {
  try {
    await api.post(`/api/manager/bookings/${id}/${endpoint}`, {});
    setSnackbar({ open: true, message: msg, severity: "success" });
    fetchBookings();
    // keep calendars in sync
    window.dispatchEvent(new Event("slots:refresh"));
  } catch {
    setSnackbar({ open: true, message: t("manager.bookings.snackbar.actionFailed"), severity: "error" });
  }
};

  /* -- EDIT: fetch services for current employee (fallbacks) - */
  const fetchServicesForEmployee = async (recruiterId) => {
    if (!recruiterId) {
      setEditServices([]);
      return;
    }
    setLoadingServices(true);
    try {
      let svc = [];
      try {
        const { data: recruiterServices } = await api.get(`/api/manager/recruiters/${recruiterId}/services`);
        svc = Array.isArray(recruiterServices) ? recruiterServices : (recruiterServices?.services || []);
      } catch {
        const { data: servicesFallback } = await api.get(`/booking/services`);
        svc = Array.isArray(servicesFallback) ? servicesFallback : [];
      }
      setEditServices(
        (svc || []).map((s) => ({
          id: s.id,
          name: s.name || s.title || t("manager.bookings.dialog.edit.serviceFallback", { id: s.id }),
        }))
      );
    } catch {
      setEditServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleEditOpen = (row) => {
    setSelectedBooking(row);

    // Derive local editable fields from stored values using source timezone
    const srcTz = row?._srcTZ || row?.timezone || row?.recruiter?.timezone || "UTC";
    const { dateLocal, timeLocal } = toLocalParts(row?.date, row?.start_time, srcTz);
    const { timeLocal: endLocal } = toLocalParts(row?.date, row?.end_time, srcTz);
    setEditLocalDate(dateLocal || "");
    setEditLocalStart(timeLocal || "");
    setEditLocalEnd(endLocal || "");

    setEditDialog(true);
    fetchServicesForEmployee(row?.recruiter_id || row?.recruiter?.id);
  };

// Add this helper just above handleEditSave

async function saveEdit(bookingId, payload) {
  const url = `/api/manager/bookings/${bookingId}`;
  const patch = (extra = {}) => api.patch(url, { ...payload, ...extra });

  try {
    const { data } = await patch();

    setEditDialog(false);
    await fetchBookings();
    window.dispatchEvent(new Event("slots:refresh"));

    setSnackbar({
      open: true,
      severity: "success",
      message: data?.visible_in_available_slots
        ? t("manager.bookings.snackbar.updatedPublished")
        : t("manager.bookings.snackbar.updatedHidden"),
    });
  } catch (e) {
    const status = e?.response?.status;
    const data = e?.response?.data;

    if (status === 409 && data?.error_code === "OUTSIDE_AVAILABILITY") {
      const msg = t("manager.bookings.dialog.edit.confirmOutsideAvailability", {
        timezone: data.provider_timezone,
        date: data.suggested_availability.date,
        start: data.suggested_availability.start_time,
        end: data.suggested_availability.end_time,
      });

      const createAndSave = window.confirm(msg);

      if (createAndSave) {
        try {
          const { data: ensured } = await patch({ ensure_availability: true });
          setEditDialog(false);
          await fetchBookings();
          window.dispatchEvent(new Event("slots:refresh"));
          setSnackbar({
            open: true,
            severity: "success",
            message: t("manager.bookings.snackbar.updatedPublished"),
          });
          return ensured;
        } catch (err) {
          setSnackbar({
            open: true,
            severity: "error",
            message: err?.response?.data?.error || t("manager.bookings.snackbar.updateFailed"),
          });
          throw err;
        }
      }

      return;
    }

    setSnackbar({
      open: true,
      severity: "error",
      message: data?.error || t("manager.bookings.snackbar.updateFailed"),
    });
    throw e;
  }
}


const handleEditSave = async () => {
  if (!selectedBooking) return;

  // show the nice animated overlay you already have
  setSaving(true);
  try {
    const payload = {
      // send LOCAL strings; the backend converts with manager TZ
      date: editLocalDate,           // "YYYY-MM-DD"
      start_time: editLocalStart,    // "HH:MM"
      end_time: editLocalEnd,        // "HH:MM"
      notes: selectedBooking?.manager_note || "",
      manager_note: selectedBooking?.manager_note || "",  // <- add this so email includes the note
      service_id: selectedBooking?.service_id || selectedBooking?.service?.id || null,
      // keep your existing hint; backend may ignore it, that's fine
      auto_adjust: true,
    };

    await saveEdit(selectedBooking.id, payload);
  } finally {
    setSaving(false);
  }
};

/* -- REASSIGN: department filter inside dialog --------- */

  const reassignFiltered = useMemo(() => {
    return reassignDept
      ? recruiters.filter((r) => String(r.department_id) === String(reassignDept))
      : recruiters;
  }, [recruiters, reassignDept]);

  const handleReassignOpen = (row) => {
    setSelectedBooking(row);
    const deptId = String(row?.recruiter?.department_id ?? row?.department_id ?? "");
    setReassignDept(deptId || "");
    setReassignRecruiterId("");
    setReassignDialog(true);
  };

  const handleReassignSave = async () => {
    if (!selectedBooking || !reassignRecruiterId) return;
    try {
      setSaving(true);
      await api.post(`/api/manager/bookings/${selectedBooking.id}/reassign`, { recruiter_id: reassignRecruiterId });
      setSnackbar({ open: true, message: t("manager.bookings.snackbar.reassigned"), severity: "success" });
      setReassignDialog(false);
      fetchBookings();
      window.dispatchEvent(new Event("slots:refresh"));
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.error || t("manager.bookings.snackbar.reassignFailed"),
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadPayments = async (id) => {
    try {
      const { data } = await api.get(`/api/payments/list/${id}`);
      const txns = Array.isArray(data) ? data : data?.transactions || [];
      const decorated = txns.map((p) => {
        const ts = p.timestamp || p.created_at || p.updated_at || null;
        return { ...p, _tsLabel: ts ? fmtISO(ts) : "" };
      });
      setPayments(decorated);
      setPaymentDialog(true);
    } catch {
      setSnackbar({ open: true, message: t("manager.bookings.snackbar.paymentsFailed"), severity: "error" });
      setPayments([]);
    }
  };

  const handleCharge = (row, presetAmount = "", presetNote = "") => {
    const params = new URLSearchParams({
      appointmentId: String(row.id || ""),
      clientId: String(row.client?.id || ""),
      email: row.client?.email || "",
      company: companySlug || "",
    });
    if (presetAmount) params.set("amount", String(presetAmount));
    if (presetNote) params.set("note", presetNote);
    navigate(`/manager/payments?${params.toString()}`);
  };

// New: navigator to payments hub in refund mode
const handleRefund = (row) => {
  const params = new URLSearchParams({
    appointmentId: String(row.id || ""),
    clientId: String(row.client?.id || ""),
    email: row.client?.email || "",
    company: companySlug || "",
    intent: "refund",
  });
  navigate(`/manager/payments?${params.toString()}`);
};

/* -- Compact row "More" menu - */
const RowActions = ({ row }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const hasCardOnFile =
    row._hasCardOnFile || row.payment_status === "card_on_file";

  const chargeActionsDisabled = Boolean(connectWarning);

  return (
    <>
      <Tooltip title={t("manager.bookings.actions.tooltip")}>
        <IconButton size="small" onClick={handleOpen}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <MuiMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleEditOpen(row);
            handleClose();
          }}
        >
          {t("manager.bookings.actions.edit")}
        </MenuItem>

        <MenuItem
          onClick={async () => {
            await handleAction(row.id, "cancel", t("manager.bookings.snackbar.cancelled"));
            handleClose();
          }}
        >
          {t("manager.bookings.actions.cancel")}
        </MenuItem>

        {row.status !== "no_show" ? (
          <MenuItem
            onClick={async () => {
              await handleAction(row.id, "no-show", t("manager.bookings.snackbar.noShow"));
              handleClose();
            }}
          >
            {t("manager.bookings.actions.markNoShow")}
          </MenuItem>
        ) : (
          <MenuItem
            onClick={async () => {
              await handleAction(row.id, "mark-show", t("manager.bookings.snackbar.show"));
              handleClose();
            }}
          >
            {t("manager.bookings.actions.markShow")}
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            handleReassignOpen(row);
            handleClose();
          }}
        >
          {t("manager.bookings.actions.reassign")}
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleRefund(row);
            handleClose();
          }}
        >
          {t("manager.bookings.actions.refund")}
        </MenuItem>

        <MenuItem
          onClick={() => {
            loadPayments(row.id);
            handleClose();
          }}
        >
          {t("manager.bookings.actions.payments")}
        </MenuItem>

        {hasCardOnFile && (
          <>
            <MenuItem
              disabled={chargeActionsDisabled}
              onClick={() => {
                if (chargeActionsDisabled) return;
                handleCharge(row);
                handleClose();
              }}
            >
              {t("manager.bookings.actions.chargeCard")}
            </MenuItem>
            <MenuItem
              disabled={chargeActionsDisabled}
              onClick={() => {
                if (chargeActionsDisabled) return;
                const fee =
                  noShowFee != null ? noShowFee : row.no_show_fee || "25.00";
                handleCharge(row, fee, t("manager.bookings.actions.noShowFee"));
                handleClose();
              }}
            >
              {t("manager.bookings.actions.chargeNoShow")}
            </MenuItem>
          </>
        )}
      </MuiMenu>
    </>
  );
};

/* -- Grid Columns - */

  const bookingStatusLabel = useCallback(
    (status) => {
      const key = toLowerSafe(status) || "unknown";
      const fallback = key
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || t("manager.bookings.status.unknown");
      return t(`manager.bookings.status.${key}`, { defaultValue: fallback });
    },
    [t, i18n.language]
  );

  const paymentStatusLabel = useCallback(
    (status) => {
      const key = toLowerSafe(status) || "unpaid";
      const fallback = key
        .split("_")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || t("manager.bookings.paymentStatus.unpaid");
      return t(`manager.bookings.paymentStatus.${key}`, { defaultValue: fallback });
    },
    [t, i18n.language]
  );

  const localeText = useMemo(
    () => ({
      noRowsLabel: t("manager.bookings.table.noRows"),
      footerRowPerPage: t("common.rowsPerPage"),
    }),
    [i18n.language, t]
  );

  const columns = useMemo(
    () => [
      { field: "id", headerName: t("manager.bookings.columns.id"), width: 70 },
      {
        field: "client",
        headerName: t("manager.bookings.columns.client"),
        flex: 1,
        minWidth: 150,
        valueGetter: (params) => params.row.client?.full_name || "-",
      },
      {
        field: "service",
        headerName: t("manager.bookings.columns.service"),
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.service?.name || "-",
      },
      {
        field: "recruiter",
        headerName: t("manager.bookings.columns.employee"),
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.recruiter?.full_name || "-",
      },
      {
        field: "_when",
        headerName: t("manager.bookings.columns.whenLocal"),
        flex: 1,
        minWidth: 200,
        valueGetter: (params) => params.row._when || "-",
        sortComparator: (_v1, _v2, params1, params2) => {
          const a = params1?.row?._startMs ?? 0;
          const b = params2?.row?._startMs ?? 0;
          return a - b;
        },
      },
      {
        field: "status",
        headerName: t("manager.bookings.columns.status"),
        width: 140,
        valueGetter: (params) => params.row.status || "",
        renderCell: (params) => bookingStatusLabel(params.row.status),
      },
      {
        field: "payment_status",
        headerName: t("manager.bookings.columns.payment"),
        width: 160,
        valueGetter: (params) => params.row.payment_status || "",
        renderCell: (params) => (
          <Chip
            size="small"
            label={paymentStatusLabel(params.row.payment_status)}
            color={paymentStatusChipColor(params.row.payment_status)}
            variant={params.row.payment_status === "paid" ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "actions",
        headerName: t("manager.bookings.columns.actions"),
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => <RowActions row={params.row} />,
      },
    ],
    [bookingStatusLabel, paymentStatusLabel, t, i18n.language]
  );


  /* -- Render - */
  return (
    <>
      {/* Global saving overlay (dim page, keep dialogs ABOVE it) */}
<Backdrop
  open={saving}
  sx={{
    color: "#fff",
    zIndex: (theme) => theme.zIndex.modal - 1,    // Put under dialogs
    bgcolor: "rgba(0,0,0,0.12)",                  // lighter dim
  }}
>
  <Stack alignItems="center" spacing={1}>
    <CircularProgress color="inherit" size={28} />
    <Typography variant="subtitle2">
      {savingMessages[savingStep]}
    </Typography>
  </Stack>
</Backdrop>

      <Toolbar />
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box sx={{ maxWidth: 1600, mx: "auto" }}>
          <Typography variant="h4" gutterBottom>
            {t("manager.bookings.title")}
          </Typography>

          {showConnectBanner ? (
            connectLoading ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                {t("manager.bookings.connect.checking")}
              </Alert>
            ) : connectWarning ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t("manager.bookings.connect.warning")}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                  {connectStart ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={connectStart}
                      disabled={connectAction === "start"}
                    >
                      {connectAction === "start"
                        ? t("manager.bookings.connect.buttons.opening")
                        : t("manager.bookings.connect.buttons.finish")}
                    </Button>
                  ) : null}
                  {connectResume ? (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={connectResume}
                      disabled={connectAction === "refresh"}
                    >
                      {connectAction === "refresh"
                        ? t("manager.bookings.connect.buttons.refreshing")
                        : t("manager.bookings.connect.buttons.resume")}
                    </Button>
                  ) : null}
                  {connectDashboard ? (
                    <Button
                      variant="text"
                      size="small"
                      onClick={connectDashboard}
                      disabled={connectAction === "dashboard"}
                    >
                      {connectAction === "dashboard"
                        ? t("manager.bookings.connect.buttons.opening")
                        : t("manager.bookings.connect.buttons.dashboard")}
                    </Button>
                  ) : null}
                </Stack>
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                {connectPayoutsEnabled
                  ? t("manager.bookings.connect.ready.withPayouts")
                  : t("manager.bookings.connect.ready.pending")}
              </Alert>
            )
          ) : null}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t("manager.bookings.filters.heading")}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  select
                  fullWidth
                  label={t("manager.bookings.filters.department")}
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t("manager.bookings.filters.allDepartments")}</em>
                  </MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={4} md={3}>
                <TextField
                  select
                  fullWidth
                  label={t("manager.bookings.filters.employee")}
                  value={selectedRecruiter}
                  onChange={(e) => setSelectedRecruiter(e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t("manager.bookings.filters.allEmployees")}</em>
                  </MenuItem>
                  {filteredRecruiters.map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>
                      {r.full_name ||
                        r.name ||
                        `${r.first_name || ""} ${r.last_name || ""}`.trim()}
                      {r.email ? ` (${r.email})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            {loading ? (
              <CircularProgress />
            ) : (
              <DataGrid
                rows={visibleRows}
                columns={columns}
                autoHeight
                density="compact"
                pagination
                initialState={{
                  pagination: { paginationModel: { page: 0, pageSize: paginationModel.pageSize } },
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationChange}
                localeText={localeText}
                getRowId={(row) => row.id ?? row.appointment_id}
                getRowClassName={(params) => {
                  if (params.row.status === "no_show") return "row-no-show";
                  if (params.row.status === "refunded") return "row-refunded";
                  return "";
                }}
                sx={{
                  "& .row-no-show": { backgroundColor: "rgba(255, 152, 0, 0.06)" },
                  "& .row-refunded": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  "& .MuiDataGrid-virtualScroller": { overflowX: "hidden" },
                }}
              />
            )}
          </Paper>

          {/* Edit Dialog */}
          <Dialog
            open={editDialog}
            onClose={() => (!saving ? setEditDialog(false) : null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{t("manager.bookings.dialog.edit.title")}</DialogTitle>
            <DialogContent>
              {saving && <LinearProgress sx={{ mb: 2 }} />}
              <TextField
                fullWidth
                label={t("manager.bookings.dialog.edit.date")}
                type="date"
                value={editLocalDate}
                onChange={(e) => setEditLocalDate(e.target.value)}
                sx={{ my: 1 }}
                InputLabelProps={{ shrink: true }}
                disabled={saving}
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  fullWidth
                  label={t("manager.bookings.dialog.edit.start")}
                  type="time"
                  value={editLocalStart}
                  onChange={(e) => setEditLocalStart(e.target.value)}
                  sx={{ my: 1 }}
                  InputLabelProps={{ shrink: true }}
                  disabled={saving}
                />
                <TextField
                  fullWidth
                  label={t("manager.bookings.dialog.edit.end")}
                  type="time"
                  value={editLocalEnd}
                  onChange={(e) => setEditLocalEnd(e.target.value)}
                  sx={{ my: 1 }}
                  InputLabelProps={{ shrink: true }}
                  disabled={saving}
                />
              </Stack>

              <TextField
                select
                fullWidth
                label={loadingServices ? t("manager.bookings.dialog.edit.loading") : t("manager.bookings.dialog.edit.service")}
                value={
                  selectedBooking?.service_id ||
                  selectedBooking?.service?.id ||
                  ""
                }
                onChange={(e) =>
                  setSelectedBooking((prev) => ({
                    ...(prev || {}),
                    service_id: Number(e.target.value),
                  }))
                }
                sx={{ my: 1 }}
                disabled={saving}
              >
                {(editServices || []).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label={t("manager.bookings.dialog.edit.note")}
                multiline
                minRows={2}
                value={selectedBooking?.manager_note || ""}
                onChange={(e) =>
                  setSelectedBooking((prev) => ({
                    ...(prev || {}),
                    manager_note: e.target.value,
                  }))
                }
                sx={{ my: 1 }}
                disabled={saving}
              />
              <Alert severity="info" sx={{ mt: 1 }}>
                {t("manager.bookings.dialog.edit.info")}
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog(false)} disabled={saving}>{t("manager.bookings.dialog.edit.close")}</Button>
              <Button
                variant="contained"
                onClick={handleEditSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : null}
              >
                {t("manager.bookings.dialog.edit.save")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Reassign Dialog */}
          <Dialog
            open={reassignDialog}
            onClose={() => (!saving ? setReassignDialog(false) : null)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>{t("manager.bookings.dialog.reassign.title")}</DialogTitle>
            <DialogContent>
              {saving && <LinearProgress sx={{ mb: 2 }} />}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t("manager.bookings.filters.department")}
                    value={reassignDept}
                    onChange={(e) => setReassignDept(e.target.value)}
                    disabled={saving}
                  >
                    <MenuItem value="">
                      <em>{t("manager.bookings.filters.allDepartments")}</em>
                    </MenuItem>
                    {departments.map((d) => (
                      <MenuItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t("manager.bookings.filters.employee")}
                    value={reassignRecruiterId}
                    onChange={(e) => setReassignRecruiterId(e.target.value)}
                    disabled={saving}
                  >
                    {reassignFiltered.map((r) => (
                      <MenuItem key={r.id} value={String(r.id)}>
                        {r.full_name ||
                          r.name ||
                          `${r.first_name || ""} ${r.last_name || ""}`.trim()}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReassignDialog(false)} disabled={saving}>{t("manager.bookings.dialog.reassign.cancel")}</Button>
              <Button
                variant="contained"
                onClick={handleReassignSave}
                disabled={!reassignRecruiterId || saving}
                startIcon={saving ? <CircularProgress size={16} /> : null}
              >
                {t("manager.bookings.dialog.reassign.confirm")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Payments Dialog */}
          <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>{t("manager.bookings.dialog.payments.title")}</DialogTitle>
            <DialogContent dividers>
              {payments.length === 0 ? (
                <Typography color="text.secondary">{t("manager.bookings.dialog.payments.empty")}</Typography>
              ) : (
                <Stack spacing={1}>
                  {payments.map((p, idx) => (
                    <Paper key={`${p.id || idx}-${p._tsLabel}`} sx={{ p: 1.5 }} variant="outlined">
                      <Typography variant="subtitle2">
                        {String(p.status).toUpperCase()} - {String(p.type).toUpperCase()} - ${Number(p.amount || 0).toFixed(2)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p._tsLabel}
                      </Typography>
                      {p.note && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {p.note}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPaymentDialog(false)}>{t("manager.bookings.dialog.payments.close")}</Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar */}
          <Snackbar
  open={snackbar.open}
  autoHideDuration={4000}
  onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
>
  <Alert
    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
    severity={snackbar.severity || "info"}
    sx={{ width: "100%" }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>

        </Box>
      </Container>
    </>
  );
};

export default ManagerBookings;







































