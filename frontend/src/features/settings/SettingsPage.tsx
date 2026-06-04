import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  alpha,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useQuery, useMutation } from '@tanstack/react-query';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TokenIcon from '@mui/icons-material/OfflineBolt';
import SecurityIcon from '@mui/icons-material/Security';

import { brand } from '../../theme';
import { authApi, settingsApi, systemApi } from '../../api/client';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'] },
  { id: 'anthropic', label: 'Anthropic', models: ['claude-3-5-sonnet', 'claude-3-haiku'] },
  { id: 'gemini', label: 'Google Gemini', models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
  { id: 'openrouter', label: 'OpenRouter', models: ['google/gemini-2.5-flash', 'openai/gpt-4o-mini', 'meta-llama/llama-3-8b-instruct'] },
  { id: 'groq', label: 'Groq', models: ['llama3-8b-8192', 'mixtral-8x7b-32768'] },
  { id: 'deepseek', label: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] },
  { id: 'ollama', label: 'Local Ollama', models: ['llama3', 'mistral', 'phi3'] },
];

const SettingsPage: React.FC = () => {
  // Auth state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // API Key wizard state
  const [selectedWizardProvider, setSelectedWizardProvider] = useState('openai');
  const [wizardApiKey, setWizardApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Query data
  const { data: authStatus, refetch: refetchAuth } = useQuery({
    queryKey: ['authStatus'],
    queryFn: async () => {
      const res = await authApi.status();
      return res.data;
    },
  });

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApi.get();
      return res.data;
    },
  });

  const { data: latexStatus } = useQuery({
    queryKey: ['latexStatus'],
    queryFn: async () => {
      const res = await systemApi.latexStatus();
      return res.data;
    },
  });

  const { data: costSummary, refetch: refetchCosts } = useQuery({
    queryKey: ['costSummary'],
    queryFn: async () => {
      const res = await settingsApi.getCostsSummary();
      return res.data;
    },
  });

  const { data: costLogs, refetch: refetchCostLogs } = useQuery({
    queryKey: ['costLogs'],
    queryFn: async () => {
      const res = await settingsApi.getCosts({ limit: 10 });
      return res.data;
    },
  });

  // Mutations
  const setupMutation = useMutation({
    mutationFn: () => authApi.setup(password),
    onSuccess: () => {
      setPassword('');
      setAuthError('');
      refetchAuth();
      refetchSettings();
    },
    onError: (err: any) => {
      setAuthError(err.response?.data?.detail || 'Failed to setup master password.');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: () => authApi.unlock(password),
    onSuccess: () => {
      setPassword('');
      setAuthError('');
      refetchAuth();
      refetchSettings();
    },
    onError: (err: any) => {
      setAuthError(err.response?.data?.detail || 'Invalid master password.');
    }
  });

  const lockMutation = useMutation({
    mutationFn: () => authApi.lock(),
    onSuccess: () => {
      refetchAuth();
      refetchSettings();
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => settingsApi.update(data),
    onSuccess: () => {
      refetchSettings();
    },
  });

  const saveKeyMutation = useMutation({
    mutationFn: () => settingsApi.updateApiKey(selectedWizardProvider, wizardApiKey),
    onSuccess: () => {
      setWizardApiKey('');
      refetchSettings();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to save key. Make sure the app is unlocked.');
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (provider: string) => settingsApi.deleteApiKey(provider),
    onSuccess: () => {
      refetchSettings();
    },
    onError: (err: any) => {
      alert(err.response?.data?.detail || 'Failed to delete key.');
    }
  });

  // Setup default model selection matching provider
  useEffect(() => {
    if (settings && !settings.active_model) {
      const providerObj = PROVIDERS.find(p => p.id === settings.active_provider);
      if (providerObj) {
        updateSettingsMutation.mutate({ active_model: providerObj.models[0] });
      }
    }
  }, [settings?.active_provider]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h2">Settings & Security</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>Configure your multi-AI providers, password access, and file encryption preferences.</Typography>
        </Box>
        <Button startIcon={<RefreshIcon />} size="small" onClick={() => { refetchSettings(); refetchAuth(); refetchCosts(); refetchCostLogs(); }}>
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Master Security Lock Controls */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon color="primary" /> Master Password & Security Lock
              </Typography>

              {authStatus && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  {authStatus.is_setup ? (
                    <Chip icon={<CheckCircleIcon />} label="Master Password Set Up" size="small" sx={{ background: alpha(brand.success, 0.12), color: brand.success }} />
                  ) : (
                    <Chip icon={<CancelIcon />} label="Master Password Not Configured" size="small" sx={{ background: alpha(brand.error, 0.12), color: brand.error }} />
                  )}
                  {authStatus.is_unlocked ? (
                    <Chip icon={<LockOpenIcon />} label="Unlocked" size="small" sx={{ background: alpha(brand.success, 0.12), color: brand.success }} />
                  ) : (
                    <Chip icon={<LockIcon />} label="Locked" size="small" sx={{ background: alpha(brand.warning, 0.12), color: brand.warning }} />
                  )}
                </Box>
              )}

              {authError && <Alert severity="error" sx={{ mb: 2 }}>{authError}</Alert>}

              {authStatus && !authStatus.is_setup && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Setup a master password. This password derives a secure cryptographic key in-memory to encrypt/decrypt sensitive documents and third-party API keys.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Choose Master Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                  <Button variant="contained" disabled={password.length < 8} onClick={() => setupMutation.mutate()}>
                    Set Master Password
                  </Button>
                </Box>
              )}

              {authStatus && authStatus.is_setup && !authStatus.is_unlocked && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Provide the master password to unlock the secure vault, allowing edits to provider configuration and decrypting document archives.
                  </Typography>
                  <TextField
                    fullWidth
                    label="Master Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                  <Button variant="contained" onClick={() => unlockMutation.mutate()} sx={{ mr: 2 }}>
                    Unlock Secure Vault
                  </Button>
                </Box>
              )}

              {authStatus && authStatus.is_unlocked && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2, color: brand.success }}>
                    Secure Vault is currently unlocked. Critical operations (API keys setup and document decryption) are enabled.
                  </Typography>
                  <Button variant="outlined" color="warning" startIcon={<LockIcon />} onClick={() => lockMutation.mutate()}>
                    Lock Vault (Wipe Key from Memory)
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Global LLM Preferences */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3 }}>Global AI Routing Configuration</Typography>
              {settings && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <FormControl fullWidth>
                    <InputLabel>Active AI Provider</InputLabel>
                    <Select
                      value={settings.active_provider}
                      label="Active AI Provider"
                      onChange={(e) => updateSettingsMutation.mutate({ active_provider: e.target.value })}
                    >
                      {PROVIDERS.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.label} {settings.api_keys_status[p.id] ? '(Configured)' : p.id === 'ollama' ? '(Local)' : '(No Key)'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Active Model</InputLabel>
                    <Select
                      value={settings.active_model}
                      label="Active Model"
                      onChange={(e) => updateSettingsMutation.mutate({ active_model: e.target.value })}
                    >
                      {(PROVIDERS.find(p => p.id === settings.active_provider)?.models || []).map((m) => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.failover_enabled}
                          onChange={(e) => updateSettingsMutation.mutate({ failover_enabled: e.target.checked })}
                        />
                      }
                      label="Enable Cascade AI Failover"
                    />
                    {settings.failover_enabled && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Failover AI Provider</InputLabel>
                        <Select
                          value={settings.failover_provider}
                          label="Failover AI Provider"
                          onChange={(e) => updateSettingsMutation.mutate({ failover_provider: e.target.value })}
                        >
                          {PROVIDERS.filter(p => p.id !== settings.active_provider).map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.label} {settings.api_keys_status[p.id] ? '(Configured)' : p.id === 'ollama' ? '(Local)' : '(No Key)'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    label="Ollama Local Host URL"
                    value={settings.ollama_url || ''}
                    placeholder="http://localhost:11434"
                    onChange={(e) => updateSettingsMutation.mutate({ ollama_url: e.target.value })}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.encrypt_files}
                        onChange={(e) => updateSettingsMutation.mutate({ encrypt_files: e.target.checked })}
                      />
                    }
                    label="On-the-fly Master Resume & PDF File Encryption"
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* API Key Wizard Manager */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 2 }}>API Key Wizard</Typography>
              {authStatus && !authStatus.is_unlocked ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Unlock the Master Security Lock above to view status or modify API keys.
                </Alert>
              ) : (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Configure Provider</InputLabel>
                      <Select
                        value={selectedWizardProvider}
                        label="Configure Provider"
                        onChange={(e) => {
                          setSelectedWizardProvider(e.target.value);
                          setWizardApiKey('');
                        }}
                      >
                        {PROVIDERS.filter(p => p.id !== 'ollama').map(p => (
                          <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label={`${PROVIDERS.find(p => p.id === selectedWizardProvider)?.label} API Key`}
                      type={showApiKey ? 'text' : 'password'}
                      value={wizardApiKey}
                      onChange={(e) => setWizardApiKey(e.target.value)}
                      placeholder="Paste API Key here"
                      sx={{ mb: 2 }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                                {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          )
                        }
                      }}
                    />

                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => saveKeyMutation.mutate()}
                      disabled={!wizardApiKey}
                      fullWidth
                    >
                      Save Secure Key
                    </Button>
                  </Grid>

                  <Grid size={{ xs: 12, md: 8 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Provider</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {PROVIDERS.filter(p => p.id !== 'ollama').map((p) => (
                            <TableRow key={p.id}>
                              <TableCell sx={{ fontWeight: 600 }}>{p.label}</TableCell>
                              <TableCell>
                                {settings?.api_keys_status[p.id] ? (
                                  <Chip label="Configured" size="small" color="success" variant="outlined" />
                                ) : (
                                  <Chip label="Not Set" size="small" color="default" variant="outlined" />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton
                                  color="error"
                                  disabled={!settings?.api_keys_status[p.id]}
                                  onClick={() => deleteKeyMutation.mutate(p.id)}
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* AI Cost Logs & Summary */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ mb: 3 }}>AI Token Usage & Cost Analytics</Typography>

              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TokenIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: brand.text.muted }}>Cumulative Tokens Used</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        {costSummary?.total_tokens_used?.toLocaleString() || 0}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <MonetizationOnIcon color="success" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: brand.text.muted }}>Estimated Total Cost</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: brand.success }}>
                        ${costSummary?.total_cost_usd?.toFixed(5) || '0.00000'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SecurityIcon color="info" sx={{ fontSize: 40 }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: brand.text.muted }}>Average Cost / Call</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        ${costLogs && costLogs.length > 0 && costSummary
                          ? (costSummary.total_cost_usd / (costLogs.length || 1)).toFixed(6)
                          : '0.000000'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ mb: 2 }}>Recent API Cost Logs</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Model</TableCell>
                      <TableCell>Feature</TableCell>
                      <TableCell align="right">Prompt Tokens</TableCell>
                      <TableCell align="right">Completion Tokens</TableCell>
                      <TableCell align="right">Estimated Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {costLogs && costLogs.length > 0 ? (
                      costLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{log.provider_name}</TableCell>
                          <TableCell>{log.model_name}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{log.feature.replace(/_/g, ' ')}</TableCell>
                          <TableCell align="right">{log.tokens_prompt?.toLocaleString()}</TableCell>
                          <TableCell align="right">{log.tokens_completion?.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: brand.success, fontWeight: 600 }}>
                            ${log.estimated_cost_usd?.toFixed(6)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: brand.text.muted }}>
                          No AI operations logged yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;
