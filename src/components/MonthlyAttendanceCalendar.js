// src/components/MonthlyAttendanceCalendar.js

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import axios from "axios";
import dayjs from "dayjs";

const MonthlyAttendanceCalendar = () => {
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/payroll/attendance-calendar?month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data || {});
    } catch (err) {
      console.error("Failed to fetch attendance calendar", err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = dayjs(month).daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <Box sx={{ p: 4 }}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h4" fontWeight={700}>
          Monthly Attendance Calendar
        </Typography>
        <FormControl sx={{ width: 200 }}>
          <InputLabel>Month</InputLabel>
          <Select value={month} onChange={(e) => setMonth(e.target.value)} label="Month">
            {Array.from({ length: 12 }, (_, i) => {
              const m = dayjs().month(i).format("YYYY-MM");
              return (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ mt: 3, overflowX: "auto" }}>
        <TableComponent data={data} days={days} />
      </Box>
    </Box>
  );
};

const TableComponent = ({ data, days }) => {
  return (
    <table border="1" style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th>Name</th>
          {days.map((d) => (
            <th key={d}>{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.keys(data).map((name) => (
          <tr key={name}>
            <td>{name}</td>
            {days.map((d) => {
              const status = data[name][d] || "";
              let color = "";
              if (status === "leave") color = "#ffd54f";
              else if (status === "present") color = "#81c784";
              else if (status === "absent") color = "#e57373";

              return (
                <td key={d} style={{ backgroundColor: color, textAlign: "center" }}>
                  {status ? status.charAt(0).toUpperCase() : ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MonthlyAttendanceCalendar;
