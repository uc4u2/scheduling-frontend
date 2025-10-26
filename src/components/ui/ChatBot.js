import React, { useState } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

const ChatBot = ({ token }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there! Ask me anything about the app 👋" },
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message: input,
      });

      setMessages((prev) => [
        ...newMessages,
        { sender: "bot", text: res.data.reply },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...newMessages,
        {
          sender: "bot",
          text: "Oops! Something went wrong. Please try again later.",
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

  return (
    <>
      {/* Floating Button */}
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

      {/* Chatbot Panel */}
      {open && (
        <Paper
          elevation={6}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 320,
            maxHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            overflow: "hidden",
            zIndex: 3000,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1.5,
              backgroundColor: "primary.main",
              color: "white",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Virtual Assistant
            </Typography>
            <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "white" }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Chat Window */}
          <Box
            sx={{
              flex: 1,
              p: 2,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
              backgroundColor: "background.default",
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    msg.sender === "user"
                      ? "primary.main"
                      : "grey.300",
                  color: msg.sender === "user" ? "white" : "black",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  maxWidth: "80%",
                  fontSize: 14,
                }}
              >
                {msg.text}
              </Box>
            ))}
            {loading && (
              <Typography variant="caption" color="text.secondary">
                Typing...
              </Typography>
            )}
          </Box>

          {/* Input Box */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid",
              borderColor: "divider",
              px: 1,
              py: 1,
              backgroundColor: "background.paper",
            }}
          >
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="standard"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              InputProps={{ disableUnderline: true }}
              sx={{ mr: 1 }}
            />
            <IconButton color="primary" onClick={sendMessage}>
              {loading ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatBot;
