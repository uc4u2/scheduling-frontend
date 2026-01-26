import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Stack,
  Typography,
  Link,
  CircularProgress,
} from "@mui/material";
import { useParams } from "react-router-dom";
import SiteFrame from "../../components/website/SiteFrame";
import { api, publicSite } from "../../utils/api";

export default function DocumentRequestUploadPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [requestInfo, setRequestInfo] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [uploadErrors, setUploadErrors] = useState([]);
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
        setUploads(Array.isArray(res?.data?.uploads) ? res.data.uploads : []);
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
    setUploadErrors([]);
    try {
      const formData = new FormData();
      fileList.forEach((file) => formData.append("documents", file));
      const res = await api.post(`/api/document-requests/${token}/upload`, formData, {
        noAuth: true,
        noCompanyHeader: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      const errors = Array.isArray(res?.data?.errors) ? res.data.errors : [];
      if (errors.length) {
        setUploadErrors(errors);
      }
      setSuccess("Upload received. Your document will be reviewed shortly.");
      setFiles([]);
      const refreshed = await api.get(`/api/document-requests/${token}`, {
        noAuth: true,
        noCompanyHeader: true,
      });
      setRequestInfo(refreshed?.data?.request || null);
      setAttachments(Array.isArray(refreshed?.data?.attachments) ? refreshed.data.attachments : []);
      setUploads(Array.isArray(refreshed?.data?.uploads) ? refreshed.data.uploads : []);
    } catch (err) {
      const payload = err?.response?.data || {};
      setError(payload?.error || "Upload failed.");
      if (Array.isArray(payload?.errors)) {
        setUploadErrors(payload.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  const expired = Boolean(requestInfo?.expired);
  const canUpload = Boolean(requestInfo?.can_upload);
  const companySlug =
    requestInfo?.company_slug ||
    (() => {
      try {
        return localStorage.getItem("site") || "";
      } catch {
        return "";
      }
    })();

  const [sitePayload, setSitePayload] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);
  useEffect(() => {
    let mounted = true;
    if (!companySlug) return () => {};
    setSiteLoading(true);
    publicSite
      .getWebsiteShell(companySlug)
      .then((data) => {
        if (mounted) setSitePayload(data || null);
      })
      .catch(() => {
        if (mounted) setSitePayload(null);
      })
      .finally(() => {
        if (mounted) setSiteLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [companySlug]);

  const content = (
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

              {expired && (
                <Alert severity="warning">
                  This upload link expired on {requestInfo.expires_at ? new Date(requestInfo.expires_at).toLocaleDateString() : "an earlier date"}.
                </Alert>
              )}
              {!expired && requestInfo.status && requestInfo.status.toLowerCase() === "closed" && (
                <Alert severity="info">
                  This request is marked as completed. Uploads are disabled.
                </Alert>
              )}
              {!expired && uploads.length > 0 && (
                <Alert severity="success">
                  We've received {uploads.length} file{uploads.length === 1 ? "" : "s"}.
                  You can upload more if needed.
                </Alert>
              )}

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
                          secondary={
                            file.scan_status
                              ? `Scan: ${file.scan_status}${
                                  file.uploaded_at ? ` · ${new Date(file.uploaded_at).toLocaleString()}` : ""
                                }`
                              : null
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {uploads.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Your uploads
                  </Typography>
                  <List dense>
                    {uploads.map((file) => (
                      <ListItem key={file.id} disableGutters>
                        <ListItemText
                          primary={file.filename || "Uploaded file"}
                          secondary={
                            file.scan_status
                              ? `Scan: ${file.scan_status}${file.uploaded_at ? ` · ${new Date(file.uploaded_at).toLocaleString()}` : ""}`
                              : null
                          }
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
                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                  <Button variant="outlined" component="label" disabled={!canUpload || expired}>
                    Select files
                    <input
                      hidden
                      multiple
                      type="file"
                      onChange={(e) => setFiles(e.target.files)}
                    />
                  </Button>
                  {!canUpload && !expired && <Chip label="Uploads disabled" size="small" />}
                  {expired && <Chip label="Link expired" size="small" color="warning" />}
                </Box>
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
              {uploadErrors.length > 0 && (
                <Alert severity="warning">
                  {uploadErrors.map((errItem, idx) => (
                    <Box key={`${errItem.filename || idx}`} sx={{ fontSize: 13 }}>
                      {errItem.filename ? `${errItem.filename}: ` : ""}{errItem.error}
                    </Box>
                  ))}
                </Alert>
              )}

              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={uploading || fileList.length === 0 || !canUpload || expired}
              >
                {uploading ? "Uploading..." : "Upload documents"}
              </Button>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );

  if (!companySlug) {
    return content;
  }

  if (siteLoading && !sitePayload) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SiteFrame
      slug={companySlug}
      initialSite={sitePayload || undefined}
      disableFetch={Boolean(sitePayload)}
      wrapChildrenInContainer={false}
    >
      {content}
    </SiteFrame>
  );
}
