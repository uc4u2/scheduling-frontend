// src/components/Logo.js
import React from "react";

export default function Logo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      style={{ marginRight: 12, verticalAlign: "middle" }}
    >
      <circle cx="24" cy="24" r="22" fill="#1976d2" stroke="#fff" strokeWidth="3" />
      <text
        x="24"
        y="29"
        textAnchor="middle"
        fontWeight="bold"
        fontSize="20"
        fill="#fff"
        fontFamily="Poppins, Arial, sans-serif"
      >
        S
      </text>
    </svg>
  );
}
