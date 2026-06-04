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
import { brand } from '../../theme';
import { interviewApi } from '../../api/client';

const RESULT_COLORS: Record<string, string> = {
  Pending: brand.warning,
  Passed: brand.success,
  Failed: brand.error,
  Cancelled: brand.text.muted,
};

const InterviewsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    application_id: '', interview_type: '', interviewer_name: '',
    questions: '', feedback: '', result: 'Pending', notes: '', interview_date: '',
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => { const res = await interviewApi.list(); return res.data; },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        application_id: parseInt(form.application_id) || 1,
        interview_date: form.interview_date || null,
      };
      if (editingId) return interviewApi.update(editingId, payload);
      return interviewApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => interviewApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const handleClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ application_id: '', interview_type: '', interviewer_name: '', questions: '', feedback: '', result: 'Pending', notes: '', interview_date: '' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h2">Interview Tracker</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>Log and track all your interviews, questions, and outcomes.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Interview
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Interviewer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {interviews.map((iv: any) => (
                <TableRow key={iv.id} hover>
                  <TableCell><Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{iv.interview_type || 'General'}</Typography></TableCell>
                  <TableCell>{iv.interviewer_name || '—'}</TableCell>
                  <TableCell>{iv.interview_date ? new Date(iv.interview_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={iv.result} size="small" sx={{
                      background: alpha(RESULT_COLORS[iv.result] || brand.text.muted, 0.12),
                      color: RESULT_COLORS[iv.result] || brand.text.muted, fontWeight: 600, fontSize: '0.7rem',
                    }} />
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{iv.notes || '—'}</Typography></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setEditingId(iv.id); setForm({ ...iv, application_id: iv.application_id?.toString() || '' }); setDialogOpen(true); }}>
                      <EditOutlinedIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(iv.id)}>
                      <DeleteOutlineIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {interviews.length === 0 && (
                <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6 }}><Typography variant="body2">No interviews logged yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Interview' : 'New Interview'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Application ID" value={form.application_id} onChange={(e) => setForm({ ...form, application_id: e.target.value })} /></Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth><InputLabel>Type</InputLabel>
                <Select value={form.interview_type} label="Type" onChange={(e) => setForm({ ...form, interview_type: e.target.value })}>
                  {['Phone Screen', 'Technical', 'Behavioral', 'System Design', 'Manager', 'HR'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}><TextField fullWidth label="Interviewer" value={form.interviewer_name} onChange={(e) => setForm({ ...form, interviewer_name: e.target.value })} /></Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth><InputLabel>Result</InputLabel>
                <Select value={form.result} label="Result" onChange={(e) => setForm({ ...form, result: e.target.value })}>
                  {['Pending', 'Passed', 'Failed', 'Cancelled'].map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={3} label="Questions Asked" value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={2} label="Feedback" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} /></Grid>
            <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={() => saveMutation.mutate()}>{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewsPage;

