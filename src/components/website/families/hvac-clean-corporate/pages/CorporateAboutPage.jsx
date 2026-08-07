import React from "react";
import { Grid, Stack } from "@mui/material";
import { CorporatePageBand, CorporatePageIntro } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import { CorporateStats } from "../components/CorporateServices";
import CorporateReviews from "../components/CorporateReviews";
import CorporateFinalCTA from "../components/CorporateCTA";
import { CorporateRichText } from "../components/CorporateContentBlocks";

export default function CorporateAboutPage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.richTextBlocks?.length ? (
        <CorporatePageBand tone="warm">
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            <Grid item xs={12} lg={5}>
              <CorporatePageIntro
                eyebrow="Why clients choose us"
                title={slots.richTextBlocks[0].props?.title || "Built for dependable comfort work"}
                body="Use this page for the operating principles, team approach, and service philosophy that make the company feel established and trustworthy."
              />
            </Grid>
            <Grid item xs={12} lg={7}>
              <Stack spacing={2.5}>
                {slots.richTextBlocks.map((block) => (
                  <CorporateRichText key={block.id} websiteSectionAdapter={block.adapted} />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </CorporatePageBand>
      ) : null}
      {slots.stats ? (
        <CorporatePageBand tone="clear">
          <CorporateStats websiteSectionAdapter={slots.stats.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.reviews ? (
        <CorporatePageBand tone="navy">
          <CorporateReviews websiteSectionAdapter={slots.reviews.adapted} invert />
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

