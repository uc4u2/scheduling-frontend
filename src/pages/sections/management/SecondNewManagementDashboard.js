// src/pages/sections/management/SecondNewManagementDashboard.js

import React, { useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {

  Box,

  Container,

  Tabs,

  Tab,

  Paper,

  Stack,

  Button,

  Alert,

  Typography,

  Divider,

  Dialog,

  DialogTitle,

  DialogContent,

  DialogActions,

  IconButton,

  useMediaQuery,

} from "@mui/material";

import { useTheme } from "@mui/material/styles";

import { Link as RouterLink } from "react-router-dom";



/* Icons */

import DesignServicesIcon from "@mui/icons-material/DesignServices";

import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";

import LocalOfferIcon from "@mui/icons-material/LocalOffer";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

import EventAvailableIcon from "@mui/icons-material/EventAvailable";

import Inventory2Icon from "@mui/icons-material/Inventory2";

import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

import AccessTimeIcon from "@mui/icons-material/AccessTime";

import ViewWeekIcon from "@mui/icons-material/ViewWeek";

import BookOnlineIcon from "@mui/icons-material/BookOnline";

import ListAltIcon from "@mui/icons-material/ListAlt";

import PaymentsIcon from "@mui/icons-material/Payments";

import InsightsIcon from "@mui/icons-material/Insights";

import CampaignIcon from "@mui/icons-material/Campaign";

import CloseIcon from "@mui/icons-material/Close";



/* Manager tools */

import ServiceManagement from "./ServiceManagement";

import ProductManagement from "./ProductManagement";
import ManagerProductOrdersView from "./ManagerProductOrdersView";


import ServiceAssignment from "./ServiceAssignment";

import CouponManagement from "./CouponManagement";

import AddonManagement from "./AddonManagement";

import ResourceManagement from "./ResourceManagement";

import EmployeeAvailabilityManagement from "./EmployeeAvailabilityManagement";

import ShiftTemplateManager from "./ShiftTemplateManager";



/* Calendars & booking panels */

import AllEmployeeSlotsCalendar from "../AllEmployeeSlotsCalendar";

import ClientBookingView from "./ClientBookingView";

import ManagerBookings from "./ManagerBookings";

import MarketingCampaignsTab from "./MarketingCampaignsTab";



/* Payments (enterprise-grade view) */

import ManagerPaymentsView from "./ManagerPaymentsView";



/* Enterprise Analytics (embedded in modal) */

import EnterpriseAnalytics from "./EnterpriseAnalytics";

import useStripeConnectStatus from "../../../hooks/useStripeConnectStatus";

import { stripeConnect } from "../../../utils/api";



/**

 * Modal-launch dashboard:

 *  - Tabs act as launchers; content opens inside a dialog

 *  - Analytics opens the EnterpriseAnalytics suite in the same dialog

 */

const SecondNewManagementDashboard = ({ token }) => {

  const theme = useTheme();
  const { t } = useTranslation();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));



  // top bar highlight (pure UX) — no tab selected initially

  const [tabIndex, setTabIndex] = useState(false);



  // which modal is open: number (panel index) or "analytics"

  const [openIndex, setOpenIndex] = useState(null);



  // remember which modals have been opened (for lazy mount)

  const [mounted, setMounted] = useState({});



  // Enterprise Analytics initial tab (keep but default to 0)

  const {

    status: connectStatus,

    loading: connectLoading,

    needsOnboarding,

    refresh: refreshConnect,

  } = useStripeConnectStatus();

  const [connectAction, setConnectAction] = useState(null);

  const [connectError, setConnectError] = useState("");

  const runConnectAction = useCallback(

    async (action) => {

      setConnectAction(action);

      setConnectError("");

      try {

        let response;

        if (action === "start") {

          response = await stripeConnect.startOnboarding();

        } else if (action === "refresh") {

          response = await stripeConnect.refreshOnboardingLink();

        } else {

          response = await stripeConnect.dashboardLogin();

        }

        const link =

          response?.url ||

          response?.onboarding_url ||

          response?.refresh_url ||

          response?.account_link ||

          response?.account_link_url ||

          response?.login_url;

        if (link && typeof window !== "undefined") {

          const target = action === "dashboard" ? "_blank" : "_self";

          if (target === "_self") {

            window.location.href = link;

          } else {

            window.open(link, target);

          }

        } else {

          setConnectError(t("manager.advanced.stripe.errors.noLink"));

        }

        await refreshConnect();



} catch (err) {

  const fallbackMessage = t("manager.advanced.stripe.errors.generic");

  const message =

    err?.displayMessage ||

    err?.response?.data?.error ||

    err?.message ||

    fallbackMessage;



  setConnectError(message);

} finally {



        setConnectAction(null);

      }

    },

    [refreshConnect]

  );

  const handleStartOnboarding = useCallback(

    () => runConnectAction("start"),

    [runConnectAction]

  );

  const handleRefreshLink = useCallback(

    () => runConnectAction("refresh"),

    [runConnectAction]

  );

  const handleDashboardLogin = useCallback(

    () => runConnectAction("dashboard"),

    [runConnectAction]

  );

  const connectContext = useMemo(

    () => ({

      status: connectStatus,

      loading: connectLoading,

      needsOnboarding,

      refresh: refreshConnect,

      startOnboarding: handleStartOnboarding,

      refreshLink: handleRefreshLink,

      openDashboard: handleDashboardLogin,

      action: connectAction,

    }),

    [

      connectStatus,

      connectLoading,

      needsOnboarding,

      refreshConnect,

      handleStartOnboarding,

      handleRefreshLink,

      handleDashboardLogin,

      connectAction,

    ]

  );

  const chargesEnabled = Boolean(connectStatus?.charges_enabled);

  const payoutsEnabled = Boolean(connectStatus?.payouts_enabled);

  const connectBannerSeverity = chargesEnabled ? "success" : "warning";

  const connectActionPending = Boolean(connectAction);

  const requirementsDue = Array.isArray(connectStatus?.requirements_due)

    ? connectStatus.requirements_due.length

    : 0;

const payoutsStatusKey = payoutsEnabled ? "enabled" : "pending";



const connectSummary = chargesEnabled

  ? t("manager.advanced.stripe.summaryCharges", {

      status: t(`manager.advanced.stripe.payouts.${payoutsStatusKey}`),

    })

  : t("manager.advanced.stripe.summaryDisabled");

  const primaryActionKey = needsOnboarding ? "start" : "dashboard";

  const primaryConnectAction = needsOnboarding ? handleStartOnboarding : handleDashboardLogin;

const openingLabel = t("manager.advanced.stripe.actions.opening");



const primaryActionLabel =

  connectAction === primaryActionKey

    ? openingLabel

    : needsOnboarding

      ? t("manager.advanced.stripe.actions.finishSetup")

      : t("manager.advanced.stripe.actions.openDashboard");



const refreshLabel =

  connectAction === "refresh"

    ? t("manager.advanced.stripe.actions.refreshing")

    : t("manager.advanced.stripe.actions.resume");



const startLinkLabel =

  connectAction === "start"

    ? openingLabel

    : t("manager.advanced.stripe.actions.newLink");





  const disablePrimary = connectActionPending && connectAction !== primaryActionKey;

  const disableRefresh = connectActionPending && connectAction !== "refresh";

  const disableStartLink = connectActionPending && connectAction !== "start";



const openAnalytics = useCallback(() => {

  setOpenIndex("analytics");

}, []);



const panels = useMemo(

  () => [

    {

      label: t("manager.advanced.panels.services"),

      icon: <DesignServicesIcon />,

      element: <ServiceManagement token={token} />,

    },

    {

      label: t("manager.advanced.panels.products"),

      icon: <ShoppingBagIcon />,

      element: <ProductManagement token={token} />,

    },

    {

      label: t("manager.advanced.panels.productOrders"),

      icon: <Inventory2Icon />,

      element: <ManagerProductOrdersView token={token} connect={connectContext} />,

    },

    {

      label: t("manager.advanced.panels.assignServices"),

      icon: <AssignmentIndIcon />,

      element: <ServiceAssignment token={token} />,

    },

    {

      label: t("manager.advanced.panels.promotions"),

      icon: <LocalOfferIcon />,

      element: <CouponManagement token={token} />,

    },

    {

      label: t("manager.advanced.panels.campaigns"),

      icon: <CampaignIcon />,

      element: <MarketingCampaignsTab />,

    },

    {

      label: t("manager.advanced.panels.addons"),

      icon: <AddCircleOutlineIcon />,

      element: <AddonManagement token={token} />,

    },

    {

      label: t("manager.advanced.panels.slots"),

      icon: <EventAvailableIcon />,

      element: <AllEmployeeSlotsCalendar token={token} />,

    },

    {

      label: t("manager.advanced.panels.resources"),

      icon: <Inventory2Icon />,

      element: <ResourceManagement token={token} />,

    },

    {

      label: t("manager.advanced.panels.employeeAvailability"),

      icon: <AccessTimeIcon />,

      element: <EmployeeAvailabilityManagement token={token} />,

    },

    {

      label: t("manager.advanced.panels.shiftTemplates"),

      icon: <ViewWeekIcon />,

      element: <ShiftTemplateManager token={token} />,

    },

    {

      label: t("manager.advanced.panels.clientBookings"),

      icon: <BookOnlineIcon />,

      element: <ClientBookingView />,

    },

    {

      label: t("manager.advanced.panels.managerBookings"),

      icon: <ListAltIcon />,

      element: <ManagerBookings connect={connectContext} />,

    },

    {

      label: t("manager.advanced.panels.payments"),

      icon: <PaymentsIcon />,

      element: <ManagerPaymentsView token={token} connect={connectContext} />,

    },

    {

      label: t("manager.advanced.panels.analytics"),

      icon: <InsightsIcon />,

      element: (

        <Paper

          variant="outlined"

          sx={{

            p: 3,

            borderRadius: 3,

            background:

              "linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 100%)",

          }}

        >

          <Typography variant="h6" fontWeight={700}>

            {t("manager.advanced.analyticsCard.title")}

          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>

            {t("manager.advanced.analyticsCard.description")}

          </Typography>



          <Stack direction="row" spacing={1.5} sx={{ mt: 2, flexWrap: "wrap" }}>

            <Button

              variant="contained"

              startIcon={<InsightsIcon />}

              onClick={openAnalytics}

            >

              {t("manager.advanced.analyticsCard.launch")}

            </Button>



            <Button variant="outlined" component={RouterLink} to="/manager/analytics">

              {t("manager.advanced.analyticsCard.openFullPage")}

            </Button>

          </Stack>

        </Paper>

      ),

    },

  ],

  [token, connectContext, openAnalytics, t]

);




  const handleOpen = (idx) => {

    setTabIndex(idx);

    setOpenIndex(idx);

    setMounted((m) => ({ ...m, [idx]: true }));

  };



  const handleClose = () => setOpenIndex(null);



  // derive dialog header icon/label

  const dialogIcon =

    openIndex === "analytics"

      ? <InsightsIcon />

      : openIndex !== null && typeof openIndex === "number"

      ? panels[openIndex]?.icon

      : null;



  const dialogLabel =

    openIndex === "analytics"

      ? t("manager.advanced.dialog.analyticsTitle")

      : openIndex !== null && typeof openIndex === "number"

      ? panels[openIndex]?.label

      : "";



  return (

    <Container maxWidth="xl" sx={{ py: 3 }}>

      {/* Header */}

      <Paper

        elevation={0}

        sx={{

          p: 3,

          mb: 2,

          borderRadius: 3,

          background:

            "linear-gradient(135deg, rgba(25,118,210,0.1) 0%, rgba(25,118,210,0.04) 100%)",

          border: "1px solid",

          borderColor: "divider",

        }}

      >

        <Stack

          direction={{ xs: "column", md: "row" }}

          spacing={2}

          alignItems={{ xs: "flex-start", md: "center" }}

          justifyContent="space-between"

        >

          <Box>

            <Typography variant="h4" fontWeight={800}>

              {t("manager.advanced.heading")}

            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>

              Configure services, staff, and schedules. Review bookings, handle charges & refunds,

              and open analytics in place.

            </Typography>

          </Box>



          {/* Quick actions */}

          <Stack direction="row" spacing={1} flexWrap="wrap">

            <Button

              variant="contained"

              startIcon={<PaymentsIcon />}

              component={RouterLink}

              to="/manager/payments"

            >

              {t("manager.advanced.quickActions.payments")}

            </Button>

            <Button

              variant="outlined"

              startIcon={<InsightsIcon />}

              onClick={openAnalytics}

            >

              {t("manager.advanced.quickActions.analytics")}

            </Button>

          </Stack>

        </Stack>

      </Paper>



      {/* Stripe Connect status */}

      {connectLoading ? (

        <Alert severity="info" sx={{ mb: 2 }}>

          {t("manager.advanced.stripe.loading")}

        </Alert>

      ) : (

        <Alert severity={connectBannerSeverity} sx={{ mb: 2 }}>

          <Stack

            direction={{ xs: "column", md: "row" }}

            spacing={2}

            alignItems={{ xs: "flex-start", md: "center" }}

            justifyContent="space-between"

          >

            <Box>

              <Typography variant="subtitle1" fontWeight={700}>

                {t("manager.advanced.stripe.title")}

              </Typography>

              <Typography variant="body2" color="text.secondary">

                {connectSummary}

              </Typography>

              {needsOnboarding && requirementsDue > 0 ? (

                <Typography variant="caption" color="text.secondary">

                  {t("manager.advanced.stripe.requirements", { count: requirementsDue })}

                </Typography>

              ) : null}

            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">

              <Button

                variant="contained"

                onClick={primaryConnectAction}

                disabled={disablePrimary}

              >

                {primaryActionLabel}

              </Button>

              <Button

                variant="outlined"

                onClick={handleRefreshLink}

                disabled={disableRefresh}

              >

                {refreshLabel}

              </Button>

              {!needsOnboarding ? (

                <Button

                  variant="text"

                  onClick={handleStartOnboarding}

                  disabled={disableStartLink}

                >

                  {startLinkLabel}

                </Button>

              ) : null}

            </Stack>

          </Stack>

        </Alert>

      )}

      {connectError ? (

        <Alert severity="error" sx={{ mb: 2 }}>

          {connectError}

        </Alert>

      ) : null}



      {/* Modal-launch Tabs */}

      <Paper

        elevation={0}

        sx={{

          borderRadius: 3,

          border: "1px solid",

          borderColor: "divider",

          p: 1,

        }}

      >

        <Tabs

          value={tabIndex}

          onChange={(_, idx) => handleOpen(idx)}

          variant="scrollable"

          scrollButtons="auto"

          allowScrollButtonsMobile

          sx={{

            ".MuiTab-root": { textTransform: "none", minHeight: 48 },

            ".MuiTabs-indicator": { height: 3 },

          }}

        >

          {panels.map((p, idx) => (

            <Tab

              key={idx}

              icon={p.icon}

              iconPosition="start"

              label={p.label}

            />

          ))}

        </Tabs>



        <Divider sx={{ mt: 1 }} />



        {/* Light inline message */}

        <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

          <Typography variant="body2" color="text.secondary">

            {t("manager.advanced.tabsHint")}

          </Typography>

        </Box>

      </Paper>



      {/* Shared modal */}

      <Dialog

        open={openIndex !== null}

        onClose={handleClose}

        fullScreen={fullScreen}

        fullWidth

        maxWidth="xl"

        PaperProps={{

          sx: {

            borderRadius: fullScreen ? 0 : 2,

            overflow: "hidden",

          },

        }}

      >

        <DialogTitle

          sx={{

            py: 1.5,

            pr: 7,

            position: "sticky",

            top: 0,

            zIndex: 2,

            bgcolor: "background.paper",

            borderBottom: "1px solid",

            borderColor: "divider",

          }}

        >

          <Stack direction="row" alignItems="center" spacing={1.5}>

            {dialogIcon}

            <Typography variant="h6" fontWeight={700}>

              {dialogLabel}

            </Typography>

          </Stack>

          <IconButton

            aria-label="close"

            onClick={handleClose}

            sx={{ position: "absolute", right: 8, top: 8 }}

          >

            <CloseIcon />

          </IconButton>

        </DialogTitle>



        <DialogContent

          dividers

          sx={{

            p: { xs: 1.5, sm: 2.5, md: 3 },

            maxHeight: "calc(100vh - 160px)",

            overflow: "auto",

            bgcolor: "background.default",

          }}

        >

          {openIndex === "analytics" ? (

            <EnterpriseAnalytics defaultTab={0} />

          ) : openIndex !== null && typeof openIndex === "number" && mounted[openIndex] ? (

            panels[openIndex].element

          ) : null}

        </DialogContent>



        <DialogActions

          sx={{

            px: { xs: 1.5, sm: 2.5, md: 3 },

            py: 1.5,

            borderTop: "1px solid",

            borderColor: "divider",

            bgcolor: "background.paper",

          }}

        >

          <Button onClick={handleClose} variant="outlined">

            {t("manager.advanced.dialog.close")}

          </Button>

        </DialogActions>

      </Dialog>

    </Container>

  );

};



export default SecondNewManagementDashboard;




