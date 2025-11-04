import React from "react";
import PayrollPageTemplate from "./PayrollPageTemplate";
import { payrollPages } from "./config";

const PayslipPortalPage = () => <PayrollPageTemplate config={payrollPages.payslips} />;

export default PayslipPortalPage;

