import React from "react";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { useLocation } from "react-router-dom";
import { getBottomTabs } from "./navConfig";

export default function BottomTabs({ role, onNavigate, onMore }) {
  const location = useLocation();
  const tabs = getBottomTabs(role);
  const active = tabs.find((tab) => tab.to && location.pathname.startsWith(tab.to))?.key || "today";

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <BottomNavigation showLabels value={active}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <BottomNavigationAction
              key={tab.key}
              label={tab.label}
              value={tab.key}
              icon={<Icon />}
              onClick={() => {
                if (tab.key === "more") {
                  onMore();
                  return;
                }
                onNavigate(tab.to);
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
}
