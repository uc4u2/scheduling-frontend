import React, { useEffect, useState } from 'react';
import api from "./utils/api";
import { Button, Alert, Typography, Grid, Card, CardContent } from '@mui/material';

const JobOpenings = () => {
  const [jobOpenings, setJobOpenings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobOpenings = async () => {
      try {
        const response = await api.get('/api/manager/job-openings');
        setJobOpenings(response.data);
      } catch (err) {
        setError('Failed to load job openings');
      }
    };

    fetchJobOpenings();
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Job Openings
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {jobOpenings.map((job) => (
          <Grid item xs={12} sm={6} md={4} key={job.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{job.title}</Typography>
                <Typography variant="body2">{job.status}</Typography>
                <Typography variant="body2">Created at: {new Date(job.created_at).toLocaleDateString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default JobOpenings;
