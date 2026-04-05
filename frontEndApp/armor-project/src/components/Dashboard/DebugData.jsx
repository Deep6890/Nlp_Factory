import React, { useEffect, useState } from 'react';
import { listTranscripts } from '../../api/transcripts';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';

const DebugData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listTranscripts({ limit: 50 });
      // The API returns { data: { transcripts: [...] } } or similar based on ApiResponse pattern
      setData(res.data?.transcripts || res.transcripts || res.data || res);
    } catch (err) {
      setError(err.message || 'Failed to fetch transcripts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>RAW Database JSON (Transcripts)</h2>
        <button 
          onClick={fetchData} 
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#DDEB9D', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Database
        </button>
      </div>

      {error && <div style={{ padding: 16, background: '#fee2e2', color: '#ef4444', borderRadius: 8, marginBottom: 16 }}>{error}</div>}
      
      {loading ? (
        <p>Loading payload from backend...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.isArray(data) && data.length > 0 ? (
            data.map((item, idx) => (
              <div key={idx} style={{ 
                background: '#fff', 
                border: `2px solid ${item.status === 'done' ? '#a0c878' : '#fbbf24'}`, 
                borderRadius: 12, 
                padding: 20,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.status === 'done' ? <CheckCircle color="#a0c878" /> : <Clock color="#fbbf24" />}
                    <strong style={{ textTransform: 'uppercase', color: item.status === 'done' ? '#648c3c' : '#b45309' }}>
                      Status: {item.status}
                    </strong>
                  </div>
                  <span style={{ fontSize: 12, color: '#888' }}>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                
                <h4 style={{ margin: '0 0 12px 0', color: '#333' }}>Raw JSON Payload:</h4>
                <pre style={{ 
                  background: '#1a1a1a', 
                  color: '#a0c878', 
                  padding: 16, 
                  borderRadius: 8, 
                  overflowX: 'auto',
                  fontSize: 13,
                  margin: 0
                }}>
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            ))
          ) : (
            <div style={{ padding: 40, background: '#fff', borderRadius: 12, textAlign: 'center', color: '#666' }}>
              No transcript records found in the database yet. Record a new session to see data here!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugData;
