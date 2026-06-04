import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid, Chip,
  alpha, CircularProgress, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { brand } from '../../theme';
import { jobAnalysisApi, atsApi, masterResumeApi } from '../../api/client';

const AnalyzeJDPage: React.FC = () => {
  const [jdText, setJdText] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [atsResult, setAtsResult] = useState<any>(null);

  const { data: activeResume } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try { const res = await masterResumeApi.getActive(); return res.data; }
      catch { return null; }
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await jobAnalysisApi.analyze({ raw_text: jdText, company, role });
      return res.data;
    },
    onSuccess: async (data) => {
      setAnalysisResult(data);
      // Auto-calculate ATS score if active resume exists
      if (activeResume?.id && data?.id) {
        try {
          const atsRes = await atsApi.calculate(activeResume.id, data.id);
          setAtsResult(atsRes.data);
        } catch (e) { console.error('ATS calculation failed', e); }
      }
    },
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">Job Description Analyzer</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Paste a job description to extract keywords, skills, requirements, and calculate ATS compatibility.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Input Panel */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>Job Description</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth size="small" label="Role" value={role} onChange={(e) => setRole(e.target.value)} />
                </Grid>
              </Grid>
              <TextField
                fullWidth multiline rows={18}
                label="Paste Job Description Here"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the complete job description text here..."
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth variant="contained"
                startIcon={analyzeMutation.isPending ? <CircularProgress size={16} /> : <SearchOutlinedIcon />}
                onClick={() => analyzeMutation.mutate()}
                disabled={jdText.length < 50 || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze Job Description'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Panel */}
        <Grid size={{ xs: 12, md: 7 }}>
          {analysisResult ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* ATS Score Card */}
              {atsResult && (
                <Card sx={{ border: `1px solid ${alpha(brand.gold.main, 0.3)}` }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box sx={{
                        width: 80, height: 80, borderRadius: '50%',
                        border: `3px solid ${atsResult.overall_score >= 80 ? brand.success : atsResult.overall_score >= 60 ? brand.warning : brand.error}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                      }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: 1 }}>
                          {Math.round(atsResult.overall_score)}
                        </Typography>
                        <Typography sx={{ fontSize: '0.6rem', color: brand.text.muted }}>ATS</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h4">ATS Compatibility Score</Typography>
                        <Grid container spacing={2} sx={{ mt: 0.5 }}>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption">Keyword Coverage</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{Math.round(atsResult.keyword_coverage)}%</Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption">Skill Match</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{Math.round(atsResult.skill_match)}%</Typography>
                          </Grid>
                          <Grid size={{ xs: 4 }}>
                            <Typography variant="caption">Experience Match</Typography>
                            <Typography sx={{ fontWeight: 700 }}>{Math.round(atsResult.experience_match)}%</Typography>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Matched / Missing Keywords */}
              {atsResult && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" sx={{ mb: 1, color: brand.success }}>
                          ✓ Matched Keywords ({atsResult.matched_keywords?.length || 0})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {atsResult.matched_keywords?.map((kw: string, i: number) => (
                            <Chip key={i} label={kw} size="small" icon={<CheckCircleIcon />}
                              sx={{ background: alpha(brand.success, 0.12), color: brand.success }} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Card>
                      <CardContent>
                        <Typography variant="h5" sx={{ mb: 1, color: brand.error }}>
                          ✗ Missing Keywords ({atsResult.missing_keywords?.length || 0})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {atsResult.missing_keywords?.map((kw: string, i: number) => (
                            <Chip key={i} label={kw} size="small" icon={<CancelIcon />}
                              sx={{ background: alpha(brand.error, 0.12), color: brand.error }} />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Extracted Skills & Technologies */}
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 1.5 }}>Extracted Analysis</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="h6">Skills</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {analysisResult.analysis?.skills?.map((s: string, i: number) => (
                          <Chip key={i} label={s} size="small" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="h6">Technologies</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {analysisResult.analysis?.technologies?.map((t: string, i: number) => (
                          <Chip key={i} label={t} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="h6">Tools</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {analysisResult.analysis?.tools?.map((t: string, i: number) => (
                          <Chip key={i} label={t} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="h6">Certifications</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {analysisResult.analysis?.certifications?.map((c: string, i: number) => (
                          <Chip key={i} label={c} size="small" sx={{ background: alpha(brand.gold.main, 0.12), color: brand.gold.light }} />
                        ))}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 1 }}>Requirements</Typography>
                  {analysisResult.analysis?.requirements?.map((r: string, i: number) => (
                    <Typography key={i} variant="body2" sx={{ py: 0.3, pl: 1, borderLeft: `2px solid ${alpha(brand.gold.main, 0.3)}`, mb: 0.5 }}>
                      {r}
                    </Typography>
                  ))}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Card sx={{ py: 8, textAlign: 'center' }}>
              <CardContent>
                <SearchOutlinedIcon sx={{ fontSize: 48, color: brand.text.muted, mb: 2 }} />
                <Typography variant="h4" sx={{ mb: 1 }}>Paste a Job Description</Typography>
                <Typography variant="body2">
                  The analyzer will extract skills, keywords, requirements, and calculate your ATS compatibility score.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyzeJDPage;

