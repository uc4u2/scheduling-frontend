import React from "react";
import { Grid } from "@mui/material";
import { CorporatePageBand } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import CorporateFinalCTA from "../components/CorporateCTA";
import { CorporateContact, CorporateFAQ, CorporateMap } from "../components/CorporateContentBlocks";

export default function CorporateContactPage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.contact || slots.map ? (
        <CorporatePageBand tone="warm">
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {slots.contact ? (
              <Grid item xs={12} lg={7}>
                <CorporateContact websiteSectionAdapter={slots.contact.adapted} />
              </Grid>
            ) : null}
            {slots.map ? (
              <Grid item xs={12} lg={5}>
                <CorporateMap websiteSectionAdapter={slots.map.adapted} />
              </Grid>
            ) : null}
          </Grid>
        </CorporatePageBand>
      ) : null}
      {slots.faq ? (
        <CorporatePageBand tone="clear">
          <CorporateFAQ websiteSectionAdapter={slots.faq.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.finalCta ? (
        <CorporatePageBand tone="mist">
          <CorporateFinalCTA websiteSectionAdapter={slots.finalCta.adapted} />
        </CorporatePageBand>
      ) : null}
    </>
  );
}

