// src/ZoomRedirect.js
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ZoomRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("code");
    // Optional: state parameter can be used to pass the recruiter email
    const state = queryParams.get("state");

    if (code) {
      // Construct endpoint URL with code (and state if available)
      const endpoint = state
        ? `http://localhost:5000/zoom/callback?code=${code}&state=${state}`
        : `http://localhost:5000/zoom/callback?code=${code}`;
      
      axios.get(endpoint)
        .then((response) => {
          console.log("Zoom tokens:", response.data);
          // Optionally, store token info in your app state or notify the user
          navigate("/recruiter"); // Redirect back to the dashboard
        })
        .catch((err) => {
          console.error("Zoom token exchange failed:", err);
          navigate("/"); // Redirect to home or display an error message
        });
    } else {
      console.error("No authorization code found in the URL");
      navigate("/");
    }
  }, [location, navigate]);

  return <div>Processing Zoom authorization...</div>;
};

export default ZoomRedirect;
