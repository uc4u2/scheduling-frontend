import { useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";

const ProductBasketImage = ({ item }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = item?.display?.image || item?.image || "";
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <Box
      sx={{
        display: "grid",
        placeItems: "center",
        width: { xs: "100%", sm: 132 },
        height: { xs: 210, sm: 132 },
        flexShrink: 0,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2.5,
        bgcolor: "rgba(148, 163, 184, 0.08)",
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={imageUrl}
          alt={`${item?.name || "Product"} product image`}
          onError={() => setImageFailed(true)}
          sx={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        <Stack spacing={0.75} alignItems="center" color="text.secondary">
          <ImageOutlinedIcon aria-hidden="true" />
          <Typography variant="caption">Image unavailable</Typography>
        </Stack>
      )}
    </Box>
  );
};

export default ProductBasketImage;
