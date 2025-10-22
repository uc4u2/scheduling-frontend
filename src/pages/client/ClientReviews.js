// src/pages/client/ClientReviews.js
import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Rating, TextField, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress
} from "@mui/material";
import axios from "axios";

export default function ClientReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ appointment_id: "", rating: 0, comment: "" });

  useEffect(() => {
    axios.get("/public/reviews").then(res => setReviews(res.data)).finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleRating = (e, value) => setForm(f => ({ ...f, rating: value }));

  const handleSubmit = async () => {
    if (!form.appointment_id || !form.rating) return alert("Appointment and rating required.");
    await axios.post("/public/review", form);
    setForm({ appointment_id: "", rating: 0, comment: "" });
    alert("Thank you for your review!");
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>My Reviews</Typography>
      <Paper sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle1">Leave a Review</Typography>
        <TextField
          label="Appointment ID"
          name="appointment_id"
          value={form.appointment_id}
          onChange={handleChange}
          margin="normal"
          fullWidth
        />
        <Rating
          name="rating"
          value={form.rating}
          onChange={handleRating}
          precision={1}
        />
        <TextField
          label="Comment"
          name="comment"
          value={form.comment}
          onChange={handleChange}
          margin="normal"
          fullWidth
        />
        <Button variant="contained" onClick={handleSubmit}>
          Submit Review
        </Button>
      </Paper>
      <Typography variant="subtitle1" sx={{ mt: 2 }}>Previous Reviews</Typography>
      <Paper>
        {loading ? <CircularProgress /> : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rating</TableCell>
                <TableCell>Comment</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map(r => (
                <TableRow key={r.id}>
                  <TableCell><Rating value={r.rating} readOnly /></TableCell>
                  <TableCell>{r.comment}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow><TableCell colSpan={3}>No reviews yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
