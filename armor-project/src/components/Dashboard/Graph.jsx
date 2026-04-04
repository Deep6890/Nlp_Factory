import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Link2, AlertTriangle, FileText, Banknote, Home, LineChart, Receipt, Car, BarChart } from 'lucide-react';

const Graph = () => {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.2, 2.0));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));
  const handleReset = () => setZoom(1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#111', letterSpacing: '-1px' }}>Knowledge Graph</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Visual map of how your financial decisions connect</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleZoomIn} style={{ background: 'var(--primary)', border: 'none', color: '#111', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
             <ZoomIn size={16} /> Zoom In
          </button>
          <button onClick={handleZoomOut} style={{ background: '#ffffff', border: '1px solid var(--border-color)', color: '#111', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
             <ZoomOut size={16} /> Zoom Out
          </button>
          <button onClick={handleReset} style={{ background: '#ffffff', border: '1px solid var(--border-color)', color: '#111', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
             <RotateCcw size={16} /> Reset
          </button>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', color: '#111', fontWeight: '500' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div> High Risk</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div> Active</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }}></div> Considering</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(600px, 1fr) 400px', gap: '24px' }}>
        
        {/* Graph Area */}
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', height: '500px', position: 'relative', overflow: 'hidden' }}>
           
           <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.3s ease' }}>
             {/* Center Node */}
             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '80px', height: '80px', borderRadius: '50%', background: '#f3f4f6', border: '2px solid #374151', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
               <Banknote size={20} color="#374151" />
               <span style={{ fontSize: '11px', fontWeight: '700', color: '#374151', marginTop: '4px' }}>Salary</span>
             </div>

             {/* Lines (Simulated with absolute positioned divs) */}
             <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
               {/* Home Loan */}
               <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#e5e5e5" strokeWidth="2" strokeDasharray="4 4" />
               {/* SIP */}
               <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="#e5e5e5" strokeWidth="2" strokeDasharray="4 4" />
               {/* EMI */}
               <line x1="50%" y1="50%" x2="20%" y2="70%" stroke="#e5e5e5" strokeWidth="2" />
               {/* Car Loan */}
               <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="#e5e5e5" strokeWidth="2" strokeDasharray="4 4" />
               {/* Budget */}
               <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="#e5e5e5" strokeWidth="2" />
             </svg>

             {/* Nodes */}
             {/* Home Loan (Top Left) */}
             <div style={{ position: 'absolute', top: '25%', left: '25%', transform: 'translate(-50%, -50%)', width: '70px', height: '70px', borderRadius: '50%', background: '#fef2f2', border: '2px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2)' }}>
               <Home size={16} color="#ef4444" />
               <span style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', marginTop: '2px', textAlign: 'center', lineHeight: 1.1 }}>Home<br/>Loan</span>
             </div>

             {/* SIP (Top Right) */}
             <div style={{ position: 'absolute', top: '25%', left: '75%', transform: 'translate(-50%, -50%)', width: '70px', height: '70px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <LineChart size={16} color="#10b981" />
               <span style={{ fontSize: '10px', fontWeight: '700', color: '#10b981', marginTop: '4px' }}>SIP</span>
             </div>

             {/* EMI (Bottom Left) */}
             <div style={{ position: 'absolute', top: '70%', left: '20%', transform: 'translate(-50%, -50%)', width: '60px', height: '60px', borderRadius: '50%', background: '#fef9c3', border: '2px solid #ca8a04', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <Receipt size={16} color="#ca8a04" />
               <span style={{ fontSize: '10px', fontWeight: '700', color: '#ca8a04', marginTop: '4px' }}>EMI</span>
             </div>

             {/* Car Loan (Bottom Right) */}
             <div style={{ position: 'absolute', top: '70%', left: '80%', transform: 'translate(-50%, -50%)', width: '60px', height: '60px', borderRadius: '50%', background: '#fef9c3', border: '2px solid #ca8a04', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <Car size={16} color="#ca8a04" />
               <span style={{ fontSize: '10px', fontWeight: '700', color: '#ca8a04', marginTop: '2px', textAlign: 'center', lineHeight: 1.1 }}>Car<br/>Loan</span>
             </div>

             {/* Budget (Bottom Center) */}
             <div style={{ position: 'absolute', top: '85%', left: '50%', transform: 'translate(-50%, -50%)', width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', border: '2px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
               <BarChart size={16} color="#ef4444" />
               <span style={{ fontSize: '10px', fontWeight: '700', color: '#ef4444', marginTop: '4px' }}>Budget</span>
             </div>
           </div>
        </div>

        {/* Info Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Selected Node Details */}
          <div style={{ background: '#ffffff', border: '1px solid #111', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>Selected: Home Loan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                 <Link2 size={16} color="#888" style={{ marginTop: '2px' }} />
                 <div>
                   <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Connected to: </span>
                   <span style={{ color: '#111', fontSize: '13px', fontWeight: '500' }}>Salary, EMI, Budget</span>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <FileText size={16} color="#888" />
                 <div>
                   <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Sessions: </span>
                   <span style={{ color: '#111', fontSize: '13px', fontWeight: '500' }}>3 conversations</span>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <AlertTriangle size={16} color="#ca8a04" />
                 <div>
                   <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Impact: </span>
                   <span style={{ color: '#111', fontSize: '13px', fontWeight: '500' }}>Reduces SIP capacity by 60%</span>
                 </div>
               </div>
               <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                 <Link2 size={16} color="#ef4444" style={{ marginTop: '2px' }} />
                 <div>
                   <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Risk: </span>
                   <span style={{ color: '#111', fontSize: '13px', fontWeight: '500' }}>EMI exceeds 40% salary threshold</span>
                 </div>
               </div>
            </div>
          </div>

          {/* Legend Details */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', flex: 1 }}>
             <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>Graph Legend</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#111', fontWeight: '500' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></div> High risk nodes
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }}></div> Active decisions
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308' }}></div> Under consideration
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                 <div style={{ width: '20px', height: '2px', background: 'transparent', borderBottom: '2px dashed #ccc' }}></div> Dashed = weak connection
               </div>
             </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Graph;
