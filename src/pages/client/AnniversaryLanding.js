import React from "react";
import { Box, Paper, Stack, Typography, Button, Chip } from "@mui/material";
import { useParams, useSearchParams, Link as RouterLink } from "react-router-dom";
import CakeIcon from "@mui/icons-material/Cake";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import useCouponCapture from "../../hooks/useCouponCapture";

const AnniversaryLanding = () => {
  const { slug } = useParams();
  const [sp] = useSearchParams();
  useCouponCapture();

  const coupon = sp.get("coupon");
  const expires = sp.get("expires");

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
            "linear-gradient(135deg, rgba(25,118,210,0.06) 0%, rgba(0,0,0,0.02) 100%)",
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CakeIcon />
            <Typography variant="h4" fontWeight={800}>Happy Client-versary 🎉</Typography>
          </Stack>

          <Typography variant="body1" color="text.secondary">
            Thanks for being with us! Your anniversary reward has been captured and will be applied at checkout.
          </Typography>

          {coupon && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<LocalOfferIcon />} label={`Coupon: ${coupon}`} color="primary" />
              {expires && <Chip variant="outlined" label={`Expires: ${expires}`} />}
            </Stack>
          )}

          <Stack direction="row" spacing={1.5} sx={{ pt: 1, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              component={RouterLink}
              to={`/${slug}/book?coupon=${encodeURIComponent(coupon || "")}`}
            >
              Book your treat
            </Button>
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/${slug}/services?coupon=${encodeURIComponent(coupon || "")}`}
            >
              Explore services
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default AnniversaryLanding;
