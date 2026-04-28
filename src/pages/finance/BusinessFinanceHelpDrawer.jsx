import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const workflowSteps = [
  {
    step: "1. Start with a Quote Request",
    body: [
      "Use a Quote Request when a customer asks for a price, but you have not prepared the official price yet.",
      "Example: A customer calls and says: “I need someone to repair a leak. Can you give me a price?”",
      "At this stage, you are only capturing the request.",
    ],
    bullets: [
      "Customer details",
      "What they need",
      "Notes",
      "Photos or links if available",
      "Timeline or location",
    ],
    footer: "A Quote Request is not an invoice. It is just the starting point.",
  },
  {
    step: "2. Create an Estimate",
    body: [
      "Use an Estimate when you are ready to give the customer a price.",
      "An Estimate is your proposed price for the job.",
      "Example: Leak repair: Labor: 3 hours. Materials: connectors and pipe. Tax. Total estimated price.",
    ],
    footer: "Quote Request = customer asks for a price. Estimate = you prepare the price.",
  },
  {
    step: "3. Convert to an Invoice when payment is needed",
    body: [
      "Use an Invoice when the customer needs to pay.",
      "An invoice is more official than an estimate.",
    ],
    footer: "Estimate = proposed price. Invoice = amount to be paid.",
  },
  {
    step: "4. Create a Work Order",
    body: [
      "Use a Work Order when the job is ready to be planned and completed.",
      "A Work Order is the execution plan for the job.",
    ],
    bullets: [
      "Where is the job?",
      "When is it happening?",
      "Who is assigned?",
      "What work needs to be done?",
      "What materials are planned?",
      "What notes should the team see?",
    ],
    footer: "Estimate = price. Work Order = actual job plan.",
  },
  {
    step: "5. Assign the team",
    body: ["After creating the Work Order, assign team members to the job."],
    bullets: [
      "Employee or team member",
      "Date",
      "Start time",
      "End time",
      "Planned hours",
      "Notes",
      "Reporting access",
    ],
  },
  {
    step: "6. Track planned materials",
    body: [
      "You can add planned materials to the Work Order.",
      "At this stage, inventory is not deducted yet.",
    ],
    footer: "Planned materials are only the expected materials for the job.",
  },
  {
    step: "7. Employee submits a Field Report",
    body: [
      "After or during the job, the assigned employee can submit a Field Report.",
      "The employee is only reporting what happened in the field.",
    ],
    bullets: [
      "Work completed",
      "Notes from the job",
      "Issues found",
      "Extra work requested by the customer",
      "Materials used",
      "Photos or file links",
      "Client notes",
    ],
    footer: "The employee is not changing inventory or invoices.",
  },
  {
    step: "8. Manager reviews the Field Report",
    body: [
      "The manager reviews the employee’s report before anything becomes official.",
      "The manager compares planned work vs reported work, planned materials vs materials used, and expected job cost vs actual job reality.",
    ],
    bullets: [
      "Approve",
      "Adjust",
      "Reject",
      "Ask for clarification",
      "Mark material as client-provided",
      "Add extra work or materials to the invoice",
      "Keep extra work or materials as internal cost only",
    ],
  },
  {
    step: "9. Inventory and invoice updates happen only after approval",
    body: [
      "Inventory does not change when the employee submits a Field Report.",
      "Inventory changes only after the manager approves the review.",
    ],
    footer: "Invoice extras are also added only if the manager chooses to add them.",
  },
  {
    step: "10. Record purchases and expenses",
    body: [
      "Use Purchases when you buy materials or supplies.",
      "Use Expenses for day-to-day business costs such as rent, fuel, software, supplies, insurance, marketing, and accountant fees.",
    ],
    bullets: [
      "Increase stock",
      "Record the purchase",
      "Create an expense",
      "Keep the vendor connected to the purchase",
    ],
  },
  {
    step: "11. Review profitability",
    body: ["Use Profitability to understand how jobs are performing."],
    bullets: [
      "Estimate total",
      "Invoice total",
      "Planned labor cost",
      "Approved material cost",
      "Linked expenses",
      "Estimated margin",
    ],
  },
  {
    step: "12. Review Tax Summary",
    body: [
      "Tax Summary shows estimated tax information.",
      "This is for accountant review. It is not tax filing.",
    ],
    bullets: [
      "Tax collected from invoices",
      "Tax paid on expenses",
      "Estimated net tax",
    ],
  },
  {
    step: "13. Complete Month-End Review",
    body: [
      "Month-End helps you check if the business records are ready before sending information to your accountant.",
    ],
    bullets: [
      "Invoices",
      "Expenses",
      "Receipts",
      "Field reports",
      "Approved inventory usage",
      "Tax summary",
      "Missing items",
    ],
  },
];

const locationGroups = [
  {
    title: "Daily Operations",
    items: [
      { label: "Quotes", text: "Capture new customer requests." },
      { label: "Estimates", text: "Prepare prices for customers." },
      { label: "Work Orders", text: "Plan and manage the actual job." },
      { label: "Expenses", text: "Record day-to-day business costs." },
    ],
  },
  {
    title: "Field Work",
    items: [
      { label: "Materials & Supplies", text: "Track stock and material availability." },
      { label: "Purchases", text: "Record material and supply purchases." },
      { label: "Field Reports", text: "Review what employees submitted from the field." },
      { label: "Reviews", text: "Approve what becomes official." },
    ],
  },
  {
    title: "Reports",
    items: [
      { label: "Profitability", text: "Review job performance." },
      { label: "Tax Summary", text: "Review estimated tax collected and paid." },
      { label: "Reports", text: "Export invoices, expenses, and summaries." },
      { label: "Month-End", text: "Review missing items and prepare the month-end export." },
    ],
  },
  {
    title: "Setup",
    items: [
      { label: "Vendors", text: "Keep supplier contact details in one place." },
    ],
  },
];

const shortVersionItems = [
  "Quote Request = customer asks for a price",
  "Estimate = you prepare the price",
  "Invoice = customer needs to pay",
  "Work Order = the job plan",
  "Assignment = who is doing the work",
  "Field Report = employee reports what happened",
  "Review = manager approves what becomes official",
  "Inventory = materials are updated after approval",
  "Reports = accountant-ready summaries and exports",
];

function BodyCopy({ children }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

export default function BusinessFinanceHelpDrawer({ open, onClose }) {
  const theme = useTheme();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 560 },
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
              A simple guide to quotes, estimates, work orders, field reports, approvals, inventory, and accountant-ready reports.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close Business Finance help">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto" }}>
          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>What is Business Finance?</Typography>
            <Stack spacing={1}>
              <BodyCopy>
                Business Finance helps you manage customer requests, job pricing, work orders, materials,
                employee field reports, expenses, and accountant-ready reports in one place.
              </BodyCopy>
              <BodyCopy>
                It is designed for daily operations, not complicated accounting.
              </BodyCopy>
            </Stack>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>The simple workflow</Typography>
            <Stack spacing={1}>
              {workflowSteps.map((entry, index) => (
                <Accordion key={entry.step} disableGutters defaultExpanded={index === 0} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, "&:before": { display: "none" } }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" fontWeight={800}>{entry.step}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1.25}>
                      {entry.body.map((line) => (
                        <BodyCopy key={line}>{line}</BodyCopy>
                      ))}
                      {entry.bullets?.length ? (
                        <List dense disablePadding>
                          {entry.bullets.map((item) => (
                            <ListItem key={item} disableGutters sx={{ py: 0.125 }}>
                              <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={`- ${item}`} />
                            </ListItem>
                          ))}
                        </List>
                      ) : null}
                      {entry.footer ? (
                        <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1, backgroundColor: theme.palette.background.default }}>
                          <Typography variant="body2" fontWeight={700}>{entry.footer}</Typography>
                        </Paper>
                      ) : null}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Where should I go?</Typography>
            <Grid container spacing={1.5}>
              {locationGroups.map((group) => (
                <Grid item xs={12} sm={6} key={group.title}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25, height: "100%" }}>
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>{group.title}</Typography>
                    <Stack spacing={0.75}>
                      {group.items.map((item) => (
                        <Box key={item.label}>
                          <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                          <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Important rules</Typography>
            <List dense disablePadding>
              <ListItem disableGutters><ListItemText primary="Employees report. Managers approve." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Inventory is not deducted automatically from employee reports." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Invoice extras are manager-controlled." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Reports are for review and export. They do not replace official tax filing." /></ListItem>
            </List>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>What is not automatic yet?</Typography>
            <List dense disablePadding>
              <ListItem disableGutters><ListItemText primary="Receipt file upload is metadata/link based for now." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Tax Summary is estimated and should be reviewed with an accountant." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Inventory does not change from employee reports alone." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Purchase void does not automatically reverse linked expenses." /></ListItem>
              <ListItem disableGutters><ListItemText primary="Full ZIP-style accountant packs are not included yet. CSV exports are available." /></ListItem>
            </List>
          </section>

          <Divider />

          <section>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Very short version</Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                {["Quote Request", "Estimate", "Invoice", "Work Order", "Field Report", "Review"].map((label) => (
                  <Chip key={label} label={label} size="small" variant="outlined" />
                ))}
              </Stack>
              <List dense disablePadding>
                {shortVersionItems.map((item) => (
                  <ListItem key={item} disableGutters sx={{ py: 0.125 }}>
                    <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={item} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </section>
        </Stack>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
          <Button fullWidth variant="contained" onClick={onClose}>Close Help</Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
