import React, { useState, useEffect } from 'react';
import { Circle, CheckCircle2, Navigation, Plus, X } from 'lucide-react';

const Reminders = () => {
  const [activeTab, setActiveTab] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const [remindersData, setRemindersData] = useState([]);

  // Effect to automatically mark passed dates as done
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]; // simple YYYY-MM-DD
    
    setRemindersData(prev => prev.map(rem => {
      if (!rem.completed && rem.dueDate && rem.dueDate < todayStr) {
        return {
          ...rem,
          completed: true,
          status: 'Done',
          badgeClass: 'Auto-Done',
          badgeColor: 'text-teal-600',
          badgeBg: 'bg-teal-50',
          customDesc: 'Marked done (Date passed)'
        };
      }
      return rem;
    }));
  }, []);

  const handleAddReminder = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    const newReminder = {
      id: Date.now(),
      title: newTitle,
      status: 'Pending',
      dueDate: newDate,
      session: 'User Added',
      badgeClass: 'New',
      badgeColor: 'text-slate-900',
      badgeBg: 'bg-[#c7f284]',
      completed: false
    };

    setRemindersData([newReminder, ...remindersData]);
    setNewTitle('');
    setNewDate('');
    setShowAddForm(false);
  };

  const toggleStatus = (id) => {
    setRemindersData(prev => prev.map(rem => {
      if (rem.id === id) {
        const isCompleted = !rem.completed;
        return {
          ...rem,
          completed: isCompleted,
          status: isCompleted ? 'Done' : 'Pending',
          badgeClass: isCompleted ? 'Done' : 'Pending',
          badgeColor: isCompleted ? 'text-teal-600' : 'text-slate-600',
          badgeBg: isCompleted ? 'bg-teal-50' : 'bg-slate-100',
          customDesc: isCompleted ? 'Manually completed' : null
        };
      }
      return rem;
    }));
  };

  const filteredReminders = remindersData.filter(d => {
    if (activeTab === 'All') return true;
    return d.status === activeTab;
  });

  const getBtnStyle = (tab) => {
    const isActive = activeTab === tab;
    return `px-5 py-2 rounded-xl text-sm transition-all duration-300 ${
      isActive 
        ? 'bg-[#DDEB9D] text-[#1a2010] font-bold border border-[#A0C878]' 
        : 'bg-white text-[#4a5a30] hover:bg-[#FAF6E9] border border-[rgba(160,200,120,0.28)] font-semibold'
    }`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animation-fade-in text-slate-800">
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">Reminders</h1>
          <p className="text-base text-slate-500">Auto-extracted vs Manually added action items</p>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('All')} className={getBtnStyle('All')}>All ({remindersData.length})</button>
          <button onClick={() => setActiveTab('Pending')} className={getBtnStyle('Pending')}>Pending ({remindersData.filter(r => !r.completed).length})</button>
          <button onClick={() => setActiveTab('Done')} className={getBtnStyle('Done')}>Done ({remindersData.filter(r => r.completed).length})</button>
        </div>
        {!showAddForm && (
           <button 
             onClick={() => setShowAddForm(true)} 
             className="bg-[#DDEB9D] hover:bg-[#A0C878] text-[#1a2010] border border-[#A0C878] px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
           >
             <Plus size={16} /> Add Reminder
           </button>
        )}
      </div>

      {/* Add form - Bento Box */}
      {showAddForm && (
        <form onSubmit={handleAddReminder} className="bg-[#1a2010] rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#c7f284] rounded-full blur-[80px] opacity-20 pointer-events-none" />
          
          <button type="button" onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
             <X size={20} />
          </button>

          <div className="w-full md:flex-1 z-10">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reminder Title</label>
            <input 
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              type="text" 
              placeholder="e.g. Call Bank Manager" 
              className="w-full bg-white/10 border border-white/20 text-white placeholder:text-[#8a9a70] font-bold rounded-xl px-4 py-3 outline-none focus:border-[#DDEB9D] transition-all"
            />
          </div>
          <div className="w-full md:w-48 z-10">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Due Date</label>
            <input 
              required
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              type="date" 
              className="w-full bg-white/10 border border-white/20 text-white font-bold rounded-xl px-4 py-3 outline-none focus:border-[#DDEB9D] transition-all [color-scheme:dark]"
            />
          </div>
          <button type="submit" className="w-full md:w-auto bg-[#DDEB9D] hover:bg-[#A0C878] text-[#1a2010] font-bold px-8 py-3 rounded-xl transition-all z-10">
            Save
          </button>
        </form>
      )}

      {/* Reminders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReminders.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 font-semibold bg-white rounded-3xl border border-slate-200 border-dashed">
            No reminders found.
          </div>
        )}
        
        {filteredReminders.map(item => (
          <div className={`bg-white rounded-2xl border ${item.completed ? 'border-[rgba(160,200,120,0.12)] opacity-60 hover:opacity-100' : 'border-[rgba(160,200,120,0.22)] hover:border-[#A0C878] hover:shadow-md'} p-5 flex justify-between items-start transition-all duration-300 group`}>
            <div className="flex gap-4 items-start">
              <div onClick={() => toggleStatus(item.id)} className="mt-0.5 shrink-0 bg-transparent rounded-full hover:scale-110 transition-transform">
                 {item.completed ? (
                   <CheckCircle2 size={24} className="fill-[#1a2010] cursor-pointer" style={{ color:'#DDEB9D' }} />
                 ) : (
                   <Circle size={24} className="cursor-pointer" style={{ color:'rgba(160,200,120,0.4)' }} />
                 )}
              </div>
              
              <div>
                <h3 className={`text-base font-bold mb-1 transition-colors ${item.completed ? 'line-through' : ''}`} style={{ color: item.completed ? '#8a9a70' : '#1a2010' }}>
                  {item.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  {item.customDesc ? item.customDesc : (
                    <>
                      <Navigation size={12} className="text-slate-400" /> Due: <span className={item.completed ? '' : 'text-slate-700'}>{new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> · From: {item.session}
                    </>
                  )}
                </p>
              </div>
            </div>
            <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider ${item.badgeColor} ${item.badgeBg} px-3 py-1 rounded-md`}>
              {item.badgeClass}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Reminders;
