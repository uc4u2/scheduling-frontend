import { useEffect, useState } from "react";
import api from "../../../utils/api";

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    const load = async () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      try {
        const res = await api.get(`/api/departments`, {
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

export const useEmployeesByDepartment = (options = {}) => {
  const { includeArchived = false } = options;
  const [employees, setEmployees] = useState({ all: [] });
  useEffect(() => {
    const load = async () => {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : "";
      try {
        const res = await api.get(`/manager/recruiters`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: includeArchived ? { include_archived: 1 } : {},
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
  }, [includeArchived]);
  return employees;
};
