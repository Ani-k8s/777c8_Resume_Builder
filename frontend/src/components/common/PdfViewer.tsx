import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, IconButton, alpha } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import { pdfApi } from '../../api/client';
import { brand } from '../../theme';

interface PdfViewerProps {
  resumeId: number;
  refreshTrigger?: number;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ resumeId, refreshTrigger = 0 }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const fetchPdf = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await pdfApi.download(resumeId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      setError('Could not render PDF. Ensure LaTeX distribution (pdflatex) is configured correctly on the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resumeId) {
      fetchPdf();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [resumeId, refreshTrigger]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `resume_${resumeId}.pdf`;
      link.click();
    }
  };

  const handleOpenInNew = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* PDF Action Toolbar */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        p: 1.5, 
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: alpha(brand.navy[600], 0.4)
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdfIcon color="error" />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>PDF Live Preview</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={fetchPdf} disabled={loading} title="Reload Preview">
            <RefreshIcon fontSize="small" />
          </IconButton>
          <Button 
            size="small" 
            variant="outlined" 
            startIcon={<OpenInNewIcon fontSize="small" />} 
            onClick={handleOpenInNew}
            disabled={!pdfUrl}
          >
            Open Tab
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            startIcon={<DownloadIcon fontSize="small" />} 
            onClick={handleDownload}
            disabled={!pdfUrl}
          >
            Download
          </Button>
        </Box>
      </Box>

      {/* Render Area */}
      <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 450, background: '#1e293b', borderRadius: '0 0 8px 8px' }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, left: 0, right: 0, bottom: 0, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 2,
            background: 'rgba(30, 41, 59, 0.8)',
            zIndex: 2
          }}>
            <CircularProgress color="primary" />
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>Rendering PDF via LaTeX Engine...</Typography>
          </Box>
        )}

        {error && !loading && (
          <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#f87171' }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>LaTeX Compile Error</Typography>
            <Typography variant="body2" sx={{ maxWidth: 400, mb: 3, color: '#fca5a5' }}>{error}</Typography>
            <Button variant="outlined" color="error" onClick={fetchPdf} startIcon={<RefreshIcon />}>
              Retry Rendering
            </Button>
          </Box>
        )}

        {pdfUrl && !loading && !error && (
          <object 
            data={pdfUrl} 
            type="application/pdf" 
            width="100%" 
            height="100%" 
            style={{ 
              display: 'block', 
              border: 'none',
              borderRadius: '0 0 8px 8px',
              height: 'calc(100vh - 250px)',
              minHeight: 550
            }}
          >
            <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>This browser does not support inline PDF viewing.</Typography>
              <Button variant="contained" onClick={handleDownload} startIcon={<DownloadIcon />}>
                Download PDF
              </Button>
            </Box>
          </object>
        )}
      </Box>
    </Box>
  );
};

export default PdfViewer;
