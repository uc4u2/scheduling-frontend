// src/pages/client/ClientReviews.js
import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  Box, Typography, Paper, Button, Rating, TextField, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress
} from "@mui/material";
import api from "../../utils/api";
import { persistTenantSlug, resolveTenantSlug } from "../../utils/clientTenant";

export default function ClientReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ appointment_id: "", rating: 0, comment: "" });
  const location = useLocation();
  const { slug: routeSlug } = useParams();
  const tenantSlug = resolveTenantSlug({ routeSlug, search: location.search });

  useEffect(() => {
    if (tenantSlug) persistTenantSlug(tenantSlug);
  }, [tenantSlug]);

  useEffect(() => {
    if (!tenantSlug) {
      setReviews([]);
      setLoading(false);
      return;
    }
    api.get(`/public/${tenantSlug}/reviews`).then(res => setReviews(res.data)).finally(() => setLoading(false));
  }, [tenantSlug]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleRating = (e, value) => setForm(f => ({ ...f, rating: value }));

  const handleSubmit = async () => {
    if (!tenantSlug) return alert("Open the correct business site before submitting a review.");
    if (!form.appointment_id || !form.rating) return alert("Appointment and rating required.");
    const token = localStorage.getItem("token");
    await api.post(`/client/${encodeURIComponent(tenantSlug)}/feedback/review`, form, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
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
