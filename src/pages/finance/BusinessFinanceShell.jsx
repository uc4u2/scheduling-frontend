import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Tab, Tabs } from "@mui/material";
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

const TAB_KEYS = [
  "finance-overview",
  "finance-quotes",
  "finance-estimates",
  "finance-work-orders",
  "finance-inventory",
  "finance-vendors",
  "finance-purchases",
  "finance-field-reports",
  "finance-reviews",
  "finance-profitability",
  "finance-tax-summary",
  "finance-expenses",
  "finance-reports",
  "finance-month-end",
];

export default function BusinessFinanceShell({ viewKey = "finance-overview", onNavigate }) {
  const [activeTab, setActiveTab] = useState(TAB_KEYS.includes(viewKey) ? viewKey : "finance-overview");
  const [quickAction, setQuickAction] = useState(null);

  useEffect(() => {
    if (TAB_KEYS.includes(viewKey)) {
      setActiveTab(viewKey);
    }
  }, [viewKey]);

  const handleNavigate = (next) => {
    setActiveTab(next);
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
    if (action === "work-order") {
      setQuickAction({ type: "work-order", nonce: Date.now() });
      handleNavigate("finance-work-orders");
      return;
    }
    handleNavigate("finance-reports");
  };

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
        return <PurchasesPage />;
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
      subtitle="Quotes, jobs, materials, purchases, reviews, and month-end follow-up in one simple workspace."
      fullWidth
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => handleNavigate(value)}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="finance-overview" label="Overview" />
          <Tab value="finance-quotes" label="Quotes" />
          <Tab value="finance-estimates" label="Estimates" />
          <Tab value="finance-work-orders" label="Work Orders" />
          <Tab value="finance-inventory" label="Materials & Supplies" />
          <Tab value="finance-vendors" label="Vendors" />
          <Tab value="finance-purchases" label="Purchases" />
          <Tab value="finance-field-reports" label="Field Reports" />
          <Tab value="finance-reviews" label="Reviews" />
          <Tab value="finance-profitability" label="Profitability" />
          <Tab value="finance-tax-summary" label="Tax Summary" />
          <Tab value="finance-expenses" label="Expenses" />
          <Tab value="finance-reports" label="Reports" />
          <Tab value="finance-month-end" label="Month-End" />
        </Tabs>
      </Box>
      {activeTab !== "finance-overview" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Keep daily work simple: team members report what happened in the field, and managers approve what becomes official for inventory and invoice follow-up.
        </Alert>
      ) : null}
      {content}
    </ManagementFrame>
  );
}
