import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import ManagementFrame from "../../components/ui/ManagementFrame";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";
import ProfessionSettings from "../sections/ProfessionSetting";
import CandidateFormsPanel from "../../candidateForms/CandidateFormsPanel";
import QUESTIONNAIRE_LIMITS, { QUESTIONNAIRE_ALLOWED_MIME } from "../../constants/questionnaireUploads";

const RecruiterQuestionnairesPage = ({ token }) => {
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const mimeTypes = useMemo(
    () => (Array.isArray(QUESTIONNAIRE_ALLOWED_MIME) ? QUESTIONNAIRE_ALLOWED_MIME : []),
    []
  );

  if (!isLoading && !allowHrAccess) {
    return <Navigate to="/employee?tab=calendar" replace />;
  }

  return (
    <ManagementFrame
      title="Questionnaire Builder"
      subtitle="Create, publish, and maintain questionnaires for doctor onboarding and intake."
      fullWidth
      sx={{ minHeight: "100vh", px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs localTab="questionnaires" allowHrAccess={allowHrAccess} isLoading={isLoading} />

      <Stack spacing={3}>
        <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }} elevation={0}>
          <Stack spacing={1.5}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Storage Limits & Antivirus
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Files uploaded through questionnaires follow these limits. Large uploads and S3 transfers update in real time so recruiters can monitor progress.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} useFlexGap flexWrap="wrap">
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Max file size
                </Typography>
                <Typography variant="body1">{QUESTIONNAIRE_LIMITS.maxFileMb} MB</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Max files per submission
                </Typography>
                <Typography variant="body1">
                  {QUESTIONNAIRE_LIMITS.maxFilesPerSubmission}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Antivirus scanning
                </Typography>
                <Typography variant="body1">
                  {QUESTIONNAIRE_LIMITS.scanningEnabled ? "Enabled" : "Disabled"}
                </Typography>
              </Box>
            </Stack>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Allowed file types
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {mimeTypes.length === 0 ? (
                  <Chip label="Any" size="small" />
                ) : (
                  mimeTypes.map((mime) => <Chip key={mime} label={mime} size="small" />)
                )}
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Paper sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3 }} elevation={0}>
          <ProfessionSettings variant="embedded" />
        </Paper>

        <CandidateFormsPanel token={token} />
      </Stack>
    </ManagementFrame>
  );
};

export default RecruiterQuestionnairesPage;
