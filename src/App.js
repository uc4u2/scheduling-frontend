// src/App.js
import React, { useState, useMemo, createContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate, matchPath } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, Toolbar, Typography } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import RouteTracker from "./analytics/RouteTracker";

// ðŸŽ¨ Themes
import {
  coolTheme, darkTheme, navyTheme, sunsetTheme,
  aquaTheme, forestTheme, roseTheme, slateTheme,
  goldTheme, skyTheme, lavenderTheme, mintTheme, coralTheme,
  crimsonTheme, charcoalTheme, coffeeTheme, sunflowerTheme, eggplantTheme,
  emeraldNightTheme,
  slateDuskTheme,
  tealTwilightTheme,
  cinderBlueTheme,
  amberSmokeTheme,
  plumMistTheme,
} from "./theme";

import { getTenantHostMode } from "./utils/tenant";
import api, { publicSite } from "./utils/api";

// Components
import MainNav from "./landing/components/MainNav";
import Footer from "./components/Footer";
import PublicLayout from "./layouts/PublicLayout";
import HomePage from "./landing/pages/HomePage";
import PricingPage from "./landing/pages/PricingPage";
import BillingUpgradeController from "./components/billing/BillingUpgradeController";
import { BillingBannerProvider } from "./components/billing/BillingBannerContext";
import BillingSuccessPage from "./pages/billing/BillingSuccessPage";
import BillingCancelPage from "./pages/billing/BillingCancelPage";
import FeaturePage from "./landing/pages/FeaturePage";
import WorkforcePage from "./landing/pages/WorkforcePage";
import ZapierPage from "./landing/pages/ZapierPage";
import DocsPage from "./landing/pages/DocsPage";
import StatusPage from "./landing/pages/StatusPage";
import BlogPage from "./landing/pages/BlogPage";
import DemoPage from "./landing/pages/DemoPage";
import StaffingFormulasPage from "./landing/pages/resources/StaffingFormulasPage";
import PayrollComplianceWebinarPage from "./landing/pages/webinars/PayrollComplianceWebinarPage";
import AboutPage from "./landing/pages/AboutPage";
import ContactPage from "./landing/pages/ContactPage";
import FAQPage from "./landing/pages/FAQPage";
import WebsiteBuilderPage from "./landing/pages/WebsiteBuilderPage";
import PlatformPage from "./landing/pages/PlatformPage";
import BookingHubPage from "./landing/pages/booking/BookingHubPage";
import SalonBookingPage from "./landing/pages/booking/SalonBookingPage";
import SpaBookingPage from "./landing/pages/booking/SpaBookingPage";
import TutorBookingPage from "./landing/pages/booking/TutorBookingPage";
import DoctorBookingPage from "./landing/pages/booking/DoctorBookingPage";
import BlogCategoryPage from "./landing/pages/blog/BlogCategoryPage";
import ClientJourneyPage from "./landing/pages/blog/ClientJourneyPage";
import BlogPostPage from "./landing/pages/blog/BlogPostPage";
import MarketingHubPage from "./landing/pages/marketing/MarketingHubPage";
import MarketingCampaignsPage from "./landing/pages/marketing/MarketingCampaignsPage";
import MarketingAnalyticsPage from "./landing/pages/marketing/MarketingAnalyticsPage";
import MarketingClientsPage from "./landing/pages/marketing/MarketingClientsPage";
import ComparisonPage from "./landing/pages/compare/ComparisonPage";
import CompareHubPage from "./landing/pages/compare/CompareHubPage";
import AlternativesHubPage from "./landing/pages/compare/AlternativesHubPage";
import PlatformAdminLogin from "./admin/PlatformAdminLogin";
import PlatformAdminShell from "./admin/PlatformAdminShell";
import SearchPage from "./admin/pages/SearchPage";
import Tenant360Page from "./admin/pages/Tenant360Page";
import SalesRepsPage from "./admin/pages/SalesRepsPage";
import SalesDealsPage from "./admin/pages/SalesDealsPage";
import SalesLedgerPage from "./admin/pages/SalesLedgerPage";
import AuditLogsPage from "./admin/pages/AuditLogsPage";
import SalesLogin from "./sales/SalesLogin";
import SalesForgotPassword from "./sales/SalesForgotPassword";
import SalesResetPassword from "./sales/SalesResetPassword";
import SalesShell from "./sales/SalesShell";
import SalesSummaryPage from "./sales/pages/SalesSummaryPage";
import SalesRepDealsPage from "./sales/pages/SalesDealsPage";
import SalesCustomersPage from "./sales/pages/SalesCustomersPage";
import SalesRepLedgerPage from "./sales/pages/SalesLedgerPage";
import SalesRepProfilePage from "./admin/pages/SalesRepProfilePage";
import TermsPage from "./landing/pages/legal/TermsPage";
import PrivacyPage from "./landing/pages/legal/PrivacyPage";
import CookiePolicyPage from "./landing/pages/legal/CookiePolicyPage";
import AcceptableUsePage from "./landing/pages/legal/AcceptableUsePage";
import DataProcessingAddendumPage from "./landing/pages/legal/DataProcessingAddendumPage";
import SecurityPage from "./landing/pages/legal/SecurityPage";
import UserAgreementPage from "./landing/pages/legal/UserAgreementPage";
import PayrollOverviewPage from "./landing/pages/payroll/PayrollOverviewPage";
import CanadaPayrollPage from "./landing/pages/payroll/CanadaPayrollPage";
import USPayrollPage from "./landing/pages/payroll/USPayrollPage";
import ROEToolPage from "./landing/pages/payroll/ROEToolPage";
import T4ToolPage from "./landing/pages/payroll/T4ToolPage";
import W2ToolPage from "./landing/pages/payroll/W2ToolPage";
import PayslipPortalPage from "./landing/pages/payroll/PayslipPortalPage";
import XeroCallback from "./pages/XeroCallback";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import RecruiterDashboard from "./RecruiterDashboard";
import RecruiterInvitationsPage from "./pages/recruiter/RecruiterInvitationsPage";
import RecruiterQuestionnairesPage from "./pages/recruiter/RecruiterQuestionnairesPage";
import RecruiterUpcomingMeetingsPage from "./pages/recruiter/RecruiterUpcomingMeetingsPage";
import RecruiterPublicLinkPage from "./pages/recruiter/PublicLinkPage";
import RecruiterMyTimePage from "./pages/recruiter/RecruiterMyTimePage";
import RecruiterCandidateSearchPage from "./pages/recruiter/RecruiterCandidateSearchPage";
import ManagerDashboard from "./ManagerDashboard";
import CandidateBooking from "./CandidateBooking";
import CancelBooking from "./CancelBooking";
import CalendarView from "./CalendarView";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ManagerJobOpeningsPage from "./pages/manager/ManagerJobOpeningsPage";
import CandidateManagement from "./CandidateManagement";
import InterviewStages from "./InterviewStages";
import RecruiterCandidates from "./RecruiterCandidates";
import ChatBot from "./components/ui/ChatBot";
import RecruiterStats from "./RecruiterStats";
import AuditHistory from "./components/AuditHistory";
import MonthlyAttendanceCalendar from "./components/MonthlyAttendanceCalendar";
import AddRecruiter from "./AddRecruiter";
import EmployeeShiftView from "./pages/sections/EmployeeShiftView";
import OnboardingPage from "./pages/sections/management/OnboardingPage";
import AttendanceReportPage from "./pages/sections/management/AttendanceReportPage";
import CompanyProfile from "./pages/sections/CompanyProfile";
import PayrollRawPage from "./pages/sections/PayrollRawPage";
import PayrollAuditPage from "./pages/sections/PayrollAuditPage";
import RetirementPlanPage from "./pages/sections/RetirementPlanPage";
import Payroll from "./pages/sections/Payroll";
import EmployeeProfileForm from "./pages/Payroll/EmployeeProfileForm";
import PayrollDownloadPage from "./pages/sections/PayrollDownloadPage";
import EmployeePayslipPortal from "./pages/sections/EmployeePayslipPortal";
import DashboardShellGate from "./pages/client/DashboardShellGate";

// Website management
import WebsiteBuilder from "./pages/sections/management/WebsiteBuilder";
import WebsiteManager from "./pages/sections/management/WebsiteManager";
import AutoSiteBuilder from "./pages/sections/management/AutoSiteBuilder";
import WebsiteTemplates from "./pages/sections/management/WebsiteTemplates";
import InlineSiteEditor from "./pages/sections/management/InlineSiteEditor";
import ServiceManagement from "./pages/sections/management/ServiceManagement";
import EmployeeAvailabilityManagement from "./pages/sections/management/EmployeeAvailabilityManagement";
import StripeConnectReturn from "./pages/sections/management/StripeConnectReturn";
// UI Enhancements

// CLIENT PORTAL (canonical public page)
import CompanyPublic from "./pages/client/CompanyPublic";
import PublicClientAuth from "./pages/client/PublicClientAuth";
import PublicPageShell from "./pages/client/PublicPageShell";
import ServiceList from "./pages/client/ServiceList";
import ServiceDetails from "./pages/client/ServiceDetails";
import EmployeeList from "./pages/client/EmployeeList";
import EmployeeProfile from "./pages/client/EmployeeProfile";
import EmployeeBooking from "./pages/client/EmployeeBooking";
import BookingConfirmation from "./pages/client/BookingConfirmation";
import ClientBookingHistory from "./pages/client/ClientBookingHistory";
import ClientPaymentMethods from "./pages/client/ClientPaymentMethods";
import ClientPackages from "./pages/client/ClientPackages";
import ClientProfileSettings from "./pages/client/ClientProfileSettings";
import ClientReviews from "./pages/client/ClientReviews";
import ClientSupport from "./pages/client/ClientSupport";
import MeetWithArtistPage from "./pages/client/MeetWithArtistPage";
import ClientCancelBooking from "./pages/client/ClientCancelBooking";
import { ClientRescheduleGateway, ClientCancelGateway } from "./pages/client/ClientBookingGateways";
import CandidateIntakePage from "./pages/CandidateIntakePage";
import PublicJobsListPage from "./pages/public/PublicJobsListPage";
import PublicJobDetailPage from "./pages/public/PublicJobDetailPage";
import DocumentRequestUploadPage from "./pages/public/DocumentRequestUploadPage";
import CandidateLoginCallbackPage from "./pages/candidate/CandidateLoginCallbackPage";
import CandidateDashboardPage from "./pages/candidate/CandidateDashboardPage";
import ClientRescheduleBooking from "./pages/client/ClientRescheduleBooking";
import Checkout from "./pages/client/Checkout";
import ProductList from "./pages/client/ProductList";
import ProductDetails from "./pages/client/ProductDetails";
import MyBasket from "./pages/client/MyBasket";
import PublicReview from "./pages/client/PublicReview";
import PublicReviewList from "./pages/client/PublicReviewList";
import PublicTip from "./pages/client/PublicTip";
import { useEmbedConfig } from "./embed";
import ManagerPaymentsView from "./pages/sections/management/ManagerPaymentsView";
import KioskPayPage from "./pages/kiosk/KioskPayPage";
import KioskSuccessPage from "./pages/kiosk/KioskSuccessPage";
import EnterpriseAnalytics from "./pages/sections/management/EnterpriseAnalytics";
import MarketingCouponBridge from "./pages/client/MarketingCouponBridge";
import LayoutTuningLab from "./pages/sections/management/LayoutTuningLab";
import DomainHelpPage from "./landing/pages/help/DomainHelpPage";
import EnterpriseRetirementHelp from "./pages/help/EnterpriseRetirementHelp";
import IndustryDirectoryPage from "./landing/pages/IndustryDirectoryPage";

export const ThemeModeContext = createContext({
  themeName: "sunset",
  setThemeName: () => {},
});

const themeMap = {
  cool: coolTheme, dark: darkTheme, navy: navyTheme, sunset: sunsetTheme,
  aqua: aquaTheme, forest: forestTheme, rose: roseTheme, slate: slateTheme,
  gold: goldTheme, sky: skyTheme, lavender: lavenderTheme, mint: mintTheme,
  coral: coralTheme, crimson: crimsonTheme, charcoal: charcoalTheme,
  coffee: coffeeTheme, sunflower: sunflowerTheme, eggplant: eggplantTheme,
  emeraldNight: emeraldNightTheme,
  slateDusk: slateDuskTheme,
  tealTwilight: tealTwilightTheme,
  cinderBlue: cinderBlueTheme,
  amberSmoke: amberSmokeTheme,
  plumMist: plumMistTheme,
};

const MARKETING_PATHS = [
  '/',
  '/features',
  '/platform',
  '/pricing',
  '/website-builder',
  '/workforce',
  '/booking',
  '/booking/salon',
  '/booking/spa',
  '/booking/tutor',
  '/booking/doctor',
  '/marketing',
  '/marketing/email-campaigns',
  '/marketing/analytics-dashboard',
  '/marketing/clients-360',
  '/zapier',
  '/payroll',
  '/payroll/canada',
  '/payroll/usa',
  '/payroll/tools/roe',
  '/payroll/tools/t4',
  '/payroll/tools/w2',
  '/payslips',
  '/compare/adp',
  '/compare/gusto',
  '/about',
  '/contact',
  '/demo',
  '/faq',
  '/docs',
  '/help/domains',
  '/blog',
  '/blog/category/automation',
  '/blog/category/payroll',
  '/status',
  '/terms',
  '/privacy',
  '/cookie',
  '/acceptable-use',
  '/data-processing',
  '/security',
  '/user-agreement',
  '/industries',
];

const RESERVED_SLUG_PREFIXES = new Set([
  'about',
  'acceptable-use',
  'admin',
  'sales',
  'analytics',
  'apply',
  'book-slot',
  'calendar',
  'cancel-booking',
  'client',
  'contact',
  'faq',
  'cookie',
  'dashboard',
  'data-processing',
  'forgot-password',
  'login',
  'manage',
  'manager',
  'booking',
  'payroll',
  'payslips',
  'pricing',
  'website-builder',
  'privacy',
  'recruiter',
  'recruiter-stats',
  'register',
  'reset-password',
  'security',
  'settings',
  'employee',
  'terms',
]);

// simple contrast helper
function pickTextOnBg(hex = "#1976d2") {
  const x = hex.replace("#", "");
  const r = parseInt(x.substring(0, 2), 16);
  const g = parseInt(x.substring(2, 4), 16);
  const b = parseInt(x.substring(4, 6), 16);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#111" : "#fff";
}


// Blocks a page if the feature is disabled in the public website payload.
// If disabled, it redirects to "/:slug".
const FeatureGate = ({ feature, children }) => {
  const { slug } = useParams();
  const [allow, setAllow] = React.useState(null); // null = loading

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Public, no headers needed
        const res = await api.get(`/api/public/${encodeURIComponent(slug)}/website`, {
          withCredentials: true,
        });
        const data = res.data;
        const nav = data?.nav_overrides || data?.settings?.nav_overrides || {};
        const allowed =
          feature === "services"
            ? false
            : feature === "reviews"
              ? nav.show_reviews_tab !== false
              : true;
        if (!cancelled) setAllow(allowed);
      } catch {
        // If we fail to read settings, default to allowing (or set to false if you prefer to block on error)
        if (!cancelled) setAllow(true);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, feature]);

  if (allow === null) return null; // or a spinner
  if (!allow) {
    if (feature === "services") {
      return <Navigate to={`/${slug}?page=services-classic`} replace />;
    }
    return <Navigate to={`/${slug}`} replace />;
  }
  return <>{children}</>;
};


const AppContent = ({ token, setToken }) => {
  const hostMode = getTenantHostMode(window.location.host);
  const isCustomDomain = hostMode === "custom";
  const [tenantSlug, setTenantSlug] = useState(null);
  const [tenantLoaded, setTenantLoaded] = useState(!isCustomDomain);
  const [chatbotConfig, setChatbotConfig] = useState(null);
  const [chatbotConfigLoaded, setChatbotConfigLoaded] = useState(false);
  const location = useLocation();
  const isMarketingRoute = MARKETING_PATHS.includes(location.pathname);
  const isApplyRoute = Boolean(matchPath({ path: "/apply/:token" }, location.pathname));
  const isPublicJobsRoute = Boolean(
    matchPath({ path: "/public/:companySlug/jobs" }, location.pathname) ||
      matchPath({ path: "/public/:companySlug/jobs/:jobSlug" }, location.pathname)
  );
  const isCandidatePortalRoute = Boolean(matchPath({ path: "/candidate/*" }, location.pathname));
  const isDocumentRequestRoute = Boolean(matchPath({ path: "/document-request/:token" }, location.pathname));
  const isMeetRoute = Boolean(matchPath({ path: "/:slug/meet/:token" }, location.pathname));
  const isKioskRoute = Boolean(matchPath({ path: "/kiosk/*" }, location.pathname));
  const isNoChromeRoute =
    isApplyRoute ||
    isPublicJobsRoute ||
    isCandidatePortalRoute ||
    isDocumentRequestRoute ||
    isMeetRoute ||
    isKioskRoute;
  const slugMatch = matchPath({ path: '/:slug/*' }, location.pathname) || matchPath({ path: '/:slug' }, location.pathname);
  const slugCandidate = isMarketingRoute ? null : slugMatch?.params?.slug?.toLowerCase();
  const isCompanyRoute = Boolean(
    (isCustomDomain && tenantSlug) ||
    (slugCandidate && !RESERVED_SLUG_PREFIXES.has(slugCandidate))
  );
  const chatbotSlug = isCustomDomain
    ? tenantSlug
    : (slugCandidate && !RESERVED_SLUG_PREFIXES.has(slugCandidate) ? slugCandidate : null);
  // Use robust embed config from embed context / storage
  const { isEmbed, primary, text } = useEmbedConfig();

  // Runtime MUI theme when embedded
  const effectiveTheme = useMemo(() => {
    if (!isEmbed) return null;
    const contrast = pickTextOnBg(primary);
    return createTheme({
      palette: {
        mode: text === "dark" ? "dark" : "light",
        primary: { main: primary, contrastText: contrast },
        secondary: { main: primary },
      },
      components: {
        MuiAppBar: { styleOverrides: { colorPrimary: { backgroundColor: primary } } },
        MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
        MuiDialogTitle: { styleOverrides: { root: { background: "transparent" } } },
      },
    });
  }, [isEmbed, primary, text]);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--sched-primary", primary);
    r.setProperty("--sched-text", text);
    if (isEmbed) document.body.classList.add("embed");
    return () => document.body.classList.remove("embed");
  }, [isEmbed, primary, text]);

  useEffect(() => {
    if (!isCustomDomain || tenantLoaded) {
      document.documentElement.classList.remove("company-boot");
    }
  }, [isCustomDomain, tenantLoaded]);

  useEffect(() => {
    if (!isCustomDomain) return;
    let alive = true;
    setTenantLoaded(false);
    fetch("/public/tenant", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive) return;
        setTenantSlug(data?.ok ? data.slug : null);
      })
      .catch(() => {
        if (!alive) return;
        setTenantSlug(null);
      })
      .finally(() => {
        if (alive) setTenantLoaded(true);
      });
    return () => { alive = false; };
  }, [isCustomDomain]);

  useEffect(() => {
    if (!chatbotSlug) {
      return;
    }
    let alive = true;
    setChatbotConfigLoaded(false);
    publicSite
      .getChatbotConfig(chatbotSlug)
      .then((res) => {
        if (!alive) return;
        setChatbotConfig(res || null);
      })
      .catch(() => {
        if (!alive) return;
        setChatbotConfig(null);
      })
      .finally(() => {
        if (alive) setChatbotConfigLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [chatbotSlug]);

  if (isCustomDomain && !tenantLoaded) {
    return null;
  }

  const marketingChatbot = MARKETING_PATHS.includes(location.pathname);
  const tenantChatbotReady = Boolean(
    chatbotSlug && chatbotConfigLoaded && chatbotConfig && chatbotConfig.enabled === true
  );
  const showChatBot = !isEmbed && (marketingChatbot || tenantChatbotReady);
  const showAppChrome = !isEmbed && !isCompanyRoute && !isNoChromeRoute;

  const content = (
    <BillingBannerProvider>
      <BillingUpgradeController />
      {showAppChrome && (
        <>
          <MainNav token={token} setToken={setToken} />
        </>
      )}

      <Box className="main-content">
        <Routes>
          <Route path="/admin/login" element={<PlatformAdminLogin />} />
          <Route path="/admin" element={<PlatformAdminShell />}>
            <Route path="search" element={<SearchPage />} />
            <Route path="tenants/:companyId" element={<Tenant360Page />} />
            <Route path="sales/reps" element={<SalesRepsPage />} />
            <Route path="sales/reps/:repId" element={<SalesRepProfilePage />} />
            <Route path="sales/deals" element={<SalesDealsPage />} />
            <Route path="sales/ledger" element={<SalesLedgerPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="*" element={<SearchPage />} />
          </Route>
          <Route path="/sales/login" element={<SalesLogin />} />
          <Route path="/sales/forgot" element={<SalesForgotPassword />} />
          <Route path="/sales/reset" element={<SalesResetPassword />} />
          <Route path="/sales" element={<SalesShell />}>
            <Route path="summary" element={<SalesSummaryPage />} />
            <Route path="deals" element={<SalesRepDealsPage />} />
            <Route path="customers" element={<SalesCustomersPage />} />
            <Route path="ledger" element={<SalesRepLedgerPage />} />
            <Route path="*" element={<SalesSummaryPage />} />
          </Route>

          {isCustomDomain && tenantSlug && (
            <>
              <Route
                path="/login"
                element={
                  <PublicPageShell slugOverride={tenantSlug} activeKey="__login">
                    <PublicClientAuth slug={tenantSlug} />
                  </PublicPageShell>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicPageShell slugOverride={tenantSlug} activeKey="__login">
                    <PublicClientAuth slug={tenantSlug} />
                  </PublicPageShell>
                }
              />
              <Route path="/" element={<CompanyPublic slugOverride={tenantSlug} />} />
              <Route path="/jobs" element={<PublicJobsListPage slugOverride={tenantSlug} />} />
              <Route path="/jobs/:jobSlug" element={<PublicJobDetailPage slugOverride={tenantSlug} />} />
              <Route path="/services" element={<ServiceList slugOverride={tenantSlug} />} />
              <Route path="/services/:serviceId" element={<ServiceDetails slugOverride={tenantSlug} />} />
              <Route path="/services/:serviceId/employees" element={<EmployeeList slugOverride={tenantSlug} />} />
              <Route path="/services/:serviceId/employees/:employeeId" element={<EmployeeProfile slugOverride={tenantSlug} />} />
              <Route path="/products" element={<ProductList slugOverride={tenantSlug} />} />
              <Route path="/products/:productId" element={<ProductDetails slugOverride={tenantSlug} />} />
              <Route path="/basket" element={<MyBasket slugOverride={tenantSlug} />} />
              <Route path="/checkout" element={<Checkout slugOverride={tenantSlug} />} />
              <Route path="/checkout/return" element={<BookingConfirmation slugOverride={tenantSlug} />} />
              <Route path="/book/:employeeId/:serviceId" element={<EmployeeBooking slugOverride={tenantSlug} />} />
              <Route path="/book" element={<EmployeeBooking slugOverride={tenantSlug} />} />
              <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation slugOverride={tenantSlug} />} />
              <Route path="/cancel-booking/:bookingId" element={<ClientCancelBooking slugOverride={tenantSlug} />} />
              <Route path="/appointment-cancel/:bookingId" element={<ClientCancelBooking slugOverride={tenantSlug} />} />
              <Route path="/appointment-reschedule/:bookingId" element={<ClientRescheduleBooking slugOverride={tenantSlug} />} />
              <Route path="/meet/:artistId" element={<MeetWithArtistPage slugOverride={tenantSlug} />} />
              <Route path="/reviews" element={<PublicReviewList slugOverride={tenantSlug} />} />
              <Route path="/review/:appointmentId" element={<PublicReview slugOverride={tenantSlug} />} />
              <Route path="/tip/:appointmentId" element={<PublicTip slugOverride={tenantSlug} />} />
              <Route path="/:slug/*" element={<Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}

          {/* Marketing site */}
          {!isCustomDomain && (
            <Route element={<PublicLayout token={token} setToken={setToken} />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
          <Route path="/compare" element={<CompareHubPage />} />
          <Route path="/compare/:vendor" element={<ComparisonPage />} />
          <Route path="/alternatives" element={<AlternativesHubPage />} />
          <Route path="/alternatives/:vendor" element={<ComparisonPage pageType="alternatives" />} />
            <Route path="/payroll/gusto" element={<Navigate to="/compare/gusto" replace />} />
            <Route path="/payroll/adp" element={<Navigate to="/compare/adp" replace />} />
            <Route path="/features" element={<FeaturePage />} />
            <Route path="/platform" element={<PlatformPage />} />
            <Route path="/website-builder" element={<WebsiteBuilderPage />} />
            <Route path="/workforce" element={<WorkforcePage />} />
            <Route path="/booking" element={<BookingHubPage />} />
            <Route path="/booking/salon" element={<SalonBookingPage />} />
            <Route path="/booking/spa" element={<SpaBookingPage />} />
            <Route path="/booking/tutor" element={<TutorBookingPage />} />
            <Route path="/booking/doctor" element={<DoctorBookingPage />} />
            <Route path="/marketing" element={<MarketingHubPage />} />
            <Route path="/marketing/email-campaigns" element={<MarketingCampaignsPage />} />
            <Route path="/marketing/analytics-dashboard" element={<MarketingAnalyticsPage />} />
            <Route path="/marketing/clients-360" element={<MarketingClientsPage />} />
            <Route path="/zapier" element={<ZapierPage />} />
            <Route path="/industries" element={<IndustryDirectoryPage />} />
            <Route path="/payroll" element={<PayrollOverviewPage />} />
            <Route path="/payroll/canada" element={<CanadaPayrollPage />} />
            <Route path="/payroll/usa" element={<USPayrollPage />} />
            <Route path="/payroll/tools/roe" element={<ROEToolPage />} />
            <Route path="/payroll/tools/t4" element={<T4ToolPage />} />
          <Route path="/payroll/tools/w2" element={<W2ToolPage />} />
          <Route path="/payslips" element={<PayslipPortalPage />} />
          <Route path="/settings/zapier" element={<Navigate to="/manager/zapier" replace />} />
          <Route path="/xero/callback" element={<XeroCallback />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/resources/staffing-formulas" element={<StaffingFormulasPage />} />
            <Route path="/webinars/payroll-compliance" element={<PayrollComplianceWebinarPage />} />
            <Route path="/help/domains" element={<DomainHelpPage />} />
            <Route path="/help/enterprise-retirement" element={<EnterpriseRetirementHelp />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/client-journey" element={<ClientJourneyPage />} />
            <Route path="/blog/category/:slug" element={<BlogCategoryPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/user-agreement" element={<UserAgreementPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cookie" element={<CookiePolicyPage />} />
            <Route path="/acceptable-use" element={<AcceptableUsePage />} />
            <Route path="/data-processing" element={<DataProcessingAddendumPage />} />
            <Route path="/security" element={<SecurityPage />} />
            </Route>
          )}
          {/* Auth */}
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password/temp" element={<ResetPassword />} />
          <Route path="/billing/success" element={<BillingSuccessPage />} />
          <Route path="/billing/cancel" element={<BillingCancelPage />} />
          <Route path="/apply/:token" element={<CandidateIntakePage />} />
          <Route path="/document-request/:token" element={<DocumentRequestUploadPage />} />
          <Route path="/candidate/login/:token" element={<CandidateLoginCallbackPage />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
          <Route path="/public/:companySlug/jobs" element={<PublicJobsListPage />} />
          <Route path="/public/:companySlug/jobs/:jobSlug" element={<PublicJobDetailPage />} />
          <Route path="/:slug/jobs" element={<PublicJobsListPage />} />
          <Route path="/:slug/jobs/:jobSlug" element={<PublicJobDetailPage />} />

          {/* Client Public Booking Flow - specific routes first */}
          <Route path="/:slug/services" element={<ServiceList />} />
          <Route path="/:slug/services/:serviceId" element={<ServiceDetails />} />
          <Route path="/:slug/services/:serviceId/employees" element={<EmployeeList />} />
          <Route path="/:slug/services/:serviceId/employees/:employeeId" element={<EmployeeProfile />} />

          <Route path="/:slug/products" element={<ProductList />} />

          <Route path="/:slug/products/:productId" element={<ProductDetails />} />

          <Route path="/:slug/basket" element={<MyBasket />} />

          {/* Checkout */}
          <Route path="/:slug/checkout" element={<Checkout />} />

          {/* Booking */}
          <Route path="/client/book/:slug/:serviceId/:employeeId" element={<EmployeeBooking />} />
          <Route path="/:slug/book/:employeeId/:serviceId" element={<EmployeeBooking />} />
          <Route path="/:slug/book" element={<EmployeeBooking />} />

          {/* Booking confirmation & cancel */}
          <Route path="/client/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/:slug/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/:slug/checkout/return" element={<BookingConfirmation />} />
          <Route path="/client/cancel-booking/:bookingId" element={<ClientCancelBooking />} />
          <Route path="/:slug/cancel-booking/:bookingId" element={<ClientCancelBooking />} />
          <Route path="/:slug/appointment-cancel/:bookingId" element={<ClientCancelBooking />} />
          <Route path="/:slug/appointment-reschedule/:bookingId" element={<ClientRescheduleBooking />} />
          <Route path="/book-slot/:recruiterId/:token" element={<CandidateBooking />} />
          <Route path="/:slug/meet/:artistId" element={<MeetWithArtistPage />} />
          <Route path="/settings/payments/stripe/return" element={<StripeConnectReturn />} />
<Route path="/settings/payments/stripe/refresh" element={<StripeConnectReturn />} />
          {/* Website templates (manager) */}
          <Route path="/manager/website/templates" element={<WebsiteTemplates />} />

          {/* Client portal */}
          <Route path="/dashboard" element={<DashboardShellGate />} />
          <Route path="/client/bookings" element={<ClientBookingHistory />} />
          <Route path="/client/payments" element={<ClientPaymentMethods />} />
          <Route path="/client/packages" element={<ClientPackages />} />
          <Route path="/client/profile" element={<ClientProfileSettings />} />
          <Route path="/client/reviews" element={<ClientReviews />} />
          <Route path="/client/support" element={<ClientSupport />} />

          {/* Manager / Recruiter */}
          <Route path="/manager/website/inline" element={<InlineSiteEditor />} /> {/* Inline editor */}
          <Route path="/manage/website/builder" element={<AutoSiteBuilder />} />
          <Route path="/recruiter/invitations" element={<RecruiterInvitationsPage token={token} />} />
          <Route path="/employee/invitations" element={<RecruiterInvitationsPage token={token} />} />
          <Route path="/recruiter/questionnaires" element={<RecruiterQuestionnairesPage token={token} />} />
          <Route path="/employee/questionnaires" element={<RecruiterQuestionnairesPage token={token} />} />
          <Route path="/recruiter/upcoming-meetings" element={<RecruiterUpcomingMeetingsPage token={token} />} />
          <Route path="/employee/upcoming-meetings" element={<RecruiterUpcomingMeetingsPage token={token} />} />
          <Route path="/recruiter/public-link" element={<RecruiterPublicLinkPage token={token} />} />
          <Route path="/employee/public-link" element={<RecruiterPublicLinkPage token={token} />} />
          <Route path="/recruiter/candidate-search" element={<RecruiterCandidateSearchPage token={token} />} />
          <Route path="/employee/candidate-search" element={<RecruiterCandidateSearchPage token={token} />} />
        <Route path="/recruiter/my-time" element={<RecruiterMyTimePage token={token} />} />
        <Route path="/employee/my-time" element={<RecruiterMyTimePage token={token} />} />
        <Route path="/recruiter/my-shifts" element={<Navigate to="/recruiter/my-time" replace />} />
        <Route path="/employee/my-shifts" element={<Navigate to="/recruiter/my-time" replace />} />
        <Route path="/recruiter/*" element={<RecruiterDashboard token={token} />} />
        <Route path="/employee/*" element={<RecruiterDashboard token={token} />} />
          <Route path="/recruiter/candidates/:email" element={<RecruiterCandidates token={token} />} />
          <Route path="/employee/candidates/:email" element={<RecruiterCandidates token={token} />} />
          <Route path="/recruiter/candidates" element={<RecruiterCandidates token={token} />} />
          <Route path="/employee/candidates" element={<RecruiterCandidates token={token} />} />
          <Route path="/recruiter-stats/:recruiterId" element={<RecruiterStats token={token} />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard token={token} />} />
          <Route path="/manager/:view" element={<ManagerDashboard token={token} />} />
          <Route path="/manager/onboarding" element={<OnboardingPage />} />
          <Route
            path="/manager/attendance-summaries"
            element={<AttendanceReportPage />}
          />
          <Route path="/manager/candidates" element={<CandidateManagement token={token} />} />
          <Route path="/manager/job-openings" element={<ManagerJobOpeningsPage token={token} />} />
          <Route path="/manager/candidates-management" element={<CandidateManagement />} />
          <Route path="/manager/interview-stages" element={<InterviewStages />} />
          <Route path="/manager/add-member" element={<ManagerDashboard token={token} />} />
          <Route path="/manager/add-recruiter" element={<AddRecruiter />} />
          <Route path="/manager/payroll" element={<ManagerDashboard token={token} />} />
          <Route path="/manager/payroll/retirement" element={<RetirementPlanPage token={token} />} />
          <Route path="/manager/employee-profiles" element={<ManagerDashboard token={token} />} />
          <Route path="/manager/service-management" element={<ServiceManagement />} />
          <Route path="/manager/employee-availability" element={<EmployeeAvailabilityManagement />} />
          <Route path="/manager/audit-history" element={<AuditHistory />} />
          <Route path="/manager/attendance-calendar" element={<MonthlyAttendanceCalendar />} />
          <Route path="/manager/employee-shift-view" element={<EmployeeShiftView />} />
          <Route path="/manager/payments" element={<ManagerPaymentsView token={token} />} />
          <Route path="/manager/analytics" element={<EnterpriseAnalytics />} />

          {/* Kiosk checkout */}
          <Route path="/kiosk/pay/:token" element={<KioskPayPage />} />
          <Route path="/kiosk/success" element={<KioskSuccessPage />} />

          {/* Public reviews page (/:slug/reviews) */}
          <Route path="/:slug/reviews" element={<PublicReviewList />} />

          {/* Website manager/editor (manager) */}
          <Route path="/manager/website" element={<WebsiteManager />} />
          <Route path="/manager/website/editor" element={<WebsiteBuilder />} />

          {/* Marketing landing shortcuts to services */}
          <Route path="/:slug/vip" element={<MarketingCouponBridge to="?page=services-classic" />} />
          <Route path="/:slug/anniversary" element={<MarketingCouponBridge to="?page=services-classic" />} />
          <Route path="/:slug/book" element={<MarketingCouponBridge to="?page=services-classic" />} />

          {/* Admin / Payroll */}
          <Route path="/admin/CompanyProfile" element={<CompanyProfile />} />
          <Route path="/payroll/download/:id" element={<PayrollDownloadPage />} />
          <Route path="/payroll/portal" element={<EmployeePayslipPortal token={token} />} />
          <Route path="/manager/payroll/raw" element={<PayrollRawPage />} />
          <Route path="/manager/payroll/audit" element={<PayrollAuditPage />} />

          {/* Misc */}
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/analytics" element={<AnalyticsDashboard token={token} />} />          <Route path="/cancel-booking" element={<CancelBooking />} />
          <Route path="/cancel-booking/:token" element={<CancelBooking />} />
          <Route path="/:slug/review/:appointmentId" element={<PublicReview />} />
          <Route path="/:slug/tip/:appointmentId" element={<PublicTip />} />
          <Route path="/:slug/appointment-reschedule/:bookingId" element={<ClientRescheduleBooking />} />
          <Route path="/:slug/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
          <Route path="/manage/website/layout-lab" element={<LayoutTuningLab />} />

          {/* Canonical public page LAST so specific /:slug/... routes win */}
          <Route path="/client/reschedule" element={<ClientRescheduleGateway />} />
          <Route path="/client/cancel" element={<ClientCancelGateway />} />
          <Route path="/:slug" element={<CompanyPublic />} />

          {/* 404 */}
          <Route path="*" element={<Typography sx={{ mt: 5, textAlign: "center" }}>Page Not Found</Typography>} />
        </Routes>
      </Box>

      {showAppChrome && <Footer />}
      {!isEmbed && showChatBot && (
        <ChatBot
          token={token}
          companySlug={chatbotSlug}
          config={chatbotSlug ? chatbotConfig : null}
        />
      )}
    </BillingBannerProvider>
  );

  return effectiveTheme ? (
    <ThemeProvider theme={effectiveTheme}>
      <CssBaseline />
      {content}
    </ThemeProvider>
  ) : (
    <>{content}</>
  );
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [themeName, setThemeName] = useState(() => localStorage.getItem("theme") || "sunset");

  const tenantHostMode = useMemo(() => getTenantHostMode(), []);
  // TODO: custom domain routing (swap route tree when tenantHostMode === "custom")

  useEffect(() => {
    localStorage.setItem("theme", themeName);
  }, [themeName]);

  const baseTheme = useMemo(() => {
    if (tenantHostMode === "custom") {
      return coolTheme;
    }
    return themeMap[themeName] || coolTheme;
  }, [themeName, tenantHostMode]);

  return (
    <ThemeModeContext.Provider value={{ themeName, setThemeName }}>
      <ThemeProvider theme={baseTheme}>
        <CssBaseline />
        <Router>
          <RouteTracker />
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <AppContent token={token} setToken={setToken} />
          </SnackbarProvider>
        </Router>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default App;
