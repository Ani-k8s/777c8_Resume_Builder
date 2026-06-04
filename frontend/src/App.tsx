import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import AppShell from './components/layout/AppShell';

// Feature Pages
import DashboardPage from './features/dashboard/DashboardPage';
import MasterResumePage from './features/master-resume/MasterResumePage';
import AnalyzeJDPage from './features/job-analyzer/AnalyzeJDPage';
import GenerateResumePage from './features/resume-generator/GenerateResumePage';
import ApplicationsPage from './features/applications/ApplicationsPage';
import KanbanPage from './features/kanban/KanbanPage';
import InterviewsPage from './features/interviews/InterviewsPage';
import InterviewPrepDetail from './features/interviews/InterviewPrepDetail';
import RecruitersPage from './features/recruiters/RecruitersPage';
import CoverLetterPage from './features/cover-letter/CoverLetterPage';
import LinkedInPage from './features/linkedin/LinkedInPage';
import AnalyticsPage from './features/analytics/AnalyticsPage';
import ExportPage from './features/export/ExportPage';
import SettingsPage from './features/settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/master-resume" element={<MasterResumePage />} />
              <Route path="/analyze-jd" element={<AnalyzeJDPage />} />
              <Route path="/generate-resume" element={<GenerateResumePage />} />
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/interviews" element={<InterviewsPage />} />
              <Route path="/interviews/prep/:id" element={<InterviewPrepDetail />} />
              <Route path="/recruiters" element={<RecruitersPage />} />
              <Route path="/cover-letter" element={<CoverLetterPage />} />
              <Route path="/linkedin" element={<LinkedInPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/export" element={<ExportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

