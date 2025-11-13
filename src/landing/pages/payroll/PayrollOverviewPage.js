import React from "react";
import PayrollPageTemplate from "./PayrollPageTemplate";
import { payrollPages } from "./config";

const PayrollOverviewPage = () => <PayrollPageTemplate config={payrollPages.overview} />;

export default PayrollOverviewPage;
