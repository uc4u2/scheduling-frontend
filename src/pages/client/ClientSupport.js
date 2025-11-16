// src/pages/client/ClientSupport.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  TextField,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link as MuiLink,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import PaymentsIcon from "@mui/icons-material/Payments";
import LanguageIcon from "@mui/icons-material/Language";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import { Link } from "react-router-dom";

const quickActions = [
  {
    title: "Manage Bookings",
    description: "Adjust or cancel upcoming appointments and review confirmation emails.",
    to: "/client/bookings",
    icon: <BookOnlineIcon fontSize="small" />,
  },
  {
    title: "Update Payment Methods",
    description: "Refresh saved cards, view invoices, or manage autopay settings.",
    to: "/client/payments",
    icon: <PaymentsIcon fontSize="small" />,
  },
  {
    title: "Edit Website Content",
    description: "Update business details, services, and landing pages in minutes.",
    to: "/manager/website/templates",
    icon: <LanguageIcon fontSize="small" />,
  },
  {
    title: "Review Reports",
    description: "Track revenue, payroll exports, and team performance dashboards.",
    to: "/dashboard",
    icon: <AssessmentIcon fontSize="small" />,
  },
];

const knowledgeCategories = [
  {
    title: "Scheduling and Booking",
    articles: [
      "Create services, add-ons, and customer booking rules",
      "Publish availability templates and shift rotations",
      "Handle cancellations, reschedules, and waitlists",
    ],
    docsLink: "/docs#user-guides",
  },
  {
    title: "Payroll and Compliance",
    articles: [
      "Configure pay rates, overtime, and holiday pay",
      "Approve timesheets and export payroll records",
      "Generate W-2, T4, and ROE files for accountants",
    ],
    docsLink: "/docs#user-guides",
  },
  {
    title: "Website and Branding",
    articles: [
      "Customize themes, navigation, and page layouts",
      "Connect an existing domain (purchase flow coming soon)",
      "Optimize SEO settings and social previews",
    ],
    docsLink: "/docs#user-guides",
  },
  {
    title: "Integrations and Automations",
    articles: [
      "Enable Stripe webhooks for payouts and refunds",
      "Configure Jitsi interviews and QuickBooks/Xero syncing",
      "Set up outbound webhooks; Zapier templates are planned",
    ],
    docsLink: "/docs#integrations",
  },
];

const faqItems = [
  {
    question: "How do I transition a booking to payroll?",
    answer: "Approve the timesheet entry, then generate a payroll batch under Payroll > Exports. All associated bookings, tips, and taxes are summarised there.",
  },
  {
    question: "Why is my custom domain not live?",
    answer: "Confirm DNS records point to Schedulaa and that the domain is connected under Website Builder > Domains. In-app domain purchasing is coming soon - for now use your registrar.",
  },
  {
    question: "How can I resend customer notifications?",
    answer: "Open the booking record and choose Resend Confirmation or SMS Reminder. Messages respect your notification template settings.",
  },
  {
    question: "Which reports show payouts and taxes?",
    answer: "Navigate to Analytics > Financials for payout summaries, and Payroll > Exports for tax-ready CSVs including Stripe fees and adjustments.",
  },
];

const resourceLinks = [
  { label: "Schedulaa Documentation", to: "/docs" },
  { label: "System Status", to: "/status" },
  { label: "Pricing and Plans", to: "/pricing" },
  { label: "Contact Sales", to: "/contact" },
];

const DEFAULT_ARTICLES = [
  {
    title: "Xero & QuickBooks onboarding guide",
    description: "Connect Schedulaa to Xero or QuickBooks, sync payroll journals, and verify exports.",
    to: "/docs?topic=quickbooks-onboarding",
    keywords: ["xero", "quickbooks", "onboarding", "accounting", "export"],
  },
  {
    title: "Custom domain walkthrough",
    description: "Forward GoDaddy domains or connect DNS records for branded booking sites.",
    to: "/help/domains",
    keywords: ["domain", "dns", "godaddy", "ssl"],
  },
  {
    title: "Schedulaa vs Deputy",
    description: "See why Schedulaa replaces standalone scheduling apps with booking + payroll.",
    to: "/compare/deputy",
    keywords: ["deputy", "comparison", "workforce"],
  },
  {
    title: "Schedulaa vs Humi",
    description: "Compare Schedulaa’s operations OS to Humi’s HR-only toolkit.",
    to: "/compare/humi",
    keywords: ["humi", "comparison", "hr"],
  },
  {
    title: "Schedulaa vs Xero",
    description: "Understand how Schedulaa complements Xero rather than competing with it.",
    to: "/compare/xero",
    keywords: ["xero", "comparison", "accounting"],
  },
  {
    title: "Workforce command center",
    description: "Clock-in/out, approvals, and payroll-ready exports from the same workspace.",
    to: "/workforce",
    keywords: ["workforce", "time tracking", "clock", "payroll"],
  },
  {
    title: "Canadian payroll coverage",
    description: "Review CPP, EI, provincial tax logic, and downloadable ROE/T4 tools.",
    to: "/payroll/canada",
    keywords: ["canada", "payroll", "cpp", "ei"],
  },
  {
    title: "Marketing analytics dashboard",
    description: "Measure campaign performance, churn, and client segments.",
    to: "/marketing/analytics-dashboard",
    keywords: ["analytics", "marketing", "dashboard"],
  },
  {
    title: "Zapier & webhooks preview",
    description: "Learn about Schedulaa’s upcoming Zapier and webhook integrations.",
    to: "/docs#integrations",
    keywords: ["zapier", "webhooks", "integrations", "automations"],
  },
  {
    title: "Website builder tips",
    description: "Customize layouts, navigation, galleries, and SEO settings in minutes.",
    to: "/website-builder",
    keywords: ["website", "builder", "themes", "seo"],
  },
  {
    title: "Stripe checkout and eCommerce",
    description: "Enable product sales, deposits, and refunds on your branded storefront.",
    to: "/features",
    keywords: ["stripe", "checkout", "ecommerce", "payments"],
  },
  {
    title: "ROE, T4, and W-2 tools",
    description: "Generate government-ready forms directly from Schedulaa payroll exports.",
    to: "/payroll/tools/roe",
    keywords: ["roe", "t4", "w2", "payroll forms"],
  },
  {
    title: "Growth stories from the blog",
    description: "Learn how service teams use Schedulaa to scale bookings and revenue.",
    to: "/blog",
    keywords: ["blog", "stories", "growth"],
  },
];

const DEFAULT_ARTICLE_PATHS = new Set(DEFAULT_ARTICLES.map((article) => article.to));

const TITLE_OVERRIDES = {
  "/": "Schedulaa home",
  "/features": "Platform features",
  "/pricing": "Pricing plans",
  "/docs": "Schedulaa documentation",
  "/blog": "Schedulaa blog",
  "/payroll/canada": "Canadian payroll coverage",
  "/payroll/usa": "US payroll coverage",
  "/payroll/tools/roe": "ROE generator guide",
  "/payroll/tools/t4": "T4 generator guide",
  "/payroll/tools/w2": "W-2 generator guide",
  "/help/domains": "Custom domain walkthrough",
  "/compare/vagaro": "Schedulaa vs Vagaro",
  "/compare/quickbooks": "Schedulaa vs QuickBooks",
  "/compare/humi": "Schedulaa vs Humi",
  "/compare/square-appointments": "Schedulaa vs Square Appointments",
  "/compare/xero": "Schedulaa vs Xero",
  "/compare/deputy": "Schedulaa vs Deputy",
};

const KEYWORD_OVERRIDES = {
  "/": ["zapier", "webhooks", "integrations", "automation", "slack"],
  "/features": ["zapier", "webhooks", "integrations", "automation"],
  "/docs": ["zapier", "webhooks", "integrations", "api"],
  "/marketing": ["zapier", "campaigns", "automations"],
  "/marketing/email-campaigns": ["zapier", "automations", "emails"],
  "/marketing/clients-360": ["zapier", "integrations", "crm"],
  "/status": ["zapier", "api", "integrations", "uptime"],
  "/compare/xero": ["zapier", "integrations"],
  "/compare/deputy": ["zapier", "integrations"],
  "/workforce": ["time tracking", "clock", "payroll"],
};

const DESCRIPTION_OVERRIDES = {
  "/": "Overview of Schedulaa’s operating system for service businesses.",
  "/features": "Explore every booking, scheduling, payroll, and commerce feature.",
  "/pricing": "Review Starter, Pro, Business, and Enterprise plans.",
  "/docs": "Browse help articles, onboarding guides, and integrations.",
  "/blog": "Stories about scaling bookings, payroll, and automation.",
  "/help/domains": "Forward GoDaddy domains or connect DNS records for branded booking sites.",
  "/compare/xero": "Understand how Schedulaa complements Xero’s accounting suite.",
  "/compare/deputy": "See why Schedulaa replaces standalone scheduling apps with booking + payroll.",
  "/compare/humi": "Compare Schedulaa’s operations OS to Humi’s HR-only toolkit.",
  "/compare/quickbooks": "See how Schedulaa syncs payroll and revenue with QuickBooks.",
  "/compare/square-appointments": "Schedulaa vs Square Appointments for growing teams.",
  "/compare/vagaro": "Schedulaa vs Vagaro for multi-service brands.",
  "/marketing/analytics-dashboard": "Measure campaign performance, churn, and client segments.",
  "/marketing": "Run campaigns, coupons, and client retention flows inside Schedulaa.",
  "/marketing/email-campaigns": "Build and send targeted email campaigns to win back clients.",
  "/marketing/clients-360": "View your entire client journey and retention plan.",
};

const formatSegment = (segment = "") =>
  segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const buildTitleFromPath = (path = "/") => {
  if (TITLE_OVERRIDES[path]) return TITLE_OVERRIDES[path];
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "Schedulaa home";
  if (segments[0] === "compare" && segments[1]) {
    return `Schedulaa vs ${formatSegment(segments[1])}`;
  }
  return segments.map(formatSegment).join(" · ");
};

const buildDescriptionFromPath = (path = "/", title = "") =>
  DESCRIPTION_OVERRIDES[path] || `Learn more about ${title.toLowerCase()} on Schedulaa.`;

const SYNONYM_MAP = {
  zapier: ["automation", "integrations", "webhooks"],
  automations: ["automation", "workflow", "journeys"],
  webhook: ["webhooks", "integrations"],
  integrations: ["integration", "connectors", "apps"],
  domain: ["domains", "dns"],
  payroll: ["payrolls", "pay"],
  booking: ["bookings", "appointments", "scheduling"],
  schedule: ["scheduling", "calendar"],
  pricing: ["plans", "subscriptions"],
  quickbooks: ["qb", "intuit"],
  xero: ["accounting"],
  deputy: ["workforce", "timeclock"],
};

const tokenize = (value = "") =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const expandTerms = (terms = []) => {
  const expanded = new Set();
  terms.forEach((term) => {
    if (!term) return;
    expanded.add(term);
    const synonyms = SYNONYM_MAP[term];
    if (synonyms) synonyms.forEach((syn) => expanded.add(syn));
    // reverse lookup
    Object.entries(SYNONYM_MAP).forEach(([key, values]) => {
      if (values.includes(term)) expanded.add(key);
    });
  });
  return Array.from(expanded);
};

const levenshtein = (a = "", b = "") => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

const ClientSupport = () => {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState(DEFAULT_ARTICLES);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    let active = true;
    const loadSitemap = async () => {
      try {
        const response = await fetch("/sitemap.xml", { headers: { "Cache-Control": "no-cache" } });
        if (!response.ok) throw new Error("Failed to load sitemap");
        const xmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "application/xml");
        const urlNodes = Array.from(doc.getElementsByTagName("url"));
        const entries = urlNodes
          .map((node) => {
            const loc = node.getElementsByTagName("loc")[0]?.textContent?.trim();
            if (!loc) return null;
            let path;
            try {
              path = new URL(loc).pathname || "/";
            } catch {
              return null;
            }
            if (
              path.startsWith("/client") ||
              path.startsWith("/manager") ||
              path.startsWith("/employee")
            ) {
              return null;
            }
            const title = buildTitleFromPath(path);
            const description = buildDescriptionFromPath(path, title);
            const keywords = [
              ...(KEYWORD_OVERRIDES[path] || []),
              ...(DESCRIPTION_OVERRIDES[path]?.split(/\W+/) ||
                path
                  .split("/")
                  .filter(Boolean)
                  .flatMap((segment) => segment.split("-"))),
            ]
              .map((word) => word?.toLowerCase())
              .filter(Boolean);
            return { title, description, to: path, keywords };
          })
          .filter(Boolean);

        if (!active) return;

        const merged = [...entries, ...DEFAULT_ARTICLES];
        const uniqueByPath = [];
        const seen = new Set();
        merged.forEach((article) => {
          if (seen.has(article.to)) return;
          seen.add(article.to);
          uniqueByPath.push(article);
        });
        uniqueByPath.sort((a, b) => a.title.localeCompare(b.title));
        setArticles(uniqueByPath);
      } catch {
        if (active) setArticles(DEFAULT_ARTICLES);
      } finally {
        if (active) setLoadingArticles(false);
      }
    };
    loadSitemap();
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredArticles = useMemo(() => {
    if (!normalizedQuery) return [];
    const queryTokens = tokenize(normalizedQuery);
    const expandedTerms = expandTerms(queryTokens);
    const scoredArticles = [];

    articles.forEach((article) => {
      const combinedText = `${article.title} ${article.description} ${article.to} ${(article.keywords || []).join(" ")}`.toLowerCase();
      const articleTokens = tokenize(combinedText);

      let matchScore = 0;
      expandedTerms.forEach((term) => {
        const lowerTerm = term.toLowerCase();
        const exactMatch = articleTokens.some((token) => token === lowerTerm);
        const partialMatch = !exactMatch && articleTokens.some((token) => token.includes(lowerTerm));
        const fuzzyMatch =
          !exactMatch &&
          !partialMatch &&
          articleTokens.some((token) => token.length > 2 && levenshtein(token, lowerTerm) <= 2);

        if (exactMatch) matchScore += 3;
        else if (partialMatch) matchScore += 2;
        else if (fuzzyMatch) matchScore += 1;
      });

      if (matchScore === 0) return;

      if (DEFAULT_ARTICLE_PATHS.has(article.to)) matchScore += 3;
      if ((article.title || "").toLowerCase().includes(normalizedQuery)) matchScore += 2;
      if ((article.description || "").toLowerCase().includes(normalizedQuery)) matchScore += 1;
      if ((article.keywords || []).some((keyword) => keyword.includes(normalizedQuery))) matchScore += 1;

      scoredArticles.push({ article, score: matchScore });
    });

    scoredArticles.sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title));
    return scoredArticles.map(({ article }) => article);
  }, [articles, normalizedQuery]);

  const popularArticles = articles.slice(0, 6);

  const articleResults = normalizedQuery ? filteredArticles : popularArticles;
  const resultHeading = loadingArticles
    ? "Loading help articles…"
    : normalizedQuery
      ? filteredArticles.length
        ? `Results for “${query.trim()}”`
        : `No results for “${query.trim()}”`
      : "Popular help articles";

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: (theme) => theme.palette.background.default }}>
      <Box component="section" sx={{ px: { xs: 2, md: 6 }, py: { xs: 8, md: 12 } }}>
      <Stack spacing={8}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            background: (theme) =>
              theme.palette.mode === "dark"
                ? "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.92))"
                : "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(236,252,255,0.94))",
          }}
        >
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }}>
              <Chip label="Help Center" color="primary" icon={<HelpOutlineIcon />} />
              <Typography variant="h4" component="h1" fontWeight={800}>
                How can we help you today?
              </Typography>
            </Stack>
            <Typography variant="subtitle1" color="text.secondary">
              Search guides, review best practices, or jump into the area you manage most.
            </Typography>
            <TextField
              fullWidth
              placeholder="Search the help center"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
              inputProps={{ "aria-label": "Search the help center" }}
            />
            <Typography variant="body2" color="text.secondary">
              Tip: Managers have access to the full knowledge base at <MuiLink component={Link} to="/docs">schedulaa.com/docs</MuiLink>.
            </Typography>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {resultHeading}
              </Typography>
              {normalizedQuery && filteredArticles.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Try searching for terms like “xero”, “domain”, or “pricing” to jump into our public guides.
                </Typography>
              ) : (
                <Stack spacing={1.5}>
                  {articleResults.map((article) => (
                    <Paper
                      elevation={0}
                      key={article.title}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        border: (theme) => `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Stack spacing={0.75}>
                        <MuiLink component={Link} to={article.to} underline="hover" variant="subtitle2" fontWeight={700}>
                          {article.title}
                        </MuiLink>
                        <Typography variant="body2" color="text.secondary">
                          {article.description}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((item) => (
              <Grid item xs={12} md={6} key={item.title}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}`, height: "100%" }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip icon={item.icon} label={item.title} color="secondary" size="small" sx={{ fontWeight: 600 }} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {item.description}
                    </Typography>
                    <Button component={Link} to={item.to} variant="outlined" size="small" sx={{ alignSelf: "flex-start" }}>
                      Go there
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Knowledge Base Categories
          </Typography>
          <Grid container spacing={3}>
            {knowledgeCategories.map((category) => (
              <Grid item xs={12} md={6} key={category.title}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    {category.title}
                  </Typography>
                  <List dense>
                    {category.articles.map((article) => (
                      <ListItem key={article} sx={{ pl: 0 }}>
                        <ListItemText primaryTypographyProps={{ variant: "body2", color: "text.secondary" }} primary={article} />
                      </ListItem>
                    ))}
                  </List>
                  <Button component={Link} to={category.docsLink} size="small" variant="text">
                    Read in documentation
                  </Button>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            FAQs
          </Typography>
          <Stack spacing={2.5}>
            {faqItems.map((faq) => (
              <Paper key={faq.question} elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {faq.question}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </Paper>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Additional Resources
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SupportAgentIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Contact the Schedulaa team
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Need tailored assistance or want to escalate an issue? Reach our specialists.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button component={Link} to="/contact" variant="contained" color="primary">
                      Contact us
                    </Button>
                    <Button component="a" href="mailto:support@schedulaa.com" variant="outlined" color="primary">
                      Email support@schedulaa.com
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Stack spacing={1.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Key links
                  </Typography>
                  <List dense>
                    {resourceLinks.map((link) => (
                      <ListItem key={link.label} sx={{ pl: 0 }}>
                        <MuiLink component={Link} to={link.to} underline="hover">
                          {link.label}
                        </MuiLink>
                      </ListItem>
                    ))}
                  </List>
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    Average response time: within 2 hours. Priority support for Pro plans responds in 30 minutes or less.
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Box>
  </Box>
  );
};

export default ClientSupport;
