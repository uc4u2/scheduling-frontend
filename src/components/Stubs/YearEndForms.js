// YearEndForms.js
import React, { useState } from "react";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import T4Dashboard from "./T4Dashboard";
import W2Dashboard from "./W2Dashboard";

const YearEndForms = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5">Year-End Forms: T4 / W-2</Typography>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="T4 (Canada)" />
        <Tab label="W-2 (US)" />
      </Tabs>
      {tab === 0 && <T4Dashboard />}
      {tab === 1 && <W2Dashboard />}
    </Box>
  );
};
export default YearEndForms;
