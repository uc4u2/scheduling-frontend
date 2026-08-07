import React from "react";
import { Grid, Stack } from "@mui/material";
import { CorporatePageBand, CorporatePageIntro } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import {
  CorporatePlans,
  CorporateProblemSelector,
  CorporateServices,
} from "../components/CorporateServices";
import CorporateProcess from "../components/CorporateProcess";
import CorporateFinalCTA from "../components/CorporateCTA";
import { CorporateFeatureShowcaseSlider, CorporateRichText } from "../components/CorporateContentBlocks";

export default function CorporateServicesPage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.richTextBlocks?.[0] ? (
        <CorporatePageBand tone="warm">
          <CorporateRichText websiteSectionAdapter={slots.richTextBlocks[0].adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.services ? (
        <CorporatePageBand tone="clear">
          <CorporateServices websiteSectionAdapter={slots.services.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.problemSelector || slots.featureSlider ? (
        <CorporatePageBand tone="mist">
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            <Grid item xs={12} lg={5}>
              <CorporatePageIntro
                eyebrow="Choose the right route"
                title="Common service paths"
                body="Show the issue, the system type, and the likely next step so the service page does more than list categories."
              />
            </Grid>
            <Grid item xs={12} lg={7}>
              <Stack spacing={2.5}>
                {slots.problemSelector ? (
                  <CorporateProblemSelector websiteSectionAdapter={slots.problemSelector.adapted} />
                ) : null}
                {slots.featureSlider ? (
                  <CorporateFeatureShowcaseSlider websiteSectionAdapter={slots.featureSlider.adapted} />
                ) : null}
              </Stack>
            </Grid>
          </Grid>
        </CorporatePageBand>
      ) : null}
      {slots.process ? (
        <CorporatePageBand tone="clear">
          <CorporateProcess websiteSectionAdapter={slots.process.adapted} sticky />
        </CorporatePageBand>
      ) : null}
      {slots.plans ? (
        <CorporatePageBand tone="mist">
          <CorporatePlans websiteSectionAdapter={slots.plans.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.finalCta ? (
        <CorporatePageBand tone="clear">
          <CorporateFinalCTA websiteSectionAdapter={slots.finalCta.adapted} />
        </CorporatePageBand>
      ) : null}
    </>
  );
}
