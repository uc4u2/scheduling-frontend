import React, { useMemo, useState } from "react";
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
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const workflowSections = [
  {
    title: "1. Start with a Quote Request",
    body: [
      "Use a Quote Request when the customer needs custom pricing and you have not prepared the estimate yet.",
      "Examples: kitchen leak repair, cabinet repair, custom installation, or any job where the price depends on scope.",
      "Do not use this flow for a simple known-price appointment. If the service, price, employee, and time are already known, use the normal Booking flow instead.",
    ],
    bullets: [
      "Title",
      "Source",
      "Request Contact",
      "Service address",
      "Preferred timeline",
      "Description",
      "Visible notes",
      "Internal notes",
    ],
    footer: "A Quote Request is the starting record. It is not the estimate, invoice, or work order.",
  },
  {
    title: "2. Link or create the Client",
    body: [
      "Request Contact is the person who asked for the quote.",
      "Linked Client is the official customer record used for estimates, invoices, and work orders.",
      "Before creating the estimate, link the quote to the correct client or create a new client from the quote contact.",
    ],
    footer: "The estimate, invoice, payment link, and work order should all connect to the official client record.",
  },
  {
    title: "3. Create the Estimate",
    body: [
      "Create the Estimate when you are ready to prepare the customer-facing price.",
      "Review the client, estimate title, issue date, expiry date, notes, terms, tax, and line items before sharing it.",
      "If the quote already created an estimate, open the existing estimate instead of creating another one.",
    ],
    bullets: [
      "Estimate title",
      "Issue date",
      "Expiry date",
      "Visible notes",
      "Terms",
      "Line items",
      "Tax and discount",
    ],
    footer: "The estimate is the proposed price for the job.",
  },
  {
    title: "4. Share the Estimate",
    body: [
      "The best action is Send Estimate. That sends the public estimate link to the client.",
      "You can also use Create / Copy Link, Open Link, Print / PDF, or Copy Summary when you need a manual share method.",
      "WhatsApp, SMS, and personal email are still manual unless automation is added later.",
    ],
    footer: "Mark Sent Manually is only an internal status shortcut. It is not proof that the client received or accepted the estimate.",
  },
  {
    title: "5. Client reviews the public estimate page",
    body: [
      "The public estimate page shows the company name, estimate number, title, line items, totals, notes, and terms.",
      "The page does not show internal notes, profitability, labor cost, vendor cost, audit logs, or accounting-only data.",
      "The client can accept or reject the estimate on the public page.",
    ],
    footer: "If the client accepts, the estimate becomes approved. If the client rejects, the estimate becomes rejected.",
  },
  {
    title: "6. Understand the estimate states",
    body: [
      "Draft means the estimate is being prepared.",
      "Sent means it was shared or emailed.",
      "Viewed means the client opened the public link.",
      "Approved means the client accepted it or a manager marked it accepted manually as an administrative fallback.",
      "Rejected means the client rejected it or a manager marked it rejected manually as an administrative fallback.",
    ],
    footer: "Manual manager accepted or rejected statuses are only fallback states. They are not the same as a real client response through the public link.",
  },
  {
    title: "7. If the client accepts",
    body: [
      "After approval, the manager decides what happens next.",
      "Convert to Invoice creates the bill and payment record.",
      "Create Work Order creates the operational job record.",
      "These actions should stay separate because estimate approval, payment collection, and job execution are different business steps.",
    ],
    bullets: [
      "Convert to Invoice",
      "Create / Copy Payment Link",
      "Open Payment Link",
      "Create Work Order",
      "Assign team",
    ],
    footer: "Normal path: client accepts -> invoice and payment link -> work order -> assignment -> field report -> manager review.",
  },
  {
    title: "8. If the client rejects or does not respond",
    body: [
      "If the client rejects, review the note, revise the estimate, and use Revise and Resend when appropriate.",
      "If the client does not respond, follow up. Silence should never be treated as approval.",
      "If the estimate was already converted to an invoice, do not reopen it. Handle changes through the invoice or create a new revised estimate.",
    ],
    footer: "Viewed but no response means follow up. Expired means decide whether to extend and resend.",
  },
  {
    title: "9. Invoice, payment, and work order",
    body: [
      "Convert to Invoice when the customer needs to pay.",
      "Use Create / Copy Payment Link or Open Payment Link when you want the client to pay online.",
      "Create Work Order when the job is ready to be planned and executed.",
      "The work order is the job plan. It is not the same thing as the estimate or invoice.",
    ],
    bullets: [
      "Work dates",
      "Location",
      "Instructions",
      "Planned materials",
      "Assigned team members",
    ],
    footer: "Planned materials do not deduct inventory yet.",
  },
  {
    title: "10. Employee field work and manager approval",
    body: [
      "Employees see assigned work orders and submit field reports.",
      "A field report records what happened in the field. It does not update inventory or invoice records by itself.",
      "The manager reviews the field report and decides what becomes official.",
      "Inventory changes only after manager review approval.",
    ],
    bullets: [
      "Employee submits field report",
      "Manager opens Field Reports",
      "Manager creates Review",
      "Manager approves material and billing decisions",
      "Work order closes when the approved review finishes the job",
    ],
    footer: "The employee reports what happened. The manager approves what becomes official.",
  },
  {
    title: "11. Reporting and month-end",
    body: [
      "Use Profitability to review revenue, labor, approved material cost, linked expenses, and estimated margin.",
      "Use Tax Summary for accountant review only. It is an estimate, not official tax filing.",
      "Use Month-End and Reports when checking missing items and preparing accountant-ready exports.",
    ],
    footer: "Reports support review and export. They do not replace formal accounting or tax filing.",
  },
];

const workflowLocations = [
  {
    title: "Daily Operations",
    items: [
      { label: "Quotes", text: "Capture custom-price customer requests." },
      { label: "Estimates", text: "Prepare and share customer pricing." },
      { label: "Work Orders", text: "Plan and manage the job." },
      { label: "Expenses", text: "Record day-to-day business costs." },
    ],
  },
  {
    title: "Field Execution",
    items: [
      { label: "Materials & Supplies", text: "Track stock items and material availability." },
      { label: "Purchases", text: "Record stock purchases and related expenses." },
      { label: "Field Reports", text: "Review what employees submitted from the field." },
      { label: "Reviews", text: "Approve what becomes official for inventory and billing." },
    ],
  },
  {
    title: "Reporting",
    items: [
      { label: "Profitability", text: "Review job performance before month-end." },
      { label: "Tax Summary", text: "Review estimated tax for accountant follow-up." },
      { label: "Reports", text: "Export invoices, expenses, and summaries." },
      { label: "Month-End", text: "Review missing items and prepare exports." },
    ],
  },
  {
    title: "Setup",
    items: [
      { label: "Vendors", text: "Keep supplier details in one place." },
      { label: "Materials Categories", text: "Organize stock items without mixing them with expense categories." },
    ],
  },
];

const scenarios = [
  {
    title: "Scenario 1: Custom repair job",
    summary: "Use this when the customer needs a custom price before work can be scheduled.",
    steps: [
      "Customer asks for a price for a kitchen leak repair.",
      "Manager creates a Quote Request in Quotes.",
      "Manager links or creates the Client record.",
      "Manager creates the Estimate and checks the public estimate page.",
      "Manager sends the estimate link.",
      "Client accepts the estimate.",
      "Manager converts to invoice, creates a payment link if needed, and creates the work order.",
      "Employee submits a field report after the job.",
      "Manager approves the review and the work order closes.",
    ],
  },
  {
    title: "Scenario 2: Urgent job before payment",
    summary: "Use this when the customer approves quickly and the team needs to move fast.",
    steps: [
      "Customer approves the estimate right away.",
      "Manager creates the work order immediately so the team can be assigned.",
      "Manager converts to invoice and sends the payment link either before or after scheduling based on company policy.",
      "Employee completes the work and submits a field report.",
      "Manager approves the review to finalize inventory and billing decisions.",
    ],
  },
  {
    title: "Scenario 3: Client rejects and needs a revision",
    summary: "Use this when the scope, price, or terms need to change.",
    steps: [
      "Client rejects the estimate and leaves a note.",
      "Manager reviews the rejection reason.",
      "Manager updates line items, scope, notes, or terms.",
      "Manager uses Revise and Resend to clear the old response and reshare the estimate.",
      "Client reviews the updated estimate and responds again.",
    ],
  },
  {
    title: "Scenario 4: Sent but no response",
    summary: "Use this when the client has not accepted or rejected the estimate yet.",
    steps: [
      "If the estimate was sent but not viewed, verify the email address and resend the link.",
      "If the estimate was viewed but not answered, follow up and ask whether changes are needed.",
      "If the estimate expired, decide whether to extend the expiry and resend it.",
      "Do not assume approval when the client stays silent.",
    ],
  },
  {
    title: "Scenario 5: Phone approval or WhatsApp approval",
    summary: "Use manual accepted status only when the client clearly approved outside the portal.",
    steps: [
      "Confirm the scope, total, tax, and terms with the client.",
      "Record proof in internal notes.",
      "Mark the estimate accepted manually only as an administrative fallback.",
      "Send a confirmation note back to the client when possible.",
      "If possible, guide the client to accept the public estimate link instead. That creates the cleanest response record.",
    ],
  },
  {
    title: "Scenario 6: Deposit required before scheduling",
    summary: "Use this when payment is required before the work is booked.",
    steps: [
      "Client accepts the estimate.",
      "Manager converts the estimate to an invoice.",
      "Manager creates or copies the hosted payment link.",
      "Manager sends the payment link.",
      "Manager creates the work order after the payment or deposit rule is satisfied.",
    ],
  },
];

const shortVersionItems = [
  "Quote Request = customer asks for a custom price",
  "Estimate = customer-facing proposed price",
  "Invoice = payment record",
  "Work Order = job plan",
  "Field Report = employee reports what happened",
  "Review = manager approves what becomes official",
];

function BodyCopy({ children }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

function SectionList({ items }) {
  return (
    <List dense disablePadding>
      {items.map((item) => (
        <ListItem key={item} disableGutters sx={{ py: 0.125 }}>
          <ListItemText
            primary={`- ${item}`}
            primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
          />
        </ListItem>
      ))}
    </List>
  );
}

export default function BusinessFinanceHelpDrawer({ open, onClose }) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  const summaryChipLabels = useMemo(
    () => ["Quote Request", "Estimate", "Invoice", "Work Order", "Field Report", "Review"],
    []
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 620 },
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
              A practical guide to quote requests, estimates, invoices, work orders, field reports, reviews, inventory, and reports.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close Business Finance help">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next)}
          variant="fullWidth"
          sx={{ px: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}
        >
          <Tab label="Workflow" />
          <Tab label="Real-Life Scenarios" />
        </Tabs>

        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto" }}>
          {tab === 0 ? (
            <>
              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>What is Business Finance?</Typography>
                <Stack spacing={1}>
                  <BodyCopy>
                    Business Finance helps you manage custom-price job requests, customer pricing, work orders, materials,
                    employee field reports, expenses, and accountant-ready reports in one place.
                  </BodyCopy>
                  <BodyCopy>
                    It is designed for operational workflow first. It is not a replacement for formal accounting or tax filing.
                  </BodyCopy>
                </Stack>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Workflow</Typography>
                <Stack spacing={1}>
                  {workflowSections.map((entry, index) => (
                    <Accordion
                      key={entry.title}
                      disableGutters
                      defaultExpanded={index === 0}
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" fontWeight={800}>{entry.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.25}>
                          {entry.body.map((line) => (
                            <BodyCopy key={line}>{line}</BodyCopy>
                          ))}
                          {entry.bullets?.length ? <SectionList items={entry.bullets} /> : null}
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
                  {workflowLocations.map((group) => (
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
                <SectionList
                  items={[
                    "Employees report what happened. Managers approve what becomes official.",
                    "Inventory is not deducted from employee field reports alone.",
                    "Invoice extras are manager-controlled through review approval.",
                    "Manual accepted or rejected status is an administrative fallback, not the same as a client portal response.",
                    "Reports support review and export. They do not replace official accounting or tax filing.",
                  ]}
                />
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>What is not automatic yet?</Typography>
                <SectionList
                  items={[
                    "WhatsApp and SMS sending are still manual unless later automation is added.",
                    "Receipt file upload is metadata or link based for now.",
                    "Tax Summary is estimated and should be reviewed with an accountant.",
                    "Purchase void does not automatically reverse linked expenses.",
                    "Reports and exports are available, but they are not a full replacement for external accounting review.",
                  ]}
                />
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>One sentence to remember</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                  <Typography variant="body2" fontWeight={700}>
                    The estimate gets client approval, the invoice collects payment, the work order runs the job, the employee reports what happened, and the manager approves what becomes official.
                  </Typography>
                </Paper>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Very short version</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    {summaryChipLabels.map((label) => (
                      <Chip key={label} label={label} size="small" variant="outlined" />
                    ))}
                  </Stack>
                  <SectionList items={shortVersionItems} />
                </Paper>
              </section>
            </>
          ) : (
            <>
              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Real-Life Scenarios</Typography>
                <Stack spacing={1}>
                  <BodyCopy>
                    Use these examples when you are deciding whether to send an estimate, create an invoice, create a work order, or reopen a job for changes.
                  </BodyCopy>
                </Stack>
              </section>

              <Divider />

              <section>
                <Stack spacing={1}>
                  {scenarios.map((scenario, index) => (
                    <Accordion
                      key={scenario.title}
                      disableGutters
                      defaultExpanded={index === 0}
                      elevation={0}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        "&:before": { display: "none" },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2" fontWeight={800}>{scenario.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{scenario.summary}</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <SectionList items={scenario.steps} />
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>Manager checklist</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                  <SectionList
                    items={[
                      "Create Quote Request and capture the request contact.",
                      "Link or create the official Client record.",
                      "Create and review the Estimate.",
                      "Send the estimate link or copy the link manually.",
                      "Wait for client approval or rejection, or follow up if there is no response.",
                      "Convert to Invoice when payment is needed.",
                      "Create the Work Order when the job is ready to be scheduled.",
                      "Assign the employee or team.",
                      "Employee submits the Field Report.",
                      "Manager approves the Review before inventory and billing changes become official.",
                    ]}
                  />
                </Paper>
              </section>
            </>
          )}
        </Stack>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
          <Button fullWidth variant="contained" onClick={onClose}>Close Help</Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
