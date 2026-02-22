import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useNavigate } from "react-router-dom";

export default function MobileSubtabListPage({ title, intro, items = [] }) {
  const navigate = useNavigate();

  return (
    <Stack spacing={1.25}>
      <Typography variant="h5" fontWeight={800}>{title}</Typography>
      {intro ? <Typography variant="body2" color="text.secondary">{intro}</Typography> : null}
      {items.map((item) => (
        <Card key={item.to} variant="outlined">
          <CardActionArea onClick={() => navigate(item.to)}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1" fontWeight={700}>{item.label}</Typography>
                  {item.description ? (
                    <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                  ) : null}
                </Stack>
                <ChevronRightIcon color="action" />
              </Stack>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}
