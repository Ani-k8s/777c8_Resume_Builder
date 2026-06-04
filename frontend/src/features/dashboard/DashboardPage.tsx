import React from 'react';
import { Box, Typography, Card, CardContent, Grid, alpha, Button, Chip, Divider } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import SchoolIcon from '@mui/icons-material/School';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

import { brand } from '../../theme';
import { masterResumeApi, analyticsApi, systemApi, interviewIntelligenceApi, timelineApi, applicationApi } from '../../api/client';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: resumeData } = useQuery({
    queryKey: ['masterResumes'],
    queryFn: async () => { const res = await masterResumeApi.list(); return res.data; },
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => { try { const res = await analyticsApi.summary(); return res.data; } catch { return null; } },
  });

  const { data: config } = useQuery({
    queryKey: ['systemConfig'],
    queryFn: async () => { try { const res = await systemApi.config(); return res.data; } catch { return null; } },
  });

  const { data: prepPackages } = useQuery({
    queryKey: ['prepPackages'],
    queryFn: async () => { try { const res = await interviewIntelligenceApi.listPrepPackages(); return res.data; } catch { return []; } },
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline'],
    queryFn: async () => { try { const res = await timelineApi.get(); return res.data; } catch { return []; } },
  });

  const { data: applications } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => { const res = await applicationApi.list(); return res.data; },
  });

  const activeResume = resumeData?.resumes?.find((r: any) => r.is_active);

  // Extract all missing skills from applications gap analyses
  const missingSkillsMap = new Map<string, number>();
  applications?.forEach((app: any) => {
    if (app.skill_gap_analysis?.missing_skills) {
      app.skill_gap_analysis.missing_skills.forEach((skill: string) => {
        missingSkillsMap.set(skill, (missingSkillsMap.get(skill) || 0) + 1);
      });
    }
  });
  const topGaps = Array.from(missingSkillsMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);

  // Compute mock readiness score
  const hasResume = !!activeResume;
  const totalAppsCount = applications?.length || 0;
  const hasPrepPack = prepPackages && prepPackages.length > 0;
  const readinessScore = Math.min(
    100,
    (hasResume ? 30 : 0) + 
    (totalAppsCount > 0 ? 30 : 0) + 
    (hasPrepPack ? 40 : 0)
  );

  const quickActions = [
    { label: 'Analyze Job Description', icon: <SearchOutlinedIcon />, path: '/generate-resume', color: brand.gold.main },
    { label: 'Master Resume', icon: <DescriptionOutlinedIcon />, path: '/master-resume', color: brand.info },
    { label: 'Applications Pipeline', icon: <WorkOutlineIcon />, path: '/applications', color: brand.success },
    { label: 'Logged Contacts & CRM', icon: <EventNoteOutlinedIcon />, path: '/recruiters', color: '#AB47BC' },
    { label: 'System Preferences', icon: <SettingsOutlinedIcon />, path: '/settings', color: brand.text.muted },
  ];

  return (
    <Box>
      {/* Top Banner */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: brand.gold.main, letterSpacing: '0.15em', mb: 0.5, textTransform: 'uppercase' }}>
            777c8 Career OS
          </Typography>
          <Typography variant="h1">Career Command Center</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Automated intelligence workspace for applications, pipelines, and interviews.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={config?.openai_configured ? 'AI Live' : 'AI Offline'}
            size="small"
            sx={{
              background: alpha(config?.openai_configured ? brand.success : brand.error, 0.12),
              color: config?.openai_configured ? brand.success : brand.error,
              fontWeight: 600,
            }}
          />
          <Chip
            label={config?.latex_available ? 'LaTeX Engine Live' : 'No LaTeX'}
            size="small"
            sx={{
              background: alpha(config?.latex_available ? brand.success : brand.warning, 0.12),
              color: config?.latex_available ? brand.success : brand.warning,
              fontWeight: 600,
            }}
          />
        </Box>
      </Box>

      {/* Main OS Layout Grid */}
      <Grid container spacing={3}>
        {/* Left Side: Pipeline, Prep Packages, Activity */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Dashboard Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Total Applications', value: analytics?.total_applications || 0, color: brand.info },
              { label: 'Interviews Scheduled', value: analytics?.total_interviews || 0, color: brand.warning },
              { label: 'Pending Offers', value: analytics?.total_offers || 0, color: brand.success },
              { label: 'Success Ratio', value: `${analytics?.success_rate || 0}%`, color: brand.gold.main },
            ].map((stat) => (
              <Grid size={{ xs: 6, sm: 3 }} key={stat.label}>
                <Card sx={{ background: alpha(brand.navy[900], 0.4), backdropFilter: 'blur(8px)' }}>
                  <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="caption" sx={{ color: brand.text.muted }}>{stat.label}</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.75rem', color: stat.color, lineHeight: 1.1, mt: 0.5 }}>
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Active Job Application Pipeline */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkOutlineIcon sx={{ color: brand.gold.main }} /> Active Job Applications
                </Typography>
                <Button size="small" variant="text" onClick={() => navigate('/applications')}>
                  View Pipeline
                </Button>
              </Box>
              {applications && applications.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {applications.slice(0, 3).map((app: any) => (
                    <Box
                      key={app.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        background: alpha(brand.navy[900], 0.4),
                        borderLeft: `3px solid ${app.status === 'Offer' ? brand.success : brand.gold.main}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{app.role}</Typography>
                        <Typography variant="caption" sx={{ color: brand.text.muted }}>
                          {app.company} · {app.location || 'Remote'} · Score: {app.ats_score ? `${app.ats_score}%` : 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={app.status}
                          size="small"
                          sx={{
                            background: alpha(brand.gold.main, 0.1),
                            color: brand.gold.main,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                          }}
                        />
                        <Button size="small" variant="outlined" onClick={() => navigate(`/applications`)}>
                          Details
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: brand.text.muted, mb: 1.5 }}>
                    No job applications logged yet. Paste a JD in the Generator to begin!
                  </Typography>
                  <Button variant="outlined" size="small" onClick={() => navigate('/generate-resume')}>
                    Generate Custom Resume
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Automated Interview Preparation Packages */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon sx={{ color: brand.gold.main }} /> 777c8 Interview Intelligence Packs
              </Typography>
              {prepPackages && prepPackages.length > 0 ? (
                <Grid container spacing={2}>
                  {prepPackages.slice(0, 4).map((pkg: any) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={pkg.id}>
                      <Card sx={{ background: alpha(brand.navy[900], 0.3), border: `1px solid ${alpha(brand.gold.main, 0.15)}` }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{pkg.company}</Typography>
                              <Typography variant="caption" sx={{ color: brand.text.muted }}>{pkg.role}</Typography>
                            </Box>
                            <Chip 
                              label={pkg.prep_guide?.interview_difficulty || 'Medium'} 
                              size="small" 
                              sx={{ 
                                fontSize: '0.6rem', 
                                background: alpha(brand.warning, 0.1), 
                                color: brand.warning, 
                                fontWeight: 700 
                              }} 
                            />
                          </Box>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem', color: brand.text.muted, mb: 2, height: '36px', overflow: 'hidden' }}>
                            {pkg.prep_guide?.preparation_notes || 'Complete interactive question bank and technical revision pack.'}
                          </Typography>
                          <Button 
                            fullWidth 
                            variant="outlined" 
                            size="small" 
                            color="warning"
                            onClick={() => navigate(`/interviews/prep/${pkg.id}`)}
                            sx={{ borderColor: brand.gold.main, color: brand.gold.main }}
                          >
                            Open Prep Hub
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: brand.text.muted }}>
                    Interview packages are automatically compiled as soon as a Job Description is generated.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Career Activity Log & Timeline */}
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimelineIcon sx={{ color: brand.gold.main }} /> Career OS Timeline Feed
              </Typography>
              {timeline && timeline.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  {timeline.slice(0, 5).map((evt: any) => (
                    <Box key={evt.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: brand.gold.main, mt: 0.8 }} />
                        <Box sx={{ width: 2, height: 28, background: alpha(brand.text.muted, 0.2), mt: 0.5 }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{evt.title}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem', color: brand.text.muted }}>
                          {evt.description}
                        </Typography>
                        <Typography variant="caption" sx={{ color: brand.text.muted, fontSize: '0.65rem' }}>
                          {new Date(evt.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: brand.text.muted, py: 2, textAlign: 'center' }}>
                  Your live timeline of generated assets, job edits, and scheduled reminders will appear here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: Readiness Score, Study Recommendations, Quick Actions */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Active Source of Truth Lock Status */}
          {activeResume && (
            <Card sx={{ mb: 3, border: `1px solid ${alpha(brand.gold.main, 0.2)}` }}>
              <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 700 }}>
                    ACTIVE SOURCE OF TRUTH
                  </Typography>
                  <Chip
                    label="LOCKED"
                    size="small"
                    color="success"
                    sx={{ height: 16, fontSize: '0.55rem', fontWeight: 800 }}
                  />
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', mt: 0.5 }}>{activeResume.name}</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: brand.text.muted, mt: 0.5 }}>
                  {activeResume.extracted_data?.experience?.length || 0} jobs · {activeResume.extracted_data?.skills?.length || 0} skills · v{activeResume.version}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Circular Readiness dial */}
          <Card sx={{ mb: 3, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="caption" sx={{ color: brand.text.muted, display: 'block', mb: 2 }}>
                INTERVIEW READINESS DIAL
              </Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `conic-gradient(${brand.gold.main} ${readinessScore}%, ${alpha(brand.navy[900], 0.6)} 0)`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 104,
                      height: 104,
                      borderRadius: '50%',
                      background: brand.navy[800],
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: brand.gold.main }}>
                      {readinessScore}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.55rem', color: brand.text.muted, textTransform: 'uppercase', fontWeight: 700 }}>
                      Readiness
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', px: 2, color: brand.text.muted }}>
                {readinessScore >= 80 
                  ? 'Excellent readiness. Sources are compiled, templates lock is active, prep is ready.'
                  : 'Complete an application profile and build an interview pack to maximize score.'}
              </Typography>
            </CardContent>
          </Card>

          {/* Missing Skills Study Plan */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ color: brand.gold.main }} /> Skill Gaps & Study plan
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: brand.text.muted, mb: 2 }}>
                Identified missing requirements across target jobs. Focus study on:
              </Typography>
              {topGaps.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {topGaps.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      sx={{
                        background: alpha(brand.warning, 0.1),
                        color: brand.warning,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: brand.text.muted, py: 1 }}>
                  No missing skills gaps found. You're fully aligned with target job postings!
                </Typography>
              )}
              <Divider sx={{ my: 1.5, borderColor: alpha(brand.text.muted, 0.1) }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: brand.gold.main, textTransform: 'uppercase' }}>
                Study Recommendations
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem', color: brand.text.muted, mt: 0.5 }}>
                1. Review incident troubleshooting playbooks for Kubernetes cluster crashes.<br />
                2. Study standard Terraform failure resolution commands.<br />
                3. Ask the AI Coach to mock test your leadership and ownership STAR stories.
              </Typography>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: brand.text.muted, display: 'block', mb: 1.5 }}>
                WORKSPACE COMMANDS
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    fullWidth
                    variant="text"
                    startIcon={action.icon}
                    onClick={() => navigate(action.path)}
                    sx={{
                      justifyContent: 'flex-start',
                      color: brand.text.primary,
                      textAlign: 'left',
                      fontSize: '0.8rem',
                      py: 1,
                      px: 1.5,
                      '&:hover': {
                        background: alpha(brand.gold.main, 0.06),
                        color: brand.gold.main,
                      },
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
