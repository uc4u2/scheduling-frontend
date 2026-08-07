import React from "react";
import { Stack } from "@mui/material";
import { CorporatePageBand } from "./CorporatePagePrimitives";
import { CorporateHero } from "../components/CorporateHero";
import CorporateProjectCaseStudy from "../components/CorporateProjectCaseStudy";
import CorporateFinalCTA from "../components/CorporateCTA";
import { CorporateGallery } from "../components/CorporateContentBlocks";
import { CorporateServices } from "../components/CorporateServices";

export default function CorporateProjectsPage({ model }) {
  const { slots } = model;
  return (
    <>
      {slots.hero ? (
        <CorporatePageBand tone="clear" bleed py={{ xs: 0, md: 0 }}>
          <CorporateHero websiteSectionAdapter={slots.hero.adapted} />
        </CorporatePageBand>
      ) : null}
      <Stack spacing={0}>
        {slots.project ? (
          <CorporatePageBand tone="warm">
            <CorporateProjectCaseStudy websiteSectionAdapter={slots.project.adapted} />
          </CorporatePageBand>
        ) : null}
        {slots.galleries?.map((section, idx) => (
          <CorporatePageBand key={section.id} tone={idx === 0 ? "clear" : "mist"}>
            <CorporateGallery websiteSectionAdapter={section.adapted} />
          </CorporatePageBand>
        ))}
      </Stack>
      {slots.services ? (
        <CorporatePageBand tone="clear">
          <CorporateServices websiteSectionAdapter={slots.services.adapted} />
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
