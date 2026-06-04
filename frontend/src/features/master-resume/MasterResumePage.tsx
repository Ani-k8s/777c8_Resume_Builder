import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, alpha, IconButton,
  Radio, RadioGroup, FormControlLabel, Switch, Tooltip, Divider, Alert,
  CircularProgress, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HistoryIcon from '@mui/icons-material/History';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { brand } from '../../theme';
import { masterResumeApi } from '../../api/client';

const MasterResumePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [versionsOpen, setVersionsOpen] = useState<number | null>(null);

  const { data: resumeData, isLoading } = useQuery({
    queryKey: ['masterResumes'],
    queryFn: async () => {
      const res = await masterResumeApi.list();
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile || !uploadName) return;
      return masterResumeApi.upload(uploadFile, uploadName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterResumes'] });
      setUploadOpen(false);
      setUploadFile(null);
      setUploadName('');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => masterResumeApi.activate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterResumes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => masterResumeApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterResumes'] }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => masterResumeApi.duplicate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['masterResumes'] }),
  });

  const { data: versions } = useQuery({
    queryKey: ['resumeVersions', versionsOpen],
    queryFn: async () => {
      if (!versionsOpen) return [];
      const res = await masterResumeApi.getVersions(versionsOpen);
      return res.data;
    },
    enabled: !!versionsOpen,
  });

  const resumes = resumeData?.resumes || [];

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h2">Master Resume Library</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Upload and manage your master resumes. The active resume is used as the source of truth for all AI-generated content.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUploadOutlinedIcon />}
          onClick={() => setUploadOpen(true)}
        >
          Upload Resume
        </Button>
      </Box>

      {/* Source of Truth Badge */}
      <Alert
        severity="info"
        icon={<CheckCircleOutlineIcon />}
        sx={{
          mb: 3,
          background: alpha(brand.gold.main, 0.08),
          border: `1px solid ${alpha(brand.gold.main, 0.2)}`,
          color: brand.text.primary,
          '& .MuiAlert-icon': { color: brand.gold.main },
        }}
      >
        <strong>Source of Truth Enabled</strong> — The AI will NEVER fabricate information. All generated content is based strictly on your active master resume.
      </Alert>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: brand.gold.main }} />
        </Box>
      ) : resumes.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: brand.text.muted, mb: 2 }} />
            <Typography variant="h4" sx={{ mb: 1 }}>No Master Resume Uploaded</Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Upload your master resume (PDF, DOCX, or TXT) to get started.
            </Typography>
            <Button variant="contained" onClick={() => setUploadOpen(true)}>
              Upload Your First Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {resumes.map((resume: any) => (
            <Grid size={{ xs: 12 }} key={resume.id}>
              <Card sx={{
                border: resume.is_active ? `1px solid ${alpha(brand.gold.main, 0.4)}` : undefined,
                background: resume.is_active ? alpha(brand.gold.main, 0.04) : undefined,
              }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
                  {/* Radio Selection */}
                  <Radio
                    checked={resume.is_active}
                    onChange={() => activateMutation.mutate(resume.id)}
                    sx={{
                      color: brand.text.muted,
                      '&.Mui-checked': { color: brand.gold.main },
                    }}
                  />

                  {/* Resume Info */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {resume.name}
                      </Typography>
                      {resume.is_active && (
                        <Chip label="Active" size="small" sx={{
                          background: alpha(brand.gold.main, 0.15),
                          color: brand.gold.main,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                        }} />
                      )}
                      <Chip label={resume.file_type?.toUpperCase() || 'N/A'} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                      <Chip label={`v${resume.version}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                    </Box>
                    <Typography variant="body2" sx={{ mt: 0.3 }}>
                      {resume.extracted_data?.experience?.length || 0} experiences · {resume.extracted_data?.skills?.length || 0} skills · {resume.extracted_data?.certifications?.length || 0} certifications
                    </Typography>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Version History">
                      <IconButton size="small" onClick={() => setVersionsOpen(resume.id)}>
                        <HistoryIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton size="small" onClick={() => duplicateMutation.mutate(resume.id)}>
                        <ContentCopyIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => deleteMutation.mutate(resume.id)} color="error">
                        <DeleteOutlineIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>

                {/* Extracted Data Preview */}
                {resume.extracted_data && (
                  <Box sx={{ px: 3, pb: 2 }}>
                    <Accordion
                      sx={{
                        background: 'transparent', boxShadow: 'none',
                        '&:before': { display: 'none' },
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0, minHeight: 36 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          View Extracted Data
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails sx={{ px: 0 }}>
                        {resume.extracted_data.personal_details && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>Personal Details</Typography>
                            <Typography variant="body2">{resume.extracted_data.personal_details.full_name}</Typography>
                            <Typography variant="body2">{resume.extracted_data.personal_details.email}</Typography>
                          </Box>
                        )}
                        {resume.extracted_data.summary && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>Summary</Typography>
                            <Typography variant="body2">{resume.extracted_data.summary}</Typography>
                          </Box>
                        )}
                        {resume.extracted_data.skills?.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>Skills</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {resume.extracted_data.skills.map((skill: string, i: number) => (
                                <Chip key={i} label={skill} size="small" />
                              ))}
                            </Box>
                          </Box>
                        )}
                        {resume.extracted_data.experience?.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>Experience ({resume.extracted_data.experience.length})</Typography>
                            {resume.extracted_data.experience.map((exp: any, i: number) => (
                              <Box key={i} sx={{ mb: 1.5, pl: 1, borderLeft: `2px solid ${alpha(brand.gold.main, 0.3)}` }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{exp.title}</Typography>
                                <Typography variant="body2">{exp.company} · {exp.start_date} – {exp.end_date || 'Present'}</Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Master Resume</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Resume Name"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g., Annappa_Master_Resume_v1"
            sx={{ mt: 1, mb: 2 }}
          />
          <Box
            sx={{
              border: `2px dashed ${alpha(brand.text.muted, 0.3)}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: brand.gold.main },
            }}
            onClick={() => document.getElementById('resume-upload-input')?.click()}
          >
            <input
              id="resume-upload-input"
              type="file"
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFile(file);
                  if (!uploadName) setUploadName(file.name.replace(/\.[^/.]+$/, ''));
                }
              }}
            />
            <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: brand.text.muted, mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
              {uploadFile ? uploadFile.name : 'Click to upload or drag and drop'}
            </Typography>
            <Typography variant="caption">
              Supported formats: PDF, DOCX, TXT
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => uploadMutation.mutate()}
            disabled={!uploadFile || !uploadName || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Upload & Parse'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Versions Dialog */}
      <Dialog open={!!versionsOpen} onClose={() => setVersionsOpen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Version History</DialogTitle>
        <DialogContent>
          {versions?.map((v: any) => (
            <Box key={v.id} sx={{ py: 1, borderBottom: `1px solid ${alpha(brand.text.muted, 0.1)}` }}>
              <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>Version {v.version}</Typography>
              <Typography variant="body2">{v.change_description}</Typography>
              <Typography variant="caption">{new Date(v.created_at).toLocaleString()}</Typography>
            </Box>
          ))}
          {(!versions || versions.length === 0) && (
            <Typography variant="body2" sx={{ py: 2, textAlign: 'center' }}>No versions yet</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionsOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MasterResumePage;

