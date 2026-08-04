export const DASHBOARD_STATUS_CHIP_CONTRACT = {
  success: {
    variant: "filled",
    sx: {
      bgcolor: "#dff3e4",
      border: "1px solid #a8cfb3",
      color: "#175c2e",
      fontWeight: 700,
    },
  },
  warning: {
    variant: "filled",
    sx: {
      bgcolor: "#fff1d6",
      border: "1px solid #f0c98b",
      color: "#8a5400",
      fontWeight: 700,
    },
  },
  info: {
    variant: "filled",
    sx: {
      bgcolor: "#e3efff",
      border: "1px solid #b7cff5",
      color: "#1b4f9c",
      fontWeight: 700,
    },
  },
  neutral: {
    variant: "outlined",
    sx: {
      bgcolor: "#f5f8fc",
      borderColor: "#c7d3e0",
      color: "#2f415e",
      fontWeight: 700,
    },
  },
};

export const dashboardStatusChipProps = (tone = "neutral") => DASHBOARD_STATUS_CHIP_CONTRACT[tone] || DASHBOARD_STATUS_CHIP_CONTRACT.neutral;
