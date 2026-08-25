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
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import WebsiteManager from "./WebsiteManager";
import WebsiteTemplates from "./WebsiteTemplates";
import VisualSiteBuilder from "./VisualSiteBuilder";
import InlineSiteEditor from "./InlineSiteEditor";
import ManagementFrame from "../../../components/ui/ManagementFrame";

const TAB_KEYS = ["manager", "editor", "templates", "builder", "seo"];

function initialWebsiteTab() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const requested = params.get("websiteTab") || (window.location.hash === "#seo" ? "seo" : "");
    return TAB_KEYS.indexOf(requested);
  } catch {
    return -1;
  }
}

export default function WebsiteSuite() {
  const { t } = useTranslation();
  const requestedTab = initialWebsiteTab();
  const [tab, setTab] = useState(requestedTab >= 0 ? requestedTab : 0);
  const [open, setOpen] = useState(requestedTab >= 0);
  const [full, setFull] = useState(true);
  const supportSessionId = useMemo(() => {
    try {
      return new URLSearchParams(window.location.search || "").get("support_session");
    } catch {
      return null;
    }
  }, []);

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
      {
        key: "seo",
        label: t("management.domainSettings.seo.title", "SEO & Metadata"),
        dialogTitle: t("management.domainSettings.seo.title", "SEO & Metadata"),
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
      {supportSessionId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Support session active. Changes will apply to the tenant’s website.
        </Alert>
      )}
      <Tabs
        value={tab}
        onChange={(_, value) => {
          setTab(value);
          setFull(true);
          setOpen(true);
          try {
            const next = new URL(window.location.href);
            next.searchParams.set("websiteTab", tabConfig[value]?.key || TAB_KEYS[0]);
            next.hash = "";
            window.history.replaceState(null, "", `${next.pathname}${next.search}`);
          } catch {
            // Route state is a convenience only; the Website Suite remains usable without it.
          }
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
            {activeKey === "seo" && <WebsiteManager focusSeo />}
          </Box>
        </DialogContent>
      </Dialog>
    </ManagementFrame>
  );
}
