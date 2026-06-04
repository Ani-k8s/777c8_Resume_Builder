import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { brand } from '../../theme';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: brand.navy[800] }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Content Area */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;

