import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Tab, Tabs } from "@mui/material";
import ManagementFrame from "../../components/ui/ManagementFrame";
import FinanceOverviewPage from "./FinanceOverviewPage";
import QuoteRequestsPage from "./QuoteRequestsPage";
import EstimatesPage from "./EstimatesPage";
import ExpensesPage from "./ExpensesPage";
import FinanceReportsPage from "./FinanceReportsPage";

const TAB_KEYS = [
  "finance-overview",
  "finance-quotes",
  "finance-estimates",
  "finance-expenses",
  "finance-reports",
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
    handleNavigate("finance-reports");
  };

  const content = useMemo(() => {
    switch (activeTab) {
      case "finance-quotes":
        return <QuoteRequestsPage createNonce={quickAction?.type === "quote" ? quickAction.nonce : 0} onNavigate={handleNavigate} />;
      case "finance-estimates":
        return <EstimatesPage createNonce={quickAction?.type === "estimate" ? quickAction.nonce : 0} />;
      case "finance-expenses":
        return <ExpensesPage createNonce={quickAction?.type === "expense" ? quickAction.nonce : 0} />;
      case "finance-reports":
        return <FinanceReportsPage />;
      case "finance-overview":
      default:
        return <FinanceOverviewPage onNavigate={handleNavigate} onQuickAction={handleQuickAction} />;
    }
  }, [activeTab, quickAction]);

  return (
    <ManagementFrame
      title="Business Finance"
      subtitle="Quotes, estimates, invoices, expenses, and accountant exports in one simple workspace."
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
          <Tab value="finance-expenses" label="Expenses" />
          <Tab value="finance-reports" label="Reports" />
        </Tabs>
      </Box>
      {activeTab !== "finance-overview" ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Keep daily work simple: quotes, estimates, expenses, and CSV exports are ready now. Work execution tools come later.
        </Alert>
      ) : null}
      {content}
    </ManagementFrame>
  );
}
