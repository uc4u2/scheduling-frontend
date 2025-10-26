import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Box, Typography } from "@mui/material";
import axios from "axios";

export default function ClientInvoices() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("/invoices", {
      headers: { Authorization: `Bearer ${token}` }
    }).then((res) => setRows(res.data));
  }, []);

  const columns = [
    { field: "id", headerName: "Invoice#", width: 100 },
    { field: "amount", headerName: "Amount", width: 100 },
    { field: "status", headerName: "Status", width: 100 },
    { field: "created_at", headerName: "Date", width: 130 },
    {
      field: "actions", headerName: "Actions", width: 180, renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => window.open(`/invoices/${params.row.id}?format=pdf`, "_blank")}
        >
          Download PDF
        </Button>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Invoices</Typography>
      <div style={{ height: 400, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} pageSize={5} />
      </div>
    </Box>
  );
}
