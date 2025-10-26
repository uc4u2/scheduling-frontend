import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, CircularProgress, TextField, Checkbox } from "@mui/material";
import axios from "axios";
import AuditHistory from "./AuditHistory";

const W2Dashboard = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchForms();
    // eslint-disable-next-line
  }, [year, status]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/yearend/w2/list", { params: { year, status } });
      setForms(res.data);
    } catch (err) {
      setForms([]);
    }
    setLoading(false);
  };

  const generateForms = async () => {
    setLoading(true);
    await axios.post("/yearend/w2/generate", { year });
    await fetchForms();
  };

  const batchDownload = async (format = "pdf") => {
    if (selected.length === 0) return;
    const res = await axios.post(
      "/yearend/w2/batch_download",
      { form_ids: selected, format },
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `w2_forms.${format === "pdf" ? "zip" : "zip"}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleDownload = (id, type = "pdf") => {
    window.open(type === "pdf"
      ? `/yearend/w2/${id}/download`
      : `/yearend/w2/${id}/export_xml`,
      "_blank");
  };

  const handleSelect = (id) => {
    setSelected((old) => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Year"
          type="number"
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          size="small"
        />
        <Select
          value={status}
          onChange={e => setStatus(e.target.value)}
          size="small"
          displayEmpty
        >
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="issued">Issued</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
        </Select>
        <Button onClick={generateForms} variant="contained">Generate W-2 Forms</Button>
        <Button onClick={() => batchDownload("pdf")} variant="outlined" color="primary">Download Selected (PDF ZIP)</Button>
        <Button onClick={() => batchDownload("xml")} variant="outlined" color="secondary">Download Selected (XML ZIP)</Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Employee</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>PDF</TableCell>
              <TableCell>XML</TableCell>
              <TableCell>Audit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.map(row => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox checked={selected.includes(row.id)} onChange={() => handleSelect(row.id)} />
                </TableCell>
                <TableCell>{row.employee_name}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <Button onClick={() => handleDownload(row.id, "pdf")}>PDF</Button>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleDownload(row.id, "xml")}>XML</Button>
                </TableCell>
                <TableCell>
                  <AuditHistory recordType="w2" recordId={row.id} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default W2Dashboard;
