import React from 'react';
import { Box, Typography, Card, CardContent, Grid, alpha } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { brand } from '../../theme';
import { analyticsApi } from '../../api/client';

const AnalyticsPage: React.FC = () => {
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => { const res = await analyticsApi.summary(); return res.data; },
  });

  const stats = [
    { label: 'Total Applications', value: analytics?.total_applications || 0, color: brand.info },
    { label: 'Total Interviews', value: analytics?.total_interviews || 0, color: brand.warning },
    { label: 'Total Offers', value: analytics?.total_offers || 0, color: brand.success },
    { label: 'Total Rejections', value: analytics?.total_rejections || 0, color: brand.error },
    { label: 'Interview Rate', value: `${analytics?.interview_rate || 0}%`, color: brand.gold.main },
    { label: 'Offer Rate', value: `${analytics?.offer_rate || 0}%`, color: brand.gold.main },
    { label: 'Success Rate', value: `${analytics?.success_rate || 0}%`, color: brand.success },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h2">Career Analytics</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>Track your job search performance and metrics.</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
            <Card>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption">{stat.label}</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '2rem', color: stat.color, lineHeight: 1.2 }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        {/* Applications by Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>Applications by Status</Typography>
            {analytics?.applications_by_status?.map((item: any) => (
              <Box key={item.status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: `1px solid ${alpha(brand.text.muted, 0.08)}` }}>
                <Typography variant="body2">{item.status}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: Math.min(item.count * 20, 150), height: 6, borderRadius: 3, background: brand.gold.main }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 24, textAlign: 'right' }}>{item.count}</Typography>
                </Box>
              </Box>
            ))}
            {(!analytics?.applications_by_status || analytics.applications_by_status.length === 0) && (
              <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: brand.text.muted }}>No data yet</Typography>
            )}
          </CardContent></Card>
        </Grid>

        {/* Applications by Month */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>Applications by Month</Typography>
            {analytics?.applications_by_month?.map((item: any) => (
              <Box key={item.month} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: `1px solid ${alpha(brand.text.muted, 0.08)}` }}>
                <Typography variant="body2">{item.month}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: Math.min(item.count * 20, 150), height: 6, borderRadius: 3, background: brand.info }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 24, textAlign: 'right' }}>{item.count}</Typography>
                </Box>
              </Box>
            ))}
            {(!analytics?.applications_by_month || analytics.applications_by_month.length === 0) && (
              <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: brand.text.muted }}>No data yet</Typography>
            )}
          </CardContent></Card>
        </Grid>

        {/* Top Companies */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card><CardContent>
            <Typography variant="h5" sx={{ mb: 2 }}>Top Companies</Typography>
            {analytics?.top_companies?.map((item: any, i: number) => (
              <Box key={item.company} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, borderBottom: `1px solid ${alpha(brand.text.muted, 0.08)}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ minWidth: 16 }}>#{i + 1}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.company}</Typography>
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.count}</Typography>
              </Box>
            ))}
            {(!analytics?.top_companies || analytics.top_companies.length === 0) && (
              <Typography variant="body2" sx={{ py: 4, textAlign: 'center', color: brand.text.muted }}>No data yet</Typography>
            )}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsPage;

