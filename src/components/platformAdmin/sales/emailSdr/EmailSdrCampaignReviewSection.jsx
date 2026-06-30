import React, { useMemo, useState } from "react";
import { Alert, Button, Chip, Pagination, Paper, Stack, TextField, Typography } from "@mui/material";

const PAGE_SIZE = 5;

function normalizeSearch(value) {
  return String(value || "").toLowerCase();
}

export default function EmailSdrCampaignReviewSection({ rows = [], onOpenWorkspace, onApproveDrafts, onTakeNext }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => {
    const q = normalizeSearch(searchTerm);
    if (!q) return rows;
    return rows.filter((row) => normalizeSearch([
      row.campaign?.name,
      row.campaign?.status,
      ...(row.issues || []),
    ].filter(Boolean).join(" ")).includes(q));
  }, [rows, searchTerm]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const visibleRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, rows.length]);

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <Paper sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Campaigns Needing Review</Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search campaigns"
              placeholder="Campaign name or issue"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              sx={{ minWidth: 260 }}
            />
            {filteredRows.length ? <Button size="small" variant="outlined" onClick={onTakeNext}>Take next unresolved</Button> : null}
          </Stack>
        </Stack>
        {!filteredRows.length ? (
          <Alert severity="success" variant="outlined">No campaigns currently need review.</Alert>
        ) : (
          <Stack spacing={1.25}>
            {visibleRows.map((row) => (
              <Paper key={`review-campaign-${row.campaign.id}`} variant="outlined" sx={{ p: 1.75, borderRadius: 2 }}>
                <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5}>
                  <Stack spacing={0.75}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.campaign.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{row.campaign.status}</Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {(row.issues || []).map((issue) => (
                        <Chip key={`${row.campaign.id}-${issue}`} size="small" variant="outlined" label={issue} />
                      ))}
                    </Stack>
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => onOpenWorkspace?.(row.campaign.id)}>Open workspace</Button>
                    <Button size="small" variant="outlined" onClick={() => onApproveDrafts?.(row.campaign.id)}>Approve drafts</Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {pageCount > 1 ? (
              <Stack alignItems="flex-end">
                <Pagination size="small" page={page} count={pageCount} onChange={(_, nextPage) => setPage(nextPage)} />
              </Stack>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
