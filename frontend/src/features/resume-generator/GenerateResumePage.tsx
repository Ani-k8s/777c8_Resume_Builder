import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  Select, MenuItem, FormControl, InputLabel, alpha, CircularProgress,
  Chip, Alert, Divider, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MemoryIcon from '@mui/icons-material/Psychology';
import DescriptionIcon from '@mui/icons-material/Description';

import { brand } from '../../theme';
import { masterResumeApi, resumeApi, supportingDocumentsApi, resumeMemoryApi } from '../../api/client';
import PdfViewer from '../../components/common/PdfViewer';
import DiffViewer from '../../components/common/DiffViewer';

const GenerateResumePage: React.FC = () => {
  // Tabs state: 0 = PDF, 1 = Diff, 2 = Supporting Docs, 3 = Resume Memory
  const [tabValue, setTabValue] = useState(0);

  // Resume generator inputs
  const [jdText, setJdText] = useState('');
  const [templateId, setTemplateId] = useState('modern_ats');
  const [result, setResult] = useState<any>(null);
  const [pdfRefreshTrigger, setPdfRefreshTrigger] = useState(0);

  // Supporting docs upload inputs
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('transcript'); // transcript, certificate, letter, other

  // Resume memory inputs
  const [prefKey, setPrefKey] = useState('');
  const [prefValue, setPrefValue] = useState('');

  // ── Queries ──
  const { data: activeResume } = useQuery({
    queryKey: ['activeResume'],
    queryFn: async () => {
      try { const res = await masterResumeApi.getActive(); return res.data; }
      catch { return null; }
    },
  });

  const { data: supportingDocs, refetch: refetchDocs } = useQuery({
    queryKey: ['supportingDocs'],
    queryFn: async () => {
      const res = await supportingDocumentsApi.list();
      return res.data;
    },
  });

  const { data: memories, refetch: refetchMemories } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const res = await resumeMemoryApi.list();
      return res.data;
    },
  });

  // ── Mutations ──
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!activeResume?.id) throw new Error('No active resume');
      const res = await resumeApi.generate({
        master_resume_id: activeResume.id,
        job_description_text: jdText,
        template_id: templateId,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setTabValue(0); // auto switch to PDF view
      setPdfRefreshTrigger(prev => prev + 1);
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async () => {
      if (!docFile) return;
      return supportingDocumentsApi.upload(docFile, docName, docType);
    },
    onSuccess: () => {
      setDocFile(null);
      setDocName('');
      refetchDocs();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to upload document.');
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: async (id: number) => supportingDocumentsApi.delete(id),
    onSuccess: () => refetchDocs(),
  });

  const upsertMemoryMutation = useMutation({
    mutationFn: async () => resumeMemoryApi.upsert(prefKey, prefValue),
    onSuccess: () => {
      setPrefKey('');
      setPrefValue('');
      refetchMemories();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to save preference.');
    }
  });

  const deleteMemoryMutation = useMutation({
    mutationFn: async (id: number) => resumeMemoryApi.delete(id),
    onSuccess: () => refetchMemories(),
  });

  const templates = [
    { id: 'modern_ats', label: 'Modern ATS' },
    { id: 'senior_devops', label: 'DevOps Professional' },
    { id: 'principal_engineer', label: 'Principal Engineer' },
    { id: 'cloud_engineer', label: 'Cloud Engineer' },
    { id: 'sre_professional', label: 'SRE Professional' },
    { id: 'platform_engineer', label: 'Platform Engineer' },
  ];

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h2">ATS Workspace & Knowledge Base</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Tailor resumes, review formatting preferences, analyze transcripts/certificates, and compare visual versions.
        </Typography>
      </Box>

      {!activeResume && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No active master resume found. Please upload and activate a master resume in the Master Resume tab first.
        </Alert>
      )}

      <Grid container spacing={3} sx={{ flexGrow: 1, minHeight: 0 }}>
        {/* Left Input Configuration (5 Columns) */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ height: '100%', overflowY: 'auto' }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              {activeResume && (
                <Box sx={{ mb: 2.5, p: 2, borderRadius: 1, background: alpha(brand.gold.main, 0.06), border: `1px solid ${alpha(brand.gold.main, 0.15)}` }}>
                  <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 700, letterSpacing: 0.5 }}>
                    SOURCE OF TRUTH
                  </Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mt: 0.5 }}>{activeResume.name}</Typography>
                  <Typography variant="body2" sx={{ color: brand.text.muted }}>
                    {activeResume.extracted_data?.skills?.length || 0} skills · Version: {activeResume.version}
                  </Typography>
                </Box>
              )}

              <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
                <InputLabel>Target LaTeX Template</InputLabel>
                <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)} label="Target LaTeX Template">
                  {templates.map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth multiline rows={12}
                label="Target Job Description"
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target job description here..."
                sx={{ mb: 2.5 }}
              />

              <Button
                fullWidth variant="contained"
                size="large"
                startIcon={generateMutation.isPending ? <CircularProgress size={16} /> : <AutoFixHighIcon />}
                onClick={() => generateMutation.mutate()}
                disabled={!activeResume || jdText.length < 50 || generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Optimizing Resume via AI...' : 'Generate Optimized Resume'}
              </Button>

              {generateMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(generateMutation.error as any)?.response?.data?.detail || 'Tailoring failed. Verify key setup in settings.'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Workspace split screen tabs (7 Columns) */}
        <Grid size={{ xs: 12, md: 7 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper variant="outlined" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Tabs 
              value={tabValue} 
              onChange={(_, val) => setTabValue(val)} 
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 48 }}
            >
              <Tab icon={<PictureAsPdfIcon fontSize="small" />} label="PDF View" iconPosition="start" />
              <Tab icon={<CompareArrowsIcon fontSize="small" />} label="Visual Diff" iconPosition="start" />
              <Tab icon={<DescriptionIcon fontSize="small" />} label="Supporting Docs" iconPosition="start" />
              <Tab icon={<MemoryIcon fontSize="small" />} label="Resume Memory" iconPosition="start" />
            </Tabs>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
              {/* Tab 0: PDF Viewer */}
              {tabValue === 0 && (
                result?.id ? (
                  <PdfViewer resumeId={result.id} refreshTrigger={pdfRefreshTrigger} />
                ) : (
                  <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: brand.text.muted, textAlign: 'center' }}>
                    <PictureAsPdfIcon sx={{ fontSize: 64, mb: 2, color: alpha(brand.text.muted, 0.3) }} />
                    <Typography variant="h5" sx={{ mb: 1 }}>PDF Live Preview</Typography>
                    <Typography variant="body2" sx={{ maxWidth: 350 }}>
                      No tailored resume generated yet. Paste a job description and optimize to compile a LaTeX PDF.
                    </Typography>
                  </Box>
                )
              )}

              {/* Tab 1: Version Diffs */}
              {tabValue === 1 && (
                result ? (
                  <DiffViewer original={activeResume?.extracted_data} modified={result.content} />
                ) : (
                  <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: brand.text.muted, textAlign: 'center' }}>
                    <CompareArrowsIcon sx={{ fontSize: 64, mb: 2, color: alpha(brand.text.muted, 0.3) }} />
                    <Typography variant="h5" sx={{ mb: 1 }}>Visual Version Comparison</Typography>
                    <Typography variant="body2" sx={{ maxWidth: 350 }}>
                      Generates a detailed difference layout comparing details from your Master Resume against the tailored version.
                    </Typography>
                  </Box>
                )
              )}

              {/* Tab 2: Supporting Documents */}
              {tabValue === 2 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Credentials & Context Library</Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: brand.text.muted }}>
                    Upload transcripts, letters of recommendation, and project portfolios. Extracted text automatically extends the resume optimization engine's knowledge base context.
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth size="small"
                        label="Document Label"
                        placeholder="e.g. Undergrad Transcript"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={docType} onChange={(e) => setDocType(e.target.value)} label="Type">
                          <MenuItem value="transcript">Transcript</MenuItem>
                          <MenuItem value="certificate">Certification / Award</MenuItem>
                          <MenuItem value="letter">Recommendation Letter</MenuItem>
                          <MenuItem value="other">Other Context</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ 
                        border: '2px dashed', 
                        borderColor: 'divider', 
                        borderRadius: 1, 
                        p: 2, 
                        textAlign: 'center',
                        background: alpha(brand.navy[600], 0.2)
                      }}>
                        <input
                          accept=".pdf,.docx,.txt,.md"
                          style={{ display: 'none' }}
                          id="supporting-doc-file"
                          type="file"
                          onChange={(e) => setDocFile(e.target.files ? e.target.files[0] : null)}
                        />
                        <label htmlFor="supporting-doc-file">
                          <Button variant="outlined" component="span" startIcon={<CloudUploadIcon />} sx={{ mb: 1 }}>
                            Select File
                          </Button>
                        </label>
                        {docFile && (
                          <Typography variant="body2" sx={{ color: brand.success, fontWeight: 500 }}>
                            Selected: {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
                          </Typography>
                        )}
                        <Typography variant="caption" sx={{ display: 'block', color: brand.text.muted, mt: 0.5 }}>
                          Supports PDF, DOCX, TXT, MD up to 10MB.
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="contained"
                        onClick={() => uploadDocMutation.mutate()}
                        disabled={!docFile || !docName || uploadDocMutation.isPending}
                        startIcon={uploadDocMutation.isPending ? <CircularProgress size={16} /> : <AddIcon />}
                      >
                        Upload & Extract Text
                      </Button>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 3 }} />

                  <Typography variant="h6" sx={{ mb: 2 }}>Parsed Context Items</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Label</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Extracted Length</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {supportingDocs && supportingDocs.length > 0 ? (
                          supportingDocs.map((doc: any) => (
                            <TableRow key={doc.id}>
                              <TableCell sx={{ fontWeight: 600 }}>{doc.name}</TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>{doc.doc_type}</TableCell>
                              <TableCell>{doc.content?.length?.toLocaleString() || 0} chars</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => deleteDocMutation.mutate(doc.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3, color: brand.text.muted }}>
                              No supporting context files added yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Tab 3: Resume Memory Engine */}
              {tabValue === 3 && (
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ mb: 1 }}>Resume Memory & AI Preferences</Typography>
                  <Typography variant="body2" sx={{ mb: 3, color: brand.text.muted }}>
                    Define formatting requirements or styling constraints. The generator automatically queries and enforces these guidelines as system-level constraints during resume synthesis.
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth size="small"
                        label="Rule Identifier"
                        placeholder="e.g. verb_style"
                        value={prefKey}
                        onChange={(e) => setPrefKey(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        fullWidth size="small"
                        label="Guideline Instruction"
                        placeholder="e.g. Always begin bullet points with strong action verbs..."
                        value={prefValue}
                        onChange={(e) => setPrefValue(e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        variant="contained"
                        onClick={() => upsertMemoryMutation.mutate()}
                        disabled={!prefKey || !prefValue || upsertMemoryMutation.isPending}
                        startIcon={<AddIcon />}
                      >
                        Add Constraint
                      </Button>
                    </Grid>
                  </Grid>

                  <Divider sx={{ mb: 3 }} />

                  <Typography variant="h6" sx={{ mb: 2 }}>Enforced Formatting Rules</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Key</TableCell>
                          <TableCell>Instruction Guideline</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {memories && memories.length > 0 ? (
                          memories.map((mem: any) => (
                            <TableRow key={mem.id}>
                              <TableCell sx={{ fontWeight: 600, color: brand.gold.main }}>{mem.key}</TableCell>
                              <TableCell sx={{ color: brand.text.secondary }}>{mem.value}</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => deleteMemoryMutation.mutate(mem.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 3, color: brand.text.muted }}>
                              No custom formatting guidelines configured yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GenerateResumePage;
