import React from "react";
import { Box, Paper, Stack, Typography, Button, Chip } from "@mui/material";
import { useParams, useSearchParams, Link as RouterLink } from "react-router-dom";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StarIcon from "@mui/icons-material/Star";
import useCouponCapture from "../../hooks/useCouponCapture";

const VipLanding = () => {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  useCouponCapture(); // stores coupon in localStorage

  const coupon = sp.get("coupon");
  const expires = sp.get("expires"); // optional, if you include in emails

  return (
    <Box sx={{ py: 6, px: 2, display: "grid", placeItems: "center" }}>
      <Paper
        elevation={0}
        sx={{
          maxWidth: 880,
          width: "100%",
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(0,0,0,0.02) 100%)",
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <StarIcon />
            <Typography variant="h4" fontWeight={800}>VIP Early Access</Typography>
          </Stack>

          <Typography variant="body1" color="text.secondary">
            You’ve unlocked priority access to prime slots. Your code has been captured and will be
            applied at checkout.
          </Typography>

          {coupon && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<LocalOfferIcon />} label={`Coupon: ${coupon}`} color="primary" />
              {expires && (
                <Chip variant="outlined" label={`Expires: ${expires}`} />
              )}
            </Stack>
          )}

          <Stack direction="row" spacing={1.5} sx={{ pt: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              component={RouterLink}
              to={`/${slug}/book?coupon=${encodeURIComponent(coupon || "")}`}
            >
              Book now
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/${slug}?page=services-classic&coupon=${encodeURIComponent(coupon || "")}`}
            >
              Browse services
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ pt: 1 }}>
            Tip: if you don’t see the code at checkout, it’s stored and will auto-apply.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default VipLanding;
