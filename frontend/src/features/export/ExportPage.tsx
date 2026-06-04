import React from 'react';
import { Box, Typography, Card, CardContent, Button, Grid, alpha } from '@mui/material';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { brand } from '../../theme';

const ExportPage: React.FC = () => {
  const exports = [
    { label: 'Resume PDF', description: 'Download your latest generated resume as PDF', icon: '📄' },
    { label: 'Resume TEX', description: 'Download Overleaf-compatible LaTeX source', icon: '📝' },
    { label: 'Cover Letter PDF', description: 'Download your latest cover letter', icon: '✉️' },
    { label: 'Cover Letter TEX', description: 'Download cover letter LaTeX source', icon: '📋' },
    { label: 'ATS Report', description: 'Download ATS compatibility analysis', icon: '📊' },
    { label: 'Keyword Report', description: 'Download keyword match report', icon: '🔑' },
    { label: 'Application Report', description: 'Download all applications as CSV', icon: '📈' },
    { label: 'ZIP Package', description: 'Download everything as a ZIP archive', icon: '📦' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">Export Center</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>Download all your career documents and reports.</Typography>
      </Box>

      <Grid container spacing={2}>
        {exports.map((exp) => (
          <Grid size={{ xs: 12, md: 6, lg: 3 }} key={exp.label}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: '2rem', mb: 1 }}>{exp.icon}</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>{exp.label}</Typography>
                <Typography variant="body2">{exp.description}</Typography>
              </CardContent>
              <Box sx={{ px: 2, pb: 2 }}>
                <Button fullWidth variant="outlined" size="small" startIcon={<DownloadOutlinedIcon />}>
                  Download
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExportPage;

