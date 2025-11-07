// src/App.js
import React, { useState, useMemo, createContext, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, useParams, Navigate, matchPath } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, Toolbar, Typography } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";

// ðŸŽ¨ Themes
import {
  coolTheme, darkTheme, navyTheme, sunsetTheme,
  aquaTheme, forestTheme, roseTheme, slateTheme,
  goldTheme, skyTheme, lavenderTheme, mintTheme, coralTheme,
  crimsonTheme, charcoalTheme, coffeeTheme, sunflowerTheme, eggplantTheme,
  emeraldNightTheme,
} from "./theme";

import { getTenantHostMode } from "./utils/tenant";

// Components
import NavBar from "./NavBar";
import Footer from "./components/Footer";
import PublicLayout from "./layouts/PublicLayout";
import ThemeSwitcher from "./components/ui/ThemeSwitcher";
import HomePage from "./landing/pages/HomePage";
import PricingPage from "./landing/pages/PricingPage";
import FeaturePage from "./landing/pages/FeaturePage";
import DocsPage from "./landing/pages/DocsPage";
import StatusPage from "./landing/pages/StatusPage";
import BlogPage from "./landing/pages/BlogPage";
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
import MarketingHubPage from "./landing/pages/marketing/MarketingHubPage";
import MarketingCampaignsPage from "./landing/pages/marketing/MarketingCampaignsPage";
import MarketingAnalyticsPage from "./landing/pages/marketing/MarketingAnalyticsPage";
import MarketingClientsPage from "./landing/pages/marketing/MarketingClientsPage";
import TermsPage from "./landing/pages/legal/TermsPage";
import PrivacyPage from "./landing/pages/legal/PrivacyPage";
import CookiePolicyPage from "./landing/pages/legal/CookiePolicyPage";
import AcceptableUsePage from "./landing/pages/legal/AcceptableUsePage";
import DataProcessingAddendumPage from "./landing/pages/legal/DataProcessingAddendumPage";
import SecurityPage from "./landing/pages/legal/SecurityPage";
import UserAgreementPage from "./landing/pages/legal/UserAgreementPage";
import CanadaPayrollPage from "./landing/pages/payroll/CanadaPayrollPage";
import USPayrollPage from "./landing/pages/payroll/USPayrollPage";
import ROEToolPage from "./landing/pages/payroll/ROEToolPage";
import T4ToolPage from "./landing/pages/payroll/T4ToolPage";
import W2ToolPage from "./landing/pages/payroll/W2ToolPage";
import PayslipPortalPage from "./landing/pages/payroll/PayslipPortalPage";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import RecruiterDashboard from "./RecruiterDashboard";
import RecruiterInvitationsPage from "./pages/recruiter/RecruiterInvitationsPage";
import RecruiterQuestionnairesPage from "./pages/recruiter/RecruiterQuestionnairesPage";
import RecruiterUpcomingMeetingsPage from "./pages/recruiter/RecruiterUpcomingMeetingsPage";
import ManagerDashboard from "./ManagerDashboard";
import CandidateBooking from "./CandidateBooking";
import CancelBooking from "./CancelBooking";
import CalendarView from "./CalendarView";
import AnalyticsDashboard from "./AnalyticsDashboard";
import JobOpenings from "./JobOpenings";
import CandidateManagement from "./CandidateManagement";
import InterviewStages from "./InterviewStages";
import RecruiterCandidates from "./RecruiterCandidates";
import ChatBot from "./components/ui/ChatBot";
import RecruiterStats from "./RecruiterStats";
import AuditHistory from "./components/AuditHistory";
import MonthlyAttendanceCalendar from "./components/MonthlyAttendanceCalendar";
import AddRecruiter from "./AddRecruiter";
import EmployeeShiftView from "./pages/sections/EmployeeShiftView";
import SecondEmployeeShiftView from "./pages/sections/SecondEmployeeShiftView";
import CompanyProfile from "./pages/sections/CompanyProfile";
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
import ClientCancelBooking from "./pages/client/ClientCancelBooking";
import { ClientRescheduleGateway, ClientCancelGateway } from "./pages/client/ClientBookingGateways";
import CandidateIntakePage from "./pages/CandidateIntakePage";
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
import EnterpriseAnalytics from "./pages/sections/management/EnterpriseAnalytics";
import MarketingCouponBridge from "./pages/client/MarketingCouponBridge";
import LayoutTuningLab from "./pages/sections/management/LayoutTuningLab";

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
};

const MARKETING_PATHS = [
  '/',
  '/features',
  '/platform',
  '/pricing',
  '/website-builder',
  '/booking',
  '/booking/salon',
  '/booking/spa',
  '/booking/tutor',
  '/booking/doctor',
  '/marketing',
  '/marketing/email-campaigns',
  '/marketing/analytics-dashboard',
  '/marketing/clients-360',
  '/payroll/canada',
  '/payroll/usa',
  '/payroll/tools/roe',
  '/payroll/tools/t4',
  '/payroll/tools/w2',
  '/payslips',
  '/about',
  '/contact',
  '/faq',
  '/docs',
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
];

const RESERVED_SLUG_PREFIXES = new Set([
  'about',
  'acceptable-use',
  'admin',
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
        const res = await fetch(`/api/public/${encodeURIComponent(slug)}/website`, { credentials: "same-origin" });
        const data = await res.json();
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
  const location = useLocation();
  const isMarketingRoute = MARKETING_PATHS.includes(location.pathname);
  const slugMatch = matchPath({ path: '/:slug/*' }, location.pathname) || matchPath({ path: '/:slug' }, location.pathname);
  const slugCandidate = slugMatch?.params?.slug?.toLowerCase();
  const isCompanyRoute = Boolean(slugCandidate && !RESERVED_SLUG_PREFIXES.has(slugCandidate));
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

  const showChatBot = !isEmbed && MARKETING_PATHS.includes(location.pathname);
  const showAppChrome = !isEmbed && !isMarketingRoute && !isCompanyRoute;

  const content = (
    <>
      {showAppChrome && <ThemeSwitcher />}
      {showAppChrome && (
        <>
          <NavBar token={token} setToken={setToken} />
          <Toolbar />
        </>
      )}

      <Box className="main-content">
        <Routes>

          {/* Marketing site */}
          <Route element={<PublicLayout token={token} setToken={setToken} />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/features" element={<FeaturePage />} />
            <Route path="/platform" element={<PlatformPage />} />
            <Route path="/website-builder" element={<WebsiteBuilderPage />} />
            <Route path="/booking" element={<BookingHubPage />} />
            <Route path="/booking/salon" element={<SalonBookingPage />} />
            <Route path="/booking/spa" element={<SpaBookingPage />} />
            <Route path="/booking/tutor" element={<TutorBookingPage />} />
            <Route path="/booking/doctor" element={<DoctorBookingPage />} />
            <Route path="/marketing" element={<MarketingHubPage />} />
            <Route path="/marketing/email-campaigns" element={<MarketingCampaignsPage />} />
            <Route path="/marketing/analytics-dashboard" element={<MarketingAnalyticsPage />} />
            <Route path="/marketing/clients-360" element={<MarketingClientsPage />} />
            <Route path="/payroll/canada" element={<CanadaPayrollPage />} />
            <Route path="/payroll/usa" element={<USPayrollPage />} />
            <Route path="/payroll/tools/roe" element={<ROEToolPage />} />
            <Route path="/payroll/tools/t4" element={<T4ToolPage />} />
            <Route path="/payroll/tools/w2" element={<W2ToolPage />} />
            <Route path="/payslips" element={<PayslipPortalPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/client-journey" element={<ClientJourneyPage />} />
            <Route path="/blog/category/:slug" element={<BlogCategoryPage />} />
            <Route path="/status" element={<StatusPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/user-agreement" element={<UserAgreementPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cookie" element={<CookiePolicyPage />} />
            <Route path="/acceptable-use" element={<AcceptableUsePage />} />
            <Route path="/data-processing" element={<DataProcessingAddendumPage />} />
            <Route path="/security" element={<SecurityPage />} />
          </Route>
          {/* Auth */}
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password/temp" element={<ResetPassword />} />
          <Route path="/apply/:token" element={<CandidateIntakePage />} />

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
          <Route path="/recruiter/questionnaires" element={<RecruiterQuestionnairesPage token={token} />} />
        <Route path="/recruiter/upcoming-meetings" element={<RecruiterUpcomingMeetingsPage token={token} />} />
        <Route path="/recruiter/*" element={<RecruiterDashboard token={token} />} />
          <Route path="/recruiter/candidates/:email" element={<RecruiterCandidates token={token} />} />
          <Route path="/recruiter/candidates" element={<RecruiterCandidates token={token} />} />
          <Route path="/recruiter-stats/:recruiterId" element={<RecruiterStats token={token} />} />
          <Route path="/recruiter/my-shifts" element={<SecondEmployeeShiftView />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard token={token} />} />
          <Route path="/manager/candidates" element={<CandidateManagement token={token} />} />
          <Route path="/manager/job-openings" element={<JobOpenings />} />
          <Route path="/manager/candidates-management" element={<CandidateManagement />} />
          <Route path="/manager/interview-stages" element={<InterviewStages />} />
          <Route path="/manager/add-member" element={<AddRecruiter />} />
          <Route path="/manager/add-recruiter" element={<AddRecruiter />} />
          <Route path="/manager/payroll" element={<Payroll token={token} />} />
          <Route path="/manager/employee-profiles" element={<EmployeeProfileForm token={token} />} />
          <Route path="/manager/service-management" element={<ServiceManagement />} />
          <Route path="/manager/employee-availability" element={<EmployeeAvailabilityManagement />} />
          <Route path="/manager/audit-history" element={<AuditHistory />} />
          <Route path="/manager/attendance-calendar" element={<MonthlyAttendanceCalendar />} />
          <Route path="/manager/employee-shift-view" element={<EmployeeShiftView />} />
          <Route path="/manager/payments" element={<ManagerPaymentsView token={token} />} />
          <Route path="/manager/analytics" element={<EnterpriseAnalytics />} />

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
      {!isEmbed && showChatBot && <ChatBot token={token} />}
    </>
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
    const theme = themeMap[themeName] || coolTheme;
    if (tenantHostMode === "custom") {
      // TODO: custom domain routing will adjust theming/entrypoints per tenant host.
    }
    return theme;
  }, [themeName, tenantHostMode]);

  return (
    <ThemeModeContext.Provider value={{ themeName, setThemeName }}>
      <ThemeProvider theme={baseTheme}>
        <CssBaseline />
        <Router>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
            <AppContent token={token} setToken={setToken} />
          </SnackbarProvider>
        </Router>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default App;
