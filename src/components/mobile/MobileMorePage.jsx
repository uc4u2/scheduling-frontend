import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const MobileMorePage = () => (
  <Card variant="outlined">
    <CardContent>
      <Typography variant="h6" gutterBottom>
        More
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Use the menu icon or the More tab to access additional modules.
      </Typography>
    </CardContent>
  </Card>
);

export default MobileMorePage;

