import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Alert,
  TextField,
  Button,
  Divider,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import axios from "axios";
import { useSnackbar } from "notistack";
import { Navigate, useSearchParams } from "react-router-dom";

import EnhancedInvitationForm from "../../EnhancedInvitationForm";
import CandidateFormsPanel from "../../candidateForms/CandidateFormsPanel";
import ManagementFrame from "../../components/ui/ManagementFrame";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

const RecruiterInvitationsPage = ({ token }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePosition, setCandidatePosition] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "forms") {
      const el = document.getElementById("section-candidate-forms");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [searchParams]);

  const handleSendReminder = useCallback(async () => {
    if (!candidateName || !candidateEmail) {
      setError("Candidate name and email are required for reminders.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data } = await axios.post(
        `${API_URL}/send-reminder`,
        { name: candidateName, email: candidateEmail, position: candidatePosition },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(data.message);
      setError("");
      enqueueSnackbar("Reminder email sent", { variant: "success" });
    } catch (err) {
      const detail = err.response?.data?.error || "Failed to send reminder.";
      setError(detail);
      enqueueSnackbar(detail, { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }, [API_URL, token, candidateName, candidateEmail, candidatePosition, enqueueSnackbar]);

  if (!isLoading && !allowHrAccess) {
    return <Navigate to="/employee?tab=calendar" replace />;
  }

  return (
    <ManagementFrame
      title="Invitations & Candidate Forms"
      subtitle="Send custom invitations, follow up with candidates, and review form submissions in one place."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs localTab="invitations" allowHrAccess={allowHrAccess} isLoading={isLoading} />

      <Stack spacing={3}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.main, 0.015)} 100%)`,
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Custom Job Invitation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Use tailored templates, booking links, and automated messaging to invite candidates.
              </Typography>
            </Box>
            <Divider />
            <EnhancedInvitationForm token={token} embedded={true} />
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }} elevation={0}>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Send Reminder Email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Send a quick nudge about an upcoming meeting or a form that still needs attention.
              </Typography>
            </Box>
            {message && <Alert severity="success">{message}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
              <TextField
                label="Candidate Name"
                fullWidth
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
              <TextField
                label="Candidate Email"
                fullWidth
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
              <TextField
                label="Context / Notes"
                fullWidth
                value={candidatePosition}
                onChange={(e) => setCandidatePosition(e.target.value)}
              />
            </Stack>
            <Box>
              <Button
                variant="contained"
                onClick={handleSendReminder}
                disabled={isSubmitting}
              >
                Send Reminder
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Paper
          id="section-candidate-forms"
          elevation={0}
          sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Templates & Submissions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage active form templates and review candidate submissions.
              </Typography>
            </Box>
            <CandidateFormsPanel token={token} apiUrl={API_URL} />
          </Stack>
        </Paper>
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterInvitationsPage;
