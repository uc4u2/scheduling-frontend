import React from "react";
import { Alert, Button, Divider, List, ListItem, Paper, Stack, TextField, Typography, MenuItem } from "@mui/material";

export default function EmailSdrReplyReviewSection({
  rows = [],
  classificationOptions = [],
  inboundReplyClass = {},
  inboundReplyText = {},
  setInboundReplyClass,
  setInboundReplyText,
  onClassify,
  onTakeNext,
}) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Replies Needing Classification</Typography>
          {rows.length ? <Button size="small" variant="outlined" onClick={onTakeNext}>Take next unresolved</Button> : null}
        </Stack>
        {!rows.length ? (
          <Alert severity="success" variant="outlined">No replies are waiting for classification.</Alert>
        ) : (
          <List disablePadding>
            {rows.map((row) => {
              const event = row.event;
              return (
                <React.Fragment key={`review-reply-${event.id}`}>
                  <ListItem disableGutters sx={{ py: 1.25, alignItems: "flex-start" }}>
                    <Stack spacing={1.25} sx={{ width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {event.matched_lead?.company_name || event.from_email || "Inbound reply"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.issues.join(", ")} • {event.subject || "No subject"}
                      </Typography>
                      <TextField size="small" fullWidth multiline minRows={3} label="Inbound reply" value={event.body_text || ""} disabled />
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                        <TextField
                          select
                          size="small"
                          label="Classification"
                          value={inboundReplyClass[event.id] || ""}
                          onChange={(e) => setInboundReplyClass((prev) => ({ ...prev, [event.id]: e.target.value }))}
                          sx={{ minWidth: 220 }}
                        >
                          <MenuItem value="">Select</MenuItem>
                          {classificationOptions.map((option) => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          size="small"
                          fullWidth
                          label="Admin note / override reply text"
                          value={inboundReplyText[event.id] || ""}
                          onChange={(e) => setInboundReplyText((prev) => ({ ...prev, [event.id]: e.target.value }))}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => onClassify?.(event.id)}
                          disabled={!event.matched_message_id || !inboundReplyClass[event.id]}
                        >
                          Classify
                        </Button>
                      </Stack>
                    </Stack>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Stack>
    </Paper>
  );
}
