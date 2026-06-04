import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button, Grid, Select, MenuItem, FormControl, InputLabel, alpha, CircularProgress } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { brand } from '../../theme';
import { coverLetterApi, masterResumeApi } from '../../api/client';

const CoverLetterPage: React.FC = () => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jdText, setJdText] = useState('');
  const [letterType, setLetterType] = useState('ats_friendly');
  const [result, setResult] = useState<any>(null);

  const { data: activeResume } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => { try { return (await masterResumeApi.getActive()).data; } catch { return null; } },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!activeResume?.id) throw new Error('No active resume');
      const res = await coverLetterApi.generate({ master_resume_id: activeResume.id, job_description_text: jdText, company, role, letter_type: letterType });
      return res.data;
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">Cover Letter Studio</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>Generate ATS-friendly, recruiter-optimized cover letters.</Typography>
      </Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card><CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Company" value={company} onChange={(e) => setCompany(e.target.value)} /></Grid>
              <Grid size={{ xs: 6 }}><TextField fullWidth label="Role" value={role} onChange={(e) => setRole(e.target.value)} /></Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth><InputLabel>Letter Type</InputLabel>
                  <Select value={letterType} label="Letter Type" onChange={(e) => setLetterType(e.target.value)}>
                    <MenuItem value="ats_friendly">ATS Friendly</MenuItem>
                    <MenuItem value="company_specific">Company Specific</MenuItem>
                    <MenuItem value="recruiter_friendly">Recruiter Friendly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth multiline rows={12} label="Job Description" value={jdText} onChange={(e) => setJdText(e.target.value)} placeholder="Paste the job description..." />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button fullWidth variant="contained" onClick={() => generateMutation.mutate()} disabled={!company || !role || jdText.length < 50 || generateMutation.isPending}>
                  {generateMutation.isPending ? 'Generating...' : 'Generate Cover Letter'}
                </Button>
              </Grid>
            </Grid>
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          {result ? (
            <Card><CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Generated Cover Letter</Typography>
              <Box sx={{ p: 3, background: alpha(brand.navy[800], 0.5), borderRadius: 2, border: `1px solid ${alpha(brand.text.muted, 0.1)}` }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{result.content}</Typography>
              </Box>
            </CardContent></Card>
          ) : (
            <Card sx={{ py: 8, textAlign: 'center' }}><CardContent>
              <Typography variant="h4" sx={{ mb: 1 }}>Cover Letter Studio</Typography>
              <Typography variant="body2">Fill in the details and generate a professional cover letter.</Typography>
            </CardContent></Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CoverLetterPage;

