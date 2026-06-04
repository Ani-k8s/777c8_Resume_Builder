import React from 'react';
import { Box, Typography, Card, CardContent, Chip, alpha, Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { brand } from '../../theme';
import { applicationApi } from '../../api/client';

const COLUMN_ORDER = ['Applied', 'HR Screening', 'Technical Round 1', 'Technical Round 2', 'Manager Round', 'Offer', 'Joined', 'Rejected'];

const COLUMN_COLORS: Record<string, string> = {
  'Applied': brand.info,
  'HR Screening': '#AB47BC',
  'Technical Round 1': brand.warning,
  'Technical Round 2': brand.warning,
  'Manager Round': '#FF7043',
  'Offer': brand.success,
  'Joined': brand.success,
  'Rejected': brand.error,
};

const KanbanPage: React.FC = () => {
  const { data: kanban } = useQuery({
    queryKey: ['kanban'],
    queryFn: async () => { const res = await applicationApi.kanban(); return res.data; },
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">Kanban Job Board</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Visual pipeline of all your job applications by status.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2 }}>
        {COLUMN_ORDER.map((status) => {
          const items = kanban?.[status] || [];
          const color = COLUMN_COLORS[status] || brand.text.muted;

          return (
            <Box key={status} sx={{ minWidth: 260, maxWidth: 280, flex: '0 0 auto' }}>
              {/* Column Header */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 1,
              }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <Typography sx={{ fontWeight: 600, fontSize: '0.8rem' }}>{status}</Typography>
                <Chip label={items.length} size="small" sx={{
                  height: 20, fontSize: '0.65rem', fontWeight: 700,
                  background: alpha(color, 0.12), color,
                }} />
              </Box>

              {/* Column Cards */}
              <Box sx={{
                minHeight: 400, borderRadius: 2, p: 1,
                background: alpha(brand.navy[700], 0.3),
                border: `1px solid ${alpha(brand.text.muted, 0.08)}`,
              }}>
                {items.map((item: any) => (
                  <Card key={item.id} sx={{
                    mb: 1, cursor: 'pointer',
                    borderLeft: `3px solid ${color}`,
                    '&:hover': { background: alpha(brand.text.muted, 0.06) },
                  }}>
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.8rem', mb: 0.3 }}>
                        {item.company}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {item.role}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        {item.ats_score && (
                          <Chip label={`ATS: ${Math.round(item.ats_score)}%`} size="small"
                            sx={{ height: 18, fontSize: '0.6rem', background: alpha(brand.gold.main, 0.12), color: brand.gold.light }} />
                        )}
                        {item.applied_date && (
                          <Typography variant="caption">{new Date(item.applied_date).toLocaleDateString()}</Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
                {items.length === 0 && (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 4, color: brand.text.muted, fontSize: '0.75rem' }}>
                    No applications
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default KanbanPage;

