<<<<<<< HEAD
// src/pages/sections/management/AutoSiteBuilder.jsx
import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import { wb } from "../../../utils/api";
import { ensureCompanyId } from "../../../utils/company";
import VisualSiteBuilder from "./VisualSiteBuilder";

export default function AutoSiteBuilder() {
  const [companyId, setCompanyId] = useState(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      try {
        // 1) discover company id
        const cid = await ensureCompanyId();
        if (!cid) {
          setErr("Couldn’t detect your company id automatically.");
          return;
        }
        if (cancelled) return;
        setCompanyId(cid);

        // 2) see if pages exist
        let pages = [];
        try {
          const { data } = await wb.listPages(cid);
          pages = Array.isArray(data) ? data : [];
        } catch (e) {
          // keep going; we may fix this by importing a template
        }

        // 3) auto-import a template when no pages
        if (!pages.length) {
          let key = "enterprise-automotive-autocare-nexus-with-enterprise-contact-contact-fix";
          let version = "1.2.0";

          try {
            const { data: manifest } = await wb.listTemplates();
            if (Array.isArray(manifest) && manifest.length) {
              key = manifest[0].key || key;
              version =
                manifest[0].latest ||
                (manifest[0].versions?.[0] ?? version);
            }
          } catch {}

          try {
            await wb.importTemplate(cid, {
              key,
              template_key: key,
              version,
              clear_existing: false,
              publish: true,
              set_theme_from_template: true,
            });
          } catch (e) {
            setErr("Couldn’t auto-provision pages. Please try again.");
            return;
          }
        }

        setReady(true);
      } catch (e) {
        setErr("Setup failed. Please refresh.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>;
  if (!ready || !companyId) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Hand off to the real builder (which will now find pages)
  return <VisualSiteBuilder companyId={companyId} />;
}
=======
// src/pages/sections/management/AutoSiteBuilder.jsx
import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Alert } from "@mui/material";
import { wb } from "../../../utils/api";
import { ensureCompanyId } from "../../../utils/company";
import VisualSiteBuilder from "./VisualSiteBuilder";

export default function AutoSiteBuilder() {
  const [companyId, setCompanyId] = useState(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr("");
      try {
        // 1) discover company id
        const cid = await ensureCompanyId();
        if (!cid) {
          setErr("Couldn’t detect your company id automatically.");
          return;
        }
        if (cancelled) return;
        setCompanyId(cid);

        // 2) see if pages exist
        let pages = [];
        try {
          const { data } = await wb.listPages(cid);
          pages = Array.isArray(data) ? data : [];
        } catch (e) {
          // keep going; we may fix this by importing a template
        }

        // 3) auto-import a template when no pages
        if (!pages.length) {
          let key = "minimal-spa";
          let version = "1.0.0";

          try {
            const { data: manifest } = await wb.listTemplates();
            if (Array.isArray(manifest) && manifest.length) {
              key = manifest[0].key || key;
              version =
                manifest[0].latest ||
                (manifest[0].versions?.[0] ?? version);
            }
          } catch {}

          try {
            await wb.importTemplate(cid, {
              template_key: key,
              version,
              clear_existing: false,
              publish: true,
              set_theme_from_template: true,
            });
          } catch (e) {
            setErr("Couldn’t auto-provision pages. Please try again.");
            return;
          }
        }

        setReady(true);
      } catch (e) {
        setErr("Setup failed. Please refresh.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) return <Alert severity="error" sx={{ m: 2 }}>{err}</Alert>;
  if (!ready || !companyId) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Hand off to the real builder (which will now find pages)
  return <VisualSiteBuilder companyId={companyId} />;
}
>>>>>>> e0a2781f (Improve manager onboarding and fix recruiter calendar API base)
