import { Paper } from "@mui/material";

export default function ElevatedCard(props) {
  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        p: 3,
        borderRadius: 3,
        boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
        transition: "transform 0.1s ease, boxShadow 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
        },
        ...props.sx,
      }}
    />
  );
}
