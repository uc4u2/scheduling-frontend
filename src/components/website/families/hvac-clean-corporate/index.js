import React from "react";
import corporateTokens from "./tokens";
import CorporateHeader from "./components/CorporateHeader";
import CorporateFooter from "./components/CorporateFooter";
import { CorporateHero, CorporateTrustLogos } from "./components/CorporateHero";
import {
  CorporateBenefits,
  CorporatePlans,
  CorporateProblemSelector,
  CorporateServices,
  CorporateStats,
} from "./components/CorporateServices";
import CorporateProjectCaseStudy from "./components/CorporateProjectCaseStudy";
import CorporateProcess from "./components/CorporateProcess";
import CorporateReviews from "./components/CorporateReviews";
import CorporateFinalCTA from "./components/CorporateCTA";
import {
  CorporateBookingBar,
  CorporateContact,
  CorporateFeatureShowcaseSlider,
  CorporateFAQ,
  CorporateGallery,
  CorporateLogoCloud,
  CorporateMap,
  CorporateMetricShowcase,
  CorporateRichText,
} from "./components/CorporateContentBlocks";
import CorporatePageComposer from "./pages/CorporatePageComposer";
import { isCorporateFlagshipSlug } from "../hvac-shared/canonicalHvacPageModel";

const withTokens =
  (Component) =>
  function FamilyWrapped(props) {
    return <Component {...props} tokens={corporateTokens} />;
  };

const familyModule = {
  family: "hvac-clean-corporate",
  familyVersion: 1,
  defaultMotionProfile: "corporate",
  tokens: corporateTokens,
  pageComposer: CorporatePageComposer,
  supportsPage: (page) => isCorporateFlagshipSlug(page?.slug),
  shell: {
    HeaderComponent: withTokens(CorporateHeader),
    FooterComponent: withTokens(CorporateFooter),
  },
  roleRenderers: {
    "hero.primary": CorporateHero,
    "hero.carousel": CorporateHero,
    "services.slider": CorporateProblemSelector,
    "social_proof.testimonials": CorporateReviews,
    "cta.booking_bar": CorporateFinalCTA,
    "contact.form": CorporateContact,
    "contact.map": CorporateMap,
    "gallery.grid": CorporateGallery,
    "gallery.carousel": CorporateGallery,
    "gallery.video": CorporateGallery,
    "story.video": CorporateProjectCaseStudy,
    "story.zigzag": CorporateProcess,
  },
  typeRenderers: {
    collectionShowcase: CorporateServices,
    serviceHoverSlider: CorporateProblemSelector,
    pricingTable: CorporatePlans,
    richText: CorporateRichText,
    faq: CorporateFAQ,
    logoCloud: CorporateLogoCloud,
    featureShowcaseSlider: CorporateFeatureShowcaseSlider,
    bookingCtaBar: CorporateBookingBar,
    testimonials: CorporateReviews,
    reviewEditorialGrid: CorporateReviews,
    mapEmbed: CorporateMap,
    contactForm: CorporateContact,
    videoStorySplit: CorporateProjectCaseStudy,
    featureZigzagModern: CorporateProcess,
    gallery: CorporateGallery,
    galleryCarousel: CorporateGallery,
    videoGallery: CorporateGallery,
    cta: CorporateFinalCTA,
    teamGrid: CorporateRichText,
    teamMetrics: CorporateStats,
    cultureValues: CorporateProcess,
    processSteps: CorporateProcess,
    blogList: CorporateRichText,
    heroSplit: CorporateHero,
  },
  frame: {
    roleLayoutOverrides: {
      "hero.primary": "full",
      "hero.carousel": "full",
      "gallery.grid": "full",
      "gallery.carousel": "full",
      "gallery.video": "full",
    },
    typeLayoutOverrides: {
      collectionShowcase: "full",
      pricingTable: "full",
    },
    roleGutterOverrides: {
      "hero.primary": 0,
      "hero.carousel": 0,
      "gallery.grid": 0,
      "gallery.carousel": 0,
      "gallery.video": 0,
    },
    typeGutterOverrides: {
      collectionShowcase: 0,
      pricingTable: 0,
    },
  },
};

export default familyModule;
