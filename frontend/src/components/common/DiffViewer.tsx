import React from 'react';
import { Box, Typography, Paper, Chip, alpha } from '@mui/material';
import { brand } from '../../theme';

interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

// Longest Common Subsequence (LCS) word-by-word diff implementation
function diffWords(oldStr: string, newStr: string): DiffToken[] {
  const oStr = oldStr || '';
  const nStr = newStr || '';
  const oldWords = oStr.split(/(\s+)/).filter(Boolean);
  const newWords = nStr.split(/(\s+)/).filter(Boolean);
  
  const dp: number[][] = Array(oldWords.length + 1)
    .fill(0)
    .map(() => Array(newWords.length + 1).fill(0));
  
  for (let i = 1; i <= oldWords.length; i++) {
    for (let j = 1; j <= newWords.length; j++) {
      if (oldWords[i-1] === newWords[j-1]) {
        dp[i][j] = dp[i-1][j-1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
  }
  
  const tokens: DiffToken[] = [];
  let i = oldWords.length;
  let j = newWords.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i-1] === newWords[j-1]) {
      tokens.unshift({ type: 'unchanged', value: oldWords[i-1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      tokens.unshift({ type: 'added', value: newWords[j-1] });
      j--;
    } else {
      tokens.unshift({ type: 'removed', value: oldWords[i-1] });
      i--;
    }
  }
  return tokens;
}

interface DiffViewerProps {
  original: any;
  modified: any;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified }) => {
  if (!original || !modified) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: brand.text.muted }}>
          Select versions to view the visual difference details.
        </Typography>
      </Box>
    );
  }

  // 1. Render Summary Diffs
  const oldSummary = original.summary || '';
  const newSummary = modified.summary || '';
  const summaryDiff = diffWords(oldSummary, newSummary);

  // 2. Render Skills Diffs (compare arrays)
  const oldSkills: string[] = original.skills || [];
  const newSkills: string[] = modified.skills || [];
  
  const addedSkills = newSkills.filter(s => !oldSkills.includes(s));
  const removedSkills = oldSkills.filter(s => !newSkills.includes(s));
  const unchangedSkills = newSkills.filter(s => oldSkills.includes(s));

  // 3. Render Experience Diffs
  const oldExp: any[] = original.experience || [];
  const newExp: any[] = modified.experience || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: 2 }}>
      {/* Summary Section */}
      <Box>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Professional Summary comparison</Typography>
        <Paper variant="outlined" sx={{ p: 2, background: alpha(brand.navy[600], 0.4), lineHeight: 1.6 }}>
          {summaryDiff.map((tok, index) => {
            if (tok.type === 'added') {
              return (
                <Box component="span" key={index} sx={{ background: 'rgba(46, 160, 67, 0.2)', color: brand.success, px: 0.25, borderRadius: 0.5 }}>
                  {tok.value}
                </Box>
              );
            }
            if (tok.type === 'removed') {
              return (
                <Box component="span" key={index} sx={{ background: 'rgba(248, 81, 73, 0.2)', color: brand.error, px: 0.25, borderRadius: 0.5, textDecoration: 'line-through' }}>
                  {tok.value}
                </Box>
              );
            }
            return <span key={index}>{tok.value}</span>;
          })}
        </Paper>
      </Box>

      {/* Skills Section */}
      <Box>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Skills & Keywords adjustments</Typography>
        <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 1, background: alpha(brand.navy[600], 0.4) }}>
          {addedSkills.map((s, i) => (
            <Chip key={`add-${i}`} label={`+ ${s}`} size="small" sx={{ background: 'rgba(46, 160, 67, 0.15)', color: brand.success, fontWeight: 600 }} />
          ))}
          {unchangedSkills.map((s, i) => (
            <Chip key={`unc-${i}`} label={s} size="small" variant="outlined" />
          ))}
          {removedSkills.map((s, i) => (
            <Chip key={`rem-${i}`} label={`- ${s}`} size="small" sx={{ background: 'rgba(248, 81, 73, 0.15)', color: brand.error, textDecoration: 'line-through' }} />
          ))}
          {addedSkills.length === 0 && removedSkills.length === 0 && unchangedSkills.length === 0 && (
            <Typography variant="body2" sx={{ color: brand.text.muted }}>No skills declared.</Typography>
          )}
        </Paper>
      </Box>

      {/* Experience Section */}
      <Box>
        <Typography variant="h5" sx={{ mb: 1.5 }}>Professional Experience Bullet points</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {newExp.map((exp, expIdx) => {
            const oldMatch = oldExp.find(o => o.company === exp.company && o.title === exp.title) || {};
            const oldBullets: string[] = oldMatch.bullets || [];
            const newBullets: string[] = exp.bullets || [];

            return (
              <Paper key={expIdx} variant="outlined" sx={{ p: 2, background: alpha(brand.navy[600], 0.2) }}>
                <Typography sx={{ fontWeight: 700 }}>{exp.title} at {exp.company}</Typography>
                <Typography variant="caption" sx={{ color: brand.text.muted, mb: 1.5, display: 'block' }}>
                  {exp.start_date} – {exp.end_date || 'Present'}
                </Typography>
                <Box sx={{ pl: 2, borderLeft: `2px solid ${alpha(brand.gold.main, 0.3)}`, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {newBullets.map((bullet, bulletIdx) => {
                    const matchedOldBullet = oldBullets[bulletIdx] || '';
                    if (matchedOldBullet === bullet) {
                      return (
                        <Typography key={bulletIdx} variant="body2" sx={{ color: brand.text.secondary }}>
                          • {bullet}
                        </Typography>
                      );
                    }
                    const bulletDiff = diffWords(matchedOldBullet, bullet);
                    return (
                      <Typography key={bulletIdx} variant="body2">
                        •{' '}
                        {bulletDiff.map((tok, idx) => {
                          if (tok.type === 'added') {
                            return (
                              <Box component="span" key={idx} sx={{ background: 'rgba(46, 160, 67, 0.2)', color: brand.success, px: 0.2, borderRadius: 0.5 }}>
                                {tok.value}
                              </Box>
                            );
                          }
                          if (tok.type === 'removed') {
                            return (
                              <Box component="span" key={idx} sx={{ background: 'rgba(248, 81, 73, 0.2)', color: brand.error, px: 0.2, borderRadius: 0.5, textDecoration: 'line-through' }}>
                                {tok.value}
                              </Box>
                            );
                          }
                          return <span key={idx}>{tok.value}</span>;
                        })}
                      </Typography>
                    );
                  })}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default DiffViewer;
