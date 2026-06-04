import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, alpha, CircularProgress, Chip } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { brand } from '../../theme';
import { linkedInApi } from '../../api/client';

const MESSAGE_TYPES = [
  { value: 'recruiter', label: 'Recruiter Message' },
  { value: 'hiring_manager', label: 'Hiring Manager Message' },
  { value: 'referral', label: 'Referral Request' },
  { value: 'follow_up', label: 'Follow-Up Message' },
  { value: 'thank_you', label: 'Thank You Message' },
];

const LinkedInPage: React.FC = () => {
  const [messageType, setMessageType] = useState('recruiter');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await linkedInApi.generate({ message_type: messageType, company, role, recipient_name: recipientName || undefined, context: context || undefined });
      return res.data;
    },
    onSuccess: (data) => setResult(data.message),
  });

  const copyToClipboard = () => { navigator.clipboard.writeText(result); };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">LinkedIn Toolkit</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>Generate professional LinkedIn messages for your job search.</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card><CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth><InputLabel>Message Type</InputLabel>
                  <Select value={messageType} label="Message Type" onChange={(e) => setMessageType(e.target.value)}>
                    {MESSAGE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Company" value={company} onChange={(e) => setCompany(e.target.value)} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Role" value={role} onChange={(e) => setRole(e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth label="Recipient Name (Optional)" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}><TextField fullWidth multiline rows={3} label="Additional Context (Optional)" value={context} onChange={(e) => setContext(e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}>
                <Button fullWidth variant="contained" onClick={() => generateMutation.mutate()} disabled={!company || !role || generateMutation.isPending}>
                  {generateMutation.isPending ? 'Generating...' : 'Generate Message'}
                </Button>
              </Grid>
            </Grid>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          {result ? (
            <Card><CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Generated Message</Typography>
                <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyToClipboard}>Copy</Button>
              </Box>
              <Box sx={{ p: 3, background: alpha(brand.navy[800], 0.5), borderRadius: 2, border: `1px solid ${alpha(brand.text.muted, 0.1)}` }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{result}</Typography>
              </Box>
            </CardContent></Card>
          ) : (
            <Card sx={{ py: 8, textAlign: 'center' }}><CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>LinkedIn Toolkit</Typography>
              <Typography variant="body2">Select a message type and generate professional messages for networking.</Typography>
            </CardContent></Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default LinkedInPage;

