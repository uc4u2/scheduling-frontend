import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Checkbox,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { api } from "../../utils/api";

const normalizeTasks = (tasks) =>
  Array.isArray(tasks)
    ? tasks.map((task) => ({
        ...task,
        id: task.id ?? task.task_id ?? Math.random(),
      }))
    : [];

export default function OnboardingWidget({ onViewAll }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/onboarding/plan");
      const payload = res.data?.plan || null;
      setPlan(
        payload
          ? { ...payload, tasks: normalizeTasks(payload.tasks) }
          : null
      );
    } catch (err) {
      setError("Unable to load onboarding tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await api.post("/api/onboarding/plan/generate");
      const payload = res.data?.plan || null;
      setPlan(
        payload
          ? { ...payload, tasks: normalizeTasks(payload.tasks) }
          : null
      );
    } catch {
      setError("Failed to generate onboarding plan.");
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await api.post(`/api/onboarding/tasks/${taskId}/complete`);
      setPlan((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((task) =>
                task.id === taskId ? { ...task, status: "done" } : task
              ),
            }
          : prev
      );
    } catch {
      /* ignore */
    }
  };

  const pendingTasks =
    plan?.tasks?.filter((task) => task.status !== "done") ?? [];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <CheckCircleIcon color="primary" fontSize="small" />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Getting started
        </Typography>
        {plan?.tasks && (
          <Chip
            label={`${plan.tasks.filter((t) => t.status === "done").length}/${
              plan.tasks.length
            }`}
            size="small"
          />
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Follow the recommended rollout sequence so your scheduling, website, and
        payroll launch stays on track.
      </Typography>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={24} />
        </Stack>
      ) : plan ? (
        <>
          <Stack spacing={1} sx={{ flexGrow: 1 }}>
            {pendingTasks.slice(0, 3).map((task) => (
              <Stack
                key={task.id}
                direction="row"
                spacing={1}
                alignItems="flex-start"
              >
                <Checkbox
                  size="small"
                  checked={task.status === "done"}
                  onChange={() => handleComplete(task.id)}
                />
                <Box>
                  <Typography variant="subtitle2">{task.title}</Typography>
                  {task.description && (
                    <Typography variant="body2" color="text.secondary">
                      {task.description}
                    </Typography>
                  )}
                  {typeof task.due_day_offset === "number" && (
                    <Typography variant="caption" color="text.secondary">
                      Due Day {task.due_day_offset}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))}
            {pendingTasks.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                All tasks completed. Great job!
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="text"
              onClick={onViewAll}
              size="small"
              disabled={!onViewAll}
            >
              View all tasks
            </Button>
          </Stack>
        </>
      ) : (
        <Stack spacing={1}>
          {error && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary">
            Generate a rollout checklist tailored to your company profile.
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate plan"}
          </Button>
        </Stack>
      )}
    </Paper>
  );
}
