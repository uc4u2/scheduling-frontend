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
  FormControlLabel,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";

const SOURCE_TYPE_OPTIONS = [
  ["", "Any source"],
  ["website", "Business website"],
  ["directory", "Online directory"],
  ["facebook_page", "Facebook business page"],
  ["referral", "Referral"],
  ["website_chatbot", "Marketing chatbot"],
  ["manual", "Manual entry"],
];

const CONSENT_BASIS_OPTIONS = [
  ["", "Any consent type"],
  ["explicit_opt_in", "Explicit opt-in"],
  ["implied_public_business", "Public business contact"],
  ["referral", "Referral-based"],
  ["manual_opt_in", "Manual opt-in"],
  ["unknown", "Unknown / review later"],
];

function HelpLabel({ label, help }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
        {label}
      </Typography>
      <Tooltip title={help} arrow placement="top">
        <IconButton size="small" sx={{ p: 0.25 }}>
          <HelpOutlineOutlinedIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

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
    previewValues,
    setPreviewValues,
    resolvedPreviewAgentName,
    selectedWizardAgent,
    selectedWizardAgents,
    wizardCapacityPreview,
    wizardPreview,
    wizardResult,
    handleWizardBusinessTypeChange,
    syncAutoCampaignName,
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
            <Stack spacing={1.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={wizardState.use_all_active_agents}
                    onChange={(e) =>
                      setWizardState((prev) => ({
                        ...prev,
                        use_all_active_agents: e.target.checked,
                        email_agent_ids: e.target.checked ? emailAgents.filter((row) => row.status === "active").map((row) => Number(row.sales_rep_id)) : prev.email_agent_ids,
                      }))
                    }
                  />
                }
                label="Use all active Email Agents"
              />
              <TextField
                select
                SelectProps={{ multiple: true }}
                label="Email Agents"
                value={wizardState.email_agent_ids || []}
                onChange={(e) =>
                  setWizardState((prev) => ({
                    ...prev,
                    email_agent_ids: e.target.value,
                    use_all_active_agents: false,
                  }))
                }
                helperText="Choose one or more sender identities, or keep all active agents enabled."
                disabled={wizardState.use_all_active_agents}
                fullWidth
              >
                {emailAgents.map((row) => (
                  <MenuItem key={row.id} value={row.sales_rep_id}>{row.display_name} • {row.from_email} • {row.daily_limit || 0}/day</MenuItem>
                ))}
              </TextField>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Selected agents</Typography>
                  {!selectedWizardAgents?.length ? (
                    <Alert severity="warning" variant="outlined">No active Email Agents selected yet.</Alert>
                  ) : (
                    <>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                        <Chip size="small" variant="outlined" label={`Selected agents: ${wizardCapacityPreview?.selectedAgentsCount || 0}`} />
                        <Chip size="small" color="primary" variant="outlined" label={`Total capacity: ${wizardCapacityPreview?.totalDailyCapacity || 0}/day`} />
                      </Stack>
                      {selectedWizardAgents.map((row) => (
                        <Paper key={`wizard-agent-${row.id}`} variant="outlined" sx={{ p: 1.25, backgroundColor: "#f8fafc" }}>
                          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.display_name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {row.from_email} • provider {row.provider_connection_name || "Fallback"} • warmup {row.warmup_stage_effective || "new"}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} useFlexGap>
                              <Chip size="small" variant="outlined" label={`Limit: ${row.daily_limit_effective || 0}/day`} />
                              <Chip size="small" variant="outlined" label={`Sent today: ${row.sent_today || 0}`} />
                              <Chip size="small" color={row.paused ? "warning" : "success"} variant="outlined" label={row.paused ? "Paused" : "Active"} />
                            </Stack>
                          </Stack>
                        </Paper>
                      ))}
                    </>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}

          {wizardStep === 2 && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField select label="Template pack" value={wizardState.business_type} onChange={(e) => handleWizardBusinessTypeChange(e.target.value)} sx={{ minWidth: 240 }}>
                  {templatePacks.map((pack) => <MenuItem key={pack.business_type} value={pack.business_type}>{pack.business_type}</MenuItem>)}
                </TextField>
                <TextField label="Campaign name" value={wizardState.campaign_name} onChange={(e) => setWizardState((prev) => ({ ...prev, campaign_name: e.target.value, campaign_name_auto: false }))} fullWidth />
                <TextField label="City" value={wizardState.city} onChange={(e) => syncAutoCampaignName({ city: e.target.value })} sx={{ minWidth: 180 }} />
              </Stack>
              {wizardState.import_batch_name ? (
                <Alert severity="info" variant="outlined">
                  Using imported batch: <strong>{wizardState.import_batch_name}</strong>. Preview and draft generation will target this batch directly.
                </Alert>
              ) : null}
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
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Preview values</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Use these only to test how the template reads. Real sends still use the selected Email Agent and lead data.
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Preview sender name"
                      value={previewValues.agent_name}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, agent_name: e.target.value }))}
                      helperText={
                        selectedWizardAgent
                          ? `Leave blank to use the selected Email Agent: ${selectedWizardAgent.display_name}.`
                          : "Leave blank to use the selected Email Agent display name."
                      }
                      fullWidth
                    />
                    <TextField
                      label="Preview contact name"
                      value={previewValues.contact_name}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, contact_name: e.target.value }))}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Preview business name"
                      value={previewValues.business_name}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, business_name: e.target.value }))}
                      fullWidth
                    />
                    <TextField
                      label="Preview city"
                      value={previewValues.city}
                      onChange={(e) => setPreviewValues((prev) => ({ ...prev, city: e.target.value }))}
                      fullWidth
                    />
                  </Stack>
                  <Alert severity="info" variant="outlined">
                    <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{`{{agent_name}}`}</Box>
                    {" "}comes from the Email Agent display name in real sends. This box only changes preview text.
                  </Alert>
                </Stack>
              </Paper>
              {wizardState.initial_template_id && (
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Sample preview</Typography>
                  <Button size="small" sx={{ mt: 1 }} onClick={() => handlePreviewTemplate(Number(wizardState.initial_template_id), wizardState.business_type || "General")} disabled={submitting}>
                    Render sample with {previewValues.contact_name || "John"} / {previewValues.business_name || "ABC HVAC"} / {previewValues.city || "Toronto"}
                  </Button>
                  {templatePreviews[wizardState.initial_template_id] && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        Rendered with sender identity: {templatePreviews[wizardState.initial_template_id].variables?.agent_name || resolvedPreviewAgentName}
                      </Typography>
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
                  <Alert severity="info" variant="outlined">
                    Use these filters only to narrow the first test batch. Keep them simple, then tighten later after you see the preview counts.
                  </Alert>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      label="Business type filter"
                      value={wizardState.business_type}
                      onChange={(e) => setWizardState((prev) => ({ ...prev, business_type: e.target.value }))}
                      helperText="Use General for broad service outreach or pick one vertical like HVAC."
                      fullWidth
                    />
                    <TextField
                      label="City filter"
                      value={wizardState.city}
                      onChange={(e) => setWizardState((prev) => ({ ...prev, city: e.target.value }))}
                      helperText="Optional. Use one city first to keep the first campaign small."
                      fullWidth
                    />
                    <TextField
                      select
                      label="Source type"
                      value={wizardState.source_type}
                      onChange={(e) => setWizardState((prev) => ({ ...prev, source_type: e.target.value }))}
                      helperText="Where the lead came from."
                      fullWidth
                    >
                      {SOURCE_TYPE_OPTIONS.map(([value, label]) => (
                        <MenuItem key={value || "any"} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      select
                      label="Consent basis"
                      value={wizardState.email_consent_basis}
                      onChange={(e) => setWizardState((prev) => ({ ...prev, email_consent_basis: e.target.value }))}
                      helperText="Use this only if you want to narrow by contact permission type."
                      fullWidth
                    >
                      {CONSENT_BASIS_OPTIONS.map(([value, label]) => (
                        <MenuItem key={value || "any"} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                    <TextField
                      select
                      label="Public email listed"
                      value={wizardState.email_publicly_listed}
                      onChange={(e) => setWizardState((prev) => ({ ...prev, email_publicly_listed: e.target.value }))}
                      helperText="Use this only if you want to target emails that were publicly listed."
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </TextField>
                    <Stack spacing={0.5}>
                      <HelpLabel
                        label="Exclude DNC"
                        help="Skips leads flagged as do not contact / do not call. Keep this on."
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={wizardState.exclude_do_not_contact}
                            onChange={(e) => setWizardState((prev) => ({ ...prev, exclude_do_not_contact: e.target.checked }))}
                          />
                        }
                        label=""
                      />
                    </Stack>
                    <Stack spacing={0.5}>
                      <HelpLabel
                        label="Exclude suppressed"
                        help="Skips unsubscribed, bounced, and manually suppressed emails. Keep this on."
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={wizardState.exclude_suppressed}
                            onChange={(e) => setWizardState((prev) => ({ ...prev, exclude_suppressed: e.target.checked }))}
                          />
                        }
                        label=""
                      />
                    </Stack>
                    <Stack spacing={0.5}>
                      <HelpLabel
                        label="Only uncontacted"
                        help="Limits the batch to leads that have not been emailed yet. Best for a first campaign."
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={wizardState.only_uncontacted}
                            onChange={(e) => setWizardState((prev) => ({ ...prev, only_uncontacted: e.target.checked }))}
                          />
                        }
                        label=""
                      />
                    </Stack>
                    <Stack spacing={0.5}>
                      <HelpLabel
                        label="Only not replied"
                        help="Skips leads that already replied before. Keep this on unless you are intentionally rebuilding a list."
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={wizardState.only_not_replied}
                            onChange={(e) => setWizardState((prev) => ({ ...prev, only_not_replied: e.target.checked }))}
                          />
                        }
                        label=""
                      />
                    </Stack>
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
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap>
                    <Chip size="small" variant="outlined" label={`Eligible leads: ${wizardCapacityPreview?.eligibleLeads || 0}`} />
                    <Chip size="small" variant="outlined" label={`Selected agents: ${wizardCapacityPreview?.selectedAgentsCount || 0}`} />
                    <Chip size="small" color="primary" variant="outlined" label={`Total capacity: ${wizardCapacityPreview?.totalDailyCapacity || 0}/day`} />
                    <Chip size="small" variant="outlined" label={`Estimated finish: ${wizardCapacityPreview?.estimatedDays || 0} day(s)`} />
                  </Stack>
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
                  <Paper variant="outlined" sx={{ p: 1.25, backgroundColor: "#f8fafc" }}>
                    <Stack spacing={0.75}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>AI Manager Recommendations</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review import quality first, then start with a small approved batch. Suggested daily pace for this campaign: {wizardCapacityPreview?.totalDailyCapacity || 0}/day across {wizardCapacityPreview?.selectedAgentsCount || 0} selected agent(s).
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Suggested next step: generate drafts, approve a small first batch, then work replies and hot leads from Action Queue.
                      </Typography>
                    </Stack>
                  </Paper>
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
