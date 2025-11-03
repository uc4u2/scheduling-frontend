// src/pages/sections/SettingsWebsiteNav.js
import React, { useEffect, useState } from "react";
import {
  Card, CardHeader, CardContent, Divider, Grid,
  FormControlLabel, Switch, Button, Snackbar, Alert, TextField
} from "@mui/material";

// ✅ correct relative paths (two ../, not three)
import useCompanyId from "../../hooks/useCompanyId";
import { navSettings } from "../../utils/api";

export default function SettingsWebsiteNav() {
  const companyId = useCompanyId({ devDefault: null }); // consistent id
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);

  const [showServices, setShowServices] = useState(true);
  const [showReviews,  setShowReviews]  = useState(true);
  const [servicesTarget, setServicesTarget] = useState("builtin");
  const [reviewsTarget,  setReviewsTarget]  = useState("builtin");
  const [servicesSlug,   setServicesSlug]   = useState("services");
  const [reviewsSlug,    setReviewsSlug]    = useState("reviews");

  // LOAD
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!companyId) return;
      try {
        setLoading(true);
        const nav  = await navSettings.getOverrides(companyId);
        if (cancel) return;

        setShowServices(nav.show_services_tab !== false);
        setShowReviews (nav.show_reviews_tab  !== false);
        setServicesTarget(nav.services_tab_target || "builtin");
        setReviewsTarget (nav.reviews_tab_target  || "builtin");
        setServicesSlug  (nav.services_page_slug  || "services");
        setReviewsSlug   (nav.reviews_page_slug   || "reviews");
      } catch (e) {
        console.error("Load navigation settings failed", e);
        setMsg(e?.response?.data?.error || "Could not load website navigation settings.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [companyId]);

  // SAVE
  const onSave = async () => {
    if (!companyId) {
      setMsg("No company selected (missing company id).");
      return;
    }
    setSaving(true);
    try {
      const overrides = {
        show_services_tab: !!showServices,
        services_tab_target: servicesTarget,
        services_page_slug: (servicesSlug || "services").trim().toLowerCase(),
        show_reviews_tab: !!showReviews,
        reviews_tab_target: reviewsTarget,
        reviews_page_slug: (reviewsSlug || "reviews").trim().toLowerCase(),
      };
      const nav   = await navSettings.updateOverrides(companyId, overrides);

      // rehydrate from server
      setShowServices(nav.show_services_tab !== false);
      setShowReviews (nav.show_reviews_tab  !== false);
      setServicesTarget(nav.services_tab_target || "builtin");
      setReviewsTarget (nav.reviews_tab_target  || "builtin");
      setServicesSlug  (nav.services_page_slug  || "services");
      setReviewsSlug   (nav.reviews_page_slug   || "reviews");

      setMsg("Website navigation saved");
    } catch (e) {
      console.error("Save website settings failed", e);
      setMsg(e?.response?.data?.error || e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card variant="outlined">
        <CardHeader title="Website Navigation" subheader="Show or hide built-in tabs on your public site" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={!!showServices} onChange={(e) => setShowServices(e.target.checked)} />}
                label="Show Services tab"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={!!showReviews} onChange={(e) => setShowReviews(e.target.checked)} />}
                label="Show Reviews tab"
              />
            </Grid>
          </Grid>

          <Button sx={{ mt: 2 }} variant="contained" onClick={onSave} disabled={saving || loading || !companyId}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mt: 2 }}>
        <CardHeader title="Embed Code Helper" subheader="Paste these into your template Services/Reviews pages" />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Services iframe"
                fullWidth
                size="small"
                value={`<iframe src=\"/${(window.location.pathname.split('/')[1] || '').trim()}/services?embed=1&primary=%23191fd2&text=dark\" style=\"width:100%;min-height:900px;border:none;display:block;\"></iframe>`}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Reviews iframe"
                fullWidth
                size="small"
                value={`<iframe src=\"/${(window.location.pathname.split('/')[1] || '').trim()}/reviews?embed=1&primary=%23191fd2&text=dark\" style=\"width:100%;min-height:900px;border:none;display:block;\"></iframe>`}
                InputProps={{ readOnly: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar open={!!msg} autoHideDuration={3500} onClose={() => setMsg(null)}>
        <Alert onClose={() => setMsg(null)} severity="info" sx={{ width: "100%" }}>
          {msg}
        </Alert>
      </Snackbar>
    </>
  );
}
