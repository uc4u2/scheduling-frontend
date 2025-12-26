import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert
} from '@mui/material';
import api from "./utils/api";

const FeedbackNotes = ({ token }) => {
  const [candidateId, setCandidateId] = useState('');
  const [note, setNote] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch feedback logs (for managers)
  const fetchFeedback = async () => {
    try {
      const res = await api.get("/manager/candidate-feedback");
      setFeedbackList(res.data.feedback);
      setError('');
    } catch (err) {
      setError('Failed to fetch feedback');
    }
  };

  useEffect(() => {
    if (token) {
      fetchFeedback();
    }
  }, [token]);

  // Add feedback (for recruiters)
  const handleAddFeedback = async () => {
    if (!candidateId || !note) {
      setError('Candidate ID and note are required');
      return;
    }
    try {
      await api.post("/recruiter/candidate-feedback", { candidate_id: candidateId, note });
      setMessage('Feedback added successfully');
      setError('');
      setCandidateId('');
      setNote('');
      fetchFeedback();
    } catch (err) {
      setError('Failed to add feedback');
    }
  };

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        Feedback & Notes System
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {message && <Alert severity="success">{message}</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          label="Candidate ID"
          value={candidateId}
          onChange={(e) => setCandidateId(e.target.value)}
          sx={{ mr: 2 }}
        />
        <TextField
          label="Feedback Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={handleAddFeedback}>
          Add Feedback
        </Button>
      </Paper>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Feedback Logs
        </Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Candidate ID</TableCell>
              <TableCell>Feedback</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Recruiter</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feedbackList.map((fb) => (
              <TableRow key={fb.id}>
                <TableCell>{fb.candidate_id}</TableCell>
                <TableCell>{fb.note}</TableCell>
                <TableCell>{fb.timestamp}</TableCell>
                <TableCell>{fb.recruiter}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default FeedbackNotes;
