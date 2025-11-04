import React from "react";
import PayrollPageTemplate from "./PayrollPageTemplate";
import { payrollPages } from "./config";

const USPayrollPage = () => <PayrollPageTemplate config={payrollPages.usa} />;

export default USPayrollPage;

