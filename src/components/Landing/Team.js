import React from "react";
import { Box, Grid, Paper, Typography, Avatar } from "@mui/material";
import { motion } from "framer-motion";

const team = [
  {
    name: "Joseph Chen",
    role: "Co-Founder & CEO",
    img: "https://i.pravatar.cc/300?img=1",
  },
  {
    name: "Alice Johnson", 
    role: "Lead Engineer",
    img: "https://i.pravatar.cc/300?img=5",
  },
  {
    name: "Mark Smith",
    role: "Product Designer",
    img: "https://i.pravatar.cc/300?img=8",
  },
];

const Team = () => (
  <Box
    id="team"
    sx={{
      py: 10,
      backgroundColor: (theme) => theme.palette.background.default,
    }}
  >
    <Box sx={{ maxWidth: "1200px", mx: "auto", px: 2 }}>
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{ fontWeight: 600, color: (theme) => theme.palette.text.primary }}
      >
        Meet the Team
      </Typography>
      <Typography
        align="center"
        sx={{
          color: (theme) => theme.palette.text.secondary,
          mb: 6,
        }}
      >
        The minds behind Scheduler. Building with purpose and precision.
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {team.map((member, idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  textAlign: "center",
                  borderRadius: 4,
                  backgroundColor: (theme) => theme.palette.background.paper,
                }}
              >
                <Avatar
                  src={member.img}
                  alt={member.name}
                  sx={{
                    width: 100,
                    height: 100,
                    mx: "auto",
                    mb: 2,
                    filter: "grayscale(100%)",
                    transition: "filter 0.3s ease",
                    "&:hover": { filter: "grayscale(0%)" },
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: (theme) => theme.palette.text.primary }}
                >
                  {member.name}
                </Typography>
                <Typography sx={{ color: (theme) => theme.palette.text.secondary }}>
                  {member.role}
                </Typography>
              </Paper>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </Box>
  </Box>
);

export default Team;
