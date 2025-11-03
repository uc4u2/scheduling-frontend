// src/components/ui/TabShell.js
import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Box, Tabs, Tab, Stack, Typography, Divider } from "@mui/material";
import SectionCard from "./SectionCard";

/**
 * Enterprise-grade TabShell
 * - Accepts `tabs=[{ label, content, icon, key }]` OR plain `children`
 * - No conditional hooks; never crashes if tabs are missing
 * - Uses your theme spacing/typography
 */
export default function TabShell({
  title,
  description,
  actions,
  tabs,
  defaultIndex = 0,
  children,
  sx,
  tabsProps,
  headerProps,
}) {
  // Normalize tabs (always computed)
  const safeTabs = useMemo(() => {
    if (Array.isArray(tabs)) {
      return tabs.filter(Boolean).map((t, i) => ({
        label: t?.label ?? `Tab ${i + 1}`,
        content: t?.content ?? null,
        icon: t?.icon ?? null,
        key: t?.key ?? `tab-${i}`,
      }));
    }
    return [];
  }, [tabs]);

  // Keep hook calls unconditional
  const [idx, setIdx] = useState(() =>
    Math.min(
      Math.max(0, Number(defaultIndex) || 0),
      Math.max(0, (safeTabs.length || 1) - 1)
    )
  );

  // Clamp index whenever tab count changes
  useEffect(() => {
    const max = Math.max(0, safeTabs.length - 1);
    if (idx > max) setIdx(max);
  }, [idx, safeTabs.length]);

  return (
    <SectionCard
      title={title}
      description={description}
      actions={actions}
      sx={sx}
      {...headerProps}
    >
      {/* If no tabs, render children in the card */}
      {!safeTabs.length ? (
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>{children}</Box>
      ) : (
        <>
          <Box sx={{ px: { xs: 1, sm: 2 }, pt: 1 }}>
            <Tabs
              value={idx}
              onChange={(_, v) => setIdx(v)}
              variant="scrollable"
              scrollButtons="auto"
              {...tabsProps}
            >
              {safeTabs.map((t) => (
                <Tab
                  key={t.key}
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {t.icon}
                      <span>{t.label}</span>
                    </Stack>
                  }
                  disableRipple
                />
              ))}
            </Tabs>
          </Box>

          <Divider sx={{ my: 1 }} />

          <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
            {safeTabs[idx]?.content ?? (
              <Typography color="text.secondary">No content.</Typography>
            )}
          </Box>
        </>
      )}
    </SectionCard>
  );
}

TabShell.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      content: PropTypes.node,
      icon: PropTypes.node,
      key: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  defaultIndex: PropTypes.number,
  children: PropTypes.node,
  sx: PropTypes.object,
  tabsProps: PropTypes.object,
  headerProps: PropTypes.object,
};
