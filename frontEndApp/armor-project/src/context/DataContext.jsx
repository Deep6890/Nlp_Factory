/**
 * DataContext.jsx — Single source of truth for analytics data.
 * Fetches real transcript data from Supabase via the backend API.
 * Falls back to empty state (no dummy data) when no sessions exist.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

const DataContext = createContext(null);

// ── Derived aggregations ──────────────────────────────────────────────────────
const buildStats = (transcripts) => {
  const total = transcripts.length;
  const posCount = transcripts.filter(t => t.insights?.sentiment_label === 'positive').length;
  const sentimentScore = total > 0 ? Math.round((posCount / total) * 100) : 0;
  const avgRisk = total > 0
    ? Math.round(transcripts.reduce((a, t) => {
        const r = (t.insights?.risk_level || 'low').toLowerCase();
        return a + (r === 'high' ? 80 : r === 'medium' ? 50 : 20);
      }, 0) / total)
    : 0;
  const activeReminders = transcripts.filter(t => t.insights?.action_items?.length > 0).length;
  return { total, sentimentScore, avgRisk, activeReminders };
};

const buildTrendData = (transcripts) => {
  const byDay = {};
  transcripts.forEach(t => {
    const day = (t.createdAt || '').slice(0, 10);
    if (!day) return;
    if (!byDay[day]) byDay[day] = { date: day, positive: 0, negative: 0, neutral: 0, total: 0 };
    const s = (t.insights?.sentiment_label || 'neutral').toLowerCase();
    byDay[day][s] = (byDay[day][s] || 0) + 1;
    byDay[day].total++;
  });
  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
};

const buildFinancialKeywords = (transcripts) => {
  const freq = {};
  transcripts.forEach(t => {
    (t.keywords || []).forEach(kw => {
      const k = typeof kw === 'string' ? kw : kw.word || kw;
      if (k) freq[k] = (freq[k] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
};

const buildReminderFlags = (transcripts) => {
  return transcripts.flatMap(t =>
    (t.insights?.action_items || []).map((item, i) => ({
      id: `${t._id}_${i}`,
      transcriptId: t._id,
      recordingId: t.recordingId,
      text: item,
      reminderText: item,
      resolved: false,
      createdAt: t.createdAt,
    }))
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [sentimentStats, setSentimentStats] = useState({ total: 0, sentimentScore: 0, avgRisk: 0, activeReminders: 0 });
  const [financialKeywords, setFinancialKeywords] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [reminderFlags, setReminderFlags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const processData = useCallback((data) => {
    setTranscripts(data);
    setSentimentStats(buildStats(data));
    setTrendData(buildTrendData(data));
    setFinancialKeywords(buildFinancialKeywords(data));
    setReminderFlags(buildReminderFlags(data));
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/transcripts?limit=100');
      const data = res.transcripts || res.data?.transcripts || [];
      processData(data);
    } catch (err) {
      setError(err.message);
      processData([]);
    } finally {
      setIsLoading(false);
    }
  }, [processData]);

  useEffect(() => { refetch(); }, [refetch]);

  const resolveReminder = useCallback((id) => {
    setReminderFlags(prev => prev.map(r => r.id === id ? { ...r, resolved: !r.resolved } : r));
  }, []);

  return (
    <DataContext.Provider value={{
      transcripts, sentimentStats, financialKeywords,
      trendData, reminderFlags,
      speakerMetrics: [],   // no speaker-level data in current schema
      isLoading, error, refetch, resolveReminder,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
};

export default DataContext;
