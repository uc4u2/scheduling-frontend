import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { tenantAssistant } from "../../utils/api";

const scalar = (value) => value !== null && value !== undefined && typeof value !== "object";

const previewLines = (preview) => {
  if (!preview || typeof preview !== "object") return [];
  const lines = [];
  Object.entries(preview).forEach(([key, value]) => {
    if (key === "action" || key === "requires_transfer_confirmation") return;
    const label = key.replace(/_/g, " ");
    if (scalar(value)) {
      lines.push(`${label}: ${value}`);
      return;
    }
    if (Array.isArray(value) && value.every(scalar)) {
      lines.push(`${label}: ${value.join(", ")}`);
      return;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.entries(value).forEach(([child, childValue]) => {
        if (scalar(childValue)) lines.push(`${label} ${child.replace(/_/g, " ")}: ${childValue}`);
      });
    }
  });
  return lines;
};

const recordHref = (item) => {
  const type = item?.target?.type;
  const id = item?.target?.id;
  if (!type) return null;
  if (type === "customer" && id) return `/manager/clients/${id}`;
  if (type === "booking" || type === "booking_payment") return "/manager/payments";
  if (type === "invoice" || type === "estimate" || type === "tax_profile") return "/manager/finance-invoices";
  if (type === "service" || type === "package") return "/manager/service-management";
  if (type === "website_page" || type === "website" || type === "media" || type === "domain") return "/manager/website";
  if (type === "employee") {
    return item.tool_name === "employees_invite" ? "/manager/add-recruiter" : "/manager/employee-profiles";
  }
  if (type === "time_entry" || type === "leave") return "/manager/attendance-calendar";
  if (type === "order" || type === "shipment") return "/manager/dashboard?view=product-orders";
  if (type === "payroll" || type === "subscription") return "/manager/payroll";
  return null;
};

const httpsUrl = (value) => (typeof value === "string" && value.startsWith("https://") ? value : "");

const completion = (item, t) => {
  if (item.state === "succeeded") {
    return { severity: "success", text: t("settings.aiAssistants.approvals.done", "Schedulaa finished that action.") };
  }
  if (item.state === "failed") {
    return {
      severity: "error",
      text: item.error_code || t("settings.aiAssistants.approvals.failedAction", "Schedulaa could not finish that action."),
    };
  }
  if (item.state === "ambiguous") {
    return {
      severity: "warning",
      text: t("settings.aiAssistants.approvals.ambiguous", "Schedulaa could not confirm whether that action finished."),
    };
  }
  if (item.state === "rejected") {
    return {
      severity: "info",
      text: t("settings.aiAssistants.approvals.rejected", "Schedulaa rejected that action. Nothing was changed."),
    };
  }
  return {
    severity: "info",
    text: t("settings.aiAssistants.approvals.updated", "Schedulaa recorded your decision. The action was not left pending."),
  };
};

export default function AiAssistantApprovalsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [confirmations, setConfirmations] = useState({});
  const [passwords, setPasswords] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = await tenantAssistant.operations();
      setUnavailable(false);
      setItems(payload.items || []);
    } catch (error) {
      const code = error?.response?.status;
      setItems([]);
      setUnavailable(code === 404 || code === 501);
      if (code !== 404 && code !== 501) {
        setMessage({
          severity: "error",
          text: t("settings.aiAssistants.approvals.loadError", "Approvals could not be loaded. Nothing was changed."),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (item, decision) => {
    const operationId = item.id;
    setBusyId(operationId);
    setMessage(null);
    const payload = { decision };
    if (decision === "approve" && item.preview?.requires_transfer_confirmation) {
      payload.execution_input = {
        confirmation: confirmations[operationId] || "",
        current_password: passwords[operationId] || "",
      };
    }
    try {
      const updated = await tenantAssistant.decideOperation(operationId, payload);
      setItems((current) => current.map((row) => (row.id === operationId ? updated : row)));
      setMessage(completion(updated, t));
    } catch (error) {
      setMessage({
        severity: "error",
        text: error?.response?.data?.error || t("settings.aiAssistants.approvals.failed", "That decision could not be saved."),
      });
    } finally {
      setPasswords((current) => ({ ...current, [operationId]: "" }));
      setConfirmations((current) => ({ ...current, [operationId]: "" }));
      setBusyId("");
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h5">{t("settings.aiAssistants.approvals.title", "Assistant approvals")}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t(
            "settings.aiAssistants.approvals.intro",
            "These actions were prepared by a connected assistant. Approving uses your Schedulaa sign-in. The assistant cannot approve them for you."
          )}
        </Typography>
        <Button component="a" href="/manager/settings?tab=ai-assistants" variant="text">
          {t("settings.aiAssistants.approvals.back", "Back to AI assistants")}
        </Button>
        {loading && <Typography variant="body2">{t("common.loading", "Loading...")}</Typography>}
        {unavailable && (
          <Alert severity="info">
            {t("settings.aiAssistants.approvals.unavailable", "Assistant approvals are not available for this account.")}
          </Alert>
        )}
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        {!loading && !unavailable && items.length === 0 && (
          <Alert severity="info">{t("settings.aiAssistants.approvals.empty", "Nothing is waiting for approval.")}</Alert>
        )}
        {items.map((item) => {
          const href = recordHref(item);
          const checkout = httpsUrl(item.result?.checkout_url);
          const hosted = httpsUrl(item.result?.url);
          const needsTransfer = item.state === "pending_approval" && item.preview?.requires_transfer_confirmation === true;
          const transferReady = (confirmations[item.id] || "") === "TRANSFER" && Boolean(passwords[item.id]);
          return (
            <Box key={item.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}>
              <Typography variant="subtitle1">{item.preview?.action || item.tool_name}</Typography>
              <Typography variant="body2">{t("settings.aiAssistants.approvals.state", "Status")}: {item.state}</Typography>
              <Stack component="ul" sx={{ m: 0, pl: 2 }}>
                {previewLines(item.preview).map((line) => (
                  <Typography component="li" variant="body2" key={line}>
                    {line}
                  </Typography>
                ))}
              </Stack>
              {item.target?.type && (
                <Typography variant="body2">
                  {href ? (
                    <a href={href}>
                      {item.target.type} #{item.target.id}
                    </a>
                  ) : (
                    `${item.target.type} #${item.target.id}`
                  )}
                </Typography>
              )}
              {checkout && (
                <Button component="a" href={checkout} target="_blank" rel="noopener noreferrer">
                  {t("settings.aiAssistants.approvals.openHostedPage", "Open the Schedulaa checkout page")}
                </Button>
              )}
              {hosted && (
                <Button component="a" href={hosted} target="_blank" rel="noopener noreferrer">
                  {t("settings.aiAssistants.approvals.openResultPage", "Open the hosted page")}
                </Button>
              )}
              {needsTransfer && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    label={t("settings.aiAssistants.approvals.transferConfirmation", "Type TRANSFER to confirm ownership")}
                    value={confirmations[item.id] || ""}
                    onChange={(event) => setConfirmations((current) => ({ ...current, [item.id]: event.target.value }))}
                  />
                  <TextField
                    type="password"
                    label={t("settings.aiAssistants.approvals.currentPassword", "Current password")}
                    value={passwords[item.id] || ""}
                    onChange={(event) => setPasswords((current) => ({ ...current, [item.id]: event.target.value }))}
                    autoComplete="current-password"
                  />
                </Stack>
              )}
              {item.state === "pending_approval" && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Button variant="contained" disabled={busyId === item.id || (needsTransfer && !transferReady)} onClick={() => decide(item, "approve")}>
                    {t("settings.aiAssistants.approvals.approve", "Approve")}
                  </Button>
                  <Button variant="outlined" disabled={busyId === item.id} onClick={() => decide(item, "reject")}>
                    {t("settings.aiAssistants.approvals.reject", "Reject")}
                  </Button>
                </Stack>
              )}
              {item.state === "failed" && item.error_code && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {item.error_code}
                </Alert>
              )}
              {item.state === "ambiguous" && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {t("settings.aiAssistants.approvals.ambiguous", "Schedulaa could not confirm whether that action finished.")}
                </Alert>
              )}
              {item.state === "rejected" && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  {t("settings.aiAssistants.approvals.rejected", "Schedulaa rejected that action. Nothing was changed.")}
                </Alert>
              )}
            </Box>
          );
        })}
      </Stack>
    </Container>
  );
}
