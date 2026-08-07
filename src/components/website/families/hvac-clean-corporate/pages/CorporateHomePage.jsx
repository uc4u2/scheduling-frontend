import React from "react";
import { Grid, Stack } from "@mui/material";
import { CorporatePageBand, CorporatePageIntro } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import {
  CorporatePlans,
  CorporateProblemSelector,
  CorporateServices,
  CorporateStats,
} from "../components/CorporateServices";
import CorporateProjectCaseStudy from "../components/CorporateProjectCaseStudy";
import CorporateProcess from "../components/CorporateProcess";
import CorporateReviews from "../components/CorporateReviews";
import CorporateFinalCTA from "../components/CorporateCTA";
import {
  CorporateFAQ,
  CorporateFeatureShowcaseSlider,
  CorporateGallery,
  CorporateLogoCloud,
  CorporateMap,
  CorporateRichText,
} from "../components/CorporateContentBlocks";

export default function CorporateHomePage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}

      {slots.trustRail ? (
        <CorporatePageBand tone="warm" withDivider>
          <CorporateLogoCloud websiteSectionAdapter={slots.trustRail.adapted} />
        </CorporatePageBand>
      ) : null}

      {slots.services ? (
        <CorporatePageBand tone="clear">
          <CorporateServices websiteSectionAdapter={slots.services.adapted} />
        </CorporatePageBand>
      ) : null}

      {slots.problemSelector || slots.featureSlider || slots.richTextBlocks?.[0] ? (
        <CorporatePageBand tone="mist">
          <Stack spacing={4}>
            <CorporatePageIntro
              eyebrow={slots.richTextBlocks?.[0]?.props?.title ? "Why choose us" : "Service planning"}
              title={slots.problemSelector?.props?.title || "Find the right path before the system gets worse"}
              body={slots.problemSelector?.props?.subtitle || slots.featureSlider?.props?.subtitle || slots.richTextBlocks?.[0]?.props?.title || ""}
            />
            <Grid container spacing={{ xs: 2.5, md: 3 }}>
              {slots.richTextBlocks?.[0] ? (
                <Grid item xs={12} lg={5}>
                  <CorporateRichText websiteSectionAdapter={slots.richTextBlocks[0].adapted} />
                </Grid>
              ) : null}
              <Grid item xs={12} lg={slots.richTextBlocks?.[0] ? 7 : 12}>
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
          </Stack>
        </CorporatePageBand>
      ) : null}

      {slots.project ? (
        <CorporatePageBand tone="clear">
          <CorporateProjectCaseStudy websiteSectionAdapter={slots.project.adapted} />
        </CorporatePageBand>
      ) : null}

      {slots.process ? (
        <CorporatePageBand tone="warm">
          <CorporateProcess websiteSectionAdapter={slots.process.adapted} sticky />
        </CorporatePageBand>
      ) : null}

      {slots.galleries?.length ? (
        <CorporatePageBand tone="clear">
          <CorporateGallery websiteSectionAdapter={slots.galleries[0].adapted} />
        </CorporatePageBand>
      ) : null}

      {slots.plans ? (
        <CorporatePageBand tone="mist">
          <Stack spacing={3}>
            <CorporatePageIntro
              eyebrow="Membership and maintenance"
              title={slots.plans.props?.title || "Plans made simple"}
              body={slots.plans.props?.subtitle || "Show maintenance tiers, seasonal care, and repeat-service options without turning the page into a pricing table."}
            />
            <CorporatePlans websiteSectionAdapter={slots.plans.adapted} />
          </Stack>
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

      {slots.map ? (
        <CorporatePageBand tone="warm">
          <CorporateMap websiteSectionAdapter={slots.map.adapted} />
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
