/* DownloadPayrollButton.js – 2025-05-24
   ↳ Finalise & (optional) e-mail payslip, then download PDF/CSV/XLSX
      or simply “Save” without downloading. */

import React, { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import DownloadIcon     from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon   from "@mui/icons-material/TableChart";
import GridOnIcon       from "@mui/icons-material/GridOn";
import EmailIcon        from "@mui/icons-material/Email";
import axios  from "axios";
import dayjs  from "dayjs";

/* ──────────────────────────────────────────────────────────
   Helper – ensure we always send a valid YYYY-MM
────────────────────────────────────────────────────────── */
const monthOrFallback = (month, startISO) =>
  month?.length === 7 ? month : dayjs(startISO).format("YYYY-MM");

/* ──────────────────────────────────────────────────────────
   Re-usable helper to trigger a download and revoke URL
────────────────────────────────────────────────────────── */
const triggerDownload = (blob, filename) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  document.body.removeChild(link);
};

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */
export default function DownloadPayrollButton({
  recruiterId,
  region          = "ca",
  month           = "",
  startDate       = "",
  endDate         = "",
  selectedColumns = [],
  token           = "",
  payroll         = {},  // full payroll object incl. manager overrides + preview
}) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [anchor, setAnchor] = useState(null);
  const [busy  , setBusy  ] = useState(false);
  const [snack , setSnack ] = useState({ open: false, msg: "", sev: "info" });

  /* ───────── menu helpers ───────── */
  const openMenu  = (e) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  /* ───────── main handler ───────── */
  const handleDownload = async (fmt, emailToEmployee = false) => {
    closeMenu();
    if (busy) return;
    setBusy(true);

    /* -- derive dates & month (ISO-8601 safe) -- */
    const firstOfMonth =
      dayjs(payroll.start_date || startDate).isValid()
        ? payroll.start_date || startDate
        : dayjs().format("YYYY-MM-01");
    const lastOfMonth = dayjs(payroll.end_date || endDate || firstOfMonth)
      .endOf("month")
      .format("YYYY-MM-DD");
    const startISO  = payroll.start_date || startDate || firstOfMonth;
    const endISO    = payroll.end_date   || endDate   || lastOfMonth;
    const safeMonth = monthOrFallback(month, startISO);

    if (!recruiterId || !startISO || !endISO) {
      setSnack({ open: true, sev: "error", msg: "Missing recruiter or dates for export." });
      setBusy(false);
      return;
    }

    try {
      /* -- build common payload -- */
      const payload = {
        recruiter_id      : recruiterId,
        region            : region,
        start_date        : startISO,
        end_date          : endISO,
        month             : safeMonth,
        email_to_employee : emailToEmployee,

        /* canonically-split hours & pay coming from Preview */
        regular_hours     : payroll.regular_hours,
        overtime_hours    : payroll.overtime_hours,
        holiday_hours     : payroll.holiday_hours,
        regular_pay       : payroll.regular_pay,
        overtime_pay      : payroll.overtime_pay,
        holiday_pay       : payroll.holiday_pay,
        gross_pay         : payroll.gross_pay,
        vacation_pay      : payroll.vacation_pay,
        total_deductions  : payroll.total_deductions,
        net_pay           : payroll.net_pay,
      };

      /* include manager overrides only if non-zero / provided */
      const maybeAdd = (key, val) => {
        const num = parseFloat(val);
        if (!isNaN(num) && num !== 0) payload[key] = num;
      };

      [
        "rate","hours_worked","vacation_percent","include_vacation_in_gross",
        "bonus","attendance_bonus","performance_bonus","commission","tip",
        "travel_allowance","family_bonus","parental_insurance","tax_credit",
        "medical_insurance","dental_insurance","life_insurance",
        "retirement_amount","deduction",
        /* new numeric fields to sync preview → backend */
        "regular_hours","overtime_hours","regular_pay","overtime_pay",
        "gross_pay","vacation_pay","total_deductions","net_pay"
      ].forEach((k) => {
        if (k in payroll) maybeAdd(k, payroll[k]);
      });

      if (payroll.pay_frequency) payload.pay_frequency = payroll.pay_frequency;

      /* ── unified location field ── */
      if (payroll.province) payload.province = payroll.province;
      /* (no silent fall-backs here; backend validates/defaults) */

      /* 1️⃣  PDF branch: finalise-and-export → blob → download + toast */
      if (fmt === "pdf") {
        const pdfPayload = { ...payload, download: true };
        const resp = await axios.post(
          `${API_URL}/automation/payroll/finalize-and-export`,
          pdfPayload,
          {
            headers     : { Authorization: `Bearer ${token}` },
            responseType: "blob",
          }
        );
        triggerDownload(
          new Blob([resp.data], { type: resp.headers["content-type"] }),
          `payslip_${safeMonth}_${recruiterId}.pdf`
        );
        setSnack({
          open: true,
          sev : "success",
          msg : emailToEmployee
                ? "PDF downloaded and e-mailed to employee ✅"
                : "PDF downloaded ✅",
        });
        return;
      }

      /* 2️⃣  For CSV/XLSX/SAVE: finalise (no download) */
      await axios.post(
        `${API_URL}/automation/payroll/finalize-and-export`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      /* stop early if user chose “save” */
      if (fmt === "save") {
        setSnack({ open:true, sev:"success", msg:"Payroll finalised & saved ✅" });
        return;
      }

      /* 3️⃣  Build export URL for CSV/XLSX */
      const exportURL = new URL(`${API_URL}/automation/payroll/export-finalized`);
      exportURL.searchParams.append("recruiter_id", recruiterId);
      exportURL.searchParams.append("region"      , region);
      exportURL.searchParams.append("start_date"  , startISO);
      exportURL.searchParams.append("end_date"    , endISO);
      exportURL.searchParams.append("format"      , fmt);
      exportURL.searchParams.append("month"       , safeMonth);

      /* guaranteed + user-selected columns */
      const cols = Array.from(
        new Set([
          ...(selectedColumns || []),
          "employee_name",
          "include_vacation_in_gross",
          "retirement_amount",
        ])
      );
      cols.forEach((c) => exportURL.searchParams.append("columns[]", c));

      /* 4️⃣  Fetch CSV/XLSX blob */
      const resp = await axios.get(exportURL.toString(), {
        responseType: "blob",
        headers     : { Authorization: `Bearer ${token}` },
      });

      /* 5️⃣  Trigger download */
      triggerDownload(
        new Blob([resp.data], { type: resp.headers["content-type"] }),
        `payroll_${safeMonth}_${recruiterId}.${fmt}`
      );
      setSnack({
        open: true,
        sev : "success",
        msg : emailToEmployee
          ? "File downloaded and e-mailed to employee ✅"
          : "File downloaded ✅",
      });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, sev: "error", msg: `Export failed: ${err.message}` });
    } finally {
      setBusy(false);
    }
  };

  /* ──────────────────────────────────────────────────────────
                         JSX  RENDER
     ───────────────────────────────────────────────────────── */
  return (
    <>
      <Tooltip title="Finalise payroll, then export or save">
        <span>
          <Button
            variant="contained"
            color="success"
            startIcon={busy ? <CircularProgress size={18} /> : <DownloadIcon />}
            onClick={openMenu}
            disabled={busy}
          >
            Export / Save
          </Button>
        </span>
      </Tooltip>

      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        <MenuItem onClick={() => handleDownload("pdf")}>
          <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText>PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("csv")}>
          <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("xlsx")}>
          <ListItemIcon><GridOnIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("pdf", true)}>
          <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon>
          <ListItemText>PDF + e-mail to employee</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("save")}>
          <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Save only (no download)</ListItemText>
        </MenuItem>
      </Menu>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.sev}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
