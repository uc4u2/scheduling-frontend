// RealTimeNotifier.js
import React, { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import io from "socket.io-client";

const RealTimeNotifier = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const socket = io("http://localhost:5000"); // adjust as needed

  useEffect(() => {
    socket.on("update", (data) => {
      setMessage(data.message);
      setOpen(true);
    });
    return () => socket.disconnect();
  }, [socket]);

  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}>
      <Alert onClose={() => setOpen(false)} severity="info">
        {message}
      </Alert>
    </Snackbar>
  );
};

export default RealTimeNotifier;
