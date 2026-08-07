import React from "react";
import dispatchTokens from "./tokens";
import DispatchHeader from "./components/DispatchHeader";
import DispatchFooter from "./components/DispatchFooter";
import { DispatchHeroWithQuotePanel, DispatchTrustRail } from "./components/DispatchHero";
import { DispatchBenefits, DispatchFeatureSlider, DispatchPlans, DispatchProblemSelector, DispatchServiceArea, DispatchServices, DispatchStats } from "./components/DispatchServices";
import DispatchProject from "./components/DispatchProject";
import DispatchProcessBoard from "./components/DispatchProcess";
import DispatchReviewsTicker from "./components/DispatchReviews";
import { DispatchEmergencyCTA, DispatchFinalCTA } from "./components/DispatchCTA";
import { DispatchBookingBar, DispatchContact, DispatchFAQ, DispatchGallery, DispatchMap, DispatchRichText } from "./components/DispatchContentBlocks";

const withTokens =
  (Component) =>
  function FamilyWrapped(props) {
    return <Component {...props} tokens={dispatchTokens} />;
  };

const familyModule = {
  family: "hvac-bold-dispatch",
  familyVersion: 1,
  defaultMotionProfile: "dispatch",
  tokens: dispatchTokens,
  shell: {
    HeaderComponent: withTokens(DispatchHeader),
    FooterComponent: withTokens(DispatchFooter),
  },
  roleRenderers: {
    "hero.primary": DispatchHeroWithQuotePanel,
    "hero.carousel": DispatchHeroWithQuotePanel,
    "services.slider": DispatchProblemSelector,
    "social_proof.testimonials": DispatchReviewsTicker,
    "cta.booking_bar": DispatchFinalCTA,
    "contact.form": DispatchContact,
    "contact.map": DispatchMap,
    "gallery.grid": DispatchGallery,
    "gallery.carousel": DispatchGallery,
    "gallery.video": DispatchGallery,
    "story.video": DispatchProject,
    "story.zigzag": DispatchProcessBoard,
  },
  typeRenderers: {
    collectionShowcase: DispatchServices,
    serviceHoverSlider: DispatchProblemSelector,
    featureShowcaseSlider: DispatchFeatureSlider,
    pricingTable: DispatchPlans,
    richText: DispatchRichText,
    faq: DispatchFAQ,
    logoCloud: DispatchTrustRail,
    bookingCtaBar: DispatchBookingBar,
    testimonials: DispatchReviewsTicker,
    reviewEditorialGrid: DispatchReviewsTicker,
    mapEmbed: DispatchServiceArea,
    contactForm: DispatchContact,
    videoStorySplit: DispatchProject,
    featureZigzagModern: DispatchProcessBoard,
    gallery: DispatchGallery,
    galleryCarousel: DispatchGallery,
    videoGallery: DispatchGallery,
    cta: DispatchEmergencyCTA,
    teamGrid: DispatchRichText,
    teamMetrics: DispatchStats,
    cultureValues: DispatchBenefits,
    processSteps: DispatchProcessBoard,
    blogList: DispatchRichText,
    heroSplit: DispatchHeroWithQuotePanel,
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
