import React, { useEffect, useState } from "react";
import { Box, Tooltip } from "@mui/material";
import { ImageOutlined } from "@mui/icons-material";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim())?.trim() || "";

export const resolveManagementImageUrl = (row) => {
  const imageUrl = (Array.isArray(row?.images) ? row.images : [])
    .map((image) =>
      firstText(image?.url_public, image?.file_url, image?.url, image?.external_url)
    )
    .find(Boolean);
  const asset = row?.image_asset;
  return firstText(
    imageUrl,
    asset?.url_public,
    asset?.file_url,
    asset?.url,
    row?.image_url,
    row?.imageUrl
  );
};

const ManagementImageThumbnail = ({ row, label = "item", onClick }) => {
  const src = resolveManagementImageUrl(row);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const hasPreview = Boolean(src && !failed);
  const actionLabel = `${hasPreview ? "View or manage" : "Add"} ${label} image`;

  return (
    <Tooltip title={actionLabel} arrow>
      <Box
        component="button"
        type="button"
        aria-label={actionLabel}
        onClick={onClick}
        sx={{
          width: 44,
          height: 44,
          p: 0,
          border: "1px solid",
          borderColor: hasPreview ? "divider" : "rgba(0, 0, 0, 0.18)",
          borderRadius: 1,
          overflow: "hidden",
          bgcolor: "background.default",
          color: "text.secondary",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "border-color 120ms ease, box-shadow 120ms ease",
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: "0 0 0 2px rgba(233, 109, 64, 0.12)",
          },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
      >
        {hasPreview ? (
          <Box
            component="img"
            src={src}
            alt={`${label} preview`}
            onError={() => setFailed(true)}
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <ImageOutlined fontSize="small" aria-hidden="true" />
        )}
      </Box>
    </Tooltip>
  );
};

export default ManagementImageThumbnail;
