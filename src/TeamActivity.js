import React, { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import api from "./utils/api";

const TeamActivity = ({ token }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get("/manager/activity-summary");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load activity summary", err);
      }
    };

    if (token) {
      fetchActivity();
    }
  }, [token]);

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
         Team Activity Overview (Last 7 Days)
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Recruiter</TableCell>
            <TableCell>Interviews Scheduled</TableCell>
            <TableCell>Candidates Added</TableCell>
            <TableCell>Feedback Logged</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((rec, idx) => (
            <TableRow key={idx}>
              <TableCell>{rec.recruiter}</TableCell>
              <TableCell>{rec.interviews_scheduled}</TableCell>
              <TableCell>{rec.candidates_added}</TableCell>
              <TableCell>{rec.feedback_logged}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default TeamActivity;
