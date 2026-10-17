import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { tenantAssistant } from "../../utils/api";

const previewLines = (preview) => {
  if (!preview || typeof preview !== "object") return [];
  return Object.entries(preview)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`);
};

export default function AiAssistantApprovalsPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = await tenantAssistant.operations();
      setUnavailable(false);
      setItems(payload.items || []);
    } catch (error) {
      const code = error?.response?.status;
      setItems([]);
      setUnavailable(code === 404 || code === 501);
      if (code !== 404 && code !== 501) {
        setMessage(t("settings.aiAssistants.approvals.loadError", "Approvals could not be loaded. Nothing was changed."));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decide = async (operationId, decision) => {
    setBusyId(operationId);
    setMessage("");
    try {
      const updated = await tenantAssistant.decideOperation(operationId, { decision });
      setItems((current) => current.map((item) => (item.id === operationId ? updated : item)));
      setMessage(
        updated.state === "succeeded"
          ? t("settings.aiAssistants.approvals.done", "Schedulaa finished that action.")
          : t("settings.aiAssistants.approvals.updated", "Schedulaa recorded your decision. The action was not left pending.")
      );
    } catch (error) {
      setMessage(error?.response?.data?.error || t("settings.aiAssistants.approvals.failed", "That decision could not be saved."));
    } finally {
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
        {message && <Alert severity="info">{message}</Alert>}
        {!loading && !unavailable && items.length === 0 && (
          <Alert severity="info">{t("settings.aiAssistants.approvals.empty", "Nothing is waiting for approval.")}</Alert>
        )}
        {items.map((item) => (
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
                {item.target.type} #{item.target.id}
              </Typography>
            )}
            {item.state === "pending_approval" && (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button variant="contained" disabled={busyId === item.id} onClick={() => decide(item.id, "approve")}>
                  {t("settings.aiAssistants.approvals.approve", "Approve")}
                </Button>
                <Button variant="outlined" disabled={busyId === item.id} onClick={() => decide(item.id, "reject")}>
                  {t("settings.aiAssistants.approvals.reject", "Reject")}
                </Button>
              </Stack>
            )}
            {item.error_code && (
              <Typography variant="body2" color="error">
                {item.error_code}
              </Typography>
            )}
          </Box>
        ))}
      </Stack>
    </Container>
  );
}
