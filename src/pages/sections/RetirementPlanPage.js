import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import api from "../../utils/api";
import ManagementFrame from "../../components/ui/ManagementFrame";

export default function RetirementPlanPage({ token }) {
  const [country, setCountry] = useState("us");
  const [plan, setPlan] = useState({
    id: null,
    plan_type: "401k_traditional",
    enable_ytd_caps: false,
    annual_employee_limit: "",
    employer_match_percent: "",
    employee_contrib_method: "percent",
    employee_contrib_percent_default: "",
    employee_contrib_flat_default: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("info");

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadPlan = async (c) => {
    try {
      const res = await api.get(`/automation/retirement/plan`, {
        params: { country: c },
        headers: authHeaders,
      });
      if (res.data && Object.keys(res.data).length > 0) {
        setPlan((prev) => ({
          ...prev,
          ...res.data,
          plan_type: res.data.plan_type || prev.plan_type,
          employee_contrib_method: res.data.employee_contrib_method || prev.employee_contrib_method || "percent",
        }));
      } else {
        setPlan((prev) => ({
          id: null,
          plan_type: c === "ca" ? "rrsp_group" : "401k_traditional",
          enable_ytd_caps: false,
          annual_employee_limit: "",
          employer_match_percent: "",
          employee_contrib_percent_default: "",
          employee_contrib_flat_default: "",
        }));
      }
    } catch (err) {
      console.error("Failed to load plan", err?.response?.data || err.message);
    }
  };

  useEffect(() => {
    const fetchCompanyCountry = async () => {
      try {
        const res = await api.get(`/admin/company-profile`, { headers: authHeaders });
        const code = (res.data?.country_code || "us").toLowerCase();
        const c = code.startsWith("ca") ? "ca" : "us";
        setCountry(c);
        loadPlan(c);
      } catch (err) {
        console.error("Failed to load company profile", err?.response?.data || err.message);
      }
    };
    fetchCompanyCountry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(""), 4500);
      return () => clearTimeout(t);
    }
  }, [message]);

  const handleSave = async () => {
    if (country === "ca") return;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...plan,
        country,
        employee_contrib_percent_default:
          plan.employee_contrib_method === "percent" ? plan.employee_contrib_percent_default : null,
        employee_contrib_flat_default:
          plan.employee_contrib_method === "flat" ? plan.employee_contrib_flat_default : null,
      };
      await api.post(`/automation/retirement/plan`, payload, {
        headers: authHeaders,
      });
      setMessage("Plan saved");
      setSeverity("success");
      loadPlan(country);
    } catch (err) {
      console.error("Save failed", err?.response?.data || err.message);
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  const useRecommendedDefaults = () => {
    setPlan((prev) => ({
      ...prev,
      plan_type: "401k_traditional",
      employee_contrib_method: "percent",
      employee_contrib_percent_default: 5,
      employee_contrib_flat_default: "",
      annual_employee_limit: 23000,
      enable_ytd_caps: true,
      employer_match_percent: "",
    }));
  };

  const handleMethodChange = (val) => {
    setPlan((p) => ({
      ...p,
      employee_contrib_method: val,
      employee_contrib_percent_default: val === "percent" ? (p.employee_contrib_percent_default || 5) : "",
      employee_contrib_flat_default: val === "flat" ? (p.employee_contrib_flat_default || "") : "",
    }));
  };

  const capsError = plan.enable_ytd_caps && (plan.annual_employee_limit === "" || plan.annual_employee_limit === null);
  const hasInputs =
    plan.id ||
    [plan.employee_contrib_percent_default, plan.employee_contrib_flat_default, plan.annual_employee_limit, plan.employer_match_percent].some(
      (v) => v !== "" && v !== null
    );

  return (
    <ManagementFrame title="Retirement Plans" subtitle="Configure company retirement plan defaults (enterprise mode).">
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Alert severity="info">
            <Typography variant="subtitle2" fontWeight={700}>How Enterprise Retirement Works</Typography>
            <Typography variant="body2">
              In Enterprise mode, Schedulaa calculates 401(k) automatically using plan defaults, employee elections, and annual IRS limits. Contributions are capped and W-2s are updated. Enable Enterprise in Company Profile → Payroll Settings; configure plan details here (Manager → Payroll → Retirement Plans).
            </Typography>
          </Alert>
          {country === "us" && !plan?.id && (
            <Alert severity="warning">
              401(k) is currently OFF. Payroll will not calculate retirement until a plan is saved.
            </Alert>
          )}
          {country === "us" && plan?.id && (
            <Alert severity="success">
              401(k) is active for U.S. payroll.
            </Alert>
          )}

          <Accordion defaultExpanded={false}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" fontWeight={700}>Retirement Plan Guide</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                1) Turn on Enterprise mode in Company Profile → Payroll Settings.<br />
                2) Set plan defaults here (percent/flat, annual limit, optional employer match).<br />
                3) Employees can set their own election; if blank, the plan default is used.<br />
                4) Payroll preview/finalize auto-applies the election/default and stops at the annual cap. W-2 Box 12 D is populated from finalized payrolls.
              </Typography>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Real-world scenario
              </Typography>
              <List dense>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Plan default: 5% (percent method), annual limit $23,000"
                    secondary="If the employee has no election, 5% of gross is applied until the limit is reached."
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Employee election: 6% starting Jan 1"
                    secondary="Gross $2,000 → $120 deferral. When remaining cap is $200, a pay run with desired $300 caps to $200 and resumes next year."
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText
                    primary="Employer match (optional)"
                    secondary="Tracked for reporting; it does not reduce employee net pay."
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <FormControl fullWidth>
            <InputLabel>Country</InputLabel>
            <Select label="Country" value={country} disabled>
              <MenuItem value="us">United States</MenuItem>
              <MenuItem value="ca">Canada</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary">
              Country is set from Company Profile. Enterprise retirement plans apply to U.S. 401(k). Canadian RRSP uses the standard model (no plan needed).
            </Typography>
          </FormControl>
          {country === "ca" ? (
            <>
              <Alert severity="info">
                🇨🇦 Canada (RRSP) uses the standard model. No retirement plan is required here; set RRSP amounts in Employee Profile. Enterprise 401(k) applies to U.S. payroll only.
              </Alert>
              <Button
                variant="contained"
                href="/manager/employee-profiles"
                sx={{ alignSelf: "flex-start" }}
              >
                Go to Employee Profile RRSP fields
              </Button>
            </>
          ) : (
            <>
          <Alert severity="info">
            Enterprise retirement is automatic for U.S. payroll. Use the recommended defaults if you’re unsure.
          </Alert>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle1" fontWeight={700}>Recommended setup (most companies)</Typography>
              <Button size="small" variant="contained" onClick={useRecommendedDefaults}>
                Use recommended defaults
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Plan type: 401(k) Traditional • Method: Percent • Default contribution: 5% • Annual limit: $23,000 • Caps: On • Employer match: leave blank (optional)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Employee election overrides defaults. If no election exists, defaults apply.
            </Typography>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Plan Type</InputLabel>
                <Select
                  label="Plan Type"
                  value={plan.plan_type || "401k_traditional"}
                  onChange={(e) => setPlan((p) => ({ ...p, plan_type: e.target.value }))}
                >
                  <MenuItem value="401k_traditional">401(k) Traditional</MenuItem>
                  <MenuItem value="401k_roth">401(k) Roth</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary">
                  401(k) Traditional is most common. Roth is advanced/less common; only choose if advised by your accountant.
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Employee Contribution Method</InputLabel>
                <Select
                  label="Employee Contribution Method"
                  value={plan.employee_contrib_method || "percent"}
                  onChange={(e) => handleMethodChange(e.target.value)}
                >
                  <MenuItem value="percent">Percent</MenuItem>
                  <MenuItem value="flat">Flat Amount</MenuItem>
                </Select>
                <Typography variant="caption" color="text.secondary">
                  Choose how contributions are calculated when no employee election exists. Most companies use Percent.
                </Typography>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee default contribution %"
                type="number"
                value={plan.employee_contrib_percent_default ?? ""}
                onChange={(e) =>
                  setPlan((p) => ({
                    ...p,
                    employee_contrib_percent_default: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                helperText="Used when no employee election exists and method is Percent."
                placeholder="e.g. 5"
                InputLabelProps={{ shrink: true }}
                disabled={plan.employee_contrib_method === "flat"}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Used only if the employee has no election. Example: 5% of gross each payroll until the annual limit is reached.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employee default flat ($)"
                type="number"
                value={plan.employee_contrib_flat_default ?? ""}
                onChange={(e) =>
                  setPlan((p) => ({
                    ...p,
                    employee_contrib_flat_default: e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                helperText="Used when method is Flat."
                placeholder="e.g. 50"
                InputLabelProps={{ shrink: true }}
                disabled={plan.employee_contrib_method === "percent"}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Used only if method is Flat and the employee has no election. Example: $50 withheld each payroll until the annual limit is reached.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={country === "us" ? "Annual employee limit (401k)" : "Annual employee limit"}
                type="number"
                value={plan.annual_employee_limit ?? ""}
                onChange={(e) =>
                  setPlan((p) => ({ ...p, annual_employee_limit: e.target.value === "" ? null : Number(e.target.value) }))
                }
                helperText={
                  capsError
                    ? "Annual limit required when caps are enabled."
                    : plan.enable_ytd_caps
                    ? "Contributions pause automatically when this limit is reached."
                    : "Caps off means Schedulaa will not stop contributions at the annual limit."
                }
                error={capsError}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="IRS annual maximum an employee can contribute. When reached, contributions stop automatically and resume next year.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!!plan.enable_ytd_caps}
                    onChange={(e) => setPlan((p) => ({ ...p, enable_ytd_caps: e.target.checked }))}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <span>Enforce YTD caps</span>
                    <Tooltip title="Tracks year-to-date contributions and prevents over-contributing above the annual limit. Strongly recommended.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Employer match percent"
                type="number"
                value={plan.employer_match_percent ?? ""}
                onChange={(e) =>
                  setPlan((p) => ({ ...p, employer_match_percent: e.target.value === "" ? null : Number(e.target.value) }))
                }
                placeholder="Leave blank if you don’t offer a match"
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: (
                    <Tooltip title="Optional. Tracks employer matching for reporting; does not reduce employee net pay.">
                      <IconButton size="small">
                        <InfoOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              💡 Example
            </Typography>
            <Typography variant="body2">
              Plan default: 5% (Percent), annual limit $23,000. If the employee has no election, 5% of gross is withheld each pay run.
              <br />
              Employee election: 6% starting Jan 1. Gross $2,000 → $120 deferral. If remaining cap is $200 and desired is $300, Schedulaa applies $200 and stops contributions for the year.
              <br />
              Employer match (optional): tracked for reporting; does not reduce employee net pay.
            </Typography>
          </Box>
          </>
          )}
          {message && <Alert severity={severity}>{message}</Alert>}
          {country !== "ca" && (
            <Box>
              <Button variant="contained" onClick={handleSave} disabled={saving || !hasInputs}>
                {saving ? "Saving..." : "Save plan"}
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>
    </ManagementFrame>
  );
}
