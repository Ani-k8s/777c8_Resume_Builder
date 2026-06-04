import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box, Typography, Card, CardContent, Grid, Tabs, Tab, Button, Chip, 
  Accordion, AccordionSummary, AccordionDetails, alpha, Divider, TextField, CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TerminalIcon from '@mui/icons-material/Terminal';
import HelpIcon from '@mui/icons-material/Help';
import StarIcon from '@mui/icons-material/Star';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReplayIcon from '@mui/icons-material/Replay';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { brand } from '../../theme';
import { interviewIntelligenceApi } from '../../api/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  score?: number;
  feedback?: string;
  actionable_tips?: string[];
}

const InterviewPrepDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const pkgId = parseInt(id || '0');

  const { data: pkg, isLoading, error } = useQuery({
    queryKey: ['prepPackage', pkgId],
    queryFn: async () => {
      const res = await interviewIntelligenceApi.getPrepPackage(pkgId);
      return res.data;
    },
    enabled: pkgId > 0,
  });

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const coachMutation = useMutation({
    mutationFn: async (message: string) => {
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));
      const res = await interviewIntelligenceApi.askCoach({
        message,
        prep_package_id: pkgId,
        chat_history: formattedHistory
      });
      return res.data;
    },
    onSuccess: (data) => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          score: data.score || undefined,
          feedback: data.feedback || undefined,
          actionable_tips: data.actionable_tips || []
        }
      ]);
    },
    onError: () => {
      setChatHistory(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I failed to process your answer. Please ensure your API key is active.',
        }
      ]);
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="warning" />
      </Box>
    );
  }

  if (error || !pkg) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h5" sx={{ mb: 2 }}>Error Loading Prep Package</Typography>
        <Button variant="outlined" onClick={() => navigate('/')}>Return to Dashboard</Button>
      </Box>
    );
  }

  const handleSendChat = () => {
    if (!chatMessage.trim() || coachMutation.isPending) return;
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    coachMutation.mutate(userMsg);
  };

  const handleNextFlashcard = () => {
    setShowFlashcardAnswer(false);
    if (pkg.flashcards && pkg.flashcards.length > 0) {
      setFlashcardIndex((flashcardIndex + 1) % pkg.flashcards.length);
    }
  };

  const getDifficultyColor = (diff: string) => {
    if (diff?.toLowerCase() === 'easy') return brand.success;
    if (diff?.toLowerCase() === 'hard' || diff?.toLowerCase() === 'expert') return brand.error;
    return brand.warning;
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Button size="small" variant="text" onClick={() => navigate('/')} sx={{ mb: 1, p: 0 }}>
          ← Back to Dashboard
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: brand.gold.main, letterSpacing: '0.15em', mb: 0.5 }}>
              777c8 INTERVIEW INTELLIGENCE SUITE
            </Typography>
            <Typography variant="h1">{pkg.company}</Typography>
            <Typography variant="body2" sx={{ color: brand.text.muted, mt: 0.5 }}>
              Focusing on: <strong>{pkg.role}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`Difficulty: ${pkg.prep_guide?.interview_difficulty || 'Hard'}`} 
              sx={{ background: alpha(getDifficultyColor(pkg.prep_guide?.interview_difficulty), 0.12), color: getDifficultyColor(pkg.prep_guide?.interview_difficulty), fontWeight: 700 }}
            />
            <Chip label="Auto-Generated" sx={{ background: alpha(brand.info, 0.12), color: brand.info, fontWeight: 700 }} />
          </Box>
        </Box>
      </Box>

      {/* Guide Summary Alert */}
      <Card sx={{ mb: 4, background: alpha(brand.gold.main, 0.05), border: `1px solid ${alpha(brand.gold.main, 0.25)}` }}>
        <CardContent>
          <Typography sx={{ fontWeight: 800, color: brand.gold.main, fontSize: '0.85rem', mb: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon fontSize="small" /> Tactical Prep Blueprint
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
            {pkg.prep_guide?.preparation_notes}
          </Typography>
          {pkg.prep_guide?.expected_questions && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: brand.text.muted, mr: 1 }}>CORE FOCUS AREAS:</Typography>
              {pkg.prep_guide.expected_questions.map((q: string, i: number) => (
                <Chip key={i} label={q} size="small" variant="outlined" sx={{ fontSize: '0.7rem', borderColor: alpha(brand.gold.main, 0.4) }} />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Nav Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: alpha(brand.text.muted, 0.1), mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="inherit"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: brand.gold.main,
            },
            '& .MuiTab-root.Mui-selected': {
              color: brand.gold.main,
              fontWeight: 700,
            }
          }}
        >
          <Tab label="Question Bank" icon={<HelpIcon />} iconPosition="start" />
          <Tab label="STAR Stories" icon={<StarIcon />} iconPosition="start" />
          <Tab label="Troubleshooting Playbook" icon={<TerminalIcon />} iconPosition="start" />
          <Tab label="Flashcards & Cheats" icon={<FlashOnIcon />} iconPosition="start" />
          <Tab label="AI Coach Chat" icon={<PsychologyIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box>
        {/* Tab 1: Question Bank */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Frequently & Top Questions</Typography>
            {pkg.question_bank && pkg.question_bank.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {pkg.question_bank.map((item: any, index: number) => (
                  <Accordion key={index} sx={{ background: alpha(brand.navy[900], 0.3) }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: '100%' }}>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{ background: alpha(brand.info, 0.1), color: brand.info, fontSize: '0.65rem', fontWeight: 700 }}
                        />
                        <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', flexGrow: 1 }}>{item.question}</Typography>
                        <Chip
                          label={item.difficulty}
                          size="small"
                          sx={{
                            background: alpha(getDifficultyColor(item.difficulty), 0.1),
                            color: getDifficultyColor(item.difficulty),
                            fontSize: '0.6rem',
                            fontWeight: 700,
                            mr: 2
                          }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        <Typography variant="caption" sx={{ color: brand.gold.main, display: 'block', mb: 0.5, fontWeight: 700 }}>
                          IDEAL ANSWER FLOW
                        </Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6, mb: 2 }}>
                          {item.answer}
                        </Typography>
                        <Divider sx={{ my: 1.5, borderColor: alpha(brand.text.muted, 0.1) }} />
                        <Typography variant="caption" sx={{ color: brand.text.muted, display: 'block', mb: 0.5, fontWeight: 700 }}>
                          INTERVIEWER EVALUATION METRIC
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', fontSize: '0.8rem', color: brand.text.muted }}>
                          {item.expected_evaluation}
                        </Typography>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: brand.text.muted }}>No questions compiled.</Typography>
            )}
          </Box>
        )}

        {/* Tab 2: STAR Stories */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Behavioral Competency (STAR Answers)</Typography>
            {pkg.star_answers && pkg.star_answers.length > 0 ? (
              <Grid container spacing={3}>
                {pkg.star_answers.map((story: any, index: number) => (
                  <Grid size={{ xs: 12, md: 6 }} key={index}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: alpha(brand.gold.main, 0.15) }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Chip
                          label={story.category}
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', mb: 2, background: alpha(brand.gold.main, 0.1), color: brand.gold.main }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>SITUATION</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>{story.situation}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>TASK</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>{story.task}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>ACTION</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5 }}>{story.action}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>RESULT</Typography>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem', mt: 0.5, fontWeight: 600 }}>{story.result}</Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" sx={{ color: brand.text.muted }}>No STAR stories found.</Typography>
            )}
          </Box>
        )}

        {/* Tab 3: Troubleshooting Playbook */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Production Incident Troubleshooting Playbooks</Typography>
            {pkg.scenario_questions && pkg.scenario_questions.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pkg.scenario_questions.map((play: any, index: number) => (
                  <Card key={index} sx={{ borderLeft: `4px solid ${brand.error}` }}>
                    <CardContent>
                      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: brand.error, mb: 2 }}>
                        {play.problem}
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>
                            INVESTIGATION SEQUENCE
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {play.investigation}
                          </Typography>
                          {play.commands && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" sx={{ color: brand.text.muted, fontWeight: 800, display: 'block', mb: 0.5 }}>
                                CONCRETE INVESTIGATION COMMANDS
                              </Typography>
                              <Box
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1,
                                  background: '#0F172A',
                                  color: '#38BDF8',
                                  fontFamily: 'monospace',
                                  fontSize: '0.8rem',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                {play.commands}
                              </Box>
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>
                            SOLUTION / ACTION PLAN
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-line', lineHeight: 1.6, mb: 2 }}>
                            {play.solution}
                          </Typography>
                          <Typography variant="caption" sx={{ color: brand.gold.main, fontWeight: 800, display: 'block' }}>
                            ROOT CAUSE ANALYSIS
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', fontSize: '0.85rem' }}>
                            {play.root_cause}
                          </Typography>
                          <Divider sx={{ my: 1.5, borderColor: alpha(brand.text.muted, 0.1) }} />
                          <Typography variant="caption" sx={{ color: brand.success, fontWeight: 800, display: 'block' }}>
                            PERMANENT PREVENTION
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.85rem' }}>
                            {play.prevention}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: brand.text.muted }}>No scenarios generated.</Typography>
            )}
          </Box>
        )}

        {/* Tab 4: Flashcards & Cheats */}
        {activeTab === 3 && (
          <Box>
            <Grid container spacing={3}>
              {/* Flashcard Swiper */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Interactive Prep Flashcards</Typography>
                {pkg.flashcards && pkg.flashcards.length > 0 ? (
                  <Card
                    sx={{
                      minHeight: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: showFlashcardAnswer ? alpha(brand.navy[900], 0.5) : brand.navy[800],
                      cursor: 'pointer',
                      border: `2px dashed ${alpha(brand.gold.main, 0.35)}`,
                      transition: 'all 0.3s',
                      position: 'relative',
                      textAlign: 'center',
                      p: 3
                    }}
                    onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                  >
                    <Box sx={{ position: 'absolute', top: 10, right: 12 }}>
                      <Chip
                        label={pkg.flashcards[flashcardIndex].category}
                        size="small"
                        sx={{ fontSize: '0.65rem', background: alpha(brand.gold.main, 0.12), color: brand.gold.main, fontWeight: 700 }}
                      />
                    </Box>
                    <Box sx={{ mt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      {!showFlashcardAnswer ? (
                        <Box>
                          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: '1.2rem', mb: 2 }}>
                            {pkg.flashcards[flashcardIndex].question}
                          </Typography>
                          <Typography variant="caption" sx={{ color: brand.text.muted }}>
                            Click card to flip and view explanation
                          </Typography>
                        </Box>
                      ) : (
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: brand.gold.main, mb: 1 }}>
                            {pkg.flashcards[flashcardIndex].answer}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: brand.text.muted, px: 2, lineHeight: 1.5 }}>
                            {pkg.flashcards[flashcardIndex].explanation}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextFlashcard();
                        }}
                      >
                        Next Flashcard →
                      </Button>
                    </Box>
                  </Card>
                ) : (
                  <Typography variant="body2" sx={{ color: brand.text.muted }}>No flashcards compiled.</Typography>
                )}
              </Grid>

              {/* Cheat Sheets */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>Revision Cheat Sheets</Typography>
                {pkg.cheat_sheets ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Card sx={{ background: alpha(brand.navy[900], 0.3) }}>
                      <CardContent>
                        <Typography sx={{ fontWeight: 800, color: brand.gold.main, fontSize: '0.8rem', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleIcon fontSize="small" /> 5-MINUTE KEY ARCHITECTURE CONCEPTS
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', lineHeight: 1.6 }}>
                          {pkg.cheat_sheets.revision_5min?.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card sx={{ background: alpha(brand.navy[900], 0.3) }}>
                      <CardContent>
                        <Typography sx={{ fontWeight: 800, color: brand.gold.main, fontSize: '0.8rem', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleIcon fontSize="small" /> 10-MINUTE COMMANDS & FLOWS
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', lineHeight: 1.6 }}>
                          {pkg.cheat_sheets.revision_10min?.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    <Card sx={{ background: alpha(brand.navy[900], 0.3) }}>
                      <CardContent>
                        <Typography sx={{ fontWeight: 800, color: brand.error, fontSize: '0.8rem', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleIcon fontSize="small" /> INTERVIEW DAY CHECKLIST & MISTAKES
                        </Typography>
                        <ul style={{ margin: 0, paddingLeft: 20, fontSize: '0.8rem', lineHeight: 1.6 }}>
                          {pkg.cheat_sheets.interview_day?.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: brand.text.muted }}>No cheat sheets compiled.</Typography>
                )}
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab 5: AI Coach Chat */}
        {activeTab === 4 && (
          <Box>
            <Card sx={{ border: `1px solid ${alpha(brand.gold.main, 0.2)}` }}>
              <Box sx={{ background: alpha(brand.navy[900], 0.5), p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PsychologyIcon sx={{ color: brand.gold.main }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Interview Coach</Typography>
                  <Typography variant="caption" sx={{ color: brand.text.muted }}>
                    Ask questions, roleplay mock interviews, or paste your answers for immediate scoring & evaluation.
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ p: 0 }}>
                {/* Chat window */}
                <Box sx={{ height: 400, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {chatHistory.length === 0 && (
                    <Box sx={{ py: 4, textAlign: 'center', color: brand.text.muted }}>
                      <Typography variant="body2">
                        I am your 777c8 Coach. You can ask me questions like:<br />
                        "How would I troubleshoot a database lock contention?" or<br />
                        "Can you mock interview me for {pkg.role}?"
                      </Typography>
                    </Box>
                  )}
                  {chatHistory.map((msg, i) => (
                    <Box
                      key={i}
                      sx={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: msg.role === 'user' ? alpha(brand.gold.main, 0.12) : alpha(brand.navy[900], 0.6),
                        border: msg.role === 'user' ? `1px solid ${alpha(brand.gold.main, 0.3)}` : 'none',
                        p: 1.5,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                        {msg.content}
                      </Typography>

                      {/* Display evaluation metrics if returned */}
                      {msg.score !== undefined && (
                        <Box sx={{ mt: 1.5, p: 1, background: alpha(brand.success, 0.08), borderRadius: 0.5, borderLeft: `3px solid ${brand.success}` }}>
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: brand.success }}>
                            EVALUATION SCORE: {msg.score}/100
                          </Typography>
                          {msg.feedback && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: brand.text.muted }}>
                              Feedback: {msg.feedback}
                            </Typography>
                          )}
                          {msg.actionable_tips && msg.actionable_tips.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: brand.gold.main }}>COACH RECOMMENDATIONS:</Typography>
                              <ul style={{ margin: 0, paddingLeft: 14, fontSize: '0.65rem', color: brand.text.muted }}>
                                {msg.actionable_tips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                              </ul>
                            </Box>
                          )}
                        </Box>
                      )}
                    </Box>
                  ))}
                  {coachMutation.isPending && (
                    <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 1, alignItems: 'center' }}>
                      <CircularProgress size={16} color="warning" />
                      <Typography variant="caption" sx={{ color: brand.text.muted }}>Coach is analyzing...</Typography>
                    </Box>
                  )}
                  <div ref={chatBottomRef} />
                </Box>
                
                {/* Input row */}
                <Box sx={{ p: 2, background: alpha(brand.navy[900], 0.3), display: 'flex', gap: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type your message, query, or mock answer here..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    disabled={coachMutation.isPending}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: '#0B0F19'
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    color="warning"
                    endIcon={<SendIcon />}
                    onClick={handleSendChat}
                    disabled={coachMutation.isPending || !chatMessage.trim()}
                  >
                    Send
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default InterviewPrepDetail;
