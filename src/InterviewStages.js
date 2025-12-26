import React, { useEffect, useState } from 'react';
import api from "./utils/api";
import { Button, TextField, Grid, Typography, Alert } from '@mui/material';

const InterviewStages = () => {
  const [stages, setStages] = useState([]);
  const [newStage, setNewStage] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await api.get('/api/manager/interview-stages');
        setStages(response.data);
      } catch (err) {
        setError('Failed to load interview stages');
      }
    };

    fetchStages();
  }, []);

  const handleAddStage = async () => {
    if (!newStage) return;
    try {
      await api.post('/api/manager/interview-stages', { name: newStage });
      setSuccessMessage('Interview stage added successfully');
      setError('');
      setNewStage('');
    } catch (err) {
      setError('Failed to add interview stage');
      setSuccessMessage('');
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Interview Stages Management
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Grid container spacing={3}>
        {stages.map((stage) => (
          <Grid item xs={12} sm={6} md={4} key={stage.id}>
            <div>
              <Typography variant="h6">{stage.name}</Typography>
              <Typography variant="body2">{stage.description}</Typography>
            </div>
          </Grid>
        ))}
      </Grid>

      <TextField
        label="New Stage Name"
        value={newStage}
        onChange={(e) => setNewStage(e.target.value)}
        fullWidth
      />
      <Button onClick={handleAddStage} variant="contained">
        Add Stage
      </Button>
    </div>
  );
};

export default InterviewStages;
