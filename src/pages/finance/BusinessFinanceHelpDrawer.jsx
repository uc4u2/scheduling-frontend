import React from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

const workflowSteps = [
  "Quote Request",
  "Estimate",
  "Invoice",
  "Work Order",
  "Assign Team",
  "Employee Field Report",
  "Manager Review",
  "Inventory / Invoice Updates",
  "Reports / Month-End",
];

const groupSections = [
  {
    title: "Daily Operations",
    items: [
      "Quotes: Capture new requests and turn them into estimates.",
      "Estimates: Price the job before it becomes an invoice or work order.",
      "Work Orders: Plan the job, assign team members, and track execution.",
      "Expenses: Record day-to-day costs and keep receipts ready for review.",
    ],
  },
  {
    title: "Field Work & Reviews",
    items: [
      "Field Reports: Review what team members submitted from the field.",
      "Reviews: Approve what becomes official for inventory, job cost, and invoice follow-up.",
      "Materials & Supplies: Track stock levels and material availability.",
      "Purchases: Record supply purchases and stock increases.",
    ],
  },
  {
    title: "Accounting & Reports",
    items: [
      "Profitability: Review job performance before month-end.",
      "Tax Summary: Estimated tax summary for accountant review.",
      "Reports: Export invoices, expenses, and summaries for your accountant.",
      "Month-End: Review missing items and export clean month-end records.",
    ],
  },
  {
    title: "Setup",
    items: [
      "Vendors: Keep supplier contacts in one place.",
      "Materials categories/items: Keep stock organized so the team can find what they need.",
    ],
  },
];

export default function BusinessFinanceHelpDrawer({ open, onClose }) {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 520 },
          maxWidth: "100%",
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>Business Finance Help</Typography>
            <Typography variant="body2" color="text.secondary">
              How daily operations, field work, and accountant-ready reporting fit together.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close Business Finance help">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={2.5} sx={{ p: 2.5, overflowY: "auto" }}>
          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>What is Business Finance?</Typography>
            <Typography variant="body2" color="text.secondary">
              Business Finance keeps daily money, jobs, materials, field reports, and accountant-ready exports in one place.
            </Typography>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Daily workflow</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {workflowSteps.map((step) => (
                <Chip key={step} label={step} variant="outlined" />
              ))}
            </Stack>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Important rules</Typography>
            <List dense disablePadding>
              <ListItem disableGutters><ListItemText primary="Employees report what happened in the field." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Managers approve what becomes official." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Inventory is deducted only after manager approval." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Invoice extras are added only when the manager chooses." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Accounting reports are for review and export, not tax filing." /></ListItem>
            </List>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Where should I go?</Typography>
            <Stack spacing={1.5}>
              {groupSections.map((group) => (
                <Box key={group.title}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{group.title}</Typography>
                  <List dense disablePadding>
                    {group.items.map((item) => (
                      <ListItem key={item} disableGutters>
                        <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </Stack>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>What is not automatic?</Typography>
            <Alert severity="info" sx={{ mb: 1.5 }}>
              CSV exports are available now. Full ZIP-style accountant packs are not part of this pass.
            </Alert>
            <List dense disablePadding>
              <ListItem disableGutters><ListItemText primary="Receipt file upload is metadata/link only for now." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Tax summary is estimated for accountant review." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Inventory does not change from employee report alone." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Purchase void does not automatically reverse linked expenses." /></ListItem>
            </List>
          </section>
        </Stack>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
          <Button fullWidth variant="contained" onClick={onClose}>Close Help</Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
