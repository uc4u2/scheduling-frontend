import React, { Suspense, useEffect, useLayoutEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { Box, CircularProgress, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { SnackbarProvider } from "notistack";

import RouteTracker from "./analytics/RouteTracker";
import { useEmbedConfig } from "./embed";
import { revealEmbeddedApplication } from "./embeddedApplicationVisibility";
import TenantTransactionalShell from "./pages/client/TenantTransactionalShell";
import { resolveTenantSlug } from "./utils/clientTenant";

const ServiceDetails = React.lazy(() => import("./pages/client/ServiceDetails"));
const EmployeeProfile = React.lazy(() => import("./pages/client/EmployeeProfile"));
const ProductDetails = React.lazy(() => import("./pages/client/ProductDetails"));
const MyBasket = React.lazy(() => import("./pages/client/MyBasket"));
const Checkout = React.lazy(() => import("./pages/client/Checkout"));
const EmployeeBooking = React.lazy(() => import("./pages/client/EmployeeBooking"));
const BookingConfirmation = React.lazy(() => import("./pages/client/BookingConfirmation"));

function LoadingTransaction() {
  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: 240 }}
    >
      <CircularProgress size={30} />
    </Box>
  );
}

function useTransactionalSlug() {
  const { slug: routeSlug } = useParams();
  const location = useLocation();
  return resolveTenantSlug({ routeSlug, search: location.search });
}

function ServiceDetailsRoute() {
  const slug = useTransactionalSlug();
  return (
    <TenantTransactionalShell slugOverride={slug} activeKey="__services" pagePath="services">
      <ServiceDetails slugOverride={slug} />
    </TenantTransactionalShell>
  );
}

function EmployeeProfileRoute() {
  const slug = useTransactionalSlug();
  return (
    <TenantTransactionalShell slugOverride={slug} activeKey="__services" pagePath="services">
      <EmployeeProfile slugOverride={slug} />
    </TenantTransactionalShell>
  );
}

function ProductDetailsRoute() {
  const slug = useTransactionalSlug();
  return <ProductDetails slugOverride={slug} />;
}

function BasketRoute() {
  const slug = useTransactionalSlug();
  return <MyBasket slugOverride={slug} />;
}

function CheckoutRoute() {
  const slug = useTransactionalSlug();
  return <Checkout slugOverride={slug} companySlug={slug} />;
}

function EmployeeBookingRoute() {
  const slug = useTransactionalSlug();
  return <EmployeeBooking slugOverride={slug} />;
}

function BookingConfirmationRoute() {
  const slug = useTransactionalSlug();
  return <BookingConfirmation slugOverride={slug} />;
}

function FullApplicationHandoff() {
  useEffect(() => {
    // A transactional action can legitimately navigate to login/account. A
    // full reload lets AppBootstrap select the complete runtime for that route.
    window.location.reload();
  }, []);
  return <LoadingTransaction />;
}

function EmbeddedThemeBoundary({ children }) {
  const { isEmbed, primary, text } = useEmbedConfig();
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: text === "dark" ? "dark" : "light",
          primary: { main: primary },
          secondary: { main: primary },
        },
        components: {
          MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
          MuiDialogTitle: { styleOverrides: { root: { background: "transparent" } } },
        },
      }),
    [primary, text]
  );

  useLayoutEffect(() => {
    // Custom-domain HTML starts hidden until the full App resolves its tenant.
    // The lightweight embedded runtime resolves the tenant from ?site= instead,
    // so it must release that same boot guard itself.
    revealEmbeddedApplication();
  }, []);

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--sched-primary", primary);
    rootStyle.setProperty("--sched-text", text);
    if (isEmbed) document.body.classList.add("embed");
    return () => document.body.classList.remove("embed");
  }, [isEmbed, primary, text]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

function TransactionalRoutes() {
  return (
    <EmbeddedThemeBoundary>
      <RouteTracker />
      <Suspense fallback={<LoadingTransaction />}>
        <Routes>
          <Route path="/services/:serviceId" element={<ServiceDetailsRoute />} />
          <Route path="/:slug/services/:serviceId" element={<ServiceDetailsRoute />} />
          <Route path="/services/:serviceId/employees/:employeeId" element={<EmployeeProfileRoute />} />
          <Route path="/:slug/services/:serviceId/employees/:employeeId" element={<EmployeeProfileRoute />} />
          <Route path="/products/:productId" element={<ProductDetailsRoute />} />
          <Route path="/:slug/products/:productId" element={<ProductDetailsRoute />} />
          <Route path="/basket" element={<BasketRoute />} />
          <Route path="/:slug/basket" element={<BasketRoute />} />
          <Route path="/checkout" element={<CheckoutRoute />} />
          <Route path="/:slug/checkout" element={<CheckoutRoute />} />
          <Route path="/checkout/return" element={<BookingConfirmationRoute />} />
          <Route path="/:slug/checkout/return" element={<BookingConfirmationRoute />} />
          <Route path="/book/:employeeId/:serviceId" element={<EmployeeBookingRoute />} />
          <Route path="/:slug/book/:employeeId/:serviceId" element={<EmployeeBookingRoute />} />
          <Route path="/book" element={<EmployeeBookingRoute />} />
          <Route path="/:slug/book" element={<EmployeeBookingRoute />} />
          <Route path="/client/book/:slug/:serviceId/:employeeId" element={<EmployeeBookingRoute />} />
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationRoute />} />
          <Route path="/:slug/booking-confirmation/:bookingId" element={<BookingConfirmationRoute />} />
          <Route path="/client/booking-confirmation/:bookingId" element={<BookingConfirmationRoute />} />
          <Route path="*" element={<FullApplicationHandoff />} />
        </Routes>
      </Suspense>
    </EmbeddedThemeBoundary>
  );
}

export default function EmbeddedTransactionalApp() {
  return (
    <Router>
      <SnackbarProvider maxSnack={3}>
        <TransactionalRoutes />
      </SnackbarProvider>
    </Router>
  );
}
