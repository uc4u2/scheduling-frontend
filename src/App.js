import React, { useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from "@mui/material";
import NavBar from "./NavBar";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import RecruiterDashboard from "./RecruiterDashboard";
import CandidateBooking from "./CandidateBooking";
import CancelBooking from "./CancelBooking";
import CalendarView from "./CalendarView";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ZoomRedirect from "./ZoomRedirect";

const Home = () => (
  <Container sx={{ mt: 5, textAlign: "center" }}>
    <h1>Welcome to the Scheduler App</h1>
    <p>Please login as a recruiter or book an interview slot as a candidate.</p>
  </Container>
);

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  return (
    <Router>
      <NavBar token={token} setToken={setToken} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/recruiter/*" element={<RecruiterDashboard token={token} />} />
        <Route path="/book-slot/:recruiterId/:token" element={<CandidateBooking />} />
        <Route path="/cancel-booking" element={<CancelBooking />} />
        <Route path="/calendar" element={<CalendarView />} />
        <Route path="/analytics" element={<AnalyticsDashboard token={token} />} />
        <Route path="/redirect" element={<ZoomRedirect />} />
      </Routes>
    </Router>
  );
};

export default App;
