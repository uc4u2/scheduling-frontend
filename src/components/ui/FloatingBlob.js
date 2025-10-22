import React from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";

const FloatingBlob = ({
  color = "#00bfa5",
  size = 200,
  duration = 8,
  opacity = 0.4,
  sx = {},
  enableMotion = false,
  useThemeColor = false,
  debugBorder = false,
}) => {
  const theme = useTheme();
  const blobColor = useThemeColor ? theme.palette.secondary.main : color;

  const blobContent = (
    <Box
      sx={{
        position: "absolute",
        width: size,
        height: size,
        background: blobColor,
        opacity,
        borderRadius: "50%",
        border: debugBorder ? "2px solid rgba(255,0,0,0.4)" : "none",
        top: 0,
        left: 0,
        zIndex: 10,
        animation: `floatBlob ${duration}s ease-in-out infinite alternate`,
        ...sx,
      }}
    />
  );

  if (enableMotion) {
    return (
      <motion.div
        animate={{ y: [0, 30, 0], scale: [1, 1.2, 1] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {blobContent}
      </motion.div>
    );
  }

  return blobContent;
};

export default FloatingBlob;