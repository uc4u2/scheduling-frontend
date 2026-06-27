import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

export default function EmailSdrLaunchWizard(props) {
  const {
    open,
    onClose,
    wizardStep,
    setWizardStep,
    launchWizardSteps,
    providerConnections,
    emailAgents,
    templatePacks,
    wizardTemplateOptions,
    wizardState,
    setWizardState,
    wizardPreview,
    wizardResult,
    handleWizardBusinessTypeChange,
    loadTemplatePreviewSilently,
    templatePreviews,
    handlePreviewTemplate,
    segments,
    submitting,
    handleWizardPreview,
    handleWizardGenerate,
    handleWizardApprove,
    handleWizardSend,
  } = props;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Launch Email Campaign</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Step {wizardStep + 1} of {launchWizardSteps.length}: {launchWizardSteps[wizardStep]}
          </Typography>
          <LinearProgress variant="determinate" value={((wizardStep + 1) / launchWizardSteps.length) * 100} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
            {launchWizardSteps.map((label, index) => (
              <Chip
                key={label}
                size="small"
                color={index < wizardStep ? "success" : index === wizardStep ? "primary" : "default"}
                variant={index <= wizardStep ? "filled" : "outlined"}
                label={label}
                sx={{
                  fontWeight: 700,
                  "& .MuiChip-label": {
                    color: index <= wizardStep ? "#fff" : "#1e293b",
                  },
                  ...(index === wizardStep
                    ? {
                        bgcolor: "#2563eb",
                        borderColor: "#2563eb",
                      }
                    : {}),
                  ...(index < wizardStep
                    ? {
                        bgcolor: "#15803d",
                        borderColor: "#15803d",
                      }
                    : {}),
                }}
              />
            ))}
          </Stack>

          {wizardStep === 0 && (
            <TextField select label="Provider" value={wizardState.provider_connection_id} onChange={(e) => setWizardState((prev) => ({ ...prev, provider_connection_id: e.target.value }))} helperText="Choose the mailbox/provider connection for this campaign.">
              <MenuItem value="">Fallback mail helper</MenuItem>
              {providerConnections.map((row) => <MenuItem key={row.id} value={row.id}>{row.name} • {row.from_email}</MenuItem>)}
            </TextField>
          )}

          {wizardStep === 1 && (
            <TextField select label="Email Agent" value={wizardState.email_agent_id} onChange={(e) => setWizardState((prev) => ({ ...prev, email_agent_id: e.target.value }))} helperText="Choose the AI Email Agent identity for the campaign.">
              <MenuItem value="">Auto-assign from active agents</MenuItem>
              {emailAgents.map((row) => <MenuItem key={row.id} value={row.sales_rep_id}>{row.display_name} • {row.from_email}</MenuItem>)}
            </TextField>
          )}

          {wizardStep === 2 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField select label="Template pack" value={wizardState.business_type} onChange={(e) => handleWizardBusinessTypeChange(e.target.value)} sx={{ minWidth: 240 }}>
                  {templatePacks.map((pack) => <MenuItem key={pack.business_type} value={pack.business_type}>{pack.business_type}</MenuItem>)}
                </TextField>
                <TextField label="Campaign name" value={wizardState.campaign_name} onChange={(e) => setWizardState((prev) => ({ ...prev, campaign_name: e.target.value }))} fullWidth />
                <TextField label="City" value={wizardState.city} onChange={(e) => setWizardState((prev) => ({ ...prev, city: e.target.value }))} sx={{ minWidth: 180 }} />
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                {templatePacks.map((pack) => (
                  <Button
                    key={`pack-${pack.business_type}`}
                    variant={wizardState.business_type === pack.business_type ? "contained" : "outlined"}
                    onClick={() => handleWizardBusinessTypeChange(pack.business_type)}
                    sx={
                      wizardState.business_type === pack.business_type
                        ? {
                            bgcolor: "#2563eb",
                            color: "#fff",
                            borderColor: "#2563eb",
                            fontWeight: 700,
                            "&:hover": {
                              bgcolor: "#1d4ed8",
                              borderColor: "#1d4ed8",
                            },
                          }
                        : {
                            color: "#2563eb",
                            borderColor: "#93c5fd",
                            fontWeight: 700,
                            "&:hover": {
                              borderColor: "#2563eb",
                              bgcolor: "#eff6ff",
                            },
                          }
                    }
                  >
                    Use {pack.business_type.replace(" service business", "")} defaults
                  </Button>
                ))}
              </Stack>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField select label="Initial template" value={wizardState.initial_template_id} onChange={(e) => { const value = e.target.value; setWizardState((prev) => ({ ...prev, initial_template_id: value })); loadTemplatePreviewSilently(value); }} fullWidth>
                  {wizardTemplateOptions.filter((row) => row.category === "cold_initial").map((row) => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}
                </TextField>
                <TextField select label="Follow-up 1" value={wizardState.follow_up_1_template_id} onChange={(e) => setWizardState((prev) => ({ ...prev, follow_up_1_template_id: e.target.value }))} fullWidth>
                  {wizardTemplateOptions.filter((row) => row.category === "follow_up_1").map((row) => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}
                </TextField>
                <TextField select label="Final follow-up" value={wizardState.follow_up_2_template_id} onChange={(e) => setWizardState((prev) => ({ ...prev, follow_up_2_template_id: e.target.value }))} fullWidth>
                  {wizardTemplateOptions.filter((row) => row.category === "follow_up_2").map((row) => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}
                </TextField>
              </Stack>
              {wizardState.initial_template_id && (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Sample preview</Typography>
                  <Button size="small" sx={{ mt: 1 }} onClick={() => handlePreviewTemplate(Number(wizardState.initial_template_id))} disabled={submitting}>
                    Render sample with John / ABC HVAC / Toronto
                  </Button>
                  {templatePreviews[wizardState.initial_template_id] && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">{templatePreviews[wizardState.initial_template_id].subject}</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mt: 1 }}>{templatePreviews[wizardState.initial_template_id].body}</Typography>
                      {!!(templatePreviews[wizardState.initial_template_id].missing_variable_warnings || []).length && (
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                          {(templatePreviews[wizardState.initial_template_id].missing_variable_warnings || []).map((warning) => (
                            <Chip key={warning.key} size="small" color="warning" variant="outlined" label={`Missing ${warning.label}`} />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  )}
                </Paper>
              )}
            </Stack>
          )}

          {wizardStep === 3 && (
            <Stack spacing={2}>
              <TextField select label="Segment" value={wizardState.segment_id} onChange={(e) => setWizardState((prev) => ({ ...prev, segment_id: e.target.value }))} helperText="Choose a saved segment or leave blank and use wizard filters below.">
                <MenuItem value="">Use wizard filters</MenuItem>
                {segments.map((row) => <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>)}
              </TextField>
              {!wizardState.segment_id && (
                <>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField label="Business type filter" value={wizardState.business_type} onChange={(e) => setWizardState((prev) => ({ ...prev, business_type: e.target.value }))} fullWidth />
                    <TextField label="City filter" value={wizardState.city} onChange={(e) => setWizardState((prev) => ({ ...prev, city: e.target.value }))} fullWidth />
                    <TextField label="Source type" value={wizardState.source_type} onChange={(e) => setWizardState((prev) => ({ ...prev, source_type: e.target.value }))} fullWidth />
                    <TextField label="Consent basis" value={wizardState.email_consent_basis} onChange={(e) => setWizardState((prev) => ({ ...prev, email_consent_basis: e.target.value }))} fullWidth />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField select label="Public email listed" value={wizardState.email_publicly_listed} onChange={(e) => setWizardState((prev) => ({ ...prev, email_publicly_listed: e.target.value }))} sx={{ minWidth: 180 }}>
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </TextField>
                    <Stack direction="row" spacing={1} alignItems="center"><Typography variant="caption">Exclude DNC</Typography><Switch checked={wizardState.exclude_do_not_contact} onChange={(e) => setWizardState((prev) => ({ ...prev, exclude_do_not_contact: e.target.checked }))} /></Stack>
                    <Stack direction="row" spacing={1} alignItems="center"><Typography variant="caption">Exclude suppressed</Typography><Switch checked={wizardState.exclude_suppressed} onChange={(e) => setWizardState((prev) => ({ ...prev, exclude_suppressed: e.target.checked }))} /></Stack>
                    <Stack direction="row" spacing={1} alignItems="center"><Typography variant="caption">Only uncontacted</Typography><Switch checked={wizardState.only_uncontacted} onChange={(e) => setWizardState((prev) => ({ ...prev, only_uncontacted: e.target.checked }))} /></Stack>
                    <Stack direction="row" spacing={1} alignItems="center"><Typography variant="caption">Only not replied</Typography><Switch checked={wizardState.only_not_replied} onChange={(e) => setWizardState((prev) => ({ ...prev, only_not_replied: e.target.checked }))} /></Stack>
                  </Stack>
                </>
              )}
            </Stack>
          )}

          {wizardStep === 4 && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              {!wizardPreview || wizardPreview.error ? (
                <Alert severity="warning" variant="outlined">{wizardPreview?.error || "Run preview to see eligible and blocked leads."}</Alert>
              ) : (
                <Stack spacing={1}>
                  <Typography variant="caption" color="text.secondary">
                    {wizardPreview.mode === "saved_segment" ? "Using saved segment" : "Using wizard filters"}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Preview: {wizardPreview.eligible_count || 0} eligible • {wizardPreview.blocked_count || 0} blocked
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Blocked reasons: {Object.entries(wizardPreview.blocked_reason_counts || {}).map(([key, value]) => `${key} (${value})`).join(", ") || "None"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Sample eligible leads: {(wizardPreview.eligible_sample || []).slice(0, 3).map((row) => row.company_name).join(", ") || "None"}
                  </Typography>
                </Stack>
              )}
            </Paper>
          )}

          {wizardStep >= 5 && wizardResult?.campaign && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{wizardResult.campaign.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Ready state: {wizardResult.ready_count || 0} messages • Created drafts: {wizardResult.draft_result?.created_count || 0}
              </Typography>
              {wizardStep >= 7 && <Alert severity="success" variant="outlined" sx={{ mt: 1 }}>Campaign is ready. Positive replies will still stay manual and flow to Hot Leads.</Alert>}
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {wizardStep > 0 && wizardStep < 5 && <Button onClick={() => setWizardStep((prev) => Math.max(0, prev - 1))}>Back</Button>}
        {wizardStep < 3 && <Button variant="contained" onClick={() => setWizardStep((prev) => prev + 1)} sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#1d4ed8" } }}>Continue</Button>}
        {wizardStep === 3 && <Button variant="contained" onClick={handleWizardPreview} disabled={submitting} sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#1d4ed8" } }}>Preview</Button>}
        {wizardStep === 4 && <Button variant="contained" onClick={handleWizardGenerate} disabled={submitting} sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#1d4ed8" } }}>Generate drafts</Button>}
        {wizardStep === 5 && <Button variant="contained" onClick={handleWizardApprove} disabled={submitting} sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#1d4ed8" } }}>Approve</Button>}
        {wizardStep === 6 && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => handleWizardSend("schedule")} disabled={submitting}>Leave for worker send</Button>
            <Button variant="contained" onClick={() => handleWizardSend("send")} disabled={submitting} sx={{ bgcolor: "#2563eb", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "#1d4ed8" } }}>Send now</Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
}
