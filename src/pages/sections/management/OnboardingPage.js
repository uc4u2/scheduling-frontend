import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Checkbox,
  Divider,
  Button,
} from "@mui/material";
import { api } from "../../../utils/api";

const normalizeTasks = (tasks) =>
  Array.isArray(tasks)
    ? tasks.map((task) => ({
        ...task,
        id: task.id ?? task.task_id ?? Math.random(),
      }))
    : [];

export default function OnboardingPage() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/onboarding/plan");
      const payload = res.data?.plan || null;
      setPlan(
        payload
          ? { ...payload, tasks: normalizeTasks(payload.tasks) }
          : null
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleGenerate = async () => {
    await api.post("/api/onboarding/plan/generate");
    fetchPlan();
  };

  const handleComplete = async (taskId) => {
    await api.post(`/api/onboarding/tasks/${taskId}/complete`);
    fetchPlan();
  };

  const grouped =
    plan?.tasks?.reduce((acc, task) => {
      const key = task.category || "General";
      acc[key] = acc[key] || [];
      acc[key].push(task);
      return acc;
    }, {}) || {};

  return (
    <Box sx={{ p: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Onboarding Checklist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-generated rollout plan tailored to your locations and modules. Mark
            each task complete as you progress.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleGenerate}>
            Regenerate plan
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : !plan ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            No rollout plan yet. Generate one now to get a task list for the next
            2–3 weeks.
          </Typography>
          <Button variant="contained" onClick={handleGenerate}>
            Generate plan
          </Button>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {Object.entries(grouped).map(([category, tasks]) => (
            <Paper
              key={category}
              variant="outlined"
              sx={{ p: 3, borderRadius: 3 }}
            >
              <Typography variant="h6" sx={{ textTransform: "capitalize", mb: 1 }}>
                {category}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.5}>
                {tasks.map((task) => (
                  <Stack
                    key={task.id}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                  >
                    <Checkbox
                      checked={task.status === "done"}
                      onChange={() => handleComplete(task.id)}
                    />
                    <Box>
                      <Typography variant="subtitle1">{task.title}</Typography>
                      {task.description && (
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                      )}
                      {typeof task.due_day_offset === "number" && (
                        <Typography variant="caption" color="text.secondary">
                          Day {task.due_day_offset}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
