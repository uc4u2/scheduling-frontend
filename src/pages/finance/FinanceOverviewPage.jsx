import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/formatters";
import { formatDate } from "../../utils/datetime";
import ThemedDateField from "../../components/ui/ThemedDateField";
import FinanceMetricCard from "./components/FinanceMetricCard";
import FinanceEmptyState from "./components/FinanceEmptyState";
import FinanceSalesTaxProfileCard from "./components/FinanceSalesTaxProfileCard";
import FinanceSettingsSnapshotCard from "./components/FinanceSettingsSnapshotCard";
import FinanceDocumentIdentityCard from "./components/FinanceDocumentIdentityCard";
import FinanceOverviewSection from "./components/FinanceOverviewSection";
import { getFinanceOverview, getFinanceOwnerSnapshot, getFinanceSummary, getFinanceTaxContext } from "./financeApi";
import { getAuthedCompanyId } from "../../utils/authedCompany";

const SECTION_DEFAULTS = {
  setup: false,
  attention: false,
  money: true,
  operations: false,
  owner: false,
};

const financeOverviewPreferenceKey = () => {
  if (typeof window === "undefined") return "finance-overview-sections:v1:anonymous";
  const companyId = getAuthedCompanyId() || "company";
  const userId = window.localStorage.getItem("user_id") || window.localStorage.getItem("userId") || "manager";
  return `finance-overview-sections:v1:${companyId}:${userId}`;
};

const readSectionPreferences = (key) => {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(key) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};

const firstDayOfMonth = () => {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const ownerShortcutAction = (label, handler) => (
  <Button size="small" variant="outlined" onClick={handler}>
    {label}
  </Button>
);

const buildAttentionCards = (overview = {}, actions = [], tFinance) => {
  const actionMap = new Map(actions.map((row) => [row.type, row]));
  return [
    {
      key: "quote",
      label: tFinance("attention.quote.label", "New quotes"),
      count: actionMap.get("quote")?.count ?? actionMap.get("quote_request")?.count ?? 0,
      helper: tFinance("attention.quote.helper", "Capture new requests before they go stale."),
      target: "finance-quotes",
      accent: "warning",
      actionLabel: tFinance("attention.quote.action", "Open Quotes"),
    },
    {
      key: "estimate",
      label: tFinance("attention.estimate.label", "Draft estimates"),
      count: Number(overview?.estimate_counts?.draft ?? 0),
      helper: tFinance("attention.estimate.helper", "Finish pricing before the job moves forward."),
      target: "finance-estimates",
      accent: "primary",
      actionLabel: tFinance("attention.estimate.action", "Open Estimates"),
    },
    {
      key: "work-order",
      label: tFinance("attention.workOrder.label", "Work orders need scheduling"),
      count: Number(overview?.work_orders_needing_scheduling_count ?? 0),
      helper: tFinance("attention.workOrder.helper", "Draft jobs or jobs still missing team assignments."),
      target: "finance-work-orders",
      accent: "warning",
      actionLabel: tFinance("attention.workOrder.action", "Open Work Orders"),
    },
    {
      key: "field-report",
      label: tFinance("attention.fieldReport.label", "Field reports need review"),
      count: Number(overview?.field_reports_pending_review_count ?? 0),
      helper: tFinance("attention.fieldReport.helper", "Submitted work needs manager review before it becomes official."),
      target: "finance-field-reports",
      accent: "secondary",
      actionLabel: tFinance("attention.fieldReport.action", "Open Field Reports"),
    },
    {
      key: "low-stock",
      label: tFinance("attention.lowStock.label", "Low stock items"),
      count: Number(overview?.low_stock_count ?? 0),
      helper: tFinance("attention.lowStock.helper", "Check materials before the next job starts."),
      target: "finance-inventory",
      accent: "error",
      actionLabel: tFinance("attention.lowStock.action", "Open Materials"),
    },
    {
      key: "missing-receipts",
      label: tFinance("attention.missingReceipts.label", "Missing receipts"),
      count: Number(overview?.expenses_missing_receipt_count ?? overview?.missing_receipts_count ?? 0),
      helper: tFinance("attention.missingReceipts.helper", "Capture the missing proof before month-end handoff."),
      target: "finance-expenses",
      accent: "info",
      actionLabel: tFinance("attention.missingReceipts.action", "Open Expenses"),
    },
    {
      key: "month-end",
      label: tFinance("attention.monthEnd.label", "Month-end missing items"),
      count: Number(overview?.month_end_missing_items_count ?? 0),
      helper: tFinance("attention.monthEnd.helper", "Review gaps before exporting for the accountant."),
      target: "finance-month-end",
      accent: "warning",
      actionLabel: tFinance("attention.monthEnd.action", "Open Month-End"),
    },
  ];
};

const formatAttentionSummaryItem = (card) => {
  const count = Number(card?.count || 0);
  const labels = {
    quote: `new quote${count === 1 ? "" : "s"}`,
    estimate: `draft estimate${count === 1 ? "" : "s"}`,
    "work-order": `work order${count === 1 ? " needs" : "s need"} scheduling`,
    "field-report": `field report${count === 1 ? " needs" : "s need"} review`,
    "low-stock": `low stock item${count === 1 ? "" : "s"}`,
    "missing-receipts": `missing receipt${count === 1 ? "" : "s"}`,
    "month-end": `month-end missing item${count === 1 ? "" : "s"}`,
  };
  return `${count} ${labels[card?.key] || String(card?.label || "item").toLowerCase()}`;
};

export default function FinanceOverviewPage({ onNavigate, onQuickAction }) {
  const { t } = useTranslation();
  const isCompactViewport = useMediaQuery("(max-width:899.95px)");
  const preferenceKey = useMemo(financeOverviewPreferenceKey, []);
  const savedPreferences = useMemo(() => readSectionPreferences(preferenceKey), [preferenceKey]);
  const tFinance = React.useCallback(
    (key, fallback, options = {}) => t(`manager.finance.overview.${key}`, { defaultValue: fallback, ...options }),
    [t]
  );
  const [overview, setOverview] = useState(null);
  const [summary, setSummary] = useState(null);
  const [ownerSnapshot, setOwnerSnapshot] = useState(null);
  const [taxContext, setTaxContext] = useState(null);
  const [documentSettings, setDocumentSettings] = useState(null);
  const [expandedSections, setExpandedSections] = useState(() => ({
    ...SECTION_DEFAULTS,
    ...savedPreferences,
  }));
  const [snapshotDateFrom, setSnapshotDateFrom] = useState(firstDayOfMonth());
  const [snapshotDateTo, setSnapshotDateTo] = useState(formatDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshotError, setSnapshotError] = useState("");
  const automaticSectionDefaultsApplied = React.useRef(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [overviewData, summaryData, financeTaxContext] = await Promise.all([
          getFinanceOverview(),
          getFinanceSummary(),
          getFinanceTaxContext(),
        ]);
        if (!mounted) return;
        setOverview(overviewData || {});
        setSummary(summaryData || {});
        setTaxContext(financeTaxContext?.tax_context || null);
      } catch (err) {
        if (!mounted) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            tFinance("errors.loadFailed", "Unable to load Business Finance overview.")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [tFinance]);

  useEffect(() => {
    let mounted = true;
    const loadOwnerSnapshot = async () => {
      setSnapshotLoading(true);
      setSnapshotError("");
      try {
        const snapshot = await getFinanceOwnerSnapshot({
          date_from: snapshotDateFrom,
          date_to: snapshotDateTo,
        });
        if (!mounted) return;
        setOwnerSnapshot(snapshot || {});
      } catch (err) {
        if (!mounted) return;
        setSnapshotError(
          err?.response?.data?.error ||
            err?.message ||
            tFinance("ownerSnapshot.errors.loadFailed", "Unable to load owner snapshot.")
        );
      } finally {
        if (mounted) setSnapshotLoading(false);
      }
    };
    loadOwnerSnapshot();
    return () => {
      mounted = false;
    };
  }, [snapshotDateFrom, snapshotDateTo, tFinance]);

  const actions = useMemo(() => Array.isArray(overview?.today_action_list) ? overview.today_action_list : [], [overview]);
  const attentionCards = useMemo(
    () => buildAttentionCards(overview || {}, actions, tFinance),
    [overview, actions, tFinance]
  );
  const actionableAttentionCards = useMemo(
    () => attentionCards.filter((card) => Number(card.count) > 0),
    [attentionCards]
  );
  const actionableAttentionTotal = actionableAttentionCards.reduce(
    (total, card) => total + Number(card.count || 0),
    0
  );
  const currency = summary?.currency || "USD";
  const ownerCurrency = ownerSnapshot?.currency || currency;
  const readiness = ownerSnapshot?.readiness || {};
  const readinessAccent =
    readiness?.status === "ready" ? "success" : readiness?.status === "almost_ready" ? "warning" : "error";
  const pendingBalanceTotal =
    Number(ownerSnapshot?.revenue?.pending_balance || 0) +
    Number(ownerSnapshot?.revenue?.partial_payment_balance || 0);
  const hasFinanceActivity = [
    Number(ownerSnapshot?.revenue?.gross_invoice_total || 0),
    Number(ownerSnapshot?.revenue?.net_invoice_total || 0),
    Number(ownerSnapshot?.expenses?.expense_total || 0),
    Number(ownerSnapshot?.revenue?.paid_total || 0),
  ].some((value) => Math.abs(value) > 0);
  const attentionCounts = {
    missingReceipts: Number(ownerSnapshot?.expenses?.missing_receipts_count || 0),
    unlinkedReceipts: Number(ownerSnapshot?.expenses?.unlinked_receipts_count || 0),
    draftExpenses: Number(ownerSnapshot?.expenses?.draft_expense_count || 0),
    pendingFieldReports: Number(ownerSnapshot?.operations?.field_reports_pending_review || 0),
    lowAvailableStock: Number(ownerSnapshot?.operations?.low_available_stock_count || 0),
  };
  const noAttentionItems = Object.values(attentionCounts).every((count) => count === 0);
  const readinessStatusLabel =
    readiness?.status === "ready"
      ? tFinance("ownerSnapshot.readinessStatus.ready", "Ready")
      : readiness?.status === "almost_ready"
      ? tFinance("ownerSnapshot.readinessStatus.almostReady", "Almost ready")
      : tFinance("ownerSnapshot.readinessStatus.needsAttention", "Needs attention");

  const hasMeaningfulOperations = [
    overview?.work_orders_active_count,
    overview?.work_orders_needing_scheduling_count,
    overview?.field_reports_pending_review_count,
    overview?.low_stock_count,
  ].some((value) => Number(value || 0) > 0);

  useEffect(() => {
    if (loading || automaticSectionDefaultsApplied.current) return;
    automaticSectionDefaultsApplied.current = true;
    setExpandedSections((current) => ({
      ...current,
      setup: isCompactViewport ? false : current.setup,
      attention: actionableAttentionTotal > 0,
      operations:
        typeof savedPreferences.operations === "boolean"
          ? savedPreferences.operations
          : hasMeaningfulOperations,
    }));
  }, [actionableAttentionTotal, hasMeaningfulOperations, isCompactViewport, loading, savedPreferences.operations]);

  const setSectionExpanded = React.useCallback(
    (section, nextExpanded) => {
      setExpandedSections((current) => {
        const next = { ...current, [section]: nextExpanded };
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(preferenceKey, JSON.stringify(next));
          } catch {
            // Browser storage can be unavailable in private/restricted contexts.
          }
        }
        return next;
      });
    },
    [preferenceKey]
  );

  const taxRateLabel = taxContext?.default_tax_rate != null
    ? `${Number(taxContext.default_tax_rate).toFixed(2).replace(/\.00$/, "")}%`
    : "Rate needs review";
  const taxProfileLabel = taxContext?.tax_label
    ? `${taxContext.tax_label} ${taxRateLabel}`
    : taxRateLabel;
  const jurisdictionLabel = `${taxContext?.tax_country_code || "—"} / ${taxContext?.tax_region_code || "—"}`;
  const financeIdentity = documentSettings?.finance_document_identity || {};
  const resolvedIdentity = financeIdentity?.resolved || {};
  const identityName = resolvedIdentity?.business_name || "Loading identity";
  const identityLogoLabel = resolvedIdentity?.logo_url ? "Logo configured" : "No logo";
  const visibleIdentityContacts = [
    financeIdentity?.show_email !== false && resolvedIdentity?.public_email ? "Email" : "",
    financeIdentity?.show_phone !== false && resolvedIdentity?.public_phone ? "Phone" : "",
  ].filter(Boolean).join("/") || "Contact details hidden";
  const identityStateLabel = documentSettings
    ? financeIdentity?.needs_review ? "Review needed" : "Reviewed"
    : "Loading";
  const attentionSummary = actionableAttentionCards.length
    ? actionableAttentionCards
        .slice(0, 3)
        .map(formatAttentionSummaryItem)
        .join(" • ")
    : "Nothing urgent";
  const moneySummary = [
    `Estimates ${formatCurrency(summary?.estimate_total, currency)}`,
    `Invoices ${formatCurrency(summary?.gross_invoice_total ?? summary?.invoice_total, currency)}`,
    `Expenses ${formatCurrency(summary?.expense_total, currency)}`,
  ].join(" • ");
  const operationsSummary = [
    `${Number(overview?.work_orders_active_count || 0)} active jobs`,
    `${Number(overview?.work_orders_needing_scheduling_count || 0)} need scheduling`,
    `${Number(overview?.field_reports_pending_review_count || 0)} reports pending`,
  ].join(" • ");
  const setupSummary = [
    `${currency} • ${jurisdictionLabel}`,
    `Sales Tax: ${taxProfileLabel} • Prices ${taxContext?.prices_include_tax ? "include" : "exclude"} tax`,
    `Finance Identity: ${identityName} • ${identityLogoLabel} • ${visibleIdentityContacts}`,
  ].join(" • ");

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Stack
      spacing={2}
      data-testid="finance-overview-dashboard"
      style={{ width: "100%", maxWidth: "100%", overflowX: "hidden" }}
      sx={{ width: "100%", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}
    >
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 1.5, minWidth: 0 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="h5" fontWeight={900}>
              {tFinance("summary.title", "Business Finance overview")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tFinance("summary.helper", "Your current Finance setup, priorities, money, and operations at a glance.")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip size="small" variant="outlined" label={`Currency ${currency}`} />
            <Chip size="small" variant="outlined" label={`Jurisdiction ${jurisdictionLabel}`} />
            <Chip size="small" variant="outlined" label={`Tax ${taxProfileLabel}`} />
            <Chip
              size="small"
              variant="outlined"
              color={identityStateLabel === "Review needed" ? "warning" : "default"}
              label={`Finance identity ${identityStateLabel}`}
            />
            <Chip
              size="small"
              color={actionableAttentionTotal > 0 ? "warning" : "success"}
              label={actionableAttentionTotal > 0 ? `${actionableAttentionTotal} items need attention` : "No urgent items"}
            />
          </Stack>
        </Stack>
      </Paper>

      <FinanceOverviewSection
        sectionId="setup"
        title={tFinance("sections.setup", "Finance Setup & Configuration")}
        summary={setupSummary}
        expanded={expandedSections.setup}
        onChange={(next) => setSectionExpanded("setup", next)}
      >
        <Stack spacing={2}>
          <FinanceSettingsSnapshotCard
            taxContext={taxContext}
            title={tFinance("taxContext.snapshotTitle", "Finance settings snapshot")}
            helper={tFinance(
              "taxContext.snapshotHelper",
              "These are the current company defaults for Business Finance estimates, expenses, purchases, reports, and month-end review."
            )}
          />
          <FinanceDocumentIdentityCard onSettingsLoaded={setDocumentSettings} />
          <FinanceSalesTaxProfileCard onUpdatedTaxContext={setTaxContext} />
        </Stack>
      </FinanceOverviewSection>

      <FinanceOverviewSection
        sectionId="attention"
        title={tFinance("sections.attention", "Today Needs Your Attention")}
        summary={attentionSummary}
        expanded={expandedSections.attention}
        onChange={(next) => setSectionExpanded("attention", next)}
      >
        <Stack spacing={2}>
          {actionableAttentionCards.length ? (
            <Grid container spacing={2}>
              {attentionCards.map((card) => (
                <Grid item xs={12} sm={6} lg={4} key={card.key}>
                  <FinanceMetricCard
                    label={card.label}
                    value={String(card.count ?? 0)}
                    helper={card.helper}
                    accent={card.accent}
                    action={<Button size="small" onClick={() => onNavigate?.(card.target)}>{card.actionLabel}</Button>}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <FinanceEmptyState
              title={tFinance("empty.title", "Nothing urgent is waiting right now")}
              description={tFinance(
                "empty.description",
                "Quotes, jobs, receipts, and month-end follow-up are all in a good spot at the moment."
              )}
            />
          )}
        </Stack>
      </FinanceOverviewSection>

      <FinanceOverviewSection
        sectionId="money"
        title={tFinance("sections.money", "Money Snapshot")}
        summary={moneySummary}
        expanded={expandedSections.money}
        onChange={(next) => setSectionExpanded("money", next)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.estimateTotal", "Estimate total")} value={formatCurrency(summary?.estimate_total, currency)} accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.grossInvoiceTotal", "Gross invoice total")} value={formatCurrency(summary?.gross_invoice_total ?? summary?.invoice_total, currency)} accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.refunds", "Refunds")} value={formatCurrency(summary?.refund_total, currency)} accent="warning" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.netInvoiceTotal", "Net invoice total")} value={formatCurrency(summary?.net_invoice_total, currency)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.expenseTotal", "Expense total")} value={formatCurrency(summary?.expense_total, currency)} accent="error" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.grossTaxCollected", "Gross tax collected")} value={formatCurrency(summary?.gross_tax_collected ?? summary?.tax_collected, currency)} accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.taxRefunded", "Tax refunded")} value={formatCurrency(summary?.tax_refunded, currency)} accent="warning" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.netTaxCollected", "Net tax collected")} value={formatCurrency(summary?.net_tax_collected, currency)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.taxPaidOnExpenses", "Tax paid on expenses")} value={formatCurrency(summary?.tax_paid_on_expenses, currency)} accent="success" /></Grid>
          <Grid item xs={12} sm={6} lg={4}><FinanceMetricCard label={tFinance("money.estimatedNetTaxNet", "Estimated net tax net")} value={formatCurrency(summary?.estimated_net_tax_net ?? summary?.estimated_net_tax, currency)} accent="warning" /></Grid>
        </Grid>
        {summary?.payment_total_scope === "not_available_without_invoice_payment_link" ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {tFinance(
              "money.paymentScopeInfo",
              "Payment collection totals are not available yet for all invoice payment methods."
            )}
          </Alert>
        ) : null}
      </FinanceOverviewSection>

      <FinanceOverviewSection
        sectionId="operations"
        title={tFinance("sections.operations", "Operations Snapshot")}
        summary={operationsSummary}
        expanded={expandedSections.operations}
        onChange={(next) => setSectionExpanded("operations", next)}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.activeJobs.label", "Active jobs")} value={String(overview?.work_orders_active_count ?? 0)} helper={tFinance("operations.activeJobs.helper", "Scheduled or in progress.")} accent="primary" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.plannedLabor.label", "Planned labor this month")} value={formatCurrency(overview?.planned_labor_cost_this_month || 0)} helper={tFinance("operations.plannedLabor.helper", "Work order planning only.")} accent="secondary" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.inventoryValue.label", "Inventory value estimate")} value={formatCurrency(overview?.inventory_value_estimate || summary?.inventory_value_estimate || 0)} helper={tFinance("operations.inventoryValue.helper", "Current stock multiplied by cost per unit.")} accent="info" /></Grid>
          <Grid item xs={12} sm={6} lg={3}><FinanceMetricCard label={tFinance("operations.approvedMaterialCost.label", "Approved material cost")} value={formatCurrency(summary?.approved_material_cost || 0)} helper={tFinance("operations.approvedMaterialCost.helper", "Materials made official through manager review.")} accent="error" /></Grid>
        </Grid>
      </FinanceOverviewSection>

      <FinanceOverviewSection
        sectionId="owner"
        title={tFinance("sections.ownerSnapshot", "Owner / Reporting Snapshot")}
        summary={`${snapshotDateFrom} – ${snapshotDateTo} • ${readinessStatusLabel}`}
        expanded={expandedSections.owner}
        onChange={(next) => setSectionExpanded("owner", next)}
      >
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1.5, mb: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <ThemedDateField
                fullWidth
                label={tFinance("ownerSnapshot.filters.from", "From")}
                value={snapshotDateFrom}
                onChange={(e) => setSnapshotDateFrom(e.target.value)}
              />
              <ThemedDateField
                fullWidth
                label={tFinance("ownerSnapshot.filters.to", "To")}
                value={snapshotDateTo}
                onChange={(e) => setSnapshotDateTo(e.target.value)}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {tFinance(
                "ownerSnapshot.helper",
                "Operational view, not a tax filing. Use this to prepare for accountant handoff."
              )}
            </Typography>
            {snapshotError ? <Alert severity="error">{snapshotError}</Alert> : null}
            {snapshotLoading ? (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <>
                {!hasFinanceActivity ? (
                  <FinanceEmptyState
                    title={tFinance("ownerSnapshot.empty.title", "No finance activity yet for this period")}
                    description={tFinance(
                      "ownerSnapshot.empty.description",
                      "Invoices, expenses, receipts, and month-end signals will appear here once this period has activity."
                    )}
                  />
                ) : (
                  <>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {tFinance("ownerSnapshot.groups.moneyCollected", "Money collected")}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.netRevenue", "Net revenue")}
                          value={formatCurrency(ownerSnapshot?.revenue?.net_invoice_total, ownerCurrency)}
                          accent="success"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.refunds", "Refunds")}
                          value={formatCurrency(ownerSnapshot?.revenue?.refund_total, ownerCurrency)}
                          accent="warning"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.paidOnline", "Paid online")}
                          value={formatCurrency(ownerSnapshot?.revenue?.online_paid_total, ownerCurrency)}
                          accent="info"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.paidOffline", "Paid offline")}
                          value={formatCurrency(ownerSnapshot?.revenue?.offline_paid_total, ownerCurrency)}
                          accent="secondary"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.pendingBalance", "Pending balance")}
                          value={formatCurrency(pendingBalanceTotal, ownerCurrency)}
                          accent="warning"
                          action={
                            pendingBalanceTotal > 0
                              ? ownerShortcutAction(
                                  tFinance("ownerSnapshot.actions.reviewInvoices", "Review invoices"),
                                  () => onNavigate?.("finance-reports")
                                )
                              : null
                          }
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 1 }}>
                          {tFinance("ownerSnapshot.groups.costsMargin", "Costs and margin")}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.expenses", "Expenses")}
                          value={formatCurrency(ownerSnapshot?.expenses?.expense_total, ownerCurrency)}
                          accent="error"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.margin", "Estimated margin")}
                          value={formatCurrency(ownerSnapshot?.profitability?.estimated_margin_net, ownerCurrency)}
                          accent="primary"
                          helper={tFinance(
                            "ownerSnapshot.marginHelper",
                            "Based on current approved materials, linked expenses, and planned labor data."
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.approvedMaterialCost", "Approved material cost")}
                          value={formatCurrency(ownerSnapshot?.operations?.approved_material_cost, ownerCurrency)}
                          accent="warning"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.plannedLaborCost", "Planned labor cost")}
                          value={formatCurrency(ownerSnapshot?.operations?.planned_labor_cost, ownerCurrency)}
                          accent="secondary"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 1 }}>
                          {tFinance("ownerSnapshot.groups.taxSnapshot", "Tax snapshot")}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.netTax", "Estimated net tax")}
                          value={formatCurrency(ownerSnapshot?.tax?.estimated_net_tax_net, ownerCurrency)}
                          accent="warning"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.netTaxCollected", "Net tax collected")}
                          value={formatCurrency(ownerSnapshot?.tax?.net_tax_collected, ownerCurrency)}
                          accent="success"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.taxPaidOnExpenses", "Tax paid on expenses")}
                          value={formatCurrency(ownerSnapshot?.tax?.tax_paid_on_expenses, ownerCurrency)}
                          accent="info"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ mt: 1 }}>
                          {tFinance("ownerSnapshot.groups.monthEndReadiness", "Month-end readiness")}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.readiness", "Readiness score")}
                          value={`${readiness?.score ?? 0} · ${readinessStatusLabel}`}
                          accent={readinessAccent}
                          helper={tFinance(
                            "ownerSnapshot.readinessHelper",
                            "This score tracks operational readiness for accountant handoff, not formal accounting accuracy."
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.missingReceipts", "Missing receipts")}
                          value={String(attentionCounts.missingReceipts)}
                          accent="error"
                          action={
                            attentionCounts.missingReceipts > 0
                              ? ownerShortcutAction(
                                  tFinance("ownerSnapshot.actions.reviewMissingReceipts", "Review missing receipts"),
                                  () =>
                                    onNavigate?.({
                                      tab: "finance-expenses",
                                      payload: {
                                        readiness: "needs_receipt",
                                      },
                                    })
                                )
                              : null
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.unlinkedReceipts", "Unlinked receipts")}
                          value={String(attentionCounts.unlinkedReceipts)}
                          accent="warning"
                          action={
                            attentionCounts.unlinkedReceipts > 0
                              ? ownerShortcutAction(
                                  tFinance("ownerSnapshot.actions.openReceiptInbox", "Open Receipt Inbox"),
                                  () =>
                                    onNavigate?.({
                                      tab: "finance-expenses",
                                      payload: {
                                        receiptInboxStatus: "unlinked",
                                      },
                                    })
                                )
                              : null
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.draftExpenses", "Draft expenses")}
                          value={String(attentionCounts.draftExpenses)}
                          accent="warning"
                          action={
                            attentionCounts.draftExpenses > 0
                              ? ownerShortcutAction(
                                  tFinance("ownerSnapshot.actions.reviewDrafts", "Review drafts"),
                                  () =>
                                    onNavigate?.({
                                      tab: "finance-expenses",
                                      payload: {
                                        reviewStatus: "draft",
                                      },
                                    })
                                )
                              : null
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.pendingFieldReports", "Pending field reports")}
                          value={String(attentionCounts.pendingFieldReports)}
                          accent="secondary"
                          action={
                            attentionCounts.pendingFieldReports > 0
                              ? ownerShortcutAction(
                                  tFinance("ownerSnapshot.actions.reviewFieldReports", "Review field reports"),
                                  () => onNavigate?.("finance-field-reports")
                                )
                              : null
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={3}>
                        <FinanceMetricCard
                          label={tFinance("ownerSnapshot.lowAvailableStock", "Low available stock")}
                          value={String(attentionCounts.lowAvailableStock)}
                          accent="error"
                          action={
                            attentionCounts.lowAvailableStock > 0
                              ? ownerShortcutAction(
                                  tFinance("ownerSnapshot.actions.reviewInventory", "Review inventory"),
                                  () => onNavigate?.("finance-inventory")
                                )
                              : null
                          }
                        />
                      </Grid>
                    </Grid>

                    {readiness?.status === "ready" && noAttentionItems ? (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        {tFinance("ownerSnapshot.readyState", "Month-end looks clean for this period.")}
                      </Alert>
                    ) : null}
                  </>
                )}
              </>
            )}
          </Stack>
        </Paper>
      </FinanceOverviewSection>

    </Stack>
  );
}
