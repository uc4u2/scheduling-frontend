import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const Bubble = ({ size = 40, color = "#00bfa5", duration = 6, opacity = 0.15, sx = {} }) => {
  // Generate random initial and target positions
  const { initialX, initialY, animateX, animateY } = useMemo(() => ({
    initialX: getRandomInt(-20, 20),
    initialY: getRandomInt(-20, 20),
    animateX: getRandomInt(-30, 30),
    animateY: getRandomInt(-30, 30),
  }), []);

  const variants = {
    initial: { x: initialX, y: initialY },
    animate: {
      x: animateX,
      y: animateY,
      transition: {
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      style={{ position: "absolute" }}
    >
      <Box
        sx={{
          width: size,
          height: size,
          backgroundColor: color,
          opacity,
          borderRadius: "50%",
          ...sx,
        }}
      />
    </motion.div>
  );
};

export default Bubble;
