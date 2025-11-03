import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { motion } from "framer-motion";
import schedulaaVideo from "../schedulaa.mp4"; // ✅ your demo video

const VideoSection = () => (
  <Box
    id="video"
    sx={(theme) => ({
      py: 12,
      background:
        theme.palette.mode === "dark"
          ? theme.palette.background.default
          : "#f9faff",
    })}
  >
    <Box sx={{ maxWidth: "1200px", mx: "auto", px: 3 }}>
      <Grid container spacing={6} alignItems="center">
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Typography
              variant="h4"
              sx={(theme) => ({
                fontWeight: 700,
                mb: 2,
                color: theme.palette.primary.main,
              })}
            >
              Watch Schedulaa in Action
            </Typography>
            <Typography
              variant="body1"
              sx={(theme) => ({
                lineHeight: 1.8,
                color: theme.palette.text.secondary,
              })}
            >
              See how you can assign shifts, onboard employees, and run payroll—without the busywork. One modern dashboard for all your HR, scheduling, and compliance needs.
            </Typography>
          </motion.div>
        </Grid>

        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Box
              sx={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              <video
                controls
                autoPlay
                muted
                loop
                style={{ width: "100%", height: "auto", borderRadius: "16px" }}
              >
                <source src={schedulaaVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  </Box>
);

export default VideoSection;
