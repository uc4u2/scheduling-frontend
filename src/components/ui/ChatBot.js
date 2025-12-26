import React, { useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Divider,
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

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(() => buildIntroMessages());
  const [loading, setLoading] = useState(false);

  const sendMessage = async (overrideText) => {
    const content = (overrideText ?? input).trim();
    if (!content) return;

    let nextMessages = [];
    setMessages((prev) => {
      const sanitized = prev.map((msg) =>
        msg.chips ? { ...msg, chips: [] } : msg
      );
      nextMessages = [...sanitized, { sender: "user", text: content }];
      return nextMessages;
    });
    setLoading(true);

    try {
      const res = await api.post("/chat", {
        message: content,
      });

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

  const handleChipClick = (label) => {
    sendMessage(label);
  };

  const typingIndicator = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        color: "text.secondary",
        fontSize: 13,
      }}
    >
      <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>S</Avatar>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        {[0, 1, 2].map((dot) => (
          <Box
            key={dot}
            sx={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "text.secondary",
              animation: "blink 1.4s infinite",
              animationDelay: `${dot * 0.2}s`,
              "@keyframes blink": {
                "0%": { opacity: 0.2 },
                "20%": { opacity: 1 },
                "100%": { opacity: 0.2 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );

  return (
    <>
      {!open && (
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 2000,
            backgroundColor: "primary.main",
            color: "white",
            "&:hover": { backgroundColor: "primary.dark" },
          }}
        >
          <ChatIcon />
        </IconButton>
      )}

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 360,
            maxHeight: "72vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            zIndex: 3000,
            boxShadow: (theme) =>
              `0 20px 45px ${
                theme.palette.mode === "dark"
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(15,23,42,0.14)"
              }`,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2, pb: 1.5, backgroundColor: "grey.50" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  width: 40,
                  height: 40,
                  fontWeight: 700,
                  fontSize: 16,
                }}
              >
                S
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Schedulaa Assistant
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Here to help with scheduling, payroll & setup
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                sx={{ marginLeft: "auto" }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" mt={1.5}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: "success.main",
                  boxShadow: (theme) =>
                    `0 0 0 4px ${theme.palette.success.main}22`,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Online
              </Typography>
            </Stack>
          </Box>
          <Divider />

          <Box
            sx={{
              flex: 1,
              px: 2.5,
              py: 2,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1.25,
              backgroundColor: "background.default",
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
                          width: 28,
                          height: 28,
                          fontSize: 12,
                          bgcolor: "primary.light",
                          color: "primary.dark",
                        }}
                      >
                        S
                      </Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: "78%",
                        px: 2,
                        py: 1.25,
                        borderRadius: isUser
                          ? "18px 4px 18px 18px"
                          : "4px 18px 18px 18px",
                        bgcolor: isUser ? "primary.main" : "background.paper",
                        color: isUser
                          ? "primary.contrastText"
                          : "text.primary",
                        border: (theme) =>
                          isUser
                            ? "none"
                            : `1px solid ${theme.palette.divider}`,
                        boxShadow: isUser
                          ? "none"
                          : "0 2px 6px rgba(15,22,36,0.04)",
                        lineHeight: 1.55,
                        fontSize: 14,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.text}
                    </Box>
                  </Box>
                  {msg.chips && msg.chips.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={1.2} mt={1.2}>
                      {msg.chips.map((label) => (
                        <Chip
                          key={label}
                          label={label}
                          variant="outlined"
                          onClick={() => handleChipClick(label)}
                          sx={{
                            borderRadius: "999px",
                            borderColor: "primary.light",
                            "&:hover": {
                              bgcolor: "primary.light",
                              color: "primary.dark",
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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderTop: (theme) => `1px solid ${theme.palette.divider}`,
              px: 2,
              py: 1.5,
              backgroundColor: "grey.50",
            }}
          >
            <TextField
              fullWidth
              placeholder="Ask me anything about scheduling, payroll, or setup…"
              variant="outlined"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <HelpOutlineIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 999,
                  backgroundColor: "background.paper",
                },
              }}
              sx={{ mr: 1, "& fieldset": { borderRadius: 999 } }}
            />
            <IconButton color="primary" onClick={() => sendMessage()}>
              <SendIcon />
            </IconButton>
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

function buildIntroMessages() {
  const path = getPathname();
  const chips = PAGE_CHIPS[path] || [];
  const chipList = Array.from(new Set([...BASE_CHIPS, ...chips]));
  return [
    {
      sender: "bot",
      text: "Hi, I’m the Schedulaa Assistant.\nI can help you understand scheduling, time tracking, payroll, and setup.",
    },
    {
      sender: "bot",
      text: "Schedulaa is an operations OS for service teams.\nBooking → staff scheduling → breaks → time tracking → payroll → QuickBooks/Xero — all in one workflow.",
    },
    {
      sender: "bot",
      text: "New AI copilots can generate website copy, build onboarding checklists, summarize attendance trends, and explain payroll changes. Ask me where to find them or how to use them.",
    },
    {
      sender: "bot",
      text: "What would you like to explore?",
      chips: chipList,
    },
  ];
}
