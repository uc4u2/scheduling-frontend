// src/pages/client/ClientPackages.js
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip
} from "@mui/material";
import api from "../../utils/api";

export default function ClientPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPackages = () => {
    setLoading(true);
    setError("");
    api
      .get("/me/packages")
      .then((res) => setPackages(res.data || []))
      .catch(() => setError("Unable to load packages."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPackages();
  }, []);

  useEffect(() => {
    const handler = () => loadPackages();
    window.addEventListener("booking:changed", handler);
    return () => window.removeEventListener("booking:changed", handler);
  }, []);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>My Packages</Typography>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Package</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expires</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography align="center">Loading packages…</Typography>
                </TableCell>
              </TableRow>
            )}
            {packages.map((pkg) => {
              const template = pkg.template || {};
              const packageName = template.name || `Package #${pkg.id}`;
              const serviceName = template.service?.name || "Service";
              const remaining = Number(pkg.remaining ?? 0);
              const packSize = Number(template.session_qty ?? 0);
              const creditLabel =
                packSize > 0 ? `${remaining} left of ${packSize}-session pack` : `${remaining} left`;
              const statusLabel =
                remaining <= 0 ? "Exhausted" : remaining < packSize ? "In Use" : "Active";
              const statusColor =
                remaining <= 0 ? "default" : remaining < packSize ? "primary" : "success";

              return (
                <TableRow key={pkg.id}>
                  <TableCell>{packageName}</TableCell>
                  <TableCell>{serviceName}</TableCell>
                  <TableCell>{creditLabel}</TableCell>
                  <TableCell>
                    <Chip label={statusLabel} color={statusColor} />
                  </TableCell>
                  <TableCell>
                    {pkg.expires_at ? new Date(pkg.expires_at).toLocaleDateString() : "No expiry"}
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && packages.length === 0 && (
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
