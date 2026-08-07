import React from "react";
import { Stack } from "@mui/material";
import { CorporatePageBand } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import { CorporateProblemSelector, CorporateServices } from "../components/CorporateServices";
import CorporateProjectCaseStudy from "../components/CorporateProjectCaseStudy";
import CorporateProcess from "../components/CorporateProcess";
import CorporateReviews from "../components/CorporateReviews";
import CorporateFinalCTA from "../components/CorporateCTA";
import { CorporateFAQ, CorporateFeatureShowcaseSlider } from "../components/CorporateContentBlocks";

export default function CorporateServiceDetailPage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.problemSelector ? (
        <CorporatePageBand tone="warm">
          <CorporateProblemSelector websiteSectionAdapter={slots.problemSelector.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.featureSlider ? (
        <CorporatePageBand tone="clear">
          <CorporateFeatureShowcaseSlider websiteSectionAdapter={slots.featureSlider.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.process ? (
        <CorporatePageBand tone="mist">
          <CorporateProcess websiteSectionAdapter={slots.process.adapted} sticky />
        </CorporatePageBand>
      ) : null}
      {slots.project ? (
        <CorporatePageBand tone="clear">
          <CorporateProjectCaseStudy websiteSectionAdapter={slots.project.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.services ? (
        <CorporatePageBand tone="warm">
          <CorporateServices websiteSectionAdapter={slots.services.adapted} />
        </CorporatePageBand>
      ) : null}
      <Stack spacing={0}>
        {slots.reviews ? (
          <CorporatePageBand tone="navy">
            <CorporateReviews websiteSectionAdapter={slots.reviews.adapted} invert />
          </CorporatePageBand>
        ) : null}
        {slots.faq ? (
          <CorporatePageBand tone="clear">
            <CorporateFAQ websiteSectionAdapter={slots.faq.adapted} />
          </CorporatePageBand>
        ) : null}
      </Stack>
      {slots.finalCta ? (
        <CorporatePageBand tone="mist">
          <CorporateFinalCTA websiteSectionAdapter={slots.finalCta.adapted} />
        </CorporatePageBand>
      ) : null}
    </>
  );
}

