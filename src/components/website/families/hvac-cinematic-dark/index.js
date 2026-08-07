import React from "react";
import cinematicTokens from "./tokens";
import CinematicHeader from "./components/CinematicHeader";
import CinematicFooter from "./components/CinematicFooter";
import {
  CinematicHero,
  CinematicServices,
  CinematicTrustStrip,
} from "./components/CinematicHero";
import {
  CinematicServiceSelector,
  CinematicStats,
} from "./components/CinematicServices";
import CinematicProjectShowcase from "./components/CinematicProjectShowcase";
import CinematicProcess from "./components/CinematicProcess";
import CinematicReviews from "./components/CinematicReviews";
import {
  CinematicEmergencyCTA,
  CinematicFinalCTA,
} from "./components/CinematicCTA";
import {
  CinematicBookingBar,
  CinematicContact,
  CinematicFeatureShowcaseSlider,
  CinematicFAQ,
  CinematicGallery,
  CinematicLogoCloud,
  CinematicMap,
  CinematicMetricShowcase,
  CinematicRichText,
} from "./components/CinematicContentBlocks";

const withTokens =
  (Component) =>
  function FamilyWrapped(props) {
    return <Component {...props} tokens={cinematicTokens} />;
  };

const familyModule = {
  family: "hvac-cinematic-dark",
  familyVersion: 1,
  defaultMotionProfile: "cinematic",
  tokens: cinematicTokens,
  shell: {
    HeaderComponent: withTokens(CinematicHeader),
    FooterComponent: withTokens(CinematicFooter),
  },
  roleRenderers: {
    "hero.primary": CinematicHero,
    "hero.carousel": CinematicHero,
    "services.slider": CinematicServiceSelector,
    "social_proof.testimonials": CinematicReviews,
    "cta.booking_bar": CinematicFinalCTA,
    "contact.form": CinematicContact,
    "contact.map": CinematicMap,
    "gallery.grid": CinematicGallery,
    "gallery.carousel": CinematicGallery,
    "gallery.video": CinematicGallery,
    "story.video": CinematicProjectShowcase,
    "story.zigzag": CinematicProcess,
  },
  typeRenderers: {
    collectionShowcase: CinematicServices,
    serviceHoverSlider: CinematicServiceSelector,
    pricingTable: CinematicStats,
    richText: CinematicRichText,
    faq: CinematicFAQ,
    logoCloud: CinematicLogoCloud,
    featureShowcaseSlider: CinematicFeatureShowcaseSlider,
    bookingCtaBar: CinematicBookingBar,
    testimonials: CinematicReviews,
    reviewEditorialGrid: CinematicReviews,
    mapEmbed: CinematicMap,
    contactForm: CinematicContact,
    videoStorySplit: CinematicProjectShowcase,
    featureZigzagModern: CinematicProcess,
    gallery: CinematicGallery,
    galleryCarousel: CinematicGallery,
    videoGallery: CinematicGallery,
    cta: CinematicEmergencyCTA,
    teamGrid: CinematicRichText,
    teamMetrics: CinematicStats,
    cultureValues: CinematicProcess,
    processSteps: CinematicProcess,
    blogList: CinematicRichText,
  },
  frame: {
    roleLayoutOverrides: {
      "hero.primary": "full",
      "hero.carousel": "full",
      "story.video": "full",
      "social_proof.testimonials": "full",
      "gallery.grid": "full",
      "gallery.carousel": "full",
      "gallery.video": "full",
    },
    typeLayoutOverrides: {
      collectionShowcase: "full",
      serviceHoverSlider: "full",
      pricingTable: "full",
      testimonials: "full",
      mapEmbed: "full",
    },
    roleGutterOverrides: {
      "hero.primary": 0,
      "hero.carousel": 0,
      "story.video": 0,
      "social_proof.testimonials": 0,
      "gallery.grid": 0,
      "gallery.carousel": 0,
      "gallery.video": 0,
    },
    typeGutterOverrides: {
      collectionShowcase: 0,
      serviceHoverSlider: 0,
      pricingTable: 0,
      testimonials: 0,
      mapEmbed: 0,
    },
  },
};

export default familyModule;
