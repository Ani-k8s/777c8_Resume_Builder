import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, IconButton, alpha,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Chip,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { brand } from '../../theme';
import { recruiterApi } from '../../api/client';

const RecruitersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', linkedin_url: '', notes: '' });

  const { data: recruiters = [] } = useQuery({
    queryKey: ['recruiters'],
    queryFn: async () => { const res = await recruiterApi.list(); return res.data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingId) return recruiterApi.update(editingId, form);
      return recruiterApi.create(form);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['recruiters'] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recruiterApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruiters'] }),
  });

  const handleClose = () => { setDialogOpen(false); setEditingId(null); setForm({ name: '', company: '', email: '', phone: '', linkedin_url: '', notes: '' }); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h2">Recruiter CRM</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>Manage your recruiter contacts and follow-ups.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>Add Recruiter</Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow>
              <TableCell>Name</TableCell><TableCell>Company</TableCell><TableCell>Contact</TableCell><TableCell>Last Contact</TableCell><TableCell>Notes</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {recruiters.map((r: any) => (
                <TableRow key={r.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{r.name}</Typography></TableCell>
                  <TableCell>{r.company || '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {r.email && <Tooltip title={r.email}><IconButton size="small"><EmailOutlinedIcon sx={{ fontSize: '1rem' }} /></IconButton></Tooltip>}
                      {r.linkedin_url && <Tooltip title="LinkedIn"><IconButton size="small" onClick={() => window.open(r.linkedin_url, '_blank')}><LinkedInIcon sx={{ fontSize: '1rem' }} /></IconButton></Tooltip>}
                    </Box>
                  </TableCell>
                  <TableCell>{r.last_contact_date ? new Date(r.last_contact_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.notes || '—'}</Typography></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditingId(r.id); setForm(r); setDialogOpen(true); }}><EditOutlinedIcon sx={{ fontSize: '1rem' }} /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(r.id)}><DeleteOutlineIcon sx={{ fontSize: '1rem' }} /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {recruiters.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}><Typography variant="body2">No recruiters added yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Recruiter' : 'New Recruiter'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth label="LinkedIn URL" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={3} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()} disabled={!form.name}>{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecruitersPage;

