import React, { useState } from 'react';
import { DataProvider } from '../../context/DataContext';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';
import TranscriptsList from '../Analytics/TranscriptsList';
import TranscriptDetail from '../Analytics/TranscriptDetail';
import AnalyticsDeepDive from '../Analytics/AnalyticsDeepDive';

const C = {
  cream2: '#FAF6E9', limelt: '#DDEB9D', green: '#A0C878', greendk: '#7aaa52',
  text: '#1a2010', textmid: '#4a5a30', textdim: '#8a9a70',
};

const TABS = [
  { id: 'dashboard',   label: '📊 Dashboard' },
  { id: 'transcripts', label: '📝 Transcripts' },
  { id: 'deep-dive',   label: '🔬 Deep Dive' },
];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = (id) => {
    setSelectedId(id);
    setActiveTab('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setActiveTab('transcripts');
  };

  const tabStyle = (id) => ({
    padding: '8px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: activeTab === id ? C.limelt : '#fff',
    color: activeTab === id ? C.text : C.textdim,
    border: `1px solid ${activeTab === id ? C.green : 'rgba(160,200,120,0.25)'}`,
    transition: 'all 0.2s',
  });

  return (
    <DataProvider>
      <div style={{ fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', gap: 20, color: C.text }}>

        {/* Sub-nav tabs */}
        {activeTab !== 'detail' && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid rgba(160,200,120,0.18)', paddingBottom: 16 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={tabStyle(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {activeTab === 'dashboard'   && <AnalyticsDashboard onNavigate={setActiveTab} />}
        {activeTab === 'transcripts' && <TranscriptsList onSelect={handleSelect} />}
        {activeTab === 'detail'      && <TranscriptDetail transcriptId={selectedId} onBack={handleBack} />}
        {activeTab === 'deep-dive'   && <AnalyticsDeepDive />}
      </div>
    </DataProvider>
  );
};

export default Analytics;
