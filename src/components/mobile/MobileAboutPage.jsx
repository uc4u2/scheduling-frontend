import React from "react";
import { Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { isNativeRuntime } from "../../utils/runtime";

const MobileAboutPage = () => {
  const runtime = isNativeRuntime() ? "native" : "web";
  const version =
    process.env.REACT_APP_VERSION ||
    process.env.npm_package_version ||
    "unknown";
  const buildNumber = process.env.REACT_APP_BUILD_NUMBER || "dev";

  return (
    <Stack spacing={1.5}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About Schedulaa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mobile workspace diagnostics and app identity.
          </Typography>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                App version
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {version}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Build
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {buildNumber}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Runtime
              </Typography>
              <Chip
                size="small"
                label={runtime}
                color={runtime === "native" ? "success" : "default"}
                variant={runtime === "native" ? "filled" : "outlined"}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default MobileAboutPage;
