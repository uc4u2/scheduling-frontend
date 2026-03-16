import React, { useMemo } from "react";
import {
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import { formatDateTimeInTz } from "../../../utils/datetime";
import { getUserTimezone } from "../../../utils/timezone";

function metaEntries(meta) {
  if (!meta || typeof meta !== "object") return [];
  return Object.entries(meta).slice(0, 10);
}

export default function InboundCallDetailDrawer({ open, call, onClose, onOpenLead }) {
  const timezone = useMemo(() => getUserTimezone(), []);
  const formatDateTime = (value) => (value ? formatDateTimeInTz(value, timezone) || "-" : "-");

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", md: 460 } } }}>
      <Box sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Inbound Call Detail
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Review the call session, routing result, matched CRM record, and recording metadata.
            </Typography>
          </Box>

          {!call ? (
            <Typography variant="body2" color="text.secondary">Select an inbound call to view details.</Typography>
          ) : (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                <Chip size="small" label={call.status || "unknown"} color="primary" />
                {call.department_key ? <Chip size="small" variant="outlined" label={`Dept: ${call.department_key}`} /> : null}
                {call.is_voicemail_left ? <Chip size="small" color="warning" variant="outlined" label="Voicemail left" /> : null}
                {call.route_result ? <Chip size="small" variant="outlined" label={`Route: ${call.route_result}`} /> : null}
              </Stack>

              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemText primary="Caller" secondary={call.from_phone || call.from_phone_normalized || "Unknown"} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Dialed number" secondary={call.to_phone || call.to_phone_normalized || "-"} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Assigned rep" secondary={call.assigned_rep_name || (call.assigned_rep_id ? `Rep #${call.assigned_rep_id}` : "-")} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Started" secondary={formatDateTime(call.started_at)} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Answered" secondary={formatDateTime(call.answered_at)} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Ended" secondary={formatDateTime(call.ended_at)} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Wait seconds" secondary={call.wait_seconds ?? "-"} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Duration seconds" secondary={call.duration_seconds ?? "-"} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemText primary="Call SID" secondary={call.twilio_call_sid || "-"} />
                </ListItem>
              </List>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Matched CRM Record
                </Typography>
                {call.matched_preview ? (
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      {call.matched_preview.company_name || call.matched_preview.contact_name || call.matched_preview.name || "Matched record"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {call.matched_preview.type} #{call.matched_preview.id}
                    </Typography>
                    {call.matched_preview.type === "sales_lead" ? (
                      <Button size="small" variant="outlined" onClick={() => onOpenLead?.(call.matched_preview.id)}>
                        Open lead
                      </Button>
                    ) : null}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No matched CRM entity.</Typography>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Recordings
                </Typography>
                {call.recordings?.length ? (
                  <Stack spacing={1}>
                    {call.recordings.map((recording) => (
                      <Box key={recording.id} sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {recording.source_type || "call"} recording
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {recording.recording_sid || "No SID"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Status: {recording.status || "unknown"} · Duration: {recording.duration_seconds ?? "-"}s
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">No recordings attached.</Typography>
                )}
              </Box>

              {metaEntries(call.meta).length ? (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                      Meta Summary
                    </Typography>
                    <Stack spacing={0.75}>
                      {metaEntries(call.meta).map(([key, value]) => (
                        <Typography key={key} variant="caption" color="text.secondary">
                          {key}: {typeof value === "string" ? value : JSON.stringify(value)}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                </>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}
