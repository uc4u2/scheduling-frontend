import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";
import { Link, Navigate } from "react-router-dom";
import api, { API_BASE_URL } from "../../utils/api";
import ManagementFrame from "../../components/ui/ManagementFrame";
import RecruiterTabs from "../../components/recruiter/RecruiterTabs";
import useRecruiterTabsAccess from "../../components/recruiter/useRecruiterTabsAccess";

const candidateStatusOptions = [
  "Applied",
  "Interview Scheduled",
  "Interviewed",
  "Approved",
  "Offered",
  "Placed",
  "Rejected",
  "On hold",
];

const toConversionLabel = (value) => {
  const status = (value || "").toLowerCase();
  if (!status || status === "none") return "Not requested";
  if (status === "pending") return "Pending";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
};

const toConversionColor = (value) => {
  const status = (value || "").toLowerCase();
  if (status === "approved") return "success";
  if (status === "rejected") return "error";
  if (status === "pending") return "warning";
  return "default";
};

const resolveResumeUrl = (row, apiUrl) => {
  if (!row) return "";
  if (row.resume_url) return row.resume_url;
  if (row.resume_filename) {
    return `${apiUrl}/uploads/resume/${encodeURIComponent(row.resume_filename)}`;
  }
  return "";
};

const RecruiterCandidateSearchPage = ({ token }) => {
  const { allowHrAccess, isLoading } = useRecruiterTabsAccess();
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStatus, setCandidateStatus] = useState("");
  const [candidateJob, setCandidateJob] = useState("");
  const [candidateRecruiterId, setCandidateRecruiterId] = useState("");
  const [candidateResults, setCandidateResults] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState("");
  const [candidateRecruiters, setCandidateRecruiters] = useState([]);

  useEffect(() => {
    if (!allowHrAccess) {
      setCandidateRecruiters([]);
      return;
    }
    api
      .get("/manager/recruiters")
      .then((res) => setCandidateRecruiters(res.data?.recruiters || []))
      .catch(() => setCandidateRecruiters([]));
  }, [token, allowHrAccess]);

  const handleCandidateSearch = useCallback(async () => {
    if (!allowHrAccess) return;
    setCandidateError("");
    setCandidateLoading(true);
    try {
      const res = await api.get("/manager/candidate-search", {
        params: {
          q: candidateSearch,
          status: candidateStatus,
          job_applied: candidateJob,
          recruiter_id: candidateRecruiterId || undefined,
        },
      });
      setCandidateResults(res.data?.candidates || []);
    } catch (err) {
      console.error("Failed to search candidates", err);
      setCandidateError("Unable to load candidate results.");
      setCandidateResults([]);
    } finally {
      setCandidateLoading(false);
    }
  }, [token, allowHrAccess, candidateSearch, candidateStatus, candidateJob, candidateRecruiterId]);

  if (!isLoading && !allowHrAccess) {
    return <Navigate to="/employee?tab=calendar" replace />;
  }

  return (
    <ManagementFrame
      title="Candidate Search"
      subtitle="Search by name, email, status, or recruiter."
      fullWidth
      sx={{ minHeight: "100vh", mt: { xs: 4, md: 0 }, px: { xs: 1, md: 2 } }}
      contentSx={{ p: { xs: 1.5, md: 2.5 } }}
    >
      <RecruiterTabs localTab="candidate-search" allowHrAccess={allowHrAccess} isLoading={isLoading} />

      {!allowHrAccess ? (
        <Alert severity="warning">You do not have access to candidate search.</Alert>
        ) : (
          <Box sx={{ maxWidth: 1100 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                label="Name or email"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                fullWidth
              />
              <TextField
                label="Job applied"
                value={candidateJob}
                onChange={(e) => setCandidateJob(e.target.value)}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
              <TextField
                select
                label="Status"
                value={candidateStatus}
                onChange={(e) => setCandidateStatus(e.target.value)}
                fullWidth
              >
                <MenuItem value="">
                  <em>Any status</em>
                </MenuItem>
                {candidateStatusOptions.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Assigned recruiter"
                value={candidateRecruiterId}
                onChange={(e) => setCandidateRecruiterId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">
                  <em>Any recruiter</em>
                </MenuItem>
                {candidateRecruiters.map((rec) => (
                  <MenuItem key={rec.id} value={rec.id}>
                    {rec.first_name} {rec.last_name}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                variant="contained"
                onClick={handleCandidateSearch}
                disabled={candidateLoading}
                sx={{ alignSelf: { xs: "stretch", md: "center" } }}
              >
                {candidateLoading ? "Searching..." : "Search"}
              </Button>
            </Stack>
            {candidateError && <Alert severity="error">{candidateError}</Alert>}
            {candidateResults.length === 0 && !candidateLoading ? (
              <Typography variant="body2" color="text.secondary">
                No candidates found yet. Adjust your filters and search again.
              </Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Conversion</TableCell>
                    <TableCell>Resume</TableCell>
                    <TableCell>Profile</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {candidateResults.map((row) => {
                    const resumeLink = resolveResumeUrl(row, API_BASE_URL);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{row.name || "N/A"}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.email}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.status || "N/A"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={toConversionLabel(row.conversion_status)}
                            color={toConversionColor(row.conversion_status)}
                            variant={row.conversion_status ? "filled" : "outlined"}
                          />
                        </TableCell>
                        <TableCell>
                          {resumeLink ? (
                            <Button
                              size="small"
                              variant="text"
                              component="a"
                              href={resumeLink}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.email ? (
                            <Button
                              size="small"
                              variant="outlined"
                              component={Link}
                              to={`/employee/candidates/${encodeURIComponent(row.email)}`}
                            >
                              View
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
    </ManagementFrame>
  );
};

export default RecruiterCandidateSearchPage;
