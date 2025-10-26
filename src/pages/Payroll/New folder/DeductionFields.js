import React from "react";
import { Grid, TextField, Typography } from "@mui/material";
import { formatCurrency } from "../../utils/formatters";

const DeductionFields = ({ payroll, region, handleFieldChange }) => {
  const gross = (payroll.hours_worked || 0) * (payroll.rate || 0);

  const computeAmount = (percent) => (gross * (percent || 0)) / 100;

  return (
    <>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Deductions
      </Typography>
      <Grid container spacing={2}>
        {region === "ca" &&
          (payroll.province === "QC" ? (
            <>
              {/* QPP */}
              <PercentAndAmount
                label="QPP"
                field="qpp"
                value={payroll.qpp}
                amount={computeAmount(payroll.qpp)}
                handleFieldChange={handleFieldChange}
              />
              {/* EI */}
              <PercentAndAmount
                label="EI"
                field="ei"
                value={payroll.ei}
                amount={computeAmount(payroll.ei)}
                handleFieldChange={handleFieldChange}
              />
              {/* RQAP */}
              <PercentAndAmount
                label="RQAP"
                field="rqap"
                value={payroll.rqap}
                amount={computeAmount(payroll.rqap)}
                handleFieldChange={handleFieldChange}
              />
            </>
          ) : (
            <>
              {/* CPP */}
              <PercentAndAmount
                label="CPP"
                field="cpp"
                value={payroll.cpp}
                amount={computeAmount(payroll.cpp)}
                handleFieldChange={handleFieldChange}
              />
              {/* EI */}
              <PercentAndAmount
                label="EI"
                field="ei"
                value={payroll.ei}
                amount={computeAmount(payroll.ei)}
                handleFieldChange={handleFieldChange}
              />
            </>
          ))}

        {region === "us" && (
          <>
            {/* FICA */}
            <PercentAndAmount
              label="FICA"
              field="fica"
              value={payroll.fica}
              amount={computeAmount(payroll.fica)}
              handleFieldChange={handleFieldChange}
            />
            {/* Medicare */}
            <PercentAndAmount
              label="Medicare"
              field="medicare"
              value={payroll.medicare}
              amount={computeAmount(payroll.medicare)}
              handleFieldChange={handleFieldChange}
            />
          </>
        )}
      </Grid>
    </>
  );
};

const PercentAndAmount = ({ label, field, value, amount, handleFieldChange }) => (
  <>
    <Grid item xs={12} md={3}>
      <TextField
        label={`${label} (%)`}
        type="number"
        value={value || 0}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        fullWidth
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <TextField
        label={`${label} Amount ($)`}
        value={formatCurrency(amount)}
        fullWidth
        InputProps={{ readOnly: true }}
      />
    </Grid>
  </>
);

export default DeductionFields;
