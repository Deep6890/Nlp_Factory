import React, { useState, useEffect } from 'react';
import { Circle, CheckCircle2, Plus, X, Bell, Clock, Calendar, Trash2 } from 'lucide-react';

const cs = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, boxShadow:'var(--shadow-sm)' };
const ib = { background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', fontSize:13, fontFamily:'inherit', color:'var(--text-primary)', outline:'none', width:'100%', boxSizing:'border-box', transition:'border-color 0.2s' };

const Reminders = () => {
  const [activeTab, setActiveTab]   = useState('All');
  const [showForm, setShowForm]     = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [newDate, setNewDate]       = useState('');
  const [newNote, setNewNote]       = useState('');
  const [reminders, setReminders]   = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setReminders(prev => prev.map(r => {
      if (!r.completed && r.dueDate && r.dueDate < today) {
        return { ...r, completed: true, status: 'Done', autoNote: 'Auto-completed (date passed)' };
      }
      return r;
    }));
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    setReminders(prev => [{
      id: Date.now(), title: newTitle.trim(), dueDate: newDate,
      note: newNote.trim(), completed: false, status: 'Pending', source: 'Manual',
    }, ...prev]);
    setNewTitle(''); setNewDate(''); setNewNote(''); setShowForm(false);
  };

  const toggle = (id) => setReminders(prev => prev.map(r =>
    r.id === id ? { ...r, completed: !r.completed, status: !r.completed ? 'Done' : 'Pending', autoNote: undefined } : r
  ));

  const remove = (id) => setReminders(prev => prev.filter(r => r.id !== id));

  const filtered = reminders.filter(r => activeTab === 'All' || r.status === activeTab);
  const pending  = reminders.filter(r => !r.completed).length;
  const done     = reminders.filter(r => r.completed).length;

  const tabBtn = (tab, label, count) => (
    <button onClick={() => setActiveTab(tab)}
      style={{ padding:'7px 16px', borderRadius:10, fontSize:12, fontWeight:700, cursor:'pointer', border:'1px solid', transition:'all 0.15s',
        background: activeTab===tab ? 'var(--green-bg)' : 'var(--bg-subtle)',
        color:      activeTab===tab ? 'var(--green)'    : 'var(--text-muted)',
        borderColor:activeTab===tab ? 'var(--green-border)' : 'var(--border)',
      }}>
      {label} {count != null && <span style={{ fontSize:10, marginLeft:4, opacity:0.7 }}>({count})</span>}
    </button>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, color:'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, letterSpacing:-0.8, margin:0 }}>Reminders</h1>
          <p style={{ fontSize:13, color:'var(--text-muted)', margin:'4px 0 0' }}>Action items and follow-ups from your conversations</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--text-inverse)', background:'var(--green)', border:'none', borderRadius:10, padding:'9px 16px', cursor:'pointer' }}>
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Add Reminder'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { icon:Bell,         label:'Total',   value:reminders.length, color:'var(--text-primary)' },
          { icon:Clock,        label:'Pending', value:pending,          color:'var(--accent-amber)' },
          { icon:CheckCircle2, label:'Done',    value:done,             color:'var(--accent-green)' },
        ].map((s,i) => (
          <div key={i} style={{ ...cs, padding:'16px 18px', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:`${s.color}18`, border:`1px solid ${s.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div style={{ fontSize:24, fontWeight:900, color:s.color, letterSpacing:-1 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ ...cs, padding:'22px 24px', background:'var(--bg-card)' }}>
          <div style={{ fontSize:14, fontWeight:800, marginBottom:16, color:'var(--text-primary)' }}>New Reminder</div>
          <form onSubmit={handleAdd} style={{ display:'grid', gridTemplateColumns:'1fr 180px', gap:12 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', display:'block', marginBottom:6 }}>Title *</label>
              <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Call bank manager" style={ib} />
            </div>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', display:'block', marginBottom:6 }}>Due Date *</label>
              <input required type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={ib} />
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.4px', display:'block', marginBottom:6 }}>Note (optional)</label>
              <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Additional context…" style={ib} />
            </div>
            <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 16px', cursor:'pointer' }}>
                Cancel
              </button>
              <button type="submit"
                style={{ fontSize:12, fontWeight:700, color:'var(--text-inverse)', background:'var(--green)', border:'none', borderRadius:10, padding:'8px 20px', cursor:'pointer' }}>
                Save Reminder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:8 }}>
        {tabBtn('All', 'All', reminders.length)}
        {tabBtn('Pending', 'Pending', pending)}
        {tabBtn('Done', 'Done', done)}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ ...cs, padding:'48px 20px', textAlign:'center' }}>
          <Bell size={32} color="var(--green)" style={{ marginBottom:12 }} />
          <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>No reminders</div>
          <div style={{ fontSize:13, color:'var(--text-muted)' }}>Add a reminder or process audio to auto-extract action items</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ ...cs, padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14, opacity: r.completed ? 0.65 : 1, transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--border-hover)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              <button onClick={() => toggle(r.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, marginTop:1, flexShrink:0 }}>
                {r.completed
                  ? <CheckCircle2 size={22} color="var(--accent-green)" />
                  : <Circle size={22} color="var(--border-strong)" />}
              </button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', textDecoration: r.completed ? 'line-through' : 'none', marginBottom:4 }}>
                  {r.title}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                    <Calendar size={10} />
                    Due: {new Date(r.dueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                  {r.source && <span style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:6, padding:'1px 7px', fontWeight:600 }}>{r.source}</span>}
                  {r.autoNote && <span style={{ color:'var(--accent-green)', fontWeight:600 }}>{r.autoNote}</span>}
                </div>
                {r.note && <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:6, lineHeight:1.5 }}>{r.note}</div>}
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <span style={{ fontSize:10, fontWeight:800, background: r.completed ? 'rgba(5,150,105,0.1)' : 'rgba(217,119,6,0.1)', color: r.completed ? 'var(--accent-green)' : 'var(--accent-amber)', border:`1px solid ${r.completed ? 'rgba(5,150,105,0.25)' : 'rgba(217,119,6,0.25)'}`, borderRadius:7, padding:'3px 9px', alignSelf:'flex-start' }}>
                  {r.status}
                </span>
                <button onClick={() => remove(r.id)} title="Delete"
                  style={{ width:26, height:26, borderRadius:7, border:'1px solid rgba(220,38,38,0.2)', background:'rgba(220,38,38,0.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-red)' }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;


