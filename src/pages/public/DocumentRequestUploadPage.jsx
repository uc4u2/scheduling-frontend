import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  Link,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { api } from "../../utils/api";

export default function DocumentRequestUploadPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [requestInfo, setRequestInfo] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const maxSizeMb = 25;
  const allowedTypesLabel = "PDF, DOC, DOCX, PNG, JPG";

  const fileList = useMemo(() => Array.from(files || []), [files]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/api/document-requests/${token}`, {
          noAuth: true,
          noCompanyHeader: true,
        });
        if (!mounted) return;
        setRequestInfo(res?.data?.request || null);
        setAttachments(Array.isArray(res?.data?.attachments) ? res.data.attachments : []);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.error || "Unable to load document request.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleUpload = async () => {
    if (!token || fileList.length === 0) {
      setError("Please select at least one file to upload.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      fileList.forEach((file) => formData.append("documents", file));
      await api.post(`/api/document-requests/${token}/upload`, formData, {
        noAuth: true,
        noCompanyHeader: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Upload received. Your document will be reviewed shortly.");
      setFiles([]);
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {loading ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !requestInfo ? (
            <Alert severity="warning">This document request is no longer available.</Alert>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  {requestInfo.company_name || "Company"}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {requestInfo.subject || "Document request"}
                </Typography>
                {requestInfo.message && (
                  <Typography color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
                    {requestInfo.message}
                  </Typography>
                )}
              </Box>

              {attachments.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Attached files
                  </Typography>
                  <List dense>
                    {attachments.map((file) => (
                      <ListItem key={file.id} disableGutters>
                        <ListItemText
                          primary={
                            file.download_url ? (
                              <Link href={file.download_url} target="_blank" rel="noopener noreferrer">
                                {file.filename || "Attachment"}
                              </Link>
                            ) : (
                              file.filename || "Attachment"
                            )
                          }
                          secondary={file.scan_status ? `Scan: ${file.scan_status}` : null}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Upload your signed document
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Accepted: {allowedTypesLabel}. Max {maxSizeMb}MB per file. Files are scanned before they become available.
                </Typography>
                <Button variant="outlined" component="label" sx={{ mt: 1 }}>
                  Select files
                  <input
                    hidden
                    multiple
                    type="file"
                    onChange={(e) => setFiles(e.target.files)}
                  />
                </Button>
                {fileList.length > 0 && (
                  <List dense sx={{ mt: 1 }}>
                    {fileList.map((file) => (
                      <ListItem key={`${file.name}-${file.size}`} disableGutters>
                        <ListItemText
                          primary={file.name}
                          secondary={`${Math.round(file.size / 1024)} KB`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              {success && <Alert severity="success">{success}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              <Button variant="contained" onClick={handleUpload} disabled={uploading || fileList.length === 0}>
                {uploading ? "Uploading..." : "Upload documents"}
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
