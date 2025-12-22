import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Divider,
  Drawer,
  Stack,
  Checkbox,
  FormControlLabel,
  Switch,
  IconButton,
  CircularProgress,
  Chip,
  Tooltip,
  Backdrop,
  Snackbar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useTheme } from "@mui/material/styles";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import { questionnaires as questionnaireApi, settingsApi } from "./utils/api";
import {
  toggleQuestionnaireSelection,
  toggleQuestionnaireRequired,
  reorderQuestionnaireAssignments,
} from "./utils/questionnaireAssignments";
import { PROFESSION_OPTIONS } from "./constants/professions";

// Profession list and template defaults
const PROFESSION_TEMPLATES = {
  recruiter: 
`Subject: Interview Invitation – {job_title} at {company_name}

Hello {candidate_name},

We are pleased to invite you to interview for the position of {job_title} at {company_name}. My name is {recruiter_name}, and I represent {sender_company_name}.

Interview Details:
- Position: {job_title}
- Location: {location}
- Company: {company_name}
- Contract Duration: {duration}
- Key Skills: {primary_skills}
- Required Skills: {mandatory_skills}
- Additional Skills: {secondary_skills}

{additional_message}

To select a convenient time, please use the link below to book your interview slot:
{booking_link}

If you have questions or require special accommodations, feel free to reply to this email.

Best regards,
{recruiter_name}
{custom_signature}`,

  teacher:
`Subject: Invitation to Discuss {student_name} – Parent-Teacher Meeting with {teacher_name}

Dear {parent_name},

I hope this message finds you well.

As {student_name}'s teacher, I would like to invite you to a parent-teacher meeting to review your child's recent progress, classroom engagement, and ways we can collaborate to support {student_name}'s academic growth.

Meeting Details:
- Teacher: {teacher_name}
- Student: {student_name}

Please use the following secure link to choose a meeting time that works best for you:
{booking_link}

If you have any specific topics or questions to address, kindly mention them in your booking.

Looking forward to our discussion.

Best regards,
{teacher_name}
Classroom Teacher`,

  fitness_coach:
`Subject: Schedule Your Next Fitness Coaching Session

Hello {client_name},

This is {coach_name}, your fitness coach. I would like to invite you to schedule your next training session.

Please select a suitable time using this link:
{booking_link}

If you have new fitness goals or concerns to discuss, let me know in your booking notes.

Looking forward to our session!

Best regards,
{coach_name}`,

  therapist:
`Subject: Book Your Next Therapy Session

Hello {client_name},

This is {therapist_name}. I hope you are well.

You can now schedule your upcoming therapy session at your convenience using the following secure link:
{booking_link}

If there are any specific topics you wish to discuss, please mention them in your booking notes.

Take care,
{therapist_name}`,

  doctor:
`Subject: Appointment Invitation with Dr. {doctor_name}

Dear {patient_name},

You are invited to book your next appointment with Dr. {doctor_name}. Please select your preferred time using the link below:
{booking_link}

If you have any specific concerns or require special assistance, feel free to indicate them when booking.

Best regards,
Clinic Staff`,

  photographer:
`Subject: Book Your Photo Session with {photographer_name}

Hi {client_name},

This is {photographer_name} from {studio_name}. I would be delighted to help capture your special moments!

Please use the following link to schedule your session:
{booking_link}

If you have particular preferences or event details, include them in your booking.

Looking forward to working with you!

Best,
{photographer_name}
{studio_name}`,

  consultant:
`Subject: Book Your Consulting Session

Hello {client_name},

You are invited to schedule a consulting session with {consultant_name}. I am eager to assist with your business needs.

Please select a time using the following link:
{booking_link}

If you have agenda topics or documents to share, please add them in the booking notes.

Best regards,
{consultant_name}`,

  lawyer:
`Subject: Schedule Your Legal Consultation

Dear {client_name},

This is {lawyer_name} from {law_firm_name}. I invite you to book a legal consultation at your convenience.

To reserve your appointment, please use this link:
{booking_link}

If there are specific legal matters you'd like to discuss, let me know in advance.

Looking forward to assisting you.

Kind regards,
{lawyer_name}
{law_firm_name}`,

  real_estate:
`Subject: Schedule Your Property Viewing or Consultation

Hello {client_name},

I'm {agent_name}, your real estate agent. I'm excited to help you with your property search or sale.

Please use the following link to book a property viewing or consultation at your convenience:
{booking_link}

Let me know your preferences or questions in your booking.

Best wishes,
{agent_name}`,

  salon:
`Subject: Book Your Next Appointment at {salon_name}

Dear {client_name},

This is {stylist_name} at {salon_name}. I invite you to schedule your next beauty appointment with us.

Reserve your preferred time using the link below:
{booking_link}

If you have a style or treatment in mind, let us know in your booking notes.

See you soon!

Best,
{stylist_name}
{salon_name}`,

  tax_advisor:
`Subject: Schedule Your Tax Consultation

Hello {client_name},

You are invited to book a tax consultation with {advisor_name}. I am here to assist you with your tax needs and answer any questions.

Book your preferred slot here:
{booking_link}

Feel free to share documents or specific topics in your booking.

Best regards,
{advisor_name}`,

  financial_advisor:
`Subject: Book Your Financial Advisory Session

Dear {client_name},

You are invited to schedule a financial advisory session with {advisor_name}. Let's discuss your goals and financial planning needs.

Book a suitable time using the link below:
{booking_link}

You may include questions or topics you'd like to cover in your booking.

Kind regards,
{advisor_name}`,

  tutor:
`Subject: Book Your Next Tutoring Session

Hello {student_name},

This is {tutor_name}. Please use the link below to book your next tutoring session.

{booking_link}

If there is a specific topic or area you want to focus on, let me know in your booking notes.

See you soon!
{tutor_name}`,

  event_planner:
`Subject: Let's Plan Your Event – Book a Meeting

Hi {client_name},

Thank you for considering our services for your upcoming event. I invite you to schedule a planning meeting with me, {planner_name}.

Please use this link to select a convenient time:
{booking_link}

Feel free to include any details or ideas in your booking.

Looking forward to creating a memorable event with you!

Best,
{planner_name}`,

  contractor:
`Subject: Schedule Your Consultation or Site Visit

Dear {client_name},

You are invited to book an on-site consultation or project meeting with {contractor_name}.

Please use the following link to choose a suitable time:
{booking_link}

Include any project details or requirements in your booking notes.

Best,
{contractor_name}`,

  coach_life:
`Subject: Schedule Your Life Coaching Session

Hello {client_name},

I’m {coach_name}, your life coach. I encourage you to book your next coaching session to continue your personal growth journey.

Use this link to select a time that works for you:
{booking_link}

Let me know if there are particular areas you want to focus on.

Looking forward to working with you!

Warm regards,
{coach_name}`,

  it_support:
`Subject: Book Your IT Support Session

Hi {client_name},

This is {support_tech_name}. You are invited to book an IT support session so I can help resolve your technical issues.

Schedule your appointment here:
{booking_link}

Briefly describe your issue in your booking notes to help us prepare.

Best,
{support_tech_name}`,

  repair_service:
`Subject: Schedule Your Repair Appointment

Hello {client_name},

Thank you for reaching out to our repair service. Please book your appointment with {technician_name} at a time that suits you.

Use the link below to choose your slot:
{booking_link}

If you have details about the repair needed, include them in your booking.

Thank you!
{technician_name}`,

  counselor:
`Subject: Book Your Counseling Session

Dear {client_name},

This is {counselor_name}. I invite you to schedule your next counseling session using the link below:

{booking_link}

If there’s anything specific you’d like to discuss, feel free to note it when booking.

Sincerely,
{counselor_name}`,

  notary:
`Subject: Schedule Your Notary Appointment

Hello {client_name},

This is {notary_name}. Please use the link below to book your notary appointment at a convenient time:

{booking_link}

Let me know if you need any special arrangements.

Best regards,
{notary_name}`,

  tattoo_piercing:
`Subject: Book Your Tattoo / Piercing Session at {studio_name}

Hi {client_name},

This is {artist_name} from {studio_name}. I’d love to help with your next tattoo or piercing. Please use the link below to choose a time that works for you:
{booking_link}

If you have design ideas, placement preferences, or references, include them in your booking notes.

Looking forward to working with you!

Best,
{artist_name}
{studio_name}`,

  cleaning:
`Subject: Book Your Cleaning with {company_name}

Dear {client_name},

Thank you for considering {company_name} for your cleaning needs. This is {cleaner_name}. Please use the link below to choose a convenient time for your service:
{booking_link}

If you have any special instructions (pets, parking, access codes, or areas to prioritize), include them in your booking notes.

We look forward to making your space shine.

Best regards,
{cleaner_name}
{company_name}`,

  // fallback
  custom:
`Hello,

You are invited to book a meeting. Please use the following link:
{booking_link}

Best regards,`
};

const GENERIC_TEMPLATE = `Subject: Book Your Next Appointment

Hello {client_name},

Please use the link below to choose a time that works for you:
{booking_link}

If you have notes or preferences, include them in your booking.

Best regards,
{sender_company_name}`;


const EnhancedInvitationForm = ({ token, embedded = false }) => {
  const theme = useTheme();

  // NEW: Profession state and dynamic template
  const [profession, setProfession] = useState("recruiter");

  const professionOptions = useMemo(() => {
    const base = [...PROFESSION_OPTIONS];
    const value = profession;
    if (value && !base.some((option) => option.value === value)) {
      base.push({ value, label: value });
    }
    return base;
  }, [profession]);

  const hasManualProfessionChange = useRef(false);
  const [template, setTemplate] = useState(PROFESSION_TEMPLATES["recruiter"]);
  const handleSnackbarClose = (_event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [lastInviteLink, setLastInviteLink] = useState("");
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState([]);
  const [loadingQuestionnaires, setLoadingQuestionnaires] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState("");
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState([]);
  const isCustomProfession = profession === "custom";


  // Updated formData with all profession fields (as you requested)
  const [formData, setFormData] = useState({
  // Common for all
  recruiterName: "",
  recruiterEmail: "",
  recruiterPhone: "",
  customSignature: "",
  additionalMessage: "",
  companyLogo: "",
  companyWebsite: "",
  companyAddress: "",
  // Recruiter-specific
  senderCompanyName: "",
  companyName: "",
  jobTitle: "",
  location: "",
  duration: "",
  primarySkills: "",
  mandatorySkills: "",
  secondarySkills: "",
  // Teacher/Parent
  teacherName: "",
  parentName: "",
  studentName: "",
  // Fitness coach, Life coach
  coachName: "",
  clientName: "",
  // Therapist/Counselor
  therapistName: "",
  counselorName: "",
  // Doctor/Medical
  doctorName: "",
  patientName: "",
  // Cleaning
  cleanerName: "",
  // Photographer
  photographerName: "",
  studioName: "",
  // Consultant/Advisor
  consultantName: "",
  advisorName: "",
  lawFirmName: "",
  lawyerName: "",
  // Real Estate
  agentName: "",
  // Salon/Beauty
  stylistName: "",
  salonName: "",
  // Tutor
  tutorName: "",
  // Event Planner
  plannerName: "",
  // Contractor/Trades
  contractorName: "",
  // IT Support
  supportTechName: "",
  // Repair Service
  technicianName: "",
  // Notary
  notaryName: "",
  // Candidate info
  candidateName: "",
  candidateEmail: ""
});

  const requiredFieldsByProfession = {
  recruiter: ["recruiterName", "recruiterEmail", "senderCompanyName", "jobTitle", "companyName", "candidateName", "candidateEmail"],
  teacher: ["teacherName", "parentName", "candidateName", "candidateEmail"],
  fitness_coach: ["coachName", "candidateName", "candidateEmail"],
  therapist: ["therapistName", "candidateName", "candidateEmail"],
  doctor: ["doctorName", "patientName", "candidateName", "candidateEmail"],
  photographer: ["photographerName", "studioName", "candidateName", "candidateEmail"],
  consultant: ["consultantName", "candidateName", "candidateEmail"],
  lawyer: ["lawyerName", "candidateName", "candidateEmail"],
  real_estate: ["agentName", "candidateName", "candidateEmail"],
  salon: ["stylistName", "salonName", "candidateName", "candidateEmail"],
  tax_advisor: ["advisorName", "candidateName", "candidateEmail"],
  financial_advisor: ["advisorName", "candidateName", "candidateEmail"],
  tutor: ["tutorName", "candidateName", "candidateEmail"],
  event_planner: ["plannerName", "candidateName", "candidateEmail"],
  contractor: ["contractorName", "candidateName", "candidateEmail"],
  coach_life: ["coachName", "candidateName", "candidateEmail"],
  it_support: ["supportTechName", "candidateName", "candidateEmail"],
  repair_service: ["technicianName", "candidateName", "candidateEmail"],
  counselor: ["counselorName", "candidateName", "candidateEmail"],
  notary: ["notaryName", "candidateName", "candidateEmail"],
  cleaning: ["cleanerName", "candidateName", "candidateEmail"],
  custom: ["recruiterName", "candidateName", "candidateEmail"],
};

  const toSnakeCase = (value) => value.replace(/([A-Z])/g, "_$1").toLowerCase();

  const INVITE_NAME_FIELDS = {
    recruiter: ['candidateName'],
    custom: ['candidateName', 'clientName'],
    teacher: ['parentName', 'studentName', 'clientName'],
    fitness_coach: ['clientName'],
    therapist: ['clientName'],
    doctor: ['patientName', 'clientName'],
    photographer: ['clientName'],
    consultant: ['clientName'],
    lawyer: ['clientName'],
    real_estate: ['clientName'],
    salon: ['clientName'],
    tax_advisor: ['clientName'],
    financial_advisor: ['clientName'],
    tutor: ['studentName', 'clientName'],
    event_planner: ['clientName'],
    contractor: ['clientName'],
    coach_life: ['clientName'],
    it_support: ['clientName'],
    repair_service: ['clientName'],
    counselor: ['clientName'],
    notary: ['clientName'],
    cleaning: ['clientName'],
  };

  const resolveInviteName = () => {
    const fields = INVITE_NAME_FIELDS[profession] || ['clientName', 'parentName', 'studentName', 'patientName', 'candidateName', 'recruiterName'];
    for (const field of fields) {
      const value = formData[field];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return '';
  };

  const buildTemplateVariables = () => {
    const variables = {};
    Object.keys(formData).forEach((key) => {
      const snakeKey = toSnakeCase(key);
      const fieldValue = formData[key];
      variables[snakeKey] = fieldValue === undefined || fieldValue === null ? "" : fieldValue;
    });
    variables.profession_key = profession;
    const professionOption = professionOptions.find((option) => option.value === profession);
    const templateName = (selectedTemplate?.name || "").trim();
    if (templateName) {
      variables.profession_label = templateName;
    } else if (professionOption) {
      variables.profession_label = professionOption.label;
    }
    const jobTitle = (formData.jobTitle || "").trim();
    if (jobTitle) {
      variables.job_title = jobTitle;
      variables.position = jobTitle;
    }
    const inviteNameValue = resolveInviteName();
    if (inviteNameValue) {
      if (!variables.candidate_name) {
        variables.candidate_name = inviteNameValue;
      }
      if (!variables.client_name) {
        variables.client_name = inviteNameValue;
      }
    }
    const candidateEmail = variables.candidate_email;
    const clientEmail = variables.client_email;
    if (candidateEmail && !clientEmail) {
      variables.client_email = candidateEmail;
    }
    if (clientEmail && !candidateEmail) {
      variables.candidate_email = clientEmail;
    }
    return variables;
  };

  const extractSubjectAndBody = (rawTemplate) => {
    if (!rawTemplate || typeof rawTemplate !== "string") {
      return { subject: "", body: "" };
    }
    const trimmed = rawTemplate.trim();
    const subjectMatch = trimmed.match(/^Subject:\s*(.+)$/im);
    if (!subjectMatch) {
      return { subject: "", body: trimmed };
    }
    const subjectLine = subjectMatch[0];
    const subject = subjectMatch[1].trim();
    const bodyStart = trimmed.indexOf(subjectLine) + subjectLine.length;
    const body = trimmed.slice(bodyStart).replace(/^[\r\n]+/, "");
    return { subject, body };
  };

  const buildTemplateFromFormTemplate = (formTemplate) => {
    if (!formTemplate) return "";
    const subject = (formTemplate.email_subject || "").trim();
    const body = (formTemplate.email_body || "").trim();
    if (!subject && !body) return "";
    if (!subject) return body;
    if (!body) return `Subject: ${subject}`;
    return `Subject: ${subject}\n\n${body}`;
  };

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarState, setSnackbarState] = useState({ open: false, severity: "success", message: "" });
  // Candidate info states moved into formData.candidateName etc.
  // So no separate state needed here.

  const [guideOpen, setGuideOpen] = useState(false);

  // On load: load defaults and templates
  useEffect(() => {
    let active = true;

    const initialiseInvitationForm = async () => {
      let nextProfession = "recruiter";

      try {
        const data = await settingsApi.get();
        if (data && typeof data === "object") {
          const normalise = (value) => (typeof value === "string" ? value.trim() : value);
          const payload = (data && typeof data === "object") ? data : {};
          const companyDefault = normalise(payload.default_profession) || "";
          const effective = normalise(payload.effective_profession) || "";
          const personal = normalise(payload.profession) || "";
          const resolved = companyDefault || effective || personal;
          if (resolved) {
            nextProfession = resolved;
          } else {
            nextProfession = "custom";
          }
        }
      } catch (err) {
        console.warn("Default profession lookup failed", err);
      }

      let initialTemplate = PROFESSION_TEMPLATES[nextProfession] || GENERIC_TEMPLATE;
      try {
        const storedTemplate = localStorage.getItem(`invitationTemplate_${nextProfession}`);
        if (storedTemplate) {
          initialTemplate = storedTemplate;
        }
      } catch (err) {
        console.warn("Unable to read saved template", err);
      }

      let recruiterDefaults = null;
      try {
        recruiterDefaults = localStorage.getItem("recruiterDefaults");
      } catch (err) {
        console.warn("Unable to read recruiter defaults", err);
      }

      if (!active || hasManualProfessionChange.current) {
        return;
      }

      hasManualProfessionChange.current = false;
      setProfession(nextProfession);
      setTemplate(initialTemplate);

      if (recruiterDefaults) {
        try {
          setFormData((prev) => ({ ...prev, ...JSON.parse(recruiterDefaults) }));
        } catch (err) {
          console.warn("Unable to parse recruiter defaults", err);
        }
      }

    };

    initialiseInvitationForm();

    return () => {
      active = false;
    };
  }, []);


  // When profession changes, update template
  useEffect(() => {
    if (!profession) {
      setTemplate("");
      return;
    }

    const savedTemplate = localStorage.getItem(`invitationTemplate_${profession}`);
    if (savedTemplate) {
      setTemplate(savedTemplate);
    } else {
      setTemplate(PROFESSION_TEMPLATES[profession] || GENERIC_TEMPLATE);
    }
  }, [profession]);

  // Handle input changes for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfessionSelect = (value) => {
    hasManualProfessionChange.current = true;
    setProfession(value);
  };

  // Save recruiter info defaults (and other common fields)
  const handleSaveDefaults = () => {
    const recruiterDefaults = (({
      recruiterName,
      recruiterEmail,
      recruiterPhone,
      senderCompanyName,
      companyName,
      companyWebsite,
      companyAddress,
      customSignature,
      companyLogo,
      additionalMessage,
      parentName,
      studentName,
      teacherName,
      clientName,
      coachName,
      therapistName,
      patientName,
      photographerName,
      studioName,
      cleanerName,
    }) => ({
      recruiterName,
      recruiterEmail,
      recruiterPhone,
      senderCompanyName,
      companyName,
      companyWebsite,
      companyAddress,
      customSignature,
      companyLogo,
      additionalMessage,
      parentName,
      studentName,
      teacherName,
      clientName,
      coachName,
      therapistName,
      patientName,
      photographerName,
      studioName,
      cleanerName,
    }))(formData);
    localStorage.setItem("recruiterDefaults", JSON.stringify(recruiterDefaults));
    setMessage("Defaults saved successfully.");
  };

  // Save template for this profession
  const handleSaveTemplate = () => {
    localStorage.setItem(`invitationTemplate_${profession}`, template);
    setMessage("Template saved for " + (professionOptions.find((o) => o.value === profession)?.label || profession));
  };

  // Preview template with sample data
const handlePreview = () => {
  // Build previewVars with all fields from formData as snake_case
  const previewVars = {};
  Object.keys(formData).forEach((key) => {
    previewVars[toSnakeCase(key)] = formData[key] || "";
  });
  previewVars.booking_link = "https://booking-link.example.com"; // Always present

  // Replace variables in template
  let html = template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, v) => previewVars[v] || "");
  html = html.replace(/\n/g, "<br />");
  const w = window.open();
  w.document.write(`<div style="font-family:sans-serif;padding:24px;font-size:16px">${html}</div>`);
  w.document.close();
};

  // Variables available for insertion per profession
  const disableTemplateEditor = !isCustomProfession && availableTemplates.length > 0;

  const VARIABLE_OPTIONS = {
    recruiter: [
      "candidate_name", "recruiter_name", "sender_company_name", "job_title",
      "location", "company_name", "duration", "primary_skills", "mandatory_skills",
      "secondary_skills", "additional_message", "custom_signature", "booking_link"
    ],
    teacher: ["parent_name", "teacher_name", "student_name", "booking_link"],
    fitness_coach: ["client_name", "coach_name", "booking_link"],
    therapist: ["client_name", "therapist_name", "booking_link"],
    doctor: ["patient_name", "doctor_name", "booking_link"],
    photographer: ["client_name", "photographer_name", "studio_name", "booking_link"],
    cleaning: ["client_name", "cleaner_name", "company_name", "booking_link", "additional_message", "custom_signature"],
    custom: ["candidate_name", "booking_link"],
  };
  const professionVariables = VARIABLE_OPTIONS[profession] || ['candidate_name', 'booking_link'];

  const showCandidateNameField = true; // always collect a name for templates
  const contactInfoTitle = 'Contact Info';
  const emailLabel = 'Client Email';

  // Fetch profile (kept from your original)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data;
        setFormData((prev) => ({
          ...prev,
          recruiterName: user.full_name || user.first_name || "",
          recruiterEmail: user.email || "",
          recruiterPhone: user.phone || "",
          senderCompanyName: user.companyName || "",
          companyName: user.targetCompanyName || "",
          companyWebsite: user.companyWebsite || "",
          companyAddress: user.companyAddress || "",
          companyLogo: user.companyLogo || ""
        }));
      } catch (e) {
        // ignore error
      }
    };
    fetchProfile();

    const saved = localStorage.getItem("recruiterDefaults");
    if (saved) {
      setFormData((prev) => ({ ...prev, ...JSON.parse(saved) }));
    }
  }, [token]);

  const fetchTemplatesForProfession = useCallback(async () => {
    if (!token || !profession || profession === "custom") {
      setAvailableTemplates([]);
      setSelectedTemplateId("");
      setTemplatesError("");
      setTemplatesLoading(false);
      return;
    }
    setTemplatesLoading(true);
    setTemplatesError("");
    try {
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const params = new URLSearchParams({
        profession: profession,
      });
      const response = await axios.get(`${API_URL}/api/form-templates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(response.data) ? response.data : [];
      const eligible = list.filter(
        (tpl) => ["active", "published"].includes((tpl.status || "").toLowerCase())
      );
      setAvailableTemplates(eligible);
      if (eligible.length > 0) {
        setSelectedTemplateId((prev) =>
          prev && eligible.some((item) => item.id === prev) ? prev : eligible[0].id
        );
      } else {
        setSelectedTemplateId("");
      }
    } catch (err) {
      setAvailableTemplates([]);
      setSelectedTemplateId("");
      const detail =
        err.response?.data?.error ||
        "Unable to load templates for this profession.";
      setTemplatesError(detail);
    } finally {
      setTemplatesLoading(false);
    }
  }, [token, profession]);

  useEffect(() => {
    fetchTemplatesForProfession();
  }, [fetchTemplatesForProfession]);

  useEffect(() => {
    const onTemplatesUpdated = () => fetchTemplatesForProfession();
    window.addEventListener("candidate-templates-updated", onTemplatesUpdated);
    const onStorage = (event) => {
      if (event.key === "candidate_form_templates_updated") {
        fetchTemplatesForProfession();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("candidate-templates-updated", onTemplatesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [fetchTemplatesForProfession]);

  useEffect(() => {
    if (!selectedTemplateId || profession === "custom") return;
    let active = true;
    const loadSelectedTemplate = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const res = await axios.get(`${API_URL}/api/form-templates/${selectedTemplateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!active) return;
        const full = res?.data || null;
        setSelectedTemplate(full);
        const nextTemplate = buildTemplateFromFormTemplate(full);
        if (nextTemplate) {
          setTemplate(nextTemplate);
        }
      } catch {
        if (!active) return;
        setSelectedTemplate(null);
      }
    };
    loadSelectedTemplate();
    return () => {
      active = false;
    };
  }, [selectedTemplateId, profession, token]);

  useEffect(() => {
    if (profession !== "doctor") {
      setAvailableQuestionnaires([]);
      setSelectedQuestionnaires([]);
      setQuestionnaireError("");
      setLoadingQuestionnaires(false);
      return;
    }

    let cancelled = false;

    const loadQuestionnaires = async () => {
      setLoadingQuestionnaires(true);
      setQuestionnaireError("");
      try {
        const response = await questionnaireApi.available(
          { form_kind: "doctor" },
          token ? { headers: { Authorization: `Bearer ${token}` } } : {}
        );
        if (cancelled) {
          return;
        }
        const items = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response)
          ? response
          : [];
        setAvailableQuestionnaires(items);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const detail =
          err?.response?.data?.error || err?.message || "Failed to load questionnaires.";
        setQuestionnaireError(detail);
        setAvailableQuestionnaires([]);
      } finally {
        if (!cancelled) {
          setLoadingQuestionnaires(false);
        }
      }
    };

    loadQuestionnaires();

    return () => {
      cancelled = true;
    };
  }, [token, profession]);

  const handleToggleQuestionnaire = (templateId) => {
    setSelectedQuestionnaires((prev) => toggleQuestionnaireSelection(prev, templateId));
  };

  const handleToggleQuestionnaireRequired = (templateId) => {
    setSelectedQuestionnaires((prev) => toggleQuestionnaireRequired(prev, templateId));
  };

  const handleReorderQuestionnaire = (templateId, direction) => {
    setSelectedQuestionnaires((prev) =>
      reorderQuestionnaireAssignments(prev, templateId, direction)
    );
  };

  // Send invitation logic
  const handleSendInvitation = async () => {
    const required = (requiredFieldsByProfession[profession] || []).filter((field) => {
      if (field === 'candidateName' && !showCandidateNameField) {
        return false;
      }
      return true;
    });
    const missing = required.filter((field) => !formData[field]);
    if (missing.length) {
      setError("Please fill all required fields: " + missing.join(", "));
      return;
    }

    if (!formData.candidateEmail) {
      setError(`${emailLabel} is required to send an invitation.`);
      return;
    }

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const useCandidateFormsFlow = !isCustomProfession && selectedTemplateId !== "";

    if (!isCustomProfession && selectedTemplateId === "") {
      setError("No active template is available for this profession. Please create one in the Candidate Forms tab or switch to Custom.");
      return;
    }

    try {
      setError("");
      setMessage("");
      setLastInviteLink("");
      setIsSubmitting(true);
      setSnackbarState((prev) => ({ ...prev, open: false }));

      const inviteNameValue = resolveInviteName();

      if (useCandidateFormsFlow) {
        const numericTemplateId = Number(selectedTemplateId);
        const payload = {
          template_id: Number.isNaN(numericTemplateId) ? selectedTemplateId : numericTemplateId,
          profession_key: profession,
          invite_email: formData.candidateEmail,
        };

        payload.invite_name = inviteNameValue || 'Candidate';

        const selectedTemplateForSend = selectedTemplate;
        const selectedStatus = (selectedTemplateForSend?.status || "").toLowerCase();
        if (selectedTemplateForSend && !["active", "published"].includes(selectedStatus)) {
          setError("Template must be active");
          setSnackbarState({ open: true, severity: "error", message: "Template must be active" });
          return;
        }
        const { subject: parsedSubject, body: parsedBody } = extractSubjectAndBody(template);
        const overrideSubject = (selectedTemplateForSend?.email_subject || "").trim() || parsedSubject || "";
        const overrideBody = (selectedTemplateForSend?.email_body || "").trim() || parsedBody || "";
        const templateVariables = buildTemplateVariables();
        if (overrideSubject) {
          payload.email_subject = overrideSubject;
        }
        if (overrideBody) {
          payload.email_body = overrideBody;
        }
        if (Object.keys(templateVariables).length > 0) {
          payload.template_variables = templateVariables;
        }

        if (formData.candidatePhone) {
          payload.invite_phone = formData.candidatePhone;
        }

        if (profession === "doctor" && selectedQuestionnaires.length) {
          payload.questionnaires = selectedQuestionnaires.map((item, index) => ({
            template_id: item.template_id,
            required: item.required !== false,
            sort_order: index,
          }));
        }

        const response = await axios.post(
          `${API_URL}/api/candidate-forms/invite`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { intake_url: intakeUrl, email_subject: subject } = response.data || {};
        if (Array.isArray(response.data?.questionnaires)) {
          const normalized = response.data.questionnaires
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((item) => ({
              template_id: item.template_id,
              required: item.required !== false,
            }));
          setSelectedQuestionnaires(normalized);
        }
        const successMessage = subject ? `Invitation sent! Preview subject: ${subject}` : "Invitation sent!";
        setMessage(successMessage);
        setSnackbarState({ open: true, severity: "success", message: successMessage });
        if (intakeUrl) {
          setLastInviteLink(intakeUrl);
        }
        setFormData((prev) => ({ ...prev, candidateName: "", candidateEmail: "" }));
        return;
      }

      const response = await axios.post(
        `${API_URL}/send-invitation`,
        {
          candidate_name: formData.candidateName || formData.clientName,
          candidate_email: formData.candidateEmail,
          invite_name: inviteNameValue || formData.candidateName || formData.clientName || 'Candidate',
          ...formData,
          template: template,
          profession: profession,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const successMessage = response.data?.message || "Invitation sent!";
      setMessage(successMessage);
      setSnackbarState({ open: true, severity: "success", message: successMessage });
      const bookingLink = response.data?.booking_link;
      const intakeUrl = response.data?.intake_url;
      if (bookingLink) {
        setLastInviteLink(bookingLink);
      } else if (intakeUrl) {
        setLastInviteLink(intakeUrl);
      }
      setFormData((prev) => ({ ...prev, candidateName: "", candidateEmail: "" }));
    } catch (err) {
      const detail = err.response?.data?.error || err.message || "Failed to send invitation.";
      setError(detail);
      setSnackbarState({ open: true, severity: "error", message: detail });
    } finally {
      setIsSubmitting(false);
    }
  };



  // --- Profession-aware Employee/Professional Info Section ---
  const renderProfessionalInfo = () => {
    switch (profession) {
      case "recruiter":
        return (
          <>
            <Typography variant="h6" mt={2}>
              Employee Info
            </Typography>
            <TextField
              name="recruiterName"
              label="Your Name"
              fullWidth
              margin="dense"
              value={formData.recruiterName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
            <TextField
              name="recruiterPhone"
              label="Phone Number"
              fullWidth
              margin="dense"
              value={formData.recruiterPhone}
              onChange={handleChange}
            />
            <TextField
              name="senderCompanyName"
              label="Your Company Name"
              fullWidth
              margin="dense"
              value={formData.senderCompanyName}
              onChange={handleChange}
            />
            <TextField
              name="companyName"
              label="Target Company Name"
              fullWidth
              margin="dense"
              value={formData.companyName}
              onChange={handleChange}
            />
            <TextField
              name="companyWebsite"
              label="Your Company Website"
              fullWidth
              margin="dense"
              value={formData.companyWebsite}
              onChange={handleChange}
            />
            <TextField
              name="companyAddress"
              label="Your Company Address"
              fullWidth
              margin="dense"
              value={formData.companyAddress}
              onChange={handleChange}
            />
            <TextField
              name="companyLogo"
              label="Company Logo URL"
              fullWidth
              margin="dense"
              value={formData.companyLogo}
              onChange={handleChange}
            />
          </>
        );
      case "teacher":
        return (
          <>
            <Typography variant="h6" mt={2}>Teacher Info</Typography>
            <TextField
              name="teacherName"
              label="Teacher Name"
              fullWidth
              margin="dense"
              value={formData.teacherName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "fitness_coach":
        return (
          <>
            <Typography variant="h6" mt={2}>Coach Info</Typography>
            <TextField
              name="coachName"
              label="Coach Name"
              fullWidth
              margin="dense"
              value={formData.coachName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "therapist":
        return (
          <>
            <Typography variant="h6" mt={2}>Therapist Info</Typography>
            <TextField
              name="therapistName"
              label="Therapist Name"
              fullWidth
              margin="dense"
              value={formData.therapistName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "doctor":
        return (
          <>
            <Typography variant="h6" mt={2}>Doctor Info</Typography>
            <TextField
              name="doctorName"
              label="Doctor Name"
              fullWidth
              margin="dense"
              value={formData.doctorName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "photographer":
        return (
          <>
            <Typography variant="h6" mt={2}>Photographer Info</Typography>
            <TextField
              name="photographerName"
              label="Photographer Name"
              fullWidth
              margin="dense"
              value={formData.photographerName}
              onChange={handleChange}
            />
            <TextField
              name="studioName"
              label="Studio Name"
              fullWidth
              margin="dense"
              value={formData.studioName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "consultant":
        return (
          <>
            <Typography variant="h6" mt={2}>Consultant Info</Typography>
            <TextField
              name="consultantName"
              label="Consultant Name"
              fullWidth
              margin="dense"
              value={formData.consultantName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "lawyer":
        return (
          <>
            <Typography variant="h6" mt={2}>Lawyer Info</Typography>
            <TextField
              name="lawyerName"
              label="Lawyer Name"
              fullWidth
              margin="dense"
              value={formData.lawyerName}
              onChange={handleChange}
            />
            <TextField
              name="lawFirmName"
              label="Law Firm Name"
              fullWidth
              margin="dense"
              value={formData.lawFirmName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "real_estate":
        return (
          <>
            <Typography variant="h6" mt={2}>Agent Info</Typography>
            <TextField
              name="agentName"
              label="Agent Name"
              fullWidth
              margin="dense"
              value={formData.agentName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "salon":
        return (
          <>
            <Typography variant="h6" mt={2}>Stylist Info</Typography>
            <TextField
              name="stylistName"
              label="Stylist Name"
              fullWidth
              margin="dense"
              value={formData.stylistName}
              onChange={handleChange}
            />
            <TextField
              name="salonName"
              label="Salon Name"
              fullWidth
              margin="dense"
              value={formData.salonName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "tax_advisor":
      case "financial_advisor":
        return (
          <>
            <Typography variant="h6" mt={2}>Advisor Info</Typography>
            <TextField
              name="advisorName"
              label="Advisor Name"
              fullWidth
              margin="dense"
              value={formData.advisorName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "tutor":
        return (
          <>
            <Typography variant="h6" mt={2}>Tutor Info</Typography>
            <TextField
              name="tutorName"
              label="Tutor Name"
              fullWidth
              margin="dense"
              value={formData.tutorName}
              onChange={handleChange}
            />
            <TextField
              name="studentName"
              label="Student Name"
              fullWidth
              margin="dense"
              value={formData.studentName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "event_planner":
        return (
          <>
            <Typography variant="h6" mt={2}>Planner Info</Typography>
            <TextField
              name="plannerName"
              label="Planner Name"
              fullWidth
              margin="dense"
              value={formData.plannerName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "contractor":
        return (
          <>
            <Typography variant="h6" mt={2}>Contractor Info</Typography>
            <TextField
              name="contractorName"
              label="Contractor Name"
              fullWidth
              margin="dense"
              value={formData.contractorName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "coach_life":
        return (
          <>
            <Typography variant="h6" mt={2}>Coach Info</Typography>
            <TextField
              name="coachName"
              label="Coach Name"
              fullWidth
              margin="dense"
              value={formData.coachName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "it_support":
        return (
          <>
            <Typography variant="h6" mt={2}>Support Tech Info</Typography>
            <TextField
              name="supportTechName"
              label="Support Tech Name"
              fullWidth
              margin="dense"
              value={formData.supportTechName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "repair_service":
        return (
          <>
            <Typography variant="h6" mt={2}>Technician Info</Typography>
            <TextField
              name="technicianName"
              label="Technician Name"
              fullWidth
              margin="dense"
              value={formData.technicianName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "counselor":
        return (
          <>
            <Typography variant="h6" mt={2}>Counselor Info</Typography>
            <TextField
              name="counselorName"
              label="Counselor Name"
              fullWidth
              margin="dense"
              value={formData.counselorName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "notary":
        return (
          <>
            <Typography variant="h6" mt={2}>Notary Info</Typography>
            <TextField
              name="notaryName"
              label="Notary Name"
              fullWidth
              margin="dense"
              value={formData.notaryName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      case "cleaning":
        return (
          <>
            <Typography variant="h6" mt={2}>Cleaning Service Info</Typography>
            <TextField
              name="cleanerName"
              label="Cleaner Name"
              fullWidth
              margin="dense"
              value={formData.cleanerName}
              onChange={handleChange}
            />
            <TextField
              name="companyName"
              label="Company Name"
              fullWidth
              margin="dense"
              value={formData.companyName}
              onChange={handleChange}
            />
          </>
        );
      case "custom":
        return (
          <>
            <Typography variant="h6" mt={2}>Your Info</Typography>
            <TextField
              name="recruiterName"
              label="Your Name"
              fullWidth
              margin="dense"
              value={formData.recruiterName}
              onChange={handleChange}
            />
            <TextField
              name="recruiterEmail"
              label="Your Email"
              fullWidth
              margin="dense"
              value={formData.recruiterEmail}
              onChange={handleChange}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Main content JSX
  const content = (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="outlined" onClick={() => setGuideOpen(true)}>
          Help / Examples
        </Button>
      </Box>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {lastInviteLink && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button size="small" onClick={() => navigator.clipboard.writeText(lastInviteLink)}>
              Copy Link
            </Button>
          }
        >
          Candidate link: {lastInviteLink}
        </Alert>
      )}

      {/* Profession selection */}
<TextField
  select
  label="Profession / Use Case"
  value={profession}
  onChange={(e) => handleProfessionSelect(e.target.value)}
  fullWidth
  sx={{ mb: 2 }}
>
  {professionOptions.map((option) => (
    <MenuItem key={option.value} value={option.value}>
      {option.label}
    </MenuItem>
  ))}
</TextField>

{!isCustomProfession && (
  <Box sx={{ width: '100%', mb: 2 }}>
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
      <Typography variant="caption" color="text.secondary">
        Candidate Form Template
      </Typography>
      <Tooltip
        title="This controls the intake form fields and questionnaires shown after the candidate clicks the invite link. It does not change the email content unless you choose to override it."
      >
        <IconButton size="small">
          <InfoOutlinedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Stack>
    <TextField
      select
      fullWidth
      label={templatesLoading ? 'Loading templates' : 'Candidate Form Template'}
      value={selectedTemplateId || ''}
      onChange={(e) => {
        const value = Number(e.target.value);
        setSelectedTemplateId(Number.isNaN(value) ? null : value);
      }}
      disabled={templatesLoading || availableTemplates.length === 0}
    >
      {availableTemplates.map((templateOption) => (
        <MenuItem key={templateOption.id} value={templateOption.id}>
          {templateOption.name}
          {templateOption.version ? ` (v${templateOption.version})` : ''}
        </MenuItem>
      ))}
    </TextField>
    {templatesError && (
      <Alert severity="warning" sx={{ mt: 1 }}>
        {templatesError}
      </Alert>
    )}
    {!templatesLoading && !templatesError && availableTemplates.length === 0 && profession !== "custom" && (
      <Alert severity="info" sx={{ mt: 1 }}>
        No saved candidate forms for this profession yet. You can still edit and send this invitation, or add a questionnaire in the Candidate Forms tab.
      </Alert>
    )}
  </Box>
)}


      {/* Variable insertion */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption">Insert variable:</Typography>
        {professionVariables.map(v => (
          <Button
            key={v}
            size="small"
            onClick={() => setTemplate(t => t + `{${v}}`)}
            sx={{ mr: 1, mb: 1, fontSize: "0.85em" }}
            variant="outlined"
          >
            {v}
          </Button>
        ))}
      </Box>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Invitation Email Body
        </Typography>
        <Tooltip
          title="This is the email your candidate receives. You can save a custom version per profession using the Save Defaults button."
        >
          <IconButton size="small">
            <InfoOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      </Stack>
      <TextField
        label="Invitation Template"
        multiline
        minRows={6}
        value={template}
        onChange={e => setTemplate(e.target.value)}
        fullWidth
        sx={{ mb: 2 }}
      />

      {/* Profession-aware Employee/Professional Info */}
      {renderProfessionalInfo()}

      {/* Job Info only for recruiter */}
      {profession === "recruiter" && (
        <>
          <Typography variant="h6" mt={3}>Job Info</Typography>
          <TextField
            name="jobTitle"
            label="Job Title"
            fullWidth
            margin="dense"
            value={formData.jobTitle}
            onChange={handleChange}
          />
          <TextField
            name="location"
            label="Location"
            fullWidth
            margin="dense"
            value={formData.location}
            onChange={handleChange}
          />
          <TextField
            name="duration"
            label="Contract Duration"
            fullWidth
            margin="dense"
            value={formData.duration}
            onChange={handleChange}
          />
          <TextField
            name="primarySkills"
            label="Primary Skills"
            multiline
            rows={2}
            fullWidth
            margin="dense"
            value={formData.primarySkills}
            onChange={handleChange}
          />
          <TextField
            name="mandatorySkills"
            label="Mandatory Skills"
            multiline
            rows={2}
            fullWidth
            margin="dense"
            value={formData.mandatorySkills}
            onChange={handleChange}
          />
          <TextField
            name="secondarySkills"
            label="Secondary Skills"
            multiline
            rows={2}
            fullWidth
            margin="dense"
            value={formData.secondarySkills}
            onChange={handleChange}
          />
          <TextField
            name="additionalMessage"
            label="Additional Message (optional)"
            multiline
            rows={2}
            fullWidth
            margin="dense"
            value={formData.additionalMessage}
            onChange={handleChange}
          />
          <TextField
            name="customSignature"
            label="Custom Signature"
            multiline
            rows={6}
            fullWidth
            margin="dense"
            value={formData.customSignature}
            onChange={handleChange}
          />
        </>
      )}

      {/* Additional profession-specific extra fields (like teacher, fitness coach, therapist, etc.) */}
      {profession === "teacher" && (
        <>
          <Typography variant="h6" mt={3}>Teacher/Parent Meeting Info</Typography>
          <TextField
            name="parentName"
            label="Parent Name"
            fullWidth
            margin="dense"
            value={formData.parentName}
            onChange={handleChange}
          />
          <TextField
            name="studentName"
            label="Student Name"
            fullWidth
            margin="dense"
            value={formData.studentName}
            onChange={handleChange}
          />
        </>
      )}
      {profession === "fitness_coach" && (
        <>
          <Typography variant="h6" mt={3}>Coach/Client Info</Typography>
          <TextField
            name="clientName"
            label="Client Name"
            fullWidth
            margin="dense"
            value={formData.clientName}
            onChange={handleChange}
          />
        </>
      )}
      {profession === "therapist" && (
        <>
          <Typography variant="h6" mt={3}>Therapy Info</Typography>
          <TextField
            name="clientName"
            label="Client Name"
            fullWidth
            margin="dense"
            value={formData.clientName}
            onChange={handleChange}
          />
        </>
      )}
      {profession === "doctor" && (
        <>
          <Typography variant="h6" mt={3}>Patient/Doctor Info</Typography>
          <TextField
            name="patientName"
            label="Patient Name"
            fullWidth
            margin="dense"
            value={formData.patientName}
            onChange={handleChange}
          />
        </>
      )}
      {profession === "photographer" && (
        <>
          <Typography variant="h6" mt={3}>Photography Info</Typography>
          <TextField
            name="clientName"
            label="Client Name"
            fullWidth
            margin="dense"
            value={formData.clientName}
            onChange={handleChange}
          />
        </>
      )}

      {/* Candidate info */}
      <Typography variant="h6" mt={3}>{contactInfoTitle}</Typography>
      {showCandidateNameField && (
        <TextField
          name="candidateName"
          label="Client / Candidate Name"
          fullWidth
          margin="dense"
          value={formData.candidateName}
          onChange={(e) => {
            const val = e.target.value;
            setFormData((prev) => ({ ...prev, candidateName: val, clientName: val }));
          }}
        />
      )}
      <TextField
        name="candidateEmail"
        label={emailLabel}
        fullWidth
        margin="dense"
        value={formData.candidateEmail}
        onChange={handleChange}
      />

      {profession === "doctor" && (
        <Paper sx={{ mt: 3, p: { xs: 2, md: 3 }, borderRadius: 3 }} elevation={0}>
          <Stack spacing={2}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Attach Questionnaires
              </Typography>
              <Button component={RouterLink} to="/recruiter/questionnaires" size="small">
                Open Builder
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Choose which published questionnaires candidates must complete after accepting this invite.
            </Typography>
            {questionnaireError && <Alert severity="warning">{questionnaireError}</Alert>}
            {loadingQuestionnaires ? (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={18} />
                <Typography variant="body2" color="text.secondary">
                  Loading questionnaires...
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {availableQuestionnaires.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No published questionnaires found. Create one in the builder to attach it here.
                  </Typography>
                ) : (
                  availableQuestionnaires.map((template) => {
                    const index = selectedQuestionnaires.findIndex(
                      (item) => item.template_id === template.id
                    );
                    const checked = index !== -1;
                    return (
                      <Box
                        key={template.id}
                        sx={{
                          border: "1px solid",
                          borderColor: checked ? "primary.light" : "divider",
                          borderRadius: 2,
                          p: 1.5,
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          spacing={1.5}
                          alignItems={{ md: "center" }}
                          justifyContent="space-between"
                        >
                          <Box display="flex" alignItems="flex-start" gap={1.5}>
                            <Checkbox
                              checked={checked}
                              onChange={() => handleToggleQuestionnaire(template.id)}
                              size="small"
                            />
                            <Box>
                              <Typography variant="subtitle1">
                                {template.name || `Template #${template.id}`}
                              </Typography>
                              {template.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {template.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {checked && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={selectedQuestionnaires[index].required !== false}
                                    onChange={() => handleToggleQuestionnaireRequired(template.id)}
                                    size="small"
                                  />
                                }
                                label="Required"
                              />
                              <Tooltip title="Move up">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReorderQuestionnaire(template.id, "up")}
                                    disabled={index === 0}
                                  >
                                    <KeyboardArrowUpIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Move down">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleReorderQuestionnaire(template.id, "down")}
                                    disabled={index === selectedQuestionnaires.length - 1}
                                  >
                                    <KeyboardArrowDownIcon fontSize="small" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} useFlexGap flexWrap="wrap">
                          {template.form_kind && <Chip label={template.form_kind} size="small" />}
                          {template.status && (
                            <Chip
                              label={template.status}
                              size="small"
                              color={template.status === "published" ? "success" : "default"}
                            />
                          )}
                        </Stack>
                      </Box>
                    );
                  })
                )}
              </Stack>
            )}
          </Stack>
        </Paper>
      )}

      {/* Buttons */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={handleSaveDefaults}>
          Save Defaults
        </Button>
        <Button variant="outlined" onClick={handleSaveTemplate} disabled={disableTemplateEditor}>
          Save Template
        </Button>
        <Button variant="contained" onClick={handlePreview} disabled={disableTemplateEditor}>
          Preview Template
        </Button>
        <Button variant="contained" color="primary" onClick={handleSendInvitation} disabled={isSubmitting} endIcon={isSubmitting ? <CircularProgress size={16} /> : null}>
          Send Invitation
        </Button>
      </Box>

      {/* Help Guide Drawer */}
      {/* Help Guide Drawer */}
<Drawer anchor="right" open={guideOpen} onClose={() => setGuideOpen(false)}>
  <Box sx={{ width: 600, maxWidth: '100%', p: 3 }}>
    <Typography variant="h5" gutterBottom>
      Invitation Guide
    </Typography>
    <Typography variant="body1" gutterBottom>
      Follow these quick steps to send a polished invitation without missing critical details.
    </Typography>

    <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
      Step-by-step
    </Typography>
    <Box component="ol" sx={{ pl: 3, mt: 1, '& li': { mb: 1 } }}>
      <li>
        <Typography variant="body2" component="span">
          <strong>Select a profession.</strong> We pre-select your company default. Switching professions updates the required fields automatically.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          <strong>Complete the highlighted fields.</strong> Only the inputs shown on the form are required for that profession. If something is missing we call it out before you send.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          <strong>Attach a candidate form (optional).</strong> Pick an active template if you want the candidate to fill out questionnaires. You can create new ones in the Candidate Forms tab.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          <strong>Tailor the message.</strong> Edit the invitation text and use the <em>Insert variable</em> buttons to drop in placeholders like <code>{'{candidate_name}'}</code> or <code>{'{booking_link}'}</code>. They fill automatically when the email is sent.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          <strong>Preview and send.</strong> Use Preview to review the message, then Send Invitation to deliver the email and generate the booking link.
        </Typography>
      </li>
    </Box>

    <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
      Helpful reminders
    </Typography>
    <Box component="ul" sx={{ pl: 3, mt: 1, '& li': { mb: 1 } }}>
      <li>
        <Typography variant="body2" component="span">
          Required fields adjust per profession. If you see a warning, scroll up to complete the highlighted section.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          Save Defaults stores your contact details locally so the form is pre-filled next time.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          Candidate Form Templates live under the Candidate Forms tab. Publish at least one template per profession if you want to collect questionnaires automatically.
        </Typography>
      </li>
      <li>
        <Typography variant="body2" component="span">
          Need a reminder email? Use the Send Reminder panel on this page once the invite has gone out.
        </Typography>
      </li>
    </Box>

    <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
      Quick example
    </Typography>
    <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 14 }}>
      Subject: Interview Invitation - {'{job_title}'}<br />
      Hello {'{candidate_name}'},<br />
      This is {'{recruiter_name}'} from {'{sender_company_name}'}.<br />
      Please book a time that works for you: {'{booking_link}'}<br />
      We look forward to speaking with you.<br />
    </Box>

    <Typography variant="subtitle1" sx={{ mt: 3 }} gutterBottom>
      Need help?
    </Typography>
    <Typography variant="body2" gutterBottom>
      Questions or new profession requests? Reach out to support and we will add it to the library.
    </Typography>
    <Button onClick={() => setGuideOpen(false)} variant="contained" color="primary" sx={{ mt: 2 }}>
      Close Guide
    </Button>
  </Box>
</Drawer>

    </>
  );

  const feedbackOverlays = (
    <>
      <Backdrop open={isSubmitting} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 2 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={6000}
        open={snackbarState.open}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarState.severity} sx={{ width: "100%" }}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </>
  );

  if (embedded) {
    return (
      <>
        {feedbackOverlays}
        <Paper sx={{ p: 3, mb: 4 }} elevation={4}>{content}</Paper>
      </>
    );
  }

  return (
    <>
      {feedbackOverlays}
      <Paper sx={{ p: 3, mb: 4 }} elevation={4}>
      <Accordion defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" sx={{ color: theme.palette.primary.main }}>
            📄 Custom Invitation / Meeting
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{content}</AccordionDetails>
      </Accordion>
    </Paper>
    </>
  );
};

export default EnhancedInvitationForm;
