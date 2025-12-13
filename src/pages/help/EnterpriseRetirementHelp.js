import React from "react";
import { Accordion, AccordionDetails, AccordionSummary, Typography, Stack, List, ListItem, ListItemText } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const sections = [
  {
    title: "Who this is for",
    items: [
      "U.S. payroll (401(k)) uses Enterprise retirement automatically.",
      "Canadian payroll continues to use standard RRSP (enterprise 401(k) does not apply).",
    ],
  },
  {
    title: "What Enterprise Retirement Does",
    items: [
      "Auto-calculates 401(k) contributions using plan defaults and employee elections",
      "Enforces annual IRS limits automatically",
      "Updates W-2 wage bases and Box 12 (code D)",
    ],
  },
  {
    title: "What You Need to Set Up",
    items: [
      "Enable Enterprise mode in Company Profile",
      "Create a retirement plan in Manager → Payroll → Retirement Plans (/manager/payroll/retirement)",
      "Optionally collect employee elections",
    ],
  },
  {
    title: "How Contributions Are Calculated",
    items: [
      "Employee election wins; otherwise plan default is used",
      "Cap enforced at the annual employee limit",
      "Employer match is tracked for reporting; it does not reduce net pay",
    ],
  },
  {
    title: "Why Contributions Stop",
    items: [
      "Annual limit reached — contributions pause until next year",
      "A cap warning appears on the payroll preview when this happens",
    ],
  },
  {
    title: "W-2 Reporting",
    items: [
      "Box 1: reduced by employee 401(k) deferrals",
      "Box 3 & 5: Social Security/Medicare wages (not reduced by 401(k))",
      "Box 12 D: total employee 401(k) deferral for the year",
    ],
  },
];

export default function EnterpriseRetirementHelp() {
  return (
    <Stack spacing={1}>
      {sections.map((section) => (
        <Accordion key={section.title} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" fontWeight={600}>{section.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {section.items.map((item, idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}
