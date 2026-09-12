import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider, FormControlLabel, Grid,
  MenuItem, Paper, Stack, Switch, TextField, Typography,
} from '@mui/material';
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import { website } from '../../../utils/api';
import { getAuthedCompanyId } from '../../../utils/authedCompany';
import { getFinanceDocumentSettings, updateFinanceDocumentSettings } from '../financeApi';

const FIELDS = [
  ['business_name', 'Document business name'],
  ['public_email', 'Public email'],
  ['public_phone', 'Public phone'],
  ['website', 'Website'],
  ['address_street', 'Street address'],
  ['address_city', 'City'],
  ['address_state', 'Province / state'],
  ['address_zip', 'Postal / ZIP'],
  ['country_code', 'Country'],
];

const EMPTY_FORM = {
  business_name: '', public_email: '', public_phone: '', website: '',
  address_street: '', address_city: '', address_state: '', address_zip: '',
  country_code: '', logo_media_id: '', show_email: true, show_phone: true,
  show_website: true, address_mode: 'full',
};

const SOURCE_LABELS = {
  per_document: 'This invoice',
  finance_document_profile: 'Finance profile',
  company_profile: 'Company Profile',
  website_header_published: 'Published website header',
  website_header_draft: 'Website header draft',
  finance_tax_profile: 'Finance tax profile',
  fallback: 'Safe fallback',
  unavailable: 'Not configured',
};

const sourceLabel = (value) => SOURCE_LABELS[value] || 'Inherited';

const hydrateForm = (payload) => {
  const identity = payload?.finance_document_identity || {};
  const overrides = identity?.overrides || {};
  const values = Object.fromEntries(FIELDS.map(([key]) => [key, String(overrides[key] || '')]));
  return {
    ...EMPTY_FORM,
    ...values,
    logo_media_id: identity.logo_media_id ? String(identity.logo_media_id) : '',
    show_email: identity.show_email !== false,
    show_phone: identity.show_phone !== false,
    show_website: identity.show_website !== false,
    address_mode: identity.address_mode || 'full',
  };
};

function CurrentValue({ field, hidden }) {
  return (
    <Typography variant='caption' color='text.secondary' display='block' sx={{ mt: 0.5 }}>
      Current value: {hidden ? 'Hidden on Finance documents' : field?.value || 'Not configured'} · Source: {sourceLabel(field?.source)}
    </Typography>
  );
}

export default function FinanceDocumentIdentityCard({ onSettingsLoaded }) {
  const companyId = getAuthedCompanyId();
  const firstFieldRef = useRef(null);
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const applyPayload = useCallback((payload) => {
    setSettings(payload || {});
    setForm(hydrateForm(payload));
    onSettingsLoaded?.(payload || {});
  }, [onSettingsLoaded]);

  useEffect(() => {
    let active = true;
    Promise.all([
      getFinanceDocumentSettings(),
      companyId
        ? website.listMedia({ companyId, offset: 0, limit: 100 }).catch(() => ({ items: [] }))
        : Promise.resolve({ items: [] }),
    ])
      .then(([documentSettings, mediaPayload]) => {
        if (!active) return;
        applyPayload(documentSettings);
        setMedia((mediaPayload?.items || []).filter((item) => String(item?.file_type || '').toLowerCase().startsWith('image')));
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.error || err?.message || 'Unable to load Finance document identity.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [applyPayload, companyId]);

  const identity = settings?.finance_document_identity || {};
  const resolved = useMemo(() => identity.resolved || {}, [identity.resolved]);
  const resolvedFields = useMemo(() => resolved.fields || {}, [resolved.fields]);
  const selectedLogo = media.find((item) => String(item.id) === String(form.logo_media_id));
  const preview = useMemo(() => {
    const valueFor = (key) => {
      const explicit = String(form[key] || '').trim();
      if (explicit) return explicit;
      const field = resolvedFields[key] || {};
      if (field.source === 'finance_document_profile') return field.inherited_value || '';
      return field.value || field.inherited_value || '';
    };
    const address = form.address_mode === 'hidden' ? [] : [
      form.address_mode === 'full' ? valueFor('address_street') : '',
      [valueFor('address_city'), valueFor('address_state')].filter(Boolean).join(', '),
      form.address_mode === 'full' ? valueFor('address_zip') : '',
      valueFor('country_code'),
    ].filter(Boolean);
    const logoField = resolvedFields.logo || {};
    const logo = form.logo_media_id
      ? selectedLogo?.url || resolved.logo_url || ''
      : logoField.source === 'finance_document_profile'
      ? logoField.inherited_value || ''
      : resolved.logo_url || logoField.inherited_value || '';
    return {
      businessName: valueFor('business_name') || 'Business',
      email: form.show_email ? valueFor('public_email') : '',
      phone: form.show_phone ? valueFor('public_phone') : '',
      website: form.show_website ? valueFor('website') : '',
      address,
      logo,
    };
  }, [form, resolved, resolvedFields, selectedLogo]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const payload = await updateFinanceDocumentSettings({
        finance_document_identity: {
          overrides: Object.fromEntries(FIELDS.map(([key]) => [key, form[key] || ''])),
          logo_media_id: form.logo_media_id || null,
          show_email: form.show_email,
          show_phone: form.show_phone,
          show_website: form.show_website,
          address_mode: form.address_mode,
        },
      });
      applyPayload(payload);
      setMessage('Finance document identity saved. Company Profile data was not changed.');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Unable to save Finance document identity.');
    } finally { setSaving(false); }
  };

  const markReviewed = async () => {
    setSaving(true); setError('');
    try {
      const payload = await updateFinanceDocumentSettings({ finance_document_identity: { reviewed: true } });
      applyPayload(payload);
      setMessage('Finance document identity marked as reviewed.');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Unable to update the reminder.');
    } finally { setSaving(false); }
  };

  const uploadLogo = async (file) => {
    if (!file || !companyId) return;
    if (file.size > 5 * 1024 * 1024) { setError('Logo is too large. Maximum size is 5 MB.'); return; }
    setUploading(true); setError('');
    try {
      const payload = await website.uploadMedia(file, { companyId });
      const asset = payload?.items?.[0];
      if (!asset?.id) throw new Error('The upload did not return a reusable media asset.');
      setMedia((current) => [asset, ...current.filter((item) => String(item.id) !== String(asset.id))]);
      setField('logo_media_id', String(asset.id));
      setMessage('Logo uploaded. Save the Finance profile to apply it to documents.');
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Unable to upload the Finance logo.');
    } finally { setUploading(false); }
  };

  if (loading) return (
    <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 1.5 }}>
      <Stack direction='row' spacing={1.5} alignItems='center'><CircularProgress size={22} /><Typography>Loading Finance document identity…</Typography></Stack>
    </Paper>
  );

  return (
    <Paper variant='outlined' sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 1.5 }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant='h6' fontWeight={900}>Finance Document Identity &amp; Branding</Typography>
          <Typography color='text.secondary'>Control what Estimates, Invoices, PDFs, print views, and Finance delivery emails show without changing Company Profile data.</Typography>
        </Box>
        {identity.needs_review ? (
          <Alert severity='info' action={<Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5}>
            <Button color='inherit' size='small' onClick={() => firstFieldRef.current?.focus()}>Review setup</Button>
            <Button color='inherit' size='small' onClick={markReviewed} disabled={saving}>Do not show again</Button>
          </Stack>}>Review your Finance document identity before sending your first Estimate or Invoice.</Alert>
        ) : null}
        {error ? <Alert severity='error'>{error}</Alert> : null}
        {message ? <Alert severity='success'>{message}</Alert> : null}
        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Stack spacing={2}>
              <Typography variant='subtitle1' fontWeight={800}>Optional overrides</Typography>
              <Grid container spacing={1.5}>
                {FIELDS.map(([key, label], index) => {
                  const isAddressField = key.startsWith('address_') || key === 'country_code';
                  const hidden = (key === 'public_email' && !form.show_email) ||
                    (key === 'public_phone' && !form.show_phone) ||
                    (key === 'website' && !form.show_website) ||
                    (isAddressField && form.address_mode === 'hidden') ||
                    (['address_street', 'address_zip'].includes(key) && form.address_mode === 'locality');
                  return <Grid item xs={12} sm={key === 'business_name' ? 12 : 6} key={key}>
                    <TextField fullWidth size='small' label={label + ' override'} value={form[key]}
                      inputRef={index === 0 ? firstFieldRef : undefined}
                      onChange={(event) => setField(key, event.target.value)}
                      placeholder={resolvedFields[key]?.inherited_value || 'Inherit when blank'} />
                    <CurrentValue field={resolvedFields[key]} hidden={hidden} />
                    {form[key] ? <Button size='small' color='inherit' startIcon={<RestartAltOutlinedIcon />}
                      onClick={() => setField(key, '')} sx={{ mt: 0.25 }}>Reset to inherited</Button> : null}
                  </Grid>;
                })}
              </Grid>
              <Divider />
              <Typography variant='subtitle1' fontWeight={800}>Visibility</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0, sm: 2 }} flexWrap='wrap' useFlexGap>
                <FormControlLabel control={<Switch checked={form.show_email} onChange={(_, value) => setField('show_email', value)} />} label='Show email' />
                <FormControlLabel control={<Switch checked={form.show_phone} onChange={(_, value) => setField('show_phone', value)} />} label='Show phone' />
                <FormControlLabel control={<Switch checked={form.show_website} onChange={(_, value) => setField('show_website', value)} />} label='Show website' />
              </Stack>
              <TextField select size='small' label='Address presentation' value={form.address_mode}
                onChange={(event) => setField('address_mode', event.target.value)} sx={{ maxWidth: 360 }}>
                <MenuItem value='full'>Full address</MenuItem>
                <MenuItem value='locality'>City / region / country only</MenuItem>
                <MenuItem value='hidden'>Hidden</MenuItem>
              </TextField>
              <Divider />
              <Typography variant='subtitle1' fontWeight={800}>Document logo</Typography>
              <Typography variant='body2' color='text.secondary'>Inherit the Company or website header logo, select an existing image, or upload a Finance-specific logo. OG images and favicons are never used.</Typography>
              <TextField select size='small' fullWidth label='Finance-specific logo' value={form.logo_media_id}
                onChange={(event) => setField('logo_media_id', event.target.value)}>
                <MenuItem value=''>Inherit canonical logo</MenuItem>
                {form.logo_media_id && !selectedLogo ? <MenuItem value={form.logo_media_id}>Current Finance logo</MenuItem> : null}
                {media.map((item) => <MenuItem value={String(item.id)} key={item.id}>{item.alt_text || item.stored_name || 'Image #' + item.id}</MenuItem>)}
              </TextField>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Button component='label' variant='outlined' startIcon={<UploadOutlinedIcon />} disabled={uploading || !companyId}>
                  {uploading ? 'Uploading…' : 'Upload Finance logo'}
                  <input type='file' accept='image/*' hidden onChange={(event) => {
                    const file = event.target.files?.[0]; if (file) uploadLogo(file); event.target.value = '';
                  }} />
                </Button>
                <Typography variant='caption' color='text.secondary'>Current source: {sourceLabel(resolvedFields.logo?.source)}</Typography>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} lg={5}>
            <Paper variant='outlined' sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.default', position: { lg: 'sticky' }, top: 16 }}>
              <Stack spacing={1.25} alignItems='flex-start'>
                <Typography variant='overline' color='text.secondary'>Customer-facing preview</Typography>
                {preview.logo ? <Box component='img' src={preview.logo} alt='Resolved Finance logo' sx={{ maxWidth: 190, maxHeight: 76, objectFit: 'contain' }} />
                  : <Typography variant='caption' color='text.secondary'>No document logo</Typography>}
                <Typography variant='h6' fontWeight={800}>{preview.businessName}</Typography>
                {preview.address.map((line, index) => <Typography key={line + index} color='text.secondary'>{line}</Typography>)}
                {preview.phone ? <Typography color='text.secondary'>{preview.phone}</Typography> : null}
                {preview.email ? <Typography color='text.secondary'>{preview.email}</Typography> : null}
                {preview.website ? <Typography color='text.secondary'>{preview.website}</Typography> : null}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent='flex-end'>
          <Button variant='contained' onClick={save} disabled={saving || uploading}>{saving ? 'Saving…' : 'Save Finance identity'}</Button>
          {!identity.needs_review ? <Typography variant='caption' color='text.secondary' sx={{ alignSelf: 'center' }}>Reviewed for this company</Typography> : null}
        </Stack>
      </Stack>
    </Paper>
  );
}
