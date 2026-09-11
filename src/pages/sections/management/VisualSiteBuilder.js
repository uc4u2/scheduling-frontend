// src/pages/sections/management/VisualSiteBuilder.js

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useDeferredValue,
  useRef,
} from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Select,
  Snackbar,
  MenuItem,
  FormHelperText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ButtonBase,
  Menu,
  Slider,
  Tab,
  Tabs,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import PublishIcon from "@mui/icons-material/Publish";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"; // NEW
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaletteIcon from "@mui/icons-material/Palette";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import VisibilityIcon from "@mui/icons-material/Visibility";
import OpenWithIcon from "@mui/icons-material/OpenWith";

import { nanoid } from "nanoid";
import { Link as RouterLink, useLocation } from "react-router-dom";

import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@mui/material/styles";

import { api, wb, navSettings, publicSite } from "../../../utils/api";
import { NAV_STYLE_DEFAULT, normalizeNavStyle } from "../../../utils/navStyle";
import { RenderSections } from "../../../components/website/RenderSections";
import SiteFrame from "../../../components/website/SiteFrame";
import useCompanyId from "../../../hooks/useCompanyId";
import useHistory from "../../../hooks/useHistory";
import { parsePositiveCompanyId } from "../../../utils/authedCompany";
import WebsiteNavSettingsCard from "../../../components/website/WebsiteNavSettingsCard";
import WebsiteBrandingCard from "../../../components/website/WebsiteBrandingCard";
import { formatCompanyProfileAddress } from "../../../utils/footerDefaults";
import WebsiteContactFormEditor from "../../../components/website/WebsiteContactFormEditor";
import NavStyleHydrator from "../../../components/website/NavStyleHydrator";

/** Floating + Inline inspectors and schema registry */
import {
  FloatingInspector,
  useFloatingInspector,
} from "../../../components/website/FloatingInspector";
import { InlineStickyInspector } from "../../../components/website/InlineStickyInspector";
import { SCHEMA_REGISTRY } from "../../../components/website/schemas";
import SchemaInspector from "../../../components/website/SchemaInspector";

/** Moved out pieces */
import SectionInspector, { ImageField } from "../../../components/website/BuilderInspectorParts";
import { NEW_BLOCKS } from "../../../components/website/BuilderBlockTemplates";
import {
  emptyPage,
  normalizePage,
  safeSections,
} from "../../../components/website/BuilderPageUtils";
import {
  candidateSemanticFieldPaths,
  createIronEmberProjectGalleryModule,
  createSemanticModule,
  inferPageKind,
  normalizeSemanticFieldPath,
  normalizeSemanticModules,
  normalizePageContent,
  normalizeSemanticModuleMediaReferences,
  sanitizeNextJsEditableText,
  upgradeLegacyIronEmberProjectGallery,
  withNormalizedModules,
} from "../../../utils/websiteSemanticModules";
import { getProfessionHomeBlueprint } from "../../../utils/professionHomeBlueprints";
import {
  FORGE_MOTION_CONTACT_STARTER_VERSION,
  upgradeForgeMotionContactModules,
} from "../../../utils/forgeMotionContactBlueprint";
import {
  FORGE_MOTION_HOME_STARTER_VERSION,
  upgradeLegacyForgeMotionHomeModules,
} from "../../../utils/forgeMotionHomeBlueprint";
import {
  FORGE_MOTION_PAGE_STARTER_VERSION,
  upgradeForgeMotionMarketingPage,
} from "../../../utils/forgeMotionPageBlueprint";
import {
  createWebsiteBlogPostPage,
  slugifyWebsiteArticle,
} from "../../../utils/websiteBlogBlueprint";
import {
  getCompatibleModuleChoices,
  getThemeModuleDisplayLabel,
  getPageManifest,
  resolveFallbackSlot,
  WEBSITE_THEME_MODULE_MANIFESTS,
} from "../../../utils/websiteThemeModules";
import {
  buildThemeOverridesFromPreset,
  NEXTJS_THEME_OVERRIDE_FIELDS,
  resolveNextJsPageStyleCapabilities,
  sanitizeThemeOverrideDraft,
} from "../../../utils/websiteThemeOverrides";
import {
  defaultHeaderConfig,
  defaultFooterConfig,
  normalizeHeaderConfig,
  normalizeFooterConfig,
} from "../../../utils/headerFooter";

/** Theme designer (drawer content) */
import ThemeDesigner from "../../../components/website/ThemeDesigner";
import { SearchSnippetPreview, SocialCardPreview } from "../../../components/seo/SeoPreview";
import { clampWebsiteRadius, toWebsiteRadiusPx } from "../../../utils/websiteRadius";
import {
  buildNextJsPreviewUrl,
  buildWebsiteStyleChoices,
  hasConfiguredNextJsThemeBaseUrl,
  isNextJsStyle,
  NEXTJS_THEME_PREVIEW_CONFIG_ERROR,
  shouldProvisionNextPublicBuilderPages,
  TENANT_WEB_NEXT_BASE_URL,
} from "./websiteCatalogUi";
import {
  buildPublishedWebsiteUrl,
  getPublishedRendererSelection,
} from "../../../utils/publicWebsite";
import {
  CHECKPOINT_EXCLUDED_ITEMS,
  CHECKPOINT_INCLUDED_ITEMS,
  checkpointCounts,
  checkpointKindLabel,
  checkpointPublishBlocked,
  formatCheckpointTimestamp,
  validateApprovedCheckpointName,
} from "../../../utils/websiteCheckpointHistory";
import {
  getBuilderTabDefaultIndex,
  buildWebsiteStyleApplyPayload,
  isNextJsBuilderMode,
  usesDockedSemanticInspector,
  isAcceptedPreviewMessage,
  normalizeNextJsPreviewPagePath,
  normalizePreviewPagePath,
  requiresRendererSwitchConfirmation,
  resolveBuilderRendererMode,
} from "./websiteStyleBridge";

/** UI wrappers per design system */
import SectionCard from "../../../components/ui/SectionCard";
import TabShell from "../../../components/ui/TabShell";

/** Enterprise “Easy” panel – default export only */
 //import EnterpriseEditorExtras from "../../../components/website/EnterpriseEditorExtras";

import WebsiteBuilderHelpDrawer from "./WebsiteBuilderHelpDrawer"; // NEW
import NextJsWebsiteStyleBrowser from "./NextJsWebsiteStyleBrowser";

const FORGE_DEFAULT_ADDITIONAL_HERO_SLIDE = Object.freeze({
  id: "forge-hero-slide-2",
  eyebrow: "Coached movement",
  heading: "Train with purpose. Move with confidence.",
  subheading: "A second cinematic story for another training path, coach, or studio atmosphere.",
  image: "",
  imageUrl: "",
  imageAlt: "A cinematic second training scene featuring purposeful coached movement.",
  imagePosition: { x: 50, y: 50 },
  posterImage: "",
  primaryCta: { label: "View training options", href: "/services" },
  secondaryCta: { label: "Meet the coaches", href: "/about" },
});

const BLOCK_PREVIEWS = {
  hero: "/block-previews/hero.png",
  heroCarousel: "/block-previews/heroCarousel.png",
  heroSplit: "/block-previews/heroSplit.png",
  videoStorySplit: "/block-previews/heroSplit.png",
  text: "/block-previews/text.png",
  richText: "/block-previews/richText.png",
  gallery: "/block-previews/gallery.png",
  photoGallery: "/block-previews/photoGallery.png",
  collectionShowcase: "/block-previews/collectionShowcase.png",
  featureZigzagModern: "/block-previews/featureZigzagModern.png",
  discoverStory: "/block-previews/discoverStory.png",
  logoCloud: "/block-previews/logoCloud.png",
  workshopsCommissions: "/block-previews/workshopsCommissions.png",
  pricingTableModern: "/block-previews/workshopsCommissions.png",
  textFree: "/block-previews/textFree.png",
  galleryCarousel: "/block-previews/galleryCarousel.png",
  faq: "/block-previews/faq.png",
  faqModern: "/block-previews/faq.png",
  serviceGrid: "/block-previews/serviceGrid.png",
  serviceHoverSlider: "/website-builder/section-thumbs/service-hover-slider.svg",
  reviewEditorialGrid: "/website-builder/section-thumbs/review-editorial-grid.svg",
  teamGrid: "/block-previews/teamGrid.png",
  contact: "/block-previews/contact.png",
  contactForm: "/block-previews/contactForm.png",
  contactFormEditorialSplit: "/block-previews/contactForm.png",
  popupCta: "/block-previews/cta.png",
  cta: "/block-previews/cta.png",
  pricingTable: "/block-previews/workshopsCommissions.png",
  bookingCtaBar: "/block-previews/bookingCtaBar.png",
  footer: "/block-previews/footer.png",
  stats: "/website-builder/section-thumbs/stats-band.png",
  mapEmbed: "/website-builder/section-thumbs/map-embed-split.svg",
};

const SECTION_TYPE_THUMBNAILS = {
  stats: "/website-builder/section-thumbs/stats-band.png",
  mapEmbed: "/website-builder/section-thumbs/map-embed-split.svg",
  serviceHoverSlider: "/website-builder/section-thumbs/service-hover-slider.svg",
  reviewEditorialGrid: "/website-builder/section-thumbs/review-editorial-grid.svg",
  popupCta: "/block-previews/cta.png",
};
/** Local shims so the app renders even if helpers aren’t exported yet */
const CollapsibleSection = ({
  id,
  title,
  description,
  actions,
  children,
  defaultExpanded = false,
  expanded,
  onChange,
}) => {
  const accordionProps =
    typeof expanded === "boolean"
      ? { expanded }
      : { defaultExpanded };

  return (
  <Accordion
    disableGutters
    id={id}
    {...accordionProps}
    sx={{
      borderRadius: 1,
      border: (theme) => `1px solid ${theme.palette.divider}`,
      boxShadow: "none",
      overflow: "hidden",
      "&:before": { display: "none" },
    }}
    onChange={(event, next) => onChange?.(next, event)}
  >
    <AccordionSummary
      expandIcon={<ExpandMoreIcon />}
      sx={{ px: 3, py: 2 }}
    >
      <Box sx={{ flexGrow: 1, pr: actions ? 2 : 0 }}>
        {title ? (
          typeof title === "string" ? (
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
          ) : (
            title
          )
        ) : null}
        {description ? (
          typeof description === "string" ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : (
            description
          )
        ) : null}
      </Box>
      {actions ? (
        <Box
          sx={{ ml: 2, display: "flex", alignItems: "center", gap: 1 }}
          onClick={(event) => event.stopPropagation()}
          onFocus={(event) => event.stopPropagation()}
        >
          {actions}
        </Box>
      ) : null}
    </AccordionSummary>
    <AccordionDetails sx={{ px: 3, py: 2 }}>
      {children}
    </AccordionDetails>
  </Accordion>
  );
};

/* ---------- Constants ---------- */
const LAB_LS_KEY = "layout_tuning_lab_v1";

/* ---------- Small utils ---------- */

// --- PageStyle (SECTION-BASED) helpers ---
const nanoOrShortId = () =>
  (typeof nanoid === "function" ? nanoid(8) : Math.random().toString(36).slice(2, 10));

const findPageStyleBlock = (page) =>
  (page?.content?.sections || []).find((s) => s?.type === "pageStyle");

const readPageStyleProps = (page) => {
  const blk = findPageStyleBlock(page);
  return blk?.props ? JSON.parse(JSON.stringify(blk.props)) : null;
};

const writePageStyleProps = (page, props) => {
  const next = JSON.parse(JSON.stringify(page || {}));
  const sections = Array.isArray(next?.content?.sections) ? [...next.content.sections] : [];
  const idx = sections.findIndex((s) => s?.type === "pageStyle");
  const id = idx >= 0 && sections[idx]?.id ? sections[idx].id : nanoOrShortId();
  const block = { id, type: "pageStyle", props: { ...props }, sx: sections[idx]?.sx || { py: 0 } };
  if (idx >= 0) sections[idx] = block; else sections.unshift(block);
  next.content = { ...(next.content || {}), sections };
  return next;
};


const safeUid = () => Math.random().toString(36).slice(2, 10);
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ---------- Helpers: layout compat shim ---------- */
const withLiftedLayout = (p) => {
  const layout = p?.layout ?? p?.content?.meta?.layout ?? "boxed";
  const content = p?.content || {};
  const meta = content.meta || {};
  return { ...p, layout, content: { ...content, meta: { ...meta, layout } } };
};

const serializePage = (p) => {
  const content = normalizePageContent(p?.content || {});
  const meta = content.meta || {};
  const layout = p?.layout ?? meta.layout ?? "boxed";
  const nextPage = {
    ...p,
    content: { ...content, meta: { ...meta, layout } },
  };
  return withNormalizedModules({ ...nextPage, layout });
};

const buildCanonicalUrl = (page, canonicalBase, fallbackBase) => {
  const base = (canonicalBase || fallbackBase || "").replace(/\/$/, "");
  if (!base) return "";
  const override = (page?.canonical_path || "").trim();
  if (override.startsWith("http://") || override.startsWith("https://")) return override;
  if (override.startsWith("/") || override.startsWith("?")) return `${base}${override}`;
  if (override) return `${base}/${override.replace(/^\/+/, "")}`;
  const slug = (page?.slug || "").trim();
  if (page?.is_homepage || slug.toLowerCase() === "home") return base;
  if (page?.path) {
    const path = page.path.startsWith("/") ? page.path : `/${page.path}`;
    return `${base}${path}`;
  }
  if (!slug) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}page=${encodeURIComponent(slug)}`;
};

const ensureSectionIds = (page) => {
  const sections = safeSections(page).map((s) =>
    s?.id ? s : { ...s, id: uid() }
  );
  return withNormalizedModules(withLiftedLayout({
    ...page,
    content: { ...normalizePageContent(page.content || {}), sections },
  }));
};

const safeModules = (page) => normalizeSemanticModules(page || {});

const LEGACY_REVIEWS_PAGE_SLUG = "reviews";

// Next public list pages use the same persisted WebsitePage model as Contact
// and the other Builder pages. Detail layouts stay in Advanced Management and
// are deliberately not represented by WebsitePage rows.
const NEXT_PUBLIC_BUILDER_PAGE_TARGETS = [
  { key: "services", slug: "services", title: "Services", show_in_menu: true },
  { key: "products", slug: "products", title: "Products", show_in_menu: true },
  { key: "reviews", slug: "reviews", title: "Reviews", show_in_menu: true },
  { key: "jobs", slug: "jobs", title: "Jobs", show_in_menu: true },
  { key: "about", slug: "about", title: "About", show_in_menu: true },
  { key: "contact", slug: "contact", title: "Contact", show_in_menu: true },
  { key: "blog", slug: "blog", title: "Blog", show_in_menu: true },
  { key: "service-areas", slug: "locations", title: "Locations", show_in_menu: true },
];

// These are editable starter content for a WebsitePage-owned testimonial
// section. They are not Review records and never replace the published review
// workspace; managers can replace or remove every item in the Builder.
const REVIEW_EDITORIAL_STARTERS = [
  { id: "testimonial-1", title: "Alyssa M.", role: "Verified client", body: "Clear communication, thoughtful care, and an experience that felt considered from start to finish.", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop", imageAlt: "Client review highlight one" },
  { id: "testimonial-2", title: "Daniel R.", role: "Verified client", body: "Every detail had a purpose, and the result made the next step feel simple and confident.", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=1200&auto=format&fit=crop", imageAlt: "Client review highlight two" },
  { id: "testimonial-3", title: "Priya S.", role: "Verified client", body: "The process was calm, organized, and tailored to exactly what I needed.", image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1200&auto=format&fit=crop", imageAlt: "Client review highlight three" },
  { id: "testimonial-4", title: "Marcus T.", role: "Returning client", body: "A polished experience with a result I would gladly recommend to friends and family.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop", imageAlt: "Client review highlight four" },
];

const makeNextPublicBuilderModules = (entry) => {
  const page = { slug: entry.slug, title: entry.title };
  const intro = (heading, introText, body) => ({
    ...createSemanticModule("richText", page, `${entry.key}.intro`),
    content: {
      heading,
      intro: introText,
      body,
      image: "",
      imageUrl: "",
      imageAlt: "",
      primaryCta: { label: "", href: "" },
    },
  });
  const cta = (heading, label, href) => ({
    ...createSemanticModule("cta", page, `${entry.key}.supporting`),
    content: {
      heading,
      body: "",
      backgroundImage: "",
      primaryCta: { label, href },
    },
  });

  if (entry.key === "services") {
    return [
      intro("The service menu.", "Choose a service, then make it your own.", "Current pricing, duration, and booking remain connected to Schedulaa Services."),
      { ...createSemanticModule("services", page, "services.list"), content: { heading: "Made for you.", intro: "", source: "operational" } },
      cta("Find your next appointment.", "Book now", "/services"),
    ];
  }
  if (entry.key === "products") {
    return [
      intro("The product collection.", "Explore products available from this business.", "Product details, availability, and purchase continue through the existing commerce flow."),
      cta("Find the right product.", "Explore products", "/products"),
    ];
  }
  if (entry.key === "jobs") {
    return [
      intro("Join the team.", "Explore current opportunities.", "Role details and applications remain connected to the existing jobs workspace and application flow."),
      cta("See open roles.", "View opportunities", "/jobs"),
    ];
  }
  if (entry.key === "reviews") {
    return [
      {
        ...createSemanticModule("reviews", page, "reviews.list"),
        content: {
          heading: "What clients are saying",
          intro: "Use this editable testimonial section to feature client stories alongside published reviews.",
          reviewCountLabel: "Rated 5 stars by recent clients",
          platformLabel: "Client reviews",
          source: "marketing",
          items: REVIEW_EDITORIAL_STARTERS,
        },
      },
    ];
  }
  if (entry.key === "about") {
    return [
      intro("The people behind the work.", "A clear introduction to the organization, its purpose, and the people visitors will meet.", "Tell the story of the organization, the values behind its work, and what people can expect."),
      {
        ...createSemanticModule("richText", page, "about.story"),
        content: { eyebrow: "Our story", heading: "Built around people and purpose.", intro: "A thoughtful point of view, carried through every interaction.", body: "Use this section to explain the organization's approach, purpose, and values.", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85", imageUrl: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=85", imageAlt: "People gathering and connecting outdoors" },
      },
      {
        ...createSemanticModule("team", page, "about.team"),
        content: { eyebrow: "Our people", heading: "Meet the team.", intro: "Introduce the people visitors will meet.", items: [
          { id: "about-team-1", title: "Team member", role: "Leadership", bio: "Add a short biography, area of responsibility, and point of view.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85", imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=85", imageAlt: "Professional team member portrait" },
          { id: "about-team-2", title: "Team member", role: "Community & Client Support", bio: "Add a short biography, area of responsibility, and point of view.", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=85", imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1200&q=85", imageAlt: "Professional team member portrait" },
        ] },
      },
      {
        ...createSemanticModule("process", page, "about.story"),
        content: { eyebrow: "What to expect", heading: "A clear way of working.", intro: "Make the experience easy to understand before someone gets in touch.", items: [
          { id: "about-process-1", title: "Listen", body: "Begin with each person's needs, questions, and priorities." },
          { id: "about-process-2", title: "Plan", body: "Create a clear next step shaped around the situation." },
          { id: "about-process-3", title: "Support", body: "Follow through with practical guidance and thoughtful care." },
        ] },
      },
      cta("Ready to take the next step?", "Contact us", "/contact"),
    ].map((module) => module.slot?.endsWith(".supporting") ? { ...module, slot: "about.reviews" } : module);
  }
  if (entry.key === "contact") {
    return [
      intro("Start with the conversation.", "Share what you are looking for and the studio will guide the next step.", "Use the contact details, form, map, and booking link below."),
      { ...createSemanticModule("contactDetails", page, "contact.details"), content: { eyebrow: "Contact", heading: "Studio details.", intro: "Phone, email, and address continue to use the shared business contact settings.", items: [] } },
      { ...createSemanticModule("hoursLocation", page, "contact.hours"), content: { eyebrow: "Hours", heading: "Studio rhythm.", intro: "Update these hours to match the studio schedule.", items: [
        { id: "contact-hours-weekday", title: "Tuesday — Friday", body: "10:00 AM — 7:00 PM" },
        { id: "contact-hours-saturday", title: "Saturday", body: "9:00 AM — 5:00 PM" },
        { id: "contact-hours-closed", title: "Sunday — Monday", body: "Closed" },
      ] } },
      { ...createSemanticModule("contactForm", page, "contact.form"), content: { heading: "Send a studio note.", intro: "The existing Website Form below controls the actual fields and success response.", formKey: "contact", submitLabel: "Send message" } },
      { ...createSemanticModule("map", page, "contact.map"), content: { heading: "Find the studio", intro: "", address: "", query: "", embedUrl: "", primaryCta: { label: "Open directions", href: "" } } },
      { ...createSemanticModule("bookingCta", page, "contact.booking"), content: { eyebrow: "Next step", heading: "Prefer to choose a service first?", body: "Browse the service menu and continue through the existing booking flow.", primaryCta: { label: "View services", href: "/services" } } },
    ];
  }
  if (entry.key === "blog") {
    return [
      intro("Studio journal.", "Notes on craft, care, and the routine between visits.", "Use this page for editable studio stories and useful client guidance."),
      {
        ...createSemanticModule("featureStory", page, "blog.primaryContent"),
        content: { eyebrow: "Field notes", heading: "From the studio.", intro: "Short, useful stories tenants can replace or reorder.", body: "", image: "", imageUrl: "", imageAlt: "", items: [
          { id: "journal-1", title: "The consultation comes first.", body: "Explain how a useful consultation shapes the service and the finish.", image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=85", imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=85", imageAlt: "Barber consulting with a client in the chair" },
          { id: "journal-2", title: "Texture that settles well.", body: "Share practical guidance for shape, texture, and the days between visits.", image: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=85", imageUrl: "https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&w=1200&q=85", imageAlt: "Barber finishing a haircut with scissors" },
          { id: "journal-3", title: "A cleaner everyday routine.", body: "Add aftercare, product, or styling notes clients can use at home.", image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85", imageUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85", imageAlt: "Final styling in a dark editorial barbershop" },
        ] },
      },
      { ...createSemanticModule("cta", page, "blog.finalCta"), content: { eyebrow: "Ready when you are", heading: "Put the notes into practice.", body: "Choose a service and continue through the established booking experience.", primaryCta: { label: "View services", href: "/services" } } },
    ];
  }
  if (entry.key === "service-areas") {
    return [
      intro("Find the studio.", "Location details, coverage, and the easiest way to plan a visit.", "The map and shared business contact details remain available on the Contact page."),
      { ...createSemanticModule("serviceAreas", page, "generic.primaryContent"), content: { eyebrow: "Locations", heading: "Where to find us.", intro: "Add, remove, and reorder the locations or service areas shown here.", items: [] } },
    ];
  }
  return [];
};

const hasMeaningfulEditorialReviewItems = (module) =>
  Array.isArray(module?.content?.items) &&
  module.content.items.some((item) =>
    [item?.title, item?.author, item?.body, item?.quote, item?.image, item?.imageUrl]
      .some((value) => String(value || "").trim())
  );

// A short-lived pre-semantic Reviews implementation created a reviews.list
// module with empty repeater rows while displaying canonical Review records.
// Those rows have no manager content to preserve, so upgrade them to the same
// four editable starters that brand-new Reviews pages receive. This is a
// one-time repair of a broken composition, not a replacement for real Review
// workspace records or a mutation of already-authored testimonial content.
const seedBlankReviewsEditorialModule = (page) => {
  const modules = safeModules(page);
  const existing = modules.find(
    (module) => module?.type === "reviews" && module?.slot === "reviews.list"
  );
  if (existing && hasMeaningfulEditorialReviewItems(existing)) return page;

  const starter = makeNextPublicBuilderModules(
    NEXT_PUBLIC_BUILDER_PAGE_TARGETS.find((target) => target.key === "reviews")
  )[0];
  const nextModules = existing
    ? modules.map((module) =>
        module?.id === existing.id
          ? {
              ...module,
              type: "reviews",
              slot: "reviews.list",
              content: { ...module.content, ...starter.content },
            }
          : module
      )
    : [...modules, starter];

  return {
    ...page,
    content: {
      ...normalizePageContent(page?.content || {}),
      modules: nextModules,
    },
  };
};

const makeNextPublicBuilderPage = (entry, pagesList = []) => ({
  slug: entry.slug,
  path: entry.slug,
  title: entry.title,
  menu_title: entry.title,
  show_in_menu: entry.show_in_menu,
  sort_order:
    (pagesList || []).reduce(
      (max, page) => Math.max(max, Number(page?.sort_order || 0)),
      0
    ) + 1,
  published: true,
  is_homepage: false,
  content: {
    sections: [],
    modules: makeNextPublicBuilderModules(entry),
    meta: { layout: "boxed" },
  },
});

const findNextPublicBuilderPage = (pagesList, entry) => {
  const pages = pagesList || [];
  const preferredSlugs = {
    services: ["services-classic", "services"],
    products: ["products"],
    reviews: ["reviews"],
    jobs: ["jobs"],
    about: ["about-us", "about", "our-team"],
    contact: ["contact", "request-quote", "request-service"],
    blog: ["blog", "journal", "news"],
    "service-areas": ["locations", "service-areas"],
  }[entry.key] || [entry.slug];
  for (const slug of preferredSlugs) {
    const exact = pages.find((page) => String(page?.slug || "").trim().toLowerCase() === slug);
    if (exact) return exact;
  }
  return pages.find((page) => {
    const kind = inferPageKind(page);
    return kind === entry.key;
  });
};

const completeIronEmberContactModules = (page, modules, starters) => {
  const nextModules = [...modules];
  const legacyMap = safeSections(page).find((section) => section?.type === "mapEmbed");
  const mapProps = legacyMap?.props || {};
  const detailItems = [
    { id: "legacy-contact-location", title: mapProps.detailOneTitle, body: mapProps.detailOneText },
    { id: "legacy-contact-direct", title: mapProps.detailThreeTitle, body: mapProps.detailThreeText },
  ].filter((item) => String(item.title || item.body || "").trim());
  const hourItems = String(mapProps.detailTwoTitle || mapProps.detailTwoText || "").trim()
    ? [{ id: "legacy-contact-hours", title: mapProps.detailTwoTitle || "Studio hours", body: mapProps.detailTwoText || "" }]
    : [];

  const appendMissing = (type, patchContent = {}) => {
    if (nextModules.some((module) => module.type === type)) return;
    const starter = starters.find((module) => module.type === type);
    if (!starter) return;
    nextModules.push({ ...starter, content: { ...starter.content, ...patchContent } });
  };

  appendMissing("contactDetails", {
    heading: mapProps.title || "Studio details.",
    intro: mapProps.body || "Phone, email, and address continue to use the shared business contact settings.",
    items: detailItems,
  });
  appendMissing("hoursLocation", {
    heading: mapProps.detailTwoTitle || "Studio rhythm.",
    intro: "",
    items: hourItems,
  });
  appendMissing("contactForm");
  appendMissing("map");
  appendMissing("bookingCta");

  return nextModules.map((module) => {
    if (module.type !== "map") return module;
    const address = String(module.content?.address || mapProps.detailOneText || "").trim();
    return {
      ...module,
      content: {
        ...module.content,
        address,
        query: String(module.content?.query || address || "").trim(),
      },
    };
  });
};

const parseLegacyPageSlugFromHref = (href) => {
  const raw = String(href || "").trim().toLowerCase();
  if (!raw) return "";
  if (raw.includes("?page=reviews") || raw.endsWith("/reviews")) return "reviews";
  return "";
};

const readNavOverridesFromSettings = (settingsObj) =>
  settingsObj?.nav_overrides ||
  settingsObj?.settings?.nav_overrides ||
  {};

const readHeaderFromSettings = (settingsObj) =>
  settingsObj?.header ||
  settingsObj?.settings?.header ||
  defaultHeaderConfig();

const shouldEnsureLegacyReviewsPage = (settingsObj, pagesList) => {
  const nav = readNavOverridesFromSettings(settingsObj);
  const header = readHeaderFromSettings(settingsObj);
  const pageSlug = String(nav?.reviews_page_slug || LEGACY_REVIEWS_PAGE_SLUG)
    .trim()
    .toLowerCase();
  const hasPage = (pagesList || []).some(
    (page) => String(page?.slug || "").trim().toLowerCase() === pageSlug
  );
  if (hasPage) return null;

  const manualNavHasReviews = Array.isArray(header?.nav_items)
    ? header.nav_items.some((item) => parseLegacyPageSlugFromHref(item?.href) === pageSlug)
    : false;
  const syntheticReviewsEnabled = nav?.show_reviews_tab !== false;

  if (!syntheticReviewsEnabled && !manualNavHasReviews) return null;
  return {
    slug: pageSlug,
    title: nav?.reviews_tab_label || "Reviews",
    menu_title: nav?.reviews_tab_label || "Reviews",
    show_in_menu: true,
    sort_order:
      ((pagesList || []).reduce(
        (max, page) => Math.max(max, Number(page?.sort_order ?? 0)),
        0
      ) || 0) + 1,
    published: true,
    is_homepage: false,
    content: {
      sections: [
        {
          id: uid(),
          type: "richText",
          props: {
            title: nav?.reviews_tab_label || "Reviews",
            body: "<p>This legacy reviews page was restored so it can be managed from the website builder like a normal page.</p>",
            align: "center",
          },
          sx: { py: 8 },
        },
      ],
      meta: { layout: "full" },
    },
  };
};


/** Deep clone + scrub linkages */
function makeIndependentClone(src) {
  const clone = JSON.parse(JSON.stringify(src || {}));
  clone.id = safeUid();
  clone.props = { ...(clone.props || {}) };
  delete clone.props?.bindId;
  delete clone.props?.blockId;
  delete clone.props?.sectionId;
  delete clone.props?.anchor;
  if (clone.props?.dataSource) {
    const { url, pick } = clone.props.dataSource;
    clone.props.dataSource = { url, pick };
  }
  delete clone.runtime;
  delete clone._cache;
  return clone;
}

/* ---------- PageStyle defaults (NEW) ---------- */
const defaultPageStyleBlock = () => ({
  id: nanoid(8),
  type: "pageStyle",
  props: {
    backgroundColor: "#f6f7fb",
    secondaryBackground: "",
    backgroundImage: "",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    overlayColor: "#000000",
    overlayOpacity: 0,
    contentMaxWidth: "lg",
    gutterX: 24,
  },
  sx: { py: 0 },
});

/* ---------- Navigation settings helpers ---------- */
const deriveNavDraft = (styleSource) => {
  if (!styleSource) return null;
  const source = styleSource || {};
  const style = normalizeNavStyle(
    source?.nav_style || source?.settings?.nav_style || source
  );
  const overrides =
    source?.nav_overrides ||
    source?.settings?.nav_overrides ||
    {};
  return { nav_style: style, nav_overrides: { ...(overrides || {}) } };
};

const mergeNavIntoSettings = (current, draft) => {
  if (!draft?.nav_style && !draft?.nav_overrides) return current;
  const style = draft?.nav_style ? normalizeNavStyle(draft.nav_style) : null;
  const overrides = draft?.nav_overrides ? { ...(draft.nav_overrides || {}) } : null;
  const base = current ? { ...current } : {};
  return {
    ...base,
    ...(style ? { nav_style: style } : {}),
    ...(overrides ? { nav_overrides: overrides } : {}),
    settings: {
      ...(base.settings || {}),
      ...(style ? { nav_style: style } : {}),
      ...(overrides ? { nav_overrides: overrides } : {}),
    },
  };
};

const defaultSiteThemeSettings = () => ({
  syncChrome: true,
  themePresetKey: "",
  industryStarterPackKey: "",
  headerModeKey: "",
  buttonStylePresetKey: "",
});

const readSiteThemeSettings = (settingsObj) => {
  const source =
    settingsObj?.site_theme ||
    settingsObj?.settings?.site_theme ||
    {};
  return {
    ...defaultSiteThemeSettings(),
    ...(source || {}),
    syncChrome:
      source?.syncChrome === undefined
        ? true
        : Boolean(source.syncChrome),
  };
};

const mergeSiteThemeIntoSettings = (current, patch) => {
  const base = current ? { ...current } : {};
  const nextSiteTheme = {
    ...readSiteThemeSettings(base),
    ...(patch || {}),
  };
  return {
    ...base,
    site_theme: nextSiteTheme,
    settings: {
      ...(base.settings || {}),
      site_theme: nextSiteTheme,
    },
  };
};

const THEME_PRESET_LIBRARY = [
  {
    key: "blush-spa",
    label: "Blush Spa",
    description: "Ivory, blush, and rose for medspa, salon, and beauty brands.",
    accent: "#c85d7c",
    pageStyle: {
      backgroundColor: "#fff7f8",
      secondaryBackground:
        "linear-gradient(135deg, #fff4f6 0%, #f7d7df 52%, #e9b7c6 100%)",
      overlayColor: "#f0e6e9",
      overlayOpacity: 0.8,
      headingColor: "#4a2331",
      bodyColor: "rgba(74,35,49,0.78)",
      linkColor: "#c85d7c",
      cardColor: "#ffffff",
      cardOpacity: 0.84,
      cardBg: "rgba(255,255,255,0.84)",
      cardRadius: 22,
      cardBlur: 0,
      cardShadow: "0 24px 60px rgba(124,72,92,0.14)",
      btnBg: "#c85d7c",
      btnColor: "#fffafc",
      btnRadius: 8,
      heroHeadingShadow: "0 18px 48px rgba(118,73,93,0.14)",
    },
    header: {
      bg: "#f7d7df",
      text_color: "#4a2331",
      transparent_bg: "rgba(255, 244, 246, 0.36)",
      scrolled_bg: "rgba(255, 244, 246, 0.82)",
      scrolled_text_color: "#4a2331",
    },
    footer: {
      bg: "#5a2b39",
      text_color: "#fff7f8",
      link_color: "#f7d7df",
    },
    navStyle: {
      bg: "#c85d7c",
      bg_hover: "#b74b6c",
      text: "#fffafc",
      text_hover: "#fffafc",
      active_bg: "rgba(255,255,255,0.42)",
      active_text: "#8f4058",
      shadow: "0 18px 34px rgba(200,93,124,0.24)",
    },
  },
  {
    key: "champagne-luxe",
    label: "Champagne Luxe",
    description: "Warm ivory and champagne with a premium neutral accent.",
    accent: "#b98a50",
    pageStyle: {
      backgroundColor: "#fffaf2",
      secondaryBackground:
        "linear-gradient(135deg, #fffdf8 0%, #f5e7d2 50%, #ecd0ab 100%)",
      overlayColor: "#f3eadf",
      overlayOpacity: 0.7,
      headingColor: "#4f3422",
      bodyColor: "rgba(79,52,34,0.76)",
      linkColor: "#b98a50",
      cardColor: "#ffffff",
      cardOpacity: 0.9,
      cardBg: "rgba(255,255,255,0.9)",
      cardRadius: 18,
      cardBlur: 0,
      cardShadow: "0 20px 54px rgba(121,93,58,0.14)",
      btnBg: "#b98a50",
      btnColor: "#fffaf2",
      btnRadius: 6,
      heroHeadingShadow: "0 14px 42px rgba(115,86,54,0.12)",
    },
    header: {
      bg: "#f5e7d2",
      text_color: "#4f3422",
      transparent_bg: "rgba(255, 250, 242, 0.35)",
      scrolled_bg: "rgba(245, 231, 210, 0.84)",
      scrolled_text_color: "#4f3422",
    },
    footer: {
      bg: "#4f3422",
      text_color: "#fff7ed",
      link_color: "#ecd0ab",
    },
    navStyle: {
      bg: "#b98a50",
      bg_hover: "#a17643",
      text: "#fffaf2",
      text_hover: "#fffaf2",
      active_bg: "rgba(255,255,255,0.42)",
      active_text: "#8f693d",
      shadow: "0 18px 34px rgba(185,138,80,0.22)",
    },
  },
  {
    key: "forest-calm",
    label: "Forest Calm",
    description: "Sage and moss for wellness, massage, and holistic brands.",
    accent: "#4f8b72",
    pageStyle: {
      backgroundColor: "#f5fbf7",
      secondaryBackground:
        "linear-gradient(135deg, #f4faf5 0%, #dbeade 52%, #bfd7c4 100%)",
      overlayColor: "#e7f1ea",
      overlayOpacity: 0.72,
      headingColor: "#234437",
      bodyColor: "rgba(35,68,55,0.76)",
      linkColor: "#4f8b72",
      cardColor: "#ffffff",
      cardOpacity: 0.88,
      cardBg: "rgba(255,255,255,0.88)",
      cardRadius: 18,
      cardBlur: 0,
      cardShadow: "0 20px 52px rgba(63,101,83,0.14)",
      btnBg: "#4f8b72",
      btnColor: "#f7fdf9",
      btnRadius: 8,
      heroHeadingShadow: "0 14px 40px rgba(58,95,79,0.14)",
    },
    header: {
      bg: "#dbeade",
      text_color: "#234437",
      transparent_bg: "rgba(245, 251, 247, 0.34)",
      scrolled_bg: "rgba(219, 234, 222, 0.82)",
      scrolled_text_color: "#234437",
    },
    footer: {
      bg: "#234437",
      text_color: "#f4faf5",
      link_color: "#bfd7c4",
    },
    navStyle: {
      bg: "#4f8b72",
      bg_hover: "#44785f",
      text: "#f7fdf9",
      text_hover: "#f7fdf9",
      active_bg: "rgba(255,255,255,0.38)",
      active_text: "#315b49",
      shadow: "0 16px 30px rgba(79,139,114,0.22)",
    },
  },
  {
    key: "ocean-clean",
    label: "Ocean Clean",
    description: "Soft white, mist blue, and teal for clean medical aesthetics.",
    accent: "#2e8ca6",
    pageStyle: {
      backgroundColor: "#f7fbfd",
      secondaryBackground:
        "linear-gradient(135deg, #f9fcff 0%, #dfeef7 50%, #c7e3f1 100%)",
      overlayColor: "#edf5fa",
      overlayOpacity: 0.7,
      headingColor: "#1f4254",
      bodyColor: "rgba(31,66,84,0.75)",
      linkColor: "#2e8ca6",
      cardColor: "#ffffff",
      cardOpacity: 0.9,
      cardBg: "rgba(255,255,255,0.9)",
      cardRadius: 16,
      cardBlur: 0,
      cardShadow: "0 18px 48px rgba(68,118,144,0.14)",
      btnBg: "#2e8ca6",
      btnColor: "#f7fbfd",
      btnRadius: 8,
      heroHeadingShadow: "0 14px 40px rgba(54,96,118,0.13)",
    },
    header: {
      bg: "#dfeef7",
      text_color: "#1f4254",
      transparent_bg: "rgba(247, 251, 253, 0.34)",
      scrolled_bg: "rgba(223, 238, 247, 0.82)",
      scrolled_text_color: "#1f4254",
    },
    footer: {
      bg: "#1f4254",
      text_color: "#f7fbfd",
      link_color: "#c7e3f1",
    },
    navStyle: {
      bg: "#2e8ca6",
      bg_hover: "#24758b",
      text: "#f7fbfd",
      text_hover: "#f7fbfd",
      active_bg: "rgba(255,255,255,0.38)",
      active_text: "#215f73",
      shadow: "0 16px 30px rgba(46,140,166,0.22)",
    },
  },
  {
    key: "modern-noir",
    label: "Modern Noir",
    description: "Charcoal and warm gold for luxury and premium brands.",
    accent: "#d1a257",
    pageStyle: {
      backgroundColor: "#111113",
      secondaryBackground:
        "linear-gradient(135deg, #151619 0%, #25282d 55%, #2f343c 100%)",
      overlayColor: "#0f1012",
      overlayOpacity: 0.55,
      headingColor: "#f5efe3",
      bodyColor: "rgba(245,239,227,0.8)",
      linkColor: "#d1a257",
      cardColor: "#1a1b20",
      cardOpacity: 0.92,
      cardBg: "rgba(26,27,32,0.92)",
      cardRadius: 12,
      cardBlur: 0,
      cardShadow: "0 24px 60px rgba(0,0,0,0.32)",
      btnBg: "#d1a257",
      btnColor: "#18171a",
      btnRadius: 4,
      heroHeadingShadow: "0 20px 50px rgba(0,0,0,0.35)",
    },
    header: {
      bg: "#151619",
      text_color: "#f5efe3",
      transparent_bg: "rgba(21, 22, 25, 0.42)",
      scrolled_bg: "rgba(21, 22, 25, 0.86)",
      scrolled_text_color: "#f5efe3",
    },
    footer: {
      bg: "#0b0c0f",
      text_color: "#f5efe3",
      link_color: "#d1a257",
    },
    navStyle: {
      bg: "#d1a257",
      bg_hover: "#bc914c",
      text: "#18171a",
      text_hover: "#18171a",
      active_bg: "rgba(255,255,255,0.22)",
      active_text: "#f5efe3",
      shadow: "0 16px 28px rgba(0,0,0,0.34)",
    },
  },
  {
    key: "soft-minimal",
    label: "Soft Minimal",
    description: "Neutral whites and stone for clean corporate presentation.",
    accent: "#475569",
    pageStyle: {
      backgroundColor: "#ffffff",
      secondaryBackground:
        "linear-gradient(135deg, #ffffff 0%, #f8fafc 55%, #eef2f7 100%)",
      overlayColor: "#f8fafc",
      overlayOpacity: 0.62,
      headingColor: "#1f2937",
      bodyColor: "rgba(31,41,55,0.76)",
      linkColor: "#475569",
      cardColor: "#ffffff",
      cardOpacity: 0.94,
      cardBg: "rgba(255,255,255,0.94)",
      cardRadius: 12,
      cardBlur: 0,
      cardShadow: "0 14px 36px rgba(15,23,42,0.10)",
      btnBg: "#475569",
      btnColor: "#ffffff",
      btnRadius: 6,
      heroHeadingShadow: "0 10px 28px rgba(15,23,42,0.12)",
    },
    header: {
      bg: "#ffffff",
      text_color: "#1f2937",
      transparent_bg: "rgba(255, 255, 255, 0.34)",
      scrolled_bg: "rgba(255, 255, 255, 0.88)",
      scrolled_text_color: "#1f2937",
    },
    footer: {
      bg: "#f8fafc",
      text_color: "#1f2937",
      link_color: "#475569",
    },
    navStyle: {
      bg: "#475569",
      bg_hover: "#334155",
      text: "#ffffff",
      text_hover: "#ffffff",
      active_bg: "rgba(71,85,105,0.12)",
      active_text: "#334155",
      shadow: "0 12px 26px rgba(15,23,42,0.12)",
    },
  },
  {
    key: "berry-editorial",
    label: "Berry Editorial",
    description: "Berry, blush, and plum for boutique beauty and lifestyle.",
    accent: "#b83b6a",
    pageStyle: {
      backgroundColor: "#fff6fa",
      secondaryBackground:
        "linear-gradient(135deg, #fff3f8 0%, #f6d7e5 48%, #dfb0c7 100%)",
      overlayColor: "#f7e8ef",
      overlayOpacity: 0.76,
      headingColor: "#4d2132",
      bodyColor: "rgba(77,33,50,0.78)",
      linkColor: "#b83b6a",
      cardColor: "#ffffff",
      cardOpacity: 0.88,
      cardBg: "rgba(255,255,255,0.88)",
      cardRadius: 20,
      cardBlur: 0,
      cardShadow: "0 22px 52px rgba(120,58,88,0.16)",
      btnBg: "#b83b6a",
      btnColor: "#fff7fb",
      btnRadius: 8,
      heroHeadingShadow: "0 18px 42px rgba(114,52,82,0.14)",
    },
    header: {
      bg: "#f6d7e5",
      text_color: "#4d2132",
      transparent_bg: "rgba(255, 243, 248, 0.36)",
      scrolled_bg: "rgba(246, 215, 229, 0.82)",
      scrolled_text_color: "#4d2132",
    },
    footer: {
      bg: "#4d2132",
      text_color: "#fff6fa",
      link_color: "#f6d7e5",
    },
    navStyle: {
      bg: "#b83b6a",
      bg_hover: "#9f2f59",
      text: "#fff7fb",
      text_hover: "#fff7fb",
      active_bg: "rgba(255,255,255,0.38)",
      active_text: "#8d2e52",
      shadow: "0 18px 34px rgba(184,59,106,0.22)",
    },
  },
  {
    key: "sunset-glow",
    label: "Sunset Glow",
    description: "Peach, sand, and coral for lifestyle and service brands.",
    accent: "#dd6b4d",
    pageStyle: {
      backgroundColor: "#fff9f4",
      secondaryBackground:
        "linear-gradient(135deg, #fff7ef 0%, #ffd8c2 52%, #f7b284 100%)",
      overlayColor: "#fdf0e4",
      overlayOpacity: 0.72,
      headingColor: "#5d2f24",
      bodyColor: "rgba(93,47,36,0.76)",
      linkColor: "#dd6b4d",
      cardColor: "#ffffff",
      cardOpacity: 0.9,
      cardBg: "rgba(255,255,255,0.9)",
      cardRadius: 18,
      cardBlur: 0,
      cardShadow: "0 20px 52px rgba(161,91,62,0.15)",
      btnBg: "#dd6b4d",
      btnColor: "#fffaf5",
      btnRadius: 8,
      heroHeadingShadow: "0 16px 42px rgba(144,82,56,0.14)",
    },
    header: {
      bg: "#ffd8c2",
      text_color: "#5d2f24",
      transparent_bg: "rgba(255, 247, 239, 0.36)",
      scrolled_bg: "rgba(255, 216, 194, 0.82)",
      scrolled_text_color: "#5d2f24",
    },
    footer: {
      bg: "#5d2f24",
      text_color: "#fff9f4",
      link_color: "#ffd8c2",
    },
    navStyle: {
      bg: "#dd6b4d",
      bg_hover: "#c85c3f",
      text: "#fffaf5",
      text_hover: "#fffaf5",
      active_bg: "rgba(255,255,255,0.38)",
      active_text: "#a64b33",
      shadow: "0 18px 34px rgba(221,107,77,0.22)",
    },
  },
];

const BUTTON_STYLE_PRESET_LIBRARY = [
  {
    key: "soft-rounded",
    label: "Soft Rounded",
    description: "Friendly rounded buttons for beauty, wellness, and lifestyle sites.",
    values: { btnRadius: 4 },
  },
  {
    key: "luxury-rectangle",
    label: "Luxury Rectangle",
    description: "Sharper premium button treatment with restrained corners.",
    values: { btnRadius: 4 },
  },
  {
    key: "pill",
    label: "Rounded",
    description: "Rounded buttons with restrained corners for softer websites.",
    values: { btnRadius: 4 },
  },
  {
    key: "sharp-minimal",
    label: "Sharp Minimal",
    description: "Low-radius buttons for corporate, legal, and product-led sites.",
    values: { btnRadius: 2 },
  },
];

const HEADER_MODE_PRESET_LIBRARY = [
  {
    key: "classic-solid",
    label: "Classic Solid",
    description: "Traditional solid header with no hero overlap.",
    values: {
      sticky: false,
      overlay_hero: false,
      transparent_on_top: false,
      scrolled_shadow: false,
      scroll_threshold: 64,
      scroll_cta_enabled: false,
    },
  },
  {
    key: "transparent-hero",
    label: "Transparent Hero",
    description: "Header overlays the hero and becomes solid on scroll.",
    values: {
      sticky: true,
      overlay_hero: true,
      transparent_on_top: true,
      scrolled_shadow: true,
      scroll_threshold: 56,
      scroll_cta_enabled: false,
    },
  },
  {
    key: "compact-cta",
    label: "Compact CTA",
    description: "Transparent hero header that collapses to logo + CTA on scroll.",
    values: {
      sticky: true,
      overlay_hero: true,
      transparent_on_top: true,
      scrolled_shadow: true,
      scroll_threshold: 48,
      scroll_cta_enabled: true,
      scroll_cta_after: 96,
    },
  },
  {
    key: "minimal-solid",
    label: "Minimal Solid",
    description: "Always-solid minimal header with sticky behavior and shadow.",
    values: {
      sticky: true,
      overlay_hero: false,
      transparent_on_top: false,
      scrolled_shadow: true,
      scroll_threshold: 40,
      scroll_cta_enabled: false,
    },
  },
];

const INDUSTRY_STARTER_PACKS = [
  {
    key: "medspa-beauty",
    label: "Medspa / Beauty",
    description: "Blush palette, transparent hero header, and soft rounded CTA.",
    themePresetKey: "blush-spa",
    headerModeKey: "transparent-hero",
    buttonStyleKey: "soft-rounded",
  },
  {
    key: "luxury-boutique",
    label: "Luxury Boutique",
    description: "Champagne tones with a premium rectangular button treatment.",
    themePresetKey: "champagne-luxe",
    headerModeKey: "transparent-hero",
    buttonStyleKey: "luxury-rectangle",
  },
  {
    key: "wellness-spa",
    label: "Wellness / Spa",
    description: "Sage and moss with a soft, elevated header treatment.",
    themePresetKey: "forest-calm",
    headerModeKey: "transparent-hero",
    buttonStyleKey: "soft-rounded",
  },
  {
    key: "medical-aesthetic",
    label: "Medical Aesthetic",
    description: "Clean blues with a solid, polished clinical header.",
    themePresetKey: "ocean-clean",
    headerModeKey: "classic-solid",
    buttonStyleKey: "sharp-minimal",
  },
  {
    key: "premium-noir",
    label: "Premium Noir",
    description: "Dark luxury palette with a compact sticky CTA header.",
    themePresetKey: "modern-noir",
    headerModeKey: "compact-cta",
    buttonStyleKey: "luxury-rectangle",
  },
  {
    key: "minimal-corporate",
    label: "Minimal Corporate",
    description: "Light neutral palette with a simple solid header and sharp CTAs.",
    themePresetKey: "soft-minimal",
    headerModeKey: "minimal-solid",
    buttonStyleKey: "sharp-minimal",
  },
  {
    key: "editorial-beauty",
    label: "Editorial Beauty",
    description: "Berry palette with a softer premium button treatment.",
    themePresetKey: "berry-editorial",
    headerModeKey: "transparent-hero",
    buttonStyleKey: "soft-rounded",
  },
  {
    key: "lifestyle-service",
    label: "Lifestyle Service",
    description: "Warm sunset palette with a friendly modern hero header.",
    themePresetKey: "sunset-glow",
    headerModeKey: "transparent-hero",
    buttonStyleKey: "pill",
  },
];

const clampPageStyleRadiusValue = (value, fallback = 4) =>
  clampWebsiteRadius(value, { min: 2, max: 4, fallback });

const sanitizePageStyleRadii = (style = {}) => {
  const next = { ...(style || {}) };
  if (next.cardRadius !== undefined && next.cardRadius !== null && next.cardRadius !== "") {
    next.cardRadius = clampPageStyleRadiusValue(next.cardRadius, 4);
  }
  if (next.btnRadius !== undefined && next.btnRadius !== null && next.btnRadius !== "") {
    next.btnRadius = clampPageStyleRadiusValue(next.btnRadius, 4);
  }
  return next;
};

/* ---------- CSS VARS helper for page-level style (NEW) ---------- */
/* ---------- CSS VARS helper for page-level style (final) ---------- */
function styleToCssVars(style = {}) {
  // Card bg supports color + opacity (handles #rrggbb); falls back to given value.
  const hexToRgba = (hex, alpha = 1) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
    if (!m) return hex; // not a 6-digit hex
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  const cardColor   = style.cardBg || style.cardColor || "rgba(255,255,255,1)";
  const cardOpacity = Number.isFinite(style.cardOpacity) ? style.cardOpacity : 1;
  const cardBgValue =
    cardColor.startsWith("#") ? hexToRgba(cardColor, cardOpacity) : cardColor;

  return {
    // colors + fonts
    "--page-heading-color": style.headingColor || "inherit",
    "--page-body-color": style.bodyColor || "inherit",
    "--page-link-color": style.linkColor || "var(--sched-primary)",
    "--page-heading-font": style.headingFont || "inherit",
    "--page-body-font": style.bodyFont || "inherit",

    // hero hooks
    "--page-hero-text-color": style.bodyColor || "inherit",
    "--page-hero-heading-color": style.headingColor || "inherit",
    "--page-hero-heading-font": style.headingFont || "inherit",
    "--page-hero-body-font": style.bodyFont || "inherit",
    "--page-hero-heading-shadow":
      style.heroHeadingShadow || "0 2px 24px rgba(0,0,0,.25)",

    // cards
    "--page-card-bg": cardBgValue,
    "--page-card-radius": toWebsiteRadiusPx(style.cardRadius ?? 4),

    // NEW — buttons
    "--page-btn-bg": style.btnBg || "var(--sched-primary)",
    "--page-btn-color": style.btnColor || "#fff",
    "--page-btn-radius": toWebsiteRadiusPx(style.btnRadius ?? 4),

    // background image opacity
    "--page-bg-image-opacity": String(
      style.backgroundImageOpacity == null
        ? 1
        : style.backgroundImageOpacity
    ),

    // secondary background accent
    "--page-secondary-bg":
      style.secondaryBackground ||
      style.secondaryBackgroundColor ||
      "",
  };
}


/* ---------- PageStyleCard (inline helper) — mounted in Inspector (NEW) ---------- */
/* ---------- PageStyleCard (inline helper) — Inspector card (final) ---------- */
function PageStyleCard({
  value,
  onChange,
  onPickImage,
  applyToAll,
  onToggleApplyToAll,
  onApplyNow,
  onApplyThemePreset,
  onApplyButtonStylePreset,
  onApplyIndustryStarterPack,
  onReapplyThemeToChrome,
  onResetToSiteTheme,
  siteThemeSettings,
  onToggleSyncChrome,
  canResetToSiteTheme,
  onOpenAdvanced,
  companyId,
  isNextJsMode = false,
  nextJsThemeKey = "",
  nextJsThemeLabel = "",
  nextJsThemeOverrides = {},
  onChangeNextJsThemeOverrides,
}) {
  const { t } = useTranslation();

  const clamp01 = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(1, num));
  };
  const toHexByte = (n) =>
    Math.max(0, Math.min(255, Math.round(Number(n) || 0)))
      .toString(16)
      .padStart(2, "0");
  const normalizeHexColor = (hex) => {
    if (typeof hex !== "string") return "";
    let s = hex.trim();
    if (!s) return "";
    if (!s.startsWith("#")) return s;
    let h = s.slice(1);
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 4) {
      h = h
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 8) {
      h = h.slice(0, 6);
    }
    if (h.length < 6) h = h.padEnd(6, "0");
    return `#${h.toLowerCase()}`;
  };
  const hexToRgba = (hex, opacity = 1) => {
    const norm = normalizeHexColor(hex);
    if (!norm || !norm.startsWith("#")) return norm || "";
    const h = norm.slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
  };
  const parseCssColor = (css, fallbackOpacity = 1) => {
    const base = { hex: "#ffffff", opacity: clamp01(fallbackOpacity) };
    if (!css || typeof css !== "string") return base;
    const str = css.trim();
    if (!str) return base;
    if (str.toLowerCase() === "transparent") {
      return { hex: "#000000", opacity: 0 };
    }
    const rgba = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i.exec(str);
    if (rgba) {
      const r = Number(rgba[1]);
      const g = Number(rgba[2]);
      const b = Number(rgba[3]);
      const a = rgba[4] != null ? parseFloat(rgba[4]) : base.opacity;
      return {
        hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
        opacity: clamp01(a),
      };
    }
    if (str.startsWith("#")) {
      const raw = str.slice(1);
      let alpha = base.opacity;
      if (raw.length === 4) {
        alpha = parseInt(raw[3] + raw[3], 16) / 255;
      } else if (raw.length === 8) {
        alpha = parseInt(raw.slice(6, 8), 16) / 255;
      }
      return { hex: normalizeHexColor(str), opacity: clamp01(alpha) };
    }
    return base;
  };

  const v = value || {};
  const initialCard = parseCssColor(v.cardColor || v.cardBg || null, v.cardOpacity ?? 1);
  const cardColorInput = normalizeHexColor(v.cardColor || initialCard.hex) || "#ffffff";
  const cardOpacityInput =
    v.cardOpacity != null ? clamp01(v.cardOpacity) : initialCard.opacity;
  const fallbackSecondaryHex = "#1d4ed8";
  const isAdvancedSecondaryValue = (val) => {
    if (!val || typeof val !== "string") return false;
    const s = val.trim().toLowerCase();
    if (!s) return false;
    if (s.startsWith("#")) return false;
    if (s.startsWith("rgb")) return false;
    return true;
  };
  const secondaryColorHex = (() => {
    const raw = v.secondaryBackground;
    if (!raw || typeof raw !== "string") return fallbackSecondaryHex;
    const trimmed = raw.trim();
    if (!trimmed) return fallbackSecondaryHex;
    if (trimmed.startsWith("#")) {
      return normalizeHexColor(trimmed) || fallbackSecondaryHex;
    }
    if (/^rgba?\(/i.test(trimmed)) {
      return parseCssColor(trimmed, 1).hex || fallbackSecondaryHex;
    }
    return fallbackSecondaryHex;
  })();
  const [secondaryAdvanced, setSecondaryAdvanced] = useState(
    isAdvancedSecondaryValue(v.secondaryBackground)
  );
  useEffect(() => {
    setSecondaryAdvanced(isAdvancedSecondaryValue(v.secondaryBackground));
  }, [v.secondaryBackground]);
  const set = (patch) => onChange?.({ ...(v || {}), ...patch });
  const applyCardValues = (color, opacity) => {
    if (!onChange) return;
    const normalized = normalizeHexColor(color);
    const finalOpacity = clamp01(opacity);
    onChange({
      ...(v || {}),
      cardColor: normalized,
      cardOpacity: finalOpacity,
      cardBg: normalized ? hexToRgba(normalized, finalOpacity) : "",
    });
  };

  const shadowPresets = [
    { key: "none", label: "None", value: "" },
    { key: "soft", label: "Soft", value: "0 8px 24px rgba(0,0,0,0.12)" },
    { key: "medium", label: "Medium", value: "0 12px 32px rgba(0,0,0,0.18)" },
    { key: "strong", label: "Strong", value: "0 18px 48px rgba(0,0,0,0.24)" },
    { key: "glass", label: "Glass", value: "0 12px 32px rgba(15,23,42,0.28)" },
  ];
  const matchShadowPreset = (val) =>
    shadowPresets.find((preset) => (val || "").trim() === preset.value) || null;
  const cardShadowPreset = matchShadowPreset(v.cardShadow)?.key || "custom";
  const heroShadowPreset = matchShadowPreset(v.heroHeadingShadow)?.key || "custom";
  const isShadowValid = (val) =>
    !val ||
    /-?\d+px\s+-?\d+px/.test(val) ||
    /rgba?\(/i.test(val) ||
    /#/.test(val);

  const overlayOpacityValue = clamp01(v.overlayOpacity ?? 0);
  const cardOpacityValue = clamp01(cardOpacityInput);
  const cardRadiusValue = Number.isFinite(Number(v.cardRadius))
    ? clampPageStyleRadiusValue(Number(v.cardRadius), 4)
    : 4;
  const cardBlurValue = Number.isFinite(Number(v.cardBlur)) ? Number(v.cardBlur) : 0;

  const gradientDefaults = {
    angle: 135,
    start: "#1d4ed8",
    end: "#14b8a6",
  };
  const [gradientAngle, setGradientAngle] = useState(gradientDefaults.angle);
  const [gradientStart, setGradientStart] = useState(gradientDefaults.start);
  const [gradientEnd, setGradientEnd] = useState(gradientDefaults.end);

  const colorField = ({
    label,
    value,
    onChange: onColorChange,
    helperText,
    disabled,
    testId,
  }) => {
    const normalized = normalizeHexColor(value) || "#000000";
    return (
      <TextField
        size="small"
        label={label}
        value={value || ""}
        onChange={(e) => onColorChange(e.target.value)}
        helperText={helperText}
        disabled={disabled}
        fullWidth
        inputProps={{
          "data-testid": testId,
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ButtonBase
                component="label"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: normalized,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <Box
                  component="input"
                  type="color"
                  value={normalized}
                  onChange={(e) => onColorChange(e.target.value)}
                  disabled={disabled}
                  sx={{
                    opacity: 0,
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                />
              </ButtonBase>
            </InputAdornment>
          ),
        }}
      />
    );
  };

  // Keep every hook above the Next.js early return. PageStyleCard is also used
  // for the classic inspector, but the Next.js-only inspector must not change
  // this component's hook order when it is toggled at runtime.
  const [pageStyleTab, setPageStyleTab] = useState("style");
  const [cardShadowBuilderOpen, setCardShadowBuilderOpen] = useState(false);
  const [heroShadowBuilderOpen, setHeroShadowBuilderOpen] = useState(false);
  const initialStyleRef = useRef(value || {});
  const isDirty = useMemo(
    () => JSON.stringify(value || {}) !== JSON.stringify(initialStyleRef.current || {}),
    [value]
  );

  if (isNextJsMode) {
    const pageStyleCapabilities = resolveNextJsPageStyleCapabilities({
      rendererEngine: "nextjs",
      visualThemeKey: nextJsThemeKey,
    });
    const supportedFields = pageStyleCapabilities?.supportedFields || [];
    const supportedFieldSet = new Set(supportedFields);
    const resolvedThemeLabel = nextJsThemeLabel || String(nextJsThemeKey || "the current theme")
      .split("-")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    const nextSiteThemeSettings = readSiteThemeSettings(siteThemeSettings);
    const activeNextPresetKey =
      String(nextJsThemeOverrides?.themePresetKey || "").trim().toLowerCase() ||
      nextSiteThemeSettings.themePresetKey ||
      "";
    const nextPresetChoices = THEME_PRESET_LIBRARY.filter((preset) =>
      pageStyleCapabilities?.presetKeys?.includes(preset.key)
    );
    const sanitizedOverrides = sanitizeThemeOverrideDraft(
      nextJsThemeKey,
      nextJsThemeOverrides || {}
    );
    const updateOverride = (fieldKey, fieldValue) => {
      onChangeNextJsThemeOverrides?.({
        ...sanitizedOverrides,
        [fieldKey]: fieldValue,
      });
    };
    const unsupportedFieldLabels = Object.entries(NEXTJS_THEME_OVERRIDE_FIELDS)
      .filter(([fieldKey]) => !supportedFieldSet.has(fieldKey))
      .map(([, meta]) => meta.label);

    return (
      <Stack id="page-style-card" data-testid="page-style-panel" spacing={1.5}>
        <Alert severity="info" variant="outlined">
          Page Style applies safe palette overrides supported by {resolvedThemeLabel}.
        </Alert>

        {nextPresetChoices.length ? (
          <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1, borderColor: "divider" }}>
            <Stack spacing={1.25}>
              <Box>
                <Typography variant="subtitle2">{resolvedThemeLabel} color presets</Typography>
                <Typography variant="caption" color="text.secondary">
                  Choose a complete color direction for this template. The preset updates
                  its semantic palette; layout and system-owned flows stay unchanged.
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={nextSiteThemeSettings.syncChrome !== false}
                      onChange={(_, checked) => onToggleSyncChrome?.(checked)}
                    />
                  }
                  label="Keep header/footer/menu colors synced"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={Boolean(applyToAll)}
                      onChange={(_, checked) => onToggleApplyToAll?.(checked)}
                    />
                  }
                  label="Apply this preset to all pages"
                />
              </Stack>
              {activeNextPresetKey ? (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`Active preset: ${
                    THEME_PRESET_LIBRARY.find((preset) => preset.key === activeNextPresetKey)
                      ?.label || activeNextPresetKey
                  }`}
                  sx={{ alignSelf: "flex-start" }}
                />
              ) : null}
              <Grid container spacing={1}>
                {nextPresetChoices.map((preset) => (
                  <Grid item xs={12} sm={6} key={preset.key}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.1,
                        height: "100%",
                        borderRadius: 1,
                        borderColor:
                          activeNextPresetKey === preset.key ? "primary.main" : "divider",
                        background:
                          preset.pageStyle.secondaryBackground ||
                          preset.pageStyle.backgroundColor ||
                          "background.paper",
                      }}
                    >
                      <Stack spacing={0.8}>
                        <Stack direction="row" spacing={0.5}>
                          {[
                            preset.pageStyle.backgroundColor,
                            preset.pageStyle.headingColor,
                            preset.pageStyle.btnBg || preset.accent,
                          ]
                            .filter(Boolean)
                            .map((swatch, index) => (
                              <Box
                                key={`${preset.key}-${index}`}
                                sx={{
                                  width: 16,
                                  height: 16,
                                  borderRadius: "50%",
                                  border: "1px solid rgba(15,23,42,0.2)",
                                  background: swatch,
                                }}
                              />
                            ))}
                        </Stack>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {preset.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {preset.description}
                        </Typography>
                        <Button
                          size="small"
                          variant={activeNextPresetKey === preset.key ? "contained" : "outlined"}
                          onClick={() =>
                            onApplyThemePreset?.(preset, { applyToAll: Boolean(applyToAll) })
                          }
                        >
                          {activeNextPresetKey === preset.key
                            ? applyToAll
                              ? "Reapply to all pages"
                              : "Reapply to current page"
                            : applyToAll
                              ? "Apply to all pages"
                              : "Apply to current page"}
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Stack direction="row" justifyContent="flex-end">
                <Button size="small" variant="text" onClick={onReapplyThemeToChrome}>
                  Reapply colors to header/footer/menu
                </Button>
              </Stack>
            </Stack>
          </Paper>
        ) : null}

        <Stack spacing={1.25}>
          {supportedFieldSet.has("heroMediaUrl") ? (
            <ImageField
              label={NEXTJS_THEME_OVERRIDE_FIELDS.heroMediaUrl.label}
              value={sanitizedOverrides.heroMediaUrl || ""}
              onChange={(url) => updateOverride("heroMediaUrl", url)}
              companyId={companyId}
              data-testid="page-style-hero-media"
            />
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {supportedFieldSet.has("brandPrimaryColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.brandPrimaryColor.label,
                  value: sanitizedOverrides.brandPrimaryColor || "#6366f1",
                  onChange: (val) => updateOverride("brandPrimaryColor", val),
                  testId: "page-style-brand-primary",
                })
              : null}
            {supportedFieldSet.has("accentColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.accentColor.label,
                  value: sanitizedOverrides.accentColor || "#f59e0b",
                  onChange: (val) => updateOverride("accentColor", val),
                  testId: "page-style-accent-color",
                })
              : null}
          </Stack>

          {supportedFieldSet.has("pageBackground")
            ? colorField({
                label: NEXTJS_THEME_OVERRIDE_FIELDS.pageBackground.label,
                value: sanitizedOverrides.pageBackground || "#ffffff",
                onChange: (val) => updateOverride("pageBackground", val),
                testId: "page-style-page-background",
              })
            : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {supportedFieldSet.has("surfaceColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.surfaceColor.label,
                  value: sanitizedOverrides.surfaceColor || "#ffffff",
                  onChange: (val) => updateOverride("surfaceColor", val),
                  testId: "page-style-surface-color",
                })
              : null}
            {supportedFieldSet.has("cardColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.cardColor.label,
                  value: sanitizedOverrides.cardColor || "#ffffff",
                  onChange: (val) => updateOverride("cardColor", val),
                  testId: "page-style-card-color",
                })
              : null}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {supportedFieldSet.has("foregroundColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.foregroundColor.label,
                  value: sanitizedOverrides.foregroundColor || "#111827",
                  onChange: (val) => updateOverride("foregroundColor", val),
                  testId: "page-style-foreground-color",
                })
              : null}
            {supportedFieldSet.has("mutedForegroundColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.mutedForegroundColor.label,
                  value: sanitizedOverrides.mutedForegroundColor || "#64748b",
                  onChange: (val) => updateOverride("mutedForegroundColor", val),
                  testId: "page-style-muted-foreground-color",
                })
              : null}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {supportedFieldSet.has("borderColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.borderColor.label,
                  value: sanitizedOverrides.borderColor || "#e2e8f0",
                  onChange: (val) => updateOverride("borderColor", val),
                  testId: "page-style-border-color",
                })
              : null}
            {supportedFieldSet.has("buttonForegroundColor")
              ? colorField({
                  label: NEXTJS_THEME_OVERRIDE_FIELDS.buttonForegroundColor.label,
                  value: sanitizedOverrides.buttonForegroundColor || "#ffffff",
                  onChange: (val) => updateOverride("buttonForegroundColor", val),
                  testId: "page-style-button-foreground-color",
                })
              : null}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {supportedFieldSet.has("surfaceTone") ? (
              <FormControl size="small" fullWidth>
                <InputLabel>{NEXTJS_THEME_OVERRIDE_FIELDS.surfaceTone.label}</InputLabel>
                <Select
                  data-testid="page-style-surface-tone"
                  label={NEXTJS_THEME_OVERRIDE_FIELDS.surfaceTone.label}
                  value={sanitizedOverrides.surfaceTone || "auto"}
                  onChange={(event) => updateOverride("surfaceTone", event.target.value)}
                >
                  {NEXTJS_THEME_OVERRIDE_FIELDS.surfaceTone.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
            {supportedFieldSet.has("lightDarkPreference") ? (
              <FormControl size="small" fullWidth>
                <InputLabel>{NEXTJS_THEME_OVERRIDE_FIELDS.lightDarkPreference.label}</InputLabel>
                <Select
                  data-testid="page-style-light-dark"
                  label={NEXTJS_THEME_OVERRIDE_FIELDS.lightDarkPreference.label}
                  value={sanitizedOverrides.lightDarkPreference || "auto"}
                  onChange={(event) =>
                    updateOverride("lightDarkPreference", event.target.value)
                  }
                >
                  {NEXTJS_THEME_OVERRIDE_FIELDS.lightDarkPreference.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}
          </Stack>

          {supportedFieldSet.has("buttonTreatment") ? (
            <FormControl size="small" fullWidth>
              <InputLabel>{NEXTJS_THEME_OVERRIDE_FIELDS.buttonTreatment.label}</InputLabel>
              <Select
                data-testid="page-style-button-treatment"
                label={NEXTJS_THEME_OVERRIDE_FIELDS.buttonTreatment.label}
                value={sanitizedOverrides.buttonTreatment || "solid"}
                onChange={(event) => updateOverride("buttonTreatment", event.target.value)}
              >
                {NEXTJS_THEME_OVERRIDE_FIELDS.buttonTreatment.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          {supportedFieldSet.has("gradientAccent") ? (
            <FormControlLabel
              control={
                <Switch
                  inputProps={{ "data-testid": "page-style-gradient-accent" }}
                  checked={Boolean(sanitizedOverrides.gradientAccent)}
                  onChange={(_, checked) => updateOverride("gradientAccent", checked)}
                />
              }
              label={NEXTJS_THEME_OVERRIDE_FIELDS.gradientAccent.label}
            />
          ) : null}

          {supportedFieldSet.has("sectionSpacing") ? (
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                {NEXTJS_THEME_OVERRIDE_FIELDS.sectionSpacing.label}
              </Typography>
              <Slider
                data-testid="page-style-section-spacing"
                size="small"
                min={0}
                max={5}
                step={1}
                value={sanitizedOverrides.sectionSpacing ?? 3}
                valueLabelDisplay="auto"
                onChange={(_, value) =>
                  typeof value === "number" &&
                  updateOverride("sectionSpacing", value)
                }
              />
            </Stack>
          ) : null}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {supportedFieldSet.has("buttonRadius") ? (
              <TextField
                size="small"
                type="number"
                label={NEXTJS_THEME_OVERRIDE_FIELDS.buttonRadius.label}
                value={sanitizedOverrides.buttonRadius ?? 2}
                onChange={(event) =>
                  updateOverride("buttonRadius", Number(event.target.value || 0))
                }
                inputProps={{ min: 0, max: 4, step: 1 }}
                data-testid="page-style-button-radius"
                fullWidth
              />
            ) : null}
            {supportedFieldSet.has("typographyScale") ? (
              <TextField
                size="small"
                type="number"
                label={NEXTJS_THEME_OVERRIDE_FIELDS.typographyScale.label}
                value={sanitizedOverrides.typographyScale ?? 1}
                onChange={(event) =>
                  updateOverride(
                    "typographyScale",
                    Number(event.target.value || 1)
                  )
                }
                inputProps={{ min: 0.9, max: 1.2, step: 0.05 }}
                data-testid="page-style-typography-scale"
                fullWidth
              />
            ) : null}
          </Stack>
        </Stack>

        {unsupportedFieldLabels.length ? (
          <Alert severity="info" variant="outlined">
            Not available for this website style yet:{" "}
            {unsupportedFieldLabels.join(", ")}.
          </Alert>
        ) : null}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChangeNextJsThemeOverrides?.(sanitizeThemeOverrideDraft(nextJsThemeKey, {}))}
          >
            Reset overrides
          </Button>
          <Button size="small" variant="contained" onClick={onApplyNow} disabled={!onApplyNow}>
            Apply now
          </Button>
        </Stack>
      </Stack>
    );
  }

  const parseBoxShadow = (val) => {
    const fallback = { x: 0, y: 12, blur: 32, spread: 0, color: "#000000", opacity: 0.18 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[5], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      spread: Number(match[4] || 0),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };

  const parseTextShadow = (val) => {
    const fallback = { x: 0, y: 6, blur: 18, color: "#000000", opacity: 0.25 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[4], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };

  const buildBoxShadow = ({ x, y, blur, spread, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const buildTextShadow = ({ x, y, blur, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${hexToRgba(color, opacity)}`;

  const cardShadowValues = parseBoxShadow(v.cardShadow || "");
  const heroShadowValues = parseTextShadow(v.heroHeadingShadow || "");
  const updateCardShadow = (patch) => {
    const next = { ...cardShadowValues, ...patch };
    set({ cardShadow: buildBoxShadow(next) });
  };
  const updateHeroShadow = (patch) => {
    const next = { ...heroShadowValues, ...patch };
    set({ heroHeadingShadow: buildTextShadow(next) });
  };
  const applyPreset = (preset) => {
    if (!preset) return;
    onApplyThemePreset?.(preset, { applyToAll: !!applyToAll });
  };
  const applyButtonPreset = (preset) => {
    if (!preset) return;
    onApplyButtonStylePreset?.(preset, { applyToAll: !!applyToAll });
  };
  const applyIndustryPack = (pack) => {
    if (!pack) return;
    onApplyIndustryStarterPack?.(pack, { applyToAll: !!applyToAll });
  };
  const syncChrome = siteThemeSettings?.syncChrome !== false;
  const activeStarterPackKey = siteThemeSettings?.industryStarterPackKey || "";
  const activeThemePresetKey = siteThemeSettings?.themePresetKey || "";
  const renderThemePresetPreview = (preset) => {
    const bg = preset.pageStyle.backgroundColor || "#ffffff";
    const secondary = preset.pageStyle.secondaryBackground || bg;
    const headerBg = preset.header?.bg || bg;
    const footerBg = preset.footer?.bg || bg;
    const buttonBg =
      preset.pageStyle.btnBg ||
      preset.pageStyle.linkColor ||
      preset.accent ||
      "#2563eb";
    const textTone = preset.pageStyle.headingColor || "#111827";
    return (
      <Box
        sx={{
          borderRadius: 1,
          overflow: "hidden",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
          background: bg,
        }}
      >
        <Box
          sx={{
            height: 22,
            px: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: headerBg,
          }}
        >
          <Box sx={{ width: 18, height: 7, borderRadius: 4, bgcolor: textTone, opacity: 0.7 }} />
          <Stack direction="row" spacing={0.5}>
            {[0, 1, 2].map((idx) => (
              <Box key={idx} sx={{ width: 12, height: 4, borderRadius: 4, bgcolor: textTone, opacity: 0.45 }} />
            ))}
          </Stack>
        </Box>
        <Box sx={{ p: 1.25, background: secondary }}>
          <Box sx={{ width: "68%", height: 8, borderRadius: 4, bgcolor: textTone, opacity: 0.75, mb: 0.75 }} />
          <Box sx={{ width: "86%", height: 6, borderRadius: 4, bgcolor: textTone, opacity: 0.25, mb: 1.25 }} />
          <Box sx={{ width: 44, height: 18, borderRadius: "var(--page-btn-radius, 4px)", bgcolor: buttonBg }} />
        </Box>
        <Box sx={{ height: 14, background: footerBg }} />
      </Box>
    );
  };
  const renderIndustryPackPreview = (pack) => {
    const preset = THEME_PRESET_LIBRARY.find((item) => item.key === pack.themePresetKey);
    const headerMode = HEADER_MODE_PRESET_LIBRARY.find((item) => item.key === pack.headerModeKey);
    const buttonStyle = BUTTON_STYLE_PRESET_LIBRARY.find((item) => item.key === pack.buttonStyleKey);
    if (!preset) return null;
    const headerTone = preset.header?.bg || preset.pageStyle?.backgroundColor || "#ffffff";
    const headerText = preset.header?.text_color || preset.pageStyle?.headingColor || "#111827";
    const footerTone = preset.footer?.bg || preset.pageStyle?.backgroundColor || "#111827";
    const footerText = preset.footer?.text_color || preset.pageStyle?.btnColor || "#ffffff";
    const buttonTone = preset.pageStyle?.btnBg || preset.navStyle?.bg || preset.accent || "#6366f1";
    const buttonText = preset.pageStyle?.btnColor || preset.navStyle?.text || "#ffffff";
    return (
      <Stack spacing={0.75}>
        {renderThemePresetPreview(preset)}
        <Box
          sx={{
            borderRadius: 1,
            overflow: "hidden",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 6px 18px rgba(15,23,42,0.08)",
            background: "#fff",
          }}
        >
          <Box
            sx={{
              height: 18,
              px: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: headerTone,
            }}
          >
            <Box sx={{ width: 18, height: 6, borderRadius: 4, bgcolor: headerText, opacity: 0.72 }} />
            <Box sx={{ width: 34, height: 10, borderRadius: "6px", bgcolor: buttonTone, color: buttonText, opacity: 0.92 }} />
          </Box>
          <Box sx={{ px: 1, py: 0.85, bgcolor: preset.pageStyle?.backgroundColor || "#fff" }}>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {headerMode ? (
                <Chip size="small" variant="outlined" label={`Header: ${headerMode.label}`} />
              ) : null}
              {buttonStyle ? (
                <Chip size="small" variant="outlined" label={`Buttons: ${buttonStyle.label}`} />
              ) : null}
            </Stack>
          </Box>
          <Box
            sx={{
              height: 14,
              px: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: footerTone,
            }}
          >
            <Box sx={{ width: 22, height: 4, borderRadius: 4, bgcolor: footerText, opacity: 0.65 }} />
            <Stack direction="row" spacing={0.4}>
              {[0, 1, 2].map((idx) => (
                <Box key={idx} sx={{ width: 8, height: 4, borderRadius: 4, bgcolor: footerText, opacity: 0.45 }} />
              ))}
            </Stack>
          </Box>
        </Box>
      </Stack>
    );
  };
  const reapplyThemeToChrome = () => {
    onReapplyThemeToChrome?.();
  };

  return (
    <Stack id="page-style-card" spacing={1.5}>
      <Tabs
        value={pageStyleTab}
        onChange={(_, v) => setPageStyleTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab value="content" label="Content" />
        <Tab value="style" label="Style" />
        <Tab value="advanced" label="Advanced" />
      </Tabs>

      {pageStyleTab === "content" && (
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">Background image</Typography>
          <ImageField
            label="Background image"
            value={v.backgroundImage || ""}
            onChange={(url) => set({ backgroundImage: url })}
            companyId={companyId}
          />
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6}>
              <Select
                size="small"
                value={v.backgroundRepeat || "no-repeat"}
                onChange={(e) => set({ backgroundRepeat: e.target.value })}
                fullWidth
              >
                <MenuItem value="no-repeat">{t("manager.visualBuilder.pageStyle.background.repeat.noRepeat")}</MenuItem>
                <MenuItem value="repeat">{t("manager.visualBuilder.pageStyle.background.repeat.repeat")}</MenuItem>
                <MenuItem value="repeat-x">{t("manager.visualBuilder.pageStyle.background.repeat.repeatX")}</MenuItem>
                <MenuItem value="repeat-y">{t("manager.visualBuilder.pageStyle.background.repeat.repeatY")}</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                size="small"
                value={v.backgroundSize || "cover"}
                onChange={(e) => set({ backgroundSize: e.target.value })}
                fullWidth
              >
                <MenuItem value="cover">{t("manager.visualBuilder.pageStyle.background.size.cover")}</MenuItem>
                <MenuItem value="contain">{t("manager.visualBuilder.pageStyle.background.size.contain")}</MenuItem>
                <MenuItem value="auto">{t("manager.visualBuilder.pageStyle.background.size.auto")}</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Select
                size="small"
                value={v.backgroundPosition || "center"}
                onChange={(e) => set({ backgroundPosition: e.target.value })}
                fullWidth
              >
                <MenuItem value="center">{t("manager.visualBuilder.pageStyle.background.position.center")}</MenuItem>
                <MenuItem value="top">{t("manager.visualBuilder.pageStyle.background.position.top")}</MenuItem>
                <MenuItem value="bottom">{t("manager.visualBuilder.pageStyle.background.position.bottom")}</MenuItem>
                <MenuItem value="left">{t("manager.visualBuilder.pageStyle.background.position.left")}</MenuItem>
                <MenuItem value="right">{t("manager.visualBuilder.pageStyle.background.position.right")}</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Controls whether the background scrolls with the page." arrow>
                <Select
                  size="small"
                  value={v.backgroundAttachment || "scroll"}
                  onChange={(e) => set({ backgroundAttachment: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="scroll">{t("manager.visualBuilder.pageStyle.background.attachment.scroll")}</MenuItem>
                  <MenuItem value="fixed">{t("manager.visualBuilder.pageStyle.background.attachment.fixed")}</MenuItem>
                </Select>
              </Tooltip>
            </Grid>
          </Grid>
        </Stack>
      )}

      {pageStyleTab === "style" && (
        <Stack spacing={1.25}>
          <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1, borderColor: "divider" }}>
            <Stack spacing={1}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "flex-start", sm: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="subtitle2">Site theme behavior</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Keep header, footer, and menu synced with the active site theme pack.
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={syncChrome}
                      onChange={(_, checked) => onToggleSyncChrome?.(checked)}
                    />
                  }
                  label="Keep header/footer/menu synced"
                />
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {activeStarterPackKey ? (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={`Active pack: ${
                      INDUSTRY_STARTER_PACKS.find((pack) => pack.key === activeStarterPackKey)?.label ||
                      activeStarterPackKey
                    }`}
                  />
                ) : null}
                {!activeStarterPackKey && activeThemePresetKey ? (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={`Active theme: ${
                      THEME_PRESET_LIBRARY.find((preset) => preset.key === activeThemePresetKey)?.label ||
                      activeThemePresetKey
                    }`}
                  />
                ) : null}
                <Chip
                  size="small"
                  variant="outlined"
                  label={syncChrome ? "Chrome sync on" : "Chrome sync off"}
                />
              </Stack>
            </Stack>
          </Paper>

          <Typography variant="subtitle2">Industry starter packs</Typography>
          <Typography variant="caption" color="text.secondary">
            Full-site theme packs that apply a curated color theme, header mode, footer palette, menu styling, and button style together.
          </Typography>
          <Grid container spacing={1}>
            {INDUSTRY_STARTER_PACKS.map((pack) => (
              <Grid item xs={12} sm={6} key={pack.key}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1, borderColor: "divider" }}>
                  <Stack spacing={1}>
                    {renderIndustryPackPreview(pack)}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {pack.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pack.description}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75}>
                      <Button size="small" variant="outlined" onClick={() => applyIndustryPack(pack)}>
                        Apply starter pack
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => applyIndustryPack(pack, { applyToAll: true })}
                      >
                        Apply to all pages
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider />
          <Typography variant="subtitle2">Theme presets</Typography>
          <Typography variant="caption" color="text.secondary">
            Apply a curated theme across the current page and sync the matching header, footer, and menu colors.
          </Typography>
          <Stack direction="row" justifyContent="flex-end">
            <Button size="small" variant="text" onClick={reapplyThemeToChrome}>
              Reapply theme to header/footer/menu
            </Button>
          </Stack>
          <Grid container spacing={1}>
            {THEME_PRESET_LIBRARY.map((preset) => (
              <Grid item xs={12} sm={6} key={preset.key}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.25,
                    borderRadius: 1,
                    borderColor: "divider",
                    background:
                      preset.pageStyle.secondaryBackground || preset.pageStyle.backgroundColor,
                  }}
                >
                  <Stack spacing={1}>
                    {renderThemePresetPreview(preset)}
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {preset.label}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        {[preset.pageStyle.backgroundColor, preset.pageStyle.linkColor, preset.pageStyle.btnBg]
                          .filter(Boolean)
                          .slice(0, 3)
                          .map((swatch, idx) => (
                            <Box
                              key={`${preset.key}-${idx}`}
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                border: "1px solid rgba(0,0,0,0.08)",
                                background: swatch,
                              }}
                            />
                          ))}
                      </Stack>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {preset.description}
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => applyPreset(preset)}>
                      Apply preset
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.background.heading")}</Typography>
          {colorField({
            label: t("manager.visualBuilder.pageStyle.background.color"),
            value: v.backgroundColor || "#ffffff",
            onChange: (val) => set({ backgroundColor: val }),
          })}
          <Stack direction="row" spacing={1}>
            {colorField({
              label: t("manager.visualBuilder.pageStyle.background.secondaryColor", {
                defaultValue: "Secondary background",
              }),
              value: secondaryAdvanced ? fallbackSecondaryHex : secondaryColorHex,
              onChange: (val) => {
                const nextColor = normalizeHexColor(val || fallbackSecondaryHex);
                set({ secondaryBackground: nextColor });
                if (secondaryAdvanced) setSecondaryAdvanced(false);
              },
              disabled: secondaryAdvanced,
            })}
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSecondaryAdvanced(true);
                setPageStyleTab("advanced");
              }}
            >
              {t("manager.visualBuilder.pageStyle.background.customCss", {
                defaultValue: "Custom CSS",
              })}
            </Button>
          </Stack>

          {colorField({
            label: t("manager.visualBuilder.pageStyle.background.overlayColor"),
            value: v.overlayColor || "#000000",
            onChange: (val) => set({ overlayColor: val }),
            helperText: "Use with overlay opacity for readability.",
          })}
          <Stack spacing={1}>
            <Tooltip title="Controls how dark the background overlay appears." arrow>
              <Typography variant="caption" color="text.secondary">
                {t("manager.visualBuilder.pageStyle.background.overlayOpacity")}
              </Typography>
            </Tooltip>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={1}
                step={0.05}
                value={overlayOpacityValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && set({ overlayOpacity: clamp01(val) })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={overlayOpacityValue}
                onChange={(e) =>
                  set({ overlayOpacity: clamp01(Number(e.target.value || 0)) })
                }
                inputProps={{ step: 0.05, min: 0, max: 1 }}
                sx={{ width: 90 }}
              />
            </Stack>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">Typography</Typography>
          <Stack direction="row" spacing={1}>
            {colorField({
              label: "Heading color",
              value: v.headingColor || "#111827",
              onChange: (val) => set({ headingColor: val }),
            })}
            {colorField({
              label: "Body color",
              value: v.bodyColor || "#374151",
              onChange: (val) => set({ bodyColor: val }),
            })}
          </Stack>
          {colorField({
            label: "Link color",
            value: v.linkColor || "#2563eb",
            onChange: (val) => set({ linkColor: val }),
          })}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Heading font"
              value={v.headingFont || ""}
              onChange={(e) => set({ headingFont: e.target.value })}
              placeholder="e.g. Inter, serif"
              fullWidth
            />
            <TextField
              size="small"
              label="Body font"
              value={v.bodyFont || ""}
              onChange={(e) => set({ bodyFont: e.target.value })}
              placeholder="e.g. Inter, sans-serif"
              fullWidth
            />
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.card.heading")}</Typography>
          {colorField({
            label: t("manager.visualBuilder.pageStyle.card.backgroundColor"),
            value: cardColorInput,
            onChange: (val) => applyCardValues(val || cardColorInput, cardOpacityValue),
          })}
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("manager.visualBuilder.pageStyle.card.opacity")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={1}
                step={0.05}
                value={cardOpacityValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && applyCardValues(cardColorInput, clamp01(val))
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={cardOpacityValue}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) applyCardValues(cardColorInput, clamp01(num));
                }}
                inputProps={{ step: 0.05, min: 0, max: 1 }}
                sx={{ width: 90 }}
              />
            </Stack>
            <FormHelperText>Higher opacity makes cards more solid.</FormHelperText>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("manager.visualBuilder.pageStyle.card.radius")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={2}
                max={4}
                step={1}
                value={cardRadiusValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && set({ cardRadius: clampPageStyleRadiusValue(val, 4) })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={cardRadiusValue}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) set({ cardRadius: clampPageStyleRadiusValue(num, 4) });
                }}
                inputProps={{ step: 1, min: 2, max: 4 }}
                sx={{ width: 90 }}
              />
            </Stack>
          </Stack>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              {t("manager.visualBuilder.pageStyle.card.blur")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={30}
                step={1}
                value={cardBlurValue}
                valueLabelDisplay="auto"
                onChange={(_, val) =>
                  typeof val === "number" && set({ cardBlur: val })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                value={cardBlurValue}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) set({ cardBlur: Math.max(0, Math.min(30, num)) });
                }}
                inputProps={{ step: 1, min: 0, max: 30 }}
                sx={{ width: 90 }}
              />
            </Stack>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.buttons.heading")}</Typography>
          <Typography variant="caption" color="text.secondary">
            Apply a button style preset first, then fine-tune colors or radius if needed.
          </Typography>
          <Grid container spacing={1}>
            {BUTTON_STYLE_PRESET_LIBRARY.map((preset) => (
              <Grid item xs={12} sm={6} key={preset.key}>
                <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1, borderColor: "divider" }}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {preset.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {preset.description}
                    </Typography>
                    <Button size="small" variant="outlined" onClick={() => applyButtonPreset(preset)}>
                      Apply button style
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" spacing={1}>
            {colorField({
              label: t("manager.visualBuilder.pageStyle.buttons.background"),
              value: v.btnBg || "#1976d2",
              onChange: (val) => set({ btnBg: val }),
            })}
            {colorField({
              label: t("manager.visualBuilder.pageStyle.buttons.textColor"),
              value: v.btnColor || "#ffffff",
              onChange: (val) => set({ btnColor: val }),
            })}
          </Stack>
          <TextField
            sx={{ mt: 1 }}
            size="small"
            label={t("manager.visualBuilder.pageStyle.buttons.radius")}
            type="number"
            value={v.btnRadius ?? 4}
            onChange={(e) =>
              set({
                btnRadius:
                  e.target.value === ""
                    ? ""
                    : clampPageStyleRadiusValue(Number(e.target.value), 4),
              })
            }
            placeholder={t("manager.visualBuilder.pageStyle.buttons.radiusPlaceholder")}
            fullWidth
            inputProps={{ step: 1, min: 2, max: 4 }}
          />

          <Divider />
          <Stack spacing={1}>
            <Typography variant="subtitle2">
              {t("manager.visualBuilder.pageStyle.layout.bottomSpacing", {
                defaultValue: "Page bottom spacing",
              })}
            </Typography>
            <Slider
              size="small"
              min={0}
              max={200}
              value={v.pageBottomSpacing ?? 0}
              valueLabelDisplay="auto"
              onChange={(_, val) =>
                typeof val === "number" && set({ pageBottomSpacing: val })
              }
            />
          </Stack>
        </Stack>
      )}

      {pageStyleTab === "advanced" && (
        <Stack spacing={1.25}>
          <Typography variant="subtitle2">Secondary background (CSS / gradient)</Typography>
          <TextField
            size="small"
            label={t("manager.visualBuilder.pageStyle.background.secondaryAdvanced", {
              defaultValue: "Secondary background (CSS or gradient)",
            })}
            value={v.secondaryBackground || ""}
            onChange={(e) => set({ secondaryBackground: e.target.value })}
            placeholder="linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)"
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Examples</InputLabel>
            <Select
              label="Examples"
              value=""
              onChange={(e) => {
                const next = e.target.value;
                if (!next) return;
                setSecondaryAdvanced(true);
                set({ secondaryBackground: next });
              }}
            >
              <MenuItem value="">
                <em>Choose preset…</em>
              </MenuItem>
              <MenuItem value="linear-gradient(135deg, #1d4ed8 0%, #14b8a6 100%)">
                Sapphire → Teal
              </MenuItem>
              <MenuItem value="linear-gradient(120deg, #0f172a 0%, #1f2937 100%)">
                Midnight Slate
              </MenuItem>
              <MenuItem value="linear-gradient(135deg, #f97316 0%, #fde68a 100%)">
                Amber Sunrise
              </MenuItem>
              <MenuItem value="linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)">
                Violet Glass
              </MenuItem>
            </Select>
            <FormHelperText>Fill with a ready-made CSS gradient.</FormHelperText>
          </FormControl>
          <Stack spacing={1}>
            <Typography variant="caption" color="text.secondary">
              Quick gradient builder
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={360}
                value={gradientAngle}
                valueLabelDisplay="auto"
                onChange={(_, val) => typeof val === "number" && setGradientAngle(val)}
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                label="Angle"
                value={gradientAngle}
                onChange={(e) => {
                  const num = Number(e.target.value);
                  if (Number.isFinite(num)) setGradientAngle(Math.max(0, Math.min(360, num)));
                }}
                sx={{ width: 100 }}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              {colorField({
                label: "Start color",
                value: gradientStart,
                onChange: (val) => setGradientStart(normalizeHexColor(val) || gradientStart),
              })}
              {colorField({
                label: "End color",
                value: gradientEnd,
                onChange: (val) => setGradientEnd(normalizeHexColor(val) || gradientEnd),
              })}
            </Stack>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSecondaryAdvanced(true);
                set({
                  secondaryBackground: `linear-gradient(${gradientAngle}deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
                });
              }}
            >
              Apply gradient
            </Button>
          </Stack>

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.card.shadow")}</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Card shadow preset</InputLabel>
            <Select
              label="Card shadow preset"
              value={cardShadowPreset}
              onChange={(e) => {
                const key = e.target.value;
                if (key === "custom") return;
                const preset = shadowPresets.find((p) => p.key === key);
                set({ cardShadow: preset ? preset.value : "" });
              }}
            >
              {shadowPresets.map((preset) => (
                <MenuItem key={preset.key} value={preset.key}>
                  {preset.label}
                </MenuItem>
              ))}
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
            <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setCardShadowBuilderOpen((prev) => !prev)}
            >
              {cardShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
            </Button>
            {cardShadowPreset !== "custom" && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  const preset = shadowPresets.find((p) => p.key === cardShadowPreset);
                  set({ cardShadow: preset ? preset.value : "" });
                }}
              >
                Reset to preset
              </Button>
            )}
          </Stack>
          {cardShadowBuilderOpen && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="X"
                  type="number"
                  value={cardShadowValues.x}
                  onChange={(e) => updateCardShadow({ x: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Y"
                  type="number"
                  value={cardShadowValues.y}
                  onChange={(e) => updateCardShadow({ y: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Blur"
                  type="number"
                  value={cardShadowValues.blur}
                  onChange={(e) => updateCardShadow({ blur: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Spread"
                  type="number"
                  value={cardShadowValues.spread}
                  onChange={(e) => updateCardShadow({ spread: Number(e.target.value || 0) })}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {colorField({
                  label: "Shadow color",
                  value: cardShadowValues.color,
                  onChange: (val) => updateCardShadow({ color: val }),
                })}
                <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                  <Typography variant="caption">Opacity</Typography>
                  <Slider
                    size="small"
                    min={0}
                    max={1}
                    step={0.05}
                    value={cardShadowValues.opacity}
                    valueLabelDisplay="auto"
                    onChange={(_, val) =>
                      typeof val === "number" && updateCardShadow({ opacity: val })
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          )}
          {cardShadowPreset === "custom" && (
            <TextField
              size="small"
              label={t("manager.visualBuilder.pageStyle.card.shadow")}
              value={v.cardShadow || ""}
              onChange={(e) => set({ cardShadow: e.target.value })}
              placeholder={t("manager.visualBuilder.pageStyle.card.shadowExample")}
              error={!isShadowValid(v.cardShadow || "")}
              helperText={
                isShadowValid(v.cardShadow || "")
                  ? "Example: 0 8px 24px rgba(0,0,0,0.12)"
                  : "Enter a valid CSS shadow (e.g. 0 8px 24px rgba(0,0,0,0.12))"
              }
              fullWidth
            />
          )}

          <Divider />
          <Typography variant="subtitle2">{t("manager.visualBuilder.pageStyle.hero.heading")}</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Hero shadow preset</InputLabel>
            <Select
              label="Hero shadow preset"
              value={heroShadowPreset}
              onChange={(e) => {
                const key = e.target.value;
                if (key === "custom") return;
                const preset = shadowPresets.find((p) => p.key === key);
                set({ heroHeadingShadow: preset ? preset.value : "" });
              }}
            >
              {shadowPresets.map((preset) => (
                <MenuItem key={preset.key} value={preset.key}>
                  {preset.label}
                </MenuItem>
              ))}
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
            <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
          </FormControl>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setHeroShadowBuilderOpen((prev) => !prev)}
            >
              {heroShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
            </Button>
            {heroShadowPreset !== "custom" && (
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  const preset = shadowPresets.find((p) => p.key === heroShadowPreset);
                  set({ heroHeadingShadow: preset ? preset.value : "" });
                }}
              >
                Reset to preset
              </Button>
            )}
          </Stack>
          {heroShadowBuilderOpen && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  label="X"
                  type="number"
                  value={heroShadowValues.x}
                  onChange={(e) => updateHeroShadow({ x: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Y"
                  type="number"
                  value={heroShadowValues.y}
                  onChange={(e) => updateHeroShadow({ y: Number(e.target.value || 0) })}
                />
                <TextField
                  size="small"
                  label="Blur"
                  type="number"
                  value={heroShadowValues.blur}
                  onChange={(e) => updateHeroShadow({ blur: Number(e.target.value || 0) })}
                />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                {colorField({
                  label: "Shadow color",
                  value: heroShadowValues.color,
                  onChange: (val) => updateHeroShadow({ color: val }),
                })}
                <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                  <Typography variant="caption">Opacity</Typography>
                  <Slider
                    size="small"
                    min={0}
                    max={1}
                    step={0.05}
                    value={heroShadowValues.opacity}
                    valueLabelDisplay="auto"
                    onChange={(_, val) =>
                      typeof val === "number" && updateHeroShadow({ opacity: val })
                    }
                  />
                </Stack>
              </Stack>
            </Stack>
          )}
          {heroShadowPreset === "custom" && (
            <TextField
              size="small"
              label={t("manager.visualBuilder.pageStyle.hero.shadow")}
              value={v.heroHeadingShadow || "0 2px 24px rgba(0,0,0,.25)"}
              onChange={(e) => set({ heroHeadingShadow: e.target.value })}
              error={!isShadowValid(v.heroHeadingShadow || "")}
              helperText={
                isShadowValid(v.heroHeadingShadow || "")
                  ? "Example: 0 2px 24px rgba(0,0,0,0.25)"
                  : "Enter a valid CSS shadow."
              }
              fullWidth
            />
          )}
        </Stack>
      )}

      <Divider sx={{ my: 1 }} />
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={!!applyToAll}
              onChange={(_, c) => onToggleApplyToAll?.(c)}
            />
          }
          label={t("manager.visualBuilder.pageStyle.applyAllLabel")}
        />
      </Stack>

      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          pt: 1,
          pb: 1,
          px: 1,
          borderTop: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Typography variant="caption" color={isDirty ? "warning.main" : "text.secondary"}>
          {isDirty ? "Unsaved changes" : "All changes saved"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            onClick={onResetToSiteTheme}
            disabled={!onResetToSiteTheme || !canResetToSiteTheme}
          >
            Reset this page to site theme
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onChange?.(initialStyleRef.current || {})}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => onApplyNow?.()}
            disabled={!onApplyNow}
          >
            {t("manager.visualBuilder.pageStyle.applyNow")}
          </Button>
        </Stack>
      </Box>

      <Button
        size="small"
        variant="contained"
        startIcon={<PaletteIcon />}
        onClick={onOpenAdvanced}
      >
        {t("manager.visualBuilder.pageStyle.openAdvanced")}
      </Button>
    </Stack>
  );

}



/* ---------- Main builder ---------- */

export default function VisualSiteBuilder({ companyId: companyIdProp }) {
  // prefer explicit prop if parent passed one
  const { t } = useTranslation();
  const location = useLocation();                 // ✅ use the hook, not window.location
  const detectedCompanyId = useCompanyId();       // ✅ get it from the hook
  const theme = useTheme();
  const isLgDown = useMediaQuery(theme.breakpoints.down("lg"));
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));
  const normalizedCompanyIdProp = useMemo(
    () => parsePositiveCompanyId(companyIdProp),
    [companyIdProp]
  );
  const [companyId, setCompanyId] = useState(     // ✅ local state
    normalizedCompanyIdProp ?? detectedCompanyId ?? ""
  );
  const supportQuery = useMemo(() => {
    const params = new URLSearchParams(location.search || "");
    const supportSession = params.get("support_session");
    if (!supportSession) return "";
    const cid =
      parsePositiveCompanyId(params.get("company_id")) ||
      parsePositiveCompanyId(params.get("cid")) ||
      companyId ||
      normalizedCompanyIdProp ||
      detectedCompanyId;
    const out = new URLSearchParams();
    out.set("support_session", supportSession);
    if (cid) out.set("company_id", String(cid));
    return `?${out.toString()}`;
  }, [location.search, companyId, normalizedCompanyIdProp, detectedCompanyId]);

  // local state the component already uses elsewhere
  const defaultThemeOverrides = useMemo(
    () => ({
      brandColor: "#6366F1",
      surface: "light",
      header: { background: "#111827", text: "#ffffff" },
      footer: { background: "#0f172a", text: "#e2e8f0" },
      radius: 20,
      shadow: "md",
    }),
    []
  );

  const [siteSettings, setSiteSettings] = useState(null);
  const [websiteCatalog, setWebsiteCatalog] = useState(null);
  const [websiteStatus, setWebsiteStatus] = useState(null);
  const [stylePreviewFamily, setStylePreviewFamily] = useState("");
  const [stylePreviewViewport, setStylePreviewViewport] = useState("desktop");
  const [styleSaving, setStyleSaving] = useState(false);
  const [styleMsg, setStyleMsg] = useState("");
  const [styleErr, setStyleErr] = useState("");
  const [pendingRendererStyle, setPendingRendererStyle] = useState(null);
  const [nextJsPreviewToken, setNextJsPreviewToken] = useState("");
  const [nextJsPreviewUrl, setNextJsPreviewUrl] = useState("");
  const [nextJsPreviewStale, setNextJsPreviewStale] = useState(false);
  const [styleGalleryPreviewUrl, setStyleGalleryPreviewUrl] = useState("");
  // The content Canvas is an editing surface. Keep its frame identity distinct
  // from the read-only style-gallery preview so postMessage selection events
  // cannot be checked against the wrong iframe after a tab change.
  const nextJsContentPreviewIframeRef = useRef(null);
  const [builderTabIndex, setBuilderTabIndex] = useState(getBuilderTabDefaultIndex(location?.search || ""));
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedModuleFieldPath, setSelectedModuleFieldPath] = useState("");
  const [unsupportedModuleWarning, setUnsupportedModuleWarning] = useState("");
  const [companyProfileSlug, setCompanyProfileSlug] = useState("");
  const [pageSettingsDirty, setPageSettingsDirty] = useState(false);
  const [pageMenuAnchor, setPageMenuAnchor] = useState(null);
  const [pageMenuTarget, setPageMenuTarget] = useState(null);
  const [canvasPageMenuAnchor, setCanvasPageMenuAnchor] = useState(null);
  const [newArticleDialogOpen, setNewArticleDialogOpen] = useState(false);
  const [newArticleDraft, setNewArticleDraft] = useState({
    title: "",
    slug: "",
    description: "",
    slugTouched: false,
  });
  const [toolsAnchorEl, setToolsAnchorEl] = useState(null);
  const rawNavOverrides = useMemo(
    () =>
      siteSettings?.nav_overrides ||
      siteSettings?.settings?.nav_overrides ||
      {},
    [siteSettings]
  );
  const nextJsPreviewOrigin = useMemo(() => {
    if (!hasConfiguredNextJsThemeBaseUrl()) return "";
    try {
      return new URL(TENANT_WEB_NEXT_BASE_URL).origin;
    } catch (_err) {
      return "";
    }
  }, []);

  const navOverridesWithDefault = useMemo(() => {
    const base = { ...(rawNavOverrides || {}) };
    if (!base.menu_source) {
      base.menu_source = "pages";
    }
    return base;
  }, [rawNavOverrides]);
  const [navStyleState, setNavStyleState] = useState(null);
  const [themeOverridesDraft, setThemeOverridesDraft] = useState(defaultThemeOverrides);
  const themeOverridesPersistedKeyRef = useRef(
    JSON.stringify(defaultThemeOverrides || {})
  );
  const nextJsThemeOverrideSaveTimerRef = useRef(null);
  const nextJsDraftSyncTimerRef = useRef(null);
  const nextJsDraftSyncSnapshotRef = useRef(null);
  const [pages, setPages] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [protectedCheckpointCount, setProtectedCheckpointCount] = useState(0);
  const [checkpointName, setCheckpointName] = useState("");
  const [checkpointNote, setCheckpointNote] = useState("");
  const [checkpointDialog, setCheckpointDialog] = useState({
    open: false,
    mode: null, // "restore" | "delete"
    publishNow: false,
    checkpoint: null,
  });
  const [checkpointPreview, setCheckpointPreview] = useState({
    open: false,
    loading: false,
    error: "",
    checkpoint: null,
  });
  const [selectedPageIds, setSelectedPageIds] = useState([]);
  const [navDraft, setNavDraft] = useState(null);
  const [navSaving, setNavSaving] = useState(false);
  const [navMsg, setNavMsg] = useState("");
  const [navErr, setNavErr] = useState("");
  const [headerDraft, setHeaderDraft] = useState(() => defaultHeaderConfig());
  const [footerDraft, setFooterDraft] = useState(() => defaultFooterConfig());
  const [brandingSaving, setBrandingSaving] = useState(false);
const [brandingMsg, setBrandingMsg] = useState("");
const [brandingErr, setBrandingErr] = useState("");
  const [companyProfile, setCompanyProfile] = useState(null);
  const [brandingLocalDirty, setBrandingLocalDirty] = useState(false);
  const siteThemeSettings = useMemo(
    () => readSiteThemeSettings(siteSettings),
    [siteSettings]
  );

  const loadCheckpoints = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const res = await wb.listCheckpoints(cid, { limit: 20 });
      const list = Array.isArray(res?.data?.checkpoints) ? res.data.checkpoints : [];
      setCheckpoints(list);
      setProtectedCheckpointCount(Number(res?.data?.protected_count || 0));
    } catch (e) {
      console.warn("Checkpoint load failed", e?.response?.data || e);
      setCheckpoints([]);
      setProtectedCheckpointCount(0);
    }
  }, []);

  const applyBrandingFromServer = useCallback(
    (settingsObj) => {
      if (!settingsObj) return;
      const headerFromServer = normalizeHeaderConfig(
        settingsObj.header || settingsObj.settings?.header || defaultHeaderConfig()
      );
      const footerFromServer = normalizeFooterConfig(
        settingsObj.footer || settingsObj.settings?.footer || defaultFooterConfig()
      );
      const themeOverrides =
        settingsObj.theme_overrides ||
        settingsObj.settings?.theme_overrides ||
        defaultThemeOverrides;
      setHeaderDraft(headerFromServer);
      setFooterDraft(footerFromServer);
      setThemeOverridesDraft(themeOverrides || defaultThemeOverrides);
      setBrandingLocalDirty(false);
      themeOverridesPersistedKeyRef.current = JSON.stringify(
        themeOverrides || defaultThemeOverrides || {}
      );
    },
    [defaultThemeOverrides]
  );

  const hasDraftChanges = Boolean(siteSettings?.has_unpublished_changes);
  const resolvedFooterContact = useMemo(() => {
    const profile = companyProfile || siteSettings?.company || {};
    return {
      email: profile.contact_email || profile.email || "",
      phone: profile.contact_phone || profile.phone || "",
      address: formatCompanyProfileAddress(profile),
    };
  }, [companyProfile, siteSettings?.company]);
  const footerSiteTitle =
    siteSettings?.site_title ||
    siteSettings?.settings?.site_title ||
    companyProfile?.name ||
    siteSettings?.company?.name ||
    "";
  const websiteStyleChoices = useMemo(
    () =>
      buildWebsiteStyleChoices({
        catalog: websiteCatalog,
        status: websiteStatus,
      }),
    [websiteCatalog, websiteStatus]
  );
  const nextJsWebsiteStyleChoices = useMemo(
    () => websiteStyleChoices.filter((style) => style.key !== "classic"),
    [websiteStyleChoices]
  );
  const builderRendererMode = resolveBuilderRendererMode({
    renderer_engine:
      siteSettings?.settings_draft?.renderer_engine ||
      siteSettings?.draft?.renderer_engine ||
      siteSettings?.renderer_engine,
    settings:
      siteSettings?.settings_draft ||
      siteSettings?.draft ||
      siteSettings?.settings,
    current_renderer_engine:
      websiteStatus?.draft_renderer_engine ||
      websiteStatus?.current_renderer_engine,
  });
  const currentRendererEngine = builderRendererMode;
  const currentVisualThemeKey =
    siteSettings?.settings_draft?.visual_theme_key ||
    siteSettings?.draft?.visual_theme_key ||
    siteSettings?.visual_theme_key ||
    siteSettings?.settings?.visual_theme_key ||
    websiteStatus?.draft_visual_theme_key ||
    websiteStatus?.current_visual_theme_key ||
    null;
  const currentVisualThemeVersion =
    siteSettings?.settings_draft?.visual_theme_version ||
    siteSettings?.draft?.visual_theme_version ||
    siteSettings?.visual_theme_version ||
    siteSettings?.settings?.visual_theme_version ||
    websiteStatus?.draft_visual_theme_version ||
    websiteStatus?.current_visual_theme_version ||
    1;
  const currentDesignFamily =
    siteSettings?.design_family ||
    siteSettings?.settings?.design_family ||
    "classic";
  const currentDesignVersion =
    siteSettings?.design_family_version ||
    siteSettings?.settings?.design_family_version ||
    1;
  const nextJsBrandingThemeKey = String(currentVisualThemeKey || "").trim().toLowerCase();
  const nextJsPageStyleCapabilities = resolveNextJsPageStyleCapabilities({
    rendererEngine: builderRendererMode,
    visualThemeKey: nextJsBrandingThemeKey,
  });
  const usesConciseNextJsBrandingSurface =
    Boolean(nextJsPageStyleCapabilities);
  const nextJsBrandingThemeName = nextJsBrandingThemeKey
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const currentStyleKey =
    isNextJsBuilderMode(builderRendererMode) ? currentVisualThemeKey || "" : "classic";
  const semanticModuleDisplayLabel = (module) => {
    const normalizedThemeKey = String(currentVisualThemeKey || "").trim().toLowerCase();
    const moduleType = String(module?.type || "").trim().toLowerCase();
    const moduleSlot = String(module?.slot || "").trim().toLowerCase();
    if (
      normalizedThemeKey === "iron-ember" &&
      ["gallery", "portfolio"].includes(moduleType) &&
      moduleSlot.startsWith("home")
    ) {
      return "Shop Gallery";
    }
    if (
      normalizedThemeKey === "frame-and-field" &&
      moduleType === "portfolio" &&
      moduleSlot.startsWith("home")
    ) {
      return "Selected Assignments";
    }
    return getThemeModuleDisplayLabel(normalizedThemeKey, module?.type, module?.slot);
  };
  const currentStyleVersion =
    isNextJsBuilderMode(builderRendererMode) ? Number(currentVisualThemeVersion || 1) : 1;
  const publishedRendererSelection = useMemo(
    () => getPublishedRendererSelection(websiteStatus || {}),
    [websiteStatus]
  );
  const liveStyleKey =
    isNextJsBuilderMode(publishedRendererSelection.rendererEngine)
      ? publishedRendererSelection.visualThemeKey || ""
      : "classic";
  const liveStyleVersion =
    isNextJsBuilderMode(publishedRendererSelection.rendererEngine)
      ? Number(publishedRendererSelection.visualThemeVersion || 1)
      : 1;
  const effectivePreviewFamily = stylePreviewFamily || currentStyleKey || "classic";
  const isNextJsContentMode =
    isNextJsBuilderMode(builderRendererMode) && Boolean(currentStyleKey);
  const usesSemanticDockedInspector = usesDockedSemanticInspector(builderRendererMode);
  const activeStyleChoice = websiteStyleChoices.find(
    (style) =>
      style.key === currentStyleKey && Number(style.version) === Number(currentStyleVersion)
  );
  const deprecatedStoredDesignFamily =
    !isNextJsBuilderMode(builderRendererMode) &&
    currentDesignFamily !== "classic" &&
    !activeStyleChoice
      ? currentDesignFamily
      : "";
  const lastPublishedLabel = useMemo(() => {
    const ts = siteSettings?.branding_published_at;
    if (!ts) return null;
    try {
      const date = new Date(ts);
      if (Number.isNaN(date.getTime())) return null;
      return `Published ${date.toLocaleString()}`;
    } catch {
      return null;
    }
  }, [siteSettings?.branding_published_at]);

  useEffect(() => {
    if (normalizedCompanyIdProp && normalizedCompanyIdProp !== companyId) {
      setCompanyId(normalizedCompanyIdProp);
    }
  }, [normalizedCompanyIdProp]); // eslint-disable-line react-hooks/exhaustive-deps

  
  // when the hook finally resolves, adopt it (avoids initializing as "")
  useEffect(() => {
    if (!companyId && detectedCompanyId) {
      setCompanyId(detectedCompanyId);
    }
  }, [detectedCompanyId, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

useEffect(() => {
    if (!navStyleState) return;
    setNavDraft((prev) => {
      const next = deriveNavDraft({
        nav_style: navStyleState,
        nav_overrides:
          prev?.nav_overrides ||
          siteSettings?.nav_overrides ||
          siteSettings?.settings?.nav_overrides ||
          {},
      });
      const prevHash = prev ? JSON.stringify(prev) : null;
      const nextHash = JSON.stringify(next);
      if (prevHash === nextHash) return prev;
      return next;
    });
  }, [navStyleState, siteSettings]);

  const justImported = Boolean(location.state?.postImportReload);
  const [suppressEmptyState, setSuppressEmptyState] = useState(justImported);

  // UI state (needs to live before effects that reference it)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
const [pagesListOpen, setPagesListOpen] = useState(false);
const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
const [seoSettingsOpen, setSeoSettingsOpen] = useState(false);
const [addSectionPanelOpen, setAddSectionPanelOpen] = useState(true);
const [inspectorOpen, setInspectorOpen] = useState(false);
const [semanticFloatingInspectorOpen, setSemanticFloatingInspectorOpen] = useState(false);
const [inspectorTab, setInspectorTab] = useState("content");
const [pageStyleOpen, setPageStyleOpen] = useState(false);
const canvasScrollRef = useRef(null);
  const [inspectorDrawerOpen, setInspectorDrawerOpen] = useState(false);
  const [brandingPanelOpen, setBrandingPanelOpen] = useState(false);
  const [navPanelOpen, setNavPanelOpen] = useState(false);

useEffect(() => {
  if (!justImported) return;
  const t = setTimeout(() => setSuppressEmptyState(false), 400);
  return () => clearTimeout(t);
}, [justImported]);

useEffect(() => {
  if (!isLgDown && inspectorDrawerOpen) {
    setInspectorDrawerOpen(false);
  }
}, [isLgDown, inspectorDrawerOpen]);

  const [loading, setLoading] = useState(true);        // ← used by Step 4
  const [authError, setAuthError] = useState(null);    // ← used by Step 5

  const slug = useMemo(() => {
    const [, s] = (location?.pathname || "").split("/");
    return s || "";
  }, [location?.pathname]);

  // ---------- Step 3: hardened preflight with 401/403 handling ----------
  useEffect(() => {
    if (!companyId) return;
    let alive = true;

    async function boot() {
      setLoading(true);
      setAuthError(null);
      try {
        // A local backend restart can leave a browser with a company id from a
        // previous session. Resolve the signed-in manager without sending that
        // stale company header before requesting website data. Explicit parent
        // and query contexts still win for support/admin flows.
        const params = new URLSearchParams(location?.search || "");
        const queryCompanyId =
          parsePositiveCompanyId(params.get("company_id")) ||
          parsePositiveCompanyId(params.get("cid"));
        if (!normalizedCompanyIdProp && !queryCompanyId) {
          const identity = await api.get("/auth/me", { noCompanyHeader: true }).catch(() => null);
          const authenticatedCompanyId = parsePositiveCompanyId(
            identity?.data?.company_id ??
              identity?.data?.company?.id ??
              identity?.data?.user?.company_id
          );
          if (
            authenticatedCompanyId &&
            authenticatedCompanyId !== Number(companyId)
          ) {
            localStorage.setItem("company_id", String(authenticatedCompanyId));
            setCompanyId(authenticatedCompanyId);
            setLoading(false);
            return;
          }
        }
        // Website status is advisory metadata.  It must never hold the
        // Builder boot hostage: a local backend can have an old status request
        // in flight while settings/pages are already available.  In that case
        // we can still derive the active Next theme from settings and mint the
        // preview normally.
        const statusRequest = wb.getStatus(companyId).catch(() => null);
        const [settingsRes, pagesRes, profileRes] = await Promise.all([
          wb.getSettings(companyId),
          wb.listPages(companyId),
          api
            .get("/admin/company-profile", {
              headers: { "X-Company-Id": String(companyId) },
            })
            .catch(() => null),
        ]);

        const pagesList =
          Array.isArray(pagesRes?.data) ? pagesRes.data :
          (pagesRes?.data?.items || []);

        const settingsPayload = settingsRes?.data ?? settingsRes ?? null;
        const profilePayload = profileRes?.data?.company || profileRes?.data || null;
        setCompanyProfile(profilePayload && typeof profilePayload === "object" ? profilePayload : null);
        // Do not await this optional request.  If it completes later it still
        // improves the style/status UI without blanking the canvas.
        let statusPayload = null;
        statusRequest.then((statusRes) => {
          if (!alive || !statusRes) return;
          const nextStatus = statusRes?.data ?? statusRes ?? null;
          if (nextStatus) setWebsiteStatus(nextStatus);
        });
        setSiteSettings(settingsPayload);
        const profileSlug =
          profileRes?.data?.slug ||
          profileRes?.data?.company?.slug ||
          "";
        if (profileSlug) setCompanyProfileSlug(String(profileSlug));
        applyBrandingFromServer(settingsPayload);
        setNavDraft(deriveNavDraft(settingsPayload));
        setNavMsg("");
        setNavErr("");

        const selectedWebsiteSettings =
          settingsPayload?.settings_draft ||
          settingsPayload?.draft ||
          settingsPayload?.settings ||
          settingsPayload || {};
        const nextJsWebsite = isNextJsBuilderMode(
          resolveBuilderRendererMode({
            renderer_engine:
              statusPayload?.draft_renderer_engine ||
              statusPayload?.current_renderer_engine ||
              selectedWebsiteSettings.renderer_engine,
            settings: selectedWebsiteSettings,
          })
        );
        const nextJsThemeKey = nextJsWebsite
          ? String(
            selectedWebsiteSettings.visual_theme_key ||
              statusPayload?.draft_visual_theme_key ||
              statusPayload?.current_visual_theme_key ||
              ""
          )
            .trim()
            .toLowerCase()
          : "";
        const isIronEmberNextWebsite = nextJsThemeKey === "iron-ember";
        const provisionNextPublicBuilderPages = shouldProvisionNextPublicBuilderPages(nextJsThemeKey);
        // A blank Next.js site is intentionally blank until its selected theme
        // installs a canonical starter blueprint. The Classic import path stays
        // exactly as it was for legacy-react websites.
        if (!pagesList.length && !nextJsWebsite) {
          try {
            const { data: all } = await wb.listTemplates();
            const templates = Array.isArray(all)
              ? all
              : Array.isArray(all?.templates)
              ? all.templates
              : Array.isArray(all?.items)
              ? all.items
              : [];

            const def = templates.find((t) => t.is_default) || templates[0];
            if (def?.key) {
              await wb.importTemplate(companyId, { key: def.key }); // header + ?company_id=
              const pages2 = await wb.listPages(companyId);
              if (!alive) return;
              setPages(pages2?.data || []);
              setLoading(false);
              return;
            }
          } catch (e) {
            throw e;
          }
        }

        const normalizedLegacy = await ensureLegacyBuilderPages(
          companyId,
          settingsPayload,
          pagesList,
          { isIronEmberNextWebsite, provisionNextPublicBuilderPages, nextJsThemeKey }
        );
        if (!alive) return;
        const finalSettings = normalizedLegacy.settings || settingsPayload;
        const normalizedPages = (normalizedLegacy.pages || pagesList).map((page) =>
          ensureSectionIds(withLiftedLayout(normalizePage(page)))
        );
        setSiteSettings(finalSettings);
        setNavDraft(deriveNavDraft(finalSettings));
        setPages(normalizedPages);
        // Boot must select an actual persisted page. Without this the preview
        // URL retains emptyPage()'s `new-page` slug, which is not a WebsitePage
        // and produces a 400/blank Next.js canvas after reload.
        const home =
          normalizedPages.find((page) => page.is_homepage) ||
          normalizedPages.find((page) => String(page.slug || "").toLowerCase() === "home") ||
          normalizedPages.find((page) => Number(page.sort_order) === 0) ||
          normalizedPages[0];
        if (home) {
          setSelectedId(home.id);
          setEditing(home);
        }
        await loadCheckpoints(companyId);
        setLoading(false);
      } catch (e) {
        const code = e?.response?.status;
        if ((code === 401 || code === 403) && alive) {
          setAuthError({ code, slug, cid: companyId });
          setPages([]);
          setLoading(false);
          return;
        }
        console.error("[VisualSiteBuilder] boot error:", e);
        if (alive) {
          setAuthError({ code: code || 500, slug, cid: companyId });
          setLoading(false);
        }
      }
    }

    boot();
    return () => { alive = false; };
  }, [companyId, slug, location?.key, applyBrandingFromServer, loadCheckpoints]);

  useEffect(() => {
    if (!companyId) return;
    let alive = true;
    // Keep the renderer catalog independent from the optional status request.
    // The catalog is what makes a selected Next theme previewable.  Pairing it
    // with status in Promise.all meant one stalled status request left the
    // Builder with no matching theme and therefore an empty iframe.
    wb.getCatalog(companyId)
      .then((catalogRes) => {
        if (!alive) return;
        setWebsiteCatalog(catalogRes?.data || catalogRes || null);
      })
      .catch((e) => {
        console.warn("Website catalog load failed", e?.response?.data || e);
      });
    wb.getStatus(companyId)
      .then((statusRes) => {
        if (!alive) return;
        setWebsiteStatus(statusRes?.data || statusRes || null);
      })
      .catch((e) => {
        console.warn("Website status load failed", e?.response?.data || e);
      });
    return () => {
      alive = false;
    };
  }, [companyId, location?.key]);

  const [selectedId, setSelectedId] = useState(null);
  const [pendingPreviewSelection, setPendingPreviewSelection] = useState(null);

  // History state for undo/redo
  const {
    value: editing,
    set: setEditing,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(emptyPage());
  const [selectedBlock, setSelectedBlock] = useState(-1);
  const [blockPreview, setBlockPreview] = useState({
    open: false,
    src: "",
    label: "",
  });
  const activeNextThemeManifest = useMemo(
    () => (isNextJsContentMode ? getPageManifest(currentStyleKey, inferPageKind(editing || {})) : null),
    [currentStyleKey, editing, isNextJsContentMode]
  );

  useEffect(() => {
    const handleMessage = (event) => {
      // Prefer the actual current iframe origin. A local renderer can move
      // between localhost and 127.0.0.1 after a restart while the CRA build
      // still holds the configured base URL.
      let activePreviewOrigin = nextJsPreviewOrigin;
      try {
        activePreviewOrigin = new URL(nextJsContentPreviewIframeRef.current?.src || nextJsPreviewOrigin).origin;
      } catch (_err) {
        // Keep the configured origin as the safe fallback.
      }
      const acceptedPreviewMessage = isAcceptedPreviewMessage({
          eventOrigin: event.origin,
          expectedOrigin: activePreviewOrigin,
          eventSource: event.source,
          expectedSource: nextJsContentPreviewIframeRef.current?.contentWindow,
        });
      if (!acceptedPreviewMessage) {
        return;
      }
      const data = event?.data;
      if (!data) return;
      if (data.type === "schedulaa:website-page-menu-toggle") {
        const pageId = data.pageId == null ? null : Number(data.pageId);
        if (pageId) {
          const nextShowInMenu = Boolean(
            Object.prototype.hasOwnProperty.call(data, "showInMenu") ? data.showInMenu : false
          );
          applyPageActionPatch(pageId, { show_in_menu: nextShowInMenu });
          setStyleMsg(
            `${String(data.label || "Page")} ${nextShowInMenu ? "shown in" : "hidden from"} menu.`
          );
          setBuilderTabIndex(0);
        }
        return;
      }
      if (data.type !== "schedulaa:website-slot-select") return;
      const slot = String(data.slot || "").trim();
      const label = String(data.label || slot).trim();
      const fieldPath = normalizeSemanticFieldPath(data.fieldPath);
      const settingsPanel = String(data.settingsPanel || "").trim().toLowerCase();
      if (settingsPanel === "branding") {
        setBrandingPanelOpen(true);
        setStyleMsg(`Selected shared setting: ${label}`);
        setBuilderTabIndex(0);
        return;
      }
      // Resolve against the latest page list in a follow-up effect. Preview
      // messages can arrive while the Builder is still replacing its initial
      // blank page with the persisted homepage after a local reload.
      setPendingPreviewSelection({
        pageId: data.pageId == null ? null : String(data.pageId),
        pagePath: data.pagePath || "",
        moduleId: data.moduleId || "",
        slot,
        fieldPath,
      });
      setStyleMsg(`Selected editable slot: ${label}`);
      setBuilderTabIndex(0);
      if (data.pageId) {
        const matchById = pages.find((page) => String(page.id) === String(data.pageId));
        if (matchById) {
          const lifted = ensureSectionIds(withLiftedLayout(matchById));
          setSelectedId(lifted.id);
          setEditing(lifted);
        }
      } else if (data.pagePath) {
        const normalizedPath = String(data.pagePath).replace(/^\/+/, "");
        const matchByPath = pages.find(
          (page) => (isNextJsContentMode ? normalizeNextJsPreviewPagePath(page) : normalizePreviewPagePath(page)).join("/") === normalizedPath
        );
        if (matchByPath) {
          const lifted = ensureSectionIds(withLiftedLayout(matchByPath));
          setSelectedId(lifted.id);
          setEditing(lifted);
        }
      }
      if (data.moduleId) {
        const moduleId = String(data.moduleId);
        setSelectedModuleId(moduleId);
        setSelectedModuleFieldPath(fieldPath);
        const availableModules = safeModules(editing || {});
        const selectedModule = availableModules.find((module) => module.id === moduleId);
        if (!isNextJsContentMode) {
          const legacySectionId =
            selectedModule?.settings?.legacySectionId || selectedModule?.id || null;
          const canvasIndex = safeSections(editing || {}).findIndex(
            (section) => section?.id === legacySectionId
          );
          if (canvasIndex >= 0) {
            setSelectedBlock(canvasIndex);
          }
        }
      } else if (slot) {
        const availableModules = safeModules(editing || {});
        const slotMatch = availableModules.find((module) => module.slot === slot);
        if (slotMatch) {
          setSelectedModuleId(slotMatch.id);
          setSelectedModuleFieldPath(fieldPath);
          if (!isNextJsContentMode) {
            const legacySectionId =
              slotMatch?.settings?.legacySectionId || slotMatch?.id || null;
            const canvasIndex = safeSections(editing || {}).findIndex(
              (section) => section?.id === legacySectionId
            );
            if (canvasIndex >= 0) {
              setSelectedBlock(canvasIndex);
            }
          }
        } else {
          const heroMatch = slot === "home.hero" ? availableModules.find((module) => module.type === "hero") : null;
          if (heroMatch) {
            setSelectedModuleId(heroMatch.id);
            setSelectedModuleFieldPath(fieldPath);
            if (!isNextJsContentMode) {
              const legacySectionId =
                heroMatch?.settings?.legacySectionId || heroMatch?.id || null;
              const canvasIndex = safeSections(editing || {}).findIndex(
                (section) => section?.id === legacySectionId
              );
              if (canvasIndex >= 0) {
                setSelectedBlock(canvasIndex);
              }
            }
          }
        }
      }
      if (slot.startsWith("page:")) {
        setPageSettingsOpen(true);
      } else {
        setInspectorOpen(true);
        setInspectorTab("content");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [editing, isNextJsContentMode, nextJsPreviewOrigin, pages, setEditing]);

  useEffect(() => {
    if (!pendingPreviewSelection) return;
    const targetPage = pendingPreviewSelection.pageId
      ? pages.find((page) => String(page.id) === pendingPreviewSelection.pageId)
      : pages.find((page) => (isNextJsContentMode ? normalizeNextJsPreviewPagePath(page) : normalizePreviewPagePath(page)).join("/") === String(pendingPreviewSelection.pagePath || "").replace(/^\/+/, ""));
    if (!targetPage) return;
    if (String(editing?.id || "") !== String(targetPage.id)) {
      const lifted = ensureSectionIds(withLiftedLayout(targetPage));
      setSelectedId(lifted.id);
      setEditing(lifted);
      return;
    }
    const modules = safeModules(editing || {});
    const module = pendingPreviewSelection.moduleId
      ? modules.find((item) => item.id === pendingPreviewSelection.moduleId)
      : modules.find((item) => item.slot === pendingPreviewSelection.slot) || (pendingPreviewSelection.slot === "home.hero" ? modules.find((item) => item.type === "hero") : null);
    if (!module) {
      // Record-backed composition pages can pre-date semantic intro modules.
      // The rendered hero/list must still be editable as a normal Builder
      // section, rather than becoming an unselectable page fallback. Create
      // the real persisted composition module only when the manager selects it.
      const slot = String(pendingPreviewSelection.slot || "");
      const editableInnerHeroSlots = [
        "about.intro",
        "services.intro",
        "products.intro",
        "projects.intro",
        "reviews.intro",
        "contact.intro",
        "jobs.intro",
        "blog.intro",
        "service-areas.intro",
        "faq.intro",
        "legal.intro",
        "generic.intro",
      ];
      if ([...editableInnerHeroSlots, "reviews.list"].includes(slot)) {
        const created = createSemanticModule(
          slot === "reviews.list" ? "reviews" : "hero",
          editing,
          slot
        );
        const hero = editing?.hero || {};
        const media = hero?.media || {};
        const currentContent = normalizePageContent(editing?.content || {});
        const heroDescription = sanitizeNextJsEditableText(hero?.description || hero?.intro || "");
        created.content = {
          ...created.content,
          eyebrow: editing?.menu_title || editing?.menuTitle || editing?.title || "",
          heading: hero?.title || editing?.menu_title || editing?.menuTitle || editing?.title || "",
          subheading: heroDescription,
          intro: heroDescription,
          body: heroDescription,
          image: media?.imageUrl || media?.url || hero?.imageUrl || hero?.image || "",
          imageUrl: media?.imageUrl || media?.url || hero?.imageUrl || hero?.image || "",
          imageAlt: media?.imageAlt || hero?.imageAlt || editing?.title || "",
        };
        const nextEditing = withNormalizedModules({
          ...editing,
          content: {
            ...currentContent,
            modules: [...modules, created],
          },
        });
        setEditing(nextEditing);
        setSelectedModuleId(created.id);
        setSelectedModuleFieldPath(pendingPreviewSelection.fieldPath || "content.heading");
        setInspectorOpen(true);
        setInspectorTab("content");
        setPageSettingsDirty(true);
        setPendingPreviewSelection(null);
      }
      return;
    }
    setSelectedModuleId(module.id);
    setSelectedModuleFieldPath(pendingPreviewSelection.fieldPath);
    setInspectorOpen(true);
    setInspectorTab("content");
    setPendingPreviewSelection(null);
  }, [editing, isNextJsContentMode, pages, pendingPreviewSelection, setEditing]);

  useEffect(() => {
    setPageSettingsDirty(false);
  }, [editing?.id]);


const handleNavDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    const normalized = normalizeNavStyle(draft?.nav_style || {});
    const overrides = draft?.nav_overrides || navOverridesWithDefault || {};
    setNavDraft({ nav_style: normalized, nav_overrides: overrides });
    setNavMsg("");
    setNavErr("");
    setNavStyleState(normalized);
    setSiteSettings((prev) =>
      mergeNavIntoSettings(prev, { nav_style: normalized, nav_overrides: overrides })
    );
  },
  [setSiteSettings, navOverridesWithDefault]
);

const openBlockPreview = useCallback((type, label) => {
  const src = BLOCK_PREVIEWS[type];
  if (!src) return;
  setBlockPreview({ open: true, src, label });
}, []);

  const closeBlockPreview = useCallback(() => {
    setBlockPreview((prev) => ({ ...prev, open: false }));
  }, []);

const openToolsMenu = useCallback((event) => {
  event.stopPropagation();
  setToolsAnchorEl(event.currentTarget);
}, []);

const closeToolsMenu = useCallback(() => {
  setToolsAnchorEl(null);
}, []);

const handlePageMenuOpen = useCallback((event, page) => {
  event.stopPropagation();
  setPageMenuAnchor(event.currentTarget);
  setPageMenuTarget(page);
}, []);

const handlePageMenuClose = useCallback(() => {
  setPageMenuAnchor(null);
  setPageMenuTarget(null);
}, []);

const handleHeaderDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    const normalized = normalizeHeaderConfig(draft);
    setHeaderDraft(normalized);
    setBrandingMsg("");
    setBrandingErr("");
    setBrandingLocalDirty(true);
    setSiteSettings((prev) => ({
      ...(prev || {}),
      header: normalized,
      settings: {
        ...(prev?.settings || {}),
        header: normalized,
      },
    }));
  },
  [setSiteSettings]
);

const handleHeaderItemRemove = useCallback(
  (payload) => {
    if (!payload) return;
    const next = normalizeHeaderConfig(headerDraft || defaultHeaderConfig());
    switch (payload.type) {
      case "logo":
        next.logo_asset_id = null;
        next.logo_asset = null;
        next.logo_url = "";
        next.logo_asset_url = "";
        break;
      case "brand-text":
        next.show_brand_text = false;
        break;
      case "social":
        next.social_links = (next.social_links || []).filter(
          (_, idx) => idx !== payload.index
        );
        break;
      default:
        break;
    }
    setBrandingPanelOpen(true);
    handleHeaderDraftChange(next);
  },
  [headerDraft, handleHeaderDraftChange, setBrandingPanelOpen]
);

const handleFooterDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    const normalized = normalizeFooterConfig(draft);
    setFooterDraft(normalized);
    setBrandingMsg("");
    setBrandingErr("");
    setBrandingLocalDirty(true);
    setSiteSettings((prev) => ({
      ...(prev || {}),
      footer: normalized,
      settings: {
        ...(prev?.settings || {}),
        footer: normalized,
      },
    }));
  },
  [setSiteSettings]
);

const handleThemeOverridesDraftChange = useCallback(
  (draft) => {
    if (!draft) return;
    setThemeOverridesDraft(draft);
    setBrandingMsg("");
    setBrandingErr("");
    setBrandingLocalDirty(true);
    setSiteSettings((prev) => ({
      ...(prev || {}),
      theme_overrides: draft,
      settings: {
        ...(prev?.settings || {}),
        theme_overrides: draft,
      },
    }));
  },
  [setSiteSettings]
);

const handleFooterItemRemove = useCallback(
  (payload) => {
    if (!payload) return;
    const next = normalizeFooterConfig(footerDraft || defaultFooterConfig());
    switch (payload.type) {
      case "logo":
        next.logo_asset_id = null;
        next.logo_asset = null;
        next.logo_url = "";
        next.logo_asset_url = "";
        break;
      case "text":
        next.text = "";
        break;
      case "social":
        next.social_links = (next.social_links || []).filter(
          (_, idx) => idx !== payload.index
        );
        break;
      case "legal":
        next.legal_links = (next.legal_links || []).filter(
          (_, idx) => idx !== payload.index
        );
        break;
      case "column":
        next.columns = (next.columns || []).filter(
          (_, idx) => idx !== payload.columnIndex
        );
        break;
      case "column-link":
        next.columns = (next.columns || []).map((col, colIdx) => {
          if (colIdx !== payload.columnIndex) return col;
          const links = (col.links || []).filter(
            (_, linkIdx) => linkIdx !== payload.linkIndex
          );
          return { ...col, links };
        });
        break;
      default:
        break;
    }
    setBrandingPanelOpen(true);
    handleFooterDraftChange(next);
  },
  [footerDraft, handleFooterDraftChange, setBrandingPanelOpen]
);

const handleNavOverridesChange = useCallback(
  (nextOverrides) => {
    if (!nextOverrides) return;
    setBrandingMsg("");
    setBrandingErr("");
    setSiteSettings((prev) => ({
      ...(prev || {}),
      nav_overrides: nextOverrides,
      settings: {
        ...(prev?.settings || {}),
        nav_overrides: nextOverrides,
      },
    }));
  },
  [setSiteSettings]
);

const handleSiteThemeSettingsChange = useCallback(
  (patch) => {
    setSiteSettings((prev) => mergeSiteThemeIntoSettings(prev, patch));
  },
  [setSiteSettings]
);

const applyThemePreset = useCallback(
  async (preset, { applyToAll = false } = {}) => {
    if (!preset) return;

    const currentPageStyle =
      readPageStyleProps(editing) ||
      editing?.content?.meta?.pageStyle ||
      editing?.content?.style ||
      {};
    const nextPageStyle = sanitizePageStyleRadii({
      ...currentPageStyle,
      ...(preset.pageStyle || {}),
      themePresetKey: preset.key,
    });

    setEditing((cur) => {
      const content = { ...(cur.content || {}) };
      content.meta = { ...(content.meta || {}), pageStyle: nextPageStyle };
      content.style = { ...(content.style || {}), ...nextPageStyle };
      let updated = { ...cur, content };
      updated = writePageStyleProps(updated, nextPageStyle);
      return withLiftedLayout(updated);
    });

    const nextNav = normalizeNavStyle({
      ...(navStyleState || NAV_STYLE_DEFAULT),
      ...(preset.navStyle || {}),
    });
    const nextThemeOverrides = buildThemeOverridesFromPreset(
      preset,
      themeOverridesDraft,
      defaultThemeOverrides
    );
    const syncChrome = readSiteThemeSettings(siteSettings).syncChrome !== false;
    if (syncChrome) {
      applyThemePresetToHeaderDraft(preset);
      applyThemePresetToFooterDraft(preset);
    }
    handleThemeOverridesDraftChange(nextThemeOverrides);
    if (syncChrome) {
      handleNavDraftChange({ nav_style: nextNav });
    }
    handleSiteThemeSettingsChange({
      themePresetKey: preset.key,
      industryStarterPackKey: "",
    });
    setBrandingPanelOpen(true);

    if (applyToAll) {
      await applyStyleToAllPagesNow(nextPageStyle);
    }

    setMsg(`Applied theme preset: ${preset.label}`);
    setErr("");
  },
  [
    applyStyleToAllPagesNow,
    editing,
    defaultThemeOverrides,
    footerDraft,
    handleFooterDraftChange,
    handleHeaderDraftChange,
    handleSiteThemeSettingsChange,
    handleThemeOverridesDraftChange,
    handleNavDraftChange,
    headerDraft,
    navStyleState,
    setBrandingPanelOpen,
    siteSettings,
    themeOverridesDraft,
  ]
);

const applyButtonStylePreset = useCallback(
  async (preset, { applyToAll = false } = {}) => {
    if (!preset) return;
    const currentPageStyle =
      readPageStyleProps(editing) ||
      editing?.content?.meta?.pageStyle ||
      editing?.content?.style ||
      {};
    const nextPageStyle = sanitizePageStyleRadii({
      ...currentPageStyle,
      ...(preset.values || {}),
      buttonStylePresetKey: preset.key,
    });

    setEditing((cur) => {
      const content = { ...(cur.content || {}) };
      content.meta = { ...(content.meta || {}), pageStyle: nextPageStyle };
      content.style = { ...(content.style || {}), ...nextPageStyle };
      let updated = { ...cur, content };
      updated = writePageStyleProps(updated, nextPageStyle);
      return withLiftedLayout(updated);
    });

    if (applyToAll) {
      await applyStyleToAllPagesNow(nextPageStyle);
    }

    setMsg(`Applied button style: ${preset.label}`);
    setErr("");
  },
  [applyStyleToAllPagesNow, editing]
);

function applyThemePresetToHeaderDraft(preset, headerModeValues = null) {
  const baseHeader = normalizeHeaderConfig(headerDraft || defaultHeaderConfig());
  const nextHeader = normalizeHeaderConfig({
    ...baseHeader,
    bg: preset?.header?.bg ?? "",
    text_color: preset?.header?.text_color ?? "",
    transparent_bg: preset?.header?.transparent_bg ?? "",
    scrolled_bg: preset?.header?.scrolled_bg ?? "",
    scrolled_text_color: preset?.header?.scrolled_text_color ?? "",
    ...(headerModeValues || {}),
  });
  handleHeaderDraftChange(nextHeader);
  return nextHeader;
}

function applyThemePresetToFooterDraft(preset) {
  const baseFooter = normalizeFooterConfig(footerDraft || defaultFooterConfig());
  const nextFooter = normalizeFooterConfig({
    ...baseFooter,
    bg: preset?.footer?.bg ?? "",
    text_color: preset?.footer?.text_color ?? "",
    link_color: preset?.footer?.link_color ?? "",
  });
  handleFooterDraftChange(nextFooter);
  return nextFooter;
}

const applyHeaderModePreset = useCallback(
  (preset) => {
    if (!preset) return;
    const nextHeader = normalizeHeaderConfig({
      ...(headerDraft || defaultHeaderConfig()),
      ...(preset.values || {}),
    });
    handleHeaderDraftChange(nextHeader);
    setBrandingPanelOpen(true);
    setMsg(`Applied header mode: ${preset.label}`);
    setErr("");
  },
  [handleHeaderDraftChange, headerDraft, setBrandingPanelOpen]
);

const applyIndustryStarterPack = useCallback(
  async (pack, { applyToAll = false } = {}) => {
    if (!pack) return;
    const themePreset = THEME_PRESET_LIBRARY.find((preset) => preset.key === pack.themePresetKey);
    const buttonPreset = BUTTON_STYLE_PRESET_LIBRARY.find((preset) => preset.key === pack.buttonStyleKey);
    const headerPreset = HEADER_MODE_PRESET_LIBRARY.find((preset) => preset.key === pack.headerModeKey);
    if (!themePreset) return;

    const currentPageStyle =
      readPageStyleProps(editing) ||
      editing?.content?.meta?.pageStyle ||
      editing?.content?.style ||
      {};
    const nextPageStyle = sanitizePageStyleRadii({
      ...currentPageStyle,
      ...(themePreset.pageStyle || {}),
      ...(buttonPreset?.values || {}),
      themePresetKey: themePreset.key,
      buttonStylePresetKey: buttonPreset?.key || currentPageStyle.buttonStylePresetKey,
      industryStarterPackKey: pack.key,
    });

    setEditing((cur) => {
      const content = { ...(cur.content || {}) };
      content.meta = { ...(content.meta || {}), pageStyle: nextPageStyle };
      content.style = { ...(content.style || {}), ...nextPageStyle };
      let updated = { ...cur, content };
      updated = writePageStyleProps(updated, nextPageStyle);
      return withLiftedLayout(updated);
    });

    const nextNav = normalizeNavStyle({
      ...(navStyleState || NAV_STYLE_DEFAULT),
      ...(themePreset.navStyle || {}),
    });
    const nextThemeOverrides = buildThemeOverridesFromPreset(
      themePreset,
      themeOverridesDraft,
      defaultThemeOverrides
    );
    const syncChrome = readSiteThemeSettings(siteSettings).syncChrome !== false;
    if (syncChrome) {
      applyThemePresetToHeaderDraft(themePreset, headerPreset?.values || null);
      applyThemePresetToFooterDraft(themePreset);
    }
    handleThemeOverridesDraftChange(nextThemeOverrides);
    if (syncChrome) {
      handleNavDraftChange({ nav_style: nextNav });
    }
    handleSiteThemeSettingsChange({
      themePresetKey: themePreset.key,
      industryStarterPackKey: pack.key,
      headerModeKey: headerPreset?.key || "",
      buttonStylePresetKey: buttonPreset?.key || "",
    });
    setBrandingPanelOpen(true);

    if (applyToAll) {
      await applyStyleToAllPagesNow(nextPageStyle);
    }

    setMsg(`Applied starter pack: ${pack.label}`);
    setErr("");
  },
  [
    applyStyleToAllPagesNow,
    editing,
    defaultThemeOverrides,
    footerDraft,
    handleFooterDraftChange,
    handleHeaderDraftChange,
    handleSiteThemeSettingsChange,
    handleThemeOverridesDraftChange,
    handleNavDraftChange,
    headerDraft,
    navStyleState,
    setBrandingPanelOpen,
    siteSettings,
    themeOverridesDraft,
  ]
);

const reapplyThemeToChrome = useCallback(() => {
  const activeTheme = readSiteThemeSettings(siteSettings);
  const activePack =
    activeTheme?.industryStarterPackKey
      ? INDUSTRY_STARTER_PACKS.find((item) => item.key === activeTheme.industryStarterPackKey)
      : null;
  const currentPageStyle =
    readPageStyleProps(editing) ||
    editing?.content?.meta?.pageStyle ||
    editing?.content?.style ||
    {};
  const presetKey =
    activePack?.themePresetKey ||
    activeTheme?.themePresetKey ||
    currentPageStyle?.themePresetKey ||
    siteSettings?.pageStyleDefault?.themePresetKey ||
    null;
  if (!presetKey) {
    setErr("No theme preset is active on this page.");
    return;
  }
  const preset = THEME_PRESET_LIBRARY.find((item) => item.key === presetKey);
  if (!preset) {
    setErr("The saved theme preset could not be found.");
    return;
  }
  const activeHeaderPreset =
    activePack?.headerModeKey || activeTheme?.headerModeKey
      ? HEADER_MODE_PRESET_LIBRARY.find(
          (item) => item.key === (activePack?.headerModeKey || activeTheme?.headerModeKey)
        )
      : null;
  const nextNav = normalizeNavStyle({
    ...(navStyleState || NAV_STYLE_DEFAULT),
    ...(preset.navStyle || {}),
  });
  const nextThemeOverrides = buildThemeOverridesFromPreset(
    preset,
    themeOverridesDraft,
    defaultThemeOverrides
  );
  applyThemePresetToHeaderDraft(preset, activeHeaderPreset?.values || null);
  applyThemePresetToFooterDraft(preset);
  handleThemeOverridesDraftChange(nextThemeOverrides);
  handleNavDraftChange({ nav_style: nextNav });
  setBrandingPanelOpen(true);
  setMsg(`Reapplied theme to header, footer, and menu: ${preset.label}`);
  setErr("");
}, [
  defaultThemeOverrides,
  editing,
  footerDraft,
  handleFooterDraftChange,
  handleHeaderDraftChange,
  handleNavDraftChange,
  handleThemeOverridesDraftChange,
  headerDraft,
  navStyleState,
  setBrandingPanelOpen,
  siteThemeSettings,
  siteSettings?.pageStyleDefault?.themePresetKey,
  themeOverridesDraft,
]);

const resetCurrentPageToSiteTheme = useCallback(() => {
  const nextPageStyle =
    siteSettings?.pageStyleDefault &&
    typeof siteSettings.pageStyleDefault === "object"
      ? { ...siteSettings.pageStyleDefault }
      : {};

  setEditing((cur) => {
    const content = { ...(cur.content || {}) };
    content.meta = { ...(content.meta || {}), pageStyle: nextPageStyle };
    content.style = { ...(content.style || {}), ...nextPageStyle };
    let updated = { ...cur, content };
    updated = writePageStyleProps(updated, nextPageStyle);
    return withLiftedLayout(updated);
  });

  setMsg(
    Object.keys(nextPageStyle).length
      ? "Reset this page to the saved site theme."
      : "Cleared page-specific style overrides."
  );
  setErr("");
}, [setEditing, siteSettings]);

const saveNavSettings = useCallback(
  async (draft) => {
    if (!companyId) {
      setNavErr("Company id missing");
      return;
    }

    setNavSaving(true);
    setNavMsg("");
    setNavErr("");
    try {
      const full = normalizeNavStyle(draft?.nav_style || navStyleState || {});
      const overrides = draft?.nav_overrides || navOverridesWithDefault || {};
      const [saved, savedOverrides] = await Promise.all([
        navSettings.updateStyle(companyId, full),
        navSettings.updateOverrides(companyId, overrides),
      ]);
      const normalizedSaved = normalizeNavStyle(saved || full);
      setNavStyleState(normalizedSaved);
      setNavDraft(
        deriveNavDraft({
          nav_style: normalizedSaved,
          nav_overrides: savedOverrides || overrides,
        })
      );
      setSiteSettings((prev) =>
        mergeNavIntoSettings(prev, {
          nav_style: normalizedSaved,
          nav_overrides: savedOverrides || overrides,
        })
      );
      setNavMsg(t("manager.visualBuilder.messages.navSaved"));
      setMsg(t("manager.visualBuilder.messages.navSaved"));
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to save navigation settings.";
      setNavErr(message);
    } finally {
      setNavSaving(false);
    }
  },
  [
    companyId,
    navOverridesWithDefault,
    navStyleState,
    setSiteSettings,
    t,
  ]
);

async function ensureLegacyBuilderPages(cid, settingsObj, pagesList, { isIronEmberNextWebsite = false, provisionNextPublicBuilderPages = false, nextJsThemeKey = "" } = {}) {
  if (!cid) return { pages: pagesList || [], settings: settingsObj };

  let nextPages = Array.isArray(pagesList) ? [...pagesList] : [];
  let nextSettings = settingsObj || {};
  const reviewsStub = shouldEnsureLegacyReviewsPage(nextSettings, nextPages);

  if (reviewsStub) {
    const refreshedBeforeCreate = await wb.listPages(cid).catch(() => null);
    const refreshedPages = Array.isArray(refreshedBeforeCreate?.data)
      ? refreshedBeforeCreate.data
      : Array.isArray(refreshedBeforeCreate)
      ? refreshedBeforeCreate
      : [];
    const existingPage = refreshedPages.find(
      (page) =>
        String(page?.slug || "").trim().toLowerCase() ===
        String(reviewsStub.slug || LEGACY_REVIEWS_PAGE_SLUG).trim().toLowerCase()
    );

    if (existingPage) {
      nextPages = refreshedPages;
    } else {
      try {
        const created = await wb.createPage(
          cid,
          serializePage(ensureSectionIds(withLiftedLayout(reviewsStub)))
        );
        const createdPage = normalizePage(created?.data || created || reviewsStub);
        nextPages = [...nextPages, createdPage];
      } catch (err) {
        const duplicateSlug =
          err?.response?.status === 409 &&
          String(err?.response?.data?.error || "")
            .toLowerCase()
            .includes("duplicate slug");
        if (!duplicateSlug) throw err;

        const refetchedAfterConflict = await wb.listPages(cid).catch(() => null);
        nextPages = Array.isArray(refetchedAfterConflict?.data)
          ? refetchedAfterConflict.data
          : Array.isArray(refetchedAfterConflict)
          ? refetchedAfterConflict
          : nextPages;
      }
    }

    const nav = {
      ...readNavOverridesFromSettings(nextSettings),
      show_reviews_tab: false,
      reviews_page_slug: String(
        existingPage?.slug ||
          nextPages.find(
            (page) =>
              String(page?.slug || "").trim().toLowerCase() ===
              String(reviewsStub.slug || LEGACY_REVIEWS_PAGE_SLUG).trim().toLowerCase()
          )?.slug ||
          LEGACY_REVIEWS_PAGE_SLUG
      ),
      reviews_tab_target: "page",
    };
    await navSettings.updateOverrides(cid, nav);
    nextSettings = mergeNavIntoSettings(nextSettings, { nav_overrides: nav });
  }

  if (nextJsThemeKey) {
    const normalizedThemeKey = String(nextJsThemeKey).trim().toLowerCase();
    const homeBlueprint = getProfessionHomeBlueprint(normalizedThemeKey);
    const contactTarget = NEXT_PUBLIC_BUILDER_PAGE_TARGETS.find((target) => target.key === "contact");
    for (const existingPage of [...nextPages]) {
      const pageKind = inferPageKind(existingPage);
      if (pageKind !== "home" && pageKind !== "contact") continue;
      const normalizedContent = normalizePageContent(existingPage.content || {});
      if (Number(normalizedContent.meta?.nextJsContactFormStarterVersion || 0) >= 1) continue;
      const existingModules = safeModules(existingPage);
      const hasContactForm = existingModules.some((module) => module.type === "contactForm");

      const starter = pageKind === "home"
        ? homeBlueprint?.createModules?.(cid).find((module) => module.type === "contactForm")
        : contactTarget
          ? makeNextPublicBuilderModules(contactTarget).find((module) => module.type === "contactForm")
          : null;
      if (!hasContactForm && !starter) continue;

      const stableStarter = !hasContactForm && pageKind === "contact"
        ? { ...starter, id: `${normalizedThemeKey}-contact-page-form` }
        : starter;
      const upgradedPage = {
        ...existingPage,
        content: {
          ...normalizedContent,
          meta: {
            ...normalizedContent.meta,
            // This makes the upgrade one-time. If an owner later removes the
            // optional form, the Builder respects that choice on reload.
            nextJsContactFormStarterVersion: 1,
          },
          modules: hasContactForm ? existingModules : [...existingModules, stableStarter],
        },
      };
      const updated = await wb.updatePage(
        cid,
        existingPage.id,
        serializePage(ensureSectionIds(withLiftedLayout(upgradedPage)))
      );
      const updatedPage = normalizePage(updated?.data || updated);
      if (updatedPage?.id) {
        nextPages = nextPages.map((page) =>
          String(page.id) === String(updatedPage.id) ? updatedPage : page
        );
      }
    }

    if (normalizedThemeKey === "forge-motion") {
      for (const existingPage of [...nextPages]) {
        const forgePageKind = inferPageKind(existingPage);
        if (forgePageKind === "home") {
          const normalizedContent = normalizePageContent(existingPage.content || {});
          if (
            Number(normalizedContent.meta?.forgeMotionHomeStarterVersion || 0) <
            FORGE_MOTION_HOME_STARTER_VERSION
          ) {
            const existingModules = safeModules(existingPage);
            const upgradedModules = upgradeLegacyForgeMotionHomeModules(existingModules, cid);
            const upgradedPage = {
              ...existingPage,
              title:
                ["cut with character", "cut with character."].includes(
                  String(existingPage.title || "").trim().toLowerCase()
                )
                  ? "Build strength that holds up in real life."
                  : existingPage.title,
              seo_title:
                existingPage.seo_title || "Fitness coaching built for real life",
              seo_description:
                existingPage.seo_description ||
                "Explore strength, mobility, conditioning, coaching services, and a practical training approach built around a repeatable week.",
              og_title:
                existingPage.og_title || "Fitness coaching built for real life",
              og_description:
                existingPage.og_description ||
                "Explore coaching services, the studio approach, training guidance, and a clear path to get started.",
              og_image_url:
                existingPage.og_image_url ||
                upgradedModules.find((module) => module.type === "hero")?.content?.image ||
                "",
              canonical_path: existingPage.canonical_path || "/",
              content: {
                ...normalizedContent,
                meta: {
                  ...normalizedContent.meta,
                  forgeMotionHomeStarterVersion: FORGE_MOTION_HOME_STARTER_VERSION,
                },
                modules: upgradedModules,
              },
            };
            const updated = await wb.updatePage(
              cid,
              existingPage.id,
              serializePage(ensureSectionIds(withLiftedLayout(upgradedPage)))
            );
            const updatedPage = normalizePage(updated?.data || updated);
            if (updatedPage?.id) {
              nextPages = nextPages.map((page) =>
                String(page.id) === String(updatedPage.id) ? updatedPage : page
              );
            }
          }
          continue;
        }
        if (forgePageKind !== "contact") {
          const normalizedContent = normalizePageContent(existingPage.content || {});
          if (
            Number(normalizedContent.meta?.forgeMotionPageStarterVersion || 0) >=
            FORGE_MOTION_PAGE_STARTER_VERSION
          ) {
            continue;
          }
          const upgradedPage = upgradeForgeMotionMarketingPage(existingPage, cid);
          if (upgradedPage === existingPage) continue;
          const updated = await wb.updatePage(
            cid,
            existingPage.id,
            serializePage(ensureSectionIds(withLiftedLayout(upgradedPage)))
          );
          const updatedPage = normalizePage(updated?.data || updated);
          if (updatedPage?.id) {
            nextPages = nextPages.map((page) =>
              String(page.id) === String(updatedPage.id) ? updatedPage : page
            );
          }
          continue;
        }
        const normalizedContent = normalizePageContent(existingPage.content || {});
        if (
          Number(normalizedContent.meta?.forgeMotionContactStarterVersion || 0) >=
          FORGE_MOTION_CONTACT_STARTER_VERSION
        ) {
          continue;
        }
        const existingModules = safeModules(existingPage);
        const upgradedModules = upgradeForgeMotionContactModules(existingModules, cid);
        const contactSlug = String(existingPage.slug || existingPage.path || "")
          .trim()
          .toLowerCase();
        const isRequestPage = contactSlug === "request-quote";
        const staleContactTitle = [
          "request an event consultation",
          "event consultation",
          "contact us",
        ].includes(String(existingPage.title || "").trim().toLowerCase());
        const contactTitle = isRequestPage ? "Training inquiry" : "Contact";
        const contactDescription = isRequestPage
          ? "Send the coaching team a training inquiry or choose a current service through the existing booking flow."
          : "Contact the coaching team, find verified studio details and hours, or send a training inquiry.";
        const upgradedPage = {
          ...existingPage,
          title: staleContactTitle || !existingPage.title ? contactTitle : existingPage.title,
          menu_title:
            staleContactTitle || !existingPage.menu_title
              ? contactTitle
              : existingPage.menu_title,
          seo_title: existingPage.seo_title || contactTitle,
          seo_description: existingPage.seo_description || contactDescription,
          og_title: existingPage.og_title || contactTitle,
          og_description: existingPage.og_description || contactDescription,
          canonical_path:
            existingPage.canonical_path ||
            `/${String(existingPage.path || existingPage.slug || "contact").replace(/^\/+/, "")}`,
          content: {
            ...normalizedContent,
            meta: {
              ...normalizedContent.meta,
              forgeMotionContactStarterVersion:
                FORGE_MOTION_CONTACT_STARTER_VERSION,
            },
            modules: upgradedModules,
          },
        };
        const updated = await wb.updatePage(
          cid,
          existingPage.id,
          serializePage(ensureSectionIds(withLiftedLayout(upgradedPage)))
        );
        const updatedPage = normalizePage(updated?.data || updated);
        if (updatedPage?.id) {
          nextPages = nextPages.map((page) =>
            String(page.id) === String(updatedPage.id) ? updatedPage : page
          );
        }
      }
    }
  }

  if (provisionNextPublicBuilderPages) {
    const projectsPage = nextPages.find((page) => inferPageKind(page) === "projects");
    if (projectsPage) {
      const upgradedProjectsPage = upgradeLegacyIronEmberProjectGallery(projectsPage);
      if (upgradedProjectsPage !== projectsPage) {
        const updated = await wb.updatePage(
          cid,
          projectsPage.id,
          serializePage(ensureSectionIds(withLiftedLayout(upgradedProjectsPage)))
        );
        const updatedPage = normalizePage(updated?.data || updated);
        if (updatedPage?.id) {
          nextPages = nextPages.map((page) =>
            String(page.id) === String(updatedPage.id) ? updatedPage : page
          );
        }
      }
    }

    for (const target of NEXT_PUBLIC_BUILDER_PAGE_TARGETS) {
      const existingPage = findNextPublicBuilderPage(nextPages, target);
      if (existingPage) {
        // Earlier Builder versions created these real rows with no semantic
        // modules. Seed only truly empty records so the normal Inspector has
        // the same image/content controls as Services, without overwriting a
        // manager's existing composition.
        const existingModules = safeModules(existingPage);
        const rawModules = Array.isArray(existingPage?.content?.modules)
          ? existingPage.content.modules
          : [];
        const starters = makeNextPublicBuilderModules(target);
        let completedModules = existingModules.length ? existingModules : starters;
        if (target.key === "contact" && isIronEmberNextWebsite) {
          completedModules = completeIronEmberContactModules(existingPage, completedModules, starters);
        }
        if (target.key === "services" && !completedModules.some((module) => module.type === "services" && module.slot === "services.list")) {
          completedModules = [
            ...completedModules,
            starters.find((module) => module.type === "services"),
          ].filter(Boolean);
        }
        // Old Next tenants may contain only Classic JSON sections. Keep those
        // sections intact, but persist their established semantic projection so
        // the Builder and preview use the same module ids and field paths.
        const needsCanonicalPersistence =
          rawModules.length !== completedModules.length ||
          completedModules.some((module, index) => String(rawModules[index]?.id || "") !== String(module?.id || ""));
        const seeded = target.key === "reviews"
          ? seedBlankReviewsEditorialModule(existingPage)
          : needsCanonicalPersistence
            ? {
                ...existingPage,
                content: {
                  ...normalizePageContent(existingPage.content || {}),
                  modules: completedModules,
                },
              }
            : existingPage;
        if (seeded !== existingPage) {
          const updated = await wb.updatePage(
            cid,
            existingPage.id,
            serializePage(ensureSectionIds(withLiftedLayout(seeded)))
          );
          const updatedPage = normalizePage(updated?.data || updated);
          if (updatedPage?.id) {
            nextPages = nextPages.map((page) =>
              String(page.id) === String(updatedPage.id) ? updatedPage : page
            );
          }
        }
        continue;
      }
      try {
        const created = await wb.createPage(
          cid,
          serializePage(
            ensureSectionIds(withLiftedLayout(makeNextPublicBuilderPage(target, nextPages)))
          )
        );
        const createdPage = normalizePage(created?.data || created);
        if (createdPage?.id) nextPages = [...nextPages, createdPage];
      } catch (err) {
        const duplicateSlug =
          err?.response?.status === 409 &&
          String(err?.response?.data?.error || "").toLowerCase().includes("duplicate slug");
        if (!duplicateSlug) throw err;
        const refreshed = await wb.listPages(cid).catch(() => null);
        if (Array.isArray(refreshed?.data)) nextPages = refreshed.data;
      }
    }

    // A tenant can also have older FAQ, legal, policy, or custom marketing
    // pages that are not part of the standard starter-page catalogue. Their
    // Classic JSON sections already have an established semantic projection;
    // persist that projection once so the Builder Inspector and the Next
    // preview share stable module ids after refresh. Do not create content for
    // empty pages and do not touch system/detail routes owned elsewhere.
    const systemOwnedPageSlugs = new Set([
      "basket",
      "cart",
      "checkout",
      "login",
      "my-bookings",
      "account",
      "booking-confirmation",
    ]);
    for (const page of [...nextPages]) {
      const slug = String(page?.slug || "").trim().toLowerCase();
      const kind = inferPageKind(page);
      if (
        !page?.id ||
        systemOwnedPageSlugs.has(slug) ||
        ["service-detail", "product-detail", "job-detail"].includes(kind)
      ) {
        continue;
      }
      const rawModules = Array.isArray(page?.content?.modules) ? page.content.modules : [];
      const projectedModules = safeModules(page);
      if (!projectedModules.length || rawModules.length) continue;

      const projectedPage = {
        ...page,
        content: {
          ...normalizePageContent(page.content || {}),
          modules: projectedModules,
        },
      };
      const updated = await wb.updatePage(
        cid,
        page.id,
        serializePage(ensureSectionIds(withLiftedLayout(projectedPage)))
      );
      const updatedPage = normalizePage(updated?.data || updated);
      if (updatedPage?.id) {
        nextPages = nextPages.map((candidate) =>
          String(candidate.id) === String(updatedPage.id) ? updatedPage : candidate
        );
      }
    }
  }

  return { pages: nextPages, settings: nextSettings };
}

  const saveBrandingSettings = useCallback(
  async (payload) => {
    if (!companyId) {
      setBrandingErr("Company id missing");
      return;
    }
    const headerPayload = normalizeHeaderConfig(
      payload?.header || headerDraft || defaultHeaderConfig()
    );
    const footerPayload = normalizeFooterConfig(
      payload?.footer || footerDraft || defaultFooterConfig()
    );
    const themePayload = payload?.theme_overrides || themeOverridesDraft || defaultThemeOverrides;
    const navOverridesPayload = payload?.nav_overrides || navOverridesWithDefault || {};
    const siteThemePayload = payload?.site_theme || readSiteThemeSettings(siteSettings);
    setBrandingSaving(true);
    setBrandingMsg("");
    setBrandingErr("");
    try {
      await wb.saveSettings(
        companyId,
        {
          header: headerPayload,
          footer: footerPayload,
          theme_overrides: themePayload,
          nav_overrides: navOverridesPayload,
          site_theme: siteThemePayload,
        },
        { publish: false }
      );
      const refreshed = await wb.getSettings(companyId).catch(() => null);
      const root = refreshed?.data || refreshed || {};
      const rootWithNav = mergeNavIntoSettings(root, {
        nav_style:
          navStyleState ||
          navDraft?.nav_style ||
          siteSettings?.nav_style ||
          siteSettings?.settings?.nav_style ||
          {},
      });
      applyBrandingFromServer(rootWithNav);
      setSiteSettings(rootWithNav);
      themeOverridesPersistedKeyRef.current = JSON.stringify(
        rootWithNav?.theme_overrides ||
          rootWithNav?.settings?.theme_overrides ||
          themePayload ||
          {}
      );
      const draftSavedMsg = t(
        "manager.visualBuilder.messages.brandingDraftSaved",
        "Branding draft saved. Publish to go live."
      );
      setBrandingMsg(draftSavedMsg);
      setMsg(draftSavedMsg);
    } catch (e) {
      const message =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to save branding.";
      setBrandingErr(message);
    } finally {
      setBrandingSaving(false);
    }
  },
  [
    companyId,
    headerDraft,
    footerDraft,
    themeOverridesDraft,
    defaultThemeOverrides,
    t,
    applyBrandingFromServer,
    navDraft,
    navOverridesWithDefault,
    navStyleState,
    siteSettings,
  ]
);

  // Simple / Advanced toggle (persisted per browser with company fallback key)
  const simpleModeStorageKey = useMemo(
    () => `vsb.simpleMode.${companyId || "global"}`,
    [companyId]
  );
  const [modeState, setModeState] = useState(() => {
    if (typeof window === "undefined") return "simple";
    try {
      const stored = localStorage.getItem("vsb.simpleMode");
      if (stored === "simple" || stored === "advanced") return stored;
    } catch {
      // Ignore storage access errors.
    }
    return "simple";
  }); // "simple" | "advanced"
  const mode = modeState;

  const persistSimpleMode = useCallback(
    (nextMode) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem("vsb.simpleMode", nextMode);
        localStorage.setItem(simpleModeStorageKey, nextMode);
      } catch {
        // Ignore storage access errors.
      }
    },
    [simpleModeStorageKey]
  );

  const setMode = useCallback(
    (nextModeOrUpdater) => {
      setModeState((prev) => {
        const nextMode =
          typeof nextModeOrUpdater === "function"
            ? nextModeOrUpdater(prev)
            : nextModeOrUpdater;
        if (nextMode === "simple" || nextMode === "advanced") {
          persistSimpleMode(nextMode);
          return nextMode;
        }
        return prev;
      });
    },
    [persistSimpleMode]
  );

  // When company id resolves later, mirror current choice to scoped key.
  useEffect(() => {
    persistSimpleMode(mode);
  }, [persistSimpleMode, mode]);

  // floating inspector controller
  const fi = useFloatingInspector({ mode });

  const sectionCount = safeSections(editing).length;
  const prevModeRef = useRef(mode);

  // Phase 1 UX simplification:
  // - Simple mode: always floating quick editor + follow selection
  // - Advanced mode: docked/left inspector flow
  // Keep existing internals unchanged to avoid behavioral regressions.
  useEffect(() => {
    if (usesSemanticDockedInspector) {
      // Next.js modules have their own semantic inspector. A stored Classic
      // Simple-mode preference must not create a competing floating editor.
      if (fi.inspectorMode !== "dock") fi.setInspectorMode("dock");
      if (mode !== "advanced") setMode("advanced");
      return;
    }
    const modeChanged = prevModeRef.current !== mode;
    prevModeRef.current = mode;

    if (mode === "simple") {
      setInspectorOpen(false);
      if (modeChanged) fi.setPanelOffset({ x: 0, y: 0 });
      if (fi.inspectorMode !== "float") fi.setInspectorMode("float");
      if (!fi.followSelection) fi.setFollowSelection(true);
      // Only auto-select when entering simple mode.
      if (modeChanged && selectedBlock < 0 && sectionCount) {
        setSelectedBlock(0);
      }
      return;
    }
    if (fi.inspectorMode !== "dock") fi.setInspectorMode("dock");
  }, [
    mode,
    selectedBlock,
    sectionCount,
    fi.inspectorMode,
    fi.followSelection,
    fi.setInspectorMode,
    fi.setPanelOffset,
    fi.setFollowSelection,
    usesSemanticDockedInspector,
    setMode,
  ]);

  useEffect(() => {
    if (mode !== "simple" && selectedBlock >= 0) {
      setInspectorOpen(true);
    }
  }, [selectedBlock, mode]);

  // THEME drawer
  const [themeOpen, setThemeOpen] = useState(false);

  // Canvas preview mode
  const [fullPreview, setFullPreview] = useState(false);
  // Canvas height control
const [canvasHeightMode, setCanvasHeightMode] = useState("medium"); // "short" | "medium" | "tall" | "auto"
const canvasMaxHeight = useMemo(() => {
  switch (canvasHeightMode) {
    case "short":
      return "40vh";
    case "tall":
      return "80vh";
    case "auto":
      return "none"; // unlimited (no scroll clipping)
    case "medium":
    default:
      return "60vh";
  }
}, [canvasHeightMode]);


  // {t("manager.visualBuilder.pageStyle.applyAll.button")} (UI toggle + helper)
const [applyPageStyleToAll, setApplyPageStyleToAll] = useState(false);

/** Apply current page's PageStyle to every other page */
async function applyStyleToAllPagesNow(overrideStyle = null) {
  if (!companyId) return;

  const isEventLike =
    overrideStyle &&
    typeof overrideStyle === "object" &&
    (typeof overrideStyle.preventDefault === "function" ||
      typeof overrideStyle.stopPropagation === "function" ||
      overrideStyle.nativeEvent);
  const safeOverrideStyle = isEventLike ? null : overrideStyle;

  const srcProps =
    safeOverrideStyle ||
    editing?.content?.meta?.pageStyle ||
    readPageStyleProps(editing) ||
    null;

  if (!srcProps) {
    setErr(t("manager.visualBuilder.pageStyle.applyAll.none"));
    return;
  }

  setBusy(true);
  setErr("");
  setMsg("");
  try {
    const list = await wb.listPages(companyId);
    const pagesList = Array.isArray(list?.data) ? list.data : list || [];

    for (const p of pagesList) {
      if (!p?.id || p.id === editing?.id) continue;

      const full = await wb.getPage(companyId, p.id);
      const current = full?.data || full || p;

      const updated = writePageStyleProps(current, srcProps);
      await wb.updatePage(
        companyId,
        updated.id,
        serializePage ? serializePage(updated) : updated
      );
    }

    setMsg(`${t("manager.visualBuilder.pageStyle.applyAll.success")} ✔`);
  } catch (e) {
    setErr(
      e?.response?.data?.error ||
        e.message ||
        t("manager.visualBuilder.pageStyle.applyAll.failed")
    );
  } finally {
    setBusy(false);
  }
}




  // NEW — Help drawer state and jump helpers  (keep this below your new block)
  const [helpOpen, setHelpOpen] = useState(false);
  const jumpToById = (id) => {
    if (id === "builder-page-settings") {
      setPageSettingsOpen(true);
    }
    const el = document.getElementById(id);
    if (!el) return;

    const summary = el.querySelector('[role="button"][aria-expanded]');
    if (summary && summary.getAttribute("aria-expanded") === "false") {
      summary.click();
    }

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => setHelpOpen(false), 250);
  };
  const handleJumpToPageStyle = () => jumpToById("page-style-card");
  const handleJumpToNav = () => jumpToById("nav-settings-card");
  const handleJumpToAssets = () => jumpToById("assets-manager-card");
  const handleJumpToPageSettings = () => {
    setPagesListOpen(false);
    setPageSettingsOpen(true);
    requestAnimationFrame(() => jumpToById("builder-page-settings"));
  };
  const handleJumpToSeoSettings = () => {
    setPagesListOpen(false);
    setSeoSettingsOpen(true);
    requestAnimationFrame(() => jumpToById("builder-page-seo"));
  };
  const handleJumpToCompanyProfile = () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams({ view: "CompanyProfile" });
    if (companyId) params.set("company_id", String(companyId));
    window.location.assign(`/manager/dashboard?${params.toString()}`);
  };

  const siteSeoDefaults = useMemo(() => {
    if (siteSettings?.seo) return siteSettings.seo;
    if (siteSettings?.settings?.seo) return siteSettings.settings.seo;
    return {};
  }, [siteSettings]);

  const canonicalBase = useMemo(
    () => siteSeoDefaults.canonicalUrl || siteSeoDefaults.slugBaseUrl || "",
    [siteSeoDefaults]
  );
  const slugBase = useMemo(
    () => siteSeoDefaults.slugBaseUrl || canonicalBase,
    [siteSeoDefaults, canonicalBase]
  );
  const authoritativeCompanySlug = useMemo(() => {
    const slugFromStatus =
      websiteStatus?.company_slug ||
      websiteStatus?.status?.company_slug;
    const slugFromProfile = companyProfileSlug;
    const slugFromSettings =
      siteSettings?.company_slug ||
      siteSettings?.company?.slug ||
      siteSettings?.slug ||
      siteSettings?.settings?.slug;
    return (
      String(slugFromStatus || "").trim() ||
      String(slugFromProfile || "").trim() ||
      String(slugFromSettings || "").trim()
    );
  }, [companyProfileSlug, siteSettings, websiteStatus]);

  const previewSlug = useMemo(() => {
    const slugFromSettings = authoritativeCompanySlug;
    if (slugFromSettings) return slugFromSettings;
    if (companyId) return `preview-${companyId}`;
    return "preview";
  }, [authoritativeCompanySlug, companyId]);

  const liveSlug = useMemo(() => {
    return String(authoritativeCompanySlug || "").trim();
  }, [authoritativeCompanySlug]);

  const publishedLiveSiteUrl = useMemo(() => {
    const publishedSelection = getPublishedRendererSelection(websiteStatus || {});
    const pagePath = publishedSelection.rendererEngine === "nextjs"
      ? normalizeNextJsPreviewPagePath(editing)
      : normalizePreviewPagePath(editing);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return buildPublishedWebsiteUrl({
      status: websiteStatus || {
        company_slug: liveSlug || previewSlug,
        is_live: Boolean(siteSettings?.is_live),
        custom_domain:
          siteSettings?.custom_domain ||
          siteSettings?.settings?.custom_domain ||
          "",
        published_renderer_engine: "legacy-react",
      },
      pagePath: Array.isArray(pagePath) ? pagePath.join("/") : "",
      currentOrigin: origin,
    });
  }, [editing, liveSlug, previewSlug, siteSettings, websiteStatus]);
  const liveSiteUrl = publishedLiveSiteUrl;

  const seoPreviewTitle = useMemo(() => {
    return (
      editing?.seo_title ||
      editing?.title ||
      siteSeoDefaults.metaTitle ||
      (editing?.slug ? editing.slug.replace(/-/g, " ") : previewSlug)
    );
  }, [editing, siteSeoDefaults, previewSlug]);
  const seoPreviewDescription = useMemo(() => {
    return (
      editing?.seo_description ||
      siteSeoDefaults.metaDescription ||
      t("manager.visualBuilder.pages.seo.descriptionFallback")
    );
  }, [editing, siteSeoDefaults, t]);
  const socialPreviewTitle = useMemo(() => {
    return editing?.og_title || seoPreviewTitle;
  }, [editing, seoPreviewTitle]);
  const socialPreviewDescription = useMemo(() => {
    return (
      editing?.og_description ||
      editing?.seo_description ||
      siteSeoDefaults.ogDescription ||
      siteSeoDefaults.metaDescription ||
      seoPreviewDescription
    );
  }, [editing, siteSeoDefaults, seoPreviewDescription]);
  const socialPreviewImage = useMemo(() => {
    return editing?.og_image_url || siteSeoDefaults.ogImage || "";
  }, [editing, siteSeoDefaults]);

  const pageCanonicalPreview = useMemo(
    () => buildCanonicalUrl(editing, canonicalBase, slugBase),
    [editing, canonicalBase, slugBase]
  );

  const previewPagesMeta = useMemo(() => {
    if (!Array.isArray(pages) || !pages.length) {
      return [];
    }
    return pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      menu_title: p.menu_title || p.title || p.slug,
      title: p.title || p.slug,
      show_in_menu: p.show_in_menu !== false,
      sort_order: p.sort_order ?? 0,
      is_homepage: Boolean(p.is_homepage),
    }));
  }, [pages]);

  const previewSite = useMemo(() => {
    const navStyle = normalizeNavStyle(
      navStyleState ||
        navDraft?.nav_style ||
        siteSettings?.nav_style ||
        siteSettings?.settings?.nav_style ||
        {}
    );
    const themeOverrides =
      siteSettings?.theme_overrides ||
      siteSettings?.settings?.theme_overrides ||
      {};
    const companyName =
      siteSettings?.site_title ||
      siteSettings?.company?.name ||
      headerDraft?.text ||
      "Preview Company";
    const fallbackPage = {
      slug: editing?.slug || "preview",
      menu_title: editing?.menu_title || editing?.title || "Preview",
      title: editing?.title || "Preview",
      show_in_menu: true,
      sort_order: 0,
      is_homepage: true,
    };
    return {
      slug: previewSlug,
      design_family: effectivePreviewFamily || "classic",
      design_schema_version:
        siteSettings?.design_schema_version ||
        siteSettings?.settings?.design_schema_version ||
        1,
      design_family_version:
        websiteStyleChoices.find((style) => style.key === effectivePreviewFamily)
          ?.version ||
        siteSettings?.design_family_version ||
        siteSettings?.settings?.design_family_version ||
        1,
      composition:
        siteSettings?.composition ||
        siteSettings?.settings?.composition ||
        "default",
      motion_profile:
        websiteStyleChoices.find((style) => style.key === effectivePreviewFamily)
          ?.motion ||
        siteSettings?.motion_profile ||
        siteSettings?.settings?.motion_profile ||
        "legacy",
      design_family_feature_enabled:
        siteSettings?.design_family_feature_enabled !== false,
      nav_overrides: navDraft?.nav_overrides || navOverridesWithDefault,
      nav_style: navStyle,
      theme_overrides: themeOverrides,
      header: headerDraft,
      footer: footerDraft,
      pages: previewPagesMeta.length ? previewPagesMeta : [fallbackPage],
      company: {
        id:
          siteSettings?.company?.id ||
          siteSettings?.company_id ||
          companyId ||
          0,
        name: companyName,
        slug: previewSlug,
        logo_url:
          headerDraft?.logo_asset?.url ||
          siteSettings?.company?.logo_url ||
          null,
        contact_email: siteSettings?.company?.contact_email || null,
      },
    };
  }, [
    siteSettings,
    companyId,
    headerDraft,
    footerDraft,
    previewPagesMeta,
    previewSlug,
    effectivePreviewFamily,
    editing,
    navDraft,
    navOverridesWithDefault,
    navStyleState,
    websiteStyleChoices,
  ]);

  const applyWebsiteStyle = useCallback(
    async (style) => {
      if (!companyId || !style) return;
      setStyleSaving(true);
      setStyleMsg("");
      setStyleErr("");
      try {
        const payload = buildWebsiteStyleApplyPayload(style);
        const operationId = `theme-switch-${nanoid()}`;
        const settingsResponse = await wb.saveSettings(
          companyId,
          payload,
          { publish: false, draftOnly: true, operationId }
        );
        let automaticCheckpoint = settingsResponse?.data?.automatic_checkpoint || null;
        const [refreshed, statusRes] = await Promise.all([
          wb.getSettings(companyId).catch(() => null),
          wb.getStatus(companyId).catch(() => null),
        ]);
        const next = refreshed?.data || refreshed || null;
        if (next) setSiteSettings(next);
        const nextStatus = statusRes?.data || statusRes || null;
        if (nextStatus) setWebsiteStatus(nextStatus);
        // A theme is a real template only for a new/empty site when it also
        // initializes its canonical WebsitePage starter content. Existing
        // sites deliberately skip this path so switching themes never
        // overwrites tenant content.
        if (
          isNextJsStyle(style) &&
          !pages.length &&
          style.starterContentPackKey
        ) {
          const installResponse = await wb.installContentPack(companyId, style.starterContentPackKey, {
            install_mode: "merge",
            visual_theme_key: style.key,
            operation_id: operationId,
          });
          automaticCheckpoint = automaticCheckpoint || installResponse?.data?.automatic_checkpoint || null;
          const [installedPagesRes, installedSettingsRes, installedStatusRes] = await Promise.all([
            wb.listPages(companyId),
            wb.getSettings(companyId).catch(() => null),
            wb.getStatus(companyId).catch(() => null),
          ]);
          const installedPages = (installedPagesRes?.data || [])
            .map(normalizePage)
            .map((page) => ensureSectionIds(withLiftedLayout(page)));
          setPages(installedPages);
          const installedSettings = installedSettingsRes?.data || installedSettingsRes || null;
          if (installedSettings) setSiteSettings(installedSettings);
          const installedStatus = installedStatusRes?.data || installedStatusRes || null;
          if (installedStatus) setWebsiteStatus(installedStatus);
          const home = installedPages.find((page) => page.is_homepage) || installedPages[0];
          if (home) {
            setSelectedId(home.id);
            setEditing(home);
          }
        }
        setStylePreviewFamily(style.key || "classic");
        await loadCheckpoints(companyId);
        setStyleMsg(
          `${style.name} applied to draft. ${
            isNextJsStyle(style) ? "The Modern editor is ready." : "The Classic editor is ready."
          } Publish to make it live.${
            automaticCheckpoint?.name ? ` Safety version saved: ${automaticCheckpoint.name}.` : ""
          }`
        );
        setBuilderTabIndex(0);
        return true;
      } catch (e) {
        setStyleErr(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "Failed to apply website style."
        );
        return false;
      } finally {
        setStyleSaving(false);
      }
    },
    [companyId, loadCheckpoints, pages.length, setEditing]
  );

  const requestWebsiteStyleApply = useCallback(
    (style) => {
      if (!style) return;
      if (requiresRendererSwitchConfirmation(builderRendererMode, style)) {
        setPendingRendererStyle(style);
        return;
      }
      applyWebsiteStyle(style);
    },
    [applyWebsiteStyle, builderRendererMode]
  );

  const confirmRendererSwitch = useCallback(async () => {
    if (!pendingRendererStyle) return;
    const applied = await applyWebsiteStyle(pendingRendererStyle);
    if (applied) setPendingRendererStyle(null);
  }, [applyWebsiteStyle, pendingRendererStyle]);

  // A module edit replaces the page object, but it does not change the route.
  // Use a primitive route key so ordinary typing cannot remint the signed
  // preview session and reload the entire iframe.
  const currentPreviewPagePathKey = (
    isNextJsContentMode
      ? normalizeNextJsPreviewPagePath(editing)
      : normalizePreviewPagePath(editing)
  ).join("/");
  const currentPreviewPagePath = useMemo(
    () => (currentPreviewPagePathKey ? currentPreviewPagePathKey.split("/") : []),
    [currentPreviewPagePathKey]
  );

  const refreshNextJsPreview = useCallback(
    async (style = null, pagePathOverride = null, commitToCanvas = true) => {
      const catalogStyle =
        style ||
        websiteStyleChoices.find((item) => item.key === effectivePreviewFamily) ||
        null;
      // The selected Next theme already lives in the persisted website
      // settings. The catalog is presentation metadata for the style picker;
      // it must not be a prerequisite for creating a content-canvas preview.
      // In particular, a slow/stalled catalog/status call used to leave this
      // iframe empty even though the saved `visual_theme_key` was valid.
      const nextStyle =
        catalogStyle ||
        (isNextJsContentMode && currentStyleKey
          ? { key: currentStyleKey, renderer_engine: "nextjs" }
          : null);
      if (!companyId || !nextStyle || !isNextJsStyle(nextStyle)) {
        if (commitToCanvas) {
          setNextJsPreviewToken("");
          setNextJsPreviewUrl("");
        }
        return "";
      }
      if (!hasConfiguredNextJsThemeBaseUrl()) {
        setStyleErr(NEXTJS_THEME_PREVIEW_CONFIG_ERROR);
        if (commitToCanvas) {
          setNextJsPreviewToken("");
          setNextJsPreviewUrl("");
        }
        return "";
      }
      try {
        // Do not leave an old iframe visible while a new signed session is
        // being requested.  A backend restart invalidates its signature, and
        // retaining that URL is what previously left the Builder as a blank
        // white canvas.
        setStyleErr("");
        const requestedPagePath = Array.isArray(pagePathOverride)
          ? pagePathOverride
          : currentPreviewPagePath;
        const res = await wb.createPreviewSession(companyId, {
          visual_theme_key: nextStyle.key,
          page_path: requestedPagePath,
        });
        const payload = res?.data || res || {};
        const token = payload?.token || "";
        if (!token) {
          throw new Error("Preview session did not return a token.");
        }
        const previewUrl = buildNextJsPreviewUrl({
          token,
          pagePath: requestedPagePath,
        });
        if (commitToCanvas) {
          setNextJsPreviewToken(token);
          setNextJsPreviewUrl(previewUrl);
          setNextJsPreviewStale(false);
        }
        setStyleErr("");
        return previewUrl;
      } catch (e) {
        // A failed refresh must never retain an expired signed iframe URL.
        // Clearing it gives the manager a visible error and a working Refresh
        // Preview action instead of an opaque white document.
        if (commitToCanvas) {
          setNextJsPreviewToken("");
          setNextJsPreviewUrl("");
        }
        setStyleErr(
          e?.response?.data?.error ||
            e?.response?.data?.message ||
            e?.message ||
            "Failed to create Next.js preview session."
        );
        return "";
      }
    },
    [
      companyId,
      currentPreviewPagePath,
      currentStyleKey,
      effectivePreviewFamily,
      isNextJsContentMode,
      websiteStyleChoices,
    ]
  );

  const queueNextJsDraftSync = useCallback(
    (snapshot) => {
      if (!isNextJsContentMode || !companyId || !snapshot?.id) return;
      // Persist edits without replacing the iframe underneath the editor.
      // The explicit Refresh preview action applies the saved snapshot when
      // the manager is ready to review it.
      setNextJsPreviewStale(true);
      nextJsDraftSyncSnapshotRef.current = ensureSectionIds(withLiftedLayout(snapshot));
      if (nextJsDraftSyncTimerRef.current) {
        clearTimeout(nextJsDraftSyncTimerRef.current);
      }
      nextJsDraftSyncTimerRef.current = setTimeout(async () => {
        const pending = nextJsDraftSyncSnapshotRef.current;
        nextJsDraftSyncTimerRef.current = null;
        if (!pending?.id) return;
        try {
          const payload = serializePage(pending);
          const response = await wb.updatePage(companyId, payload.id, payload);
          const saved = ensureSectionIds(
            withLiftedLayout(normalizePage(response?.data || payload))
          );
          setPages((prev) => prev.map((page) => (page.id === saved.id ? saved : page)));
          setEditing((current) => {
            if (!current?.id || String(current.id) !== String(saved.id)) return current;
            return saved;
          });
        } catch (error) {
          console.error("[VisualSiteBuilder] nextjs draft sync failed", error);
        }
      }, 250);
    },
    [companyId, isNextJsContentMode, setEditing, setPages]
  );

  // The iframe reports an expired/invalid signed preview token after a local
  // backend restart. Mint a replacement automatically; this is intentionally
  // limited to the configured tenant-renderer origin and current iframe.
  useEffect(() => {
    const recoverPreviewToken = (event) => {
      let activePreviewOrigin = nextJsPreviewOrigin;
      try {
        activePreviewOrigin = new URL(nextJsContentPreviewIframeRef.current?.src || nextJsPreviewOrigin).origin;
      } catch (_err) {
        // Keep the configured origin as the safe fallback.
      }
      if (!isAcceptedPreviewMessage({
        eventOrigin: event.origin,
        expectedOrigin: activePreviewOrigin,
        eventSource: event.source,
        expectedSource: nextJsContentPreviewIframeRef.current?.contentWindow,
      })) return;
      if (event?.data?.type === "schedulaa:preview-token-invalid") {
        refreshNextJsPreview();
      }
    };
    window.addEventListener("message", recoverPreviewToken);
    return () => window.removeEventListener("message", recoverPreviewToken);
  }, [nextJsPreviewOrigin, refreshNextJsPreview]);

  useEffect(() => {
    if (!isNextJsContentMode) return;
    refreshNextJsPreview();
  }, [isNextJsContentMode, refreshNextJsPreview]);

  const saveNavSettingsWithPreviewRefresh = useCallback(
    async (draft) => {
      await saveNavSettings(draft);
      if (isNextJsContentMode) {
        await refreshNextJsPreview();
      }
    },
    [isNextJsContentMode, refreshNextJsPreview, saveNavSettings]
  );

  // Client account and commerce entry points are system-owned routes rather
  // than WebsitePage records. Keep their controls beside the Pages list so a
  // manager can decide whether they are visible in the public menu without
  // creating misleading, editable CMS pages for login, bookings, or basket.
  const updateClientSystemLink = useCallback(
    (field, value) => {
      const nextOverrides = {
        ...(navDraft?.nav_overrides || navOverridesWithDefault || {}),
        [field]: value,
      };
      handleNavDraftChange({
        nav_style: navDraft?.nav_style || navStyleState || {},
        nav_overrides: nextOverrides,
      });
    },
    [handleNavDraftChange, navDraft, navOverridesWithDefault, navStyleState]
  );

  const saveBrandingSettingsWithPreviewRefresh = useCallback(
    async (payload) => {
      await saveBrandingSettings(payload);
      if (isNextJsContentMode) {
        await refreshNextJsPreview();
      }
    },
    [isNextJsContentMode, refreshNextJsPreview, saveBrandingSettings]
  );

  const saveNextJsThemeOverrides = useCallback(async () => {
    if (!isNextJsContentMode || !currentStyleKey) return;
    const nextDraft = sanitizeThemeOverrideDraft(
      currentStyleKey,
      themeOverridesDraft || {}
    );
    await saveBrandingSettings({ theme_overrides: nextDraft });
    themeOverridesPersistedKeyRef.current = JSON.stringify(nextDraft);
    await refreshNextJsPreview();
  }, [
    currentStyleKey,
    isNextJsContentMode,
    refreshNextJsPreview,
    saveBrandingSettings,
    themeOverridesDraft,
  ]);

  useEffect(() => {
    if (!isNextJsContentMode || !companyId || !currentStyleKey) return undefined;
    const nextDraft = sanitizeThemeOverrideDraft(
      currentStyleKey,
      themeOverridesDraft || {}
    );
    const serialized = JSON.stringify(nextDraft);
    if (serialized === themeOverridesPersistedKeyRef.current) {
      return undefined;
    }
    if (nextJsThemeOverrideSaveTimerRef.current) {
      clearTimeout(nextJsThemeOverrideSaveTimerRef.current);
    }
    nextJsThemeOverrideSaveTimerRef.current = setTimeout(() => {
      saveNextJsThemeOverrides().catch((error) => {
        console.error("Failed to autosave Next.js page style overrides", error);
      });
    }, 700);
    return () => {
      if (nextJsThemeOverrideSaveTimerRef.current) {
        clearTimeout(nextJsThemeOverrideSaveTimerRef.current);
      }
    };
  }, [
    companyId,
    currentStyleKey,
    isNextJsContentMode,
    saveNextJsThemeOverrides,
    themeOverridesDraft,
  ]);

  useEffect(
    () => () => {
      if (nextJsThemeOverrideSaveTimerRef.current) {
        clearTimeout(nextJsThemeOverrideSaveTimerRef.current);
      }
      if (nextJsDraftSyncTimerRef.current) {
        clearTimeout(nextJsDraftSyncTimerRef.current);
      }
    },
    []
  );


// choose a template and import it for this company (MUST send X-Company-Id)



// Helper: pick a valid template key from the backend list
// Helper: pick a valid template key from the backend list
const pickTemplateKey = async () => {
  const res = await wb.listTemplates();                 // -> { data: [...] }
  const items = Array.isArray(res?.data) ? res.data : [];
  if (!items.length) throw new Error("No templates available on server");

  // Prefer default if flagged, else the first item
  const def = items.find(t => t.is_default) || items[0];

  // Keys are the filename stem; backend expects this exact value
  const key = def.key || def.id || def.title;
  if (!key) throw new Error("Template list did not include a usable key");
  return key;
};

// Import one template for this company (ALWAYS with a key)
const autoProvisionIfEmpty = useCallback(
  async (cid, settingsObj) => {
    // 1) Try hinted key from settings, if any
    const hintedKey =
      settingsObj?.website?.template_key ||
      settingsObj?.template_key ||
      null;

    let keyToUse = hintedKey;

    // 2) Validate hinted key exists; otherwise fall back to a real one
    try {
      const res = await wb.listTemplates();
      const items = Array.isArray(res?.data) ? res.data : [];

      const exists = keyToUse && items.some(
        t => (t.key || t.id || t.title) === keyToUse
      );

      keyToUse = exists ? keyToUse : await pickTemplateKey();
    } catch (e) {
      // If listing fails, don’t send an empty body—pickTemplateKey throws
      // and we surface a meaningful error to the UI instead.
      throw e;
    }

    // 3) Import with a required key
    await wb.importTemplate(cid, { key: keyToUse });
    return true;
  },
  []
);


  
  const loadAll = async (cid, preferredPage = null) => {
  setErr("");
  setMsg("");
  setBusy(true);
  try {
    // 1) settings (we might use template_key hint)
    let settingsObj = null;
    try {
      const s = await wb.getSettings(cid);
      settingsObj = s?.data || s || null;
    } catch (e) {
      console.warn("Settings load failed", e?.response?.data || e);
    }

    try {
      const styleRes = await navSettings.getStyle(cid);
      if (styleRes) {
        const normalizedStyle = normalizeNavStyle(styleRes);
        setNavStyleState(normalizedStyle);
        settingsObj = mergeNavIntoSettings(settingsObj, { nav_style: styleRes });
      }
    } catch (e) {
      console.warn("Nav style load failed", e?.response?.data || e);
    }

    if (!navStyleState && (settingsObj?.nav_style || settingsObj?.settings?.nav_style)) {
      setNavStyleState(
        normalizeNavStyle(settingsObj.nav_style || settingsObj.settings?.nav_style || {})
      );
    }

    applyBrandingFromServer(settingsObj);
    setSiteSettings(settingsObj);

    // 2) pages
    let res = await wb.listPages(cid);
    let pgRaw = (res.data || []).map(normalizePage);

    // 3) if empty → import real template first, then reload pages
    const selectedWebsiteSettings =
      settingsObj?.settings_draft ||
      settingsObj?.draft ||
      settingsObj?.settings ||
      settingsObj || {};
    const statusForEmptySite = await wb.getStatus(cid).catch(() => null);
    const statusPayload = statusForEmptySite?.data || statusForEmptySite || null;
    const nextJsWebsite = isNextJsBuilderMode(
      resolveBuilderRendererMode({
        renderer_engine:
          statusPayload?.draft_renderer_engine ||
          statusPayload?.current_renderer_engine ||
          selectedWebsiteSettings.renderer_engine,
        settings: selectedWebsiteSettings,
      })
    );
    const nextJsThemeKey = nextJsWebsite
      ? String(
        selectedWebsiteSettings.visual_theme_key ||
          statusPayload?.draft_visual_theme_key ||
          statusPayload?.current_visual_theme_key ||
          ""
      )
        .trim()
        .toLowerCase()
      : "";
    const isIronEmberNextWebsite = nextJsThemeKey === "iron-ember";
    const provisionNextPublicBuilderPages = shouldProvisionNextPublicBuilderPages(nextJsThemeKey);
    if (!pgRaw.length && !nextJsWebsite) {
      try {
        await autoProvisionIfEmpty(cid, settingsObj);
        res = await wb.listPages(cid);
        pgRaw = (res.data || []).map(normalizePage);
        setMsg(`${t("manager.visualBuilder.load.starterCreated")} ✔`);
      } catch (e) {
        console.error("Auto-provision failed", e?.response?.data || e);
        setErr(t("manager.visualBuilder.load.autoprovisionFailed"));
      }
    }

    const normalizedLegacy = await ensureLegacyBuilderPages(cid, settingsObj, pgRaw, {
      isIronEmberNextWebsite,
      provisionNextPublicBuilderPages,
      nextJsThemeKey,
    });
    const pg = (normalizedLegacy.pages || pgRaw).map((p) =>
      ensureSectionIds(withLiftedLayout(p))
    );
    if (normalizedLegacy.settings) {
      setSiteSettings(normalizedLegacy.settings);
      setNavDraft(deriveNavDraft(normalizedLegacy.settings));
    }
    setPages(pg);
    await loadCheckpoints(cid);

    if (pg.length) {
      const preferred =
        pg.find((p) => preferredPage?.id && String(p.id) === String(preferredPage.id)) ||
        pg.find((p) =>
          preferredPage?.slug &&
          String(p.slug || "") === String(preferredPage.slug) &&
          String(p.locale || "en") === String(preferredPage.locale || "en")
        );
      const home = preferred ||
        pg.find((p) => p.is_homepage) ||
        pg.find((p) => (p.slug || "").toLowerCase() === "home") ||
        pg.find((p) => Number(p.sort_order) === 0) ||
        pg[0];

      const first = ensureSectionIds(withLiftedLayout(home));
      setSelectedId(first.id);
      setEditing(first);
    } else {
      setSelectedId(null);
      setEditing(ensureSectionIds(withLiftedLayout(emptyPage())));
    }

    setSelectedBlock(-1);
  } catch (e) {
    // `loadAll` is also used by manual refresh and post-import flows.  Keep a
    // failed request inside the Builder state instead of letting an Axios
    // rejection escape React and turn an expired/unauthorised session into a
    // runtime overlay.
    const code = e?.response?.status;
    if (code === 401 || code === 403) {
      setAuthError({ code, slug, cid });
      setPages([]);
    }
    setErr(
      e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Unable to refresh the website builder."
    );
    console.warn("[VisualSiteBuilder] refresh failed", e?.response?.data || e);
  } finally {
    setBusy(false);
  }
};

  /* ----- save & publish (HOISTED) ----- */
  const onSavePage = useCallback(async () => {
    if (!companyId) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const payload = serializePage(ensureSectionIds(editing));
      if (payload.id) {
        const r = await wb.updatePage(companyId, payload.id, payload);
        const saved = ensureSectionIds(
          withLiftedLayout(normalizePage(r.data || payload))
        );
        setPages((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        setEditing(saved);
        setMsg(t("manager.visualBuilder.messages.saved"));
        if (applyPageStyleToAll) {
          await applyStyleToAllPagesNow();
        }
        if (isNextJsContentMode && nextJsPreviewUrl) {
          await refreshNextJsPreview(null, normalizeNextJsPreviewPagePath(saved));
        }
      } else {
        const r = await wb.createPage(companyId, payload);
        const created = ensureSectionIds(
          withLiftedLayout(normalizePage(r.data))
        );
        setPages((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setEditing(created);
        setMsg(t("manager.visualBuilder.messages.created"));
        if (isNextJsContentMode && nextJsPreviewUrl) {
          await refreshNextJsPreview(null, normalizeNextJsPreviewPagePath(created));
        }
      }
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePage"));
    } finally {
      setBusy(false);
    }
  }, [
    applyPageStyleToAll,
    applyStyleToAllPagesNow,
    companyId,
    editing,
    setEditing,
    setPages,
    setSelectedId,
    t,
    isNextJsContentMode,
    nextJsPreviewUrl,
    refreshNextJsPreview,
  ]);

  const importLabSettingsFromServer = useCallback(async () => {
    if (!companyId) {
      setErr(t("manager.visualBuilder.errors.signIn"));
      return;
    }
    setErr("");
    setMsg("");
    try {
      const s = await wb.getSettings(companyId);
      const root = s?.data || s || {};
      const preset =
        root.layout_lab_preset ||
        root.settings?.layout_lab_preset ||
        root.website?.layout_lab_preset ||
        null;

      if (!preset) {
        setErr(t("manager.visualBuilder.errors.noPreset"));
        return;
      }

      const layout = preset.layout ?? editing.layout ?? "boxed";
      const sectionSpacing = preset.sectionSpacing ?? 6;
      const defaultGutterX = (() => {
        if (typeof preset.gutterX === "number") return preset.gutterX;
        if (preset.density === "compact") return 12;
        if (preset.density === "comfortable") return 24;
        return 16;
      })();

      setEditing((cur) => {
        const content = cur.content || {};
        const meta = content.meta || {};
        return withLiftedLayout({
          ...cur,
          layout,
          content: {
            ...content,
            meta: { ...meta, layout, sectionSpacing, defaultGutterX },
          },
        });
      });

      setEditing((cur) => {
        const sections = (cur?.content?.sections || []).map((sct) => {
          const props = { ...(sct.props || {}) };
          if (typeof preset.gutterX === "number") props.gutterX = preset.gutterX;
          if (typeof preset.bleedLeft === "boolean")
            props.bleedLeft = preset.bleedLeft;
          if (typeof preset.bleedRight === "boolean")
            props.bleedRight = preset.bleedRight;

          if (sct.type === "hero") {
            if (typeof preset.heroHeight === "number")
              props.heroHeight = preset.heroHeight;
            if (typeof preset.safeTop === "boolean") props.safeTop = preset.safeTop;
            if (preset.contentMaxWidth !== undefined)
              props.contentMaxWidth = preset.contentMaxWidth;
          }
          return { ...sct, props };
        });
        return withLiftedLayout({
          ...cur,
          content: { ...(cur?.content || {}), sections },
        });
      });

      setMsg(t("manager.visualBuilder.messages.importedPreset"));
    } catch (e) {
      const detail = e?.response?.data?.message || e?.message || "";
      setErr(
        detail
          ? t("manager.visualBuilder.errors.importPresetDetail", { detail })
          : t("manager.visualBuilder.errors.importPreset")
      );
    }
  }, [companyId, editing, setEditing, t]);

  useEffect(() => {
    try {
      const currentSearch =
        location?.search ?? window.location.search ?? "";
      const qs = new URLSearchParams(currentSearch);
      if (qs.get("importLabPresetOnce") === "1") {
        (async () => {
          try {
            await importLabSettingsFromServer();
          } finally {
            qs.delete("importLabPresetOnce");
            const nextSearch = qs.toString();
            const nextPath =
              location?.pathname ?? window.location.pathname ?? "";
            const nextUrl = `${nextPath}${nextSearch ? `?${nextSearch}` : ""}`;
            window.history.replaceState({}, "", nextUrl);
          }
        })();
      }
    } catch (e) {
      console.warn("Auto-import from Lab failed:", e?.message || e);
    }
  }, [importLabSettingsFromServer, location?.pathname, location?.search]);

  // --- Publish (no auto-apply of Lab; save current page then publish) ---
  const onPublish = useCallback(async () => {
    if (!companyId) return;
    setBusy(true);
    setErr("");
    setMsg("");

    try {
      const snapshot = withLiftedLayout(
        ensureSectionIds({ ...editing })
      );
      const payload = serializePage(snapshot);

      if (payload.id) {
        await wb.updatePage(companyId, payload.id, payload);
        setEditing(snapshot);
        setPages((prev) => prev.map((p) => (p.id === payload.id ? snapshot : p)));
      } else {
        try {
          const r = await wb.createPage(companyId, payload);
          const created = ensureSectionIds(withLiftedLayout(normalizePage(r.data)));
          setPages((prev) => [created, ...prev]);
          setSelectedId(created.id);
          setEditing(created);
        } catch (createError) {
          const duplicateSlug =
            createError?.response?.status === 409 &&
            String(createError?.response?.data?.error || "").toLowerCase().includes("duplicate slug");
          if (!duplicateSlug) throw createError;

          // A backend restart or a second Builder tab can leave an unsaved
          // local page without its id even though the same slug was already
          // created. Reconcile it and continue publishing rather than forcing
          // the manager to discard their current edit.
          const listed = await wb.listPages(companyId);
          const candidates = Array.isArray(listed?.data) ? listed.data : [];
          const existing = candidates.find(
            (page) => String(page?.slug || "").trim().toLowerCase() ===
              String(payload.slug || "").trim().toLowerCase()
          );
          if (!existing?.id) throw createError;
          const recoveredPayload = { ...payload, id: existing.id };
          const updated = await wb.updatePage(companyId, existing.id, recoveredPayload);
          const recovered = ensureSectionIds(withLiftedLayout(normalizePage(updated?.data || recoveredPayload)));
          setPages((prev) => {
            const withoutRecovered = prev.filter((page) => String(page.id) !== String(recovered.id));
            return [...withoutRecovered, recovered];
          });
          setSelectedId(recovered.id);
          setEditing(recovered);
          setMsg("Recovered the existing page and continued publishing.");
        }
      }

      const latestSettings = await wb.getSettings(companyId).catch(() => null);
      const latestPayload = latestSettings?.data || latestSettings || {};
      const draftSettings = latestPayload?.settings || {};
      const publishPayload = {
        ...draftSettings,
        header: draftSettings.header || headerDraft,
        footer: draftSettings.footer || footerDraft,
        theme_overrides: draftSettings.theme_overrides || themeOverridesDraft,
        nav_overrides: draftSettings.nav_overrides || navOverridesWithDefault,
      };
      const brandingRes = await wb.saveSettings(companyId, publishPayload, {
        publish: true,
      });
      const brandingPayload = brandingRes?.data || brandingRes || {};
      if (brandingPayload?.branding_published_at) {
        publicSite.setVersion(
          siteSettings?.company?.slug || previewSlug,
          brandingPayload.branding_published_at,
          "publish"
        );
      }
      applyBrandingFromServer(brandingPayload);
      setSiteSettings(brandingPayload);
      setStylePreviewFamily("");

      await wb.publish(companyId, true);
      const refreshedStatus = await wb.getStatus(companyId).catch(() => null);
      if (refreshedStatus?.data || refreshedStatus) {
        setWebsiteStatus(refreshedStatus?.data || refreshedStatus);
      }
      publicSite.invalidate(
        (siteSettings?.company?.slug || previewSlug || "").toString()
      );
      const publishedMsg = `${
        t("manager.visualBuilder.messages.sitePublished") || "Site published"
      } ✔`;
      setMsg(publishedMsg);
    } catch (e) {
      setErr(
        t("manager.visualBuilder.errors.publishFailed", {
          reason:
            e?.response?.data?.message ||
            e?.response?.data?.error ||
            e.message ||
            t("manager.visualBuilder.errors.unknown"),
        })
      );
    } finally {
      setBusy(false);
    }
  }, [
    applyBrandingFromServer,
    companyId,
    currentDesignFamily,
    currentDesignVersion,
    editing,
    effectivePreviewFamily,
    headerDraft,
    navOverridesWithDefault,
    previewSlug,
    setEditing,
    setPages,
    setSelectedId,
    setSiteSettings,
    siteSettings?.company?.slug,
    t,
    themeOverridesDraft,
    websiteStyleChoices,
    footerDraft,
  ]);

  const onUnpublish = useCallback(async () => {
    if (!companyId) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await wb.publish(companyId, false);
      const latestSettings = await wb.getSettings(companyId).catch(() => null);
      const latestStatus = await wb.getStatus(companyId).catch(() => null);
      const latestPayload = latestSettings?.data || latestSettings || {};
      applyBrandingFromServer(latestPayload);
      setSiteSettings(latestPayload);
      if (latestStatus?.data || latestStatus) {
        setWebsiteStatus(latestStatus?.data || latestStatus);
      }
      publicSite.invalidate(
        (siteSettings?.company?.slug || previewSlug || "").toString()
      );
      setMsg("Website unpublished");
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Unpublish failed"
      );
    } finally {
      setBusy(false);
    }
  }, [applyBrandingFromServer, companyId, previewSlug, setSiteSettings, siteSettings?.company?.slug]);

  const onSaveCheckpoint = useCallback(async (kind = "manual") => {
    if (!companyId) return;
    if (kind === "approved") {
      const validationError = validateApprovedCheckpointName(checkpointName);
      if (validationError) {
        setErr(validationError);
        return;
      }
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await wb.createCheckpoint(companyId, {
        name: (checkpointName || "").trim() || undefined,
        note: (checkpointNote || "").trim() || undefined,
        kind,
      });
      setCheckpointName("");
      setCheckpointNote("");
      await loadCheckpoints(companyId);
      setMsg(kind === "approved" ? "Approved design saved and protected." : "Website version saved.");
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to save checkpoint."
      );
    } finally {
      setBusy(false);
    }
  }, [checkpointName, checkpointNote, companyId, loadCheckpoints]);

  const requestRestoreCheckpoint = useCallback((checkpoint, publishNow = false) => {
    if (!checkpoint?.id) return;
    setCheckpointDialog({
      open: true,
      mode: "restore",
      publishNow: Boolean(publishNow),
      checkpoint,
    });
  }, []);

  const requestDeleteCheckpoint = useCallback((checkpoint) => {
    if (!checkpoint?.id) return;
    setCheckpointDialog({
      open: true,
      mode: "delete",
      publishNow: false,
      checkpoint,
    });
  }, []);

  const closeCheckpointDialog = useCallback(() => {
    setCheckpointDialog({ open: false, mode: null, publishNow: false, checkpoint: null });
  }, []);

  const confirmCheckpointAction = useCallback(async () => {
    const checkpoint = checkpointDialog?.checkpoint;
    if (!companyId || !checkpoint?.id || !checkpointDialog?.mode) return;

    setBusy(true);
    setErr("");
    setMsg("");
    try {
      if (checkpointDialog.mode === "delete") {
        await wb.deleteCheckpoint(companyId, checkpoint.id, {
          confirmProtected: Boolean(checkpoint.protected),
        });
        await loadCheckpoints(companyId);
        setMsg("Website version deleted.");
      } else if (checkpointDialog.mode === "restore") {
        const { data } = await wb.restoreCheckpoint(companyId, checkpoint.id, {
          publish_now: Boolean(checkpointDialog.publishNow),
          restore_live_state: false,
        });
        if (data?.draft) {
          setSiteSettings(data.draft);
          applyBrandingFromServer(data.draft);
        }
        if (data?.reload_required) {
          await loadAll(companyId, {
            id: editing?.id,
            slug: editing?.slug,
            locale: editing?.locale,
          });
        } else {
          const pageRes = await wb.listPages(companyId);
          const pg = (pageRes?.data || []).map((p) =>
            ensureSectionIds(withLiftedLayout(normalizePage(p)))
          );
          setPages(pg);
          if (pg.length) {
            setSelectedId(pg[0].id);
            setEditing(pg[0]);
          }
        }
        await loadCheckpoints(companyId);
        const restoredCount = Number(data?.page_count || data?.result?.restored_pages || 0);
        const suffix = checkpointDialog.publishNow ? " and published" : " to draft";
        const rollbackName = data?.rollback_checkpoint?.name;
        setMsg(`Website version restored${suffix} (${restoredCount} page${restoredCount === 1 ? "" : "s"}).${rollbackName ? ` Rollback saved: ${rollbackName}.` : ""}`);
      }
      closeCheckpointDialog();
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Checkpoint action failed."
      );
    } finally {
      setBusy(false);
    }
  }, [
    applyBrandingFromServer,
    checkpointDialog,
    closeCheckpointDialog,
    companyId,
    editing?.id,
    editing?.locale,
    editing?.slug,
    loadAll,
    loadCheckpoints,
    setEditing,
    setPages,
  ]);

  const previewCheckpoint = useCallback(async (checkpoint) => {
    if (!companyId || !checkpoint?.id) return;
    setCheckpointPreview({ open: true, loading: true, error: "", checkpoint: null });
    try {
      const res = await wb.getCheckpoint(companyId, checkpoint.id);
      const data = res?.data?.checkpoint || null;
      setCheckpointPreview({ open: true, loading: false, error: "", checkpoint: data });
    } catch (e) {
      setCheckpointPreview({
        open: true,
        loading: false,
        error:
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "Failed to inspect website version.",
        checkpoint: null,
      });
    }
  }, [companyId]);


  /* ----- Keyboard shortcuts ----- */
  const handlersRef = useRef({ onSavePage, onPublish, undo, redo });
  useEffect(() => {
    handlersRef.current = { onSavePage, onPublish, undo, redo };
  }, [onSavePage, onPublish, undo, redo]);

  useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      const { onSavePage, onPublish, undo, redo } = handlersRef.current || {};
      if (k === "s" && onSavePage) {
        e.preventDefault();
        onSavePage();
      }
      if (k === "p" && onPublish) {
        e.preventDefault();
        onPublish();
      }
      if (k === "z" && !e.shiftKey && undo) {
        e.preventDefault();
        undo();
      }
      if ((k === "y" || (k === "z" && e.shiftKey)) && redo) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ----- Autosave (debounced, OFF by default) ----- */
  const [autosaveEnabled, setAutosaveEnabled] = useState(false);
  const debounce = (fn, ms = 800) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  const discardPageSettings = useCallback(async () => {
    if (!companyId) return;
    setPageSettingsDirty(false);
    await loadAll(companyId);
  }, [companyId, loadAll]);
  const autosave = React.useMemo(
    () =>
      debounce(async (snapshot) => {
        try {
          if (!autosaveEnabled) return;
          if (!companyId || !snapshot?.id) return;
          const payload = serializePage(ensureSectionIds(snapshot));
          await wb.updatePage(companyId, payload.id, payload);
          setMsg?.(t("manager.visualBuilder.messages.autosaved"));
        } catch (e) {
          console.error(e);
        }
      }, 800),
    [companyId, autosaveEnabled, t]
  );
  useEffect(() => {
    if (!autosaveEnabled) return;
    autosave(editing);
  }, [autosaveEnabled, autosave, editing]);

  /* ----- block helpers ----- */
  const setBlockProp = useCallback(
    (idx, key, value) => {
      setEditing((cur) => {
        const next = { ...cur, content: { sections: [...safeSections(cur)] } };
        if (!next.content.sections[idx]) return cur;
        const blk = { ...next.content.sections[idx] };
        blk.props = { ...(blk.props || {}) };
        blk.props[key] = value;
        next.content.sections[idx] = blk;
        return withLiftedLayout(next);
      });
    },
    [setEditing]
  );

  const setBlockPropsAll = useCallback(
    (idx, newPropsObj) => {
      setEditing((cur) => {
        const next = { ...cur, content: { sections: [...safeSections(cur)] } };
        if (!next.content.sections[idx]) return cur;
        const blk = { ...next.content.sections[idx] };
        blk.props = { ...(blk.props || {}), ...(newPropsObj || {}) };
        next.content.sections[idx] = blk;
        return withLiftedLayout(next);
      });
    },
    [setEditing]
  );

  // Drag-to-adjust section spacing (per block)
  const dragRef = useRef({ active: false, index: -1, startY: 0, startVal: 0 });

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dy = e.clientY - d.startY;
      const nextUnits = Math.max(0, Math.round((d.startVal * 8 + dy) / 8));
      setBlockProp(d.index, "spaceAfter", nextUnits);
    };
    const onUp = () => {
      if (!dragRef.current.active) return;
      dragRef.current = { active: false, index: -1, startY: 0, startVal: 0 };
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setBlockProp]);

  const moveBlock = (idx, dir) => {
  const delta = dir === "up" ? -1 : dir === "down" ? 1 : Number(dir) || 0;

  setEditing((cur) => {
    const arr = [...safeSections(cur)];
    const j = idx + delta;
    if (idx < 0 || idx >= arr.length || j < 0 || j >= arr.length) {
      return withLiftedLayout(cur);
    }
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return withLiftedLayout({ ...cur, content: { sections: arr } });
  });

  setSelectedBlock((b) => {
    const len = safeSections(editing).length;
    return Math.max(0, Math.min((b ?? idx) + delta, Math.max(0, len - 1)));
  });
};


  const duplicateBlock = (idx) => {
    setEditing((cur) => {
      const sections = [...safeSections(cur)];
      if (idx < 0 || idx >= sections.length) return withLiftedLayout(cur);
      const cloned = makeIndependentClone(sections[idx]);
      if (cloned?.type && (!cloned.id || cloned.id.length < 4)) {
        cloned.id = `${cloned.type}-${safeUid()}`;
      }
      sections.splice(idx + 1, 0, cloned);
      return withLiftedLayout({
        ...cur,
        content: { ...cur.content, sections },
      });
    });
    setSelectedBlock(idx + 1);
  };

  const deleteBlock = (idx) => {
    setEditing((cur) => {
      const arr = [...safeSections(cur)];
      arr.splice(idx, 1);
      return withLiftedLayout({ ...cur, content: { sections: arr } });
    });
    setSelectedBlock(-1);
  };

  // NEW: safe addSection helper that handles pageStyle specially
  function addSection(type, index) {
    setEditing((prev) => {
      const page = { ...prev };
      const sections = Array.isArray(page?.content?.sections)
        ? [...page.content.sections]
        : [];

      if (type === "pageStyle") {
        const existingIdx = sections.findIndex((s) => s.type === "pageStyle");
        if (existingIdx >= 0) {
          // already present — just select it
          setSelectedBlock(existingIdx);
          return prev;
        }
        const block = defaultPageStyleBlock();
        sections.splice(0, 0, block); // pin to top
        page.content = { ...(page.content || {}), sections };
        setSelectedBlock(0);
        return withLiftedLayout(page);
      }
  // Read props from the first pageStyle section (if any)

    
      // generic add (kept simple; for others you still have addBlock/NEW_BLOCKS)
      const block = { id: nanoid(8), type, props: {} };
      const insertAt = typeof index === "number" ? index : sections.length;
      sections.splice(insertAt, 0, block);
      page.content = { ...(page.content || {}), sections };
      setSelectedBlock(insertAt);
      return withLiftedLayout(page);
    });
  }

  const addBlock = (type) => {
    setEditing((cur) => {
      const arr = [...safeSections(cur)];
      const makeSchemaDefaults = (schema) => {
        if (!schema || !Array.isArray(schema.fields)) return {};
        const buildFieldDefault = (field) => {
          if (!field || typeof field !== "object") return undefined;
          if (field.default !== undefined) return field.default;
          if (field.type === "boolean") return false;
          if (field.type === "number") return 0;
          if (field.type === "arrayOfStrings") return [];
          if (field.type === "objectArray") return [];
          if (field.type === "imageArray") return [];
          if (field.type === "arrayOfObjects") return [];
          if (field.type === "object" && Array.isArray(field.fields)) {
            const nested = {};
            for (const child of field.fields) {
              const childDefault = buildFieldDefault(child);
              if (childDefault !== undefined) nested[child.name] = childDefault;
            }
            return nested;
          }
          return "";
        };

        const defaults = {};
        for (const field of schema.fields) {
          const value = buildFieldDefault(field);
          if (value !== undefined) defaults[field.name] = value;
        }
        return defaults;
      };

      const factory = NEW_BLOCKS[type];
      const created = factory
        ? factory()
        : {
            type,
            props: makeSchemaDefaults(SCHEMA_REGISTRY[type]),
          };
      if (!created.id) created.id = uid();
      arr.push(created);
      return withLiftedLayout({ ...cur, content: { sections: arr } });
    });
    setSelectedBlock(safeSections(editing).length);
  };

  const renderAddBlockButton = (type, labelKey) => {
    const label = t(labelKey, { defaultValue: type });
    const previewSrc = BLOCK_PREVIEWS[type];
    return (
      <Box
        key={type}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.75,
          width: "100%",
        }}
      >
        {previewSrc ? (
          <ButtonBase
            onClick={() => openBlockPreview(type, label)}
            sx={{
              width: 104,
              height: 68,
              borderRadius: 1,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: 1,
              bgcolor: "background.paper",
            }}
          >
            <Box
              component="img"
              src={previewSrc}
              alt={`${label} preview`}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              loading="lazy"
            />
          </ButtonBase>
        ) : null}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => addBlock(type)}
          sx={{ justifyContent: "center" }}
        >
          {label}
        </Button>
      </Box>
    );
  };

  const ADD_BLOCK_ORDER = [
    ["hero", "manager.visualBuilder.sections.add.hero"],
    ["heroCarousel", "manager.visualBuilder.sections.add.heroCarousel"],
    ["heroSplit", "manager.visualBuilder.sections.add.heroSplit"],
    ["videoStorySplit", "manager.visualBuilder.sections.add.videoStorySplit"],
    ["richText", "manager.visualBuilder.sections.add.richText"],
    ["gallery", "manager.visualBuilder.sections.add.gallery"],
    ["photoGallery", "manager.visualBuilder.sections.add.photoGallery"],
    ["collectionShowcase", "manager.visualBuilder.sections.add.collectionShowcase"],
    ["featureZigzagModern", "manager.visualBuilder.sections.add.featureZigzagModern"],
    ["discoverStory", "manager.visualBuilder.sections.add.discoverStory"],
    ["logoCloud", "manager.visualBuilder.sections.add.logoCloud"],
    ["trustedBrandsRail", "Trusted brands rail"],
    ["workshopsCommissions", "manager.visualBuilder.sections.add.workshopsCommissions"],
    ["pricingTable", "manager.visualBuilder.sections.add.pricingTable"],
    ["pricingTableModern", "Landing Page Pricing"],
    ["galleryCarousel", "manager.visualBuilder.sections.add.carousel"],
    ["faqModern", "Landing Page FAQ"],
    ["logoCarousel", "manager.visualBuilder.sections.add.logoCarousel"],
    ["faq", "manager.visualBuilder.sections.add.faq"],
    ["serviceGrid", "manager.visualBuilder.sections.add.services"],
    ["serviceHoverSlider", "manager.visualBuilder.sections.add.serviceHoverSlider"],
    ["featureShowcaseSlider", "Feature Showcase Slider"],
    ["serviceGridSmart", "manager.visualBuilder.sections.add.serviceGridSmart"],
    ["teamGrid", "manager.visualBuilder.sections.add.teamGrid"],
    ["teamMetrics", "manager.visualBuilder.sections.add.teamMetrics"],
    ["cultureValues", "manager.visualBuilder.sections.add.cultureValues"],
    ["processSteps", "manager.visualBuilder.sections.add.processSteps"],
    ["stats", "manager.visualBuilder.sections.add.stats"],
    ["videoGallery", "manager.visualBuilder.sections.add.videoGallery"],
    ["blogList", "manager.visualBuilder.sections.add.blogList"],
    ["reviewEditorialGrid", "Review Editorial Grid"],
    ["mapEmbed", "manager.visualBuilder.sections.add.mapEmbed"],
    ["contact", "manager.visualBuilder.sections.add.contact"],
    ["contactForm", "manager.visualBuilder.sections.add.contactForm"],
    ["contactFormEditorialSplit", "Premium Contact Form"],
    ["popupCta", "Popup CTA"],
    ["cta", "manager.visualBuilder.sections.add.cta"],
    ["bookingCtaBar", "manager.visualBuilder.sections.add.bookingCtaBar"],
    ["footer", "manager.visualBuilder.sections.add.footer"],
  ];

  /* ----- Page meta helpers ----- */
  const updatePageMeta = (patch) => {
    setPageSettingsDirty(true);
    setEditing((cur) => {
      let next = { ...cur, ...patch };
      if ("layout" in patch) {
        const content = next.content || {};
        const meta = content.meta || {};
        next = {
          ...next,
          content: { ...content, meta: { ...meta, layout: patch.layout } },
        };
      }
      if ("canonical_path" in patch && typeof patch.canonical_path === "string") {
        next.canonical_path = patch.canonical_path.trim();
      }
      return withLiftedLayout(next);
    });
  };

  const applyPageActionPatch = useCallback(
    (pageId, patch, { setHomepage = false } = {}) => {
      if (!pageId) return;
      const persistPatch = async () => {
        try {
          if (!companyId) return;
          let source =
            (editing?.id === pageId ? editing : null) ||
            pages.find((p) => p.id === pageId);
          if (!source) return;
          if (
            source?.id !== editing?.id &&
            (!source?.content || !Array.isArray(source?.content?.sections))
          ) {
            const full = await wb.getPage(companyId, pageId);
            source = full?.data || full || source;
          }
          const base = setHomepage
            ? { ...source, is_homepage: true }
            : { ...source, ...patch };
          const payload = serializePage(ensureSectionIds(withLiftedLayout(base)));
          const r = await wb.updatePage(companyId, payload.id, payload);
          const updated = ensureSectionIds(
            withLiftedLayout(normalizePage(r.data || payload))
          );
          setPages((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          if (editing?.id === updated.id) {
            setEditing(updated);
          }
        } catch (e) {
          console.error(e);
        }
      };
      setPageSettingsDirty(true);
      setSelectedPageIds((prev) => (prev.includes(pageId) ? prev : [pageId]));
      setPages((prev) =>
        prev.map((p) => {
          if (setHomepage) {
            const isHome = p.id === pageId;
            return p.is_homepage === isHome ? p : { ...p, is_homepage: isHome };
          }
          if (p.id !== pageId) return p;
          return { ...p, ...patch };
        })
      );

      if (setHomepage) {
        setEditing((cur) => {
          if (!cur) return cur;
          const isHome = cur.id === pageId;
          if (cur.is_homepage === isHome) return cur;
          return withLiftedLayout({ ...cur, is_homepage: isHome });
        });
      } else if (editing?.id === pageId) {
        updatePageMeta(patch);
      }

      if (patch && Object.prototype.hasOwnProperty.call(patch, "autosave")) {
        if (editing?.id === pageId) {
          setAutosaveEnabled(Boolean(patch.autosave));
        }
      }
      if (
        (patch &&
          (Object.prototype.hasOwnProperty.call(patch, "published") ||
            Object.prototype.hasOwnProperty.call(patch, "show_in_menu") ||
            Object.prototype.hasOwnProperty.call(patch, "autosave"))) ||
        setHomepage
      ) {
        persistPatch();
      }
    },
    [
      companyId,
      editing,
      pages,
      updatePageMeta,
      setAutosaveEnabled,
      setPages,
      setSelectedPageIds,
    ]
  );

  const savePageMeta = async () => {
    if (!companyId) return;
    try {
      setBusy(true);
      if (editing?.id) {
        const targets = selectedPageIds.length
          ? selectedPageIds
          : [editing.id];
        const updated = await Promise.all(
          targets.map(async (id) => {
            const isEditing = id === editing.id;
            const base = isEditing
              ? { ...editing }
              : { ...(pages.find((p) => p.id === id) || {}) };
            const bulkPatch = {
              show_in_menu: Boolean(base.show_in_menu ?? true),
              published: Boolean(base.published ?? true),
              autosave: Boolean(base.autosave ?? true),
              is_homepage: Boolean(base.is_homepage ?? false),
            };
            const merged = { ...base, ...bulkPatch };
            const payload = serializePage(ensureSectionIds(withLiftedLayout(merged)));
            const r = await wb.updatePage(companyId, payload.id, payload);
            return ensureSectionIds(
              withLiftedLayout(normalizePage(r.data || payload))
            );
          })
        );
        setPages((prev) =>
          prev.map((p) => updated.find((u) => u.id === p.id) || p)
        );
        const match = updated.find((u) => u.id === editing.id);
        if (match) setEditing(match);
        setSelectedPageIds([]);
        setMsg(t("manager.visualBuilder.messages.pageSettingsSaved"));
        setPageSettingsDirty(false);
        if (isNextJsContentMode && nextJsPreviewUrl) {
          await refreshNextJsPreview();
        }
      } else {
        await onSavePage();
        setPageSettingsDirty(false);
      }
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePageSettings"));
    } finally {
      setBusy(false);
    }
  };

  const slugify = (value) =>
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-");

  const buildDuplicateSlug = (base, existing) => {
    const rawBase = String(base || "").trim().toLowerCase();
    const isBlogPost = rawBase.startsWith("blog/");
    const cleanBase = slugify(isBlogPost ? rawBase.slice("blog/".length) : rawBase) || "page";
    const baseSlug = isBlogPost ? `blog/duplicated-${cleanBase}` : `duplicated${cleanBase}`;
    let candidate = baseSlug;
    let idx = 2;
    while (existing.has(candidate)) {
      candidate = `${baseSlug}-${idx}`;
      idx += 1;
    }
    existing.add(candidate);
    return candidate;
  };

  const prefixDuplicate = (value, fallback = "Page") => {
    const trimmed = String(value || "").trim();
    return trimmed ? `Duplicated ${trimmed}` : `Duplicated ${fallback}`;
  };

  const duplicateSelectedPages = async () => {
    if (!companyId) return;
    const targets = selectedPageIds.length
      ? selectedPageIds
      : editing?.id
        ? [editing.id]
        : [];
    if (!targets.length) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const existingSlugs = new Set(
        pages.map((p) => String(p.slug || "").toLowerCase())
      );
      const createdPages = [];
      for (const id of targets) {
        const source =
          id === editing?.id ? editing : pages.find((p) => p.id === id);
        if (!source) continue;
        const next = JSON.parse(JSON.stringify(source));
        delete next.id;
        next.slug = buildDuplicateSlug(next.slug || next.title || "page", existingSlugs);
        next.path = next.slug;
        next.title = prefixDuplicate(next.title || next.slug, "Page");
        next.menu_title = prefixDuplicate(next.menu_title || next.title, "Page");
        if (next.seo_title) next.seo_title = prefixDuplicate(next.seo_title, "Page");
        if (next.og_title) next.og_title = prefixDuplicate(next.og_title, "Page");
        next.canonical_path = "";
        const payload = serializePage(ensureSectionIds(withLiftedLayout(next)));
        const r = await wb.createPage(companyId, payload);
        const created = ensureSectionIds(
          withLiftedLayout(normalizePage(r.data || payload))
        );
        createdPages.push(created);
      }
      if (createdPages.length) {
        setPages((prev) => [...createdPages, ...prev]);
        setSelectedId(createdPages[0].id);
        setEditing(createdPages[0]);
        setSelectedBlock(-1);
        setSelectedPageIds([]);
        setMsg(t("manager.visualBuilder.messages.created"));
      }
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePage"));
    } finally {
      setBusy(false);
    }
  };

  const duplicatePageById = async (id) => {
    if (!companyId || !id) return;
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const existingSlugs = new Set(
        pages.map((p) => String(p.slug || "").toLowerCase())
      );
      const source =
        id === editing?.id ? editing : pages.find((p) => p.id === id);
      if (!source) return;
      const next = JSON.parse(JSON.stringify(source));
      delete next.id;
      next.slug = buildDuplicateSlug(next.slug || next.title || "page", existingSlugs);
      next.path = next.slug;
      next.title = prefixDuplicate(next.title || next.slug, "Page");
      next.menu_title = prefixDuplicate(next.menu_title || next.title, "Page");
      if (next.seo_title) next.seo_title = prefixDuplicate(next.seo_title, "Page");
      if (next.og_title) next.og_title = prefixDuplicate(next.og_title, "Page");
      next.canonical_path = "";
      const payload = serializePage(ensureSectionIds(withLiftedLayout(next)));
      const r = await wb.createPage(companyId, payload);
      const created = ensureSectionIds(
        withLiftedLayout(normalizePage(r.data || payload))
      );
      setPages((prev) => [created, ...prev]);
      setSelectedId(created.id);
      setEditing(created);
      setSelectedBlock(-1);
      setSelectedPageIds([]);
      setMsg(t("manager.visualBuilder.messages.created"));
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.savePage"));
    } finally {
      setBusy(false);
    }
  };

  const openNewArticleDialog = () => {
    setNewArticleDraft({ title: "", slug: "", description: "", slugTouched: false });
    setNewArticleDialogOpen(true);
  };

  const createBlogPost = async () => {
    if (!companyId || !isNextJsContentMode) return;
    const title = String(newArticleDraft.title || "").trim();
    if (!title) {
      setErr("Enter an article title before creating the draft.");
      return;
    }
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const starter = createWebsiteBlogPostPage(pages, {
        title,
        slug: newArticleDraft.slug,
        description: newArticleDraft.description,
        themeKey: currentStyleKey,
      });
      const payload = serializePage(ensureSectionIds(withLiftedLayout(starter)));
      const response = await wb.createPage(companyId, payload);
      const created = ensureSectionIds(
        withLiftedLayout(normalizePage(response?.data || response || payload))
      );
      setPages((previous) => [created, ...previous]);
      setSelectedId(created.id);
      setEditing(created);
      setSelectedBlock(-1);
      setPagesListOpen(false);
      setPageSettingsOpen(false);
      setNewArticleDialogOpen(false);
      setMsg("Draft article created. Edit it on the Canvas, review Page settings and SEO, then publish it when ready.");
      if (isNextJsContentMode && nextJsPreviewUrl) {
        await refreshNextJsPreview(null, normalizeNextJsPreviewPagePath(created));
      }
    } catch (error) {
      console.error(error);
      setErr(error?.response?.data?.error || "Unable to create the draft article.");
    } finally {
      setBusy(false);
    }
  };

  /* ----- LAB import helpers ----- */
  const importLabSettings = () => {
    try {
      const raw = localStorage.getItem(LAB_LS_KEY);
      if (!raw) {
        setErr(t("manager.visualBuilder.errors.noSavedLabSettings"));
        return;
      }
      const p = JSON.parse(raw) || {};
      const layout = p.layout ?? editing.layout ?? "boxed";
      const sectionSpacing = p.sectionSpacing ?? 6;
      const defaultGutterX = (() => {
        if (typeof p.gutterX === "number") return p.gutterX;
        if (p.density === "compact") return 12;
        if (p.density === "comfortable") return 24;
        return 16;
      })();

      setEditing((cur) => {
        const content = cur.content || {};
        const meta = content.meta || {};
        const next = {
          ...cur,
          layout,
          content: {
            ...content,
            meta: { ...meta, layout, sectionSpacing, defaultGutterX },
          },
        };
        return withLiftedLayout(next);
      });

      if (selectedBlock >= 0) {
        const selected = safeSections(editing)[selectedBlock];
        if (selected) {
          const blockPatch = {};
          if (typeof p.gutterX === "number") blockPatch.gutterX = p.gutterX;
          if (typeof p.bleedLeft === "boolean") blockPatch.bleedLeft = p.bleedLeft;
          if (typeof p.bleedRight === "boolean")
            blockPatch.bleedRight = p.bleedRight;
          if (typeof p.heroHeight === "number" && selected.type === "hero")
            blockPatch.heroHeight = p.heroHeight;
          if (typeof p.safeTop === "boolean" && selected.type === "hero")
            blockPatch.safeTop = p.safeTop;
          if (p.contentMaxWidth !== undefined && selected.type === "hero")
            blockPatch.contentMaxWidth = p.contentMaxWidth;
          if (Object.keys(blockPatch).length) {
            setBlockPropsAll(selectedBlock, {
              ...(selected.props || {}),
              ...blockPatch,
            });
          }
        }
      }

      setMsg(t("manager.visualBuilder.messages.importedLayoutLab"));
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.importSettings"));
    }
  };

  const importLabSettingsAll = () => {
    try {
      const raw = localStorage.getItem(LAB_LS_KEY);
      if (!raw) {
        setErr(t("manager.visualBuilder.errors.noLayoutSettings"));
        return;
      }
      const p = JSON.parse(raw) || {};

      const layout = p.layout ?? editing.layout ?? "boxed";
      const sectionSpacing = p.sectionSpacing ?? 6;
      const defaultGutterX = (() => {
        if (typeof p.gutterX === "number") return p.gutterX;
        if (p.density === "compact") return 12;
        if (p.density === "comfortable") return 24;
        return 16;
      })();

      setEditing((cur) => {
        const content = cur.content || {};
        const meta = content.meta || {};
        const nextSections = (cur?.content?.sections || []).map((s) => {
          const props = { ...(s.props || {}) };
          if (typeof p.gutterX === "number") props.gutterX = p.gutterX;
          if (typeof p.bleedLeft === "boolean") props.bleedLeft = p.bleedLeft;
          if (typeof p.bleedRight === "boolean")
            props.bleedRight = p.bleedRight;
          if (s.type === "hero") {
            if (typeof p.heroHeight === "number") props.heroHeight = p.heroHeight;
            if (typeof p.safeTop === "boolean") props.safeTop = p.safeTop;
            if (p.contentMaxWidth !== undefined)
              props.contentMaxWidth = p.contentMaxWidth;
          }
          return { ...s, props };
        });

        const next = {
          ...cur,
          layout,
          content: {
            ...content,
            meta: { ...meta, layout, sectionSpacing, defaultGutterX },
            sections: nextSections,
          },
        };
        return withLiftedLayout(next);
      });

      setMsg(t("manager.visualBuilder.messages.importedAllLab"));
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.importLabSettings"));
    }
  };

  /* ---------- RENDER ---------- */

  // Compute schema via registry
  const selectedBlockObj = safeSections(editing)[selectedBlock];
  const blockType = selectedBlockObj?.type;
  const normalizedSchemaKey = blockType
    ? blockType.replace(/[^a-z0-9]/gi, "").toLowerCase()
    : "";
  const normalizedSchemaMatch = normalizedSchemaKey
    ? Object.keys(SCHEMA_REGISTRY).find(
        (key) => key.replace(/[^a-z0-9]/gi, "").toLowerCase() === normalizedSchemaKey
      )
    : null;
  const schemaForBlock =
    (blockType && SCHEMA_REGISTRY[blockType]) ||
    (normalizedSchemaMatch ? SCHEMA_REGISTRY[normalizedSchemaMatch] : null) ||
    selectedBlockObj?.schema ||
    null;

  const ControlsCard = (
    <SectionCard
      title={null}
      description={null}
      actions={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {hasDraftChanges && (
            <Chip
              size="small"
              color="warning"
              label={t("manager.visualBuilder.draftChip", "Draft changes pending")}
            />
          )}
          <Tooltip
            title={
              lastPublishedLabel ||
              t("manager.visualBuilder.controls.publishFloatingReady", "Publish site")
            }
          >
            <IconButton size="small" aria-label={lastPublishedLabel ? "Published" : "Draft"}>
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t("manager.visualBuilder.controls.tooltips.guide")}>
            <IconButton onClick={() => setHelpOpen(true)} size="small">
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Button
            size="small"
            startIcon={<ViewCarouselIcon />}
            onClick={() => setBuilderTabIndex(1)}
          >
            {isNextJsContentMode ? "Change Modern Theme" : "Explore Modern Themes"}
          </Button>
          <IconButton size="small" onClick={openToolsMenu}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={toolsAnchorEl}
            open={Boolean(toolsAnchorEl)}
            onClose={closeToolsMenu}
          >
            <MenuItem component={RouterLink} to="/manage/website/layout-lab" onClick={closeToolsMenu}>
              {t("manager.visualBuilder.controls.buttons.layoutLab")}
            </MenuItem>
            <MenuItem onClick={() => { closeToolsMenu(); importLabSettingsFromServer(); }}>
              {t("manager.visualBuilder.controls.buttons.importServer")}
            </MenuItem>
            <MenuItem onClick={() => { closeToolsMenu(); importLabSettings(); }}>
              {t("manager.visualBuilder.controls.buttons.importSettings")}
            </MenuItem>
            <MenuItem onClick={() => { closeToolsMenu(); importLabSettingsAll(); }}>
              {t("manager.visualBuilder.controls.buttons.importAll")}
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeToolsMenu();
                if (!busy && companyId) loadAll(companyId);
              }}
            >
              {t("manager.visualBuilder.controls.buttons.refresh")}
            </MenuItem>
          </Menu>

          <Tooltip title={t("manager.visualBuilder.controls.tooltips.save")}>
            <span>
              <Button size="small" startIcon={<SaveIcon />} variant="outlined" disabled={busy || !companyId} onClick={onSavePage}>
                {t("manager.visualBuilder.controls.buttons.save")}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={t("manager.visualBuilder.pageStyle.applyAll.tooltip")}>
            <span>
              <Button size="small" variant="outlined" onClick={applyStyleToAllPagesNow} startIcon={<PaletteIcon />}>
                {t("manager.visualBuilder.pageStyle.applyAll.button")}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={t("manager.visualBuilder.controls.tooltips.publish")}>
            <span>
              <Button size="small" startIcon={<PublishIcon />} variant="contained" disabled={busy || !companyId} onClick={onPublish}>
                {t("manager.visualBuilder.controls.buttons.publish")}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      }
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Button size="small" startIcon={<UndoIcon />} disabled={!canUndo} onClick={undo}>
          {t("manager.visualBuilder.controls.buttons.undo")}
        </Button>
        <Button size="small" startIcon={<RedoIcon />} disabled={!canRedo} onClick={redo}>
          {t("manager.visualBuilder.controls.buttons.redo")}
        </Button>

        {!isNextJsContentMode && <FormControlLabel
          sx={{ ml: 1 }}
          label={t("manager.visualBuilder.controls.toggles.simpleMode")}
          control={
            <Switch
              checked={mode === "simple"}
              onChange={(_, v) => setMode(v ? "simple" : "advanced")}
            />
          }
        />}
        {!isNextJsContentMode && <Tooltip
          title={t(
            "manager.visualBuilder.controls.tooltips.simpleModeFloating",
            "Simple mode: click any section on the canvas to open the floating editor. Drag the editor header to move it. Use X to close, then click a section to reopen."
          )}
        >
          <IconButton size="small" aria-label="Simple mode help">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>}

        {/*
          Phase 1: hide dock/inline/float/follow controls from end users.
          Behavior is now driven by the Simple mode switch above.
        */}

        <FormControlLabel
          sx={{ ml: 1 }}
          label={t("manager.visualBuilder.controls.toggles.fullPreview")}
          control={
            <Switch checked={fullPreview} onChange={(_, v) => setFullPreview(v)} />
          }
        />
      </Stack>
    </SectionCard>
  );

  const AlertsCard =
    msg || err ? (
      <SectionCard title={t("manager.visualBuilder.status.title")}>
        <Stack spacing={1}>
          {msg && <Alert severity="success">{msg}</Alert>}
          {err && <Alert severity="error">{err}</Alert>}
        </Stack>
      </SectionCard>
    ) : null;

  const SeoSettingsSection = (
    <CollapsibleSection
      id="builder-page-seo"
      title={t("manager.visualBuilder.pages.seo.cardTitle", "SEO")}
      description={t("manager.visualBuilder.pages.seo.cardDescription")}
      expanded={seoSettingsOpen}
      onChange={(open) => {
        setSeoSettingsOpen(open);
        if (open && mode === "simple") setSelectedBlock(-1);
      }}
    >
      <Stack spacing={1.5}>
        {inferPageKind(editing || {}) === "blog" ? (
          <Alert severity="info" variant="outlined">
            Blog SEO checklist: use one specific page title, write an original summary, add descriptive image alt text and a social image, leave No index off only when the article is ready, then publish the page and website. Published indexable pages are included in the website sitemap automatically.
          </Alert>
        ) : null}
        <Alert severity="info">
          <Trans
            i18nKey="manager.visualBuilder.pages.seo.advancedPrompt"
            defaults="Need advanced SEO? Open <seoLink>Website Manager -> SEO & Metadata</seoLink>."
            components={{
              seoLink: (
                <Link component={RouterLink} to="/manager/website#seo" underline="hover" />
              ),
            }}
          />
        </Alert>
        <TextField
          label={t("manager.visualBuilder.pages.seo.fields.title")}
          size="small"
          fullWidth
          value={editing.seo_title || ""}
          onChange={(e) => setEditing((s) => ({ ...s, seo_title: e.target.value }))}
          helperText={t("manager.visualBuilder.pages.seo.helpers.title")}
        />
        <TextField
          label={t("manager.visualBuilder.pages.seo.fields.description")}
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={editing.seo_description || ""}
          onChange={(e) => setEditing((s) => ({ ...s, seo_description: e.target.value }))}
          helperText={t("manager.visualBuilder.pages.seo.helpers.description")}
        />
        <TextField
          label={t("manager.visualBuilder.pages.seo.fields.keywords")}
          size="small"
          fullWidth
          value={editing.seo_keywords || ""}
          onChange={(e) => setEditing((s) => ({ ...s, seo_keywords: e.target.value }))}
          helperText={t("manager.visualBuilder.pages.seo.helpers.keywords")}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.ogTitle")}
            size="small"
            fullWidth
            value={editing.og_title || ""}
            onChange={(e) => setEditing((s) => ({ ...s, og_title: e.target.value }))}
          />
          <TextField
            label={t("manager.visualBuilder.pages.seo.fields.ogDescription")}
            size="small"
            fullWidth
            value={editing.og_description || ""}
            onChange={(e) => setEditing((s) => ({ ...s, og_description: e.target.value }))}
          />
        </Stack>
        <TextField
          label={t("manager.visualBuilder.pages.seo.fields.ogImage")}
          size="small"
          fullWidth
          value={editing.og_image_url || ""}
          onChange={(e) => setEditing((s) => ({ ...s, og_image_url: e.target.value }))}
        />
        <TextField
          label={t("manager.visualBuilder.pages.seo.fields.canonicalPath")}
          size="small"
          fullWidth
          value={editing.canonical_path || ""}
          onChange={(e) => updatePageMeta({ canonical_path: e.target.value })}
          helperText={slugBase ? t("manager.visualBuilder.pages.seo.helpers.canonicalPath", { base: slugBase }) : undefined}
        />
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(editing.noindex)}
              onChange={(_, v) => setEditing((s) => ({ ...s, noindex: v }))}
            />
          }
          label={t("manager.visualBuilder.pages.seo.fields.noindex")}
        />
        <SearchSnippetPreview
          title={seoPreviewTitle}
          url={pageCanonicalPreview || slugBase || canonicalBase || "https://example.com"}
          description={seoPreviewDescription}
        />
        <SocialCardPreview
          title={socialPreviewTitle}
          description={socialPreviewDescription}
          image={socialPreviewImage}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="flex-end"
          sx={{ pt: 0.5 }}
        >
          <Button
            size="small"
            variant="contained"
            startIcon={<SaveIcon fontSize="small" />}
            onClick={onSavePage}
            disabled={busy || !companyId}
          >
            {t("management.domainSettings.seo.buttons.save", "Save SEO")}
          </Button>
        </Stack>
      </Stack>
    </CollapsibleSection>
  );

  const StyleChooserBlock = (
    <CollapsibleSection
      id="builder-style-chooser"
      title="Website Style"
      description="Choose a Modern theme or continue with the Classic editor."
      expanded
    >
      <Stack spacing={1.5}>
        {deprecatedStoredDesignFamily ? (
          <Alert severity="warning" variant="outlined">
            This company is using the deprecated design family{" "}
            <strong>{deprecatedStoredDesignFamily}</strong>. The runtime remains
            available for safe legacy rendering, but this family is hidden from
            normal style selection during the website catalog migration.
          </Alert>
        ) : null}
        {styleMsg ? <Alert severity="success">{styleMsg}</Alert> : null}
        {styleErr ? <Alert severity="error">{styleErr}</Alert> : null}
        {!hasConfiguredNextJsThemeBaseUrl() ? (
          <Alert severity="warning" variant="outlined">
            {NEXTJS_THEME_PREVIEW_CONFIG_ERROR}
          </Alert>
        ) : null}
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 1.5,
            borderColor: isNextJsContentMode ? "primary.main" : "divider",
            bgcolor: isNextJsContentMode ? "primary.50" : "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Current editor: {isNextJsContentMode ? "Modern" : "Classic"}
                </Typography>
                <Chip
                  size="small"
                  label={isNextJsContentMode ? "Next.js" : "Classic editor"}
                  color={isNextJsContentMode ? "primary" : "default"}
                  variant="outlined"
                />
                {isNextJsContentMode && activeStyleChoice?.name ? (
                  <Chip size="small" label={activeStyleChoice.name} color="success" />
                ) : null}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {isNextJsContentMode
                  ? "Your draft uses the Modern editor. Choose another theme below, or return to Classic if needed."
                  : "Your draft uses the Classic editor. You can keep editing it or upgrade to a Modern theme below."}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={() => setBuilderTabIndex(0)}>
                Edit Website Content
              </Button>
              {isNextJsContentMode ? (
                <Button
                  size="small"
                  color="warning"
                  onClick={() => {
                    const classicStyle = websiteStyleChoices.find((item) => item.key === "classic");
                    if (classicStyle) requestWebsiteStyleApply(classicStyle);
                  }}
                  disabled={styleSaving}
                >
                  Return to Classic Editor
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  component={RouterLink}
                  to={`/manager/website/templates${supportQuery}`}
                >
                  Browse Classic Templates
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
        <Alert severity="info" variant="outlined">
          Modern themes are applied to your draft first. Your live website stays unchanged until you publish, and a safety version is created automatically when you switch editors.
        </Alert>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.18em" }}>
          Modern Themes (Next.js)
        </Typography>
        <NextJsWebsiteStyleBrowser
          styles={nextJsWebsiteStyleChoices}
          currentStyleKey={currentStyleKey}
          currentStyleVersion={currentStyleVersion}
          liveStyleKey={liveStyleKey}
          liveStyleVersion={liveStyleVersion}
          saving={styleSaving}
          previewUrl={styleGalleryPreviewUrl}
          previewError={styleErr}
          onPreview={async (style, pagePath) => {
            setStyleGalleryPreviewUrl("");
            const previewUrl = await refreshNextJsPreview(style, pagePath, false);
            setStyleGalleryPreviewUrl(previewUrl || "");
          }}
          onApply={requestWebsiteStyleApply}
        />
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: "background.paper" }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "flex-start", md: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Draft style: {activeStyleChoice?.name || "Classic"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live style: {websiteStyleChoices.find((item) => item.key === liveStyleKey)?.name || "Classic"}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </CollapsibleSection>
  );

  const renderableSections = safeSections(editing)
    .map((section, idx) => ({ section, idx }))
    .filter(({ section }) => section.type !== "pageStyle");
  const semanticModules = safeModules(editing);
  const editingPageKind = inferPageKind(editing || {});
  const originalHomepageBlueprint = isNextJsContentMode && editingPageKind === "home"
    ? getProfessionHomeBlueprint(currentStyleKey)
    : null;
  const canRestoreOriginalHomepage = Boolean(originalHomepageBlueprint);
  const semanticModuleChoices = isNextJsContentMode
    ? getCompatibleModuleChoices(currentStyleKey, editingPageKind, semanticModules)
    : [];
  const selectedModuleIndex = semanticModules.findIndex(
    (module) => module.id === selectedModuleId
  );
  const selectedModule =
    selectedModuleIndex >= 0 ? semanticModules[selectedModuleIndex] : null;

  const LeftColumn = (
    <Stack spacing={1.5}>
      <InspectorColumn />
      <CollapsibleSection
        id="builder-pages-list"
        title="All pages & menu"
        description="Advanced page organization and bulk controls. Use the Canvas toolbar for everyday page work."
        expanded={pagesListOpen}
        onChange={(next) => {
          setPagesListOpen(next);
          setPageSettingsOpen(next);
        }}
      >
        <Paper variant="outlined" sx={{ p: 1.25, mb: 1, borderRadius: 1.5 }}>
          <Stack spacing={1}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Client links in public menu
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Login, My Bookings, and My Basket use the existing secure client flows. They are not editable website pages.
              </Typography>
            </Box>
            <Grid container spacing={1}>
              {[
                {
                  key: "login",
                  enabledKey: "show_login_tab",
                  labelKey: "login_tab_label",
                  title: "Login",
                  fallback: "Login",
                },
                {
                  key: "my-bookings",
                  enabledKey: "show_my_bookings_tab",
                  labelKey: "my_bookings_tab_label",
                  title: "My Bookings",
                  fallback: "My Bookings",
                },
                {
                  key: "basket",
                  enabledKey: "show_basket_tab",
                  labelKey: "basket_tab_label",
                  title: "My Basket",
                  fallback: "My Basket",
                },
              ].map((link) => {
                const overrides = navDraft?.nav_overrides || navOverridesWithDefault || {};
                const enabled = overrides[link.enabledKey] !== false;
                return (
                  <Grid item xs={12} md={4} key={link.key}>
                    <Stack spacing={0.25}>
                      <FormControlLabel
                        sx={{ m: 0 }}
                        control={
                          <Switch
                            size="small"
                            checked={enabled}
                            onChange={(event) =>
                              updateClientSystemLink(link.enabledKey, event.target.checked)
                            }
                          />
                        }
                        label={`Show ${link.title}`}
                      />
                      <TextField
                        size="small"
                        label={`${link.title} label`}
                        value={overrides[link.labelKey] || link.fallback}
                        onChange={(event) =>
                          updateClientSystemLink(link.labelKey, event.target.value)
                        }
                      />
                    </Stack>
                  </Grid>
                );
              })}
            </Grid>
            <Stack direction="row" justifyContent="flex-end">
              <Button
                size="small"
                variant="contained"
                onClick={() =>
                  saveNavSettingsWithPreviewRefresh({
                    nav_style: navDraft?.nav_style || navStyleState || {},
                    nav_overrides: navDraft?.nav_overrides || navOverridesWithDefault || {},
                  })
                }
                disabled={navSaving}
              >
                {navSaving ? "Saving…" : "Save client links"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
        {isNextJsContentMode ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 1 }}>
            Services, Products, Reviews, and Jobs use their existing workspaces for business records. Edit this page&apos;s composition, modules, and SEO here; booking, commerce, applications, and account flows stay system-owned.
          </Alert>
        ) : null}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {selectedPageIds.length
              ? `${selectedPageIds.length} selected`
              : "Select pages to bulk update"}
          </Typography>
          <Button
            size="small"
            variant="text"
            disabled={!selectedPageIds.length}
            onClick={() => setSelectedPageIds([])}
          >
            Clear selection
          </Button>
        </Stack>
        <List dense sx={{ mb: 1 }}>
          {pages.map((p) => (
            <ListItem key={p.id} disablePadding>
              <Checkbox
                size="small"
                checked={selectedPageIds.includes(p.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(_, checked) => {
                  setSelectedPageIds((prev) =>
                    checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                  );
                }}
                sx={{ ml: 0.5, mr: 0.5 }}
              />
              <ListItemButton
                selected={selectedId === p.id}
                onClick={() => {
                  openBuilderPage(p);
                }}
              >
                <ListItemText primary={p.title || p.slug} secondary={p.slug} />
              </ListItemButton>
              <IconButton
                size="small"
                onClick={(e) => handlePageMenuOpen(e, p)}
                sx={{ ml: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </ListItem>
          ))}
      </List>
      <Menu
        anchorEl={pageMenuAnchor}
        open={Boolean(pageMenuAnchor)}
        onClose={handlePageMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            const current = Boolean(pageMenuTarget.published ?? true);
            applyPageActionPatch(pageMenuTarget.id, { published: !current });
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.published ?? true ? "Unpublish" : "Publish"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            const current = Boolean(pageMenuTarget.show_in_menu ?? true);
            applyPageActionPatch(pageMenuTarget.id, { show_in_menu: !current });
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.show_in_menu ?? true ? "Hide from menu" : "Show in menu"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            if (pageMenuTarget.is_homepage) {
              applyPageActionPatch(pageMenuTarget.id, { is_homepage: false });
            } else {
              applyPageActionPatch(pageMenuTarget.id, {}, { setHomepage: true });
            }
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.is_homepage ? "Unset homepage" : "Set as homepage"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            const current = Boolean(pageMenuTarget.autosave ?? true);
            applyPageActionPatch(pageMenuTarget.id, { autosave: !current });
            handlePageMenuClose();
          }}
        >
          {pageMenuTarget?.autosave ?? true ? "Disable autosave" : "Enable autosave"}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (!pageMenuTarget) return;
            duplicatePageById(pageMenuTarget.id);
            handlePageMenuClose();
          }}
        >
          Duplicate
        </MenuItem>
      </Menu>
      <Alert severity="info" sx={{ mt: 1 }}>
        Need another page? Visit the {" "}
        <Link component={RouterLink} to="/manager/website" underline="hover">
          Website Manager
        </Link>{" "}
        to create pages, then return here to design them.
      </Alert>
      <Alert severity="info" sx={{ mt: 1 }}>
        <Trans
          i18nKey="manager.visualBuilder.pages.seoPrompt"
          components={{
            seoLink: (
              <Link component={RouterLink} to="/manager/website#seo" underline="hover" />
            ),
          }}
        />
      </Alert>
    </CollapsibleSection>

      <CollapsibleSection
        id="builder-page-settings"
        title={t("manager.visualBuilder.pages.settings.title")}
        expanded={pageSettingsOpen}
        onChange={(next) => setPageSettingsOpen(next)}
      >
        {isNextJsContentMode ? (
          <Alert severity="info" variant="outlined" sx={{ mb: 1.5 }}>
            Modern themes keep the page composition fixed. Page metadata still
            applies, but layout-specific controls are handled by the selected
            website style.
          </Alert>
        ) : null}
        <Stack spacing={1}>
          <TextField
            label={t("manager.visualBuilder.pages.settings.fields.slug")}
            size="small"
            value={editing.slug || ""}
            onChange={(e) => updatePageMeta({ slug: e.target.value })}
            helperText={t("manager.visualBuilder.pages.settings.fields.slugHint")}
            fullWidth
          />
          <TextField
            label={t("manager.visualBuilder.pages.settings.fields.pageTitle")}
            size="small"
            value={editing.title || ""}
            onChange={(e) => updatePageMeta({ title: e.target.value })}
            fullWidth
          />
          <TextField
            label={t("manager.visualBuilder.pages.settings.fields.menuTitle")}
            size="small"
            value={editing.menu_title || ""}
            onChange={(e) => updatePageMeta({ menu_title: e.target.value })}
            fullWidth
          />
          {String(editing.slug || "").toLowerCase() === "services-classic" && (
            <TextField
              label="Services heading"
              size="small"
              value={editing?.content?.meta?.servicesHeading || ""}
              disabled={isNextJsContentMode}
              onChange={(e) => {
                const value = e.target.value;
                setEditing((cur) => {
                  const content = cur.content || {};
                  const meta = content.meta || {};
                  return withLiftedLayout({
                    ...cur,
                    content: { ...content, meta: { ...meta, servicesHeading: value } },
                  });
                });
              }}
              helperText={
                isNextJsContentMode
                  ? "Not available for this website style."
                  : "Shown as the title on the Services page."
              }
              fullWidth
            />
          )}
          {["products", "products-classic"].includes(String(editing.slug || "").toLowerCase()) && (
            <>
              <TextField
                label="Products heading"
                size="small"
                value={editing?.content?.meta?.productsHeading || ""}
                disabled={isNextJsContentMode}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditing((cur) => {
                    const content = cur.content || {};
                    const meta = content.meta || {};
                    return withLiftedLayout({
                      ...cur,
                      content: { ...content, meta: { ...meta, productsHeading: value } },
                    });
                  });
                }}
                helperText={
                  isNextJsContentMode
                    ? "Not available for this website style."
                    : "Shown as the title on the Products page."
                }
                fullWidth
              />
              <TextField
                label="Products subheading"
                size="small"
                value={editing?.content?.meta?.productsSubheading || ""}
                disabled={isNextJsContentMode}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditing((cur) => {
                    const content = cur.content || {};
                    const meta = content.meta || {};
                    return withLiftedLayout({
                      ...cur,
                      content: { ...content, meta: { ...meta, productsSubheading: value } },
                    });
                  });
                }}
                helperText={
                  isNextJsContentMode
                    ? "Not available for this website style."
                    : "Shown below the Products heading."
                }
                fullWidth
                multiline
                minRows={2}
              />
            </>
          )}
          <TextField
            label={t("manager.visualBuilder.pages.settings.fields.sortOrder")}
            size="small"
            type="number"
            value={Number(editing.sort_order ?? 0)}
            onChange={(e) =>
              updatePageMeta({ sort_order: Number(e.target.value || 0) })
            }
            fullWidth
          />

          {/* Layout selector (boxed vs full) */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {t("manager.visualBuilder.pages.settings.layout.label")}
            </Typography>
            <Select
              size="small"
              fullWidth
              value={editing.layout || "boxed"}
              disabled={isNextJsContentMode}
              onChange={(e) => updatePageMeta({ layout: e.target.value })}
            >
              <MenuItem value="boxed">{t("manager.visualBuilder.pages.settings.layout.boxed")}</MenuItem>
              <MenuItem value="full">{t("manager.visualBuilder.pages.settings.layout.full")}</MenuItem>
            </Select>
            {isNextJsContentMode ? (
              <FormHelperText>
                This setting is controlled by the selected website style.
              </FormHelperText>
            ) : null}
          </Box>

          {/* Global section spacing (space between blocks) */}
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              {t("manager.visualBuilder.pages.settings.sectionSpacing.label")}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Slider
                size="small"
                min={0}
                max={12}
                step={1}
                disabled={isNextJsContentMode}
                value={Number(editing?.content?.meta?.sectionSpacing ?? 6)}
                valueLabelDisplay="auto"
                onChange={(_, v) =>
                  setEditing((cur) => {
                    const content = cur.content || {};
                    const meta = content.meta || {};
                    return withLiftedLayout({
                      ...cur,
                      content: { ...content, meta: { ...meta, sectionSpacing: Number(v) } },
                    });
                  })
                }
                sx={{ flex: 1 }}
              />
              <TextField
                size="small"
                type="number"
                disabled={isNextJsContentMode}
                inputProps={{ min: 0, max: 12 }}
                value={Number(editing?.content?.meta?.sectionSpacing ?? 6)}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(12, Number(e.target.value || 0)));
                  setEditing((cur) => {
                    const content = cur.content || {};
                    const meta = content.meta || {};
                    return withLiftedLayout({
                      ...cur,
                      content: { ...content, meta: { ...meta, sectionSpacing: v } },
                    });
                  });
                }}
                sx={{ width: 72 }}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {isNextJsContentMode
                ? "This setting is controlled by the selected website style."
                : t("manager.visualBuilder.pages.settings.sectionSpacing.hint")}
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={Boolean(editing.show_in_menu ?? true)}
                onChange={(_, v) => updatePageMeta({ show_in_menu: v })}
              />
            }
            label={t("manager.visualBuilder.pages.settings.toggles.showInMenu")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(editing.published ?? true)}
                onChange={(_, v) => updatePageMeta({ published: v })}
              />
            }
            label={t("manager.visualBuilder.pages.settings.toggles.published")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={Boolean(editing.is_homepage ?? false)}
                onChange={(_, v) => updatePageMeta({ is_homepage: v })}
              />
            }
            label={t("manager.visualBuilder.pages.settings.toggles.homepage")}
          />
          <FormControlLabel
            control={
              <Switch
                checked={autosaveEnabled}
                onChange={(_, v) => {
                  setAutosaveEnabled(v);
                  updatePageMeta({ autosave: v });
                }}
              />
            }
            label={t("manager.visualBuilder.pages.settings.toggles.autosave")}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end" sx={{ pt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={duplicateSelectedPages}
              disabled={busy || !companyId || !selectedPageIds.length}
            >
              Duplicate selected
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => loadAll(companyId)}
              disabled={busy || !companyId}
            >
              {t("manager.visualBuilder.pages.settings.reload")}
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={savePageMeta}
              disabled={busy || !companyId}
            >
              {t("manager.visualBuilder.pages.settings.save")}
            </Button>
          </Stack>
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection
        id="builder-checkpoints"
        title="Design history & restore"
        description={`${checkpoints.length} version(s) available. ${protectedCheckpointCount} approved version(s) protected.`}
        actions={
          <Tooltip title="Save design versions before major edits. Approved versions are retained until you explicitly delete them; the latest 20 unprotected versions are retained automatically.">
            <IconButton size="small">
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
      >
        <Stack spacing={1}>
          <TextField
            label="Version name"
            size="small"
            value={checkpointName}
            onChange={(e) => setCheckpointName(e.target.value)}
            placeholder="Approved homepage design v1"
            fullWidth
          />
          <TextField
            label="Note (optional)"
            size="small"
            value={checkpointNote}
            onChange={(e) => setCheckpointNote(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Tooltip title="Saves the current website design, pages, forms, menus, redirects, SEO, and media references.">
              <span>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon fontSize="small" />}
                  onClick={() => onSaveCheckpoint("manual")}
                  disabled={busy || !companyId}
                >
                  Save version
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Approved designs are protected from automatic pruning and remain until explicitly deleted.">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<SaveIcon fontSize="small" />}
                  onClick={() => onSaveCheckpoint("approved")}
                  disabled={busy || !companyId}
                >
                  Save approved design
                </Button>
              </span>
            </Tooltip>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => loadCheckpoints(companyId)}
              disabled={busy || !companyId}
            >
              Refresh
            </Button>
          </Stack>

          <Alert severity="info" variant="outlined">
            <Typography variant="caption" component="div">
              <strong>Included:</strong> {CHECKPOINT_INCLUDED_ITEMS.join(", ")}.
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
              <strong>Not included:</strong> {CHECKPOINT_EXCLUDED_ITEMS.join(", ")}.
            </Typography>
          </Alert>

          <Divider />

          {checkpoints.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No website versions saved yet.
            </Typography>
          ) : (
            checkpoints.map((cp) => {
              const byLabel = cp?.created_by_name
                ? `${cp.created_by_name}${cp?.created_by_email ? ` (${cp.created_by_email})` : ""}`
                : cp?.created_by_email || "Unknown";
              return (
                <Paper key={cp.id} variant="outlined" sx={{ p: 1.25 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {cp.name || `Version #${cp.id}`}
                      </Typography>
                      <Chip size="small" variant="outlined" label={checkpointKindLabel(cp.checkpoint_kind)} />
                      {cp.protected ? <Chip size="small" color="success" label="Protected" /> : null}
                      {cp.theme_key ? <Chip size="small" variant="outlined" label={`Theme: ${cp.theme_key}`} /> : null}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {formatCheckpointTimestamp(cp.created_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Saved by: {byLabel}
                    </Typography>
                    {cp.note ? (
                      <Typography variant="body2">{cp.note}</Typography>
                    ) : null}
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {checkpointCounts(cp).map((count) => (
                        <Chip key={count.label} size="small" variant="outlined" label={`${count.label}: ${count.value}`} />
                      ))}
                    </Stack>
                    {Number(cp.missing_tenant_media_count || 0) > 0 ? (
                      <Alert severity="warning" sx={{ py: 0 }}>
                        {cp.missing_tenant_media_count} tenant media item(s) are missing. Draft restore is available, but Restore & Publish is blocked.
                      </Alert>
                    ) : null}
                    {Number(cp.external_media_warning_count || 0) > 0 ? (
                      <Typography variant="caption" color="warning.main">
                        {cp.external_media_warning_count} external media reference(s) cannot be guaranteed available.
                      </Typography>
                    ) : null}
                    <Stack direction="row" spacing={1} sx={{ pt: 0.5 }} flexWrap="wrap" useFlexGap>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() => previewCheckpoint(cp)}
                        disabled={busy}
                      >
                        Inspect version
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => requestRestoreCheckpoint(cp, false)}
                        disabled={busy}
                      >
                        Restore to draft
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => requestRestoreCheckpoint(cp, true)}
                        disabled={busy || checkpointPublishBlocked(cp)}
                        title={checkpointPublishBlocked(cp) ? "Restore & Publish is blocked until missing tenant media is replaced." : undefined}
                      >
                        Restore & Publish
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => requestDeleteCheckpoint(cp)}
                        disabled={busy}
                      >
                        Delete version
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })
          )}
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection
        id="nav-settings-card"
        title={t("manager.visualBuilder.nav.title", "Navigation & Menu")}
        description={t(
          "manager.visualBuilder.nav.description",
          "Control navigation details like site title and menu styling."
        )}
        actions={
          <Tooltip title={t("manager.visualBuilder.canvas.locate", "Locate on canvas")}>
            <IconButton size="small" onClick={scrollCanvasToTop}>
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        onChange={(open) => {
          setNavPanelOpen(open);
          if (open) scrollCanvasToTop();
        }}
      >
        <WebsiteNavSettingsCard
          companyId={companyId}
          companySlug={
            siteSettings?.company?.slug ||
            siteSettings?.company?.name ||
            previewSlug
          }
          value={
            navDraft || {
              nav_style: navStyleState,
              nav_overrides: navOverridesWithDefault,
            }
          }
          onChange={handleNavDraftChange}
          onSave={saveNavSettingsWithPreviewRefresh}
          saving={navSaving}
          message={navMsg}
          error={navErr}
          floatingSaveVisible={navPanelOpen}
          floatingSavePlacement="top-left"
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="branding-settings-card"
        title={t("manager.visualBuilder.branding.title", "Header & Footer")}
        description={t(
          "manager.visualBuilder.branding.description",
          usesConciseNextJsBrandingSurface
            ? `Edit the shared branding, footer links, and contact details used by ${nextJsBrandingThemeName}.`
            : "Upload logos, configure sticky header links, and add footer columns."
        )}
        expanded={brandingPanelOpen}
        onChange={(open) => {
          setBrandingPanelOpen(open);
          if (open) scrollCanvasToTop();
        }}
        actions={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title={t("manager.visualBuilder.canvas.locateHeader", "Locate header")}>
              <IconButton size="small" onClick={scrollCanvasToTop}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("manager.visualBuilder.canvas.locateFooter", "Locate footer")}>
              <IconButton size="small" onClick={scrollCanvasToBottom}>
                <CenterFocusStrongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      >
        <WebsiteBrandingCard
          companyId={companyId}
          companyName={companyProfile?.name || siteSettings?.company?.name || ""}
          siteTitle={footerSiteTitle}
          resolvedContact={resolvedFooterContact}
          companySlug={
            siteSettings?.company?.slug ||
            siteSettings?.company?.name ||
            previewSlug
          }
          headerValue={headerDraft}
          footerValue={footerDraft}
          themeOverridesValue={themeOverridesDraft}
          defaultThemeOverrides={defaultThemeOverrides}
          onChangeHeader={handleHeaderDraftChange}
          onChangeFooter={handleFooterDraftChange}
          onChangeThemeOverrides={handleThemeOverridesDraftChange}
          onSave={saveBrandingSettingsWithPreviewRefresh}
          saving={brandingSaving}
          message={brandingMsg}
          error={brandingErr}
          navOverridesValue={navOverridesWithDefault}
          onChangeNavOverrides={handleNavOverridesChange}
          pagesMeta={previewPagesMeta}
          onRequestPagesJump={handleJumpToPageSettings}
          onRequestContactJump={handleJumpToCompanyProfile}
          surface={usesConciseNextJsBrandingSurface ? nextJsBrandingThemeKey : "classic"}
          floatingSaveVisible={brandingPanelOpen}
          floatingSavePlacement="top-left"
          hasUnsavedChanges={brandingLocalDirty}
          hasUnpublishedChanges={hasDraftChanges}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="builder-sections-panel"
        title={t("manager.visualBuilder.sections.title")}
        description={t("manager.visualBuilder.sections.description")}
        actions={
          <Tooltip title={t("manager.visualBuilder.canvas.locate", "Locate on canvas")}>
            <IconButton
              size="small"
              onClick={() => {
                if (selectedBlock >= 0) {
                  scrollCanvasToSection(selectedBlock);
                }
              }}
            >
              <CenterFocusStrongIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        }
        onChange={(open) => {
          if (open && selectedBlock >= 0) {
            scrollCanvasToSection(selectedBlock);
          }
        }}
      >
        {isNextJsContentMode ? (
          <Stack spacing={1}>
            {canRestoreOriginalHomepage ? (
              <Alert
                severity="info"
                variant="outlined"
                action={
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => restoreOriginalHomepage()}
                  >
                    Restore original homepage
                  </Button>
                }
              >
                {originalHomepageBlueprint.label} can restore {originalHomepageBlueprint.description}
                {" "}as editable modules. Review the draft, then use Save and Publish normally.
              </Alert>
            ) : null}
            {semanticModules.map((module, index) => (
              <Paper
                key={module.id}
                variant="outlined"
                sx={{
                  p: 1,
                  borderRadius: 1,
                  borderColor: module.id === selectedModuleId ? "primary.main" : "divider",
                }}
              >
                <Stack spacing={1}>
                  <Button
                    size="small"
                    variant={module.id === selectedModuleId ? "contained" : "outlined"}
                    onClick={() => {
                      const legacySectionId = module?.settings?.legacySectionId;
                      const canvasIndex = renderableSections.findIndex(
                        ({ section }) =>
                          section.id === legacySectionId ||
                          section.id === module.id
                      );
                      if (canvasIndex >= 0) {
                        setSelectedBlock(canvasIndex);
                        requestAnimationFrame(() => scrollCanvasToSection(canvasIndex));
                      }
                      setSelectedModuleId(module.id);
                      setInspectorOpen(true);
                      setInspectorTab("content");
                    }}
                    sx={{ justifyContent: "flex-start", textAlign: "left", px: 1.25, py: 1 }}
                    fullWidth
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                      <Chip size="small" label={module.slot || "section"} />
                      <Box sx={{ minWidth: 0 }}>
                        {index + 1}. {semanticModuleDisplayLabel(module)}
                      </Box>
                      {module.enabled === false ? <Chip size="small" label="Hidden" /> : null}
                    </Stack>
                  </Button>
                  <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                    <Button
                      size="small"
                      onClick={() => moveSemanticModule(module.id, "up")}
                      disabled={!canMoveSemanticModule(module.id, "up")}
                    >
                      Move up
                    </Button>
                    <Button
                      size="small"
                      onClick={() => moveSemanticModule(module.id, "down")}
                      disabled={!canMoveSemanticModule(module.id, "down")}
                    >
                      Move down
                    </Button>
                    <Button size="small" onClick={() => duplicateSemanticModule(module.id)}>
                      Duplicate
                    </Button>
                    <Button
                      size="small"
                      color="warning"
                      onClick={() =>
                        updateSemanticModule(module.id, (currentModule) => ({
                          ...currentModule,
                          enabled: currentModule.enabled === false,
                        }))
                      }
                    >
                      {module.enabled === false ? "Show section" : "Hide section"}
                    </Button>
                    <Button size="small" color="error" onClick={() => deleteSemanticModule(module.id)}>
                      Remove section
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))}
            {!semanticModules.length ? (
              <Alert severity="info">
                This page does not have any semantic sections yet. Use Add Section to attach theme-compatible content modules.
              </Alert>
            ) : null}
          </Stack>
        ) : (
          <Stack spacing={1}>
            {(() => {
              const all = safeSections(editing);
              const visible = all.filter((s) => s.type !== "pageStyle");
              return visible.map((blk, i) => {
                const realIndex = all.findIndex((s) => s.id === blk.id);
                return (
                  <Tooltip
                    key={blk.id || i}
                    title={t("manager.visualBuilder.sections.tooltip")}
                    placement="right"
                  >
                    <Button
                      size="small"
                      variant={realIndex === selectedBlock ? "contained" : "outlined"}
                      onClick={() => {
                        setSelectedBlock(realIndex);
                        requestAnimationFrame(() => scrollCanvasToSection(realIndex));
                      }}
                      sx={{
                        justifyContent: "flex-start",
                        textAlign: "left",
                        px: 1.25,
                        py: 1,
                      }}
                      fullWidth
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ width: "100%" }}>
                        {SECTION_TYPE_THUMBNAILS[blk.type] ? (
                          <Box
                            component="img"
                            src={SECTION_TYPE_THUMBNAILS[blk.type]}
                            alt={`${blk.type} preview`}
                            sx={{
                              width: 64,
                              height: 44,
                              objectFit: "cover",
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                            }}
                          />
                        ) : null}
                        <Box sx={{ minWidth: 0 }}>
                          {i + 1}. {t(`manager.visualBuilder.sections.types.${blk.type}`, { defaultValue: blk.type })}
                        </Box>
                      </Stack>
                    </Button>
                  </Tooltip>
                );
              });
            })()}
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        <Paper id="builder-add-blocks" variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  {isNextJsContentMode ? "Add Section" : "Add new blocks"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {isNextJsContentMode
                    ? "Choose from the semantic sections supported by the current page and website style."
                    : "Click a preview to see the block, then add it to the page."}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="outlined"
                aria-expanded={addSectionPanelOpen}
                onClick={() => setAddSectionPanelOpen((current) => !current)}
              >
                {addSectionPanelOpen ? "Collapse" : "Expand"}
              </Button>
            </Stack>
            {addSectionPanelOpen ? (
              isNextJsContentMode ? (
                <Stack spacing={1.5}>
                  {Array.from(new Set(semanticModuleChoices.map((choice) => choice.group))).map((group) => (
                    <Box key={group}>
                      <Typography variant="overline" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
                        {group}
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                          gap: 1.25,
                          alignItems: "start",
                        }}
                      >
                        {semanticModuleChoices
                          .filter((choice) => choice.group === group)
                          .map((choice) => (
                            <Button
                              key={`${choice.slot}-${choice.type}`}
                              variant="outlined"
                              onClick={() => addSemanticModule(choice.type, choice.slot)}
                              sx={{ justifyContent: "flex-start", minHeight: 72, textAlign: "left", borderRadius: 0.75 }}
                            >
                              <Stack spacing={0.5} alignItems="flex-start">
                                <Typography variant="subtitle2">{choice.label}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {choice.slot}
                                </Typography>
                              </Stack>
                            </Button>
                          ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))",
                    gap: 1.5,
                    alignItems: "start",
                  }}
                >
                  {ADD_BLOCK_ORDER.map(([type, labelKey]) =>
                    renderAddBlockButton(type, labelKey)
                  )}
                </Box>
              )
            ) : null}
          </Stack>
        </Paper>
        {unsupportedModuleWarning ? <Alert severity="warning" sx={{ mt: 2 }}>{unsupportedModuleWarning}</Alert> : null}
      </CollapsibleSection>
      {SeoSettingsSection}
    </Stack>
  );

  // Defer canvas updates to keep typing smooth in the inspector
 // Defer canvas updates to keep typing smooth in preview mode
const editingPreview = useDeferredValue(editing);

// Use non-deferred state while editing (preview OFF) so changes feel instant
// Compute page style once for the canvas
// Prefer meta.pageStyle (Inspector edits) -> content.style (older) -> section-based style (if present)
const livePageStyle =
  editing?.content?.meta?.pageStyle ||
  editing?.content?.style ||
  readPageStyleProps(editing) ||
  {};

const pageVars  = styleToCssVars(livePageStyle);
const bgColor   = livePageStyle.backgroundColor || "#ffffff";
const bgImage   = livePageStyle.backgroundImage || "";
const bgOpacity =
  livePageStyle.backgroundImageOpacity == null
    ? 1
    : livePageStyle.backgroundImageOpacity;
const ovColor   = livePageStyle.overlayColor || "";
const ovOpacity = Number.isFinite(livePageStyle.overlayOpacity)
  ? livePageStyle.overlayOpacity
  : 0;


// --- Drag helpers for section spacing ---
const UNIT_PX = 8;                 // MUI spacing unit (1 = 8px)
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function startSectionDrag(e, i, kind) {
  e.preventDefault();
  e.stopPropagation();

  const start = { x: e.clientX, y: e.clientY };
  const s = safeSections(editing)[i] || {};
  const startVals = {
    spaceAbove: Number(s?.props?.spaceAbove ?? 0),  // theme units
    spaceBelow: Number(s?.props?.spaceBelow ?? 0),  // theme units
    gutterX:    Number(s?.props?.gutterX    ?? (s?.type === "hero" ? 24 : 16)), // px
  };

  // Show appropriate cursor while dragging
  document.body.style.cursor =
    kind === "gutterX" ? "ew-resize" : "ns-resize";

  const onMove = (ev) => {
    const dy = ev.clientY - start.y;
    const dx = ev.clientX - start.x;

    if (kind === "spaceAbove") {
      const nextUnits = clamp(startVals.spaceAbove + Math.round(dy / UNIT_PX), 0, 40);
      setBlockProp(i, "spaceAbove", nextUnits);
    } else if (kind === "spaceBelow") {
      const nextUnits = clamp(startVals.spaceBelow + Math.round(dy / UNIT_PX), 0, 40);
      setBlockProp(i, "spaceBelow", nextUnits);
    } else if (kind === "gutterX") {
      const nextPx = clamp(startVals.gutterX + Math.round(dx / 2), 0, 160);
      setBlockProp(i, "gutterX", nextPx);
    }
  };

const onUp = () => {
  document.removeEventListener("mousemove", onMove);
  document.removeEventListener("mouseup", onUp);
  document.body.style.cursor = "";
};

document.addEventListener("mousemove", onMove);
document.addEventListener("mouseup", onUp);
}

function scrollCanvasToTop() {
  const container = canvasScrollRef.current;
  if (!container) return;
  container.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollCanvasToBottom() {
  const container = canvasScrollRef.current;
  if (!container) return;
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
}

function scrollCanvasToSection(idx) {
  const container = canvasScrollRef.current;
  if (!container && idx !== 0) return;
  if (!container) return;
  const target = container.querySelector(
    `[data-canvas-section-idx="${idx}"]`
  );
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

const updateSemanticModules = useCallback(
  (updater, pagePatch = null) => {
    setEditing((cur) => {
      const normalized = withNormalizedModules(cur || {});
      const currentModules = safeModules(normalized);
      const nextModules = typeof updater === "function" ? updater(currentModules, normalized) : updater;
      const content = normalizePageContent(normalized.content || {});
      const nextPage = withNormalizedModules({
        ...normalized,
        ...(pagePatch && typeof pagePatch === "object" ? pagePatch : {}),
        content: {
          ...content,
          // Only canonical Next.js modules pass through this adapter. Classic
          // keeps its existing ImageField/section representation unchanged.
          modules: normalizeSemanticModuleMediaReferences(
            Array.isArray(nextModules) ? nextModules : currentModules
          ),
        },
      });
      queueNextJsDraftSync(nextPage);
      return nextPage;
    });
    setPageSettingsDirty(true);
  },
  [queueNextJsDraftSync, setEditing]
);

const restoreOriginalHomepage = useCallback(() => {
  if (!canRestoreOriginalHomepage || !originalHomepageBlueprint) return;
  const accepted = window.confirm(
    `Replace this homepage's current sections with the original ${originalHomepageBlueprint.label} composition? The replacement stays in draft until you click Save.`
  );
  if (!accepted) return;

  const modules = originalHomepageBlueprint.createModules(companyId);
  updateSemanticModules(() => modules, { title: originalHomepageBlueprint.pageTitle, menu_title: "Home" });
  setSelectedModuleId(modules[0]?.id || "");
  setSelectedBlock(-1);
  setInspectorOpen(true);
  setInspectorTab("content");
  setUnsupportedModuleWarning("");
  setMsg(`Original ${originalHomepageBlueprint.label} homepage restored in draft. Review it, then click Save and Publish.`);
}, [canRestoreOriginalHomepage, originalHomepageBlueprint, updateSemanticModules]);

const addSemanticModule = useCallback(
  (moduleType, slot) => {
    if (!isNextJsContentMode) return;
    const manifest = getPageManifest(currentStyleKey, editingPageKind);
    const nextSlot = slot || resolveFallbackSlot(currentStyleKey, editingPageKind, moduleType, slot) || null;
    if (!manifest || !nextSlot) {
      setUnsupportedModuleWarning("This section is not supported for the selected website style.");
      return;
    }
    const created =
      moduleType === "gallery" &&
      String(currentStyleKey || "").trim().toLowerCase() === "iron-ember" &&
      editingPageKind === "projects"
        ? createIronEmberProjectGalleryModule(editing)
        : createSemanticModule(moduleType, editing, nextSlot);
    updateSemanticModules((currentModules) => {
      if (moduleType !== "selectedCuts" || String(currentStyleKey || "").trim().toLowerCase() !== "iron-ember") {
        return [...currentModules, created];
      }
      const ordered = currentModules
        .map((module, index) => ({ ...module, order: Number.isFinite(Number(module.order)) ? Number(module.order) : index }))
        .sort((left, right) => left.order - right.order);
      const nextSectionIndex = ordered.findIndex((module) => ["gallery", "portfolio", "process", "reviews", "pricing", "faq"].includes(module.type));
      ordered.splice(nextSectionIndex >= 0 ? nextSectionIndex : ordered.length, 0, created);
      return ordered.map((module, order) => ({ ...module, order }));
    });
    setSelectedModuleId(created.id);
    setInspectorOpen(true);
    setInspectorTab("content");
    setUnsupportedModuleWarning("");
  },
  [currentStyleKey, editing, editingPageKind, isNextJsContentMode, updateSemanticModules]
);

const deleteSemanticModule = useCallback(
  (moduleId) => {
    updateSemanticModules((currentModules) => currentModules.filter((module) => module.id !== moduleId));
    if (selectedModuleId === moduleId) setSelectedModuleId("");
  },
  [selectedModuleId, updateSemanticModules]
);

const duplicateSemanticModule = useCallback(
  (moduleId) => {
    updateSemanticModules((currentModules) => {
      const source = currentModules.find((module) => module.id === moduleId);
      if (!source) return currentModules;
      const copy = {
        ...JSON.parse(JSON.stringify(source)),
        id: createSemanticModule(source.type, editing, source.slot).id,
        enabled: source.enabled !== false,
      };
      const nextModules = [...currentModules];
      const index = nextModules.findIndex((module) => module.id === moduleId);
      nextModules.splice(index + 1, 0, copy);
      setSelectedModuleId(copy.id);
      return nextModules;
    });
  },
  [editing, updateSemanticModules]
);

const moveSemanticModule = useCallback(
  (moduleId, direction) => {
    updateSemanticModules((currentModules) => {
      const sourceModule = currentModules.find((module) => module.id === moduleId);
      if (String(sourceModule?.type || "") === "selectedCuts") {
        const ordered = currentModules
          .map((module, index) => ({ ...module, order: Number.isFinite(Number(module.order)) ? Number(module.order) : index }))
          .sort((left, right) => left.order - right.order);
        const fromIndex = ordered.findIndex((module) => module.id === moduleId);
        const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
        if (fromIndex < 0 || toIndex < 0 || toIndex >= ordered.length) return currentModules;
        const [moved] = ordered.splice(fromIndex, 1);
        ordered.splice(toIndex, 0, moved);
        return ordered.map((module, order) => ({ ...module, order }));
      }
      const movePlan = getSemanticModuleMovePlan(
        currentModules,
        moduleId,
        direction
      );
      if (!movePlan) return currentModules;

      if (movePlan.kind === "swap") {
        const nextModules = [...currentModules];
        const currentModule = nextModules[movePlan.fromIndex];
        nextModules[movePlan.fromIndex] = nextModules[movePlan.toIndex];
        nextModules[movePlan.toIndex] = currentModule;
        return nextModules.map((item, order) => ({ ...item, order }));
      }

      if (movePlan.kind === "rehome") {
        const nextModules = [...currentModules];
        const [movedModule] = nextModules.splice(movePlan.fromIndex, 1);
        if (!movedModule) return currentModules;
        const insertIndex =
          movePlan.fromIndex < movePlan.insertIndex
            ? movePlan.insertIndex - 1
            : movePlan.insertIndex;
        nextModules.splice(insertIndex, 0, {
          ...movedModule,
          slot: movePlan.nextSlot,
        });
        return nextModules.map((item, order) => ({ ...item, order }));
      }

      return currentModules;
    });
  },
  [updateSemanticModules]
);

const updateSemanticModule = useCallback(
  (moduleId, updater) => {
    updateSemanticModules((currentModules) =>
      currentModules.map((module) => {
        if (module.id !== moduleId) return module;
        const nextModule = typeof updater === "function" ? updater(module) : updater;
        return nextModule;
      })
    );
  },
  [updateSemanticModules]
);

function getSemanticModuleMovePlan(modules, moduleId, direction) {
  const currentModules = Array.isArray(modules) ? modules : [];
  const index = currentModules.findIndex((module) => module.id === moduleId);
  if (index < 0) return null;

  const currentModule = currentModules[index];
  const currentSlot = String(currentModule?.slot || "");
  const targetIndex = direction === "up" ? index - 1 : index + 1;

  const pageManifest = getPageManifest(currentStyleKey, editingPageKind);
  const slotRules = pageManifest?.slotRules || {};
  const slotOrder = Object.keys(slotRules);
  const slotOrderIndex = (slot) => {
    const normalizedSlot = String(slot || "");
    const explicitIndex = slotOrder.indexOf(normalizedSlot);
    return explicitIndex >= 0 ? explicitIndex : Number.MAX_SAFE_INTEGER;
  };
  const findRehomeInsertIndex = (modulesList, targetSlot, movingDirection) => {
    const desiredSlotOrder = slotOrderIndex(targetSlot);
    const targetIndices = modulesList.reduce((acc, module, moduleIndex) => {
      if (String(module?.slot || "") === String(targetSlot || "")) {
        acc.push(moduleIndex);
      }
      return acc;
    }, []);

    if (targetIndices.length) {
      return movingDirection === "up"
        ? targetIndices[targetIndices.length - 1] + 1
        : targetIndices[0];
    }

    const firstLaterIndex = modulesList.findIndex(
      (module) => slotOrderIndex(module?.slot) > desiredSlotOrder
    );
    if (firstLaterIndex >= 0) return firstLaterIndex;
    return modulesList.length;
  };

  if (targetIndex >= 0 && targetIndex < currentModules.length) {
    const targetModule = currentModules[targetIndex];
    if (String(targetModule?.slot || "") === currentSlot) {
      return {
        kind: "swap",
        fromIndex: index,
        toIndex: targetIndex,
      };
    }
  }

  const currentSlotIndex = slotOrder.indexOf(currentSlot);
  const currentType = String(currentModule?.type || "");

  if (
    editingPageKind === "services" &&
    currentSlotIndex >= 0 &&
    currentType &&
    currentType !== "services" &&
    currentSlot !== "services.list"
  ) {
    if (currentSlot === "services.intro" && direction === "down") {
      return {
        kind: "rehome",
        fromIndex: index,
        insertIndex: findRehomeInsertIndex(
          currentModules,
          "services.afterList",
          direction
        ),
        nextSlot: "services.afterList",
      };
    }

    if (currentSlot === "services.afterList" && direction === "up") {
      return {
        kind: "rehome",
        fromIndex: index,
        insertIndex: findRehomeInsertIndex(
          currentModules,
          "services.intro",
          direction
        ),
        nextSlot: "services.intro",
      };
    }
  }

  if (currentSlotIndex < 0) return null;

  for (
    let candidateIndex = currentSlotIndex + (direction === "up" ? -1 : 1);
    candidateIndex >= 0 && candidateIndex < slotOrder.length;
    candidateIndex += direction === "up" ? -1 : 1
  ) {
    const candidateSlot = slotOrder[candidateIndex];
    const candidateRule = slotRules[candidateSlot];
    if (!candidateRule) continue;
    if (
      !Array.isArray(candidateRule.allowedModuleTypes) ||
      !candidateRule.allowedModuleTypes.includes(currentType)
    ) {
      continue;
    }
    return {
      kind: "rehome",
      fromIndex: index,
      insertIndex: findRehomeInsertIndex(
        currentModules,
        candidateSlot,
        direction
      ),
      nextSlot: candidateSlot,
    };
  }

  return null;
}

function canMoveSemanticModule(moduleId, direction) {
  const currentModules = safeModules(editing || {});
  const selectedCutsModule = currentModules.find((module) => module.id === moduleId && module.type === "selectedCuts");
  if (selectedCutsModule) {
    const ordered = currentModules
      .map((module, index) => ({ module, order: Number.isFinite(Number(module.order)) ? Number(module.order) : index }))
      .sort((left, right) => left.order - right.order);
    const index = ordered.findIndex(({ module }) => module.id === moduleId);
    return direction === "up" ? index > 0 : index >= 0 && index < ordered.length - 1;
  }
  return Boolean(
    getSemanticModuleMovePlan(currentModules, moduleId, direction)
  );
}

const openBuilderPage = useCallback(
  async (pageLike) => {
    if (!pageLike) return;
    try {
      let nextPage = pageLike;
      if (
        companyId &&
        pageLike?.id &&
        (!pageLike?.content || !Array.isArray(pageLike?.content?.sections))
      ) {
        const full = await wb.getPage(companyId, pageLike.id);
        nextPage = full?.data || full || pageLike;
      }
      const lifted = ensureSectionIds(withLiftedLayout(nextPage));
      setSelectedId(lifted.id);
      setEditing(lifted);
      setSelectedBlock(-1);
      setPagesListOpen(false);
      setPageSettingsOpen(true);
      requestAnimationFrame(() => scrollCanvasToTop());
    } catch (e) {
      console.error(e);
      setErr(t("manager.visualBuilder.errors.loadPage", "Failed to open page."));
    }
  },
  [companyId, t]
);

const canvasPageTarget =
  pages.find((page) => String(page?.id) === String(editing?.id || selectedId)) ||
  editing ||
  null;

const closeCanvasPageMenu = () => setCanvasPageMenuAnchor(null);

const PageWorkspaceBar = isNextJsContentMode ? (
  <Paper
    variant="outlined"
    sx={{ mb: 1.25, p: 1.25, borderRadius: 1.5, bgcolor: "background.paper" }}
  >
    <Stack spacing={0.75}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <TextField
          select
          size="small"
          label="Current page"
          value={canvasPageTarget?.id != null ? String(canvasPageTarget.id) : ""}
          onChange={(event) => {
            const next = pages.find((page) => String(page?.id) === String(event.target.value));
            if (next) openBuilderPage(next);
          }}
          sx={{ minWidth: { xs: "100%", md: 250 } }}
        >
          {pages.map((page) => (
            <MenuItem key={page.id} value={String(page.id)}>
              {page.title || page.menu_title || page.slug || "Untitled page"} · /{page.slug || ""}
            </MenuItem>
          ))}
        </TextField>
        {canvasPageTarget ? (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={canvasPageTarget.published ?? true ? "success" : "default"}
              variant="outlined"
              label={canvasPageTarget.published ?? true ? "Published page" : "Draft page"}
            />
            {canvasPageTarget.show_in_menu ?? true ? null : (
              <Chip size="small" variant="outlined" label="Hidden from menu" />
            )}
          </Stack>
        ) : null}
        <Box sx={{ flex: 1 }} />
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon fontSize="small" />}
          onClick={openNewArticleDialog}
          disabled={busy || !companyId}
        >
          New article
        </Button>
        <Button size="small" variant="outlined" onClick={handleJumpToPageSettings}>
          Page settings
        </Button>
        <Button size="small" variant="outlined" onClick={handleJumpToSeoSettings}>
          SEO
        </Button>
        <Button
          size="small"
          variant={semanticFloatingInspectorOpen ? "contained" : "outlined"}
          startIcon={<OpenWithIcon fontSize="small" />}
          onClick={() => {
            setSemanticFloatingInspectorOpen((current) => !current);
            setInspectorOpen(true);
          }}
          disabled={!selectedModule}
        >
          Floating editor
        </Button>
        <Button
          size="small"
          variant="outlined"
          endIcon={<MoreVertIcon fontSize="small" />}
          onClick={(event) => setCanvasPageMenuAnchor(event.currentTarget)}
          disabled={!canvasPageTarget?.id}
        >
          Page actions
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary">
        Switch pages here, edit the selected page in the Canvas, and manage its publishing without searching through the advanced page list.
        {nextJsPreviewStale ? " Saved edits are ready; refresh the preview when you want to review them." : ""}
      </Typography>
    </Stack>
    <Menu
      anchorEl={canvasPageMenuAnchor}
      open={Boolean(canvasPageMenuAnchor)}
      onClose={closeCanvasPageMenu}
    >
      <MenuItem
        onClick={() => {
          if (canvasPageTarget?.id) {
            const current = Boolean(canvasPageTarget.published ?? true);
            applyPageActionPatch(canvasPageTarget.id, { published: !current });
          }
          closeCanvasPageMenu();
        }}
      >
        {canvasPageTarget?.published ?? true ? "Unpublish page" : "Publish page"}
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (canvasPageTarget?.id) {
            const current = Boolean(canvasPageTarget.show_in_menu ?? true);
            applyPageActionPatch(canvasPageTarget.id, { show_in_menu: !current });
          }
          closeCanvasPageMenu();
        }}
      >
        {canvasPageTarget?.show_in_menu ?? true ? "Hide from menu" : "Show in menu"}
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (canvasPageTarget?.id) {
            if (canvasPageTarget.is_homepage) {
              applyPageActionPatch(canvasPageTarget.id, { is_homepage: false });
            } else {
              applyPageActionPatch(canvasPageTarget.id, {}, { setHomepage: true });
            }
          }
          closeCanvasPageMenu();
        }}
      >
        {canvasPageTarget?.is_homepage ? "Unset homepage" : "Set as homepage"}
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (canvasPageTarget?.id) {
            const current = Boolean(canvasPageTarget.autosave ?? true);
            applyPageActionPatch(canvasPageTarget.id, { autosave: !current });
          }
          closeCanvasPageMenu();
        }}
      >
        {canvasPageTarget?.autosave ?? true ? "Disable autosave" : "Enable autosave"}
      </MenuItem>
      <MenuItem
        onClick={() => {
          if (canvasPageTarget?.id) duplicatePageById(canvasPageTarget.id);
          closeCanvasPageMenu();
        }}
      >
        Duplicate page
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={() => {
          setPagesListOpen(true);
          requestAnimationFrame(() => jumpToById("builder-pages-list"));
          closeCanvasPageMenu();
        }}
      >
        Open all pages & menu
      </MenuItem>
    </Menu>
  </Paper>
) : null;

const CanvasColumn = (
  <SectionCard
    title={t("manager.visualBuilder.canvas.title")}
    description={
      isNextJsContentMode
        ? "Draft Next.js preview for the selected page and website style."
        : fullPreview
        ? t("manager.visualBuilder.canvas.description.full")
        : t("manager.visualBuilder.canvas.description.block")
    }
    actions={
      <Stack direction="row" spacing={1} alignItems="center">
        {isNextJsContentMode ? (
          <>
            <Chip
              size="small"
              color={brandingLocalDirty ? "warning" : hasDraftChanges ? "info" : "success"}
              variant={brandingLocalDirty || hasDraftChanges ? "filled" : "outlined"}
              label={brandingLocalDirty ? "Unsaved local changes" : hasDraftChanges ? "Draft preview — not published" : "Matches published site"}
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={stylePreviewViewport}
              onChange={(_, value) => value && setStylePreviewViewport(value)}
            >
              <ToggleButton value="desktop">Desktop</ToggleButton>
              <ToggleButton value="tablet">Tablet</ToggleButton>
              <ToggleButton value="mobile">Mobile</ToggleButton>
            </ToggleButtonGroup>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={() => refreshNextJsPreview()}
              disabled={!currentStyleKey}
            >
              Refresh preview
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<OpenInNewIcon fontSize="small" />}
              component="a"
              href={nextJsPreviewUrl || undefined}
              target="_blank"
              rel="noreferrer"
              disabled={!nextJsPreviewUrl}
            >
              Open in new tab
            </Button>
          </>
        ) : (
          <>
            <FormControlLabel
              sx={{ m: 0 }}
              label={t("manager.visualBuilder.canvas.toggles.fullPage")}
              control={
                <Switch
                  size="small"
                  checked={fullPreview}
                  onChange={(_, v) => setFullPreview(v)}
                />
              }
            />
            <ToggleButtonGroup
              size="small"
              exclusive
              value={canvasHeightMode}
              onChange={(_, v) => v && setCanvasHeightMode(v)}
            >
              <ToggleButton value="short" title={t("manager.visualBuilder.canvas.toggles.titles.short")}>
                {t("manager.visualBuilder.canvas.toggles.height.short")}
              </ToggleButton>
              <ToggleButton value="medium" title={t("manager.visualBuilder.canvas.toggles.titles.medium")}>
                {t("manager.visualBuilder.canvas.toggles.height.medium")}
              </ToggleButton>
              <ToggleButton value="tall" title={t("manager.visualBuilder.canvas.toggles.titles.tall")}>
                {t("manager.visualBuilder.canvas.toggles.height.tall")}
              </ToggleButton>
              <ToggleButton value="auto" title={t("manager.visualBuilder.canvas.toggles.titles.auto")}>
                {t("manager.visualBuilder.canvas.toggles.height.auto")}
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        )}
      </Stack>
    }
  >
    <Box id="visual-builder-canvas">
      {PageWorkspaceBar}
      {isNextJsContentMode ? (
        nextJsPreviewUrl ? (
          <Box
            sx={{
              width:
                stylePreviewViewport === "desktop"
                  ? "100%"
                  : stylePreviewViewport === "tablet"
                  ? 834
                  : 390,
              maxWidth: "100%",
              mx: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
              overflow: "hidden",
              bgcolor: "#fff",
              transition: "width 0.2s ease",
            }}
          >
            <Box
              component="iframe"
              ref={nextJsContentPreviewIframeRef}
              title="Next.js website content preview"
              src={nextJsPreviewUrl}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              sx={{
                width: "100%",
                height:
                  stylePreviewViewport === "desktop"
                    ? 760
                    : stylePreviewViewport === "tablet"
                    ? 780
                    : 860,
                border: 0,
                display: "block",
              }}
            />
          </Box>
        ) : (
          <Alert severity="info" variant="outlined">
            Preview the current draft website style to edit semantic sections on the live Next.js canvas.
          </Alert>
        )
      ) : (
        <>
          <NavStyleHydrator
            website={previewSite}
            scopeSelector="#visual-builder-canvas .site-nav"
          />
          <SiteFrame
            slug={previewSite.slug}
            activeKey={editing?.slug}
            initialSite={previewSite}
            disableFetch
            wrapChildrenInContainer={fullPreview}
            onTogglePageMenu={(pageId) => {
              applyPageActionPatch(pageId, { show_in_menu: false });
            }}
            onRemoveFooterItem={handleFooterItemRemove}
            onRemoveHeaderItem={handleHeaderItemRemove}
            onPreviewOpenPage={(item) => {
              if (!item?.id) return;
              const match = pages.find((p) => p.id === item.id);
              openBuilderPage(match || item);
            }}
          >
            <Box
              sx={{
                width:
                  stylePreviewViewport === "desktop"
                    ? "100%"
                    : stylePreviewViewport === "tablet"
                    ? 834
                    : 390,
                maxWidth: "100%",
                mx: "auto",
                transition: "width 0.2s ease",
              }}
            >
              <Box
                sx={{
                  maxHeight:
                    fullPreview || canvasMaxHeight === "none" ? "none" : canvasMaxHeight,
                  overflow:
                    fullPreview || canvasMaxHeight === "none" ? "visible" : "auto",
                  transition: "max-height 0.2s ease",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                }}
                ref={canvasScrollRef}
              >
                <Box
                  className="page-scope"
                  style={pageVars}
                  sx={{
                    position: "relative",
                    backgroundColor: bgColor,
                    backgroundImage: bgImage
                      ? `linear-gradient(rgba(0,0,0,${1 - bgOpacity}), rgba(0,0,0,${1 - bgOpacity})), url(${bgImage})`
                      : "none",
                    backgroundRepeat: livePageStyle.backgroundRepeat || "no-repeat",
                    backgroundSize: livePageStyle.backgroundSize || "cover",
                    backgroundPosition: livePageStyle.backgroundPosition || "center",
                    backgroundAttachment: livePageStyle.backgroundAttachment || "fixed",
                    "&::before": bgImage
                      ? {
                          content: '""',
                          position: "absolute",
                          inset: 0,
                          pointerEvents: "none",
                          backgroundColor: ovColor || "transparent",
                          opacity: ovOpacity,
                        }
                      : undefined,
                    color: "var(--page-body-color)",
                    "& .page-scope, &": {
                      "--heading-color": "var(--page-heading-color)",
                      "--body-color": "var(--page-body-color)",
                      "--link-color": "var(--page-link-color)",
                      fontFamily: "var(--page-body-font)",
                    },
                    "& .MuiPaper-root": {
                      backgroundColor: "var(--page-card-bg)",
                      borderRadius: "var(--page-card-radius)",
                    },
                    "& .MuiButton-root": {
                      borderRadius: "var(--page-btn-radius)",
                      textTransform: "none",
                    },
                    "& .MuiButton-contained": {
                      backgroundColor: "var(--page-btn-bg)",
                      color: "var(--page-btn-color)",
                      "&:hover": { filter: "brightness(0.95)" },
                    },
                    "& .MuiButton-outlined": {
                      borderColor: "var(--page-btn-bg)",
                      color: "var(--page-btn-bg)",
                      backgroundColor: "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(0,0,0,0.03)",
                        borderColor: "var(--page-btn-bg)",
                        color: "var(--page-btn-bg)",
                      },
                    },
                    "& .MuiButton-text": { color: "var(--page-btn-bg)" },
                  }}
                >
                  {fullPreview ? (
                    <RenderSections
                      sections={safeSections(editing)}
                      page={editingPreview}
                      layout={editingPreview.layout || "boxed"}
                      sectionSpacing={editingPreview?.content?.meta?.sectionSpacing ?? 6}
                      defaultGutterX={editingPreview?.content?.meta?.defaultGutterX}
                      editorPreview={false}
                    />
                  ) : (
                    <Box
                      sx={{
                        position: "relative",
                        px: { xs: 0, md: 1 },
                        pt: 2,
                        pb: 0,
                        backgroundColor: bgColor,
                      }}
                    >
                      <Box>
                        {renderableSections.map(({ section: blk, idx }) => {
                          const key = blk.id || `${blk.type}-${idx}`;
                          const isSelected = selectedBlock === idx;
                          const isFooterBlock = blk?.type === "footer";
                          const nextIsFooter =
                            renderableSections[idx + 1]?.section?.type === "footer";
                          const mb = nextIsFooter ? 0 : 2;
                          return (
                            <React.Fragment key={key}>
                              <Box
                                ref={fi.anchorRef(idx)}
                                sx={{
                                  position: "relative",
                                  borderRadius: 1,
                                  border: "1px dashed",
                                  borderColor: isSelected ? "primary.main" : "divider",
                                  backgroundColor: "transparent",
                                  overflow: "hidden",
                                  transition: "border-color 0.2s, box-shadow 0.2s",
                                  boxShadow: isSelected
                                    ? "0 0 0 2px rgba(25,118,210,0.18)"
                                    : "none",
                                  mt: isFooterBlock ? 0 : undefined,
                                  mb,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                                data-canvas-section-idx={idx}
                                onClick={() => {
                                  setSelectedBlock(idx);
                                }}
                              >
                        <Box
                          title={t(
                            "manager.visualBuilder.canvas.drag.spaceAbove",
                            "Adjust space above"
                          )}
                          onMouseDown={(e) => startSectionDrag(e, idx, "spaceAbove")}
                          sx={{
                            position: "absolute",
                            top: -8,
                            left: 12,
                            right: 12,
                            height: 8,
                            borderTop: "2px dashed",
                            borderColor: "primary.light",
                            cursor: "ns-resize",
                            opacity: 0.4,
                            "&:hover": { opacity: 1 },
                            pointerEvents: "auto",
                          }}
                        />
                        <Box
                          title={t(
                            "manager.visualBuilder.canvas.drag.gutter",
                            "Adjust horizontal padding"
                          )}
                          onMouseDown={(e) => startSectionDrag(e, idx, "gutterX")}
                          sx={{
                            position: "absolute",
                            top: "25%",
                            bottom: "25%",
                            right: 4,
                            width: 8,
                            borderRight: "2px dashed",
                            borderColor: "primary.light",
                            cursor: "ew-resize",
                            opacity: 0.3,
                            "&:hover": { opacity: 1 },
                            pointerEvents: "auto",
                          }}
                        />

                        <Box
                          sx={{
                            pointerEvents: "none",
                            "& *": { pointerEvents: "none" },
                            flex: 1,
                          }}
                        >
                          <RenderSections
                            sections={[blk]}
                            layout={editingPreview.layout || "boxed"}
                            sectionSpacing={
                              editingPreview?.content?.meta?.sectionSpacing ??
                              6
                            }
                            defaultGutterX={
                              editingPreview?.content?.meta?.defaultGutterX
                            }
                            editorPreview={blk?.type === "popupCta"}
                          />
                        </Box>
                        <Box
                          title={t(
                            "manager.visualBuilder.canvas.drag.spaceBelow",
                            "Adjust space below"
                          )}
                          onMouseDown={(e) => startSectionDrag(e, idx, "spaceBelow")}
                          sx={{
                            position: "absolute",
                            bottom: -8,
                            left: 12,
                            right: 12,
                            height: 8,
                            borderBottom: "2px dashed",
                            borderColor: "primary.light",
                            cursor: "ns-resize",
                            opacity: 0.4,
                            "&:hover": { opacity: 1 },
                            pointerEvents: "auto",
                          }}
                        />

                        <Box
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 6,
                            display: "flex",
                            gap: 0.5,
                            zIndex: 2,
                          }}
                        >
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton
                              size="small"
                              onClick={() => moveBlock(idx, "up")}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.moveUp")}
                            >
                              <ArrowUpwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => moveBlock(idx, "down")}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.moveDown")}
                            >
                              <ArrowDownwardIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => duplicateBlock(idx)}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.duplicate")}
                            >
                              <ContentCopyIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => deleteBlock(idx)}
                              sx={{ color: "white" }}
                              title={t("manager.visualBuilder.canvas.controls.delete")}
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Stack>
                        </Box>
                      </Box>

                      <InlineStickyInspector.Slot
                        index={idx}
                        selectedIndex={selectedBlock}
                        block={blk}
                        fi={fi}
                        mode={mode}
                        companyId={companyId}
                        onChangeProps={(np) => setBlockPropsAll(idx, np)}
                        onChangeProp={(k, v) => setBlockProp(idx, k, v)}
                        renderAdvancedEditor={({ block, onChangeProps, onChangeProp }) => (
                          <SectionInspector
                            block={block}
                            onChangeProp={onChangeProp}
                            onChangeProps={onChangeProps}
                            companyId={companyId}
                          />
                        )}
                      />
                    </React.Fragment>
                  );
                })}
              </Box>
            </Box>
          )}

          {!safeSections(editing).length && !suppressEmptyState && (
            <SectionCard
              title={t("manager.visualBuilder.canvas.empty.title")}
              description={t("manager.visualBuilder.canvas.empty.description")}
            >
              <Typography variant="body1" color="text.secondary">
                {t("manager.visualBuilder.canvas.empty.body")}
              </Typography>
              <Button
                sx={{ mt: 1.5 }}
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => addBlock("hero")}
              >
                {t("manager.visualBuilder.sections.add.hero")}
              </Button>
            </SectionCard>
          )}
          </Box>
        </Box>
        </Box>
      </SiteFrame>
        </>
      )}
    </Box>
  </SectionCard>
);



function InspectorColumn({ floating = false } = {}) {
  const clamp01 = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return 0;
    return Math.max(0, Math.min(1, num));
  };
  const toHexByte = (n) =>
    Math.max(0, Math.min(255, Math.round(Number(n) || 0)))
      .toString(16)
      .padStart(2, "0");
  const normalizeHexColor = (hex) => {
    if (typeof hex !== "string") return "";
    let s = hex.trim();
    if (!s) return "";
    if (!s.startsWith("#")) return s;
    let h = s.slice(1);
    if (h.length === 3) {
      h = h
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 4) {
      h = h
        .slice(0, 3)
        .split("")
        .map((c) => c + c)
        .join("");
    } else if (h.length === 8) {
      h = h.slice(0, 6);
    }
    if (h.length < 6) h = h.padEnd(6, "0");
    return `#${h.toLowerCase()}`;
  };
  const hexToRgba = (hex, opacity = 1) => {
    const norm = normalizeHexColor(hex);
    if (!norm || !norm.startsWith("#")) return norm || "";
    const h = norm.slice(1);
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${clamp01(opacity)})`;
  };
  const parseCssColor = (css, fallbackOpacity = 1) => {
    const base = { hex: "#ffffff", opacity: clamp01(fallbackOpacity) };
    if (!css || typeof css !== "string") return base;
    const str = css.trim();
    if (!str) return base;
    if (str.toLowerCase() === "transparent") {
      return { hex: "#000000", opacity: 0 };
    }
    const rgba = /^rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\)$/i.exec(str);
    if (rgba) {
      const r = Number(rgba[1]);
      const g = Number(rgba[2]);
      const b = Number(rgba[3]);
      const a = rgba[4] != null ? parseFloat(rgba[4]) : base.opacity;
      return {
        hex: `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`,
        opacity: clamp01(a),
      };
    }
    if (str.startsWith("#")) {
      const raw = str.slice(1);
      let alpha = base.opacity;
      if (raw.length === 4) {
        alpha = parseInt(raw[3] + raw[3], 16) / 255;
      } else if (raw.length === 8) {
        alpha = parseInt(raw.slice(6, 8), 16) / 255;
      }
      return { hex: normalizeHexColor(str), opacity: clamp01(alpha) };
    }
    return base;
  };
  const shadowPresets = [
    { key: "none", label: "None", value: "" },
    { key: "soft", label: "Soft", value: "0 8px 24px rgba(0,0,0,0.12)" },
    { key: "medium", label: "Medium", value: "0 12px 32px rgba(0,0,0,0.18)" },
    { key: "strong", label: "Strong", value: "0 18px 48px rgba(0,0,0,0.24)" },
    { key: "glass", label: "Glass", value: "0 12px 32px rgba(15,23,42,0.28)" },
  ];
  const matchShadowPreset = (val) =>
    shadowPresets.find((preset) => (val || "").trim() === preset.value) || null;
  const isShadowValid = (val) =>
    !val ||
    /-?\d+px\s+-?\d+px/.test(val) ||
    /rgba?\(/i.test(val) ||
    /#/.test(val);
  const parseBoxShadow = (val) => {
    const fallback = { x: 0, y: 12, blur: 32, spread: 0, color: "#000000", opacity: 0.18 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px(?:\s+(-?\d+(?:\.\d+)?)px)?\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[5], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      spread: Number(match[4] || 0),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };
  const parseTextShadow = (val) => {
    const fallback = { x: 0, y: 6, blur: 18, color: "#000000", opacity: 0.25 };
    if (!val || typeof val !== "string") return fallback;
    const match =
      /(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px\s+(.+)/.exec(
        val.trim()
      );
    if (!match) return fallback;
    const parsedColor = parseCssColor(match[4], fallback.opacity);
    return {
      x: Number(match[1]),
      y: Number(match[2]),
      blur: Number(match[3]),
      color: parsedColor.hex || fallback.color,
      opacity: parsedColor.opacity,
    };
  };
  const buildBoxShadow = ({ x, y, blur, spread, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const buildTextShadow = ({ x, y, blur, color, opacity }) =>
    `${x}px ${y}px ${blur}px ${hexToRgba(color, opacity)}`;
  const colorField = ({ label, value, onChange: onColorChange, helperText }) => {
    const normalized = normalizeHexColor(value) || "#000000";
    return (
      <TextField
        size="small"
        label={label}
        value={value || ""}
        onChange={(e) => onColorChange(e.target.value)}
        helperText={helperText}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ButtonBase
                component="label"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: normalized,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Box
                  component="input"
                  type="color"
                  value={normalized}
                  onChange={(e) => onColorChange(e.target.value)}
                  sx={{ opacity: 0, position: "absolute", width: "100%", height: "100%" }}
                />
              </ButtonBase>
            </InputAdornment>
          ),
        }}
      />
    );
  };

  const selectedBlockObj = safeSections(editing)[selectedBlock] || {};
  const selectedSemanticModule = selectedModule;
  useEffect(() => {
    if (!selectedModuleFieldPath) return;
    const timer = window.setTimeout(() => {
        const selector = candidateSemanticFieldPaths(selectedModuleFieldPath)
          .map(
            (fieldPath) =>
            `[data-module-field-path="${fieldPath}"], [data-module-field-path="${fieldPath}"] input, [data-module-field-path="${fieldPath}"] textarea, [data-module-field-path="${fieldPath}"] button`
          )
        .join(", ");
      const field = selector ? document.querySelector(selector) : null;
      if (field && typeof field.focus === "function") {
        field.closest("[data-module-field-path]")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        field.focus();
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [selectedModuleFieldPath, selectedSemanticModule?.id]);
  const selectedProps = selectedBlockObj?.props || {};
  const themeResettableTypes = useMemo(
    () =>
      new Set([
        "videoStorySplit",
        "stats",
        "logoCarousel",
        "serviceGrid",
        "featurePillars",
        "featureStories",
        "testimonialTiles",
      ]),
    []
  );
  const canResetSelectedBlockTheme =
    selectedBlock >= 0 && themeResettableTypes.has(selectedBlockObj?.type);
  const resetSelectedBlockToSiteTheme = useCallback(() => {
    if (selectedBlock < 0) return;
    const clearCardFields = (card = {}, keys = []) => {
      const next = { ...(card || {}) };
      keys.forEach((key) => delete next[key]);
      return next;
    };
    setEditing((cur) => {
      const sections = [...safeSections(cur)];
      const block = sections[selectedBlock];
      if (!block) return cur;
      const props = { ...(block.props || {}) };
      props.followSiteTheme = true;
      switch (block.type) {
        case "videoStorySplit":
          delete props.contentBackground;
          delete props.contentColor;
          delete props.titleColor;
          break;
        case "stats":
        case "serviceGrid":
          delete props.titleColor;
          delete props.subtitleColor;
          break;
        case "logoCarousel":
          break;
        case "featurePillars":
          delete props.background;
          props.card = clearCardFields(props.card, [
            "sectionBackground",
            "surface",
            "hoverSurface",
            "shadow",
            "ringColor",
            "badgeBg",
            "badgeColor",
            "badgeSurface",
            "badgeText",
            "iconBg",
            "iconColor",
            "chipBg",
            "chipColor",
            "chipBorder",
            "headingColor",
            "bodyColor",
          ]);
          break;
        case "featureStories":
          props.stories = (Array.isArray(props.stories) ? props.stories : []).map((story) => {
            const nextStory = { ...(story || {}) };
            delete nextStory.background;
            return nextStory;
          });
          props.card = clearCardFields(props.card, [
            "sectionBackground",
            "surface",
            "borderColor",
            "shadow",
            "shadowHover",
            "headingColor",
            "bodyColor",
            "badgeBg",
            "badgeColor",
            "chipBg",
            "chipColor",
            "chipBorder",
            "legendBg",
            "legendColor",
            "metricBg",
            "metricColor",
            "ctaColor",
            "statColor",
          ]);
          break;
        case "testimonialTiles":
          props.card = clearCardFields(props.card, [
            "surface",
            "shadow",
            "borderColor",
            "headingColor",
            "bodyColor",
            "badgeBg",
            "badgeColor",
          ]);
          break;
        default:
          break;
      }
      sections[selectedBlock] = { ...block, props };
      return withLiftedLayout({
        ...cur,
        content: { ...(cur.content || {}), sections },
      });
    });
    setMsg("Reset block colors to follow the active site theme.");
    setErr("");
  }, [selectedBlock, setEditing]);
  const filteredSchemaForBlock = useMemo(() => {
    if (!schemaForBlock || !schemaForBlock.fields) return schemaForBlock;
    const filteredFields = schemaForBlock.fields.filter(
      (field) => !["overlayGradient", "brightness"].includes(field.name)
    );
    return { ...schemaForBlock, fields: filteredFields };
  }, [schemaForBlock]);
  const hasBackgroundImage =
    selectedProps.backgroundUrl || selectedProps.image || selectedProps.backgroundImage;
  const cardShadowPreset = matchShadowPreset(selectedProps.cardShadow)?.key || "custom";
  const heroShadowPreset =
    matchShadowPreset(selectedProps.heroHeadingShadow)?.key || "custom";
  const cardShadowValues = parseBoxShadow(selectedProps.cardShadow || "");
  const heroShadowValues = parseTextShadow(selectedProps.heroHeadingShadow || "");
  const updateCardShadow = (patch) => {
    const next = { ...cardShadowValues, ...patch };
    setBlockProp(selectedBlock, "cardShadow", buildBoxShadow(next));
  };
  const updateHeroShadow = (patch) => {
    const next = { ...heroShadowValues, ...patch };
    setBlockProp(selectedBlock, "heroHeadingShadow", buildTextShadow(next));
  };
  const [cardShadowBuilderOpen, setCardShadowBuilderOpen] = useState(false);
  const [heroShadowBuilderOpen, setHeroShadowBuilderOpen] = useState(false);
  const overlayGradientPresets = [
    { key: "none", label: "None", value: "" },
    {
      key: "subtle-dark",
      label: "Subtle Dark",
      value: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)",
    },
    {
      key: "strong-dark",
      label: "Strong Dark",
      value: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.75) 100%)",
    },
    {
      key: "soft-light",
      label: "Soft Light",
      value: "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)",
    },
    {
      key: "brand-tint",
      label: "Brand Tint",
      value: "linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(37,99,235,0.05) 100%)",
    },
  ];
  const overlayGradientValue = selectedProps.overlayGradient || "";
  const overlayGradientPreset =
    overlayGradientPresets.find((p) => p.value === overlayGradientValue)?.key || "custom";
  const isGradientValid = (val) =>
    !val || /^linear-gradient\(/i.test(val.trim());
  const parseGradient = (val) => {
    const fallback = {
      angle: 180,
      stops: [
        { color: "#000000", stop: 15, opacity: 0.35 },
        { color: "#000000", stop: 100, opacity: 0.6 },
      ],
    };
    if (!val || typeof val !== "string") return fallback;
    const match = /linear-gradient\(([^,]+),(.+)\)/i.exec(val);
    if (!match) return fallback;
    const angle = Number(String(match[1]).replace("deg", "").trim());
    const parts = match[2]
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const stops = parts.slice(0, 3).map((p, idx) => {
      const seg = p.split(/\s+/);
      const colorStr = seg[0];
      const stop = seg[1] ? Number(seg[1].replace("%", "")) : idx === 0 ? 0 : 100;
      const parsed = parseCssColor(colorStr, 0.35);
      return {
        color: parsed.hex || "#000000",
        opacity: parsed.opacity,
        stop: Number.isFinite(stop) ? stop : idx === 0 ? 0 : 100,
      };
    });
    return {
      angle: Number.isFinite(angle) ? angle : fallback.angle,
      stops: stops.length >= 2 ? stops : fallback.stops,
    };
  };
  const [overlayAngle, setOverlayAngle] = useState(180);
  const [overlayStops, setOverlayStops] = useState([
    { color: "#000000", stop: 0, opacity: 0.35 },
    { color: "#000000", stop: 100, opacity: 0.6 },
  ]);
  useEffect(() => {
    const parsed = parseGradient(overlayGradientValue);
    setOverlayAngle(parsed.angle);
    setOverlayStops(parsed.stops);
  }, [overlayGradientValue]);
  const buildOverlayGradient = (angle, stops) => {
    const parts = stops
      .filter((s) => s.color)
      .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.stop}%`);
    return `linear-gradient(${angle}deg, ${parts.join(", ")})`;
  };
  const updateOverlayStop = (index, patch) => {
    const next = overlayStops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setOverlayStops(next);
    setBlockProp(selectedBlock, "overlayGradient", buildOverlayGradient(overlayAngle, next));
  };
  const updateOverlayAngle = (nextAngle) => {
    setOverlayAngle(nextAngle);
    setBlockProp(selectedBlock, "overlayGradient", buildOverlayGradient(nextAngle, overlayStops));
  };
  const hasOverlayGradient = overlayGradientValue !== "";
  const brightnessValue = Number.isFinite(Number(selectedProps.brightness))
    ? Number(selectedProps.brightness)
    : 1;

  const updateSelectedSemanticModuleContent = (patch) => {
    if (!selectedSemanticModule) return;
    updateSemanticModule(selectedSemanticModule.id, (module) => ({
      ...module,
      content: { ...(module.content || {}), ...patch },
    }));
  };

  const updateSelectedSemanticModuleItems = (items) => {
    updateSelectedSemanticModuleContent({ items });
  };

  const renderSemanticModuleEditor = () => {
    if (!selectedSemanticModule) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select a section to edit its semantic content.
        </Alert>
      );
    }
    const content = selectedSemanticModule.content || {};
    const items = Array.isArray(content.items) ? content.items : [];
    const usesOperationalServiceRecords =
      selectedSemanticModule.type === "services" &&
      String(content.source || "").trim().toLowerCase() === "operational";
    const ironEmberInnerHeroSlots = new Set([
      "about.intro",
      "services.intro",
      "services.hero",
      "products.intro",
      "projects.intro",
      "reviews.intro",
      "contact.intro",
      "jobs.intro",
      "blog.intro",
      "service-areas.intro",
      "faq.intro",
      "legal.intro",
      "generic.intro",
    ]);
    const isIronEmberInnerPageHero =
      editingPageKind !== "home" &&
      String(currentStyleKey || "").trim().toLowerCase() === "iron-ember" &&
      (selectedSemanticModule.type === "hero" || ironEmberInnerHeroSlots.has(String(selectedSemanticModule.slot || "")));
    const normalizedNextThemeKey = String(currentStyleKey || "").trim().toLowerCase();
    const isIronEmberTheme = normalizedNextThemeKey === "iron-ember";
    const isForgeMotionTheme = normalizedNextThemeKey === "forge-motion";
    const isQuietHarborTheme = normalizedNextThemeKey === "quiet-harbor";
    const allowsHeroVideoMedia = isIronEmberTheme || isForgeMotionTheme;
    const syncPrimaryImagePatch = (patch = {}) => {
      const next = { ...patch };
      if (Object.prototype.hasOwnProperty.call(next, "image")) {
        next.imageUrl = next.image;
      }
      if (Object.prototype.hasOwnProperty.call(next, "imageUrl") && !Object.prototype.hasOwnProperty.call(next, "image")) {
        next.image = next.imageUrl;
      }
      return next;
    };
    const syncSemanticItemPatch = (patch = {}) => {
      const next = syncPrimaryImagePatch(patch);
      // These aliases exist in established semantic content. Keep the
      // Inspector's canonical field and the theme-visible field in lockstep
      // while older pages are normalized incrementally.
      if (selectedSemanticModule.type === "team" && Object.prototype.hasOwnProperty.call(next, "bio")) {
        next.body = next.bio;
      }
      if (selectedSemanticModule.type === "faq" && Object.prototype.hasOwnProperty.call(next, "question")) {
        next.title = next.question;
      }
      if (selectedSemanticModule.type === "faq" && Object.prototype.hasOwnProperty.call(next, "answer")) {
        next.body = next.answer;
      }
      if (selectedSemanticModule.type === "featureStory" && Object.prototype.hasOwnProperty.call(next, "kicker")) {
        next.eyebrow = next.kicker;
      }
      return next;
    };
    const updateItem = (index, patch) => {
      const nextItems = items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...syncSemanticItemPatch(patch) } : item
      );
      updateSelectedSemanticModuleItems(nextItems);
    };
    const removeItem = (index) => {
      updateSelectedSemanticModuleItems(items.filter((_, itemIndex) => itemIndex !== index));
    };
    const moveItem = (index, direction) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return;
      const nextItems = [...items];
      const [moved] = nextItems.splice(index, 1);
      nextItems.splice(targetIndex, 0, moved);
      updateSelectedSemanticModuleItems(nextItems);
    };
    const createEmptyItem = () => {
      switch (selectedSemanticModule.type) {
        case "faq":
          return { id: nanoOrShortId(), title: "", body: "" };
        case "reviews":
          return { id: nanoOrShortId(), title: "", author: "", role: "", body: "", quote: "", image: "", imageUrl: "", imageAlt: "" };
        case "pricing":
          return { id: nanoOrShortId(), title: "", price: "", body: "", features: [], href: "" };
        case "stats":
          return { id: nanoOrShortId(), title: "", value: "", body: "" };
        case "schedule":
          return { id: nanoOrShortId(), day: "", time: "", title: "", format: "", note: "" };
        case "trustRail":
          return { id: nanoOrShortId(), title: "", body: "", image: "", imageUrl: "", imageAlt: "", href: "" };
        case "beforeAfter":
          return {
            id: nanoOrShortId(),
            title: "",
            body: "",
            beforeImage: "",
            afterImage: "",
            beforeLabel: "",
            afterLabel: "",
          };
        case "gallery":
        case "portfolio":
          return { id: nanoOrShortId(), title: "", caption: "", body: "", image: "", imageUrl: "", imageAlt: "", href: "" };
        case "selectedCuts":
          return { id: nanoOrShortId(), title: "", category: "", image: "", imageUrl: "", imageAlt: "", href: "" };
        case "team":
          return { id: nanoOrShortId(), title: "", role: "", body: "", image: "", imageUrl: "", imageAlt: "" };
        default:
          return { id: nanoOrShortId(), title: "", body: "", image: "", imageUrl: "", imageAlt: "", href: "", features: [] };
      }
    };
    const addItem = () => {
      updateSelectedSemanticModuleItems([
        ...items,
        createEmptyItem(),
      ]);
    };
    const updateSelectedContent = (patch) => {
      const nextPatch = syncPrimaryImagePatch(patch);
      if (isIronEmberInnerPageHero) {
        const currentHeroCopy = content.subheading || content.intro || content.body || "";
        const safeHeroCopy = sanitizeNextJsEditableText(currentHeroCopy);
        if (safeHeroCopy !== String(currentHeroCopy || "").trim()) {
          nextPatch.subheading = safeHeroCopy;
          nextPatch.intro = safeHeroCopy;
          nextPatch.body = safeHeroCopy;
        }
      }
      updateSelectedSemanticModuleContent(nextPatch);
    };
    const contentPath = (field) => `content.${field}`;
    const itemPath = (index, field) => `content.items.${index}.${field}`;
    const mediaPositionControl = (fieldPath, value, onCommit) => ({
      position: value,
      onPositionChange: onCommit,
      onPositionPreview: (position) => {
        nextJsContentPreviewIframeRef.current?.contentWindow?.postMessage({
          type: "schedulaa:website-media-position-preview",
          moduleId: selectedSemanticModule.id,
          fieldPath,
          position,
        }, "*");
      },
    });
    const heroTopMarqueeItems = Array.isArray(content.marqueeTopItems) ? content.marqueeTopItems : [
      "Cut Rituals",
      "Fade Detail",
      "Beard Architecture",
      "Consultation First",
      "Queen West Studio",
    ];
    const heroBottomMarqueeItems = Array.isArray(content.marqueeBottomItems) ? content.marqueeBottomItems : [
      "Measured barbering",
      "Sharp finishing",
      "Texture work",
      "Low-noise appointments",
      "Routine-ready shape",
    ];
    const storedHeroSlides = Array.isArray(content.slides) ? content.slides : [];
    const heroSlides = isForgeMotionTheme && storedHeroSlides.length === 0
      ? [{
          ...FORGE_DEFAULT_ADDITIONAL_HERO_SLIDE,
          primaryCta: { ...FORGE_DEFAULT_ADDITIONAL_HERO_SLIDE.primaryCta },
          secondaryCta: { ...FORGE_DEFAULT_ADDITIONAL_HERO_SLIDE.secondaryCta },
        }]
      : storedHeroSlides;
    const updateHeroSlide = (index, patch) => updateSelectedContent({
      slides: heroSlides.map((slide, slideIndex) => slideIndex === index ? { ...slide, ...patch } : slide),
    });
    const renderPrimaryCtaFields = () => (
      <>
        <TextField
          size="small"
          label="Primary CTA label"
          value={content.primaryCta?.label || ""}
          onChange={(event) =>
            updateSelectedContent({
              primaryCta: { ...(content.primaryCta || {}), label: event.target.value },
            })
          }
          fullWidth
          inputProps={{ "data-module-field-path": contentPath("primaryCta.label") }}
        />
        <TextField
          size="small"
          label="Primary CTA link"
          value={content.primaryCta?.href || ""}
          onChange={(event) =>
            updateSelectedContent({
              primaryCta: { ...(content.primaryCta || {}), href: event.target.value },
            })
          }
          fullWidth
          inputProps={{ "data-module-field-path": contentPath("primaryCta.href") }}
        />
      </>
    );
    const renderQuietHarborAdditionalCtaFields = () => (
      <>
        {["secondaryCta", "tertiaryCta"].map((key, index) => {
          const label = index === 0 ? "Secondary" : "Tertiary";
          return (
            <React.Fragment key={key}>
              <TextField
                size="small"
                label={`${label} CTA label`}
                value={content[key]?.label || ""}
                onChange={(event) => updateSelectedContent({
                  [key]: { ...(content[key] || {}), label: event.target.value },
                })}
                fullWidth
                inputProps={{ "data-module-field-path": contentPath(`${key}.label`) }}
              />
              <TextField
                size="small"
                label={`${label} CTA link`}
                value={content[key]?.href || ""}
                onChange={(event) => updateSelectedContent({
                  [key]: { ...(content[key] || {}), href: event.target.value },
                })}
                fullWidth
                inputProps={{ "data-module-field-path": contentPath(`${key}.href`) }}
              />
            </React.Fragment>
          );
        })}
      </>
    );
    return (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity="info">
          Editing {isIronEmberInnerPageHero ? "Hero" : semanticModuleDisplayLabel(selectedSemanticModule)}
          {selectedSemanticModule.slot ? ` in ${selectedSemanticModule.slot}` : ""}.
        </Alert>
        {!isIronEmberInnerPageHero && ["richText", "services", "reviews", "faq", "gallery", "selectedCuts", "map", "contactForm", "contactIntro", "contactDetails", "hoursLocation", "locations", "cta", "bookingCta", "team", "pricing", "stats", "trustRail", "serviceAreas", "beforeAfter", "portfolio", "process", "featureStory", "video", "proofBand", "reviewSummary", "schedule"].includes(selectedSemanticModule.type) ? (
          <TextField
            size="small"
            label="Heading"
            value={content.heading || ""}
            onChange={(event) => updateSelectedContent({ heading: event.target.value })}
            fullWidth
            autoFocus={normalizeSemanticFieldPath(selectedModuleFieldPath) === "heading"}
            inputProps={{ "data-module-field-path": contentPath("heading") }}
          />
        ) : null}
        {!isIronEmberInnerPageHero && ["services", "reviews", "faq", "gallery", "selectedCuts", "contactForm", "contactIntro", "contactDetails", "hoursLocation", "locations", "cta", "bookingCta", "team", "pricing", "stats", "trustRail", "serviceAreas", "beforeAfter", "portfolio", "process", "featureStory", "proofBand", "reviewSummary", "schedule"].includes(selectedSemanticModule.type) ? (
          <TextField
            size="small"
            label="Eyebrow"
            value={content.eyebrow ?? (isQuietHarborTheme && ["cta", "bookingCta"].includes(selectedSemanticModule.type) ? "A welcoming next step" : "")}
            onChange={(event) => updateSelectedContent({ eyebrow: event.target.value })}
            fullWidth
            inputProps={{ "data-module-field-path": contentPath("eyebrow") }}
          />
        ) : null}
        {selectedSemanticModule.type === "hero" || isIronEmberInnerPageHero ? (
          <>
            <Stack spacing={1.5}>
              <Typography variant="overline" color="text.secondary">Content</Typography>
              <TextField size="small" label="Eyebrow" value={content.eyebrow || editing?.menu_title || editing?.menuTitle || editing?.title || ""} onChange={(event) => updateSelectedContent({ eyebrow: event.target.value })} fullWidth inputProps={{ "data-module-field-path": contentPath("eyebrow") }} />
              <TextField size="small" label="Heading" value={content.heading || ""} onChange={(event) => updateSelectedContent({ heading: event.target.value })} fullWidth autoFocus={normalizeSemanticFieldPath(selectedModuleFieldPath) === "heading"} inputProps={{ "data-module-field-path": contentPath("heading") }} />
              <TextField size="small" label="Subheading" value={isIronEmberInnerPageHero ? sanitizeNextJsEditableText(content.subheading || content.intro || content.body || "") : content.subheading || ""} onChange={(event) => updateSelectedContent({ subheading: event.target.value, intro: event.target.value, body: event.target.value })} fullWidth multiline minRows={3} inputProps={{ "data-module-field-path": contentPath("subheading") }} />
              {isIronEmberInnerPageHero ? (
                <Alert severity="info" variant="outlined">
                  This inner-page hero uses the eyebrow, heading, subheading,
                  primary image, and image alt text shown here. Iron Ember&apos;s
                  panel, marquee, secondary-image, and CTA fields belong to its
                  homepage hero.
                </Alert>
              ) : isIronEmberTheme ? (
                <>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={content.signaturePanelEnabled !== false}
                        onChange={(_, checked) =>
                          updateSelectedContent({ signaturePanelEnabled: checked })
                        }
                        inputProps={{
                          "aria-label": "Show signature services panel",
                          "data-module-field-path": contentPath("signaturePanelEnabled"),
                        }}
                      />
                    }
                    label="Show signature services panel"
                  />
                  <Alert severity="info" variant="outlined">
                    This optional panel previews live Service records.
                    Edit their names and prices in Services, or turn the panel off here.
                    The hero CTA buttons remain visible either way.
                  </Alert>
                  {content.signaturePanelEnabled !== false ? (
                    <>
                  <TextField
                    size="small"
                    type="number"
                    label="Services shown in panel"
                    value={content.signaturePanelServiceLimit ?? 4}
                    onChange={(event) => updateSelectedContent({
                      signaturePanelServiceLimit: Math.max(1, Math.min(10, Number(event.target.value) || 1)),
                    })}
                    helperText="Default: 4. Choose between 1 and 10; only available live services are shown."
                    fullWidth
                    inputProps={{ min: 1, max: 10, "data-module-field-path": contentPath("signaturePanelServiceLimit") }}
                  />
                  <TextField
                    size="small"
                    label="Hero panel eyebrow"
                    value={content.signaturePanelEyebrow ?? ""}
                    onChange={(event) => updateSelectedContent({ signaturePanelEyebrow: event.target.value })}
                    fullWidth
                    autoFocus={normalizeSemanticFieldPath(selectedModuleFieldPath) === "signaturePanelEyebrow"}
                    inputProps={{ "data-module-field-path": contentPath("signaturePanelEyebrow") }}
                  />
                  <TextField
                    size="small"
                    label="Hero panel body"
                    value={content.signaturePanelBody ?? ""}
                    onChange={(event) => updateSelectedContent({ signaturePanelBody: event.target.value })}
                    fullWidth
                    multiline
                    minRows={2}
                    autoFocus={normalizeSemanticFieldPath(selectedModuleFieldPath) === "signaturePanelBody"}
                    inputProps={{ "data-module-field-path": contentPath("signaturePanelBody") }}
                  />
                    </>
                  ) : null}
                  <Typography variant="subtitle2">Marquee rail: top row</Typography>
                  {heroTopMarqueeItems.map((item, index) => (
                    <TextField
                      key={`hero-top-marquee-${index}`}
                      size="small"
                      label={`Top pill ${index + 1}`}
                      value={item || ""}
                      onChange={(event) =>
                        updateSelectedContent({
                          marqueeTopItems: heroTopMarqueeItems.map((value, itemIndex) =>
                            itemIndex === index ? event.target.value : value
                          ),
                        })
                      }
                      fullWidth
                      autoFocus={normalizeSemanticFieldPath(selectedModuleFieldPath) === `marqueeTopItems.${index}`}
                      inputProps={{ "data-module-field-path": contentPath(`marqueeTopItems.${index}`) }}
                    />
                  ))}
                  <Typography variant="subtitle2">Marquee rail: bottom row</Typography>
                  {heroBottomMarqueeItems.map((item, index) => (
                    <TextField
                      key={`hero-bottom-marquee-${index}`}
                      size="small"
                      label={`Bottom pill ${index + 1}`}
                      value={item || ""}
                      onChange={(event) =>
                        updateSelectedContent({
                          marqueeBottomItems: heroBottomMarqueeItems.map((value, itemIndex) =>
                            itemIndex === index ? event.target.value : value
                          ),
                        })
                      }
                      fullWidth
                      autoFocus={normalizeSemanticFieldPath(selectedModuleFieldPath) === `marqueeBottomItems.${index}`}
                      inputProps={{ "data-module-field-path": contentPath(`marqueeBottomItems.${index}`) }}
                    />
                  ))}
                </>
              ) : null}
            </Stack>
            <Stack spacing={1.5} sx={{ order: 1 }}>
              <Typography variant="overline" color="text.secondary">Media</Typography>
              <Box data-module-field-path={contentPath("image")}><ImageField label={allowsHeroVideoMedia ? "Hero image or video" : "Hero image"} allowVideo={allowsHeroVideoMedia} value={content.image || content.imageUrl || ""} onChange={(url) => updateSelectedContent({ image: url })} companyId={companyId} fieldKey={`${selectedSemanticModule.id}:${contentPath("image")}`} {...mediaPositionControl(contentPath("image"), content.imagePosition, (imagePosition) => updateSelectedContent({ imagePosition }))} /></Box>
              <TextField size="small" label={allowsHeroVideoMedia ? "Hero media alt text" : "Hero image alt text"} value={content.imageAlt || ""} onChange={(event) => updateSelectedContent({ imageAlt: event.target.value })} fullWidth inputProps={{ "data-module-field-path": contentPath("imageAlt") }} />
              {isForgeMotionTheme ? <Box data-module-field-path={contentPath("posterImage")}>
                <ImageField
                  label="Hero video poster / mobile fallback"
                  value={content.posterImage || ""}
                  onChange={(url) => updateSelectedContent({ posterImage: url })}
                  companyId={companyId}
                  fieldKey={`${selectedSemanticModule.id}:${contentPath("posterImage")}`}
                  {...mediaPositionControl(contentPath("posterImage"), content.posterImagePosition, (posterImagePosition) => updateSelectedContent({ posterImagePosition }))}
                />
              </Box> : null}
            </Stack>
            {!isIronEmberInnerPageHero ? <Stack spacing={1} sx={{ order: isForgeMotionTheme ? 3 : 2 }}>
              <Typography variant="subtitle2">{isForgeMotionTheme ? "Optional foreground overlay (not a slide)" : "Secondary images"}</Typography>
              {isForgeMotionTheme ? <Typography variant="caption" color="text.secondary">
                These images float over slide 1 for depth; they do not replace the main background and do not create another slide. Leave them empty or remove them for a clean full-background hero.
              </Typography> : null}
              {(Array.isArray(content.secondaryImages) ? content.secondaryImages : []).map((url, index, secondaryImages) => (
                <Stack key={`${url}-${index}`} spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ flex: 1 }} data-module-field-path={contentPath(`secondaryImages.${index}`)}>
                    <ImageField
                      label={isForgeMotionTheme ? `Foreground overlay image ${index + 1}` : `Secondary image ${index + 1}`}
                      value={url || ""}
                      onChange={(nextUrl) => updateSelectedContent({ secondaryImages: secondaryImages.map((value, itemIndex) => itemIndex === index ? nextUrl : value) })}
                      companyId={companyId}
                      fieldKey={`${selectedSemanticModule.id}:${contentPath(`secondaryImages.${index}`)}`}
                      {...mediaPositionControl(contentPath(`secondaryImages.${index}`), content.secondaryImagePositions?.[index], (nextPosition) => {
                        const positions = Array.isArray(content.secondaryImagePositions) ? [...content.secondaryImagePositions] : [];
                        positions[index] = nextPosition;
                        updateSelectedContent({ secondaryImagePositions: positions });
                      })}
                    />
                  </Box>
                  <Button size="small" onClick={() => updateSelectedContent({
                    secondaryImages: secondaryImages.filter((_, itemIndex) => itemIndex !== index),
                    secondaryImageAlts: (Array.isArray(content.secondaryImageAlts) ? content.secondaryImageAlts : []).filter((_, itemIndex) => itemIndex !== index),
                    secondaryImagePositions: (Array.isArray(content.secondaryImagePositions) ? content.secondaryImagePositions : []).filter((_, itemIndex) => itemIndex !== index),
                  })}>Remove</Button>
                  </Stack>
                  <TextField
                    size="small"
                    label={isForgeMotionTheme ? `Foreground overlay image ${index + 1} alt text` : `Secondary image ${index + 1} alt text`}
                    value={(Array.isArray(content.secondaryImageAlts) ? content.secondaryImageAlts[index] : "") || ""}
                    onChange={(event) => {
                      const nextAlts = Array.isArray(content.secondaryImageAlts) ? [...content.secondaryImageAlts] : [];
                      nextAlts[index] = event.target.value;
                      updateSelectedContent({ secondaryImageAlts: nextAlts });
                    }}
                    fullWidth
                    inputProps={{ "data-module-field-path": contentPath(`secondaryImageAlts.${index}`) }}
                  />
                </Stack>
              ))}
              <Button size="small" variant="outlined" onClick={() => updateSelectedContent({
                secondaryImages: [...(Array.isArray(content.secondaryImages) ? content.secondaryImages : []), ""],
                secondaryImageAlts: [...(Array.isArray(content.secondaryImageAlts) ? content.secondaryImageAlts : []), ""],
                secondaryImagePositions: [...(Array.isArray(content.secondaryImagePositions) ? content.secondaryImagePositions : []), { x: 50, y: 50 }],
              })}>
                {isForgeMotionTheme ? "Add foreground overlay image" : "Add secondary image"}
              </Button>
              {isForgeMotionTheme ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                <Stack spacing={1.25}>
                  <FormControlLabel
                    control={<Switch checked={content.layerPanelEnabled !== false} onChange={(_, checked) => updateSelectedContent({ layerPanelEnabled: checked })} />}
                    label="Show foreground text panel"
                  />
                  <Typography variant="caption" color="text.secondary">
                    This panel appears only when the first optional foreground image is present. Turn it off for an image-only layer.
                  </Typography>
                  {content.layerPanelEnabled !== false ? <>
                    <TextField size="small" label="Foreground panel eyebrow" value={content.layerPanelEyebrow || ""} onChange={(event) => updateSelectedContent({ layerPanelEyebrow: event.target.value })} fullWidth inputProps={{ "data-module-field-path": contentPath("layerPanelEyebrow") }} />
                    <TextField size="small" label="Foreground panel text" value={content.layerPanelBody || ""} onChange={(event) => updateSelectedContent({ layerPanelBody: event.target.value })} fullWidth multiline minRows={2} inputProps={{ "data-module-field-path": contentPath("layerPanelBody") }} />
                  </> : null}
                </Stack>
              </Box> : null}
            </Stack> : null}
            {isForgeMotionTheme && !isIronEmberInnerPageHero ? <Stack spacing={1.5} sx={{ order: 2 }}>
              <Typography variant="overline" color="text.secondary">Hero slides</Typography>
              {heroSlides.map((slide, index) => (
                <Box key={slide.id || index} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}>
                  <Stack spacing={1.25}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
                      <Typography variant="subtitle2">Slide {index + 2}</Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Button size="small" disabled={index === 0} onClick={() => updateSelectedContent({ slides: heroSlides.map((item, itemIndex) => itemIndex === index - 1 ? heroSlides[index] : itemIndex === index ? heroSlides[index - 1] : item) })}>Move up</Button>
                        <Button size="small" disabled={index === heroSlides.length - 1} onClick={() => updateSelectedContent({ slides: heroSlides.map((item, itemIndex) => itemIndex === index + 1 ? heroSlides[index] : itemIndex === index ? heroSlides[index + 1] : item) })}>Move down</Button>
                        <Button size="small" color="error" disabled={heroSlides.length === 1} onClick={() => updateSelectedContent({ slides: heroSlides.filter((_, itemIndex) => itemIndex !== index) })}>Remove</Button>
                      </Stack>
                    </Stack>
                    <TextField size="small" label="Eyebrow" value={slide.eyebrow || ""} onChange={(event) => updateHeroSlide(index, { eyebrow: event.target.value })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.eyebrow`) }} />
                    <TextField size="small" label="Heading" value={slide.heading || ""} onChange={(event) => updateHeroSlide(index, { heading: event.target.value })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.heading`) }} />
                    <TextField size="small" label="Subheading" value={slide.subheading || ""} onChange={(event) => updateHeroSlide(index, { subheading: event.target.value })} fullWidth multiline minRows={2} inputProps={{ "data-module-field-path": contentPath(`slides.${index}.subheading`) }} />
                    <Box data-module-field-path={contentPath(`slides.${index}.image`)}>
                      <ImageField label="Slide image or video" allowVideo value={slide.image || slide.imageUrl || ""} onChange={(url) => updateHeroSlide(index, { image: url, imageUrl: url })} companyId={companyId} fieldKey={`${selectedSemanticModule.id}:${contentPath(`slides.${index}.image`)}`} {...mediaPositionControl(contentPath(`slides.${index}.image`), slide.imagePosition, (imagePosition) => updateHeroSlide(index, { imagePosition }))} />
                    </Box>
                    <TextField size="small" label="Slide media alt text" value={slide.imageAlt || ""} onChange={(event) => updateHeroSlide(index, { imageAlt: event.target.value })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.imageAlt`) }} />
                    <Box data-module-field-path={contentPath(`slides.${index}.posterImage`)}>
                      <ImageField label="Video poster / mobile fallback" value={slide.posterImage || ""} onChange={(url) => updateHeroSlide(index, { posterImage: url })} companyId={companyId} fieldKey={`${selectedSemanticModule.id}:${contentPath(`slides.${index}.posterImage`)}`} {...mediaPositionControl(contentPath(`slides.${index}.posterImage`), slide.posterImagePosition, (posterImagePosition) => updateHeroSlide(index, { posterImagePosition }))} />
                    </Box>
                    <TextField size="small" label="Primary CTA label" value={slide.primaryCta?.label || ""} onChange={(event) => updateHeroSlide(index, { primaryCta: { ...(slide.primaryCta || {}), label: event.target.value } })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.primaryCta.label`) }} />
                    <TextField size="small" label="Primary CTA link" value={slide.primaryCta?.href || ""} onChange={(event) => updateHeroSlide(index, { primaryCta: { ...(slide.primaryCta || {}), href: event.target.value } })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.primaryCta.href`) }} />
                    <TextField size="small" label="Secondary CTA label" value={slide.secondaryCta?.label || ""} onChange={(event) => updateHeroSlide(index, { secondaryCta: { ...(slide.secondaryCta || {}), label: event.target.value } })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.secondaryCta.label`) }} />
                    <TextField size="small" label="Secondary CTA link" value={slide.secondaryCta?.href || ""} onChange={(event) => updateHeroSlide(index, { secondaryCta: { ...(slide.secondaryCta || {}), href: event.target.value } })} fullWidth inputProps={{ "data-module-field-path": contentPath(`slides.${index}.secondaryCta.href`) }} />
                  </Stack>
                </Box>
              ))}
              <Button size="small" variant="outlined" disabled={heroSlides.length >= 3} onClick={() => updateSelectedContent({
                slides: [...heroSlides, {
                  id: `forge-hero-slide-${nanoid(8)}`,
                  eyebrow: "",
                  heading: "",
                  subheading: "",
                  image: "",
                  imageUrl: "",
                  imageAlt: "",
                  imagePosition: { x: 50, y: 50 },
                  posterImage: "",
                  primaryCta: { label: "", href: "/services" },
                  secondaryCta: { label: "", href: "/contact" },
                }],
              })}>Add hero slide {heroSlides.length + 2}</Button>
            </Stack> : null}
            {!isIronEmberInnerPageHero ? <Stack spacing={1.5} sx={{ order: 4 }}>
              <Typography variant="overline" color="text.secondary">Buttons</Typography>
              {renderPrimaryCtaFields()}
            <TextField
              size="small"
              label="Secondary CTA label"
              value={content.secondaryCta?.label || ""}
              onChange={(event) =>
                updateSelectedContent({
                  secondaryCta: { ...(content.secondaryCta || {}), label: event.target.value },
                })
              }
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("secondaryCta.label") }}
            />
            <TextField
              size="small"
              label="Secondary CTA link"
              value={content.secondaryCta?.href || ""}
              onChange={(event) =>
                updateSelectedContent({
                  secondaryCta: { ...(content.secondaryCta || {}), href: event.target.value },
                })
              }
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("secondaryCta.href") }}
            />
            </Stack> : null}
          </>
        ) : null}
        {!isIronEmberInnerPageHero && ["richText", "cta", "bookingCta", "contactIntro", "featureStory", "video"].includes(selectedSemanticModule.type) && !(isQuietHarborTheme && selectedSemanticModule.type === "contactIntro") ? (
          <TextField
            size="small"
            label="Body"
            value={content.body || content.intro || ""}
            onChange={(event) => updateSelectedContent({ body: event.target.value, intro: event.target.value })}
            fullWidth
            multiline
            minRows={4}
            inputProps={{ "data-module-field-path": contentPath("body") }}
          />
        ) : null}
        {!isIronEmberInnerPageHero && isQuietHarborTheme && selectedSemanticModule.type === "contactIntro" ? (
          <TextField
            size="small"
            label="Introduction"
            value={content.intro || content.body || ""}
            onChange={(event) => updateSelectedContent({ intro: event.target.value, body: event.target.value })}
            fullWidth
            multiline
            minRows={4}
            helperText="This is the introduction displayed in the Quiet Harbor Contact page canvas."
            inputProps={{ "data-module-field-path": contentPath("intro") }}
          />
        ) : null}
        {!isIronEmberInnerPageHero && ["richText", "contactIntro", "featureStory"].includes(selectedSemanticModule.type) && !(isQuietHarborTheme && selectedSemanticModule.type === "contactIntro") ? (
          <>
            <Box data-module-field-path={contentPath("image")}>
              <ImageField
                label={selectedSemanticModule.type === "featureStory" ? "Feature image" : "Section image"}
                value={content.image || content.imageUrl || ""}
                onChange={(url) => updateSelectedContent({ image: url })}
                companyId={companyId}
                fieldKey={`${selectedSemanticModule.id}:${contentPath("image")}`}
                {...mediaPositionControl(contentPath("image"), content.imagePosition, (imagePosition) => updateSelectedContent({ imagePosition }))}
              />
            </Box>
            <TextField
              size="small"
              label="Image alt text"
              value={content.imageAlt || ""}
              onChange={(event) => updateSelectedContent({ imageAlt: event.target.value })}
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("imageAlt") }}
            />
          </>
        ) : null}
        {selectedSemanticModule.type === "featureStory" ? (
          <>
            <Box data-module-field-path={contentPath("secondaryImage")}>
              <ImageField
                label="Secondary image"
                value={content.secondaryImage || ""}
                onChange={(url) => updateSelectedContent({ secondaryImage: url })}
                companyId={companyId}
                fieldKey={`${selectedSemanticModule.id}:${contentPath("secondaryImage")}`}
                {...mediaPositionControl(contentPath("secondaryImage"), content.secondaryImagePosition, (secondaryImagePosition) => updateSelectedContent({ secondaryImagePosition }))}
              />
            </Box>
            <TextField
              size="small"
              label="Secondary image alt text"
              value={content.secondaryImageAlt || ""}
              onChange={(event) => updateSelectedContent({ secondaryImageAlt: event.target.value })}
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("secondaryImageAlt") }}
            />
            {renderPrimaryCtaFields()}
            <Stack spacing={1.25} data-testid="feature-story-panels-editor">
              <Typography variant="overline" color="text.secondary">Story panels</Typography>
              {items.map((item, index) => (
                <Paper key={item.id || index} variant="outlined" data-testid={`semantic-item-${index}`} sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <TextField
                      size="small"
                      label="Story eyebrow"
                      value={item.kicker || item.eyebrow || ""}
                      onChange={(event) => updateItem(index, { kicker: event.target.value })}
                      fullWidth
                      inputProps={{ "data-module-field-path": itemPath(index, "kicker") }}
                    />
                    <TextField
                      size="small"
                      label="Story title"
                      value={item.title || ""}
                      onChange={(event) => updateItem(index, { title: event.target.value })}
                      fullWidth
                      inputProps={{ "data-module-field-path": itemPath(index, "title") }}
                    />
                    <TextField
                      size="small"
                      label="Story body"
                      value={item.body || ""}
                      onChange={(event) => updateItem(index, { body: event.target.value })}
                      fullWidth
                      multiline
                      minRows={2}
                      inputProps={{ "data-module-field-path": itemPath(index, "body") }}
                    />
                    <Box data-module-field-path={itemPath(index, "image")}>
                      <ImageField
                        label="Story panel image"
                        value={item.image || item.imageUrl || ""}
                        onChange={(url) => updateItem(index, { image: url })}
                        companyId={companyId}
                        fieldKey={`${selectedSemanticModule.id}:${itemPath(index, "image")}`}
                        {...mediaPositionControl(itemPath(index, "image"), item.imagePosition, (imagePosition) => updateItem(index, { imagePosition }))}
                      />
                    </Box>
                    <TextField
                      size="small"
                      label="Story panel image alt text"
                      value={item.imageAlt || ""}
                      onChange={(event) => updateItem(index, { imageAlt: event.target.value })}
                      fullWidth
                      inputProps={{ "data-module-field-path": itemPath(index, "imageAlt") }}
                    />
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => moveItem(index, "up")} disabled={index === 0}>Move up</Button>
                        <Button size="small" variant="outlined" onClick={() => moveItem(index, "down")} disabled={index === items.length - 1}>Move down</Button>
                      </Stack>
                      <Button color="error" size="small" onClick={() => removeItem(index)}>Remove panel</Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem}>Add story panel</Button>
            </Stack>
          </>
        ) : null}
        {["cta", "bookingCta"].includes(selectedSemanticModule.type) ? (
          <>
            {renderPrimaryCtaFields()}
            {isQuietHarborTheme ? renderQuietHarborAdditionalCtaFields() : null}
            <Box data-module-field-path={contentPath(isQuietHarborTheme ? "image" : "backgroundImage")}>
              <ImageField
                label={isQuietHarborTheme ? "CTA image" : isForgeMotionTheme ? "Background image or video" : "Background image"}
                allowVideo={isForgeMotionTheme}
                value={isQuietHarborTheme ? (content.image || content.imageUrl || content.backgroundImage || "") : (content.backgroundImage || "")}
                onChange={(url) => updateSelectedContent(isQuietHarborTheme
                  ? { image: url, imageUrl: url, backgroundImage: url }
                  : { backgroundImage: url })}
                companyId={companyId}
                fieldKey={`${selectedSemanticModule.id}:${contentPath(isQuietHarborTheme ? "image" : "backgroundImage")}`}
                {...mediaPositionControl(
                  contentPath(isQuietHarborTheme ? "image" : "backgroundImage"),
                  isQuietHarborTheme ? (content.imagePosition || content.backgroundImagePosition) : content.backgroundImagePosition,
                  (backgroundImagePosition) => updateSelectedContent(isQuietHarborTheme
                    ? { imagePosition: backgroundImagePosition, backgroundImagePosition }
                    : { backgroundImagePosition })
                )}
              />
            </Box>
            {isQuietHarborTheme ? <TextField
              size="small"
              label="CTA image alt text"
              value={content.imageAlt || content.backgroundImageAlt || ""}
              onChange={(event) => updateSelectedContent({ imageAlt: event.target.value, backgroundImageAlt: event.target.value })}
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("imageAlt") }}
            /> : null}
            {isForgeMotionTheme ? <Box data-module-field-path={contentPath("backgroundPoster")}>
              <ImageField
                label="Background video poster / fallback"
                value={content.backgroundPoster || ""}
                onChange={(url) => updateSelectedContent({ backgroundPoster: url })}
                companyId={companyId}
                fieldKey={`${selectedSemanticModule.id}:${contentPath("backgroundPoster")}`}
                {...mediaPositionControl(contentPath("backgroundPoster"), content.backgroundPosterPosition, (backgroundPosterPosition) => updateSelectedContent({ backgroundPosterPosition }))}
              />
            </Box> : null}
          </>
        ) : null}
        {selectedSemanticModule.type === "map" ? (
          <>
            <TextField
              size="small"
              label="Address / query"
              value={content.query || ""}
              onChange={(event) => updateSelectedContent({ query: event.target.value })}
              helperText="Used to search and position the map. Example: Queen West, Toronto"
              placeholder="Queen West, Toronto"
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("query") }}
            />
            <TextField
              size="small"
              label="Display address"
              value={content.address || ""}
              onChange={(event) => updateSelectedContent({ address: event.target.value })}
              helperText="This is the readable address shown to visitors. Example: 123 Main Street, Suite 4, Toronto, ON"
              placeholder="123 Main Street, Suite 4, Toronto, ON"
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("address") }}
            />
            <TextField
              size="small"
              label="Embed URL"
              value={content.embedUrl || ""}
              onChange={(event) => updateSelectedContent({ embedUrl: event.target.value })}
              helperText="Optional. If you fill this in, this exact map embed overrides the address/query above."
              placeholder="https://www.google.com/maps?q=..."
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("embedUrl") }}
            />
            {renderPrimaryCtaFields()}
          </>
        ) : null}
        {selectedSemanticModule.type === "contactForm" ? (
          <>
            {isQuietHarborTheme ? <>
              <Typography variant="overline" color="text.secondary">
                Editorial media panel
              </Typography>
              <Box data-module-field-path={contentPath("mediaImage")}>
                <ImageField
                  label="Contact panel image"
                  value={content.mediaImage || content.image || content.imageUrl || ""}
                  onChange={(url) => updateSelectedContent({ mediaImage: url, image: url, imageUrl: url })}
                  companyId={companyId}
                  fieldKey={`${selectedSemanticModule.id}:${contentPath("mediaImage")}`}
                  {...mediaPositionControl(
                    contentPath("mediaImage"),
                    content.mediaImagePosition || content.imagePosition,
                    (mediaImagePosition) => updateSelectedContent({ mediaImagePosition, imagePosition: mediaImagePosition })
                  )}
                />
              </Box>
              <TextField
                size="small"
                label="Contact panel image alt text"
                value={content.mediaAlt || content.imageAlt || ""}
                onChange={(event) => updateSelectedContent({ mediaAlt: event.target.value, imageAlt: event.target.value })}
                fullWidth
                inputProps={{ "data-module-field-path": contentPath("mediaAlt") }}
              />
              <TextField
                size="small"
                label="Media panel statement"
                value={content.mediaTitle ?? content.mediaCaption ?? "Support starts with a conversation."}
                onChange={(event) => updateSelectedContent({ mediaTitle: event.target.value })}
                helperText="Shown over the contact panel. Clear this field to hide the statement."
                fullWidth
                multiline
                minRows={2}
                inputProps={{ "data-module-field-path": contentPath("mediaTitle") }}
              />
            </> : null}
            {isForgeMotionTheme ? <>
              <Box data-module-field-path={contentPath("backgroundImage")}>
                <ImageField
                  label="Contact hero image or video"
                  allowVideo
                  value={content.backgroundImage || ""}
                  onChange={(url) => updateSelectedContent({ backgroundImage: url })}
                  companyId={companyId}
                  fieldKey={`${selectedSemanticModule.id}:${contentPath("backgroundImage")}`}
                  {...mediaPositionControl(contentPath("backgroundImage"), content.backgroundImagePosition, (backgroundImagePosition) => updateSelectedContent({ backgroundImagePosition }))}
                />
              </Box>
              <TextField
                size="small"
                label="Contact hero media alt text"
                value={content.backgroundImageAlt || ""}
                onChange={(event) => updateSelectedContent({ backgroundImageAlt: event.target.value })}
                fullWidth
                inputProps={{ "data-module-field-path": contentPath("backgroundImageAlt") }}
              />
              <Box data-module-field-path={contentPath("backgroundPoster")}>
                <ImageField
                  label="Contact video poster / mobile fallback"
                  value={content.backgroundPoster || ""}
                  onChange={(url) => updateSelectedContent({ backgroundPoster: url })}
                  companyId={companyId}
                  fieldKey={`${selectedSemanticModule.id}:${contentPath("backgroundPoster")}`}
                  {...mediaPositionControl(contentPath("backgroundPoster"), content.backgroundPosterPosition, (backgroundPosterPosition) => updateSelectedContent({ backgroundPosterPosition }))}
                />
              </Box>
            </> : null}
            <TextField
              size="small"
              label="Form introduction"
              value={content.intro || ""}
              onChange={(event) => updateSelectedContent({ intro: event.target.value })}
              fullWidth
              multiline
              minRows={2}
              inputProps={{ "data-module-field-path": contentPath("intro") }}
            />
            <TextField
              size="small"
              label="Submit button label"
              value={content.submitLabel || "Send"}
              onChange={(event) => updateSelectedContent({ submitLabel: event.target.value })}
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("submitLabel") }}
            />
            <TextField
              size="small"
              label="Form definition key"
              value={content.formKey || "contact"}
              fullWidth
              disabled
              helperText="The production renderer currently uses the existing contact Website Form. Change its fields below without creating a second form store."
              inputProps={{ "data-module-field-path": contentPath("formKey") }}
            />
            <WebsiteContactFormEditor
              companyId={companyId}
              formKey={content.formKey || "contact"}
              onSaved={() => refreshNextJsPreview()}
            />
          </>
        ) : null}
        {selectedSemanticModule.type === "video" ? (
          <>
            <TextField
              size="small"
              label="Video URL"
              value={content.videoUrl || ""}
              onChange={(event) => updateSelectedContent({ videoUrl: event.target.value })}
              fullWidth
              inputProps={{ "data-module-field-path": contentPath("videoUrl") }}
            />
            <Box data-module-field-path={contentPath("posterImage")}>
              <ImageField
                label="Poster image"
                value={content.posterImage || content.posterUrl || ""}
                onChange={(url) => updateSelectedContent({ posterImage: url, posterUrl: url })}
                companyId={companyId}
                fieldKey={`${selectedSemanticModule.id}:${contentPath("posterImage")}`}
                {...mediaPositionControl(contentPath("posterImage"), content.posterImagePosition, (posterImagePosition) => updateSelectedContent({ posterImagePosition }))}
              />
            </Box>
          </>
        ) : null}
        {["services", "reviews", "faq", "gallery", "selectedCuts", "team", "pricing", "stats", "trustRail", "serviceAreas", "beforeAfter", "portfolio", "process", "featureStory", "richText", "contactDetails", "hoursLocation", "locations", "proofBand", "reviewSummary", "schedule"].includes(selectedSemanticModule.type) ? (
          <>
            <Typography variant="overline" color="text.secondary">Content</Typography>
            <TextField
              size="small"
              label="Intro"
              value={content.intro || ""}
              onChange={(event) => updateSelectedContent({ intro: event.target.value })}
              fullWidth
              multiline
              minRows={2}
              inputProps={{ "data-module-field-path": contentPath("intro") }}
            />
            {selectedSemanticModule.type === "reviews" ? (
              <>
                <TextField
                  size="small"
                  label="Review count label"
                  value={content.reviewCountLabel || ""}
                  onChange={(event) => updateSelectedContent({ reviewCountLabel: event.target.value })}
                  fullWidth
                  inputProps={{ "data-module-field-path": contentPath("reviewCountLabel") }}
                />
                <TextField
                  size="small"
                  label="Review platform label"
                  value={content.platformLabel || ""}
                  onChange={(event) => updateSelectedContent({ platformLabel: event.target.value })}
                  fullWidth
                  inputProps={{ "data-module-field-path": contentPath("platformLabel") }}
                />
                {renderPrimaryCtaFields()}
              </>
            ) : null}
            {usesOperationalServiceRecords ? (
              <Alert severity="info" variant="outlined">
                <Stack spacing={1}>
                  <Typography variant="body2">
                    These cards come from the Services workspace. Hiding them here does not delete services or change pricing, availability, or booking.
                  </Typography>
                  <Link
                    component={RouterLink}
                    to="/manager/dashboard?view=advanced-management&panel=services"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                  >
                    Open Services workspace ↗
                  </Link>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={selectedSemanticModule.enabled !== false}
                        onChange={(_, checked) =>
                          updateSemanticModule(selectedSemanticModule.id, (module) => ({
                            ...module,
                            enabled: checked,
                          }))
                        }
                        inputProps={{ "aria-label": "Show managed Services on this page" }}
                      />
                    )}
                    label="Show managed Services on this page"
                  />
                </Stack>
              </Alert>
            ) : <Stack spacing={1}>
              {isForgeMotionTheme && selectedSemanticModule.type === "stats" && items.length === 3 ? (
                <Alert severity="info" variant="outlined">
                  Forge displays a fourth operational card using the current number of published Services. Add a fourth item here if you prefer a custom editable proof card instead.
                </Alert>
              ) : null}
              <Typography variant="overline" color="text.secondary">
                {selectedSemanticModule.type === "team"
                  ? "People"
                  : selectedSemanticModule.type === "selectedCuts"
                    ? "Cuts"
                    : selectedSemanticModule.type === "gallery"
                      ? "Media"
                      : selectedSemanticModule.type === "featureStory"
                        ? "Story panels"
                        : selectedSemanticModule.type === "faq"
                          ? "Questions"
                          : "Items"}
              </Typography>
              {items.map((item, index) => (
                <Paper key={item.id || index} variant="outlined" data-testid={`semantic-item-${index}`} sx={{ p: 1.5, borderRadius: 1 }}>
                  <Stack spacing={1}>
                    <TextField
                      size="small"
                      label={selectedSemanticModule.type === "reviews"
                        ? "Name / heading"
                        : selectedSemanticModule.type === "faq"
                          ? "Question"
                          : selectedSemanticModule.type === "selectedCuts"
                            ? "Cut title"
                            : "Title"}
                      value={selectedSemanticModule.type === "faq" ? (item.question || item.title || "") : (item.title || item.label || item.author || "")}
                      onChange={(event) =>
                        updateItem(index, {
                          title: event.target.value,
                          label: event.target.value,
                          ...(selectedSemanticModule.type === "faq" ? { question: event.target.value } : {}),
                          ...(selectedSemanticModule.type === "reviews" ? { author: event.target.value } : {}),
                        })
                      }
                      fullWidth
                      inputProps={{ "data-module-field-path": itemPath(index, selectedSemanticModule.type === "faq" ? "question" : "title") }}
                    />
                    {selectedSemanticModule.type === "schedule" ? (
                      <>
                        <TextField
                          size="small"
                          label="Day"
                          value={item.day || ""}
                          onChange={(event) => updateItem(index, { day: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "day") }}
                        />
                        <TextField
                          size="small"
                          label="Displayed time"
                          value={item.time || ""}
                          onChange={(event) => updateItem(index, { time: event.target.value })}
                          fullWidth
                          helperText="Presentation only. This does not create live availability."
                          inputProps={{ "data-module-field-path": itemPath(index, "time") }}
                        />
                        <TextField
                          size="small"
                          label="Format / context"
                          value={item.format || ""}
                          onChange={(event) => updateItem(index, { format: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "format") }}
                        />
                        <TextField
                          size="small"
                          label="Display note"
                          value={item.note || ""}
                          onChange={(event) => updateItem(index, { note: event.target.value })}
                          fullWidth
                          helperText="Use neutral context such as Group, Private, Studio, or Online—not live availability."
                          inputProps={{ "data-module-field-path": itemPath(index, "note") }}
                        />
                      </>
                    ) : null}
                    {["team", "reviews", "services", "serviceAreas", "proofBand", "reviewSummary"].includes(selectedSemanticModule.type) ? (
                      <TextField
                        size="small"
                        label={selectedSemanticModule.type === "reviews" ? "Role" : "Supporting label"}
                        value={item.role || item.tagline || item.location || ""}
                        onChange={(event) => updateItem(index, { role: event.target.value, tagline: event.target.value, location: event.target.value })}
                        fullWidth
                        inputProps={{ "data-module-field-path": itemPath(index, "role") }}
                      />
                    ) : null}
                    {selectedSemanticModule.type === "selectedCuts" ? (
                      <TextField
                        size="small"
                        label="Category / craft metadata"
                        value={item.category || ""}
                        onChange={(event) => updateItem(index, { category: event.target.value })}
                        fullWidth
                        inputProps={{ "data-module-field-path": itemPath(index, "category") }}
                      />
                    ) : selectedSemanticModule.type !== "schedule" ? <TextField
                      size="small"
                      label={selectedSemanticModule.type === "reviews"
                        ? "Quote / body"
                        : selectedSemanticModule.type === "faq"
                          ? "Answer"
                          : selectedSemanticModule.type === "team"
                            ? "Bio"
                            : "Body"}
                      value={selectedSemanticModule.type === "faq" ? (item.answer || item.body || "") : selectedSemanticModule.type === "team" ? (item.bio || item.body || "") : (item.body || item.quote || "")}
                      onChange={(event) => updateItem(index, {
                        body: event.target.value,
                        quote: event.target.value,
                        ...(selectedSemanticModule.type === "faq" ? { answer: event.target.value } : {}),
                        ...(selectedSemanticModule.type === "team" ? { bio: event.target.value } : {}),
                      })}
                      fullWidth
                      multiline
                      minRows={2}
                      inputProps={{ "data-module-field-path": itemPath(index, selectedSemanticModule.type === "faq" ? "answer" : selectedSemanticModule.type === "team" ? "bio" : "body") }}
                    /> : null}
                    {["contactDetails", "hoursLocation", "locations", "serviceAreas"].includes(selectedSemanticModule.type) ? (
                      <TextField
                        size="small"
                        label="Link (optional)"
                        value={item.href || item.link || ""}
                        onChange={(event) => updateItem(index, { href: event.target.value, link: event.target.value })}
                        helperText="Use mailto: for email, tel: for phone, or a page/website URL."
                        fullWidth
                        inputProps={{ "data-module-field-path": itemPath(index, "href") }}
                      />
                    ) : null}
                    {selectedSemanticModule.type === "pricing" ? (
                      <>
                        <TextField
                          size="small"
                          label="Price"
                          value={item.price || ""}
                          onChange={(event) => updateItem(index, { price: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "price") }}
                        />
                        <TextField
                          size="small"
                          label="Features"
                          helperText="One feature per line."
                          value={Array.isArray(item.features) ? item.features.join("\n") : ""}
                          onChange={(event) =>
                            updateItem(index, {
                              features: event.target.value
                                .split("\n")
                                .map((value) => value.trim())
                                .filter(Boolean),
                            })
                          }
                          fullWidth
                          multiline
                          minRows={2}
                          inputProps={{ "data-module-field-path": itemPath(index, "features") }}
                        />
                      </>
                    ) : null}
                    {selectedSemanticModule.type === "services" ? (
                      <>
                        <TextField
                          size="small"
                          label="Price label"
                          value={item.price || ""}
                          onChange={(event) => updateItem(index, { price: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "price") }}
                        />
                        <TextField
                          size="small"
                          label="Duration"
                          value={item.duration || ""}
                          onChange={(event) => updateItem(index, { duration: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "duration") }}
                        />
                      </>
                    ) : null}
                    {selectedSemanticModule.type === "reviews" ? (
                      <TextField
                        size="small"
                        type="number"
                        label="Rating"
                        value={item.rating || 5}
                        onChange={(event) => updateItem(index, { rating: Math.max(1, Math.min(5, Number(event.target.value) || 5)) })}
                        inputProps={{ min: 1, max: 5, "data-module-field-path": itemPath(index, "rating") }}
                        fullWidth
                      />
                    ) : null}
                    {["stats", "trustRail", "proofBand", "reviewSummary"].includes(selectedSemanticModule.type) ? (
                      <TextField
                        size="small"
                        label={selectedSemanticModule.type === "stats" ? "Value" : "Proof value"}
                        value={item.value || ""}
                        onChange={(event) => updateItem(index, { value: event.target.value })}
                        fullWidth
                        inputProps={{ "data-module-field-path": itemPath(index, "value") }}
                      />
                    ) : null}
                    {["gallery", "selectedCuts", "team", "portfolio", "services", "trustRail", "featureStory", "richText"].includes(selectedSemanticModule.type) ? (
                      <>
                        <Box data-module-field-path={itemPath(index, "image")}>
                          <ImageField
                            label={isIronEmberTheme && (selectedSemanticModule.type === "gallery" || selectedSemanticModule.type === "portfolio") ? "Image or video" : "Image"}
                            allowVideo={isIronEmberTheme && (selectedSemanticModule.type === "gallery" || selectedSemanticModule.type === "portfolio")}
                            value={item.image || item.imageUrl || ""}
                            onChange={(url) => updateItem(index, { image: url })}
                            companyId={companyId}
                            fieldKey={`${selectedSemanticModule.id}:${itemPath(index, "image")}`}
                            {...mediaPositionControl(itemPath(index, "image"), item.imagePosition, (imagePosition) => updateItem(index, { imagePosition }))}
                          />
                        </Box>
                        <TextField
                          size="small"
                          label="Image alt text"
                          value={item.imageAlt || ""}
                          onChange={(event) => updateItem(index, { imageAlt: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "imageAlt") }}
                        />
                      </>
                    ) : null}
                    {selectedSemanticModule.type === "reviews" ? (
                      <>
                        <Box data-module-field-path={itemPath(index, "image")}>
                          <ImageField
                            label="Testimonial image"
                            value={item.image || item.imageUrl || ""}
                            onChange={(url) => updateItem(index, { image: url, imageUrl: url })}
                            companyId={companyId}
                            fieldKey={`${selectedSemanticModule.id}:${itemPath(index, "image")}`}
                            {...mediaPositionControl(itemPath(index, "image"), item.imagePosition, (imagePosition) => updateItem(index, { imagePosition }))}
                          />
                        </Box>
                        <TextField
                          size="small"
                          label="Testimonial image alt text"
                          value={item.imageAlt || ""}
                          onChange={(event) => updateItem(index, { imageAlt: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "imageAlt") }}
                        />
                      </>
                    ) : null}
                    {selectedSemanticModule.type === "beforeAfter" ? (
                      <>
                        <Box data-module-field-path={itemPath(index, "beforeImage")}>
                          <ImageField
                            label="Before image"
                            value={item.beforeImage || ""}
                            onChange={(url) => updateItem(index, { beforeImage: url })}
                            companyId={companyId}
                            fieldKey={`${selectedSemanticModule.id}:${itemPath(index, "beforeImage")}`}
                            {...mediaPositionControl(itemPath(index, "beforeImage"), item.beforeImagePosition, (beforeImagePosition) => updateItem(index, { beforeImagePosition }))}
                          />
                        </Box>
                        <Box data-module-field-path={itemPath(index, "afterImage")}>
                          <ImageField
                            label="After image"
                            value={item.afterImage || ""}
                            onChange={(url) => updateItem(index, { afterImage: url })}
                            companyId={companyId}
                            fieldKey={`${selectedSemanticModule.id}:${itemPath(index, "afterImage")}`}
                            {...mediaPositionControl(itemPath(index, "afterImage"), item.afterImagePosition, (afterImagePosition) => updateItem(index, { afterImagePosition }))}
                          />
                        </Box>
                        <TextField
                          size="small"
                          label="Before label"
                          value={item.beforeLabel || ""}
                          onChange={(event) => updateItem(index, { beforeLabel: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "beforeLabel") }}
                        />
                        <TextField
                          size="small"
                          label="After label"
                          value={item.afterLabel || ""}
                          onChange={(event) => updateItem(index, { afterLabel: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "afterLabel") }}
                        />
                      </>
                    ) : null}
                    {["gallery", "portfolio", "selectedCuts"].includes(selectedSemanticModule.type) ? (
                      <>
                        {["gallery", "portfolio"].includes(selectedSemanticModule.type) ? <TextField
                          size="small"
                          label={selectedSemanticModule.type === "portfolio" && String(currentStyleKey || "").trim().toLowerCase() === "frame-and-field" ? "Category / metadata" : "Caption"}
                          value={item.caption || ""}
                          onChange={(event) => updateItem(index, { caption: event.target.value, ...(selectedSemanticModule.type === "portfolio" ? { category: event.target.value } : {}) })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "caption") }}
                        /> : null}
                        <TextField
                          size="small"
                          label="Link"
                          value={item.href || item.link || ""}
                          onChange={(event) => updateItem(index, { href: event.target.value, link: event.target.value })}
                          fullWidth
                          inputProps={{ "data-module-field-path": itemPath(index, "href") }}
                        />
                      </>
                    ) : null}
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => moveItem(index, "up")} disabled={index === 0}>
                          Move up
                        </Button>
                        <Button size="small" variant="outlined" onClick={() => moveItem(index, "down")} disabled={index === items.length - 1}>
                          Move down
                        </Button>
                      </Stack>
                      <Button color="error" size="small" onClick={() => removeItem(index)}>
                        Remove item
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addItem}>
                Add item
              </Button>
            </Stack>}
          </>
        ) : null}
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button
              size="small"
              variant="outlined"
              startIcon={<UndoIcon />}
              onClick={undo}
              disabled={!canUndo}
            >
              Undo
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RedoIcon />}
              onClick={redo}
              disabled={!canRedo}
            >
              Redo
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => moveSemanticModule(selectedSemanticModule.id, "up")}
              disabled={!canMoveSemanticModule(selectedSemanticModule.id, "up")}
            >
              Move up
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => moveSemanticModule(selectedSemanticModule.id, "down")}
              disabled={!canMoveSemanticModule(selectedSemanticModule.id, "down")}
            >
              Move down
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => duplicateSemanticModule(selectedSemanticModule.id)}
            >
              Duplicate
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              color="warning"
              variant="outlined"
              onClick={() =>
                updateSemanticModule(selectedSemanticModule.id, (module) => ({
                  ...module,
                  enabled: module.enabled === false,
                }))
              }
            >
              {selectedSemanticModule.enabled === false ? "Show section" : "Hide section"}
            </Button>
            <Button size="small" color="error" variant="outlined" onClick={() => deleteSemanticModule(selectedSemanticModule.id)}>
              Remove section
            </Button>
          </Stack>
        </Stack>
      </Stack>
    );
  };

  return (
    <Stack spacing={1.5}>
    {!floating && (
    <CollapsibleSection
      id="page-style-card-wrapper"
      title={t("manager.visualBuilder.pageStyle.title")}
      description={t("manager.visualBuilder.pageStyle.description")}
      expanded={pageStyleOpen}
      onChange={(next) => {
        setPageStyleOpen(next);
        if (next && mode === "simple") setSelectedBlock(-1);
      }}
      defaultExpanded={false}
    >
      <PageStyleCard
        value={
          readPageStyleProps(editing) ||
          editing?.content?.meta?.pageStyle ||
          editing?.content?.style ||
          {}
        }
        isNextJsMode={isNextJsContentMode}
        nextJsThemeKey={currentStyleKey}
        nextJsThemeLabel={activeStyleChoice?.name || nextJsBrandingThemeName}
        nextJsThemeOverrides={themeOverridesDraft || {}}
        onChangeNextJsThemeOverrides={handleThemeOverridesDraftChange}
        onChange={(next) => {
          setEditing((cur) => {
            const content = { ...(cur.content || {}) };
            content.meta = { ...(content.meta || {}), pageStyle: next };
            content.style = { ...(content.style || {}), ...next };
            let updated = { ...cur, content };
            updated = writePageStyleProps(updated, next);
            return withLiftedLayout(updated);
          });
        }}
        onPickImage={(url) => {
          const next = {
            ...(readPageStyleProps(editing) ||
              editing?.content?.meta?.pageStyle ||
              editing?.content?.style ||
              {}),
            backgroundImage: url,
          };
          setEditing((cur) => {
            const content = { ...(cur.content || {}) };
            content.meta = { ...(content.meta || {}), pageStyle: next };
            content.style = { ...(content.style || {}), ...next };
            let updated = { ...cur, content };
            updated = writePageStyleProps(updated, next);
            return withLiftedLayout(updated);
          });
        }}
        applyToAll={applyPageStyleToAll}
        onToggleApplyToAll={setApplyPageStyleToAll}
        onApplyNow={
          isNextJsContentMode ? saveNextJsThemeOverrides : applyStyleToAllPagesNow
        }
        onApplyThemePreset={applyThemePreset}
        onApplyButtonStylePreset={applyButtonStylePreset}
        onApplyIndustryStarterPack={applyIndustryStarterPack}
        onReapplyThemeToChrome={reapplyThemeToChrome}
        onResetToSiteTheme={resetCurrentPageToSiteTheme}
        siteThemeSettings={siteThemeSettings}
        onToggleSyncChrome={(checked) => {
          handleSiteThemeSettingsChange({ syncChrome: Boolean(checked) });
          if (checked) {
            reapplyThemeToChrome();
          }
        }}
        canResetToSiteTheme
        companyId={companyId}
        onOpenAdvanced={() => {
          addSection("pageStyle");
          setTimeout(() => {
            document.getElementById("page-style-card")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 0);
        }}
      />
    </CollapsibleSection>
    )}

    {(isNextJsContentMode || mode !== "simple") && (
    <CollapsibleSection
      id={floating ? "floating-inspector-block" : "inspector-block"}
      title={t("manager.visualBuilder.inspector.title")}
      description={t("manager.visualBuilder.inspector.description")}
      expanded={floating || inspectorOpen}
      onChange={(next) => setInspectorOpen(next)}
      defaultExpanded={false}
      actions={
        <Tooltip title={t("manager.visualBuilder.sections.hint")}>
          <IconButton size="small" edge="end">
            <HelpOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      }
    >
      {isNextJsContentMode ? (
        renderSemanticModuleEditor()
      ) : selectedBlock < 0 ? (
        <Box sx={{ color: "text.secondary" }}>
          <Typography variant="body2">
            {t("manager.visualBuilder.sections.hint")}
          </Typography>
        </Box>
      ) : fi.inspectorMode === "inline" ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Inline inspector is active — edit controls are shown directly below the
          selected section on the canvas.
        </Alert>
      ) : (
        <>
          <Tabs
            value={inspectorTab}
            onChange={(_, v) => setInspectorTab(v)}
            variant="fullWidth"
            sx={{ mb: 1 }}
          >
            <Tab value="content" label="Content" />
            <Tab value="style" label="Style" />
            <Tab value="advanced" label="Advanced" />
          </Tabs>

          {inspectorTab === "content" && (
            <>
              {schemaForBlock ? (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                    Content
                  </Typography>
                  <SchemaInspector
                    schema={filteredSchemaForBlock}
                    value={safeSections(editing)[selectedBlock]?.props || {}}
                    onChange={(props) => setBlockPropsAll(selectedBlock, props)}
                    companyId={companyId}
                  />
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This section type isn’t mapped to a visual inspector yet.
                  {blockType ? (
                    <>
                      {" "}
                      Current type: <strong>{blockType}</strong>
                    </>
                  ) : null}{" "}
                  You can still edit its props below.
                </Alert>
              )}
            </>
          )}

          {inspectorTab === "style" && (
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" sx={{ opacity: 0.7 }}>
                  {t("manager.visualBuilder.inspector.sizeSpacing")}
                </Typography>
                {canResetSelectedBlockTheme && (
                  <Tooltip title="Clear block-level color overrides and follow the site theme again.">
                    <Button size="small" variant="text" onClick={resetSelectedBlockToSiteTheme}>
                      Reset block to site theme
                    </Button>
                  </Tooltip>
                )}
                <Tooltip title={t("manager.visualBuilder.inspector.resetTooltip")}>
                  <Button
                    size="small"
                    onClick={() => {
                      const all = safeSections(editing);
                      const blk = all[selectedBlock];
                      if (!blk) return;
                      const defaultPy = blk.type === "hero" ? 0 : 32;
                      setEditing((cur) => {
                        const sections = [...safeSections(cur)];
                        const b = { ...sections[selectedBlock] };
                        b.sx = { ...(b.sx || {}), py: defaultPy };
                        b.props = { ...(b.props || {}) };
                        delete b.props.spaceAbove;
                        delete b.props.spaceBelow;
                        sections[selectedBlock] = b;
                        return withLiftedLayout({
                          ...cur,
                          content: { ...(cur.content || {}), sections },
                        });
                      });
                    }}
                  >
                    {t("manager.visualBuilder.inspector.reset")}
                  </Button>
                </Tooltip>
              </Stack>

              {(() => {
                const blk = safeSections(editing)[selectedBlock] || {};
                const currentPy =
                  Number(blk?.sx?.py ?? (blk?.type === "hero" ? 0 : 32));
                const spaceAboveUnits =
                  Number.isFinite(blk?.props?.spaceAbove) ? Number(blk.props.spaceAbove) : 0;
                const spaceBelowUnits =
                  Number.isFinite(blk?.props?.spaceBelow) ? Number(blk.props.spaceBelow) : 0;

                return (
                  <Stack spacing={2} sx={{ mt: 1.5 }}>
                    {(hasBackgroundImage || selectedProps.backgroundColor) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Background
                        </Typography>
                        {hasBackgroundImage && (
                          <ImageField
                            label="Background image"
                            value={
                              selectedProps.backgroundUrl ||
                              selectedProps.image ||
                              selectedProps.backgroundImage ||
                              ""
                            }
                            onChange={(url) =>
                              setBlockProp(
                                selectedBlock,
                                selectedProps.backgroundUrl ? "backgroundUrl" : "backgroundImage",
                                url
                              )
                            }
                            companyId={companyId}
                          />
                        )}
                        {selectedProps.backgroundColor && (
                          <Box sx={{ mt: 1 }}>
                            {colorField({
                              label: "Background color",
                              value: selectedProps.backgroundColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "backgroundColor", val),
                            })}
                          </Box>
                        )}
                      </Box>
                    )}

                    {(selectedProps.headingColor || selectedProps.bodyColor || selectedProps.linkColor) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Typography
                        </Typography>
                        <Stack spacing={1}>
                          {selectedProps.headingColor &&
                            colorField({
                              label: "Heading color",
                              value: selectedProps.headingColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "headingColor", val),
                            })}
                          {selectedProps.bodyColor &&
                            colorField({
                              label: "Body color",
                              value: selectedProps.bodyColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "bodyColor", val),
                            })}
                          {selectedProps.linkColor &&
                            colorField({
                              label: "Link color",
                              value: selectedProps.linkColor,
                              onChange: (val) =>
                                setBlockProp(selectedBlock, "linkColor", val),
                            })}
                        </Stack>
                      </Box>
                    )}

                    {(selectedProps.cardShadow || selectedProps.cardRadius || selectedProps.cardBlur) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Card / Container
                        </Typography>
                        {selectedProps.cardRadius != null && (
                          <Stack spacing={1}>
                            <Typography variant="caption" color="text.secondary">
                              Card radius (px)
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                size="small"
                                min={0}
                                max={32}
                                step={1}
                                value={Number(selectedProps.cardRadius) || 0}
                                valueLabelDisplay="auto"
                                onChange={(_, val) =>
                                  typeof val === "number" &&
                                  setBlockProp(selectedBlock, "cardRadius", val)
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                value={Number(selectedProps.cardRadius) || 0}
                                onChange={(e) =>
                                  setBlockProp(
                                    selectedBlock,
                                    "cardRadius",
                                    Number(e.target.value || 0)
                                  )
                                }
                                inputProps={{ step: 1, min: 0, max: 32 }}
                                sx={{ width: 90 }}
                              />
                            </Stack>
                          </Stack>
                        )}
                        {selectedProps.cardBlur != null && (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Card blur (px)
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                size="small"
                                min={0}
                                max={30}
                                step={1}
                                value={Number(selectedProps.cardBlur) || 0}
                                valueLabelDisplay="auto"
                                onChange={(_, val) =>
                                  typeof val === "number" &&
                                  setBlockProp(selectedBlock, "cardBlur", val)
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                value={Number(selectedProps.cardBlur) || 0}
                                onChange={(e) =>
                                  setBlockProp(
                                    selectedBlock,
                                    "cardBlur",
                                    Number(e.target.value || 0)
                                  )
                                }
                                inputProps={{ step: 1, min: 0, max: 30 }}
                                sx={{ width: 90 }}
                              />
                            </Stack>
                          </Stack>
                        )}
                        {selectedProps.cardShadow != null && (
                          <Stack spacing={1} sx={{ mt: 1 }}>
                            <FormControl size="small" fullWidth>
                              <InputLabel>Card shadow preset</InputLabel>
                              <Select
                                label="Card shadow preset"
                                value={cardShadowPreset}
                                onChange={(e) => {
                                  const key = e.target.value;
                                  if (key === "custom") return;
                                  const preset = shadowPresets.find((p) => p.key === key);
                                  setBlockProp(selectedBlock, "cardShadow", preset ? preset.value : "");
                                }}
                              >
                                {shadowPresets.map((preset) => (
                                  <MenuItem key={preset.key} value={preset.key}>
                                    {preset.label}
                                  </MenuItem>
                                ))}
                                <MenuItem value="custom">Custom</MenuItem>
                              </Select>
                              <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
                            </FormControl>
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setCardShadowBuilderOpen((prev) => !prev)}
                              >
                                {cardShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
                              </Button>
                            </Stack>
                            {cardShadowBuilderOpen && (
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1}>
                                  <TextField
                                    size="small"
                                    label="X"
                                    type="number"
                                    value={cardShadowValues.x}
                                    onChange={(e) => updateCardShadow({ x: Number(e.target.value || 0) })}
                                  />
                                  <TextField
                                    size="small"
                                    label="Y"
                                    type="number"
                                    value={cardShadowValues.y}
                                    onChange={(e) => updateCardShadow({ y: Number(e.target.value || 0) })}
                                  />
                                  <TextField
                                    size="small"
                                    label="Blur"
                                    type="number"
                                    value={cardShadowValues.blur}
                                    onChange={(e) => updateCardShadow({ blur: Number(e.target.value || 0) })}
                                  />
                                  <TextField
                                    size="small"
                                    label="Spread"
                                    type="number"
                                    value={cardShadowValues.spread}
                                    onChange={(e) => updateCardShadow({ spread: Number(e.target.value || 0) })}
                                  />
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  {colorField({
                                    label: "Shadow color",
                                    value: cardShadowValues.color,
                                    onChange: (val) => updateCardShadow({ color: val }),
                                  })}
                                  <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                                    <Typography variant="caption">Opacity</Typography>
                                    <Slider
                                      size="small"
                                      min={0}
                                      max={1}
                                      step={0.05}
                                      value={cardShadowValues.opacity}
                                      valueLabelDisplay="auto"
                                      onChange={(_, val) =>
                                        typeof val === "number" && updateCardShadow({ opacity: val })
                                      }
                                    />
                                  </Stack>
                                </Stack>
                              </Stack>
                            )}
                            {cardShadowPreset === "custom" && (
                              <TextField
                                size="small"
                                label="Card shadow (CSS)"
                                value={selectedProps.cardShadow || ""}
                                onChange={(e) =>
                                  setBlockProp(selectedBlock, "cardShadow", e.target.value)
                                }
                                placeholder="0 8px 24px rgba(0,0,0,0.12)"
                                error={!isShadowValid(selectedProps.cardShadow || "")}
                                helperText={
                                  isShadowValid(selectedProps.cardShadow || "")
                                    ? "Example: 0 8px 24px rgba(0,0,0,0.12)"
                                    : "Enter a valid CSS shadow."
                                }
                                fullWidth
                              />
                            )}
                          </Stack>
                        )}
                      </Box>
                    )}

                    {selectedProps.heroHeadingShadow != null && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Hero heading shadow
                        </Typography>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Hero shadow preset</InputLabel>
                          <Select
                            label="Hero shadow preset"
                            value={heroShadowPreset}
                            onChange={(e) => {
                              const key = e.target.value;
                              if (key === "custom") return;
                              const preset = shadowPresets.find((p) => p.key === key);
                              setBlockProp(
                                selectedBlock,
                                "heroHeadingShadow",
                                preset ? preset.value : ""
                              );
                            }}
                          >
                            {shadowPresets.map((preset) => (
                              <MenuItem key={preset.key} value={preset.key}>
                                {preset.label}
                              </MenuItem>
                            ))}
                            <MenuItem value="custom">Custom</MenuItem>
                          </Select>
                          <FormHelperText>Pick a preset or customize with the builder.</FormHelperText>
                        </FormControl>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setHeroShadowBuilderOpen((prev) => !prev)}
                          >
                            {heroShadowBuilderOpen ? "Hide builder" : "Shadow builder"}
                          </Button>
                        </Stack>
                        {heroShadowBuilderOpen && (
                          <Stack spacing={1}>
                            <Stack direction="row" spacing={1}>
                              <TextField
                                size="small"
                                label="X"
                                type="number"
                                value={heroShadowValues.x}
                                onChange={(e) => updateHeroShadow({ x: Number(e.target.value || 0) })}
                              />
                              <TextField
                                size="small"
                                label="Y"
                                type="number"
                                value={heroShadowValues.y}
                                onChange={(e) => updateHeroShadow({ y: Number(e.target.value || 0) })}
                              />
                              <TextField
                                size="small"
                                label="Blur"
                                type="number"
                                value={heroShadowValues.blur}
                                onChange={(e) => updateHeroShadow({ blur: Number(e.target.value || 0) })}
                              />
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {colorField({
                                label: "Shadow color",
                                value: heroShadowValues.color,
                                onChange: (val) => updateHeroShadow({ color: val }),
                              })}
                              <Stack spacing={0.5} sx={{ minWidth: 140 }}>
                                <Typography variant="caption">Opacity</Typography>
                                <Slider
                                  size="small"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={heroShadowValues.opacity}
                                  valueLabelDisplay="auto"
                                  onChange={(_, val) =>
                                    typeof val === "number" && updateHeroShadow({ opacity: val })
                                  }
                                />
                              </Stack>
                            </Stack>
                            <Paper variant="outlined" sx={{ p: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{ textShadow: selectedProps.heroHeadingShadow || "none" }}
                              >
                                Shadow preview text
                              </Typography>
                            </Paper>
                          </Stack>
                        )}
                        {heroShadowPreset === "custom" && (
                          <TextField
                            size="small"
                            label="Hero heading shadow (CSS)"
                            value={selectedProps.heroHeadingShadow || ""}
                            onChange={(e) =>
                              setBlockProp(selectedBlock, "heroHeadingShadow", e.target.value)
                            }
                            error={!isShadowValid(selectedProps.heroHeadingShadow || "")}
                            helperText={
                              isShadowValid(selectedProps.heroHeadingShadow || "")
                                ? "Example: 0 2px 24px rgba(0,0,0,0.25)"
                                : "Enter a valid CSS shadow."
                            }
                            fullWidth
                          />
                        )}
                      </Box>
                    )}

                    {(selectedProps.overlayGradient != null ||
                      selectedProps.brightness != null) && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Background overlay
                        </Typography>
                        <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                          <InputLabel>Overlay preset</InputLabel>
                          <Select
                            label="Overlay preset"
                            value={overlayGradientPreset}
                            onChange={(e) => {
                              const key = e.target.value;
                              if (key === "custom") return;
                              const preset = overlayGradientPresets.find((p) => p.key === key);
                              setBlockProp(
                                selectedBlock,
                                "overlayGradient",
                                preset ? preset.value : ""
                              );
                            }}
                          >
                            {overlayGradientPresets.map((preset) => (
                              <MenuItem key={preset.key} value={preset.key}>
                                {preset.label}
                              </MenuItem>
                            ))}
                            <MenuItem value="custom">Custom</MenuItem>
                          </Select>
                          <FormHelperText>Choose a preset or build your own gradient.</FormHelperText>
                        </FormControl>

                        <Stack spacing={1}>
                          <Typography variant="caption" color="text.secondary">
                            Angle
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Slider
                              size="small"
                              min={0}
                              max={360}
                              value={overlayAngle}
                              valueLabelDisplay="auto"
                              onChange={(_, val) =>
                                typeof val === "number" && updateOverlayAngle(val)
                              }
                              sx={{ flex: 1 }}
                            />
                            <TextField
                              size="small"
                              value={overlayAngle}
                              onChange={(e) => {
                                const num = Number(e.target.value);
                                if (Number.isFinite(num)) updateOverlayAngle(Math.max(0, Math.min(360, num)));
                              }}
                              sx={{ width: 90 }}
                            />
                          </Stack>
                        </Stack>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {overlayStops.map((stop, idx) => (
                            <Stack key={idx} direction="row" spacing={1} alignItems="center">
                              {colorField({
                                label: `Stop ${idx + 1}`,
                                value: stop.color,
                                onChange: (val) => updateOverlayStop(idx, { color: val }),
                              })}
                              <TextField
                                size="small"
                                label="%"
                                value={stop.stop}
                                onChange={(e) =>
                                  updateOverlayStop(idx, {
                                    stop: Math.max(0, Math.min(100, Number(e.target.value || 0))),
                                  })
                                }
                                sx={{ width: 80 }}
                              />
                              <Stack spacing={0.5} sx={{ minWidth: 120 }}>
                                <Typography variant="caption">Opacity</Typography>
                                <Slider
                                  size="small"
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={stop.opacity}
                                  valueLabelDisplay="auto"
                                  onChange={(_, val) =>
                                    typeof val === "number" && updateOverlayStop(idx, { opacity: val })
                                  }
                                />
                              </Stack>
                            </Stack>
                          ))}
                        </Stack>

                        {overlayGradientPreset === "custom" && (
                          <TextField
                            size="small"
                            label="Overlay gradient CSS"
                            value={overlayGradientValue}
                            onChange={(e) =>
                              setBlockProp(selectedBlock, "overlayGradient", e.target.value)
                            }
                            placeholder="linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))"
                            error={!isGradientValid(overlayGradientValue)}
                            helperText={
                              isGradientValid(overlayGradientValue)
                                ? "Example: linear-gradient(180deg, rgba(0,0,0,.15), rgba(0,0,0,.6))"
                                : "Enter a valid linear-gradient(...) string."
                            }
                            fullWidth
                          />
                        )}

                        {selectedProps.brightness != null && (
                          <Stack spacing={1} sx={{ mt: 2 }}>
                            <Stack direction="row" justifyContent="space-between">
                              <Typography variant="caption" color="text.secondary">
                                Background brightness
                              </Typography>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => setBlockProp(selectedBlock, "brightness", 1)}
                              >
                                Reset
                              </Button>
                            </Stack>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Slider
                                size="small"
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                value={brightnessValue}
                                valueLabelDisplay="auto"
                                onChange={(_, val) =>
                                  typeof val === "number" &&
                                  setBlockProp(selectedBlock, "brightness", Math.max(0.5, Math.min(1.5, val)))
                                }
                                sx={{ flex: 1 }}
                              />
                              <TextField
                                size="small"
                                value={brightnessValue}
                                onChange={(e) =>
                                  setBlockProp(
                                    selectedBlock,
                                    "brightness",
                                    Math.max(0.5, Math.min(1.5, Number(e.target.value || 1)))
                                  )
                                }
                                sx={{ width: 90 }}
                              />
                            </Stack>
                            <FormHelperText>1.0 = original brightness</FormHelperText>
                          </Stack>
                        )}

                        <Paper
                          variant="outlined"
                          sx={{
                            mt: 2,
                            p: 1,
                            height: 80,
                            borderRadius: 1,
                            background:
                              overlayGradientValue ||
                              "linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6))",
                            filter: `brightness(${brightnessValue})`,
                          }}
                        >
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Overlay preview
                          </Typography>
                        </Paper>
                      </Box>
                    )}

                    <Box>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">{t("manager.visualBuilder.inspector.sectionPadding")}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {currentPy}px
                        </Typography>
                      </Stack>
                      <Slider
                        size="small"
                        min={0}
                        max={200}
                        step={4}
                        value={currentPy}
                        valueLabelDisplay="auto"
                        marks={[
                          { value: 0, label: "0" },
                          { value: 16, label: "16" },
                          { value: 32, label: "32" },
                          { value: 64, label: "64" },
                          { value: 96, label: "96" },
                          { value: 128, label: "128" },
                        ]}
                        onChange={(_, v) => {
                          const py = Number(v || 0);
                          setEditing((cur) => {
                            const sections = [...safeSections(cur)];
                            const b = { ...sections[selectedBlock] };
                            b.sx = { ...(b.sx || {}), py };
                            sections[selectedBlock] = b;
                            return withLiftedLayout({
                              ...cur,
                              content: { ...(cur.content || {}), sections },
                            });
                          });
                        }}
                      />
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">
                          {t("manager.visualBuilder.inspector.spaceAbove")}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {spaceAboveUnits}u
                        </Typography>
                      </Stack>
                      <Slider
                        size="small"
                        min={0}
                        max={12}
                        step={1}
                        value={spaceAboveUnits}
                        valueLabelDisplay="auto"
                        marks={[0, 2, 4, 6, 8, 10, 12].map((v) => ({ value: v, label: String(v) }))}
                        onChange={(_, v) =>
                          setBlockProp(selectedBlock, "spaceAbove", Number(v))
                        }
                      />
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        Tip: {t("manager.visualBuilder.pages.settings.sectionSpacing.hint")}
                      </Typography>
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">
                          {t("manager.visualBuilder.inspector.spaceBelow")}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {spaceBelowUnits}u
                        </Typography>
                      </Stack>
                      <Slider
                        size="small"
                        min={0}
                        max={12}
                        step={1}
                        value={spaceBelowUnits}
                        valueLabelDisplay="auto"
                        marks={[0, 2, 4, 6, 8, 10, 12].map((v) => ({ value: v, label: String(v) }))}
                        onChange={(_, v) =>
                          setBlockProp(selectedBlock, "spaceBelow", Number(v))
                        }
                      />
                    </Box>
                  </Stack>
                );
              })()}
            </Box>
          )}

          {inspectorTab === "advanced" && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.7 }}>
                {t("manager.visualBuilder.inspector.advanced")}
              </Typography>
              <SectionInspector
                block={safeSections(editing)[selectedBlock]}
                onChangeProp={(k, v) => setBlockProp(selectedBlock, k, v)}
                onChangeProps={(np) => setBlockPropsAll(selectedBlock, np)}
                companyId={companyId}
              />
            </Box>
          )}
        </>
      )}
    </CollapsibleSection>
    )}
    </Stack>
  );
}


  const builderColumns = isLgDown ? (
    <Stack spacing={2}>
      <Box>{LeftColumn}</Box>
      <Box>{CanvasColumn}</Box>
    </Stack>
  ) : (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={4}>
        <Box
          sx={{
            position: "sticky",
            top: 16,
            maxHeight: "calc(100vh - 180px)",
            overflowY: "auto",
            pr: 1,
          }}
        >
          {LeftColumn}
        </Box>
      </Grid>
      <Grid item xs={12} lg={8}>
        {CanvasColumn}
      </Grid>
    </Grid>
  );

  const StyleTabContent = StyleChooserBlock;

const tabs = [
  {
    label: "Website Content",
    content: (
      <Stack spacing={2}>
        {ControlsCard}
        {AlertsCard}
        {builderColumns}
      </Stack>
    ),
  },
  {
    label: "Website Style",
    content: StyleTabContent,
  },
];

const builderTabDefaultIndex = builderTabIndex;

const disablePublish = busy || !companyId;
const floatingPublishText = hasDraftChanges
  ? t(
      "manager.visualBuilder.controls.publishFloatingPending",
      "Publish your latest edits"
    )
  : t(
      "manager.visualBuilder.controls.publishFloatingReady",
      "Publish site"
    );

// ---------- Step 4: loading gate ----------
if (loading) {
  return <div className="p-6 text-sm text-gray-500">{t("manager.visualBuilder.load.loading")}</div>;
}

// ---------- Step 5: auth error panel ----------
if (authError) {
  const next = `/manage/website/builder?company_id=${encodeURIComponent(authError.cid)}&site=${encodeURIComponent(authError.slug)}`;
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-2">{t("manager.visualBuilder.auth.title")}</h2>
      <p className="text-sm text-gray-600 mb-4">
        {t("manager.visualBuilder.auth.body", { code: authError.code })}
      </p>
      <a
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-block px-4 py-2 rounded bg-blue-600 text-white"
      >
        {t("manager.visualBuilder.auth.login")}
      </a>
      <div className="mt-3 text-xs text-gray-500">
        <Trans
          i18nKey="manager.visualBuilder.auth.tip"
          values={{ companyId: String(authError.cid) }}
          components={{ code: <code className="ml-1" /> }}
        />
      </div>
    </div>
  );
}

  return (
    <>
      <TabShell
        key={`builder-tab-${builderTabDefaultIndex}`}
        title={t("manager.visualBuilder.shell.title")}
        description={t("manager.visualBuilder.shell.description")}
        tabs={tabs}
        defaultIndex={builderTabDefaultIndex}
      />

      <Dialog
        open={Boolean(pendingRendererStyle)}
        onClose={() => !styleSaving && setPendingRendererStyle(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isNextJsStyle(pendingRendererStyle)
            ? "Switch to the Modern editor?"
            : "Return to the Classic editor?"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2">
              {isNextJsStyle(pendingRendererStyle)
                ? "Your website content will be preserved and the selected Modern theme will be applied to your draft. Some Classic-only presentation settings may look different in the Modern editor."
                : "Your website content will remain available, but Modern theme layout and theme-specific presentation settings will not appear in the Classic editor."}
            </Typography>
            <Alert severity="info" variant="outlined">
              Your live website will not change until you publish. An automatic safety version will be saved before the editor changes.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRendererStyle(null)} disabled={styleSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmRendererSwitch} disabled={styleSaving}>
            {styleSaving ? "Switching..." : "Switch Draft Editor"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(styleMsg)}
        autoHideDuration={8000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={(_event, reason) => {
          if (reason !== "clickaway") setStyleMsg("");
        }}
      >
        <Alert severity="success" variant="filled" onClose={() => setStyleMsg("")}>
          {styleMsg}
        </Alert>
      </Snackbar>

      {pageSettingsDirty && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 88, md: 110 },
            right: { xs: 16, md: 40 },
            zIndex: (theme) => theme.zIndex.tooltip + 2,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 1,
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1,
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600 }}
            >
              Unsaved page settings
            </Typography>
            <Button
              size="small"
              variant="outlined"
              disabled={busy || !companyId}
              onClick={discardPageSettings}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={busy || !companyId}
              onClick={savePageMeta}
            >
              Save
            </Button>
          </Paper>
        </Box>
      )}

      {companyId && (
        <Box
          sx={{
            position: "fixed",
            bottom: { xs: 24, md: 36 },
            right: { xs: 16, md: 40 },
            zIndex: (theme) => theme.zIndex.tooltip + 1,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 1,
              px: 2,
              py: 1,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.18)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Typography
              variant="body2"
              sx={{ display: { xs: "none", sm: "block" }, fontWeight: 600 }}
            >
              {floatingPublishText}
            </Typography>
            <Tooltip title={t("manager.visualBuilder.controls.tooltips.publish")}>
              <span>
                <Button
                  size="small"
                  startIcon={<PublishIcon />}
                  variant="contained"
                  disabled={disablePublish}
                  onClick={onPublish}
                >
                  {t("manager.visualBuilder.controls.buttons.publish")}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={t("manager.visualBuilder.controls.tooltips.unpublish", "Unpublish website")}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  disabled={disablePublish}
                  onClick={onUnpublish}
                >
                  {t("manager.visualBuilder.controls.buttons.unpublish", "Unpublish")}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={t("manager.visualBuilder.controls.tooltips.viewLive", "View live site")}>
              <span>
                <Button
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  variant="outlined"
                  disabled={!liveSiteUrl}
                  onClick={() => {
                    if (!liveSiteUrl) return;
                    window.open(liveSiteUrl, "_blank", "noopener,noreferrer");
                  }}
                >
                  {t("manager.visualBuilder.controls.buttons.viewLive", "View live")}
                </Button>
              </span>
            </Tooltip>
          </Paper>
        </Box>
      )}

      {/* Floating panel (single instance) */}
      {isNextJsContentMode && semanticFloatingInspectorOpen && selectedModule ? (
        <FloatingInspector.Panel
          fi={fi}
          forceOpen
          selectedIndex={selectedModuleIndex}
          selectedBlockObj={selectedModule}
          panelTitle={`Floating editor — ${semanticModuleDisplayLabel(selectedModule)}`}
          panelWidth={460}
          anchorSide="right"
          onClose={() => setSemanticFloatingInspectorOpen(false)}
        >
          <InspectorColumn floating />
        </FloatingInspector.Panel>
      ) : null}
      {!isNextJsContentMode && <FloatingInspector.Panel
        fi={fi}
        selectedIndex={selectedBlock}
        selectedBlockObj={selectedBlockObj}
        schemaForBlock={schemaForBlock}
        companyId={companyId}
        onChangeProps={(np) => setBlockPropsAll(selectedBlock, np)}
        onChangeProp={(k, v) => setBlockProp(selectedBlock, k, v)}
        onClose={() => setSelectedBlock(-1)}
        renderAdvancedEditor={({ block, onChangeProps, onChangeProp }) => (
          <SectionInspector
            block={block}
            onChangeProp={onChangeProp}
            onChangeProps={onChangeProps}
            companyId={companyId}
          />
        )}
      />}

      <Drawer
        anchor="right"
        open={isLgDown && inspectorDrawerOpen}
        onClose={() => setInspectorDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { lg: "none" } }}
      >
        <Box sx={{ width: { xs: "90vw", sm: 420 }, maxWidth: 480, p: 2 }}>
          <InspectorColumn />
        </Box>
      </Drawer>

      {/* THEME DRAWER */}
      <Drawer
        anchor="right"
        open={themeOpen}
        onClose={() => {
          setThemeOpen(false);
          if (companyId) {
            wb
              .getSettings(companyId)
              .then((s) => {
                setSiteSettings(s?.data || null);
              })
              .catch(() => {});
          }
        }}
      >
        <Box sx={{ width: { xs: "90vw", sm: 420, md: 480 }, maxWidth: 520, p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            {t("manager.visualBuilder.drawer.themeDesignerTitle")}
          </Typography>
          <ThemeDesigner companyId={companyId} page="home" />
        </Box>
      </Drawer>

      {/* HELP DRAWER (left) — NEW */}
      <WebsiteBuilderHelpDrawer
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        anchor="left" // keep right side free for the inspector
        onJumpToPageStyle={handleJumpToPageStyle}
        onJumpToNavSettings={handleJumpToNav}
        onJumpToAssets={handleJumpToAssets}
      />

      <Dialog
        open={newArticleDialogOpen}
        onClose={() => !busy && setNewArticleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create article draft</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Alert severity="info" variant="outlined">
              This creates an unpublished WebsitePage article using the selected theme. It will stay out of the public sitemap until you publish it.
            </Alert>
            <TextField
              autoFocus
              required
              fullWidth
              size="small"
              label="Article title"
              value={newArticleDraft.title}
              onChange={(event) => {
                const title = event.target.value;
                setNewArticleDraft((current) => ({
                  ...current,
                  title,
                  slug: current.slugTouched ? current.slug : slugifyWebsiteArticle(title),
                }));
              }}
              placeholder="How to choose the right service"
            />
            <TextField
              fullWidth
              size="small"
              label="Article URL"
              value={newArticleDraft.slug}
              onChange={(event) =>
                setNewArticleDraft((current) => ({
                  ...current,
                  slug: slugifyWebsiteArticle(event.target.value.replace(/^\/?blog\//i, "")),
                  slugTouched: true,
                }))
              }
              InputProps={{ startAdornment: <InputAdornment position="start">/blog/</InputAdornment> }}
              helperText="Generated from the title. You can change it now; avoid changing it after publishing."
            />
            <TextField
              fullWidth
              size="small"
              multiline
              minRows={2}
              label="Search description"
              value={newArticleDraft.description}
              onChange={(event) =>
                setNewArticleDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Briefly explain the question this article answers."
              helperText="Used as the starting SEO and social description; review it before publishing."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewArticleDialogOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createBlogPost}
            disabled={busy || !String(newArticleDraft.title || "").trim()}
          >
            {busy ? "Creating…" : "Create draft"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={blockPreview.open}
        onClose={closeBlockPreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          {blockPreview.label || "Block preview"}
          <IconButton
            onClick={closeBlockPreview}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {blockPreview.src ? (
            <Box
              component="img"
              src={blockPreview.src}
              alt={`${blockPreview.label || "Block"} preview`}
              sx={{
                width: "100%",
                height: "auto",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={checkpointDialog.open}
        onClose={closeCheckpointDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {checkpointDialog.mode === "delete"
            ? "Delete website version"
            : checkpointDialog.publishNow
            ? "Restore & Publish"
            : "Restore to draft"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography variant="body2">
              {checkpointDialog.mode === "delete"
                ? `Delete "${checkpointDialog.checkpoint?.name || "Website version"}"? This cannot be undone.`
                : checkpointDialog.publishNow
                ? `Restore "${checkpointDialog.checkpoint?.name || "Website version"}" and publish it to the live site?`
                : `Restore "${checkpointDialog.checkpoint?.name || "Website version"}" to the current draft?`}
            </Typography>
            {checkpointDialog.mode === "delete" && checkpointDialog.checkpoint?.protected ? (
              <Alert severity="warning">This is a protected approved design. Protected versions are never pruned automatically.</Alert>
            ) : checkpointDialog.mode === "restore" ? (
              <Alert severity={checkpointDialog.publishNow ? "warning" : "info"}>
                The current draft will be replaced. A rollback version is saved automatically first. Operational records and form submissions are not changed.
              </Alert>
            ) : null}
            {checkpointDialog.mode === "restore" && !checkpointDialog.publishNow && Number(checkpointDialog.checkpoint?.missing_tenant_media_count || 0) > 0 ? (
              <Alert severity="warning">Missing tenant media will remain as warnings in the restored draft. Review the normal site preview before publishing.</Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCheckpointDialog} disabled={busy}>Cancel</Button>
          <Button
            onClick={confirmCheckpointAction}
            color={checkpointDialog.mode === "delete" ? "error" : "primary"}
            variant="contained"
            disabled={busy}
          >
            {checkpointDialog.mode === "delete"
              ? "Delete version"
              : checkpointDialog.publishNow
              ? "Restore & Publish"
              : "Restore to draft"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={checkpointPreview.open}
        onClose={() => setCheckpointPreview({ open: false, loading: false, error: "", checkpoint: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Inspect version</DialogTitle>
        <DialogContent dividers>
          {checkpointPreview.loading ? (
            <Typography variant="body2">Loading website version...</Typography>
          ) : checkpointPreview.error ? (
            <Alert severity="error">{checkpointPreview.error}</Alert>
          ) : (
            <Stack spacing={1}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {checkpointPreview.checkpoint?.name || "Website version"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatCheckpointTimestamp(checkpointPreview.checkpoint?.created_at)}
              </Typography>
              {checkpointPreview.checkpoint?.note ? (
                <Typography variant="body2">{checkpointPreview.checkpoint.note}</Typography>
              ) : null}
              <Divider />
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={checkpointKindLabel(checkpointPreview.checkpoint?.checkpoint_kind)} />
                {checkpointPreview.checkpoint?.protected ? <Chip size="small" color="success" label="Protected" /> : null}
                {checkpointPreview.checkpoint?.theme_key ? <Chip size="small" variant="outlined" label={`Theme: ${checkpointPreview.checkpoint.theme_key}`} /> : null}
                {checkpointCounts(checkpointPreview.checkpoint).map((count) => (
                  <Chip key={count.label} size="small" variant="outlined" label={`${count.label}: ${count.value}`} />
                ))}
              </Stack>
              {Array.isArray(checkpointPreview.checkpoint?.validation_warnings) && checkpointPreview.checkpoint.validation_warnings.length ? (
                <Alert severity="warning">{checkpointPreview.checkpoint.validation_warnings.join(" ")}</Alert>
              ) : null}
              {Array.isArray(checkpointPreview.checkpoint?.warnings) && checkpointPreview.checkpoint.warnings.length ? (
                <Alert severity="warning">{checkpointPreview.checkpoint.warnings.join(" ")}</Alert>
              ) : null}
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Pages in this version
              </Typography>
              <List dense sx={{ maxHeight: 280, overflowY: "auto" }}>
                {Array.isArray(checkpointPreview.checkpoint?.snapshot?.pages) &&
                checkpointPreview.checkpoint.snapshot.pages.length > 0 ? (
                  checkpointPreview.checkpoint.snapshot.pages.map((p, idx) => (
                    <ListItem key={`${p?.slug || "page"}-${idx}`} disablePadding>
                      <ListItemText
                        primary={p?.title || p?.slug || `Page ${idx + 1}`}
                        secondary={`${p?.locale || "en"} • ${p?.slug || "—"}${p?.is_homepage ? " • homepage" : ""}`}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem disablePadding>
                    <ListItemText primary="No pages found in this version." />
                  </ListItem>
                )}
              </List>
              <Grid container spacing={1}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Forms</Typography>
                  {(checkpointPreview.checkpoint?.snapshot?.forms || []).map((form) => (
                    <Typography key={form.key} variant="caption" display="block">
                      {form.name || form.key} • {(form.fields || []).length} field(s)
                    </Typography>
                  ))}
                  {!(checkpointPreview.checkpoint?.snapshot?.forms || []).length ? <Typography variant="caption">No forms captured.</Typography> : null}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Menus & redirects</Typography>
                  {(checkpointPreview.checkpoint?.snapshot?.menus || []).map((menu) => (
                    <Typography key={menu.key} variant="caption" display="block">
                      {menu.name || menu.key} • {(menu.items || []).length} item(s)
                    </Typography>
                  ))}
                  <Typography variant="caption" display="block">
                    {(checkpointPreview.checkpoint?.snapshot?.redirects || []).length} redirect(s)
                  </Typography>
                </Grid>
              </Grid>
              <Alert severity={checkpointPublishBlocked(checkpointPreview.checkpoint) ? "warning" : "success"}>
                {checkpointPublishBlocked(checkpointPreview.checkpoint)
                  ? "Restore & Publish is currently blocked because required tenant media is missing. Restore to draft remains available."
                  : "This version can be restored to draft or restored and published."}
              </Alert>
              <Typography variant="caption" color="text.secondary">
                Inspect version shows structured design data only. Use Restore to draft, then the signed Next.js preview, for a visual review.
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckpointPreview({ open: false, loading: false, error: "", checkpoint: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
