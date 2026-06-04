import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Select, MenuItem, FormControl,
  InputLabel, Grid, Chip, IconButton, alpha, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { brand } from '../../theme';
import { applicationApi } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  'Draft': brand.text.muted,
  'Applied': brand.info,
  'HR Screening': '#AB47BC',
  'Technical Round 1': brand.warning,
  'Technical Round 2': brand.warning,
  'Manager Round': '#FF7043',
  'Offer': brand.success,
  'Joined': brand.success,
  'Rejected': brand.error,
  'Withdrawn': brand.text.muted,
};

const STATUSES = ['Draft', 'Applied', 'HR Screening', 'Technical Round 1', 'Technical Round 2', 'Manager Round', 'Offer', 'Joined', 'Rejected', 'Withdrawn'];

const ApplicationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ company: '', role: '', status: 'Draft', location: '', application_url: '', notes: '', salary_min: '', salary_max: '' });

  const { data: applications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => { const res = await applicationApi.list(); return res.data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseFloat(form.salary_min) : null,
        salary_max: form.salary_max ? parseFloat(form.salary_max) : null,
      };
      if (editingId) return applicationApi.update(editingId, payload);
      return applicationApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => applicationApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ company: '', role: '', status: 'Draft', location: '', application_url: '', notes: '', salary_min: '', salary_max: '' });
  };

  const handleEdit = (app: any) => {
    setEditingId(app.id);
    setForm({
      company: app.company, role: app.role, status: app.status,
      location: app.location || '', application_url: app.application_url || '',
      notes: app.notes || '', salary_min: app.salary_min?.toString() || '', salary_max: app.salary_max?.toString() || '',
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h2">Application Tracker</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>Track all your job applications in one place.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Application
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {['Applied', 'HR Screening', 'Offer', 'Rejected'].map((status) => (
          <Grid size={{ xs: 3 }} key={status}>
            <Card>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption">{status}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: STATUS_COLORS[status] }}>
                  {applications.filter((a: any) => a.status === status).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>ATS Score</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app: any) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{app.company}</Typography>
                  </TableCell>
                  <TableCell>{app.role}</TableCell>
                  <TableCell>
                    <Chip label={app.status} size="small" sx={{
                      background: alpha(STATUS_COLORS[app.status] || brand.text.muted, 0.12),
                      color: STATUS_COLORS[app.status] || brand.text.muted,
                      fontWeight: 600, fontSize: '0.7rem',
                    }} />
                  </TableCell>
                  <TableCell>{app.location || '—'}</TableCell>
                  <TableCell>{app.ats_score ? `${Math.round(app.ats_score)}%` : '—'}</TableCell>
                  <TableCell>{app.created_at ? new Date(app.created_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell align="right">
                    {app.application_url && (
                      <Tooltip title="Open URL">
                        <IconButton size="small" onClick={() => window.open(app.application_url, '_blank')}>
                          <OpenInNewIcon sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(app)}>
                        <EditOutlinedIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(app.id)}>
                        <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2">No applications yet. Add your first application to start tracking.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Application' : 'New Application'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Application URL" value={form.application_url} onChange={(e) => setForm({ ...form, application_url: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Min Salary" type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Max Salary" type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={!form.company || !form.role}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApplicationsPage;

