import React from "react";
import comfortTokens from "./tokens";
import ComfortHeader from "./components/ComfortHeader";
import ComfortFooter from "./components/ComfortFooter";
import { ComfortHero, ComfortTrustRail } from "./components/ComfortHero";
import { ComfortBenefits, ComfortFeatureSlider, ComfortPlans, ComfortProblemSelector, ComfortServiceArea, ComfortServices, ComfortStats } from "./components/ComfortServices";
import ComfortProjectBeforeAfter from "./components/ComfortProjectCaseStudy";
import ComfortProcess from "./components/ComfortProcess";
import ComfortReviews from "./components/ComfortReviews";
import ComfortFinalCTA from "./components/ComfortCTA";
import { ComfortBookingBar, ComfortContact, ComfortFAQ, ComfortGallery, ComfortMap, ComfortRichText } from "./components/ComfortContentBlocks";

const withTokens =
  (Component) =>
  function FamilyWrapped(props) {
    return <Component {...props} tokens={comfortTokens} />;
  };

const familyModule = {
  family: "hvac-home-comfort-modern",
  familyVersion: 1,
  defaultMotionProfile: "comfort",
  tokens: comfortTokens,
  shell: {
    HeaderComponent: withTokens(ComfortHeader),
    FooterComponent: withTokens(ComfortFooter),
  },
  roleRenderers: {
    "hero.primary": ComfortHero,
    "hero.carousel": ComfortHero,
    "services.slider": ComfortProblemSelector,
    "social_proof.testimonials": ComfortReviews,
    "cta.booking_bar": ComfortFinalCTA,
    "contact.form": ComfortContact,
    "contact.map": ComfortMap,
    "gallery.grid": ComfortGallery,
    "gallery.carousel": ComfortGallery,
    "gallery.video": ComfortGallery,
    "story.video": ComfortProjectBeforeAfter,
    "story.zigzag": ComfortProcess,
  },
  typeRenderers: {
    collectionShowcase: ComfortServices,
    serviceHoverSlider: ComfortProblemSelector,
    featureShowcaseSlider: ComfortFeatureSlider,
    pricingTable: ComfortPlans,
    richText: ComfortRichText,
    faq: ComfortFAQ,
    logoCloud: ComfortTrustRail,
    bookingCtaBar: ComfortBookingBar,
    testimonials: ComfortReviews,
    reviewEditorialGrid: ComfortReviews,
    mapEmbed: ComfortServiceArea,
    contactForm: ComfortContact,
    videoStorySplit: ComfortProjectBeforeAfter,
    featureZigzagModern: ComfortProcess,
    gallery: ComfortGallery,
    galleryCarousel: ComfortGallery,
    videoGallery: ComfortGallery,
    cta: ComfortFinalCTA,
    teamGrid: ComfortRichText,
    teamMetrics: ComfortStats,
    cultureValues: ComfortBenefits,
    processSteps: ComfortProcess,
    blogList: ComfortRichText,
    heroSplit: ComfortHero,
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
      serviceHoverSlider: "full",
      featureShowcaseSlider: "full",
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
      serviceHoverSlider: 0,
      featureShowcaseSlider: 0,
      pricingTable: 0,
    },
  },
};

export default familyModule;
