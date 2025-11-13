// src/components/website/ThemeDesigner.js
import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, TextField, Typography, Button, Paper } from "@mui/material";
import { website, websiteAdmin } from "../../utils/api";
import { useTranslation } from "react-i18next";

export default function ThemeDesigner({ companyId, page = "home" }) {
  const { t } = useTranslation();
  const [overrides, setOverrides] = useState({
    palette: { primary: { main: "#6C5CE7" }, secondary: { main: "#00C2A8" } },
    shape: { borderRadius: 12 },
    typography: { fontFamily: "Inter, system-ui, sans-serif", h1: { fontWeight: 800 } },
  });
  const [html, setHtml] = useState("");
  const [busy, setBusy] = useState(false);

  const pretty = useMemo(() => JSON.stringify(overrides, null, 2), [overrides]);

  const update = (path, val) => {
    const segs = path.split(".");
    const next = JSON.parse(JSON.stringify(overrides));
    let obj = next;
    for (let i = 0; i < segs.length - 1; i++) obj = (obj[segs[i]] ||= {});
    obj[segs.at(-1)] = val;
    setOverrides(next);
  };

  useEffect(() => {
    let live = true;
    (async () => {
      setBusy(true);
      try {
        const res = await website.preview({ page, theme_overrides: overrides, companyId });
        const htmlStr = typeof res === "string" ? res : (res?.html || "");
        if (live) setHtml(htmlStr);
      } catch (e) {
        console.error("Preview error", e);
      } finally {
        if (live) setBusy(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [companyId, page, pretty]);

  const onSave = async () => {
    setBusy(true);
    try {
      await websiteAdmin.saveSettings({ theme_overrides: overrides }, { companyId });
      alert(t("manager.visualBuilder.themeDesigner.alerts.saved"));
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || t("manager.visualBuilder.themeDesigner.alerts.genericFailure");
      alert(t("manager.visualBuilder.themeDesigner.alerts.saveFailed", { reason: msg }));
      console.error("Save settings error", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "360px 1fr" },
        gap: 2,
        height: "100%",
      }}
    >
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {t("manager.visualBuilder.themeDesigner.title")}
        </Typography>
        <Stack spacing={1.25}>
          <TextField
            label={t("manager.visualBuilder.themeDesigner.fields.primary")}
            size="small"
            type="color"
            value={overrides.palette.primary.main}
            onChange={(e) => update("palette.primary.main", e.target.value)}
          />
          <TextField
            label={t("manager.visualBuilder.themeDesigner.fields.secondary")}
            size="small"
            type="color"
            value={overrides.palette.secondary.main}
            onChange={(e) => update("palette.secondary.main", e.target.value)}
          />
          <TextField
            label={t("manager.visualBuilder.themeDesigner.fields.borderRadius")}
            size="small"
            type="number"
            inputProps={{ min: 0, max: 24, step: 1 }}
            value={overrides.shape.borderRadius}
            onChange={(e) => update("shape.borderRadius", Number(e.target.value || 0))}
          />
          <TextField
            label={t("manager.visualBuilder.themeDesigner.fields.fontFamily")}
            size="small"
            value={overrides.typography.fontFamily}
            onChange={(e) => update("typography.fontFamily", e.target.value)}
          />
          <TextField
            label={t("manager.visualBuilder.themeDesigner.fields.h1Weight")}
            size="small"
            type="number"
            inputProps={{ min: 300, max: 900, step: 100 }}
            value={overrides.typography.h1.fontWeight}
            onChange={(e) =>
              update("typography.h1.fontWeight", Number(e.target.value || 700))
            }
          />
          <Button variant="contained" disabled={busy} onClick={onSave}>
            {t("manager.visualBuilder.themeDesigner.buttons.save")}
          </Button>
        </Stack>

        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1.5, color: "text.secondary" }}
        >
          {t("manager.visualBuilder.themeDesigner.labels.json")}
        </Typography>
        <TextField
          multiline
          minRows={6}
          fullWidth
          size="small"
          value={pretty}
          onChange={() => {}}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 1 }}>
        <iframe
          title={t("manager.visualBuilder.themeDesigner.previewTitle")}
          style={{ width: "100%", height: "80vh", border: 0, opacity: busy ? 0.7 : 1 }}
          srcDoc={html}
        />
      </Paper>
    </Box>
  );
}
