import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

const STATIC_SECTIONS = [
  {
    title: "What Field Photos is for",
    icon: <PhotoCameraIcon color="primary" />,
    items: [
      "Employees upload proof-of-work photos from their shift cards in My Time.",
      "Photos are grouped by employee and shift, so one shift session stays easy to review.",
      "Use the gallery to open a larger preview and move through all photos in the session.",
    ],
  },
  {
    title: "Security status",
    icon: <SecurityOutlinedIcon color="primary" />,
    items: [
      "Security check in progress means the photo is uploaded but not available to open yet.",
      "Ready means the photo passed the security check and can be previewed or downloaded.",
      "Blocked means the file was stopped by security scanning. Ask the employee to upload another photo.",
    ],
  },
  {
    title: "Finding photos faster",
    icon: <FilterAltOutlinedIcon color="primary" />,
    items: [
      "Filter by department, employee, date period, readiness, location, or archived status.",
      "Photos opened from a shift are automatically filtered to that shift. Use Clear to return to all photos.",
      "Open shift takes you back to the related shift context when you need scheduling details.",
    ],
  },
  {
    title: "Archive and delete",
    icon: <DeleteOutlineIcon color="primary" />,
    items: [
      "Archive hides a photo from the active view but keeps it available in the Archived filter.",
      "Delete removes the photo row and stored image.",
      "Employees can delete their own uploaded photos if they need to correct a mistake and upload again.",
    ],
  },
];

const Section = ({ title, icon, items }) => (
  <Box sx={{ mb: 2.5 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
      {icon}
      <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
        {title}
      </Typography>
    </Stack>
    <List dense sx={{ py: 0 }}>
      {items.map((item) => (
        <ListItem key={item} alignItems="flex-start" sx={{ px: 0, py: 0.35 }}>
          <ListItemIcon sx={{ minWidth: 28, mt: 0.35 }}>
            <TaskAltIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText
            primary={item}
            primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
          />
        </ListItem>
      ))}
    </List>
  </Box>
);

const FrequentlyAskedQuestions = ({ items }) => (
  <Box component="section" aria-labelledby="field-photos-faq-heading" sx={{ mb: 2.5 }}>
    <Typography id="field-photos-faq-heading" variant="subtitle1" sx={{ fontWeight: 900, mb: 1 }}>
      Frequently asked questions
    </Typography>
    <Stack spacing={0.75}>
      {items.map(({ question, answer }) => {
        const slug = question.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
        const id = `field-photos-faq-${slug}`;
        return (
          <Accordion
            key={question}
            disableGutters
            elevation={0}
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: "8px !important",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary
              id={`${id}-header`}
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${id}-content`}
            >
              <Typography variant="body2" sx={{ fontWeight: 800, pr: 1 }}>
                {question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails id={`${id}-content`} aria-labelledby={`${id}-header`} sx={{ pt: 0, pb: 1.75 }}>
              <Typography component="div" variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  </Box>
);

export default function FieldPhotosHelpDrawer({ open, onClose, summary, preview }) {
  const isSmall = useMediaQuery("(max-width:900px)");
  const includedStorage = preview?.included_storage_label || "the included storage allocation";
  const storageExpansion = preview?.storage_expansion_label || "an additional storage pack";
  const storageExpansionProse = storageExpansion.replace(/^\+\s*/, "");
  const recurringPrice = preview?.recurring_amount_formatted
    ? `${preview.recurring_amount_formatted}${preview?.interval ? `/${preview.interval}` : ""}`
    : "$29/month";
  const storageExpansionPrice = preview?.storage_expansion_amount_formatted
    ? `${preview.storage_expansion_amount_formatted}${preview?.storage_expansion_interval ? `/${preview.storage_expansion_interval}` : ""}`
    : "$10/month";
  const selectedRetention = summary?.retention_label || preview?.retention_label || "the selected retention period";
  const retentionOptions = Array.isArray(preview?.retention_options) && preview.retention_options.length
    ? preview.retention_options.map((option) => option.label).join(", ")
    : "90 days, 1 year, 3 years, or 7 years";
  const sections = [
    ...STATIC_SECTIONS.slice(0, 3),
    {
      title: "Storage, retention, and billing",
      icon: <StorageOutlinedIcon color="primary" />,
      items: [
        `Field Photos includes ${includedStorage}. Choose a retention period of 90 days, 1 year, 3 years, or 7 years; this company currently uses ${selectedRetention}.`,
        `If storage gets close to full, add ${storageExpansion} from the manager billing flow. Quota usage is based on the final optimized photo size.`,
        "Gallery-link expiration does not delete the underlying photo. New uploads use the retention selected when each photo is created.",
        "If Field Photos is cancelled, uploads stop and existing photos remain read-only for download for 30 days before cancellation cleanup.",
      ],
    },
    ...STATIC_SECTIONS.slice(3),
  ];
  const frequentlyAskedQuestions = [
    {
      question: "What are Field Photos?",
      answer: "Field Photos are private photos connected to work performed for your business. Employees can add proof-of-work photos from supported shift and work-order flows, and managers can add photos to Client 360 records so the team can review them in one place.",
    },
    {
      question: "How much does Field Photos cost?",
      answer: `Field Photos costs ${recurringPrice} per company and includes ${includedStorage} of photo storage.`,
    },
    {
      question: "Does choosing 7-year retention cost more than 90 days?",
      answer: `No. The retention choice does not change the base Field Photos monthly price. The same ${includedStorage} storage allowance is included with every retention option. Longer retention means photos stay in your account longer, so your business may use more storage over time.`,
    },
    {
      question: `What happens if I need more than ${includedStorage}?`,
      answer: `Managers can add additional storage from the Field Photos billing flow. Each storage pack adds ${storageExpansionProse} for ${storageExpansionPrice}.`,
    },
    {
      question: "What does photo retention mean?",
      answer: `Retention controls how long Schedulaa automatically keeps each new Field Photo. Available choices are ${retentionOptions}. The retention selected when a photo is created stays with that photo.`,
    },
    {
      question: "If I change retention later, what happens to my existing photos?",
      answer: "The new retention setting applies to new photos. Existing photos keep the retention period that was assigned when they were created.",
    },
    {
      question: "Does a gallery link expiration delete my photos?",
      answer: "No. Gallery-link expiration only ends access through that shared gallery link. It does not delete the underlying Field Photos.",
    },
    {
      question: "Are Field Photos private?",
      answer: "Yes. Field Photos are stored privately and protected by access controls. Uploaded photos go through the Field Photos security-check process before they become available as Ready. Authorized, expiring gallery access is separate and does not make photo storage public.",
    },
    {
      question: "What do Security check, Ready, and Blocked mean?",
      answer: (
        <Stack component="span" spacing={0.5}>
          <span><strong>Security check:</strong> The photo is being checked and cannot be opened yet.</span>
          <span><strong>Ready:</strong> The photo passed the security check and can be viewed or downloaded by authorized users.</span>
          <span><strong>Blocked:</strong> The photo did not pass the security check and should be replaced.</span>
        </Stack>
      ),
    },
    {
      question: "Can a manager delete a photo before its retention period ends?",
      answer: "Yes. Retention controls automatic cleanup; an authorized manager can still delete a photo when appropriate.",
    },
    {
      question: "What happens if I cancel Field Photos?",
      answer: "New Field Photo uploads stop. Existing Field Photos remain available read-only for download for 30 days, after which cancellation cleanup may remove them. Download any photos you need to keep before the 30-day grace period ends.",
    },
    {
      question: "What photo types and sizes can I upload?",
      answer: "Supported photo formats include the formats shown by the upload control. The current maximum file size is shown where you choose a photo.",
    },
  ];

  return (
    <Drawer
      anchor={isSmall ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: isSmall ? "100%" : 460,
          maxWidth: "100vw",
          maxHeight: isSmall ? "88vh" : "100vh",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <HelpOutlineIcon />
          <Typography variant="h5" sx={{ fontWeight: 950 }}>
            Field Photos guide
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Learn how Field Photos works, how photos are secured and retained, and how storage and billing are managed.
        </Typography>

        {sections.map((section) => (
          <Section key={section.title} {...section} />
        ))}

        <FrequentlyAskedQuestions items={frequentlyAskedQuestions} />

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" justifyContent="flex-end">
          <Button variant="outlined" onClick={onClose}>
            Close guide
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
