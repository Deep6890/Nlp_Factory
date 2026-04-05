/**
 * DataContext.jsx — Single source of truth for FinSentiq analytics data.
 * All components read from useData() — zero direct fetching elsewhere.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

const DataContext = createContext(null);

// ── Rich dummy data matching the canonical transcript schema ──────────────────
const DUMMY_TRANSCRIPTS = [
  {
    _id: 'fs_001',
    sessionId: 'SESSION-2026-0405-001',
    createdAt: '2026-04-05T12:52:03',
    updatedAt: '2026-04-05T13:10:00',
    participants: [
      { speakerId: 'sp1', name: 'Rahul Sharma', role: 'customer' },
      { speakerId: 'sp2', name: 'Priya Advisor', role: 'agent' },
    ],
    transcript: [
      {
        id: 't1', speakerId: 'sp1', timestamp: 0,
        text: 'Mujhe SIP shuru karni hai lekin pehle investment problem solve karni hai.',
        sentiment: { label: 'neutral', score: 0.5, confidence: 0.91 },
        financialEntities: [{ type: 'metric', value: 'SIP', normalized: 'Systematic Investment Plan' }],
        nlpTags: ['QUESTION', 'RISK_MENTION'],
        isFlaggedReminder: false, reminderText: null,
      },
      {
        id: 't2', speakerId: 'sp2', timestamp: 18,
        text: 'Aapki investment problem kya hai? Kya aap mujhe details de sakte hain?',
        sentiment: { label: 'positive', score: 0.72, confidence: 0.88 },
        financialEntities: [],
        nlpTags: ['CLARIFICATION', 'QUESTION'],
        isFlaggedReminder: false, reminderText: null,
      },
      {
        id: 't3', speakerId: 'sp1', timestamp: 35,
        text: 'Mere paas ₹5,000 per month hai invest karne ke liye. 2 saal ke liye.',
        sentiment: { label: 'neutral', score: 0.55, confidence: 0.85 },
        financialEntities: [{ type: 'amount', value: '₹5,000', normalized: '5000 INR/month' }],
        nlpTags: ['COMMITMENT', 'PRICING_TALK'],
        isFlaggedReminder: true, reminderText: 'Follow up on ₹5,000/month SIP setup in 2 weeks',
      },
    ],
    summary: {
      overallSentiment: 'neutral', dominantEmotion: 'curious',
      financialRiskScore: 42, keyTopics: ['SIP', 'investment', 'monthly savings', 'planning'],
      totalDuration: 53, wordCount: 68, reminderCount: 1,
    },
    metadata: { source: 'audio_upload', language: 'hi', version: '3.0' },
  },
  {
    _id: 'fs_002',
    sessionId: 'SESSION-2026-0404-002',
    createdAt: '2026-04-04T10:15:00',
    updatedAt: '2026-04-04T10:58:00',
    participants: [
      { speakerId: 'sp3', name: 'Amit Patel', role: 'customer' },
      { speakerId: 'sp4', name: 'Neha Banker', role: 'agent' },
    ],
    transcript: [
      {
        id: 't4', speakerId: 'sp3', timestamp: 0,
        text: 'My home loan EMI is ₹18,500 and car loan is ₹7,200 per month. Total ₹25,700.',
        sentiment: { label: 'negative', score: 0.71, confidence: 0.94 },
        financialEntities: [
          { type: 'amount', value: '₹18,500', normalized: '18500 INR' },
          { type: 'amount', value: '₹7,200', normalized: '7200 INR' },
          { type: 'amount', value: '₹25,700', normalized: '25700 INR' },
        ],
        nlpTags: ['RISK_MENTION', 'PRICING_TALK'],
        isFlaggedReminder: false, reminderText: null,
      },
      {
        id: 't5', speakerId: 'sp4', timestamp: 22,
        text: 'That is 46.7% of your ₹55,000 salary. This is above the safe 40% threshold.',
        sentiment: { label: 'negative', score: 0.68, confidence: 0.92 },
        financialEntities: [
          { type: 'metric', value: '46.7%', normalized: 'debt-to-income ratio' },
          { type: 'amount', value: '₹55,000', normalized: '55000 INR' },
        ],
        nlpTags: ['RISK_MENTION', 'REGULATORY'],
        isFlaggedReminder: true, reminderText: 'Review EMI restructuring options — debt ratio at 46.7%',
      },
      {
        id: 't6', speakerId: 'sp3', timestamp: 45,
        text: 'What can I do to reduce this burden? Should I prepay the car loan?',
        sentiment: { label: 'negative', score: 0.62, confidence: 0.89 },
        financialEntities: [],
        nlpTags: ['QUESTION', 'URGENCY', 'FOLLOW_UP'],
        isFlaggedReminder: true, reminderText: 'Evaluate car loan prepayment feasibility',
      },
    ],
    summary: {
      overallSentiment: 'negative', dominantEmotion: 'stressed',
      financialRiskScore: 78, keyTopics: ['EMI', 'home loan', 'car loan', 'debt ratio', 'salary'],
      totalDuration: 67, wordCount: 89, reminderCount: 2,
    },
    metadata: { source: 'audio_upload', language: 'en', version: '3.0' },
  },
  {
    _id: 'fs_003',
    sessionId: 'SESSION-2026-0403-003',
    createdAt: '2026-04-03T16:30:00',
    updatedAt: '2026-04-03T17:05:00',
    participants: [
      { speakerId: 'sp5', name: 'Sunita Mehta', role: 'customer' },
      { speakerId: 'sp6', name: 'Vikram Analyst', role: 'analyst' },
    ],
    transcript: [
      {
        id: 't7', speakerId: 'sp5', timestamp: 0,
        text: 'I want to invest ₹10,000 per month in mutual funds for 10 years to build ₹50 lakhs.',
        sentiment: { label: 'positive', score: 0.78, confidence: 0.96 },
        financialEntities: [
          { type: 'amount', value: '₹10,000', normalized: '10000 INR/month' },
          { type: 'amount', value: '₹50 lakhs', normalized: '5000000 INR' },
        ],
        nlpTags: ['COMMITMENT', 'PRICING_TALK'],
        isFlaggedReminder: false, reminderText: null,
      },
      {
        id: 't8', speakerId: 'sp6', timestamp: 20,
        text: 'At 12% CAGR, ₹10,000/month for 10 years gives approximately ₹23 lakhs. You need higher allocation.',
        sentiment: { label: 'neutral', score: 0.55, confidence: 0.91 },
        financialEntities: [
          { type: 'metric', value: '12% CAGR', normalized: 'compound annual growth rate' },
          { type: 'amount', value: '₹23 lakhs', normalized: '2300000 INR' },
        ],
        nlpTags: ['CLARIFICATION', 'RISK_MENTION'],
        isFlaggedReminder: false, reminderText: null,
      },
      {
        id: 't9', speakerId: 'sp5', timestamp: 48,
        text: 'Can I increase to ₹15,000 per month? I can cut entertainment expenses.',
        sentiment: { label: 'positive', score: 0.65, confidence: 0.88 },
        financialEntities: [{ type: 'amount', value: '₹15,000', normalized: '15000 INR/month' }],
        nlpTags: ['COMMITMENT', 'AGREEMENT'],
        isFlaggedReminder: true, reminderText: 'Increase SIP to ₹15,000/month — confirm with bank',
      },
    ],
    summary: {
      overallSentiment: 'positive', dominantEmotion: 'optimistic',
      financialRiskScore: 22, keyTopics: ['mutual fund', 'SIP', 'CAGR', 'corpus', 'long-term'],
      totalDuration: 75, wordCount: 102, reminderCount: 1,
    },
    metadata: { source: 'audio_upload', language: 'en', version: '3.0' },
  },
  {
    _id: 'fs_004',
    sessionId: 'SESSION-2026-0402-004',
    createdAt: '2026-04-02T09:00:00',
    updatedAt: '2026-04-02T09:42:00',
    participants: [
      { speakerId: 'sp7', name: 'Deepak Joshi', role: 'customer' },
      { speakerId: 'sp8', name: 'Kavya Insurance', role: 'agent' },
    ],
    transcript: [
      {
        id: 't10', speakerId: 'sp7', timestamp: 0,
        text: 'I need ₹1 crore term insurance. I am 32 years old. What is the premium?',
        sentiment: { label: 'neutral', score: 0.52, confidence: 0.87 },
        financialEntities: [
          { type: 'amount', value: '₹1 crore', normalized: '10000000 INR' },
        ],
        nlpTags: ['QUESTION', 'PRICING_TALK'],
        isFlaggedReminder: false, reminderText: null,
      },
      {
        id: 't11', speakerId: 'sp8', timestamp: 18,
        text: 'For ₹1 crore cover at age 32, annual premium ranges from ₹8,000 to ₹14,000 depending on insurer.',
        sentiment: { label: 'positive', score: 0.61, confidence: 0.90 },
        financialEntities: [
          { type: 'amount', value: '₹8,000', normalized: '8000 INR/year' },
          { type: 'amount', value: '₹14,000', normalized: '14000 INR/year' },
        ],
        nlpTags: ['PRICING_TALK', 'CLARIFICATION'],
        isFlaggedReminder: true, reminderText: 'Compare term insurance quotes from 3 insurers',
      },
    ],
    summary: {
      overallSentiment: 'neutral', dominantEmotion: 'curious',
      financialRiskScore: 18, keyTopics: ['term insurance', 'premium', 'cover', 'age'],
      totalDuration: 42, wordCount: 58, reminderCount: 1,
    },
    metadata: { source: 'audio_upload', language: 'en', version: '3.0' },
  },
  {
    _id: 'fs_005',
    sessionId: 'SESSION-2026-0329-005',
    createdAt: '2026-03-29T15:10:00',
    updatedAt: '2026-03-29T15:48:00',
    participants: [
      { speakerId: 'sp9', name: 'Ravi Kumar', role: 'customer' },
      { speakerId: 'sp10', name: 'Anita Banker', role: 'agent' },
    ],
    transcript: [
      {
        id: 't12', speakerId: 'sp9', timestamp: 0,
        text: 'Bank rejected my personal loan. CIBIL score is 620. I need ₹2 lakh for medical emergency.',
        sentiment: { label: 'negative', score: 0.82, confidence: 0.95 },
        financialEntities: [
          { type: 'metric', value: 'CIBIL 620', normalized: 'credit score 620' },
          { type: 'amount', value: '₹2 lakh', normalized: '200000 INR' },
        ],
        nlpTags: ['URGENCY', 'RISK_MENTION', 'OBJECTION'],
        isFlaggedReminder: true, reminderText: 'Explore alternative lenders for ₹2L medical emergency',
      },
      {
        id: 't13', speakerId: 'sp10', timestamp: 25,
        text: 'With CIBIL 620, NBFCs and gold loans are viable options. Interest will be 18-24%.',
        sentiment: { label: 'neutral', score: 0.48, confidence: 0.86 },
        financialEntities: [
          { type: 'metric', value: '18-24%', normalized: 'interest rate range' },
        ],
        nlpTags: ['CLARIFICATION', 'RISK_MENTION'],
        isFlaggedReminder: false, reminderText: null,
      },
    ],
    summary: {
      overallSentiment: 'negative', dominantEmotion: 'anxious',
      financialRiskScore: 85, keyTopics: ['CIBIL', 'loan rejection', 'medical emergency', 'NBFC'],
      totalDuration: 38, wordCount: 62, reminderCount: 1,
    },
    metadata: { source: 'audio_upload', language: 'en', version: '3.0' },
  },
];

// ── Derived aggregations ──────────────────────────────────────────────────────
const buildStats = (transcripts) => {
  const total = transcripts.length;
  const allSentiments = transcripts.map(t => t.summary.overallSentiment);
  const posCount = allSentiments.filter(s => s === 'positive').length;
  const sentimentScore = total > 0 ? Math.round((posCount / total) * 100) : 0;
  const avgRisk = total > 0 ? Math.round(transcripts.reduce((a, t) => a + t.summary.financialRiskScore, 0) / total) : 0;
  const reminders = transcripts.flatMap(t => t.transcript.filter(s => s.isFlaggedReminder));

  return { total, sentimentScore, avgRisk, activeReminders: reminders.length };
};

const buildTrendData = (transcripts) => {
  const byDay = {};
  transcripts.forEach(t => {
    const day = t.createdAt.slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, positive: 0, negative: 0, neutral: 0, total: 0 };
    const s = t.summary.overallSentiment;
    byDay[day][s] = (byDay[day][s] || 0) + 1;
    byDay[day].total++;
  });
  return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
};

const buildFinancialKeywords = (transcripts) => {
  const freq = {};
  transcripts.forEach(t => {
    t.transcript.forEach(s => {
      s.financialEntities.forEach(e => {
        const key = e.normalized || e.value;
        freq[key] = (freq[key] || 0) + 1;
      });
    });
    t.summary.keyTopics.forEach(topic => {
      freq[topic] = (freq[topic] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));
};

const buildSpeakerMetrics = (transcripts) => {
  const speakers = {};
  transcripts.forEach(t => {
    t.participants.forEach(p => {
      if (!speakers[p.speakerId]) {
        speakers[p.speakerId] = { name: p.name, role: p.role, words: 0, sentimentSum: 0, sentimentCount: 0, riskContributions: 0, reminders: 0 };
      }
    });
    t.transcript.forEach(s => {
      if (!speakers[s.speakerId]) return;
      speakers[s.speakerId].words += s.text.split(' ').length;
      speakers[s.speakerId].sentimentSum += s.sentiment.score;
      speakers[s.speakerId].sentimentCount++;
      if (s.nlpTags.includes('RISK_MENTION')) speakers[s.speakerId].riskContributions++;
      if (s.isFlaggedReminder) speakers[s.speakerId].reminders++;
    });
  });
  return Object.values(speakers).map(sp => ({
    ...sp,
    avgSentiment: sp.sentimentCount > 0 ? (sp.sentimentSum / sp.sentimentCount).toFixed(2) : '0.00',
  }));
};

const buildReminderFlags = (transcripts) => {
  return transcripts.flatMap(t =>
    t.transcript
      .filter(s => s.isFlaggedReminder)
      .map(s => {
        const participant = t.participants.find(p => p.speakerId === s.speakerId);
        return {
          id: s.id,
          sessionId: t.sessionId,
          transcriptId: t._id,
          speakerName: participant?.name || 'Unknown',
          speakerRole: participant?.role || 'unknown',
          timestamp: s.timestamp,
          text: s.text,
          reminderText: s.reminderText,
          resolved: false,
        };
      })
  );
};

// ── Provider ──────────────────────────────────────────────────────────────────
export const DataProvider = ({ children }) => {
  const [transcripts, setTranscripts] = useState([]);
  const [sentimentStats, setSentimentStats] = useState({ total: 0, sentimentScore: 0, avgRisk: 0, activeReminders: 0 });
  const [financialKeywords, setFinancialKeywords] = useState([]);
  const [speakerMetrics, setSpeakerMetrics] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [reminderFlags, setReminderFlags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const processData = useCallback((data) => {
    setTranscripts(data);
    setSentimentStats(buildStats(data));
    setTrendData(buildTrendData(data));
    setFinancialKeywords(buildFinancialKeywords(data));
    setSpeakerMetrics(buildSpeakerMetrics(data));
    setReminderFlags(buildReminderFlags(data));
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/transcripts?limit=100');
      const data = res.transcripts || res.data?.transcripts || [];
      if (data.length > 0) {
        processData(data);
      } else {
        processData(DUMMY_TRANSCRIPTS);
      }
    } catch {
      processData(DUMMY_TRANSCRIPTS);
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
      speakerMetrics, trendData, reminderFlags,
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
