import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    const load = async () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      try {
        const res = await axios.get(`${API_URL}/api/departments`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (Array.isArray(res.data)) {
          setDepartments(res.data);
        }
      } catch {
        setDepartments([]);
      }
    };
    load();
  }, []);
  return departments;
};

export const useEmployeesByDepartment = () => {
  const [employees, setEmployees] = useState({ all: [] });
  useEffect(() => {
    const load = async () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      try {
        const res = await axios.get(`${API_URL}/manager/recruiters`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const list = Array.isArray(res.data?.recruiters) ? res.data.recruiters : Array.isArray(res.data) ? res.data : [];
        const grouped = { all: list };
        list.forEach((emp) => {
          const dept = emp.department_id || emp.departmentId || "none";
          if (!grouped[dept]) grouped[dept] = [];
          grouped[dept].push(emp);
        });
        setEmployees(grouped);
      } catch {
        setEmployees({ all: [] });
      }
    };
    load();
  }, []);
  return employees;
};
