// src/management/WebsiteBuilderHelpDrawer.js
import * as React from "react";
import {
  Box,
  Drawer,
  Typography,
  Divider,
  Button,
  Stack,
  useMediaQuery,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ImageIcon from "@mui/icons-material/Image";
import PaletteIcon from "@mui/icons-material/Palette";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import GridViewIcon from "@mui/icons-material/GridView";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import PublicIcon from "@mui/icons-material/Public";
import SaveIcon from "@mui/icons-material/Save";
import PublishIcon from "@mui/icons-material/Publish";
import HistoryIcon from "@mui/icons-material/History";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import FolderIcon from "@mui/icons-material/Folder";
import VisibilityIcon from "@mui/icons-material/Visibility";

const STEP_CONFIG = [
  { key: "pickPage", Icon: GridViewIcon },
  { key: "editText", Icon: TextFieldsIcon },
  { key: "images", Icon: ImageIcon },
  { key: "pageStyle", Icon: PaletteIcon },
  { key: "savePublish", Icon: SaveIcon },
  { key: "navigation", Icon: PublicIcon },
  { key: "navStyle", Icon: PaletteIcon },
  { key: "livePreview", Icon: VisibilityIcon },
  { key: "revisions", Icon: HistoryIcon },
  { key: "assets", Icon: FolderIcon, options: (translate) => ({ assetsLabel: translate("help.websiteBuilder.goToAssets") }) },
  { key: "optimization", Icon: CloudUploadIcon },
];

export default function WebsiteBuilderHelpDrawer({
  open,
  onClose,
  anchor,                // "left" | "right" | "bottom"
  width,                 // number (px) or string
  onJumpToPageStyle,     // optional: () => void
  onJumpToNavSettings,   // optional: () => void
  onJumpToAssets,        // optional: () => void
}) {
  const { t } = useTranslation();
  const tipsList = t("help.websiteBuilder.tipsList", { returnObjects: true }) || [];
  const troubleshootingList = t("help.websiteBuilder.troubleshootingList", { returnObjects: true }) || [];
  const isSmall = useMediaQuery("(max-width:900px)");
  const drawerAnchor = anchor || (isSmall ? "bottom" : "left");
  const drawerWidth = width ?? (isSmall ? "100%" : 560);

  return (
    <Drawer
      anchor={drawerAnchor}
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2000,
        '& .MuiDrawer-paper': { zIndex: 'inherit' },
      }}
      PaperProps={{
        sx: {
          width: drawerWidth,
          maxWidth: "100vw",
          p: 0,
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <HelpOutlineIcon fontSize="small" />
          <Typography variant="h5">{t("titles.websiteBuilderGuide")}</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{t("help.websiteBuilder.description")}</Typography>

        {(onJumpToPageStyle || onJumpToNavSettings || onJumpToAssets) && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{t("help.websiteBuilder.quickActions")}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
              {onJumpToPageStyle && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PaletteIcon />}
                  onClick={onJumpToPageStyle}
                >
                  {t("help.websiteBuilder.goToPageStyle")}
                </Button>
              )}
              {onJumpToNavSettings && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PublicIcon />}
                  onClick={onJumpToNavSettings}
                >
                  {t("help.websiteBuilder.goToNav")}
                </Button>
              )}
              {onJumpToAssets && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<FolderIcon />}
                  onClick={onJumpToAssets}
                >
                  {t("help.websiteBuilder.goToAssets")}
                </Button>
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
          </>
        )}

        {STEP_CONFIG.map(({ key, Icon, options }) => {
          const baseKey = `help.websiteBuilder.steps.${key}`;
          const optionValues = options ? options(t) : {};
          const bullets = t(`${baseKey}.bullets`, { returnObjects: true, ...optionValues }) || [];
          const footnote = t(`${baseKey}.footnote`, { defaultValue: "", ...optionValues });
          const resolvedFootnote =
            typeof footnote === "string" && footnote.trim() ? footnote : undefined;
          return (
            <Section
              key={key}
              icon={<Icon />}
              title={t(`${baseKey}.title`, optionValues)}
              bullets={Array.isArray(bullets) ? bullets : []}
              footnote={resolvedFootnote}
            />
          );
        })}

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <TipsAndUpdatesIcon color="primary" />
          <Typography variant="h6">{t("help.websiteBuilder.tipsTitle")}</Typography>
        </Stack>
        <ListBlock items={Array.isArray(tipsList) ? tipsList : []} />

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <WarningAmberIcon color="warning" />
          <Typography variant="h6">{t("help.websiteBuilder.troubleshootingTitle")}</Typography>
        </Stack>
        <ListBlock items={Array.isArray(troubleshootingList) ? troubleshootingList : []} />

        <Divider sx={{ my: 3 }} />

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <CloudUploadIcon />
            <Typography variant="subtitle1">{t("help.websiteBuilder.uploadsTitle")}</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">{t("help.websiteBuilder.uploadsDescription")}</Typography>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button onClick={onClose} variant="contained" startIcon={<PublishIcon />}>
            {t("buttons.closeGuide")}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

function Section({ icon, title, bullets = [], footnote }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        {icon}
        <Typography variant="h6">{title}</Typography>
      </Stack>
      <ul style={{ marginTop: 4, marginBottom: 8, paddingLeft: 20 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ lineHeight: 1.6 }}>
            <Typography variant="body2">{b}</Typography>
          </li>
        ))}
      </ul>
      {footnote && (
        <Typography variant="caption" color="text.secondary">
          {footnote}
        </Typography>
      )}
    </Box>
  );
}

function ListBlock({ items }) {
  return (
    <ul style={{ marginTop: 4, marginBottom: 8, paddingLeft: 20 }}>
      {items.map((t, i) => (
        <li key={i} style={{ lineHeight: 1.6 }}>
          <Typography variant="body2">{t}</Typography>
        </li>
      ))}
    </ul>
  );
}

