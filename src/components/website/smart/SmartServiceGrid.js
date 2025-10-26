// src/components/website/smart/SmartServiceGrid.js
import * as React from "react";
import useDataSource from "../../../hooks/useDataSource";
import { Container, Typography } from "@mui/material";
import ServiceGrid from "../ServiceGrid"; // if your ServiceGrid is defined inside RenderSections, copy that card list as a small component here
import { api } from "../../../utils/api";

/**
 * Expected backend shape (adjust if needed):
 * GET /api/manager/services?category=...&limit=...
 * -> { items: [{ id, name, description, price_text, image_url, meta }, ...] }
 */
export default function SmartServiceGrid({ title = "Popular services", category, limit = 6, ctaText, ctaLink }) {
  const url = "/api/manager/services";
  const params = { category, limit };

  const { data, loading, error } = useDataSource({
    key: "services",
    url,
    params,
    ttlMs: 60000,
  });

  const items = React.useMemo(() => {
    const src = data?.items || [];
    return src.map((s) => ({
      name: s.name,
      description: s.description,
      price: s.price_text || s.price || "",
      image: s.image_url || "",
      meta: s.meta || "",
    }));
  }, [data]);

  if (error) {
    return (
      <Container maxWidth="lg">
        <Typography color="error">Failed to load services.</Typography>
      </Container>
    );
  }

  return (
    <ServiceGrid
      title={title}
      items={items}
      ctaText={ctaText}
      ctaLink={ctaLink}
      loading={loading}
    />
  );
}
