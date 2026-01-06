import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tooltip,
  IconButton,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Switch,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { api } from "../../utils/api";

const statusColor = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "paid" || s === "settled") return "success";
  if (s === "issued" || s === "pending") return "info";
  if (s === "draft") return "default";
  if (s === "void" || s === "refunded") return "warning";
  return "default";
};

const payrollPreviewErrorMessages = {
  no_finalized_payroll_rows_for_period:
    "No finalized payroll rows for the selected period.",
  no_finalized_payroll_rows_for_region:
    "No finalized payroll rows for the selected region.",
  no_finalized_payroll_rows_for_department:
    "No finalized payroll rows for the selected department.",
  no_finalized_payroll_rows_for_recruiters:
    "No finalized payroll rows for the selected recruiters.",
  no_finalized_payroll_rows_for_filters:
    "No finalized payroll rows for the selected filters.",
  invalid_agency_fee_percent: "Agency fee percent must be a valid number.",
  invalid_agency_fee_flat: "Admin / management fee must be a valid number.",
  invalid_tax_rate: "Tax rate must be a valid number.",
};

const ManagerInvoicesPage = () => {
  const [rows, setRows] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [breakdownByEmployee, setBreakdownByEmployee] = useState(false);
  const [agencyFeePercent, setAgencyFeePercent] = useState("");
  const [agencyFeeFlat, setAgencyFeeFlat] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [selectedRecruiterIds, setSelectedRecruiterIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyProfile, setCompanyProfile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recipientDialogOpen, setRecipientDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState("payroll"); // payroll | simple
  const [form, setForm] = useState({
    billing_recipient_id: "",
    period_start: "",
    period_end: "",
    issue_date: "",
    due_date: "",
    currency: "USD",
    status: "draft",
    auto_from_payroll: true,
    notes: "",
    terms: "",
    tax_total: "0",
    discount_total: "0",
    business_name: "",
    business_tax_id: "",
    business_region: "",
    business_address_street: "",
    business_address_city: "",
    business_address_state: "",
    business_address_zip: "",
    business_address_country: "",
    sales_tax_rate: "",
  });
  const [lineItems, setLineItems] = useState([
    { description: "", quantity: "1", unit_price: "", amount: "" },
  ]);
  const [recipientForm, setRecipientForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    address_country: "",
    tax_id: "",
    notes: "",
  });
  const [recipientError, setRecipientError] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/manager/payroll-billing-invoices");
      const data = res.data?.invoices || [];
      setRows(data);
    } catch (err) {
      setError(
        err?.displayMessage ||
          err?.message ||
          "Failed to load invoices. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const res = await api.get("/manager/billing-recipients");
      setRecipients(res.data?.recipients || []);
    } catch (err) {
      // silent
    }
  };

  const fetchRecruiters = async (q = "") => {
    try {
      const res = await api.get("/manager/recruiters", {
        params: {
          ...(q ? { q } : {}),
          ...(includeArchived ? { include_archived: 1 } : {}),
        },
      });
      setRecruiters(res.data?.recruiters || []);
    } catch (err) {
      // silent
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data || []);
    } catch (err) {
      // silent
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const res = await api.get("/admin/company-profile");
      const profile = res.data?.profile || res.data || {};
      setCompanyProfile(profile);
    } catch (err) {
      // ignore silently if not available
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchRecipients();
    fetchCompanyProfile();
    fetchRecruiters();
    fetchDepartments();
  }, [includeArchived]);

  const filteredRecruiters = useMemo(
    () =>
      selectedDepartment
        ? recruiters.filter(
            (r) => String(r.department_id) === String(selectedDepartment)
          )
        : recruiters,
    [recruiters, selectedDepartment]
  );

  const countryCode =
    (form.business_address_country || form.business_region || "").toUpperCase();

  const taxIdLabel =
    countryCode === "CA"
      ? "GST/HST #"
      : countryCode === "US"
      ? "EIN (optional)"
      : "Tax ID";

  const taxRateLabel =
    countryCode === "CA"
      ? "GST/HST rate (%)"
      : countryCode === "US"
      ? "Sales tax rate (%)"
      : "Tax rate (%)";

  const addDays = (baseDate, days) => {
    const date = new Date(baseDate);
    if (Number.isNaN(date.getTime())) return "";
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const handleDownloadPdf = async (invId) => {
    try {
      const res = await api.get(
        `/manager/payroll-billing-invoices/${invId}/pdf`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `payroll-billing-invoice-${invId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.displayMessage ||
          err?.message ||
          "Failed to download PDF."
      );
    }
  };

  const renderActions = (inv) => (
    <Stack direction="row" spacing={1}>
      <Button
        size="small"
        variant="outlined"
        onClick={() => handleDownloadPdf(inv.id)}
      >
        PDF
      </Button>
      <Button
        size="small"
        variant="text"
        onClick={() => handleOpenDialog(inv)}
      >
        Edit
      </Button>
      <Button
        size="small"
        color="error"
        variant="text"
        disabled={(inv.status || "").toLowerCase() !== "draft"}
        onClick={() => handleDelete(inv.id)}
      >
        Delete
      </Button>
    </Stack>
  );

  const normalizeLineItems = (items) => {
    if (!items || !Array.isArray(items)) {
      return [{ description: "", quantity: "1", unit_price: "", amount: "" }];
    }
    return items.length
      ? items.map((li) => ({
          description: li.description || "",
          quantity:
            li.quantity !== undefined && li.quantity !== null
              ? String(li.quantity)
              : "1",
          unit_price:
            li.unit_price !== undefined && li.unit_price !== null
              ? String(li.unit_price)
              : "",
          amount:
            li.amount !== undefined && li.amount !== null
              ? String(li.amount)
              : "",
        }))
      : [{ description: "", quantity: "1", unit_price: "", amount: "" }];
  };

  const handleOpenDialog = async (inv) => {
    setFormError("");
    if (inv && inv.id) {
      try {
        const res = await api.get(`/manager/payroll-billing-invoices/${inv.id}`);
        const detail = res.data?.invoice || inv;
        const customFields = detail.custom_fields || {};
        setEditingId(detail.id);
        setActiveTab(detail.auto_from_payroll ? "payroll" : "simple");
        setForm({
          billing_recipient_id: detail.billing_recipient_id || "",
          period_start: detail.period_start || "",
          period_end: detail.period_end || "",
          issue_date: detail.issue_date || "",
          due_date: detail.due_date || "",
          currency: detail.currency || "USD",
          status: detail.status || "draft",
          auto_from_payroll: !!detail.auto_from_payroll,
          notes: detail.notes || "",
          terms: detail.terms || "",
          business_name:
            detail.business_name ||
            companyProfile?.name ||
            companyProfile?.company_name ||
            "",
          business_tax_id: detail.business_tax_id || "",
          business_region:
            detail.region ||
            companyProfile?.country_code ||
            companyProfile?.province_code ||
            "",
          business_address_street:
            detail.business_address?.street ||
            detail.business_address?.address_street ||
            companyProfile?.address_street ||
            "",
          business_address_city:
            detail.business_address?.city ||
            companyProfile?.address_city ||
            "",
          business_address_state:
            detail.business_address?.state ||
            detail.business_address?.province ||
            companyProfile?.address_state ||
            companyProfile?.province_code ||
            "",
          business_address_zip:
            detail.business_address?.zip ||
            companyProfile?.address_zip ||
            "",
          business_address_country:
            detail.business_address?.country ||
            companyProfile?.country_code ||
            "",
          sales_tax_rate:
            detail.sales_tax_rate !== undefined &&
            detail.sales_tax_rate !== null
              ? String(detail.sales_tax_rate)
              : "",
          tax_total:
            detail.tax_total !== undefined && detail.tax_total !== null
              ? String(detail.tax_total)
              : "0",
          discount_total:
            detail.discount_total !== undefined &&
            detail.discount_total !== null
              ? String(detail.discount_total)
              : "0",
        });
        setLineItems(normalizeLineItems(detail.line_items));
        setSelectedRecruiterIds(
          Array.isArray(detail.recruiter_ids) ? detail.recruiter_ids : []
        );
        const deptId = detail?.generated_from?.department_id;
        setSelectedDepartment(
          deptId !== undefined && deptId !== null ? String(deptId) : ""
        );
        setBreakdownByEmployee(!!detail?.generated_from?.breakdown_by_employee);
        setAgencyFeePercent(
          detail?.generated_from?.agency_fee_percent !== undefined &&
            detail?.generated_from?.agency_fee_percent !== null
            ? String(detail.generated_from.agency_fee_percent)
            : ""
        );
        setAgencyFeeFlat(
          detail?.generated_from?.agency_fee_flat !== undefined &&
            detail?.generated_from?.agency_fee_flat !== null
            ? String(detail.generated_from.agency_fee_flat)
            : ""
        );
        setTaxRate(
          customFields.tax_rate !== undefined && customFields.tax_rate !== null
            ? String(customFields.tax_rate)
            : ""
        );
        setPoNumber(
          customFields.po_number !== undefined && customFields.po_number !== null
            ? String(customFields.po_number)
            : ""
        );
        setPaymentTerms(
          customFields.payment_terms !== undefined &&
            customFields.payment_terms !== null
            ? String(customFields.payment_terms)
            : ""
        );
        setDialogOpen(true);
        return;
      } catch (err) {
        setFormError(
          err?.response?.data?.error ||
            err?.displayMessage ||
            err?.message ||
            "Failed to load invoice details."
        );
      }
    }

    // New invoice defaults based on active tab
    const isPayroll = activeTab === "payroll";
    const defaultNotes = isPayroll && form.auto_from_payroll
      ? "Workforce services reflect gross payroll for the selected period. Outsourcing & management fees cover coordination, payroll processing, and workforce management."
      : "";
    setEditingId(null);
    setForm({
      billing_recipient_id: recipients[0]?.id || "",
      period_start: isPayroll ? "" : "",
      period_end: isPayroll ? "" : "",
      issue_date: "",
      due_date: "",
      currency: "USD",
      status: "draft",
      auto_from_payroll: isPayroll,
      notes: defaultNotes,
      terms: "",
      tax_total: "0",
      discount_total: "0",
      business_name:
        companyProfile?.name || companyProfile?.company_name || "",
      business_tax_id: companyProfile?.business_number || "",
      business_region:
        companyProfile?.country_code || companyProfile?.province_code || "",
      business_address_street: companyProfile?.address_street || "",
      business_address_city: companyProfile?.address_city || "",
      business_address_state:
        companyProfile?.address_state || companyProfile?.province_code || "",
      business_address_zip: companyProfile?.address_zip || "",
      business_address_country: companyProfile?.country_code || "",
      sales_tax_rate: "",
    });
    setLineItems([{ description: "", quantity: "1", unit_price: "", amount: "" }]);
    setSelectedRecruiterIds([]);
    setSelectedDepartment("");
    setBreakdownByEmployee(false);
    setAgencyFeePercent("");
    setAgencyFeeFlat("");
    setTaxRate("");
    setPoNumber("");
    setPaymentTerms("");
    setDialogOpen(true);
  };

  const handleLineChange = (idx, field, value) => {
    setLineItems((items) =>
      items.map((li, i) =>
        i === idx ? { ...li, [field]: value } : li
      )
    );
  };

  const handleAddLine = () => {
    setLineItems((items) => [
      ...items,
      { description: "", quantity: "1", unit_price: "", amount: "" },
    ]);
  };

  const handleRemoveLine = (idx) => {
    setLineItems((items) => items.filter((_, i) => i !== idx));
  };

  const handleRecipientSave = async () => {
    setSavingRecipient(true);
    setRecipientError("");
    try {
      if (
        !recipientForm.company_name &&
        !recipientForm.contact_name &&
        !recipientForm.email
      ) {
        setRecipientError("Please enter a company, contact, or email.");
        setSavingRecipient(false);
        return;
      }
      const payload = { ...recipientForm };
      const res = await api.post("/manager/billing-recipients", payload);
      const newRec = res.data?.recipient || res.data?.billing_recipient;
      await fetchRecipients();
      setForm((f) => ({
        ...f,
        billing_recipient_id:
          newRec?.id ||
          f.billing_recipient_id ||
          recipients[0]?.id ||
          "",
      }));
      setRecipientDialogOpen(false);
      setRecipientForm({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        address_street: "",
        address_city: "",
        address_state: "",
        address_zip: "",
        address_country: "",
        tax_id: "",
        notes: "",
      });
    } catch (err) {
      setRecipientError(
        err?.response?.data?.error ||
          err?.displayMessage ||
          err?.message ||
          "Failed to save recipient."
      );
    } finally {
      setSavingRecipient(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError("");
    try {
      const cleanedLines = (lineItems || [])
        .map((li) => {
          const desc = (li.description || "").trim();
          if (!desc) return null;
          const qty = parseFloat(li.quantity || "1");
          const unit = parseFloat(li.unit_price || "0");
          const hasAmount =
            li.amount !== "" &&
            li.amount !== undefined &&
            li.amount !== null;
          const amt = hasAmount ? parseFloat(li.amount) : qty * unit;
          return {
            description: desc,
            quantity: isNaN(qty) ? 1 : qty,
            unit_price: isNaN(unit) ? 0 : unit,
            amount: isNaN(amt) ? undefined : amt,
          };
        })
        .filter(Boolean);

      if (activeTab === "simple" && cleanedLines.length === 0) {
        setFormError("Add at least one line item with a description for a simple invoice.");
        setSaving(false);
        return;
      }

      const customFields = {};
      if (activeTab === "simple" && taxRate !== "") {
        customFields.tax_rate = Number(taxRate);
      }
      if (paymentTerms) {
        customFields.payment_terms = paymentTerms;
      }
      if (poNumber) {
        customFields.po_number = poNumber;
      }

      const payload = {
        billing_recipient_id: form.billing_recipient_id,
        period_start: activeTab === "payroll" ? form.period_start : undefined,
        period_end: activeTab === "payroll" ? form.period_end : undefined,
        issue_date: form.issue_date || undefined,
        due_date: form.due_date || undefined,
        currency: form.currency || "USD",
        status: form.status || "draft",
        auto_from_payroll:
          activeTab === "payroll" ? !!form.auto_from_payroll : false,
        notes: form.notes || undefined,
        terms: form.terms || undefined,
        business_name: form.business_name || undefined,
        business_tax_id: form.business_tax_id || undefined,
        region:
          form.business_region ||
          companyProfile?.country_code ||
          companyProfile?.province_code,
        recruiter_ids:
          activeTab === "payroll" ? selectedRecruiterIds : [],
        department_id:
          activeTab === "payroll" && selectedDepartment
            ? Number(selectedDepartment)
            : undefined,
        breakdown_by_employee:
          activeTab === "payroll" ? !!breakdownByEmployee : undefined,
        agency_fee_percent:
          activeTab === "payroll" && agencyFeePercent !== ""
            ? Number(agencyFeePercent)
            : undefined,
        agency_fee_flat:
          activeTab === "payroll" && agencyFeeFlat !== ""
            ? Number(agencyFeeFlat)
            : undefined,
        tax_rate:
          activeTab === "simple" && taxRate !== "" ? Number(taxRate) : undefined,
        po_number: poNumber || undefined,
        custom_fields: Object.keys(customFields).length ? customFields : undefined,
        business_address: {
          street: form.business_address_street || undefined,
          city: form.business_address_city || undefined,
          state: form.business_address_state || undefined,
          zip: form.business_address_zip || undefined,
          country:
            form.business_address_country ||
            companyProfile?.country_code ||
            undefined,
        },
        sales_tax_rate:
          form.sales_tax_rate !== ""
            ? Number(form.sales_tax_rate)
            : undefined,
        tax_total: form.tax_total !== "" ? Number(form.tax_total) : 0,
            discount_total:
              form.discount_total !== "" ? Number(form.discount_total) : 0,
            line_items: cleanedLines,
          };

      // Run preview first for payroll invoices to ensure payroll data exists.
      if (activeTab === "payroll" && payload.auto_from_payroll) {
        try {
          const prev = await api.post(
            "/manager/payroll-billing-invoices/preview",
            payload
          );
          const subtotalPrev = Number(prev.data?.subtotal || 0);
          if (!subtotalPrev) {
            setFormError(
              "No finalized payroll rows for the selected period."
            );
            setSaving(false);
            return;
          }
        } catch (err) {
          const code = err?.response?.data?.error;
          const mapped = payrollPreviewErrorMessages[code];
          setFormError(
            mapped ||
              err?.response?.data?.error ||
              err?.displayMessage ||
              err?.message ||
              "Preview failed."
          );
          setSaving(false);
          return;
        }
      }

      if (editingId) {
        await api.put(
          `/manager/payroll-billing-invoices/${editingId}`,
          payload
        );
      } else {
        await api.post("/manager/payroll-billing-invoices", payload);
      }
      setDialogOpen(false);
      setEditingId(null);
      fetchInvoices();
    } catch (err) {
      const code = err?.response?.data?.error;
      const mapped = payrollPreviewErrorMessages[code];
      setFormError(
        mapped ||
          err?.response?.data?.error ||
          err?.displayMessage ||
          err?.message ||
          "Failed to create invoice."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Delete this invoice? Only draft invoices can be deleted."
    );
    if (!confirmed) return;
    try {
      await api.delete(`/manager/payroll-billing-invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.displayMessage ||
          err?.message ||
          "Failed to delete invoice."
      );
    }
  };

  const displayRows =
    rows?.filter((r) =>
      activeTab === "payroll" ? !!r.auto_from_payroll : !r.auto_from_payroll
    ) || [];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Billing & Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create invoices for payroll billing (auto from finalized payroll) or
            simple/manual invoices with your own line items.
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Tip: a “billing recipient” is the customer you invoice (not your own
            company). Add one and generate an invoice in one flow.
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => handleOpenDialog(null)}>
          {activeTab === "payroll"
            ? "New payroll billing invoice"
            : "New simple invoice"}
        </Button>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 2 }}
      >
        <Tab label="Payroll billing (auto from payroll)" value="payroll" />
        <Tab label="Simple / manual invoices" value="simple" />
      </Tabs>

      {loading ? (
        <Stack alignItems="center" py={6}>
          <CircularProgress />
        </Stack>
      ) : error ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button sx={{ mt: 1 }} onClick={fetchInvoices} variant="outlined">
            Retry
          </Button>
        </Paper>
      ) : displayRows.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>
            No {activeTab === "payroll" ? "payroll billing" : "simple"} invoices
            yet.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Due</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayRows.map((inv) => {
                const invoiceNumber = inv.invoice_number || inv.id || "—";
                const snap = inv.billing_snapshot || {};
                const recipientName =
                  snap.company_name ||
                  snap.contact_name ||
                  snap.email ||
                  "Unknown";
                const total = inv.total ?? inv.amount ?? 0;
                const currency = inv.currency || "";
                const period =
                  inv.auto_from_payroll && inv.period_start && inv.period_end
                    ? `${inv.period_start} → ${inv.period_end}`
                    : "—";
                return (
                  <TableRow key={inv.id}>
                    <TableCell>{invoiceNumber}</TableCell>
                    <TableCell>
                      <Stack spacing={0.4}>
                        <Typography variant="body2">
                          {recipientName}
                        </Typography>
                        {snap.email ? (
                          <Typography variant="caption" color="text.secondary">
                            {snap.email}
                          </Typography>
                        ) : null}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{period}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={(inv.status || "unknown").toUpperCase()}
                        color={statusColor(inv.status)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {currency} {Number(total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {inv.issue_date ||
                        inv.created_at ||
                        inv.created ||
                        ""}
                    </TableCell>
                    <TableCell>{inv.due_date || "—"}</TableCell>
                    <TableCell>{renderActions(inv)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId
            ? activeTab === "payroll"
              ? "Edit payroll billing invoice"
              : "Edit simple invoice"
            : activeTab === "payroll"
            ? "New payroll billing invoice"
            : "New simple invoice"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {!recipients.length ? (
              <Alert severity="info">
                Add a billing recipient first. This is the company/person you
                will invoice (not your own company).
              </Alert>
            ) : null}
            <TextField
              label="Search recipients"
              fullWidth
              value={recipientSearch}
              onChange={(e) => setRecipientSearch(e.target.value)}
              placeholder="Search by name, company, or email"
            />
            <TextField
              select
              fullWidth
              label="Recipient"
              value={form.billing_recipient_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, billing_recipient_id: e.target.value }))
              }
              InputProps={{
                endAdornment: (
                  <Tooltip title="Add recipient">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => setRecipientDialogOpen(true)}
                    >
                      <AddCircleOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ),
              }}
            >
              {(() => {
                const q = recipientSearch.trim().toLowerCase();
                const base = [...(recipients || [])];
                const filtered = q
                  ? base.filter(
                      (r) =>
                        (r.company_name || "").toLowerCase().includes(q) ||
                        (r.contact_name || "").toLowerCase().includes(q) ||
                        (r.email || "").toLowerCase().includes(q)
                    )
                  : base.slice(-5).reverse(); // last 5 added, most recent first
                return filtered.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.company_name || r.contact_name || r.email || r.id}
                  </MenuItem>
                ));
              })()}
              {recipients.length === 0 ? (
                <MenuItem value="">No recipients yet</MenuItem>
              ) : null}
            </TextField>
            {activeTab === "payroll" ? (
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Period start"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.period_start}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, period_start: e.target.value }))
                  }
                />
                <TextField
                  label="Period end"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={form.period_end}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, period_end: e.target.value }))
                  }
                />
              </Stack>
            ) : null}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Issue date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.issue_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issue_date: e.target.value }))
                }
              />
              <TextField
                label="Due date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </Stack>
            <TextField
              select
              fullWidth
              label="Payment terms"
              value={paymentTerms}
              onChange={(e) => {
                const next = e.target.value;
                setPaymentTerms(next);
                if (!form.due_date && next) {
                  const base = form.issue_date || new Date().toISOString().slice(0, 10);
                  const days = next === "Net 7" ? 7 : next === "Net 15" ? 15 : next === "Net 30" ? 30 : 0;
                  const due = days ? addDays(base, days) : "";
                  if (due) {
                    setForm((f) => ({ ...f, due_date: due }));
                  }
                }
              }}
            >
              <MenuItem value="">
                <em>Custom</em>
              </MenuItem>
              {["Net 7", "Net 15", "Net 30"].map((term) => (
                <MenuItem key={term} value={term}>
                  {term}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Currency"
                fullWidth
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
              />
              <TextField
                select
                fullWidth
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                {["draft", "issued"].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Divider />
            <Typography variant="subtitle2">Your business info</Typography>
            <Typography variant="caption" color="text.secondary">
              Prefilled from Company Profile; editable per invoice.
            </Typography>
            <TextField
              label="Business legal name"
              fullWidth
              value={form.business_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, business_name: e.target.value }))
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={taxIdLabel}
                fullWidth
                value={form.business_tax_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_tax_id: e.target.value }))
                }
                helperText="Enter your business tax ID if applicable."
              />
              <TextField
                label="Region (auto)"
                fullWidth
                value={form.business_region}
                onChange={(e) =>
                  setForm((f) => ({ ...f, business_region: e.target.value }))
                }
                helperText="Country/region code."
              />
            </Stack>
            <Stack spacing={1}>
              <TextField
                label="Business address street"
                fullWidth
                value={form.business_address_street}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    business_address_street: e.target.value,
                  }))
                }
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="City"
                  fullWidth
                  value={form.business_address_city}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      business_address_city: e.target.value,
                    }))
                  }
                />
                <TextField
                  label="State/Province"
                  fullWidth
                  value={form.business_address_state}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      business_address_state: e.target.value,
                    }))
                  }
                />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField
                  label="Postal / ZIP"
                  fullWidth
                  value={form.business_address_zip}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      business_address_zip: e.target.value,
                    }))
                  }
                />
                <TextField
                  label="Country"
                  fullWidth
                  value={form.business_address_country}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      business_address_country: e.target.value,
                    }))
                  }
                />
              </Stack>
            </Stack>
            <TextField
              label="PO number / reference"
              fullWidth
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
            {activeTab === "payroll" ? (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!form.auto_from_payroll}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          auto_from_payroll: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Auto-generate lines from finalized payroll"
                />
                <Alert severity="info">
                  When auto-generate is on, Schedulaa pulls wages and employer
                  costs from finalized payroll for the selected period. You can
                  still add extra fees with line items below.
                </Alert>
                <Divider />
                <Typography variant="subtitle2">Outsourcing billing</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={breakdownByEmployee}
                        onChange={(e) => setBreakdownByEmployee(e.target.checked)}
                      />
                    }
                    label="Break down by employee"
                  />
                  <Tooltip title="When ON, Schedulaa creates one line per employee using that employee’s gross pay. When OFF, it creates one combined ‘Workforce services (gross payroll)’ line for the period.">
                    <IconButton size="small" aria-label="Break down by employee info">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="body2">Outsourcing &amp; management fee (%)</Typography>
                      <Tooltip title="Adds a markup percentage on top of the gross services total. Example: Gross 4,336.50 with 20% fee adds 867.30 → Total 5,203.80.">
                        <IconButton size="small" aria-label="Agency fee percent info">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <TextField
                      type="number"
                      fullWidth
                      placeholder="20"
                      inputProps={{ step: "0.01" }}
                      value={agencyFeePercent}
                      onChange={(e) => setAgencyFeePercent(e.target.value)}
                      helperText="Applied to gross services total."
                    />
                  </Stack>
                  <Stack spacing={0.5} sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="body2">Outsourcing &amp; management fee (flat)</Typography>
                      <Tooltip title="Adds a fixed fee to the invoice. Example: Add 50.00 to cover processing/management.">
                        <IconButton size="small" aria-label="Admin fee info">
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <TextField
                      type="number"
                      fullWidth
                      placeholder="50"
                      inputProps={{ step: "0.01" }}
                      value={agencyFeeFlat}
                      onChange={(e) => setAgencyFeeFlat(e.target.value)}
                    />
                  </Stack>
                </Stack>
              </>
            ) : (
              <Alert severity="info">
                Simple invoice: enter your own line items. Period fields are
                optional and payroll data is not auto-loaded.
              </Alert>
            )}
            <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
              {activeTab === "simple" ? (
                <TextField
                  label={taxRateLabel}
                  type="number"
                  fullWidth
                  inputProps={{ step: "0.01" }}
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  helperText="If set, Schedulaa calculates Tax total automatically."
                />
              ) : null}
              <TextField
                label="Tax total"
                type="number"
                fullWidth
                inputProps={{ step: "0.01" }}
                value={form.tax_total}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tax_total: e.target.value }))
                }
                helperText={
                  activeTab === "simple" && taxRate !== ""
                    ? "Auto-calculated from tax rate unless you override it."
                    : "Enter total tax for this invoice (optional)."
                }
              />
              <TextField
                label="Discount total"
                type="number"
                fullWidth
                inputProps={{ step: "0.01" }}
                value={form.discount_total}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_total: e.target.value }))
                }
                helperText="Enter total discount (optional)."
              />
            </Stack>
            <Divider />
          <Stack spacing={1}>
            {activeTab === "payroll" ? (
              <Stack spacing={1}>
                <TextField
                  select
                  fullWidth
                  label="Department (optional)"
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value);
                    setSelectedRecruiterIds([]);
                  }}
                >
                  <MenuItem value="">
                    <em>All Departments</em>
                  </MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </MenuItem>
                  ))}
                </TextField>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                    />
                  }
                  label="Show archived employees"
                />
                <TextField
                  label="Search recruiters"
                  fullWidth
                  value={recruiterSearch}
                  onChange={(e) => {
                    setRecruiterSearch(e.target.value);
                    fetchRecruiters(e.target.value);
                  }}
                  placeholder="Search by name or email"
                />
                <TextField
                  select
                  fullWidth
                  SelectProps={{ multiple: true }}
                  label="Bill these recruiters (optional)"
                  value={selectedRecruiterIds}
                  onChange={(e) => setSelectedRecruiterIds(e.target.value)}
                  helperText="Leave empty to bill all recruiters for this payroll period."
                >
                  {filteredRecruiters.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {`${r.first_name || ""} ${r.last_name || ""}`.trim() ||
                        r.email ||
                        `Recruiter ${r.id}`}
                      {r.email ? ` — ${r.email}` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            ) : null}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Line items</Typography>
              <Button size="small" onClick={handleAddLine}>
                Add line
              </Button>
              </Stack>
              {lineItems.map((li, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    alignItems: "center",
                  }}
                >
                  <TextField
                    label="Description"
                    fullWidth
                    sx={{ flex: "1 1 240px" }}
                    value={li.description}
                    onChange={(e) =>
                      handleLineChange(idx, "description", e.target.value)
                    }
                  />
                  <TextField
                    label="Qty"
                    type="number"
                    sx={{ width: 100, flex: "0 0 auto" }}
                    value={li.quantity}
                    onChange={(e) =>
                      handleLineChange(idx, "quantity", e.target.value)
                    }
                    inputProps={{ step: "0.01" }}
                  />
                  <TextField
                    label="Unit price"
                    type="number"
                    sx={{ width: 140, flex: "0 0 auto" }}
                    value={li.unit_price}
                    onChange={(e) =>
                      handleLineChange(idx, "unit_price", e.target.value)
                    }
                    inputProps={{ step: "0.01" }}
                  />
                  <TextField
                    label="Amount"
                    type="number"
                    sx={{ width: 160, flex: "0 0 auto" }}
                    value={li.amount}
                    onChange={(e) =>
                      handleLineChange(idx, "amount", e.target.value)
                    }
                    helperText="Optional; auto = qty × price"
                    inputProps={{ step: "0.01" }}
                  />
                  <IconButton
                    onClick={() => handleRemoveLine(idx)}
                    disabled={lineItems.length === 1}
                    size="small"
                    sx={{ ml: "auto" }}
                  >
                    ✕
                  </IconButton>
                </Box>
              ))}
              {activeTab === "simple" ? (
                <Typography variant="caption" color="text.secondary">
                  Simple invoices require at least one line item. Amount is auto
                  calculated if left blank.
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  For payroll billing, these are optional extra fees/adjustments.
                </Typography>
              )}
            </Stack>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
            <TextField
              label="Terms"
              multiline
              minRows={2}
              value={form.terms}
              onChange={(e) =>
                setForm((f) => ({ ...f, terms: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setEditingId(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">
            {saving ? "Saving..." : editingId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={recipientDialogOpen}
        onClose={() => setRecipientDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          New billing recipient{" "}
          <Tooltip title="This is who you will invoice (client/partner). Not your own company.">
            <HelpOutlineIcon fontSize="small" />
          </Tooltip>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            {recipientError ? (
              <Alert severity="error">{recipientError}</Alert>
            ) : null}
            <TextField
              label="Company / Recipient name"
              fullWidth
              value={recipientForm.company_name}
              onChange={(e) =>
                setRecipientForm((f) => ({
                  ...f,
                  company_name: e.target.value,
                }))
              }
            />
            <TextField
              label="Contact name"
              fullWidth
              value={recipientForm.contact_name}
              onChange={(e) =>
                setRecipientForm((f) => ({
                  ...f,
                  contact_name: e.target.value,
                }))
              }
            />
            <TextField
              label="Email"
              fullWidth
              value={recipientForm.email}
              onChange={(e) =>
                setRecipientForm((f) => ({
                  ...f,
                  email: e.target.value,
                }))
              }
            />
            <TextField
              label="Phone"
              fullWidth
              value={recipientForm.phone}
              onChange={(e) =>
                setRecipientForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
            <Divider />
            <TextField
              label="Address street"
              fullWidth
              value={recipientForm.address_street}
              onChange={(e) =>
                setRecipientForm((f) => ({
                  ...f,
                  address_street: e.target.value,
                }))
              }
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                fullWidth
                value={recipientForm.address_city}
                onChange={(e) =>
                  setRecipientForm((f) => ({
                    ...f,
                    address_city: e.target.value,
                  }))
                }
              />
              <TextField
                label="State/Province"
                fullWidth
                value={recipientForm.address_state}
                onChange={(e) =>
                  setRecipientForm((f) => ({
                    ...f,
                    address_state: e.target.value,
                  }))
                }
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Postal / ZIP"
                fullWidth
                value={recipientForm.address_zip}
                onChange={(e) =>
                  setRecipientForm((f) => ({
                    ...f,
                    address_zip: e.target.value,
                  }))
                }
              />
              <TextField
                label="Country"
                fullWidth
                value={recipientForm.address_country}
                onChange={(e) =>
                  setRecipientForm((f) => ({
                    ...f,
                    address_country: e.target.value,
                  }))
                }
              />
            </Stack>
            <TextField
              label="Tax ID"
              fullWidth
              value={recipientForm.tax_id}
              onChange={(e) =>
                setRecipientForm((f) => ({ ...f, tax_id: e.target.value }))
              }
            />
            <TextField
              label="Notes (internal)"
              multiline
              minRows={2}
              value={recipientForm.notes}
              onChange={(e) =>
                setRecipientForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecipientDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={savingRecipient}
            onClick={handleRecipientSave}
          >
            {savingRecipient ? "Saving..." : "Save recipient"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagerInvoicesPage;
