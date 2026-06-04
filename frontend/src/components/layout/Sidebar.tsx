import React from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, alpha } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { brand } from '../../theme';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ViewKanbanOutlinedIcon from '@mui/icons-material/ViewKanbanOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const DRAWER_WIDTH = 260;

const navSections = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: <DashboardOutlinedIcon />, path: '/' },
    ],
  },
  {
    title: 'RESUME STUDIO',
    items: [
      { label: 'Master Resume', icon: <DescriptionOutlinedIcon />, path: '/master-resume' },
      { label: 'Analyze JD', icon: <SearchOutlinedIcon />, path: '/analyze-jd' },
      { label: 'Generate Resume', icon: <EditNoteOutlinedIcon />, path: '/generate-resume' },
      { label: 'Cover Letter', icon: <MailOutlineIcon />, path: '/cover-letter' },
    ],
  },
  {
    title: 'CAREER TRACKING',
    items: [
      { label: 'Applications', icon: <WorkOutlineIcon />, path: '/applications' },
      { label: 'Kanban Board', icon: <ViewKanbanOutlinedIcon />, path: '/kanban' },
      { label: 'Interviews', icon: <EventNoteOutlinedIcon />, path: '/interviews' },
      { label: 'Recruiter CRM', icon: <PeopleOutlineIcon />, path: '/recruiters' },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { label: 'LinkedIn Toolkit', icon: <LinkedInIcon />, path: '/linkedin' },
      { label: 'Analytics', icon: <AnalyticsOutlinedIcon />, path: '/analytics' },
      { label: 'Export Center', icon: <DownloadOutlinedIcon />, path: '/export' },
      { label: 'Settings', icon: <SettingsOutlinedIcon />, path: '/settings' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          background: brand.navy[900],
          borderRight: `1px solid ${alpha(brand.text.muted, 0.1)}`,
          overflow: 'hidden',
        },
      }}
    >
      {/* Brand Header */}
      <Box sx={{ px: 2.5, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5,
          background: `linear-gradient(135deg, ${brand.gold.main}, ${brand.gold.dark})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.75rem', color: brand.navy[900],
          letterSpacing: '-0.03em',
        }}>
          7c8
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: brand.text.primary, lineHeight: 1.2 }}>
            777c8
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: brand.gold.main, fontWeight: 500, letterSpacing: '0.05em' }}>
            CAREER OS
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: alpha(brand.text.muted, 0.08), mx: 2 }} />

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 1.5, py: 1 }}>
        {navSections.map((section) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 700, color: brand.text.muted,
              letterSpacing: '0.12em', px: 1.5, py: 1,
            }}>
              {section.title}
            </Typography>
            <List disablePadding>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <ListItemButton
                    key={item.path}
                    selected={isActive}
                    onClick={() => navigate(item.path)}
                    sx={{
                      py: 0.8, px: 1.5, borderRadius: 1.5, mb: 0.3,
                      '& .MuiListItemIcon-root': {
                        minWidth: 34,
                        color: isActive ? brand.gold.main : brand.text.muted,
                        '& svg': { fontSize: '1.15rem' },
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontSize: '0.8rem',
                            fontWeight: isActive ? 600 : 400,
                            color: isActive ? brand.text.primary : brand.text.secondary,
                          }
                        }
                      }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${alpha(brand.text.muted, 0.08)}` }}>
        <Typography sx={{ fontSize: '0.65rem', color: brand.text.muted, textAlign: 'center' }}>
          777c8 Career OS v1.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
export { DRAWER_WIDTH };

