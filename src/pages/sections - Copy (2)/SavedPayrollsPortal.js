import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EmailIcon from "@mui/icons-material/Email";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";

const SavedPayrollsPortal = ({ token, currentUser }) => {
  const isManager =
    currentUser?.is_manager ?? currentUser?.isManager ?? currentUser?.role === "manager";

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [payrolls, setPayrolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recruiters, setRecruiters] = useState([]);
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Your payslip for {month} is now available");
  const [emailBody, setEmailBody] = useState("Hello {name},\n\nYour payslip for {month} is ready. Download it here: {link}\n\nBest regards.");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (!token || !currentUser) return;
    if (isManager) fetchRecruiters();
    fetchPayrolls();
  }, [token, currentUser, isManager, monthFilter, startDate, endDate, recruiterFilter, page, rowsPerPage]);

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`${API_URL}/recruiters/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecruiters(res.data);
    } catch (err) {
      console.error("Failed to fetch recruiters", err);
    }
  };

  const fetchPayrolls = async () => {
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (monthFilter) params.month = monthFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (isManager && recruiterFilter) params.recruiter_id = recruiterFilter;


      const res = await axios.get(`${API_URL}/main/payroll_portal_list`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setPayrolls(res.data.results || []);
      setTotal(res.data.total || 0);
      setSelected([]);
    } catch (err) {
      console.error("Failed to fetch saved payrolls", err);
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await fetch(`${API_URL}/main/payroll_portal_download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download payroll", err);
    }
  };

  const handleManualIssue = async (id) => {
    try {
      await axios.post(`${API_URL}/main/payroll_portal_manual_issue/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPayrolls();
    } catch (err) {
      console.error("Manual issue failed", err);
    }
  };

  const handleDelete = async () => {
    if (!selected.length) return;
    try {
      await axios.delete(`${API_URL}/main/payroll_portal_delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { ids: selected },
      });
      fetchPayrolls();
    } catch (err) {
      console.error("Failed to delete payrolls", err);
    }
  };

  const handleBulkDownload = async () => {
    try {
      const params = new URLSearchParams();
      selected.forEach((id) => params.append("ids", id));
      const res = await fetch(`${API_URL}/main/payroll_portal_download_bulk?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "payrolls_bundle.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download bulk payrolls", err);
    }
  };

  const handleSendEmails = async () => {
    try {
      await axios.post(
        `${API_URL}/main/payroll_portal_notify`,
        { ids: selected, subject: emailSubject, body: emailBody },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmailDialogOpen(false);
    } catch (err) {
      console.error("Failed to send emails", err);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Saved Payrolls
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField label="Month" type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} size="small" />
        <TextField label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small" />
        <TextField label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small" />
        {isManager && (
          <Select value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} displayEmpty size="small">
            <MenuItem value="">All Recruiters</MenuItem>
            {recruiters.map((r) => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
          </Select>
        )}
        <Button onClick={fetchPayrolls} variant="outlined">Apply Filters</Button>
      </Box>

      {isManager && (
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={selected.length === payrolls.length && payrolls.length > 0}
                onChange={(e) =>
                  setSelected(e.target.checked ? payrolls.map((p) => p.id) : [])
                }
              />
            }
            label="Select All"
          />
          {selected.length > 0 && (
            <>
              <IconButton onClick={handleDelete} color="error"><DeleteIcon /></IconButton>
              <Button onClick={handleBulkDownload} variant="outlined">Download Selected</Button>
              <Button onClick={() => setEmailDialogOpen(true)} variant="contained" startIcon={<EmailIcon />}>Send Emails</Button>
            </>
          )}
        </Box>
      )}

      <Table>
        <TableHead>
          <TableRow>
            {isManager && <TableCell>Select</TableCell>}
            <TableCell>Recruiter</TableCell>
            <TableCell>Month</TableCell>
            <TableCell>Start</TableCell>
            <TableCell>End</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payrolls.map((p) => (
            <TableRow key={p.id}>
              {isManager && (
                <TableCell>
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onChange={() =>
                      setSelected((prev) =>
                        prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                      )
                    }
                  />
                </TableCell>
              )}
              <TableCell>{p.recruiter_name}</TableCell>
              <TableCell>{p.month}</TableCell>
              <TableCell>{p.start_date}</TableCell>
              <TableCell>{p.end_date}</TableCell>
              <TableCell>
                <Button onClick={() => handleDownload(p.id)} size="small">Download</Button>
                <Button
                  variant="outlined"
                  size="small"
                  component="a"
                  href={`/payroll/download/${p.id}`}
                  target="_blank"
                  sx={{ ml: 1 }}
                >
                  View
                </Button>
                <Tooltip title="Manually Issue">
                  <IconButton onClick={() => handleManualIssue(p.id)} size="small" sx={{ ml: 1 }}>
                    <UploadFileIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />

      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} fullWidth>
        <DialogTitle>Send Payslip Emails</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Email Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} margin="normal" />
          <TextField fullWidth multiline rows={6} label="Email Body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSendEmails} variant="contained">Send</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedPayrollsPortal;
