import React from "react";
import { CorporatePageBand } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import CorporateReviews from "../components/CorporateReviews";
import CorporateFinalCTA from "../components/CorporateCTA";
import { CorporateLogoCloud } from "../components/CorporateContentBlocks";

export default function CorporateReviewsPage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}
      {slots.reviews ? (
        <CorporatePageBand tone="navy">
          <CorporateReviews websiteSectionAdapter={slots.reviews.adapted} invert />
        </CorporatePageBand>
      ) : null}
      {slots.trustRail ? (
        <CorporatePageBand tone="warm">
          <CorporateLogoCloud websiteSectionAdapter={slots.trustRail.adapted} />
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

