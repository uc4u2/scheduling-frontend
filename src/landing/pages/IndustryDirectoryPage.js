// src/landing/pages/IndustryDirectoryPage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Stack,
  Button,
  TextField,
  MenuItem,
  Alert,
  Avatar,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExploreIcon from "@mui/icons-material/TravelExplore";
import api from "../../utils/api";
import { PROFESSION_OPTIONS } from "../../constants/professions";
import Meta from "../../components/Meta";
import JsonLd from "../../components/seo/JsonLd";

const SITE_BASE_URL = "https://www.schedulaa.com";
const PAGE_URL = `${SITE_BASE_URL}/industries`;
const META = {
  title: "Industry Directory | Schedulaa booking sites by industry",
  description: "Browse Schedulaa-powered booking sites by industry. Discover salons, clinics, fitness studios, legal services, and more using unified scheduling, payroll, and commerce.",
  canonical: PAGE_URL,
  og: {
    title: "Industry Directory | Schedulaa",
    description: "Find businesses using Schedulaa across beauty, health, fitness, legal, finance, education, and more.",
    image: `${SITE_BASE_URL}/og/industries.jpg`,
  },
};

const industryLabel = (value) =>
  PROFESSION_OPTIONS.find((opt) => opt.value === value)?.label || "General";

const IndustryDirectoryPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const theme = useTheme();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const params = {};
    if (filter !== "all") params.industry = filter;
    api
      .get("/public/industry-directory", { params, noCompanyHeader: true })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data?.companies) ? res.data.companies : [];
        setCompanies(list);
        if (!list.length) {
          setError("No businesses found for this industry yet.");
        }
      })
      .catch(() => {
        if (!active) return;
        setError("We couldn’t load the directory right now. Please try again shortly.");
        setCompanies([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [filter]);

  const filtered = useMemo(() => {
    if (filter === "all") return companies;
    return companies.filter((c) => (c.industry || "general") === filter);
  }, [companies, filter]);

  const showLoading = loading && !filtered.length;

  const companyList = useMemo(() => {
    const source = filtered.length ? filtered : companies;
    return source.slice(0, 25).map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.name,
      url: `${SITE_BASE_URL}/${c.slug}`,
    }));
  }, [filtered, companies]);

  const pageSchema = useMemo(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: META.title,
      description: META.description,
      url: PAGE_URL,
    };
    if (companyList.length) {
      schema.mainEntity = {
        "@type": "ItemList",
        itemListElement: companyList,
      };
    }
    return schema;
  }, [companyList]);

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Meta
          title={META.title}
          description={META.description}
          canonical={META.canonical}
          og={META.og}
        />
        <JsonLd data={pageSchema} />
        <Stack spacing={3} sx={{ mb: 4 }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
            <Box>
              <Typography variant="h3" fontWeight={700}>
                Browse by Industry
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
                Pick an industry to find businesses that use Schedulaa for booking, payroll, and commerce.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <ExploreIcon />
              <Typography variant="body2" color="text.secondary">
                Live industry directory
              </Typography>
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
            <TextField
              select
              fullWidth
              label="Industry"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              sx={{
                backgroundColor: theme.palette.background.paper,
                borderRadius: 1,
              }}
            >
              <MenuItem value="all">All industries</MenuItem>
              {PROFESSION_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <Chip
              label={`${filtered.length} businesses`}
              color="primary"
              sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
            />
          </Stack>

          {error && (
            <Alert severity="info">
              {error}
            </Alert>
          )}
        </Stack>

        <Grid container spacing={3}>
          {showLoading && (
            <Grid item xs={12}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  Loading directory…
                </Typography>
              </Stack>
            </Grid>
          )}
          {filtered.map((company) => (
            <Grid item xs={12} sm={6} md={4} key={company.slug}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 4 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                    <Avatar
                      src={company.logo_url || ""}
                      alt={company.name}
                      sx={{ width: 44, height: 44, bgcolor: "primary.main", color: "white", fontWeight: 700 }}
                    >
                      {(company.name || "?").slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Chip size="small" label={industryLabel(company.industry)} />
                    <Chip size="small" variant="outlined" label={company.slug} />
                  </Stack>
                  <Typography variant="h6" fontWeight={700}>
                    {company.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {company.tagline || "Book services, buy products, and manage appointments online."}
                  </Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    endIcon={<OpenInNewIcon />}
                    onClick={() => window.open(`/${company.slug}?embed=0`, "_blank", "noopener")}
                  >
                    View site
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}

          {!filtered.length && !loading && (
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6">No businesses yet for this industry.</Typography>
                <Typography variant="body2" color="text.secondary">
                  Managers can set their industry in Settings → Workspace to appear here.
                </Typography>
              </Card>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
};

export default IndustryDirectoryPage;
