// DirectDepositHelp.js
import React from "react";
import { Box, Typography, Link, Alert } from "@mui/material";

const DirectDepositHelp = () => (
  <Box>
    <Typography variant="h6">How to Upload Payroll File to Your Bank</Typography>
    <Alert severity="info" sx={{ my: 2 }}>
      Download your payroll CSV/NACHA file from this system, then log in to your bank’s business portal.<br />
      <b>For most banks:</b> Go to “Payroll/Payments”, select “Upload Payroll File”, choose your CSV/NACHA file and submit.<br />
      <b>Bank-specific help:</b>
      <ul>
        <li><Link href="https://www.rbcroyalbank.com/business/online-banking/payroll.html" target="_blank">RBC</Link></li>
        <li><Link href="https://www.td.com/ca/en/business-banking/small-business/payroll" target="_blank">TD Canada Trust</Link></li>
        <li><Link href="https://www.scotiabank.com/ca/en/small-business/payroll.html" target="_blank">Scotiabank</Link></li>
        <li><Link href="https://www.chase.com/business/online-banking/payroll" target="_blank">Chase (US)</Link></li>
        <li><Link href="https://www.wellsfargo.com/biz/payroll-services/" target="_blank">Wells Fargo</Link></li>
      </ul>
      For others, search “[Bank Name] upload payroll file”.
    </Alert>
  </Box>
);
export default DirectDepositHelp;
