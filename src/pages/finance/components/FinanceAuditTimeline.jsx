import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  Drawer,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import ExpandLessOutlinedIcon from "@mui/icons-material/ExpandLessOutlined";
import { getFinanceAuditLogs } from "../financeApi";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";

const ACTION_LABELS = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  status_changed: "Status changed",
  converted_to_invoice: "Converted to invoice",
  payment_link_created: "Payment link created",
  offline_payment_recorded: "Offline payment recorded",
  refund_issued: "Refund issued",
  create_similar_invoice: "Create similar invoice",
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const prettifyField = (field, delta) => {
  if (delta?.label) return delta.label;
  return String(field || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

function FinanceAuditTimelineContent({
  title,
  emptyText,
  loading,
  error,
  items,
  total,
  hasMore,
  loadingMore,
  onLoadMore,
}) {
  const timezone = React.useMemo(() => getUserTimezone(), []);
  const [expandedIds, setExpandedIds] = React.useState({});

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <HistoryOutlinedIcon fontSize="small" color="action" />
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 3 }}>
          <CircularProgress size={24} />
        </Stack>
      ) : null}

      {!loading && error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error && !items.length ? (
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      ) : null}

      {!loading && !error && items.length ? (
        <Stack spacing={1.25}>
          {!!total ? (
            <Typography variant="caption" color="text.secondary">
              Showing {items.length} of {total}
            </Typography>
          ) : null}
          {items.map((entry, index) => {
            const expanded = Boolean(expandedIds[entry.id]);
            const diffs = entry?.diff && typeof entry.diff === "object" ? Object.entries(entry.diff) : [];
            return (
              <Box key={entry.id}>
                <Stack spacing={1}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ sm: "flex-start" }}
                  >
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="body2" fontWeight={700}>
                          {entry.actor_name || entry.actor_email || "System"}
                        </Typography>
                        <Chip
                          size="small"
                          label={ACTION_LABELS[entry.action] || entry.action || "Updated"}
                          variant="outlined"
                        />
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {entry.created_at ? formatDateTimeInTz(entry.created_at, timezone) : "—"}
                      </Typography>
                      {entry.message ? (
                        <Typography variant="body2" color="text.secondary">
                          {entry.message}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Button
                      size="small"
                      variant="text"
                      endIcon={expanded ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
                      onClick={() => toggleExpanded(entry.id)}
                    >
                      View changes
                    </Button>
                  </Stack>

                  <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                      {diffs.length ? (
                        <Stack spacing={0.75}>
                          {diffs.map(([field, delta]) => (
                            <Paper key={field} variant="outlined" sx={{ p: 1.1, borderRadius: 1.5 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                {prettifyField(field, delta)}
                              </Typography>
                              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 0.35 }}>
                                <Typography variant="body2">
                                  <strong>Before:</strong> {formatValue(delta?.before)}
                                </Typography>
                                <Typography variant="body2">
                                  <strong>After:</strong> {formatValue(delta?.after)}
                                </Typography>
                              </Stack>
                            </Paper>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No field-level changes captured.
                        </Typography>
                      )}
                      <details>
                        <summary style={{ cursor: "pointer" }}>
                          <Typography component="span" variant="caption" color="text.secondary">
                            Raw snapshots
                          </Typography>
                        </summary>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Before
                            </Typography>
                            <Box
                              component="pre"
                              sx={{
                                m: 0,
                                mt: 0.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: "background.default",
                                overflowX: "auto",
                                fontSize: 12,
                              }}
                            >
                              {JSON.stringify(entry.before || {}, null, 2)}
                            </Box>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              After
                            </Typography>
                            <Box
                              component="pre"
                              sx={{
                                m: 0,
                                mt: 0.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: "background.default",
                                overflowX: "auto",
                                fontSize: 12,
                              }}
                            >
                              {JSON.stringify(entry.after || {}, null, 2)}
                            </Box>
                          </Box>
                        </Stack>
                      </details>
                    </Stack>
                  </Collapse>
                </Stack>
                {index < items.length - 1 ? <Divider sx={{ mt: 1.25 }} /> : null}
              </Box>
            );
          })}
          {hasMore ? (
            <Button
              size="small"
              variant="outlined"
              onClick={onLoadMore}
              disabled={loadingMore}
              sx={{ alignSelf: "flex-start" }}
            >
              {loadingMore ? "Loading..." : "Load more"}
            </Button>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

export default function FinanceAuditTimeline({
  entityType,
  entityId,
  title = "Activity",
  emptyText = "No audit records yet.",
  open,
  onClose,
}) {
  const PAGE_SIZE = 25;
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState("");
  const [items, setItems] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);

  const shouldLoad = typeof open === "boolean" ? open : Boolean(entityType);

  React.useEffect(() => {
    if (!entityType || !shouldLoad) {
      if (typeof open !== "boolean") {
        setItems([]);
        setPage(1);
        setTotal(0);
        setHasMore(false);
      }
      return;
    }
    let active = true;
    const initialPage = 1;
    setLoading(true);
    setLoadingMore(false);
    setError("");
    setItems([]);
    setPage(initialPage);
    setTotal(0);
    setHasMore(false);
    getFinanceAuditLogs({
      entity_type: entityType,
      entity_id: entityId || undefined,
      include_snapshots: true,
      limit: PAGE_SIZE,
      page: initialPage,
    })
      .then((payload) => {
        if (!active) return;
        const nextItems = Array.isArray(payload?.items) ? payload.items : [];
        const pagination = payload?.pagination || {};
        const nextTotal = Number(pagination?.total || nextItems.length || 0);
        const nextPage = Number(pagination?.page || initialPage);
        const nextPages = Number(pagination?.pages || 1);
        setItems(nextItems);
        setTotal(nextTotal);
        setHasMore(nextPage < nextPages);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Unable to load activity.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [entityId, entityType, shouldLoad, open]);

  const handleLoadMore = React.useCallback(() => {
    if (!entityType || loading || loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    setError("");
    getFinanceAuditLogs({
      entity_type: entityType,
      entity_id: entityId || undefined,
      include_snapshots: true,
      limit: PAGE_SIZE,
      page: nextPage,
    })
      .then((payload) => {
        const nextItems = Array.isArray(payload?.items) ? payload.items : [];
        const pagination = payload?.pagination || {};
        const nextTotal = Number(pagination?.total || total || 0);
        const returnedPage = Number(pagination?.page || nextPage);
        const nextPages = Number(pagination?.pages || returnedPage);
        setItems((prev) => [...prev, ...nextItems]);
        setPage(returnedPage);
        setTotal(nextTotal);
        setHasMore(returnedPage < nextPages);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || err?.message || "Unable to load more activity.");
      })
      .finally(() => {
        setLoadingMore(false);
      });
  }, [entityId, entityType, hasMore, loading, loadingMore, page, total]);

  const content = (
    <FinanceAuditTimelineContent
      title={title}
      emptyText={emptyText}
      loading={loading}
      error={error}
      items={items}
      total={total}
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={handleLoadMore}
    />
  );

  if (typeof open === "boolean") {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
          "& .MuiDrawer-paper": {
            zIndex: (theme) => theme.zIndex.modal + 2,
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100%", md: 520 },
            p: 2,
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  return <Paper variant="outlined" sx={{ p: 2 }}>{content}</Paper>;
}
