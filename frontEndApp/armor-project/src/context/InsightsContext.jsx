/**
 * InsightsContext.jsx
 * Fetches all transcripts with insights from Supabase and provides aggregated data.
 * Replaces dummy data with real data from the backend.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { listTranscripts } from '../api/transcripts';
import { getInsightsSummary } from '../api/recordings';
import { useAuth } from './AuthContext';

const InsightsContext = createContext(null);

export const InsightsProvider = ({ children }) => {
  const { user } = useAuth();
  const [transcripts, setTranscripts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [trRes, sumRes] = await Promise.all([
        listTranscripts({ limit: 100 }),
        getInsightsSummary(),
      ]);
      setTranscripts(trRes.transcripts || []);
      setSummary(sumRes.summary || sumRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <InsightsContext.Provider value={{ transcripts, summary, loading, error, refetch: fetchData }}>
      {children}
    </InsightsContext.Provider>
  );
};

export const useInsights = () => {
  const ctx = useContext(InsightsContext);
  if (!ctx) throw new Error('useInsights must be used inside <InsightsProvider>');
  return ctx;
};

export default InsightsContext;
