import React from "react";
import {
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function LeadImportCard({
  reps,
  value,
  onChange,
  onImport,
  importing,
  batches,
}) {
  return (
    <Paper sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Import Leads</Typography>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV to create leads in bulk. Existing subscribed companies are suppressed automatically and duplicates are marked during import.
            </Typography>
          </div>
          <Button variant="contained" component="label" disabled={importing}>
            {value.file ? "Replace CSV" : "Upload CSV"}
            <input
              hidden
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => onChange("file", e.target.files?.[0] || null)}
            />
          </Button>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            label="Selected file"
            value={value.file?.name || ""}
            placeholder="Choose a CSV file"
            InputProps={{ readOnly: true }}
          />
          <TextField
            select
            label="Assign imported leads to rep"
            value={value.sales_rep_id}
            onChange={(e) => onChange("sales_rep_id", e.target.value)}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">Keep unassigned</MenuItem>
            {reps.map((rep) => (
              <MenuItem key={rep.id} value={rep.id}>{rep.full_name}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Default source"
            value={value.source}
            onChange={(e) => onChange("source", e.target.value)}
            sx={{ minWidth: 180 }}
          />
          <Button variant="outlined" onClick={onImport} disabled={!value.file || importing} sx={{ minWidth: 160 }}>
            {importing ? "Importing..." : "Import leads"}
          </Button>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Accepted CSV structure</Typography>
          <Typography variant="body2" color="text.secondary">
            Use <strong>company_name</strong> as the required column. The importer also accepts friendly aliases like
            <strong> company</strong>, <strong> business_name</strong>, <strong> contact</strong>, <strong> name</strong>,
            <strong> phone_number</strong>, and <strong> domain</strong>.
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, backgroundColor: "grey.50", overflowX: "auto" }}>
            <Typography
              component="pre"
              variant="caption"
              sx={{ m: 0, fontFamily: "monospace", whiteSpace: "pre-wrap" }}
            >
{`company_name,contact_name,phone,email,website,industry,city,country,source,priority
Photo Artisto Corp,Yousef Samak Jalali,+14165550123,contact@photoartisto.com,https://photoartisto.com,Photography,Toronto,Canada,import_march,2
Brow Artisto,Sarah Lee,+14165550124,hello@browartisto.com,https://browartisto.com,Beauty,Toronto,Canada,import_march,1`}
            </Typography>
          </Paper>
          <Typography variant="caption" color="text.secondary">
            Optional columns: <strong>contact_name</strong>, <strong>phone</strong>, <strong>email</strong>, <strong>website</strong>,
            <strong>industry</strong>, <strong>city</strong>, <strong>country</strong>, <strong>source</strong>, <strong>priority</strong>.
            Rows without <strong>company_name</strong> are skipped.
          </Typography>
        </Stack>

        {batches?.length ? (
          <div>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Recent imports</Typography>
            <List dense disablePadding>
              {batches.slice(0, 4).map((batch) => (
                <ListItem key={batch.id} disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={batch.filename || `Batch #${batch.id}`}
                    secondary={`${batch.imported_count} imported • ${batch.duplicate_count} duplicate • ${batch.suppressed_count} suppressed`}
                  />
                </ListItem>
              ))}
            </List>
          </div>
        ) : null}
      </Stack>
    </Paper>
  );
}
