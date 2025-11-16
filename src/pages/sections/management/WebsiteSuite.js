// src/pages/sections/management/WebsiteSuite.js
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import WebsiteManager from "./WebsiteManager";
import WebsiteTemplates from "./WebsiteTemplates";
import VisualSiteBuilder from "./VisualSiteBuilder";
import InlineSiteEditor from "./InlineSiteEditor";
import ManagementFrame from "../../../components/ui/ManagementFrame";

const TAB_KEYS = ["manager", "editor", "templates", "builder"];

export default function WebsiteSuite() {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);

  const tabConfig = useMemo(
    () => [
      {
        key: "manager",
        label: t("manager.websiteSuite.tabs.manager.label"),
        dialogTitle: t("manager.websiteSuite.tabs.manager.dialogTitle"),
      },
      {
        key: "editor",
        label: t("manager.websiteSuite.tabs.editor.label"),
        dialogTitle: t("manager.websiteSuite.tabs.editor.dialogTitle"),
      },
      {
        key: "templates",
        label: t("manager.websiteSuite.tabs.templates.label"),
        dialogTitle: t("manager.websiteSuite.tabs.templates.dialogTitle"),
      },
      {
        key: "builder",
        label: t("manager.websiteSuite.tabs.builder.label"),
        dialogTitle: t("manager.websiteSuite.tabs.builder.dialogTitle"),
      },
    ],
    [t]
  );

  const activeKey = tabConfig[tab]?.key ?? TAB_KEYS[0];

  return (
    <ManagementFrame
      title={t("manager.websiteSuite.title")}
      subtitle={t("manager.websiteSuite.subtitle")}
    >
      <Tabs
        value={tab}
        onChange={(_, value) => {
          setTab(value);
          setOpen(true);
        }}
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        {tabConfig.map((config) => (
          <Tab key={config.key} label={config.label} />
        ))}
      </Tabs>

      <Dialog
        fullScreen={full}
        maxWidth="xl"
        fullWidth
        open={open}
        onClose={() => setOpen(false)}
      >
        <AppBar sx={{ position: "relative" }} color="default" elevation={0}>
          <Toolbar>
            <Typography sx={{ flex: 1 }} variant="h6" component="div">
              {tabConfig[tab]?.dialogTitle || ""}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setFull(!full)}
              aria-label="toggle-fullscreen"
            >
              {full ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            <IconButton edge="end" color="inherit" onClick={() => setOpen(false)} aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ p: 2 }}>
            {activeKey === "manager" && <WebsiteManager />}
            {activeKey === "editor" && <InlineSiteEditor />}
            {activeKey === "templates" && <WebsiteTemplates />}
            {activeKey === "builder" && <VisualSiteBuilder />}
          </Box>
        </DialogContent>
      </Dialog>
    </ManagementFrame>
  );
}
