import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

const MorphingBlob = ({ color = "#00bfa5", size = 500, opacity = 0.2, duration = 20, sx = {} }) => {
  return (
    <Box
      component={motion.div}
      animate={{
        scale: [5, 2.05, 1],
        rotate: [0, 360],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      sx={{
        position: "absolute",
        width: size,
        height: size,
        opacity,
        zIndex: 0,
        filter: "blur(30px)",
        ...sx,
      }}
    >
      <svg
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        <path
          fill={color}
          d="M47.2,-62.9C60.7,-53.1,70.9,-40.5,76.4,-26.6C82,-12.7,82.9,3.4,77.2,17.9C71.5,32.5,59.3,45.4,44.6,54.4C29.9,63.4,12.9,68.4,-2.4,71.1C-17.7,73.8,-35.3,74.3,-48.7,66C-62.2,57.7,-71.5,40.6,-75.1,23.3C-78.7,5.9,-76.6,-11.6,-70.6,-28.6C-64.7,-45.6,-54.9,-61.9,-41,-71.4C-27.1,-80.8,-9.1,-83.5,6.6,-79.2C22.3,-74.9,44.7,-63.8,47.2,-62.9Z"
          transform="translate(100 100)"
        />
      </svg>
    </Box>
  );
};

export default MorphingBlob;
