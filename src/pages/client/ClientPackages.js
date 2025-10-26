// src/pages/client/ClientPackages.js
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, Button, CircularProgress
} from "@mui/material";
import axios from "axios";

export default function ClientPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/packages").then(res => setPackages(res.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>My Packages</Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Package</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Sessions</TableCell>
              <TableCell>Used</TableCell>
              <TableCell>Expires</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map(pkg => (
              <TableRow key={pkg.id}>
                <TableCell>{pkg.name}</TableCell>
                <TableCell>{pkg.service_name || pkg.service?.name}</TableCell>
                <TableCell>{pkg.remaining} / {pkg.session_qty}</TableCell>
                <TableCell>
                  {pkg.remaining < pkg.session_qty
                    ? <Chip label="In Use" color="primary" />
                    : <Chip label="Unused" />}
                </TableCell>
                <TableCell>
                  {pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString() : "No expiry"}
                </TableCell>
              </TableRow>
            ))}
            {packages.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}><Typography align="center">No packages found.</Typography></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
