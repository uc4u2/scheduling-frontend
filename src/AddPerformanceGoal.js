import React, { useState } from 'react';
import api from "./utils/api";
import { TextField, Button, Alert } from '@mui/material';

const AddPerformanceGoal = () => {
  const [recruiterId, setRecruiterId] = useState('');
  const [goalName, setGoalName] = useState('');
  const [target, setTarget] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await api.post('/api/manager/performance', {
        recruiter_id: recruiterId,
        goal_name: goalName,
        target
      });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set performance goal');
      setMessage('');
    }
  };

  return (
    <div>
      <h3>Set Performance Goal</h3>
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <TextField 
          label="Recruiter ID" 
          fullWidth 
          value={recruiterId} 
          onChange={(e) => setRecruiterId(e.target.value)} 
          required 
        />
        <TextField 
          label="Goal Name" 
          fullWidth 
          value={goalName} 
          onChange={(e) => setGoalName(e.target.value)} 
          required 
        />
        <TextField 
          label="Target" 
          fullWidth 
          value={target} 
          onChange={(e) => setTarget(e.target.value)} 
          required 
        />
        <Button type="submit" variant="contained">Set Goal</Button>
      </form>
    </div>
  );
};

export default AddPerformanceGoal;
