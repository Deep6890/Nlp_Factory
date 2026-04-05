import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const useApp = () => useContext(AppContext);

const INITIAL_SESSIONS = [
  { name: 'Home Loan Discussion',  date: 'Jan 31, 2026 · 2:30 PM',  lang: 'Hinglish', topic: 'Home Loan',  duration: '4m 23s', risk: 'HIGH' },
  { name: 'SIP Planning Call',     date: 'Jan 30, 2026 · 11:15 AM', lang: 'English',  topic: 'SIP',        duration: '2m 10s', risk: 'LOW'  },
  { name: 'Car EMI Conversation',  date: 'Jan 29, 2026 · 6:45 PM',  lang: 'Gujarati', topic: 'EMI',        duration: '3m 58s', risk: 'MED'  },
  { name: 'Investment Strategy',   date: 'Jan 27, 2026 · 9:00 AM',  lang: 'English',  topic: 'Investment', duration: '6m 12s', risk: 'LOW'  },
  { name: 'Budget Review',         date: 'Jan 25, 2026 · 3:20 PM',  lang: 'Hinglish', topic: 'Budget',     duration: '5m 44s', risk: 'MED'  },
];

const INITIAL_ALERTS = [
  { id: 1, category: 'EMI Risk',     title: 'EMI Exceeds 40% Salary Threshold',  level: 'HIGH', body: 'Your projected EMI of ₹48,000 is 53% of your ₹90,000 salary. This exceeds the safe limit of 40%.', from: 'Home Loan Discussion', date: 'Jan 31', time: '2:34 PM', impact: 85 },
  { id: 2, category: 'EMI Risk',     title: 'Car EMI Added on Top of Home Loan', level: 'MED',  body: 'A car loan is being reconsidered while home loan EMI is already at risk. Combined EMI would reach 65%+.', from: 'Car EMI Conversation', date: 'Jan 29', time: '11:15 AM', impact: 62 },
  { id: 3, category: 'Emotion Risk', title: 'Emotion-Driven Decision Detected',  level: 'MED',  body: 'High stress (60%) and uncertainty (75%) detected during Home Loan discussion.', from: 'Home Loan Discussion', date: 'Jan 31', time: '2:50 PM', impact: 55 },
  { id: 4, category: 'Savings Risk', title: 'SIP May Be Discontinued',           level: 'LOW',  body: 'Conversation indicates SIP might be stopped if home loan is approved.', from: 'Home Loan Discussion', date: 'Jan 31', time: '3:02 PM', impact: 35 },
  { id: 5, category: 'EMI Risk',     title: 'Debt-to-Income Ratio Critical',     level: 'HIGH', body: 'Total monthly debt obligations are reaching 70% of net income.', from: 'Financial Overview', date: 'Feb 2', time: '10:22 AM', impact: 90 },
  { id: 6, category: 'Emotion Risk', title: 'Impulsive Spending Pattern',        level: 'LOW',  body: 'Multiple discretionary purchases flagged during high-stress conversations.', from: 'Shopping Discussion', date: 'Feb 1', time: '6:45 PM', impact: 28 },
];

const INITIAL_REMINDERS = [
  { id: 1, title: 'Pay Home Loan EMI',                status: 'Pending', dueDate: '2026-04-10', session: 'Home Loan Discussion', badgeClass: 'Due Soon', badgeColor: 'text-amber-600', badgeBg: 'bg-amber-50',  completed: false },
  { id: 2, title: 'Call CA about tax saving options', status: 'Pending', dueDate: '2026-04-01', session: 'Investment Strategy',  badgeClass: 'Pending', badgeColor: 'text-slate-600', badgeBg: 'bg-slate-100', completed: false },
  { id: 3, title: 'Review SIP portfolio performance', status: 'Pending', dueDate: '2026-04-15', session: 'SIP Planning Call',    badgeClass: 'Upcoming', badgeColor: 'text-slate-600', badgeBg: 'bg-slate-100', completed: false },
  { id: 4, title: 'Check car loan interest rates',    status: 'Done',    dueDate: '2026-03-20', customDesc: 'Completed manually', badgeClass: 'Done',   badgeColor: 'text-teal-600',  badgeBg: 'bg-teal-50',   completed: true  },
];

const INITIAL_PROFILE = {
  name: 'Armor User',
  email: 'alex@armor.ai',
  country: '',
  state: '',
  city: '',
  monthlySalary: '',
  hasEmi: 'no',
  emiAmount: '',
  totalPropertiesValue: '',
  mobileNumber: '',
};

export const AppProvider = ({ children }) => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [reminders, setReminders] = useState(INITIAL_REMINDERS);

  const pendingReminders = reminders.filter(r => !r.completed).length;
  const highAlerts = alerts.filter(a => a.level === 'HIGH').length;

  const addReminder = (reminder) => setReminders(prev => [reminder, ...prev]);

  const toggleReminder = (id) =>
    setReminders(prev => prev.map(r => {
      if (r.id !== id) return r;
      const done = !r.completed;
      return {
        ...r,
        completed: done,
        status: done ? 'Done' : 'Pending',
        badgeClass: done ? 'Done' : 'Pending',
        badgeColor: done ? 'text-teal-600' : 'text-slate-600',
        badgeBg: done ? 'bg-teal-50' : 'bg-slate-100',
        customDesc: done ? 'Manually completed' : null,
      };
    }));

  return (
    <AppContext.Provider value={{
      profile, setProfile,
      sessions, setSessions,
      alerts, setAlerts,
      reminders, setReminders,
      pendingReminders,
      highAlerts,
      addReminder,
      toggleReminder,
    }}>
      {children}
    </AppContext.Provider>
  );
};
