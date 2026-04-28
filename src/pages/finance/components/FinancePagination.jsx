import React from "react";
import { Paper, TablePagination } from "@mui/material";

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function FinancePagination({
  pagination,
  page = 1,
  perPage = 25,
  onPageChange,
  onPerPageChange,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
}) {
  if (!pagination) return null;

  return (
    <Paper variant="outlined">
      <TablePagination
        component="div"
        count={Number(pagination.total || 0)}
        page={Math.max(0, Number(page || 1) - 1)}
        onPageChange={(_, nextPage) => onPageChange?.(nextPage + 1)}
        rowsPerPage={Number(perPage || pagination.per_page || 25)}
        onRowsPerPageChange={(event) => onPerPageChange?.(Number(event.target.value || 25))}
        rowsPerPageOptions={rowsPerPageOptions}
        labelDisplayedRows={({ from, to, count }) => `Showing ${from}-${to} of ${count === -1 ? to : count}`}
      />
    </Paper>
  );
}
