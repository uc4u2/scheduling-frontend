import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, CircularProgress, TextField, Checkbox } from "@mui/material";
import axios from "axios";
import AuditHistory from "./AuditHistory";

const T4Dashboard = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [slips, setSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchSlips();
    // eslint-disable-next-line
  }, [year, status]);

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/yearend/t4/list", { params: { year, status } });
      setSlips(res.data);
    } catch (err) {
      setSlips([]);
    }
    setLoading(false);
  };

  const generateSlips = async () => {
    setLoading(true);
    await axios.post("/yearend/t4/generate", { year });
    await fetchSlips();
  };

  const batchDownload = async (format = "pdf") => {
    if (selected.length === 0) return;
    const res = await axios.post(
      "/yearend/t4/batch_download",
      { slip_ids: selected, format },
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `t4_slips.${format === "pdf" ? "zip" : "zip"}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const handleDownload = (id, type = "pdf") => {
    window.open(type === "pdf"
      ? `/yearend/t4/${id}/download`
      : `/yearend/t4/${id}/export_xml`,
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
        <Button onClick={generateSlips} variant="contained">Generate T4 Slips</Button>
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
            {slips.map(row => (
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
                  <AuditHistory recordType="t4" recordId={row.id} compact />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default T4Dashboard;
