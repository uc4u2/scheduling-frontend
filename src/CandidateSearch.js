import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
  Chip
} from '@mui/material';
import axios from 'axios';

const CandidateSearch = ({ token }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const toConversionLabel = (value) => {
    const status = (value || '').toLowerCase();
    if (!status || status === 'none') return 'Not requested';
    if (status === 'pending') return 'Pending';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    return status;
  };
  const toConversionColor = (value) => {
    const status = (value || '').toLowerCase();
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'error';
    if (status === 'pending') return 'warning';
    return 'default';
  };
  const [filters, setFilters] = useState({
    job_applied: '',
    recruiter_id: '',
    status: ''
  });
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState('');

  const fetchCandidates = async () => {
    try {
      const response = await axios.get(`${API_URL}/manager/candidate-search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      setCandidates(response.data.candidates);
      setError('');
    } catch (err) {
      setError('Failed to fetch candidates');
    }
  };

  useEffect(() => {
    if (token) {
      fetchCandidates();
    }
  }, [token]);

  const handleInputChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = () => {
    fetchCandidates();
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Candidate Search & Smart Filters
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Job Applied For"
          name="job_applied"
          value={filters.job_applied}
          onChange={handleInputChange}
          sx={{ mr: 2 }}
        />
        <TextField
          label="Recruiter ID"
          name="recruiter_id"
          value={filters.recruiter_id}
          onChange={handleInputChange}
          sx={{ mr: 2 }}
        />
        <TextField
          label="Status"
          name="status"
          value={filters.status}
          onChange={handleInputChange}
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Job Applied</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Conversion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.job_applied}</TableCell>
                <TableCell>{c.status}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={toConversionLabel(c.conversion_status)}
                    color={toConversionColor(c.conversion_status)}
                    variant={c.conversion_status ? 'filled' : 'outlined'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default CandidateSearch;
