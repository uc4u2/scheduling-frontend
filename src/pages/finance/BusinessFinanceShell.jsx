import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button, Paper, Stack, Tab, Tabs, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";
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

const GROUP_ALIAS_TO_TAB = {
  "finance-group-daily": "finance-overview",
  "finance-group-field": "finance-inventory",
  "finance-group-reports": "finance-reports",
  "finance-group-setup": "finance-vendors",
};

const TAB_ORDER = [
  { key: "finance-overview", labelKey: "manager.finance.tabs.overview", labelFallback: "Overview", icon: <DashboardIcon fontSize="small" /> },
  { key: "finance-quotes", labelKey: "manager.finance.tabs.quotes", labelFallback: "Quotes", icon: <ReceiptLongIcon fontSize="small" /> },
  { key: "finance-estimates", labelKey: "manager.finance.tabs.estimates", labelFallback: "Estimates", icon: <AddTaskIcon fontSize="small" /> },
  { key: "finance-work-orders", labelKey: "manager.finance.tabs.workOrders", labelFallback: "Work Orders", icon: <AssignmentIcon fontSize="small" /> },
  { key: "finance-inventory", labelKey: "manager.finance.tabs.materialsSupplies", labelFallback: "Materials & Supplies", icon: <Inventory2OutlinedIcon fontSize="small" /> },
  { key: "finance-purchases", labelKey: "manager.finance.tabs.purchases", labelFallback: "Purchases", icon: <ShoppingCartOutlinedIcon fontSize="small" /> },
  { key: "finance-field-reports", labelKey: "manager.finance.tabs.fieldReports", labelFallback: "Field Reports", icon: <ArticleOutlinedIcon fontSize="small" /> },
  { key: "finance-reviews", labelKey: "manager.finance.tabs.reviews", labelFallback: "Reviews", icon: <FactCheckOutlinedIcon fontSize="small" /> },
  { key: "finance-expenses", labelKey: "manager.finance.tabs.expenses", labelFallback: "Expenses", icon: <PaidIcon fontSize="small" /> },
  { key: "finance-vendors", labelKey: "manager.finance.tabs.vendors", labelFallback: "Vendors", icon: <StorefrontOutlinedIcon fontSize="small" /> },
  { key: "finance-reports", labelKey: "manager.finance.tabs.reports", labelFallback: "Reports", icon: <SummarizeOutlinedIcon fontSize="small" /> },
  { key: "finance-profitability", labelKey: "manager.finance.tabs.profitability", labelFallback: "Profitability", icon: <TrendingUpOutlinedIcon fontSize="small" /> },
  { key: "finance-tax-summary", labelKey: "manager.finance.tabs.taxSummary", labelFallback: "Tax Summary", icon: <CalculateOutlinedIcon fontSize="small" /> },
  { key: "finance-month-end", labelKey: "manager.finance.tabs.monthEnd", labelFallback: "Month-End", icon: <EventNoteOutlinedIcon fontSize="small" /> },
];

const resolveInitialTab = (viewKey) => {
  const resolved = GROUP_ALIAS_TO_TAB[viewKey] || viewKey;
  return TAB_ORDER.some((tab) => tab.key === resolved) ? resolved : "finance-overview";
};

export default function BusinessFinanceShell({ viewKey = "finance-overview", onNavigate }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(resolveInitialTab(viewKey));
  const [quickAction, setQuickAction] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setActiveTab(resolveInitialTab(viewKey));
  }, [viewKey]);

  const handleNavigate = useCallback((next) => {
    const nextView = typeof next === "string" ? next : next?.tab || "finance-overview";
    const resolved = resolveInitialTab(nextView);
    setActiveTab(resolved);
    if (next && typeof next === "object" && next.payload) {
      setQuickAction({ type: "navigation", nonce: Date.now(), payload: next.payload });
    }
    onNavigate?.(resolved);
  }, [onNavigate]);

  const handleQuickAction = useCallback((action) => {
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
  }, [handleNavigate]);

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
        return (
          <ExpensesPage
            createNonce={quickAction?.type === "expense" ? quickAction.nonce : 0}
            shortcutState={quickAction?.type === "navigation" ? quickAction.payload || null : null}
          />
        );
      case "finance-reports":
        return <FinanceReportsPage />;
      case "finance-month-end":
        return <MonthEndReviewPage />;
      case "finance-overview":
      default:
        return <FinanceOverviewPage onNavigate={handleNavigate} onQuickAction={handleQuickAction} />;
    }
  }, [activeTab, handleNavigate, handleQuickAction, quickAction]);

  return (
    <ManagementFrame title={null} subtitle={null} fullWidth contentSx={{ p: { xs: 1.5, md: 2.5 } }}>
      <Stack spacing={2.5}>
        <Stack direction="row" justifyContent="flex-start">
          <Tooltip title={t("manager.finance.help.tooltip", { defaultValue: "See how quotes, jobs, field reports, reviews, and month-end fit together." })}>
            <Button variant="outlined" startIcon={<HelpOutlineIcon />} onClick={() => setHelpOpen(true)}>
              {t("manager.finance.help.button", { defaultValue: "How it works" })}
            </Button>
          </Tooltip>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 3,
            px: 1,
            py: 1,
            overflow: "hidden",
            background: (theme) => theme.palette.background.paper,
          }}
        >
          <Box sx={{ overflowX: "auto", pb: 0.25 }}>
            <Tabs
              value={activeTab}
              onChange={(_, next) => handleNavigate(next)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 48,
                "& .MuiTabs-indicator": {
                  display: "none",
                },
                "& .MuiTabs-flexContainer": {
                  gap: 0.75,
                  flexWrap: "nowrap",
                },
                "& .MuiTab-root": {
                  minHeight: 44,
                  px: 1.5,
                  py: 0.75,
                  textTransform: "none",
                  fontWeight: 700,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  border: "1px solid transparent",
                  color: "text.secondary",
                  whiteSpace: "nowrap",
                  transition: "all 160ms ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                    color: "text.primary",
                  },
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    borderColor: "primary.main",
                    boxShadow: (theme) => `0 10px 24px ${theme.palette.primary.main}22`,
                  },
                },
                "& .MuiTab-iconWrapper": {
                  mb: 0,
                },
              }}
            >
              {TAB_ORDER.map((tab) => (
                <Tab
                  key={tab.key}
                  value={tab.key}
                  icon={tab.icon}
                  iconPosition="start"
                  label={t(tab.labelKey, { defaultValue: tab.labelFallback })}
                  wrapped={false}
                />
              ))}
            </Tabs>
          </Box>
        </Paper>

        {content}
      </Stack>

      <BusinessFinanceHelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </ManagementFrame>
  );
}
