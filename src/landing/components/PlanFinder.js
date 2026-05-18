import React, { useMemo, useState } from "react";
import {
  alpha,
  useTheme,
} from "@mui/material/styles";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  MobileStepper,
  Paper,
  Select,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { Link } from "react-router-dom";

import {
  PLAN_FINDER_CONFIG,
  WEBSITE_SETUP_SERVICES,
  getPlanFinderRecommendation,
} from "../data/pricingCatalog";

const DEFAULT_ANSWERS = {
  businessType: "",
  teamSize: "",
  needs: [],
  websiteNeed: "",
  setupPreference: "",
  pageCount: "",
  contentComplexity: "",
};

const PLAN_KEYS = ["starter", "pro", "business"];
const WEBSITE_ONLY = "Website only";

const PlanFinder = ({
  plans = [],
  onPlanSelect,
  onSetupSelect,
  planLoadingKey = "",
  setupLoadingKey = "",
  comparePlansHref = "#plans-grid",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState(DEFAULT_ANSWERS);
  const [stepIndex, setStepIndex] = useState(0);

  const config = PLAN_FINDER_CONFIG;

  const needsWebsiteSetupQuestions =
    answers.websiteNeed &&
    answers.websiteNeed !== "internal_only" &&
    ["done_for_you", "not_sure"].includes(answers.setupPreference);

  const steps = useMemo(() => {
    const baseSteps = [
      { key: "businessType", title: config.questions.businessType.label },
      { key: "teamSize", title: config.questions.teamSize.label },
      { key: "needs", title: config.questions.needs.label },
      { key: "websiteNeed", title: config.questions.websiteNeed.label },
      { key: "setupPreference", title: config.questions.setupPreference.label },
    ];

    if (needsWebsiteSetupQuestions) {
      baseSteps.push(
        { key: "pageCount", title: config.questions.pageCount.label },
        {
          key: "contentComplexity",
          title: config.questions.contentComplexity.label,
        }
      );
    }

    baseSteps.push({ key: "recommendation", title: "Your recommended setup" });
    return baseSteps;
  }, [config.questions, needsWebsiteSetupQuestions]);

  const recommendation = useMemo(() => {
    const canRecommend =
      Boolean(answers.teamSize) &&
      Boolean(answers.websiteNeed) &&
      Boolean(answers.setupPreference) &&
      answers.needs.length > 0 &&
      (!needsWebsiteSetupQuestions ||
        (Boolean(answers.pageCount) && Boolean(answers.contentComplexity)));

    if (!canRecommend) return null;
    return getPlanFinderRecommendation(answers);
  }, [answers, needsWebsiteSetupQuestions]);

  const recommendationStepIndex = steps.findIndex(
    (step) => step.key === "recommendation"
  );
  const currentStep = steps[stepIndex];
  const isRecommendationStep = currentStep?.key === "recommendation";
  const progressValue = ((stepIndex + 1) / steps.length) * 100;

  const recommendedPlan = useMemo(
    () => plans.find((plan) => plan.key === recommendation?.planKey) || null,
    [plans, recommendation]
  );
  const recommendedSetup = useMemo(() => {
    if (!recommendation?.setupKey) return null;
    return (
      WEBSITE_SETUP_SERVICES.items.find(
        (service) => service.key === recommendation.setupKey
      ) || null
    );
  }, [recommendation]);

  const planLabel = recommendedPlan?.name || (
    recommendation?.planKey?.charAt(0).toUpperCase() +
      recommendation?.planKey?.slice(1)
  ) || "";
  const planPrice = recommendedPlan?.price || "$0";
  const setupPrice = recommendedSetup?.price || "$0";
  const setupPriceLabel =
    recommendation?.setupKey === "premium"
      ? "Scoped one-time setup"
      : recommendation?.setupKey
        ? "Optional one-time setup"
        : "Included with your monthly plan";

  const upgradeGuidance = useMemo(() => {
    if (!recommendation?.planKey) return "";
    if (recommendation.planKey === "starter") {
      return "Need staff scheduling, employee logins, or team visibility? Pro may be a better fit.";
    }
    if (recommendation.planKey === "pro") {
      return "Need quotes, estimates, work orders, invoices, inventory, or month-end reporting? Business may be a better fit.";
    }
    return "Best fit for quote-to-invoice operations, job tracking, finance-ready reporting, and more operational control.";
  }, [recommendation]);

  const resetWizard = () => {
    setAnswers(DEFAULT_ANSWERS);
    setStepIndex(0);
  };

  const handleOpen = () => {
    resetWizard();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const setAnswer = (field, value) => {
    setAnswers((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "websiteNeed" && value === "internal_only") {
        next.setupPreference = "diy";
        next.pageCount = "";
        next.contentComplexity = "";
      }

      if (field === "setupPreference" && !["done_for_you", "not_sure"].includes(value)) {
        next.pageCount = "";
        next.contentComplexity = "";
      }

      return next;
    });
  };

  const toggleNeed = (need) => {
    setAnswers((prev) => {
      const hasNeed = prev.needs.includes(need);
      if (need === WEBSITE_ONLY) {
        return {
          ...prev,
          needs: hasNeed ? [] : [WEBSITE_ONLY],
        };
      }

      const baseNeeds = prev.needs.filter((item) => item !== WEBSITE_ONLY);
      return {
        ...prev,
        needs: hasNeed
          ? baseNeeds.filter((item) => item !== need)
          : [...baseNeeds, need],
      };
    });
  };

  const isStepComplete = (stepKey) => {
    switch (stepKey) {
      case "businessType":
        return Boolean(answers.businessType);
      case "teamSize":
        return Boolean(answers.teamSize);
      case "needs":
        return answers.needs.length > 0;
      case "websiteNeed":
        return Boolean(answers.websiteNeed);
      case "setupPreference":
        return Boolean(answers.setupPreference);
      case "pageCount":
        return Boolean(answers.pageCount);
      case "contentComplexity":
        return Boolean(answers.contentComplexity);
      case "recommendation":
        return Boolean(recommendation);
      default:
        return false;
    }
  };

  const canGoNext = isRecommendationStep || isStepComplete(currentStep?.key);
  const canGoBack = stepIndex > 0;

  const handleNext = () => {
    if (isRecommendationStep) return;
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const renderSelectableCards = ({
    options,
    value,
    onSelect,
    multi = false,
    columns = { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  }) => (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: columns,
        gap: 1.25,
      }}
    >
      {options.map((option) => {
        const optionValue = typeof option === "string" ? option : option.key;
        const optionLabel = typeof option === "string" ? option : option.label;
        const optionDescription =
          typeof option === "string" ? "" : option.description || option.helper || "";
        const selected = multi
          ? value.includes(optionValue)
          : value === optionValue;

        return (
          <Paper
            key={optionValue}
            elevation={0}
            onClick={() => onSelect(optionValue)}
            sx={{
              p: { xs: 1.5, md: 1.75 },
              borderRadius: 3,
              border: `1px solid ${selected ? theme.palette.primary.main : alpha(
                theme.palette.divider,
                0.95
              )}`,
              backgroundColor: selected
                ? alpha(theme.palette.primary.main, 0.08)
                : theme.palette.background.paper,
              cursor: "pointer",
              transition: "all 0.2s ease",
              minHeight: optionDescription ? 108 : 72,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1.25,
              "&:hover": {
                borderColor: theme.palette.primary.main,
                boxShadow: `0 12px 28px ${alpha(
                  theme.palette.primary.main,
                  0.08
                )}`,
              },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" fontWeight={selected ? 700 : 600}>
                {optionLabel}
              </Typography>
              {optionDescription ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, lineHeight: 1.55 }}
                >
                  {optionDescription}
                </Typography>
              ) : null}
            </Box>
            {selected && (
              <CheckCircleRoundedIcon
                fontSize="small"
                sx={{ color: "primary.main", ml: 1, mt: 0.25, flexShrink: 0 }}
              />
            )}
          </Paper>
        );
      })}
    </Box>
  );

  const renderStep = () => {
    switch (currentStep?.key) {
      case "businessType":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.businessType.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Context matters, but we recommend the plan based on workflow and team size.
            </Typography>
            <FormControl fullWidth>
              <InputLabel id="plan-finder-business-type">
                Business type
              </InputLabel>
              <Select
                labelId="plan-finder-business-type"
                value={answers.businessType}
                label="Business type"
                onChange={(event) =>
                  setAnswer("businessType", event.target.value)
                }
                MenuProps={{ PaperProps: { sx: { maxHeight: 360 } } }}
              >
                {config.questions.businessType.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        );
      case "teamSize":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.teamSize.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Team size is one of the strongest drivers of the recommended monthly plan.
            </Typography>
            {renderSelectableCards({
              options: config.questions.teamSize.options,
              value: answers.teamSize,
              onSelect: (value) => setAnswer("teamSize", value),
            })}
          </Stack>
        );
      case "needs":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.needs.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose every workflow you want Schedulaa to help manage.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choosing <strong>Website only</strong> keeps the recommendation intentionally simple and clears the rest of the workflow options.
            </Typography>
            <Stack spacing={2.25}>
              {config.questions.needs.sections.map((section) => (
                <Stack key={section.title} spacing={1.25}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    fontWeight={800}
                    sx={{ letterSpacing: 1.2 }}
                  >
                    {section.title}
                  </Typography>
                  {renderSelectableCards({
                    options: section.options,
                    value: answers.needs,
                    onSelect: toggleNeed,
                    multi: true,
                    columns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                  })}
                </Stack>
              ))}
            </Stack>
          </Stack>
        );
      case "websiteNeed":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.websiteNeed.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This decides whether we should recommend website setup at all.
            </Typography>
            {renderSelectableCards({
              options: config.questions.websiteNeed.options,
              value: answers.websiteNeed,
              onSelect: (value) => setAnswer("websiteNeed", value),
            })}
          </Stack>
        );
      case "setupPreference":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.setupPreference.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Every plan includes the website builder. This only affects the optional one-time setup recommendation.
            </Typography>
            {renderSelectableCards({
              options: config.questions.setupPreference.options,
              value: answers.setupPreference,
              onSelect: (value) => setAnswer("setupPreference", value),
            })}
          </Stack>
        );
      case "pageCount":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.pageCount.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This helps us recommend the right setup tier if you want implementation help.
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
                backgroundColor: alpha(theme.palette.info.main, 0.06),
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Website setup includes page structure, basic content placement, and launch support. Large content libraries, custom copywriting, advanced SEO pages, or heavy manual uploads may require Premium or a custom quote.
              </Typography>
            </Paper>
            {renderSelectableCards({
              options: config.questions.pageCount.options,
              value: answers.pageCount,
              onSelect: (value) => setAnswer("pageCount", value),
            })}
          </Stack>
        );
      case "contentComplexity":
        return (
          <Stack spacing={2}>
            <Typography variant="h5" fontWeight={800}>
              {config.questions.contentComplexity.label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Larger image libraries, project galleries, and migrations usually move the recommendation into Premium.
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
                backgroundColor: alpha(theme.palette.info.main, 0.06),
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Website setup includes page structure, basic content placement, and launch support. Large content libraries, custom copywriting, advanced SEO pages, or heavy manual uploads may require Premium or a custom quote.
              </Typography>
            </Paper>
            {renderSelectableCards({
              options: config.questions.contentComplexity.options,
              value: answers.contentComplexity,
              onSelect: (value) => setAnswer("contentComplexity", value),
            })}
          </Stack>
        );
      case "recommendation":
        return (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" color="primary.main" fontWeight={800}>
                Buying summary
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                Your recommended package
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                You only need one monthly Schedulaa plan. Website setup is optional and one-time if you want our team to build the site for you.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
                gap: 2,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
                  background: alpha(theme.palette.primary.main, 0.05),
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Recommended monthly plan
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                  {planLabel}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                  {planPrice}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Monthly subscription
                </Typography>
                {recommendedPlan?.description ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                    {recommendedPlan.description}
                  </Typography>
                ) : null}
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight={800}
                  sx={{ mt: 1.75, display: "block", letterSpacing: 1.1 }}
                >
                  Why:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                  {recommendation?.planReason}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => recommendation?.planKey && onPlanSelect?.(recommendation.planKey)}
                  disabled={Boolean(planLoadingKey)}
                  sx={{ mt: 2, borderRadius: 999, py: 1.2, textTransform: "none", fontWeight: 800 }}
                  fullWidth
                >
                  {planLoadingKey === recommendation?.planKey
                    ? "Starting your free trial..."
                    : `Start 14-day free trial with ${planLabel}`}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  This starts the monthly Schedulaa plan. Website setup can be added separately if needed.
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
                  background: theme.palette.background.paper,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  Optional one-time website setup
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
                  {recommendation?.setupLabel}
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>
                  {setupPrice}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {setupPriceLabel}
                </Typography>
                {recommendation?.setupKey === null ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                    Build it yourself with the included website builder. You can add setup help later if needed.
                  </Typography>
                ) : null}
                <Typography
                  variant="overline"
                  color="text.secondary"
                  fontWeight={800}
                  sx={{ mt: 1.75, display: "block", letterSpacing: 1.1 }}
                >
                  Why:
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.7 }}>
                  {recommendation?.setupReason}
                </Typography>
                {recommendation?.setupKey === "basic" ? (
                  <Button
                    variant="outlined"
                    onClick={() =>
                      onSetupSelect?.({
                        key: "basic",
                        ctaMode: "checkout",
                      })
                    }
                    disabled={Boolean(setupLoadingKey)}
                    sx={{ mt: 2, borderRadius: 999, textTransform: "none" }}
                    fullWidth
                  >
                    {setupLoadingKey === "basic"
                      ? "Starting setup checkout..."
                      : "Buy Basic Website Setup"}
                  </Button>
                ) : recommendation?.setupKey === "growth" ? (
                  <Button
                    component={Link}
                    to="/contact?topic=website-setup-growth"
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 999, textTransform: "none" }}
                    fullWidth
                  >
                    Talk to sales about Growth Setup
                  </Button>
                ) : recommendation?.setupKey === "premium" ? (
                  <Button
                    component={Link}
                    to="/contact?topic=website-setup-premium"
                    variant="outlined"
                    sx={{ mt: 2, borderRadius: 999, textTransform: "none" }}
                    fullWidth
                  >
                    Talk to sales about Premium Setup
                  </Button>
                ) : null}
              </Paper>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.18)}`,
                backgroundColor: alpha(theme.palette.info.main, 0.06),
              }}
            >
              <Stack spacing={0.75}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Your recommendation:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`Monthly plan: ${planLabel} - ${planPrice}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {recommendation?.setupKey
                    ? `Optional one-time setup: ${recommendation.setupLabel} - ${setupPrice}`
                    : "Website setup: Not needed. You can build it yourself."}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ pt: 0.5 }}>
                  {recommendation?.setupKey
                    ? "The monthly plan is recurring. Website setup is optional and one-time."
                    : "You can add website setup later if needed."}
                </Typography>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.divider, 0.95)}`,
                backgroundColor: alpha(theme.palette.secondary.main, 0.05),
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {upgradeGuidance}
              </Typography>
            </Paper>

            <Typography variant="body2" color="text.secondary">
              You can start with the monthly plan first and add website setup later.
            </Typography>

            <Stack spacing={1.25}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} flexWrap="wrap">
                <Button
                  component="a"
                  href={`#${recommendation?.planKey || PLAN_KEYS[0]}`}
                  variant="outlined"
                  sx={{ borderRadius: 999, textTransform: "none" }}
                >
                  View {planLabel} plan
                </Button>

                {recommendation?.setupKey === null ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ alignSelf: "center", px: 0.5 }}
                  >
                    You can add website setup later.
                  </Typography>
                ) : null}

                <Button
                  component={Link}
                  to="/contact"
                  variant="text"
                  sx={{ borderRadius: 999, textTransform: "none" }}
                >
                  Talk to sales
                </Button>
              </Stack>

              {recommendation?.setupKey && (
                <Stack spacing={0.75}>
                  <Typography variant="caption" color="text.secondary">
                    Requires an active Schedulaa subscription. Domain purchase is not included.
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Final setup scope is confirmed before work begins. Extra pages, large content migration, custom copywriting, advanced SEO pages, or heavy gallery/product uploads may be quoted separately.
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Stack>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          mb: { xs: 3, md: 4 },
          borderRadius: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.06
          )} 0%, ${alpha(theme.palette.background.paper, 0.98)} 55%, ${alpha(
            theme.palette.secondary.main,
            0.05
          )} 100%)`,
          boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.06)}`,
        }}
      >
        <Stack
          spacing={2}
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Stack spacing={1} sx={{ maxWidth: 760 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeRoundedIcon sx={{ color: "primary.main" }} />
              <Typography variant="h4" component="h2" fontWeight={900}>
                {config.title}
              </Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              {config.subtitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {config.intro}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            <Button
              variant="contained"
              onClick={handleOpen}
              sx={{ borderRadius: 999, py: 1.15, px: 2.5, textTransform: "none", fontWeight: 800 }}
            >
              Start Plan Finder
            </Button>
            <Button
              component="a"
              href={comparePlansHref}
              variant="outlined"
              sx={{ borderRadius: 999, py: 1.15, px: 2.5, textTransform: "none", fontWeight: 700 }}
            >
              Compare plans manually
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, md: 4 },
            minHeight: { xs: "100%", md: 680 },
            maxWidth: { md: 860 },
            overflow: "hidden",
          },
        }}
      >
        <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: { xs: 2, md: 2.5 },
              borderBottom: `1px solid ${theme.palette.divider}`,
              background: alpha(theme.palette.primary.main, 0.03),
            }}
          >
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="overline" color="primary.main" fontWeight={800}>
                    Plan Finder
                  </Typography>
                  <Typography variant="h5" fontWeight={900}>
                    {isRecommendationStep ? "Your recommended setup" : currentStep?.title}
                  </Typography>
                </Box>
                <Button
                  onClick={handleClose}
                  color="inherit"
                  sx={{ minWidth: 0, borderRadius: 999, p: 1 }}
                >
                  <CloseIcon />
                </Button>
              </Stack>

              <Stack spacing={0.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Step {Math.min(stepIndex + 1, steps.length)} of {steps.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(progressValue)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{ height: 8, borderRadius: 999 }}
                />
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, overflowY: "auto" }}>
            {renderStep()}
          </Box>

          {!isRecommendationStep ? (
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 1.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
                position: { xs: "sticky", md: "static" },
                bottom: 0,
              }}
            >
              {isMobile ? (
                <MobileStepper
                  variant="dots"
                  steps={recommendationStepIndex}
                  position="static"
                  activeStep={stepIndex}
                  sx={{ px: 0, background: "transparent" }}
                  nextButton={
                    <Button
                      size="small"
                      onClick={handleNext}
                      disabled={!canGoNext}
                      endIcon={<ArrowForwardRoundedIcon />}
                    >
                      Next
                    </Button>
                  }
                  backButton={
                    <Button
                      size="small"
                      onClick={handleBack}
                      disabled={!canGoBack}
                      startIcon={<ArrowBackRoundedIcon />}
                    >
                      Back
                    </Button>
                  }
                />
              ) : (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Button
                    onClick={handleBack}
                    disabled={!canGoBack}
                    startIcon={<ArrowBackRoundedIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{ borderRadius: 999, textTransform: "none", fontWeight: 700 }}
                  >
                    Next
                  </Button>
                </Stack>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                px: { xs: 2, md: 3 },
                py: 1.5,
                borderTop: `1px solid ${theme.palette.divider}`,
                background: theme.palette.background.paper,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Button
                  onClick={handleBack}
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{ textTransform: "none" }}
                >
                  Back
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  sx={{ borderRadius: 999, textTransform: "none" }}
                >
                  Close
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlanFinder;
