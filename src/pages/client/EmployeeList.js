import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container, Grid, Card, CardContent, CardActions, Typography, Button, CircularProgress, TextField
} from "@mui/material";

const EmployeeList = () => {
  const { slug } = useParams();
  const searchParams = new URLSearchParams(window.location.search);
  const departmentId = searchParams.get("department_id") || "";

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const url = departmentId
      ? `/public/${slug}/artists?department_id=${departmentId}`
      : `/public/${slug}/artists`;

    api.get(url)
      .then(res => setEmployees(res.data))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, [slug, departmentId]);

  const filtered = employees.filter(
    emp =>
      emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (emp.bio || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container sx={{ mt: 5 }}>
      <Typography variant="h4" mb={2}>Our Team</Typography>

      <TextField
        label="Search"
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 3, width: "300px" }}
      />

      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={3}>
          {filtered.map(emp => (
            <Grid item xs={12} md={6} lg={4} key={emp.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{emp.full_name}</Typography>
                  <Typography variant="body2">{emp.bio || "No bio provided."}</Typography>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate(`/${slug}/employees/${emp.id}?department_id=${departmentId}`)}
                  >
                    View Profile
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default EmployeeList;
