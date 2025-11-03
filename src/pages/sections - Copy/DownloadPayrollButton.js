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
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import GridOnIcon from "@mui/icons-material/GridOn";
import EmailIcon from "@mui/icons-material/Email";
import axios from "axios";
import dayjs from "dayjs";

/* -----------------------------------------------------------
   Helper – ensure we always pass a valid YYYY-MM to backend
----------------------------------------------------------- */
const monthOrFallback = (month, startISO) =>
  month?.length === 7 ? month : dayjs(startISO).format("YYYY-MM");

/* -----------------------------------------------------------
   Component
----------------------------------------------------------- */
export default function DownloadPayrollButton({
  recruiterId,
  region = "ca",
  month = "",
  startDate = "",
  endDate = "",
  selectedColumns = [],
  token = "",
  payroll = {}, // ← NEW: entire payroll object so we can send bonuses, etc.
}) {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });

  /* ---------- open/close menu ---------- */
  const openMenu = (e) => setAnchor(e.currentTarget);
  const closeMenu = () => setAnchor(null);

  /* ---------- download handler ---------- */
  const handleDownload = async (fmt, emailToEmployee = false) => {
    closeMenu();
    if (busy) return;
    setBusy(true);

    try {
      /* 1️⃣  Normalize dates */
      const firstOfMonth = dayjs(payroll.start_date || startDate || undefined).isValid()
  ? (payroll.start_date || startDate)
  : dayjs().format("YYYY-MM-01");

const lastOfMonth = dayjs(payroll.end_date || endDate || firstOfMonth)
  .endOf("month")
  .format("YYYY-MM-DD");

const startISO = payroll.start_date || startDate || firstOfMonth;
const endISO = payroll.end_date || endDate || lastOfMonth;

      const safeMonth = monthOrFallback(month, startISO);

      if (!recruiterId || !startISO || !endISO) {
        setSnack({
          open: true,
          msg: "Missing recruiter or dates for export.",
          sev: "error",
        });
        return;
      }

      /* 2️⃣  Finalize + export single employee (ensures DB row exists) */
      const finalizeURL = `${API_URL}/automation/payroll/finalize-and-export`;
      await axios.post(
        finalizeURL,
        {
          recruiter_id: recruiterId,
          month: safeMonth,
          region,
          start_date: startISO,
          end_date: endISO,
          email_to_employee: emailToEmployee,

          /* include all bonus / deduction overrides */
          bonus: payroll.bonus || 0,
          attendance_bonus: payroll.attendance_bonus || 0,
          performance_bonus: payroll.performance_bonus || 0,
          commission: payroll.commission || 0,
          tip: payroll.tip || 0,
          parental_insurance: payroll.parental_insurance || 0,
          travel_allowance: payroll.travel_allowance || 0,
          family_bonus: payroll.family_bonus || 0,
          tax_credit: payroll.tax_credit || 0,

          medical_insurance: payroll.medical_insurance || 0,
          dental_insurance: payroll.dental_insurance || 0,
          life_insurance: payroll.life_insurance || 0,
          retirement_amount: payroll.retirement_amount || 0,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      /* 3️⃣  Build export URL (pdf / csv / xlsx) */
      const exportURL = new URL(
        `${API_URL}/automation/payroll/export-finalized`
      );
      exportURL.searchParams.append("recruiter_id", recruiterId);
      exportURL.searchParams.append("region", region);
      exportURL.searchParams.append("start_date", startISO);
      exportURL.searchParams.append("end_date", endISO);
      exportURL.searchParams.append("format", fmt);
      // month can be blank in weekly picker – that’s ok
      exportURL.searchParams.append("month", safeMonth);

      /* ensure mandatory cols survive the slice on server */
      const cols = Array.from(
        new Set([
          ...(selectedColumns || []),
          "employee_name",
          "include_vacation_in_gross",
        ])
      );
      cols.forEach((c) => exportURL.searchParams.append("columns[]", c));

      /* 4️⃣  Fetch file */
      const resp = await axios.get(exportURL.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      /* 5️⃣  Trigger client download */
      const blob = new Blob([resp.data], { type: resp.headers["content-type"] });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `payroll_${safeMonth}_${recruiterId}.${fmt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnack({
        open: true,
        msg: emailToEmployee
          ? "PDF downloaded and e-mailed to employee ✅"
          : "File downloaded ✅",
        sev: "success",
      });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, msg: `Export failed: ${err.message}`, sev: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* ----------- trigger button ----------- */}
      <Tooltip title="Finalize payroll & download">
        <span>
          <Button
            variant="contained"
            color="success"
            startIcon={busy ? <CircularProgress size={18} /> : <DownloadIcon />}
            onClick={openMenu}
            disabled={busy}
          >
            Download Payroll
          </Button>
        </span>
      </Tooltip>

      {/* ----------- format menu ----------- */}
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu}>
        <MenuItem onClick={() => handleDownload("pdf")}>
          <ListItemIcon>
            <PictureAsPdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>PDF</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("csv")}>
          <ListItemIcon>
            <TableChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>CSV</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("xlsx")}>
          <ListItemIcon>
            <GridOnIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Excel</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDownload("pdf", true)}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>PDF &amp; e-mail to employee</ListItemText>
        </MenuItem>
      </Menu>

      {/* ----------- snackbar ----------- */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
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
