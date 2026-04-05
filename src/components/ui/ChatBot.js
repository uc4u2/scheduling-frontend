import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const BASE_CHIPS = [
  "Scheduling & time tracking",
  "Payroll & QuickBooks/Xero",
  "Pricing & plans",
  "Compare Schedulaa with QuickBooks",
  "AI Website Assistant",
  "Onboarding checklist & rollout",
  "Attendance summaries",
  "Payroll explanations",
];

const PAGE_CHIPS = {
  "/features": [
    "Show me features for 3–50 employees",
    "What problem does Schedulaa solve?",
  ],
  "/payroll": [
    "How does overtime calculation work?",
    "Can I export payroll to QuickBooks?",
  ],
  "/pricing": ["Which plan is right for my business?"],
};

const schedulaaShell = {
  launcherBg: "linear-gradient(135deg, #123f6b 0%, #1d4ed8 52%, #2563eb 100%)",
  launcherShadow: "0 18px 34px rgba(15,23,42,0.28)",
  panelBg: "#10233a",
  panelBorder: "1px solid rgba(71,85,105,0.46)",
  headerBg: "#15597c",
  bodyBg: "#132841",
  footerBg: "#10233a",
  botBubble: "rgba(51,65,85,0.92)",
  botBubbleBorder: "1px solid rgba(100,116,139,0.38)",
  userBubble: "#2563eb",
  mutedText: "rgba(226,232,240,0.8)",
  headingText: "#f8fafc",
  chipBg: "rgba(30,41,59,0.96)",
  chipBorder: "1px solid rgba(100,116,139,0.42)",
  chipText: "#e2e8f0",
  composerBg: "rgba(15,23,42,0.92)",
  composerInputBg: "rgba(30,41,59,0.92)",
  composerInputBorder: "1px solid rgba(71,85,105,0.56)",
  sendBg: "linear-gradient(135deg, #bef264 0%, #a3e635 100%)",
  sendText: "#082f17",
};

const getTenantShell = (tenantAccent, tenantAccentHover, tenantPaper, tenantBg) => ({
  launcherBg: tenantAccent,
  launcherShadow: "0 18px 34px rgba(15,23,42,0.18)",
  panelBg: tenantPaper,
  panelBorder: "1px solid rgba(226,232,240,0.92)",
  headerBg: `linear-gradient(180deg, ${alpha("#ffffff", 0.98)} 0%, ${alpha(
    "#f8fafc",
    0.96
  )} 100%)`,
  bodyBg: tenantBg,
  footerBg: tenantBg,
  botBubble: tenantPaper,
  botBubbleBorder: "1px solid rgba(226,232,240,0.94)",
  userBubble: tenantAccent,
  mutedText: "rgba(71,85,105,0.88)",
  headingText: "#0f172a",
  chipBg: "rgba(255,255,255,0.96)",
  chipBorder: `1px solid color-mix(in srgb, ${tenantAccent} 28%, rgba(226,232,240,0.96))`,
  chipText: "var(--sched-text, #0f172a)",
  composerBg: tenantBg,
  composerInputBg: "#ffffff",
  composerInputBorder: "1px solid rgba(226,232,240,0.94)",
  sendBg: tenantAccentHover,
  sendText: "#ffffff",
});

const ChatBot = ({ companySlug, config, onOpenChange }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const isTenant = Boolean(companySlug);
  const navigate = useNavigate();
  const tenantAccent = "var(--page-btn-bg, var(--sched-primary, #6366F1))";
  const tenantAccentHover =
    "var(--page-btn-bg-hover, var(--page-btn-bg, var(--sched-primary, #6366F1)))";
  const tenantPaper = "var(--sched-paper, #ffffff)";
  const tenantBg = "var(--sched-bg, #f5f6f8)";
  const shell = isTenant
    ? getTenantShell(tenantAccent, tenantAccentHover, tenantPaper, tenantBg)
    : schedulaaShell;
  const introMessages = useMemo(
    () => buildIntroMessages({ isTenant, config }),
    [isTenant, config]
  );

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length) return introMessages;
      const hasUserMessage = prev.some((msg) => msg.sender === "user");
      return hasUserMessage ? prev : introMessages;
    });
  }, [introMessages]);

  const assistantName = isTenant
    ? (config?.assistant_name || "Assistant")
    : "Schedulaa Assistant";
  const assistantSubtitle = isTenant
    ? "Booking help, services, and business info"
    : "";
  const assistantInitial = (assistantName || "Schedulaa").trim().charAt(0) || "S";
  const primaryCta = config?.primary_cta;
  const secondaryCta = config?.secondary_cta;
  const hasCtas =
    Boolean(primaryCta?.label && primaryCta?.href) ||
    Boolean(secondaryCta?.label && secondaryCta?.href);

  const sendMessage = async (overrideText) => {
    const content = (overrideText ?? input).trim();
    if (!content) return;

    setMessages((prev) => {
      const sanitized = prev.map((msg) =>
        msg.chips ? { ...msg, chips: [] } : msg
      );
      return [...sanitized, { sender: "user", text: content }];
    });
    setLoading(true);

    try {
      const requestConfig = {
        headers: companySlug ? { "X-Company-Slug": companySlug } : undefined,
        noCompanyHeader: true,
        noAuth: true,
      };
      const res = await api.post(
        "/chat",
        { message: content },
        requestConfig
      );

      setMessages((prev) => {
        const withoutErrors = prev.filter((msg) => msg.type !== "error");
        return [...withoutErrors, { sender: "bot", text: res.data.reply }];
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Oops! Something went wrong. Please try again later.",
          type: "error",
        },
      ]);
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const goToCta = (href) => {
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.location.assign(href);
      return;
    }
    navigate(href);
  };

  const handleOpen = () => {
    setOpen(true);
    if (onOpenChange) onOpenChange(true);
  };

  const handleClose = () => {
    setOpen(false);
    if (onOpenChange) onOpenChange(false);
  };

  const typingIndicator = (
    <Stack direction="row" spacing={1.2} alignItems="center">
      <Avatar
        sx={{
          width: 28,
          height: 28,
          fontSize: 12,
          bgcolor: isTenant
            ? "color-mix(in srgb, var(--page-btn-bg, var(--sched-primary, #6366F1)) 14%, #fff)"
            : "rgba(96,165,250,0.16)",
          color: isTenant ? tenantAccent : "#93c5fd",
        }}
      >
        {assistantInitial}
      </Avatar>
      <Box
        sx={{
          display: "inline-flex",
          gap: 0.6,
          alignItems: "center",
          px: 1.5,
          py: 1,
          borderRadius: "8px",
          bgcolor: shell.botBubble,
          border: shell.botBubbleBorder,
        }}
      >
        {[0, 1, 2].map((dot) => (
          <Box
            key={dot}
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: isTenant ? "rgba(71,85,105,0.9)" : "rgba(226,232,240,0.85)",
              animation: "chatbotPulse 1.4s infinite ease-in-out",
              animationDelay: `${dot * 0.18}s`,
              "@keyframes chatbotPulse": {
                "0%, 80%, 100%": { opacity: 0.3, transform: "scale(0.9)" },
                "40%": { opacity: 1, transform: "scale(1)" },
              },
            }}
          />
        ))}
      </Box>
    </Stack>
  );

  return (
    <>
      {!open && (
        <Box
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 2000,
          }}
        >
          <Button
            onClick={handleOpen}
            startIcon={<ChatIcon />}
            sx={{
              minWidth: "auto",
              px: 2,
              py: 1.2,
              borderRadius: "8px",
              textTransform: "none",
              fontWeight: 700,
              color: isTenant ? "#ffffff" : "#d9f99d",
              background: shell.launcherBg,
              boxShadow: shell.launcherShadow,
              "& .MuiButton-startIcon": {
                color: isTenant ? "#ffffff" : "#bef264",
              },
              "&:hover": {
                background: shell.launcherBg,
                filter: "brightness(0.96)",
              },
            }}
          >
            {isTenant ? "Chat with us" : "Ask Schedulaa"}
          </Button>
        </Box>
      )}

      {open && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: { xs: "calc(100vw - 24px)", sm: 390 },
            maxWidth: "calc(100vw - 24px)",
            maxHeight: { xs: "78vh", md: "74vh" },
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            zIndex: 3000,
            overflow: "hidden",
            background: shell.panelBg,
            border: shell.panelBorder,
            boxShadow: isTenant
              ? "0 26px 60px rgba(15,23,42,0.18)"
              : "0 34px 72px rgba(2,6,23,0.52)",
          }}
        >
          <Box
            sx={{
              px: 2.25,
              pt: 2.1,
              pb: 1.8,
              background: shell.headerBg,
              borderBottom: isTenant
                ? "1px solid rgba(226,232,240,0.92)"
                : "1px solid rgba(96,165,250,0.14)",
            }}
          >
            <Stack direction="row" spacing={1.4} alignItems="flex-start">
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  fontWeight: 800,
                  fontSize: 16,
                  bgcolor: isTenant ? tenantAccent : "rgba(255,255,255,0.94)",
                  color: isTenant ? "#ffffff" : "#0f172a",
                  boxShadow: isTenant
                    ? "0 10px 22px rgba(15,23,42,0.12)"
                    : "0 12px 24px rgba(8,21,39,0.28)",
                }}
              >
                {assistantInitial}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography
                    variant="subtitle1"
                    fontWeight={800}
                    sx={{ color: shell.headingText, lineHeight: 1.2 }}
                  >
                    {assistantName}
                  </Typography>
                  <Chip
                    label="Online"
                    size="small"
                    sx={{
                      height: 24,
                      fontWeight: 700,
                      borderRadius: "8px",
                      color: isTenant ? tenantAccent : "#d9f99d",
                      bgcolor: isTenant
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(163,230,53,0.12)",
                      border: isTenant
                        ? "1px solid rgba(226,232,240,0.94)"
                        : "1px solid rgba(190,242,100,0.28)",
                    }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 0.45,
                    color: shell.mutedText,
                    lineHeight: 1.45,
                  }}
                >
                  {assistantSubtitle}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={handleClose}
                sx={{
                  color: isTenant ? "rgba(71,85,105,0.88)" : "rgba(226,232,240,0.86)",
                  border: isTenant
                    ? "1px solid rgba(226,232,240,0.94)"
                    : "1px solid rgba(148,163,184,0.26)",
                  bgcolor: isTenant ? "rgba(255,255,255,0.82)" : "rgba(15,23,42,0.26)",
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            {!isTenant && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.2,
                  borderRadius: 1,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(226,232,240,0.12)",
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AutoAwesomeIcon sx={{ fontSize: 17, color: "#93c5fd" }} />
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(226,232,240,0.86)", fontWeight: 600 }}
                  >
                    Ask about scheduling, payroll, pricing, onboarding, and setup.
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>

          <Box
            sx={{
              flex: 1,
              px: 2,
              py: 1.9,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1.4,
              background: shell.bodyBg,
            }}
          >
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              const showAvatar = !isUser;
              return (
                <Box key={idx}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      gap: 1,
                    }}
                  >
                    {showAvatar && (
                      <Avatar
                        sx={{
                          width: 30,
                          height: 30,
                          fontSize: 12,
                          mt: 0.25,
                          bgcolor: isTenant
                            ? "color-mix(in srgb, var(--page-btn-bg, var(--sched-primary, #6366F1)) 14%, #fff)"
                            : "rgba(96,165,250,0.16)",
                          color: isTenant ? tenantAccent : "#93c5fd",
                        }}
                      >
                        {assistantInitial}
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: "82%",
                        px: 1.85,
                        py: 1.35,
                        borderRadius: "8px",
                        background: isUser ? shell.userBubble : shell.botBubble,
                        color: isUser ? (isTenant ? "#ffffff" : "#eff6ff") : shell.headingText,
                        border: isUser ? "none" : shell.botBubbleBorder,
                        boxShadow: isUser
                          ? isTenant
                            ? "0 8px 20px rgba(15,23,42,0.16)"
                            : "0 16px 28px rgba(15,23,42,0.22)"
                          : "0 8px 22px rgba(15,23,42,0.12)",
                        fontSize: 14,
                        lineHeight: 1.62,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.text}
                    </Box>
                  </Box>

                  {msg.chips && msg.chips.length > 0 && (
                      <Stack direction="row" flexWrap="wrap" gap={1} mt={1.15} ml={showAvatar ? 5 : 0}>
                        {msg.chips.map((label, chipIndex) => (
                          <Chip
                            key={label}
                            label={label}
                          onClick={() => sendMessage(label)}
                          clickable
                          sx={{
                            ...( !isTenant && chipIndex < 2
                              ? {
                                  background:
                                    "linear-gradient(135deg, rgba(190,242,100,0.96) 0%, rgba(163,230,53,0.96) 100%)",
                                  color: "#0f172a",
                                  border: "1px solid rgba(190,242,100,0.42)",
                                  boxShadow: "0 10px 22px rgba(132,204,22,0.16)",
                                }
                              : null),
                            height: "auto",
                            minHeight: 36,
                            px: 0.25,
                            borderRadius: "8px",
                            background:
                              !isTenant && chipIndex < 2 ? undefined : shell.chipBg,
                            color: !isTenant && chipIndex < 2 ? undefined : shell.chipText,
                            border:
                              !isTenant && chipIndex < 2 ? undefined : shell.chipBorder,
                            "& .MuiChip-label": {
                              px: 1.2,
                              py: 0.9,
                              fontWeight: 600,
                              whiteSpace: "normal",
                            },
                            "&:hover": {
                              background: isTenant
                                ? "color-mix(in srgb, var(--page-btn-bg, var(--sched-primary, #6366F1)) 14%, #fff)"
                                : chipIndex < 2
                                ? "linear-gradient(135deg, rgba(190,242,100,1) 0%, rgba(163,230,53,1) 100%)"
                                : "rgba(30,41,59,1)",
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              );
            })}
            {loading && typingIndicator}
          </Box>

          {(hasCtas || !isTenant) && (
            <Box
              sx={{
                px: 2,
                pb: 1.35,
                background: shell.footerBg,
              }}
            >
              <Stack direction="row" gap={1} flexWrap="wrap">
                {primaryCta?.label && primaryCta?.href && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => goToCta(primaryCta.href)}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 700,
                      backgroundColor: isTenant ? tenantAccent : "#2563eb",
                      "&:hover": {
                        backgroundColor: isTenant ? tenantAccentHover : "#1d4ed8",
                      },
                    }}
                  >
                    {primaryCta.label}
                  </Button>
                )}
                {secondaryCta?.label && secondaryCta?.href && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => goToCta(secondaryCta.href)}
                    sx={{
                      borderRadius: "8px",
                      textTransform: "none",
                      fontWeight: 700,
                      borderColor: isTenant ? tenantAccent : "rgba(147,197,253,0.24)",
                      color: isTenant ? tenantAccent : "#dbeafe",
                    }}
                  >
                    {secondaryCta.label}
                  </Button>
                )}
              </Stack>
            </Box>
          )}

          <Box
            sx={{
              px: 1.5,
              pb: 1.5,
              pt: 0.8,
              background: shell.footerBg,
              borderTop: isTenant
                ? "1px solid rgba(226,232,240,0.92)"
                : "1px solid rgba(71,85,105,0.42)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 0.8,
                borderRadius: "8px",
                background: shell.composerBg,
                border: isTenant
                  ? "1px solid rgba(226,232,240,0.92)"
                  : "1px solid rgba(71,85,105,0.48)",
              }}
            >
              <TextField
                fullWidth
                placeholder={
                  isTenant
                    ? "Ask about services, booking, or policies..."
                    : "Ask about payroll, booking, onboarding..."
                }
                variant="outlined"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <HelpOutlineIcon
                        fontSize="small"
                        sx={{ color: isTenant ? "rgba(71,85,105,0.75)" : "rgba(148,163,184,0.8)" }}
                      />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: "8px",
                    background: shell.composerInputBg,
                    color: shell.headingText,
                    "& fieldset": {
                      borderColor: "transparent",
                    },
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    "& fieldset": {
                      border: "none",
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: isTenant ? "rgba(100,116,139,0.88)" : "rgba(148,163,184,0.72)",
                    opacity: 1,
                  },
                }}
              />
              <IconButton
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                sx={{
                  width: 48,
                  height: 48,
                  background: shell.sendBg,
                  color: shell.sendText,
                  boxShadow: "0 12px 22px rgba(15,23,42,0.14)",
                  "&:hover": {
                    background: shell.sendBg,
                    filter: "brightness(0.98)",
                  },
                  "&.Mui-disabled": {
                    background: isTenant
                      ? "rgba(226,232,240,0.92)"
                      : "rgba(51,65,85,0.72)",
                    color: isTenant ? "rgba(148,163,184,0.92)" : "rgba(148,163,184,0.7)",
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatBot;

function getPathname() {
  if (typeof window === "undefined") return "/";
  return window.location.pathname;
}

function buildIntroMessages({ isTenant = false, config = null } = {}) {
  const path = getPathname();
  const chips = PAGE_CHIPS[path] || [];
  const tenantChips = [
    "Tell me about your business",
    "What services do you offer?",
    "How do I book and pay?",
  ];
  const quickReplies =
    Array.isArray(config?.quick_replies) && config.quick_replies.length > 0
      ? config.quick_replies
      : null;
  const chipList = isTenant
    ? quickReplies || tenantChips
    : Array.from(new Set([...BASE_CHIPS, ...chips]));
  const displayName = (config?.assistant_name || "this business").trim();
  const greetingText =
    config?.greeting_text ||
    "I can help with bookings and services.\nAsk me about schedules, pricing, or booking policies.\nI’ll answer based on this business’s published information.";

  return [
    {
      sender: "bot",
      text: isTenant
        ? `Hi, I’m the ${displayName}.`
        : "Hi, I’m the Schedulaa Assistant.\nI can help with scheduling, payroll, booking, and setup questions.",
    },
    {
      sender: "bot",
      text: isTenant
        ? greetingText
        : "Schedulaa is an operations OS for service teams.\nBooking -> staff scheduling -> breaks -> time tracking -> payroll -> QuickBooks/Xero, all in one workflow.",
    },
    !isTenant && {
      sender: "bot",
      text:
        "I can also point you to pricing, onboarding, AI website help, attendance summaries, and payroll explanations.",
    },
    {
      sender: "bot",
      text: "What would you like to explore?",
      chips: chipList,
    },
  ].filter(Boolean);
}
