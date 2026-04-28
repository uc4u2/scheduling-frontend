import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AddTaskIcon from "@mui/icons-material/AddTask";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PaidIcon from "@mui/icons-material/Paid";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ManagementFrame from "../../components/ui/ManagementFrame";
import FinanceOverviewPage from "./FinanceOverviewPage";
import QuoteRequestsPage from "./QuoteRequestsPage";
import EstimatesPage from "./EstimatesPage";
import ExpensesPage from "./ExpensesPage";
import FinanceReportsPage from "./FinanceReportsPage";
import WorkOrdersPage from "./WorkOrdersPage";
import InventoryPage from "./InventoryPage";
import VendorsPage from "./VendorsPage";
import PurchasesPage from "./PurchasesPage";
import FieldReportsPage from "./FieldReportsPage";
import ReviewApprovalPage from "./ReviewApprovalPage";
import ProfitabilityReportsPage from "./ProfitabilityReportsPage";
import TaxSummaryPage from "./TaxSummaryPage";
import MonthEndReviewPage from "./MonthEndReviewPage";
import BusinessFinanceHelpDrawer from "./BusinessFinanceHelpDrawer";

const GROUPS = {
  daily: {
    key: "daily",
    label: "Daily Operations",
    helper: "Quotes, estimates, jobs, and expenses for day-to-day work.",
    sections: ["finance-overview", "finance-quotes", "finance-estimates", "finance-work-orders", "finance-expenses"],
  },
  field: {
    key: "field",
    label: "Field Work & Reviews",
    helper: "Materials, purchases, field reports, and manager approval.",
    sections: ["finance-inventory", "finance-purchases", "finance-field-reports", "finance-reviews"],
  },
  reports: {
    key: "reports",
    label: "Accounting & Reports",
    helper: "Profitability, tax review, exports, and month-end follow-up.",
    sections: ["finance-profitability", "finance-tax-summary", "finance-reports", "finance-month-end"],
  },
  setup: {
    key: "setup",
    label: "Setup",
    helper: "Supplier details and stock setup that support the rest of the workflow.",
    sections: ["finance-vendors"],
  },
};

const GROUP_ALIAS_TO_TAB = {
  "finance-group-daily": "finance-overview",
  "finance-group-field": "finance-work-orders",
  "finance-group-reports": "finance-profitability",
  "finance-group-setup": "finance-vendors",
};

const SECTION_META = {
  "finance-overview": {
    label: "Overview",
    description: "Start here to see what needs attention next and move the workflow forward.",
    icon: <DashboardIcon fontSize="small" />,
    group: "daily",
  },
  "finance-quotes": {
    label: "Quotes",
    description: "Capture new requests and turn them into estimates.",
    icon: <ReceiptLongIcon fontSize="small" />,
    group: "daily",
  },
  "finance-estimates": {
    label: "Estimates",
    description: "Price the job before it becomes an invoice or work order.",
    icon: <AddTaskIcon fontSize="small" />,
    group: "daily",
  },
  "finance-work-orders": {
    label: "Work Orders",
    description: "Plan the job, assign team members, and track execution.",
    icon: <AssignmentIcon fontSize="small" />,
    group: "daily",
  },
  "finance-expenses": {
    label: "Expenses",
    description: "Record day-to-day costs and keep receipts ready for review.",
    icon: <PaidIcon fontSize="small" />,
    group: "daily",
  },
  "finance-inventory": {
    label: "Materials & Supplies",
    description: "Track stock levels and material availability.",
    icon: <Inventory2OutlinedIcon fontSize="small" />,
    group: "field",
  },
  "finance-purchases": {
    label: "Purchases",
    description: "Record supply purchases and stock increases.",
    icon: <ShoppingCartOutlinedIcon fontSize="small" />,
    group: "field",
  },
  "finance-field-reports": {
    label: "Field Reports",
    description: "Review what team members submitted from the field.",
    icon: <ArticleOutlinedIcon fontSize="small" />,
    group: "field",
  },
  "finance-reviews": {
    label: "Reviews",
    description: "Approve what becomes official for inventory, job cost, and invoice follow-up.",
    icon: <FactCheckOutlinedIcon fontSize="small" />,
    group: "field",
  },
  "finance-profitability": {
    label: "Profitability",
    description: "See job-level revenue, planned labor, approved materials, and estimated margin.",
    icon: <TrendingUpOutlinedIcon fontSize="small" />,
    group: "reports",
  },
  "finance-tax-summary": {
    label: "Tax Summary",
    description: "Estimated tax summary for accountant review.",
    icon: <CalculateOutlinedIcon fontSize="small" />,
    group: "reports",
  },
  "finance-reports": {
    label: "Reports",
    description: "Export invoices, expenses, and summaries for your accountant.",
    icon: <SummarizeOutlinedIcon fontSize="small" />,
    group: "reports",
  },
  "finance-month-end": {
    label: "Month-End",
    description: "Review missing items and export clean month-end records.",
    icon: <EventNoteOutlinedIcon fontSize="small" />,
    group: "reports",
  },
  "finance-vendors": {
    label: "Vendors",
    description: "Keep supplier contacts organized before purchases are recorded.",
    icon: <StorefrontOutlinedIcon fontSize="small" />,
    group: "setup",
  },
};

const resolveInitialTab = (viewKey) => GROUP_ALIAS_TO_TAB[viewKey] || (SECTION_META[viewKey] ? viewKey : "finance-overview");
const resolveGroupForTab = (tabKey) => SECTION_META[tabKey]?.group || "daily";

function SectionCard({ active, meta, onClick }) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      onClick={onClick}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        cursor: "pointer",
        minWidth: { xs: "100%", sm: 210 },
        borderColor: active ? alpha(theme.palette.primary.main, 0.45) : alpha(theme.palette.divider, 0.9),
        background: active
          ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
          : theme.palette.background.paper,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ color: active ? "primary.main" : "text.secondary", display: "grid", placeItems: "center" }}>{meta.icon}</Box>
          <Typography variant="subtitle2" fontWeight={800}>{meta.label}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">{meta.description}</Typography>
      </Stack>
    </Paper>
  );
}

export default function BusinessFinanceShell({ viewKey = "finance-overview", onNavigate }) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(resolveInitialTab(viewKey));
  const [activeGroup, setActiveGroup] = useState(resolveGroupForTab(resolveInitialTab(viewKey)));
  const [quickAction, setQuickAction] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const nextTab = resolveInitialTab(viewKey);
    setActiveTab(nextTab);
    setActiveGroup(resolveGroupForTab(nextTab));
  }, [viewKey]);

  const handleNavigate = (next) => {
    const resolved = resolveInitialTab(next);
    setActiveTab(resolved);
    setActiveGroup(resolveGroupForTab(resolved));
    onNavigate?.(next);
  };

  const handleQuickAction = (action) => {
    if (action === "quote") {
      setQuickAction({ type: "quote", nonce: Date.now() });
      handleNavigate("finance-quotes");
      return;
    }
    if (action === "estimate") {
      setQuickAction({ type: "estimate", nonce: Date.now() });
      handleNavigate("finance-estimates");
      return;
    }
    if (action === "expense") {
      setQuickAction({ type: "expense", nonce: Date.now() });
      handleNavigate("finance-expenses");
      return;
    }
    if (action === "purchase") {
      setQuickAction({ type: "purchase", nonce: Date.now() });
      handleNavigate("finance-purchases");
      return;
    }
    if (action === "work-order") {
      setQuickAction({ type: "work-order", nonce: Date.now() });
      handleNavigate("finance-work-orders");
      return;
    }
    handleNavigate("finance-reports");
  };

  const currentMeta = SECTION_META[activeTab] || SECTION_META["finance-overview"];
  const currentGroup = GROUPS[activeGroup] || GROUPS.daily;

  const content = useMemo(() => {
    switch (activeTab) {
      case "finance-quotes":
        return <QuoteRequestsPage createNonce={quickAction?.type === "quote" ? quickAction.nonce : 0} onNavigate={handleNavigate} />;
      case "finance-estimates":
        return <EstimatesPage createNonce={quickAction?.type === "estimate" ? quickAction.nonce : 0} onNavigate={handleNavigate} />;
      case "finance-work-orders":
        return (
          <WorkOrdersPage
            createNonce={quickAction?.type === "work-order" ? quickAction.nonce : 0}
            createSeed={quickAction?.type === "work-order" ? quickAction.payload || null : null}
            onNavigate={handleNavigate}
          />
        );
      case "finance-inventory":
        return <InventoryPage />;
      case "finance-vendors":
        return <VendorsPage />;
      case "finance-purchases":
        return <PurchasesPage createNonce={quickAction?.type === "purchase" ? quickAction.nonce : 0} />;
      case "finance-field-reports":
        return <FieldReportsPage onNavigate={handleNavigate} />;
      case "finance-reviews":
        return <ReviewApprovalPage />;
      case "finance-profitability":
        return <ProfitabilityReportsPage />;
      case "finance-tax-summary":
        return <TaxSummaryPage />;
      case "finance-expenses":
        return <ExpensesPage createNonce={quickAction?.type === "expense" ? quickAction.nonce : 0} />;
      case "finance-reports":
        return <FinanceReportsPage />;
      case "finance-month-end":
        return <MonthEndReviewPage />;
      case "finance-overview":
      default:
        return <FinanceOverviewPage onNavigate={handleNavigate} onQuickAction={handleQuickAction} />;
    }
  }, [activeTab, quickAction]);

  return (
    <ManagementFrame
      title="Business Finance"
      subtitle="Daily operations, field work, and accountant-ready reporting."
      fullWidth
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <Stack spacing={2.5}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 1.5,
            borderColor: alpha(theme.palette.primary.main, 0.16),
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`,
          }}
        >
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between">
              <Box>
                <Typography variant="h5" fontWeight={900}>Business Finance</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Daily operations, field work, and accountant-ready reporting.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
                <Tooltip title="See how quotes, jobs, field reports, reviews, and month-end fit together.">
                  <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setHelpOpen(true)}>
                    Help
                  </Button>
                </Tooltip>
                <Button variant="contained" onClick={() => handleQuickAction("quote")}>New Quote</Button>
                <Button variant="contained" onClick={() => handleQuickAction("estimate")}>New Estimate</Button>
                <Button variant="contained" onClick={() => handleQuickAction("work-order")}>New Work Order</Button>
                <Button variant="outlined" onClick={() => handleQuickAction("expense")}>Add Expense</Button>
                <Button variant="outlined" onClick={() => handleQuickAction("purchase")}>Create Purchase</Button>
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Object.values(GROUPS).map((group) => (
                <Tooltip key={group.key} title={group.helper}>
                  <Chip
                    label={group.label}
                    color={activeGroup === group.key ? "primary" : "default"}
                    variant={activeGroup === group.key ? "filled" : "outlined"}
                    onClick={() => {
                      setActiveGroup(group.key);
                      if (!group.sections.includes(activeTab)) {
                        handleNavigate(group.sections[0]);
                      }
                    }}
                    clickable
                    sx={{ fontWeight: 700 }}
                  />
                </Tooltip>
              ))}
            </Stack>

            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{currentGroup.label}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{currentGroup.helper}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap" useFlexGap>
                {currentGroup.sections.map((sectionKey) => (
                  <SectionCard
                    key={sectionKey}
                    active={activeTab === sectionKey}
                    meta={SECTION_META[sectionKey]}
                    onClick={() => handleNavigate(sectionKey)}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>{currentMeta.icon}</Box>
              <Typography variant="h6" fontWeight={900}>{currentMeta.label}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">{currentMeta.description}</Typography>
          </Stack>
        </Paper>

        {activeTab !== "finance-overview" ? (
          <Alert severity="info">
            Employees report what happened in the field. Managers approve what becomes official for inventory, job cost, and invoice follow-up.
          </Alert>
        ) : null}

        {content}
      </Stack>

      <BusinessFinanceHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ManagementFrame>
  );
}
