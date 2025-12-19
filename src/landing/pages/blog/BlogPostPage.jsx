// Generic renderer for blog posts defined in posts.js
import React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Divider,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Meta from "../../../components/Meta";
import JsonLd from "../../../components/seo/JsonLd";
import blogPosts from "./posts";

const BlogPostPage = () => {
  const theme = useTheme();
  const { slug } = useParams();

  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const canonical = `https://www.schedulaa.com/blog/${post.slug}`;
  const heroColor = theme.palette.primary.main;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    author: { "@type": "Organization", name: "Schedulaa" },
    publisher: {
      "@type": "Organization",
      name: "Schedulaa",
      logo: { "@type": "ImageObject", url: "https://www.schedulaa.com/og/logo.png" },
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified || post.datePublished,
    url: canonical,
    articleSection: post.category ? [post.category] : undefined,
    keywords: Array.isArray(post.tags) ? post.tags.join(", ") : undefined,
  };

  return (
    <Box sx={{ position: "relative", overflow: "hidden", pb: { xs: 8, md: 12 } }}>
      <Meta
        title={`${post.title} | Schedulaa`}
        description={post.description}
        canonical={canonical}
        og={{
          title: post.title,
          description: post.description,
          image: "https://www.schedulaa.com/og/blog.jpg",
        }}
      />
      <JsonLd data={articleJsonLd} />

      <Box
        sx={{
          position: "absolute",
          top: -240,
          left: -260,
          width: 960,
          height: 960,
          borderRadius: "50%",
          background: alpha(heroColor, 0.16),
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <Container maxWidth="md" sx={{ pt: { xs: 8, md: 10 } }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${alpha(heroColor, 0.88)}, ${alpha(
                  theme.palette.secondary.main,
                  0.6
                )})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.palette.common.white,
                boxShadow: `0 12px 28px ${alpha(heroColor, 0.35)}`,
              }}
            >
              <TrendingUpIcon fontSize="small" />
            </Box>
            <Stack spacing={0.25}>
              <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.2, color: alpha(heroColor, 0.85) }}>
                {post.heroOverline || "Blog"}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.text.secondary }}>
                {post.title}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {post.datePublished && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(post.datePublished).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Typography>
                )}
                {post.category && <Chip size="small" label={post.category} />}
              </Stack>
            </Stack>
          </Stack>

          <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: "2.2rem", md: "2.8rem" }, lineHeight: 1.1 }}>
            {post.title}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            {post.description}
          </Typography>
        </Stack>

        <Stack spacing={5} sx={{ mt: { xs: 5, md: 7 } }}>
          {(post.sections || []).map((section) => (
            <Box key={section.heading}>
              {section.heading && (
                <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                  {section.heading}
                </Typography>
              )}
              {section.image?.src ? (
                <Box
                  component="img"
                  src={section.image.src}
                  alt={section.image.alt || section.heading || "Blog visual"}
                  sx={{
                    width: "100%",
                    borderRadius: 3,
                    mb: 2.5,
                    boxShadow: `0 18px 48px ${alpha(heroColor, 0.18)}`,
                  }}
                />
              ) : null}
              <Stack spacing={2.25}>
                {(section.paragraphs || []).map((paragraph, index) => (
                  <Typography key={index} variant="body1" color="text.secondary">
                    {paragraph}
                  </Typography>
                ))}
              </Stack>
              <Divider sx={{ mt: 4, opacity: 0.18 }} />
            </Box>
          ))}
        </Stack>

        <Box sx={{ mt: { xs: 6, md: 8 }, textAlign: "center" }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Ready to run operations from one workspace?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: "auto", mb: 3 }}>
            Launch booking, scheduling, time tracking, and payroll in one place, then connect Zapier and QuickBooks/Xero so operations, finance, and HR all work from the same data.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
            <Button component={Link} to="/register" variant="contained" size="large" sx={{ textTransform: "none", borderRadius: 999 }}>
              Start free
            </Button>
            <Button component={Link} to="/contact" variant="outlined" size="large" sx={{ textTransform: "none", borderRadius: 999 }}>
              Talk to sales
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default BlogPostPage;
