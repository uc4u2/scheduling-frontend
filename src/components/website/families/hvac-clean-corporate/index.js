import React from "react";
import corporateTokens from "./tokens";
import CorporateHeader from "./components/CorporateHeader";
import CorporateFooter from "./components/CorporateFooter";
import { CorporateHero, CorporateTrustLogos } from "./components/CorporateHero";
import { CorporateBenefits, CorporateServices, CorporateStats } from "./components/CorporateServices";
import CorporateProjectCaseStudy from "./components/CorporateProjectCaseStudy";
import CorporateProcess from "./components/CorporateProcess";
import CorporateReviews from "./components/CorporateReviews";
import CorporateFinalCTA from "./components/CorporateCTA";
import {
  CorporateBookingBar,
  CorporateContact,
  CorporateFAQ,
  CorporateGallery,
  CorporateMap,
  CorporateRichText,
} from "./components/CorporateContentBlocks";

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
  shell: {
    HeaderComponent: withTokens(CorporateHeader),
    FooterComponent: withTokens(CorporateFooter),
  },
  roleRenderers: {
    "hero.primary": CorporateHero,
    "hero.carousel": CorporateHero,
    "services.slider": CorporateBenefits,
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
    serviceHoverSlider: CorporateBenefits,
    pricingTable: CorporateStats,
    richText: CorporateRichText,
    faq: CorporateFAQ,
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
